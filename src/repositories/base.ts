import { z } from 'zod';

import type {
  ListRepositorySnapshot,
  RepositoryListener,
  ValueRepositorySnapshot,
} from './contracts';
import { RepositoryHydrationError, RepositoryStorageError } from './errors';
import type { RepositoryStorage } from './storage';

type ListNormalizer<T> = (items: readonly T[]) => readonly T[];

type ListRepositoryOptions<T> = {
  storage: RepositoryStorage;
  storageKey: string;
  itemSchema: z.ZodType<T>;
  normalize?: ListNormalizer<T>;
};

type ValueRepositoryOptions<T> = {
  storage: RepositoryStorage;
  storageKey: string;
  schema: z.ZodType<T>;
  defaultValue: T;
};

const freezeObject = <T>(value: T): Readonly<T> => {
  if (typeof value === 'object' && value !== null) {
    return Object.freeze({ ...value });
  }

  return value;
};

const freezeItems = <T>(items: readonly T[]): readonly T[] =>
  Object.freeze(items.map(item => freezeObject(item) as T));

const asStoredArray = (parsed: unknown): unknown[] | null => {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  // Accept an early envelope format so persisted development data is not lost.
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'items' in parsed &&
    Array.isArray(parsed.items)
  ) {
    return parsed.items;
  }

  return null;
};

/**
 * Observable, serialized persistence primitive used by the concrete list
 * repositories. Reads tolerate corrupt entries and retain every valid item.
 */
export abstract class PersistentListRepository<T> {
  private readonly listeners = new Set<RepositoryListener>();
  private readonly storage: RepositoryStorage;
  private readonly storageKey: string;
  private readonly itemSchema: z.ZodType<T>;
  private readonly normalize: ListNormalizer<T>;
  private operationChain: Promise<void> = Promise.resolve();
  private hydrationPromise: Promise<ListRepositorySnapshot<T>> | null = null;
  private snapshot: ListRepositorySnapshot<T> = Object.freeze({
    items: Object.freeze([]) as readonly T[],
    isHydrated: false,
    error: null,
  });

  protected constructor(options: ListRepositoryOptions<T>) {
    this.storage = options.storage;
    this.storageKey = options.storageKey;
    this.itemSchema = options.itemSchema;
    this.normalize = options.normalize ?? (items => items);
  }

  readonly getSnapshot = (): ListRepositorySnapshot<T> => this.snapshot;

  readonly getAll = (): readonly T[] => this.snapshot.items;

  readonly subscribe = (listener: RepositoryListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly hydrate = (): Promise<ListRepositorySnapshot<T>> => {
    if (this.snapshot.isHydrated) {
      return Promise.resolve(this.snapshot);
    }

    if (this.hydrationPromise === null) {
      this.hydrationPromise = this.enqueue(() =>
        this.readFromStorage(),
      ).finally(() => {
        this.hydrationPromise = null;
      });
    }

    return this.hydrationPromise;
  };

  readonly refresh = (): Promise<ListRepositorySnapshot<T>> =>
    this.enqueue(() => this.readFromStorage());

  readonly replace = (items: readonly T[]): Promise<readonly T[]> =>
    this.commit(() => items);

  readonly clear = (): Promise<readonly T[]> => this.commit(() => []);

  protected readonly commit = async (
    update: (items: readonly T[]) => readonly T[],
  ): Promise<readonly T[]> => {
    await this.hydrate();

    return this.enqueue(async () => {
      const candidate = update(this.snapshot.items);
      if (candidate === this.snapshot.items) {
        return this.snapshot.items;
      }

      const parsed = z.array(this.itemSchema).parse([...candidate]);
      const normalized = this.normalize(parsed);
      const validated = z.array(this.itemSchema).parse([...normalized]);

      try {
        await this.storage.setItem(this.storageKey, JSON.stringify(validated));
      } catch (error: unknown) {
        const storageError = new RepositoryStorageError(
          this.storageKey,
          'write',
          error,
        );
        this.publish(this.snapshot.items, true, storageError);
        throw storageError;
      }

      this.publish(validated, true, null);
      return this.snapshot.items;
    });
  };

  private enqueue<TResult>(
    operation: () => Promise<TResult>,
  ): Promise<TResult> {
    const result = this.operationChain.then(operation, operation);
    this.operationChain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async readFromStorage(): Promise<ListRepositorySnapshot<T>> {
    let raw: string | null;
    try {
      raw = await this.storage.getItem(this.storageKey);
    } catch (error: unknown) {
      this.publish(
        this.snapshot.items,
        true,
        new RepositoryStorageError(this.storageKey, 'read', error),
      );
      return this.snapshot;
    }

    if (raw === null) {
      this.publish([], true, null);
      return this.snapshot;
    }

    let storedItems: unknown[] | null = null;
    try {
      storedItems = asStoredArray(JSON.parse(raw) as unknown);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Stored JSON is malformed';
      this.publish(
        [],
        true,
        new RepositoryHydrationError(this.storageKey, message),
      );
      return this.snapshot;
    }

    if (storedItems === null) {
      this.publish(
        [],
        true,
        new RepositoryHydrationError(this.storageKey, 'Expected an array'),
      );
      return this.snapshot;
    }

    const validItems: T[] = [];
    let invalidItemCount = 0;
    for (const storedItem of storedItems) {
      const result = this.itemSchema.safeParse(storedItem);
      if (result.success) {
        validItems.push(result.data);
      } else {
        invalidItemCount += 1;
      }
    }

    const normalized = this.normalize(validItems);
    const hydrationError =
      invalidItemCount > 0
        ? new RepositoryHydrationError(
            this.storageKey,
            `${invalidItemCount} invalid item(s) were ignored`,
          )
        : null;
    this.publish(normalized, true, hydrationError);
    return this.snapshot;
  }

  private publish(
    items: readonly T[],
    isHydrated: boolean,
    error: Error | null,
  ): void {
    this.snapshot = Object.freeze({
      items: freezeItems(items),
      isHydrated,
      error,
    });
    this.listeners.forEach(listener => listener());
  }
}

/** Observable persistence primitive for a single object such as preferences. */
export abstract class PersistentValueRepository<T> {
  private readonly listeners = new Set<RepositoryListener>();
  private readonly storage: RepositoryStorage;
  private readonly storageKey: string;
  private readonly schema: z.ZodType<T>;
  private readonly defaultValue: T;
  private operationChain: Promise<void> = Promise.resolve();
  private hydrationPromise: Promise<ValueRepositorySnapshot<T>> | null = null;
  private snapshot: ValueRepositorySnapshot<T>;

  protected constructor(options: ValueRepositoryOptions<T>) {
    this.storage = options.storage;
    this.storageKey = options.storageKey;
    this.schema = options.schema;
    this.defaultValue = this.schema.parse(options.defaultValue);
    this.snapshot = Object.freeze({
      value: freezeObject(this.defaultValue),
      isHydrated: false,
      error: null,
    });
  }

  readonly getSnapshot = (): ValueRepositorySnapshot<T> => this.snapshot;

  readonly get = (): Readonly<T> => this.snapshot.value;

  readonly subscribe = (listener: RepositoryListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly hydrate = (): Promise<ValueRepositorySnapshot<T>> => {
    if (this.snapshot.isHydrated) {
      return Promise.resolve(this.snapshot);
    }

    if (this.hydrationPromise === null) {
      this.hydrationPromise = this.enqueue(() =>
        this.readFromStorage(),
      ).finally(() => {
        this.hydrationPromise = null;
      });
    }
    return this.hydrationPromise;
  };

  readonly refresh = (): Promise<ValueRepositorySnapshot<T>> =>
    this.enqueue(() => this.readFromStorage());

  readonly replace = (value: T): Promise<Readonly<T>> =>
    this.commit(() => value);

  protected readonly commit = async (
    update: (value: Readonly<T>) => T,
  ): Promise<Readonly<T>> => {
    await this.hydrate();

    return this.enqueue(async () => {
      const validated = this.schema.parse(update(this.snapshot.value));
      try {
        await this.storage.setItem(this.storageKey, JSON.stringify(validated));
      } catch (error: unknown) {
        const storageError = new RepositoryStorageError(
          this.storageKey,
          'write',
          error,
        );
        this.publish(this.snapshot.value as T, true, storageError);
        throw storageError;
      }

      this.publish(validated, true, null);
      return this.snapshot.value;
    });
  };

  protected readonly resetToDefault = (): Promise<Readonly<T>> =>
    this.commit(() => this.defaultValue);

  private enqueue<TResult>(
    operation: () => Promise<TResult>,
  ): Promise<TResult> {
    const result = this.operationChain.then(operation, operation);
    this.operationChain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async readFromStorage(): Promise<ValueRepositorySnapshot<T>> {
    let raw: string | null;
    try {
      raw = await this.storage.getItem(this.storageKey);
    } catch (error: unknown) {
      this.publish(
        this.snapshot.value as T,
        true,
        new RepositoryStorageError(this.storageKey, 'read', error),
      );
      return this.snapshot;
    }

    if (raw === null) {
      this.publish(this.defaultValue, true, null);
      return this.snapshot;
    }

    try {
      const parsedJson = JSON.parse(raw) as unknown;
      const parsed = this.schema.safeParse(parsedJson);
      if (!parsed.success) {
        this.publish(
          this.defaultValue,
          true,
          new RepositoryHydrationError(
            this.storageKey,
            'Stored preferences did not match the expected shape',
          ),
        );
      } else {
        this.publish(parsed.data, true, null);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Stored JSON is malformed';
      this.publish(
        this.defaultValue,
        true,
        new RepositoryHydrationError(this.storageKey, message),
      );
    }

    return this.snapshot;
  }

  private publish(value: T, isHydrated: boolean, error: Error | null): void {
    this.snapshot = Object.freeze({
      value: freezeObject(value),
      isHydrated,
      error,
    });
    this.listeners.forEach(listener => listener());
  }
}

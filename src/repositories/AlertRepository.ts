import type { PriceAlert } from '../types';
import { PersistentListRepository } from './base';
import { createRepositoryId } from './id';
import { priceAlertSchema } from './schemas';
import {
  REPOSITORY_STORAGE_KEYS,
  repositoryStorage,
  type RepositoryStorage,
} from './storage';

export type PriceAlertUpdate = Partial<Omit<PriceAlert, 'id' | 'createdAt'>>;
export type PriceAlertInput = Omit<
  PriceAlert,
  'id' | 'createdAt' | 'triggeredAt'
> & {
  id?: string;
  createdAt?: string;
};

const dedupeAlerts = (items: readonly PriceAlert[]): readonly PriceAlert[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};

export class AlertRepository extends PersistentListRepository<PriceAlert> {
  constructor(
    storage: RepositoryStorage = repositoryStorage,
    storageKey: string = REPOSITORY_STORAGE_KEYS.alerts,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => createRepositoryId('alert'),
  ) {
    super({
      storage,
      storageKey,
      itemSchema: priceAlertSchema,
      normalize: dedupeAlerts,
    });
  }

  readonly getById = (id: string): PriceAlert | undefined =>
    this.getAll().find(alert => alert.id === id);

  readonly add = (input: PriceAlertInput): Promise<readonly PriceAlert[]> => {
    const alert: PriceAlert = {
      ...input,
      id: input.id ?? this.createId(),
      createdAt: input.createdAt ?? this.now().toISOString(),
    };
    return this.commit(items => {
      if (items.some(item => item.id === alert.id)) {
        return items.map(item => (item.id === alert.id ? alert : item));
      }
      return [...items, alert];
    });
  };

  readonly upsert = (alert: PriceAlert): Promise<readonly PriceAlert[]> =>
    this.commit(items => {
      if (items.some(item => item.id === alert.id)) {
        return items.map(item => (item.id === alert.id ? alert : item));
      }
      return [...items, alert];
    });

  readonly update = (
    id: string,
    patch: PriceAlertUpdate,
  ): Promise<readonly PriceAlert[]> =>
    this.commit(items => {
      if (!items.some(item => item.id === id)) {
        return items;
      }
      return items.map(item =>
        item.id === id
          ? { ...item, ...patch, id: item.id, createdAt: item.createdAt }
          : item,
      );
    });

  readonly remove = (id: string): Promise<readonly PriceAlert[]> =>
    this.commit(items => {
      const next = items.filter(item => item.id !== id);
      return next.length === items.length ? items : next;
    });

  readonly setEnabled = (
    id: string,
    enabled: boolean,
  ): Promise<readonly PriceAlert[]> => this.update(id, { enabled });

  readonly markTriggered = (
    id: string,
    triggeredAt: string = this.now().toISOString(),
  ): Promise<readonly PriceAlert[]> =>
    this.update(id, { triggeredAt, enabled: false });
}

export type RepositoryListener = () => void;

export interface ListRepositorySnapshot<T> {
  readonly items: readonly T[];
  readonly isHydrated: boolean;
  readonly error: Error | null;
}

export interface ValueRepositorySnapshot<T> {
  readonly value: Readonly<T>;
  readonly isHydrated: boolean;
  readonly error: Error | null;
}

export interface ObservableRepository<TSnapshot> {
  getSnapshot(): TSnapshot;
  subscribe(listener: RepositoryListener): () => void;
  hydrate(): Promise<TSnapshot>;
  refresh(): Promise<TSnapshot>;
}

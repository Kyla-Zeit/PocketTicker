import type { Holding } from '../types';
import { PersistentListRepository } from './base';
import { createRepositoryId } from './id';
import { holdingSchema } from './schemas';
import {
  REPOSITORY_STORAGE_KEYS,
  repositoryStorage,
  type RepositoryStorage,
} from './storage';

export type HoldingUpdate = Partial<Omit<Holding, 'id'>>;
export type HoldingInput = Omit<Holding, 'id'> & { id?: string };

const dedupeHoldings = (items: readonly Holding[]): readonly Holding[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};

export class PortfolioRepository extends PersistentListRepository<Holding> {
  constructor(
    storage: RepositoryStorage = repositoryStorage,
    storageKey: string = REPOSITORY_STORAGE_KEYS.holdings,
    private readonly createId: () => string = () =>
      createRepositoryId('holding'),
  ) {
    super({
      storage,
      storageKey,
      itemSchema: holdingSchema,
      normalize: dedupeHoldings,
    });
  }

  readonly getById = (id: string): Holding | undefined =>
    this.getAll().find(holding => holding.id === id);

  readonly add = (input: HoldingInput): Promise<readonly Holding[]> => {
    const holding: Holding = { ...input, id: input.id ?? this.createId() };
    return this.commit(items => {
      if (items.some(item => item.id === holding.id)) {
        return items.map(item => (item.id === holding.id ? holding : item));
      }
      return [...items, holding];
    });
  };

  readonly upsert = this.add;

  readonly update = (
    id: string,
    patch: HoldingUpdate,
  ): Promise<readonly Holding[]> =>
    this.commit(items => {
      if (!items.some(item => item.id === id)) {
        return items;
      }
      return items.map(item =>
        item.id === id ? { ...item, ...patch, id: item.id } : item,
      );
    });

  readonly remove = (id: string): Promise<readonly Holding[]> =>
    this.commit(items => {
      const next = items.filter(item => item.id !== id);
      return next.length === items.length ? items : next;
    });
}

export { PortfolioRepository as HoldingRepository };

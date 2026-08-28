import type { WatchlistItem } from '../types';
import { PersistentListRepository } from './base';
import { watchlistItemSchema } from './schemas';
import {
  REPOSITORY_STORAGE_KEYS,
  repositoryStorage,
  type RepositoryStorage,
} from './storage';

export type WatchlistInput =
  | WatchlistItem
  | { assetId: string; addedAt?: string }
  | string;

const dedupeWatchlist = (
  items: readonly WatchlistItem[],
): readonly WatchlistItem[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.assetId)) {
      return false;
    }
    seen.add(item.assetId);
    return true;
  });
};

export class WatchlistRepository extends PersistentListRepository<WatchlistItem> {
  constructor(
    storage: RepositoryStorage = repositoryStorage,
    storageKey: string = REPOSITORY_STORAGE_KEYS.watchlist,
    private readonly now: () => Date = () => new Date(),
  ) {
    super({
      storage,
      storageKey,
      itemSchema: watchlistItemSchema,
      normalize: dedupeWatchlist,
    });
  }

  readonly has = (assetId: string): boolean =>
    this.getAll().some(item => item.assetId === assetId);

  readonly add = (input: WatchlistInput): Promise<readonly WatchlistItem[]> => {
    const item = this.toItem(input);
    return this.commit(items =>
      items.some(current => current.assetId === item.assetId)
        ? items
        : [...items, item],
    );
  };

  readonly remove = (assetId: string): Promise<readonly WatchlistItem[]> =>
    this.commit(items => {
      const next = items.filter(item => item.assetId !== assetId);
      return next.length === items.length ? items : next;
    });

  readonly toggle = (
    input: WatchlistInput,
  ): Promise<readonly WatchlistItem[]> => {
    const item = this.toItem(input);
    return this.commit(items =>
      items.some(current => current.assetId === item.assetId)
        ? items.filter(current => current.assetId !== item.assetId)
        : [...items, item],
    );
  };

  readonly reorder = (
    orderedAssetIds: readonly string[],
  ): Promise<readonly WatchlistItem[]> =>
    this.commit(items => {
      const byAssetId = new Map(items.map(item => [item.assetId, item]));
      const reordered: WatchlistItem[] = [];
      const seen = new Set<string>();

      orderedAssetIds.forEach(assetId => {
        const item = byAssetId.get(assetId);
        if (item !== undefined && !seen.has(assetId)) {
          reordered.push(item);
          seen.add(assetId);
        }
      });
      items.forEach(item => {
        if (!seen.has(item.assetId)) {
          reordered.push(item);
        }
      });
      return reordered;
    });

  private toItem(input: WatchlistInput): WatchlistItem {
    if (typeof input === 'string') {
      return { assetId: input, addedAt: this.now().toISOString() };
    }

    return {
      assetId: input.assetId,
      addedAt: input.addedAt ?? this.now().toISOString(),
    };
  }
}

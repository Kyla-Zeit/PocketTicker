import type { RecentlyViewedAsset } from '../types';
import { PersistentListRepository } from './base';
import { recentlyViewedAssetSchema } from './schemas';
import {
  REPOSITORY_STORAGE_KEYS,
  repositoryStorage,
  type RepositoryStorage,
} from './storage';

export const RECENTLY_VIEWED_LIMIT = 10;

export type RecentlyViewedInput = Omit<RecentlyViewedAsset, 'viewedAt'> & {
  viewedAt?: string;
};

const normalizeRecentlyViewed = (
  items: readonly RecentlyViewedAsset[],
): readonly RecentlyViewedAsset[] => {
  const seen = new Set<string>();
  return items
    .filter(item => {
      if (seen.has(item.assetId)) {
        return false;
      }
      seen.add(item.assetId);
      return true;
    })
    .slice(0, RECENTLY_VIEWED_LIMIT);
};

export class RecentlyViewedRepository extends PersistentListRepository<RecentlyViewedAsset> {
  constructor(
    storage: RepositoryStorage = repositoryStorage,
    storageKey: string = REPOSITORY_STORAGE_KEYS.recentlyViewed,
    private readonly now: () => Date = () => new Date(),
  ) {
    super({
      storage,
      storageKey,
      itemSchema: recentlyViewedAssetSchema,
      normalize: normalizeRecentlyViewed,
    });
  }

  readonly add = (
    input: RecentlyViewedInput,
  ): Promise<readonly RecentlyViewedAsset[]> => {
    const item: RecentlyViewedAsset = {
      ...input,
      viewedAt: input.viewedAt ?? this.now().toISOString(),
    };
    return this.commit(items => [
      item,
      ...items.filter(current => current.assetId !== item.assetId),
    ]);
  };

  readonly remove = (
    assetId: string,
  ): Promise<readonly RecentlyViewedAsset[]> =>
    this.commit(items => {
      const next = items.filter(item => item.assetId !== assetId);
      return next.length === items.length ? items : next;
    });
}

import type { RecentSearch } from '../types';
import { PersistentListRepository } from './base';
import { recentSearchSchema } from './schemas';
import {
  REPOSITORY_STORAGE_KEYS,
  repositoryStorage,
  type RepositoryStorage,
} from './storage';

export type RecentSearchInput =
  | RecentSearch
  | { query: string; searchedAt?: string }
  | string;

const searchIdentity = (query: string): string =>
  query.trim().toLocaleLowerCase();

const dedupeSearches = (
  searches: readonly RecentSearch[],
): readonly RecentSearch[] => {
  const seen = new Set<string>();
  return searches.filter(search => {
    const identity = searchIdentity(search.query);
    if (seen.has(identity)) {
      return false;
    }
    seen.add(identity);
    return true;
  });
};

export class RecentSearchRepository extends PersistentListRepository<RecentSearch> {
  constructor(
    storage: RepositoryStorage = repositoryStorage,
    storageKey: string = REPOSITORY_STORAGE_KEYS.recentSearches,
    private readonly now: () => Date = () => new Date(),
  ) {
    super({
      storage,
      storageKey,
      itemSchema: recentSearchSchema,
      normalize: dedupeSearches,
    });
  }

  readonly add = (
    input: RecentSearchInput,
  ): Promise<readonly RecentSearch[]> => {
    const search = this.toSearch(input);
    const identity = searchIdentity(search.query);
    return this.commit(items => [
      search,
      ...items.filter(item => searchIdentity(item.query) !== identity),
    ]);
  };

  readonly remove = (query: string): Promise<readonly RecentSearch[]> => {
    const identity = searchIdentity(query);
    return this.commit(items => {
      const next = items.filter(
        item => searchIdentity(item.query) !== identity,
      );
      return next.length === items.length ? items : next;
    });
  };

  private toSearch(input: RecentSearchInput): RecentSearch {
    if (typeof input === 'string') {
      return { query: input, searchedAt: this.now().toISOString() };
    }

    return {
      query: input.query,
      searchedAt: input.searchedAt ?? this.now().toISOString(),
    };
  }
}

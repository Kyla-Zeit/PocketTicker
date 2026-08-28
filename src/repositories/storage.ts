import AsyncStorage from '@react-native-async-storage/async-storage';

/** The small AsyncStorage surface repositories need, making them easy to test. */
export interface RepositoryStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const repositoryStorage: RepositoryStorage = AsyncStorage;

export const REPOSITORY_STORAGE_KEYS = {
  watchlist: '@pocketticker/watchlist:v1',
  holdings: '@pocketticker/holdings:v1',
  alerts: '@pocketticker/alerts:v1',
  recentSearches: '@pocketticker/recent-searches:v1',
  recentlyViewed: '@pocketticker/recently-viewed:v1',
  preferences: '@pocketticker/preferences:v1',
} as const;

import { useEffect, useMemo, useSyncExternalStore } from 'react';

import type {
  Holding,
  PriceAlert,
  RecentSearch,
  RecentlyViewedAsset,
  UserPreferences,
  WatchlistItem,
} from '../types';
import type {
  ListRepositorySnapshot,
  ValueRepositorySnapshot,
} from './contracts';
import {
  alertRepository,
  portfolioRepository,
  preferencesRepository,
  recentSearchRepository,
  recentlyViewedRepository,
  watchlistRepository,
} from './instances';

const useListSnapshot = <T>(repository: {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ListRepositorySnapshot<T>;
  hydrate: () => Promise<ListRepositorySnapshot<T>>;
}): ListRepositorySnapshot<T> => {
  const snapshot = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getSnapshot,
  );

  useEffect(() => {
    repository.hydrate().catch(() => undefined);
  }, [repository]);

  return snapshot;
};

const useValueSnapshot = <T>(repository: {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ValueRepositorySnapshot<T>;
  hydrate: () => Promise<ValueRepositorySnapshot<T>>;
}): ValueRepositorySnapshot<T> => {
  const snapshot = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getSnapshot,
  );

  useEffect(() => {
    repository.hydrate().catch(() => undefined);
  }, [repository]);

  return snapshot;
};

export type WatchlistHook = ListRepositorySnapshot<WatchlistItem> & {
  readonly hydrate: typeof watchlistRepository.hydrate;
  readonly refresh: typeof watchlistRepository.refresh;
  readonly add: typeof watchlistRepository.add;
  readonly remove: typeof watchlistRepository.remove;
  readonly toggle: typeof watchlistRepository.toggle;
  readonly reorder: typeof watchlistRepository.reorder;
  readonly clear: typeof watchlistRepository.clear;
  readonly replace: typeof watchlistRepository.replace;
  readonly has: typeof watchlistRepository.has;
};

export const useWatchlist = (): WatchlistHook => {
  const snapshot = useListSnapshot(watchlistRepository);
  return useMemo(
    () => ({
      ...snapshot,
      hydrate: watchlistRepository.hydrate,
      refresh: watchlistRepository.refresh,
      add: watchlistRepository.add,
      remove: watchlistRepository.remove,
      toggle: watchlistRepository.toggle,
      reorder: watchlistRepository.reorder,
      clear: watchlistRepository.clear,
      replace: watchlistRepository.replace,
      has: watchlistRepository.has,
    }),
    [snapshot],
  );
};

export type HoldingsHook = ListRepositorySnapshot<Holding> & {
  readonly hydrate: typeof portfolioRepository.hydrate;
  readonly refresh: typeof portfolioRepository.refresh;
  readonly add: typeof portfolioRepository.add;
  readonly upsert: typeof portfolioRepository.upsert;
  readonly update: typeof portfolioRepository.update;
  readonly remove: typeof portfolioRepository.remove;
  readonly clear: typeof portfolioRepository.clear;
  readonly replace: typeof portfolioRepository.replace;
  readonly getById: typeof portfolioRepository.getById;
};

export const useHoldings = (): HoldingsHook => {
  const snapshot = useListSnapshot(portfolioRepository);
  return useMemo(
    () => ({
      ...snapshot,
      hydrate: portfolioRepository.hydrate,
      refresh: portfolioRepository.refresh,
      add: portfolioRepository.add,
      upsert: portfolioRepository.upsert,
      update: portfolioRepository.update,
      remove: portfolioRepository.remove,
      clear: portfolioRepository.clear,
      replace: portfolioRepository.replace,
      getById: portfolioRepository.getById,
    }),
    [snapshot],
  );
};

export type AlertsHook = ListRepositorySnapshot<PriceAlert> & {
  readonly hydrate: typeof alertRepository.hydrate;
  readonly refresh: typeof alertRepository.refresh;
  readonly add: typeof alertRepository.add;
  readonly upsert: typeof alertRepository.upsert;
  readonly update: typeof alertRepository.update;
  readonly remove: typeof alertRepository.remove;
  readonly setEnabled: typeof alertRepository.setEnabled;
  readonly markTriggered: typeof alertRepository.markTriggered;
  readonly clear: typeof alertRepository.clear;
  readonly replace: typeof alertRepository.replace;
  readonly getById: typeof alertRepository.getById;
};

export const useAlerts = (): AlertsHook => {
  const snapshot = useListSnapshot(alertRepository);
  return useMemo(
    () => ({
      ...snapshot,
      hydrate: alertRepository.hydrate,
      refresh: alertRepository.refresh,
      add: alertRepository.add,
      upsert: alertRepository.upsert,
      update: alertRepository.update,
      remove: alertRepository.remove,
      setEnabled: alertRepository.setEnabled,
      markTriggered: alertRepository.markTriggered,
      clear: alertRepository.clear,
      replace: alertRepository.replace,
      getById: alertRepository.getById,
    }),
    [snapshot],
  );
};

export type RecentSearchesHook = ListRepositorySnapshot<RecentSearch> & {
  readonly hydrate: typeof recentSearchRepository.hydrate;
  readonly refresh: typeof recentSearchRepository.refresh;
  readonly add: typeof recentSearchRepository.add;
  readonly remove: typeof recentSearchRepository.remove;
  readonly clear: typeof recentSearchRepository.clear;
  readonly replace: typeof recentSearchRepository.replace;
};

export const useRecentSearches = (): RecentSearchesHook => {
  const snapshot = useListSnapshot(recentSearchRepository);
  return useMemo(
    () => ({
      ...snapshot,
      hydrate: recentSearchRepository.hydrate,
      refresh: recentSearchRepository.refresh,
      add: recentSearchRepository.add,
      remove: recentSearchRepository.remove,
      clear: recentSearchRepository.clear,
      replace: recentSearchRepository.replace,
    }),
    [snapshot],
  );
};

export type RecentlyViewedHook = ListRepositorySnapshot<RecentlyViewedAsset> & {
  readonly hydrate: typeof recentlyViewedRepository.hydrate;
  readonly refresh: typeof recentlyViewedRepository.refresh;
  readonly add: typeof recentlyViewedRepository.add;
  readonly remove: typeof recentlyViewedRepository.remove;
  readonly clear: typeof recentlyViewedRepository.clear;
  readonly replace: typeof recentlyViewedRepository.replace;
};

export const useRecentlyViewed = (): RecentlyViewedHook => {
  const snapshot = useListSnapshot(recentlyViewedRepository);
  return useMemo(
    () => ({
      ...snapshot,
      hydrate: recentlyViewedRepository.hydrate,
      refresh: recentlyViewedRepository.refresh,
      add: recentlyViewedRepository.add,
      remove: recentlyViewedRepository.remove,
      clear: recentlyViewedRepository.clear,
      replace: recentlyViewedRepository.replace,
    }),
    [snapshot],
  );
};

export type PreferencesHook = Omit<
  ValueRepositorySnapshot<UserPreferences>,
  'value'
> & {
  readonly preferences: Readonly<UserPreferences>;
  readonly hydrate: typeof preferencesRepository.hydrate;
  readonly refresh: typeof preferencesRepository.refresh;
  readonly update: typeof preferencesRepository.update;
  readonly reset: typeof preferencesRepository.reset;
  readonly replace: typeof preferencesRepository.replace;
};

export const usePreferences = (): PreferencesHook => {
  const snapshot = useValueSnapshot(preferencesRepository);
  return useMemo(
    () => ({
      preferences: snapshot.value,
      isHydrated: snapshot.isHydrated,
      error: snapshot.error,
      hydrate: preferencesRepository.hydrate,
      refresh: preferencesRepository.refresh,
      update: preferencesRepository.update,
      reset: preferencesRepository.reset,
      replace: preferencesRepository.replace,
    }),
    [snapshot],
  );
};

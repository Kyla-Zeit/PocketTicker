import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {marketDataProvider, type MarketDataProvider} from '../../../api';
import type {MarketDataError, SearchResult} from '../../../types';
import {marketQueryKeys} from '../../markets/hooks/queryKeys';
import {
  MARKET_CACHE_TIME_MS,
  retryMarketQuery,
  SEARCH_STALE_TIME_MS,
} from '../../markets/hooks/queryOptions';
import {useDebouncedValue} from './useDebouncedValue';

export interface UseAssetSearchOptions {
  enabled?: boolean;
  provider?: MarketDataProvider;
}

export interface UseDebouncedAssetSearchOptions extends UseAssetSearchOptions {
  debounceMs?: number;
}

export function useAssetSearch(
  query: string,
  options: UseAssetSearchOptions = {},
): UseQueryResult<SearchResult[], MarketDataError> {
  const provider = options.provider ?? marketDataProvider;
  const normalizedQuery = query.trim();
  return useQuery<SearchResult[], MarketDataError>({
    queryKey: marketQueryKeys.search(
      normalizedQuery.toLocaleLowerCase(),
      provider.name,
    ),
    queryFn: ({signal}) => provider.searchAssets(normalizedQuery, {signal}),
    enabled: (options.enabled ?? true) && normalizedQuery.length > 0,
    staleTime: SEARCH_STALE_TIME_MS,
    gcTime: MARKET_CACHE_TIME_MS,
    retry: retryMarketQuery,
  });
}

export function useDebouncedAssetSearch(
  query: string,
  options: UseDebouncedAssetSearchOptions = {},
): UseQueryResult<SearchResult[], MarketDataError> {
  const debouncedQuery = useDebouncedValue(query, options.debounceMs ?? 400);
  return useAssetSearch(debouncedQuery, options);
}

export const useSearchAssets = useAssetSearch;

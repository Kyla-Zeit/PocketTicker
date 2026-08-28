import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {marketDataProvider} from '../../../api';
import type {
  GetMarketsParams,
  MarketDataProvider,
} from '../../../api';
import type {MarketAsset, MarketDataError} from '../../../types';
import {marketQueryKeys} from './queryKeys';
import {
  MARKET_CACHE_TIME_MS,
  MARKET_STALE_TIME_MS,
  retryMarketQuery,
} from './queryOptions';

export interface UseMarketsOptions extends Omit<GetMarketsParams, 'signal'> {
  enabled?: boolean;
  provider?: MarketDataProvider;
}

export function useMarkets(
  options: UseMarketsOptions = {},
): UseQueryResult<MarketAsset[], MarketDataError> {
  const provider = options.provider ?? marketDataProvider;
  const currency = options.currency ?? 'CAD';
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const perPage = Math.max(1, Math.trunc(options.perPage ?? 50));
  const order = options.order ?? 'market_cap_desc';

  return useQuery<MarketAsset[], MarketDataError>({
    queryKey: marketQueryKeys.markets({
      provider: provider.name,
      currency,
      page,
      perPage,
      order,
    }),
    queryFn: ({signal}) =>
      provider.getMarkets({currency, page, perPage, order, signal}),
    enabled: options.enabled ?? true,
    staleTime: MARKET_STALE_TIME_MS,
    gcTime: MARKET_CACHE_TIME_MS,
    placeholderData: previousData => previousData,
    retry: retryMarketQuery,
  });
}

export const useMarketAssets = useMarkets;

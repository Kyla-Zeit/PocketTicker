import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {marketDataProvider, type MarketDataProvider} from '../../../api';
import type {
  AssetDetails,
  CurrencyCode,
  MarketDataError,
} from '../../../types';
import {marketQueryKeys} from '../../markets/hooks/queryKeys';
import {
  DETAILS_STALE_TIME_MS,
  MARKET_CACHE_TIME_MS,
  retryMarketQuery,
} from '../../markets/hooks/queryOptions';

export interface UseAssetDetailsOptions {
  enabled?: boolean;
  provider?: MarketDataProvider;
}

export function useAssetDetails(
  assetId: string,
  currency: CurrencyCode = 'CAD',
  options: UseAssetDetailsOptions = {},
): UseQueryResult<AssetDetails, MarketDataError> {
  const provider = options.provider ?? marketDataProvider;
  const normalizedId = assetId.trim().toLocaleLowerCase();
  return useQuery<AssetDetails, MarketDataError>({
    queryKey: marketQueryKeys.detail(normalizedId, currency, provider.name),
    queryFn: ({signal}) =>
      provider.getAssetDetails(normalizedId, {currency, signal}),
    enabled: (options.enabled ?? true) && normalizedId.length > 0,
    staleTime: DETAILS_STALE_TIME_MS,
    gcTime: MARKET_CACHE_TIME_MS,
    retry: retryMarketQuery,
  });
}

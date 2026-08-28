import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {marketDataProvider, type MarketDataProvider} from '../../../api';
import type {
  ChartTimeframe,
  CurrencyCode,
  MarketDataError,
  MarketPoint,
} from '../../../types';
import {CHART_DAYS_BY_TIMEFRAME} from '../../../types';
import {marketQueryKeys} from '../../markets/hooks/queryKeys';
import {
  CHART_STALE_TIME_MS,
  MARKET_CACHE_TIME_MS,
  retryMarketQuery,
} from '../../markets/hooks/queryOptions';

export interface UseMarketChartOptions {
  enabled?: boolean;
  provider?: MarketDataProvider;
}

export function useMarketChart(
  assetId: string,
  timeframe: ChartTimeframe,
  currency: CurrencyCode = 'CAD',
  options: UseMarketChartOptions = {},
): UseQueryResult<MarketPoint[], MarketDataError> {
  const provider = options.provider ?? marketDataProvider;
  const normalizedId = assetId.trim().toLocaleLowerCase();
  return useQuery<MarketPoint[], MarketDataError>({
    queryKey: marketQueryKeys.chart(
      normalizedId,
      timeframe,
      currency,
      provider.name,
    ),
    queryFn: ({signal}) =>
      provider.getMarketChart(normalizedId, {
        days: CHART_DAYS_BY_TIMEFRAME[timeframe],
        currency,
        signal,
      }),
    enabled: (options.enabled ?? true) && normalizedId.length > 0,
    staleTime: CHART_STALE_TIME_MS,
    gcTime: MARKET_CACHE_TIME_MS,
    placeholderData: previousData => previousData,
    retry: retryMarketQuery,
  });
}

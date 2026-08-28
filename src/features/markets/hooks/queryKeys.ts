import type {
  ChartTimeframe,
  CurrencyCode,
  MarketOrder,
} from '../../../types';

export interface MarketListQueryKeyOptions {
  provider: string;
  currency: CurrencyCode;
  page: number;
  perPage: number;
  order: MarketOrder;
}

export const marketQueryKeys = {
  all: ['market-data'] as const,
  lists: () => [...marketQueryKeys.all, 'lists'] as const,
  markets: (options: MarketListQueryKeyOptions) =>
    [
      ...marketQueryKeys.lists(),
      options.provider,
      options.currency,
      options.page,
      options.perPage,
      options.order,
    ] as const,
  searches: () => [...marketQueryKeys.all, 'searches'] as const,
  search: (query: string, provider: string) =>
    [...marketQueryKeys.searches(), provider, query] as const,
  details: () => [...marketQueryKeys.all, 'details'] as const,
  detail: (assetId: string, currency: CurrencyCode, provider: string) =>
    [...marketQueryKeys.details(), provider, assetId, currency] as const,
  charts: () => [...marketQueryKeys.all, 'charts'] as const,
  chart: (
    assetId: string,
    timeframe: ChartTimeframe,
    currency: CurrencyCode,
    provider: string,
  ) =>
    [
      ...marketQueryKeys.charts(),
      provider,
      assetId,
      timeframe,
      currency,
    ] as const,
};

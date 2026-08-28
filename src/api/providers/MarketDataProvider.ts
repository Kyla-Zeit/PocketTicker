import type {
  AssetDetails,
  ChartDays,
  CurrencyCode,
  MarketAsset,
  MarketOrder,
  MarketPoint,
  SearchResult,
} from '../../types';

export interface MarketRequestOptions {
  signal?: AbortSignal;
}

export interface GetMarketsParams extends MarketRequestOptions {
  currency?: CurrencyCode;
  page?: number;
  perPage?: number;
  order?: MarketOrder;
}

export interface GetAssetDetailsOptions extends MarketRequestOptions {
  currency?: CurrencyCode;
}

export interface GetMarketChartOptions extends MarketRequestOptions {
  days: ChartDays;
  currency?: CurrencyCode;
}

export type MarketDataProviderName = 'coingecko' | 'mock';

export interface MarketDataProvider {
  readonly name: MarketDataProviderName;

  getMarkets(params?: GetMarketsParams): Promise<MarketAsset[]>;

  searchAssets(
    query: string,
    options?: MarketRequestOptions,
  ): Promise<SearchResult[]>;

  getAssetDetails(
    id: string,
    options?: GetAssetDetailsOptions,
  ): Promise<AssetDetails>;

  getMarketChart(
    id: string,
    options: GetMarketChartOptions,
  ): Promise<MarketPoint[]>;
}

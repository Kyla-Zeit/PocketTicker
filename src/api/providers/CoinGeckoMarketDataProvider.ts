import type {
  AssetDetails,
  CurrencyCode,
  MarketAsset,
  MarketOrder,
  MarketPoint,
  SearchResult,
} from '../../types';
import {fetchValidatedJson} from '../client';
import {
  mapCoinGeckoAssetDetails,
  mapCoinGeckoMarketChart,
  mapCoinGeckoMarkets,
  mapCoinGeckoSearchResults,
} from '../mappers';
import {
  coinGeckoAssetDetailsSchema,
  coinGeckoMarketChartSchema,
  coinGeckoMarketsSchema,
  coinGeckoSearchResponseSchema,
} from '../schemas';
import type {
  GetAssetDetailsOptions,
  GetMarketChartOptions,
  GetMarketsParams,
  MarketDataProvider,
  MarketRequestOptions,
} from './MarketDataProvider';

const DEFAULT_BASE_URL = 'https://api.coingecko.com/api/v3';

export interface CoinGeckoProviderOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

function queryString(values: Readonly<Record<string, string | number | boolean>>): string {
  return Object.entries(values)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');
}

function coinGeckoOrder(order: MarketOrder): string {
  return order === 'market_cap_asc' ? 'market_cap_asc' : 'market_cap_desc';
}

function sortMarkets(markets: MarketAsset[], order: MarketOrder): MarketAsset[] {
  const sorted = [...markets];
  switch (order) {
    case 'market_cap_asc':
      return sorted.sort((left, right) => left.marketCap - right.marketCap);
    case 'price_desc':
      return sorted.sort((left, right) => right.currentPrice - left.currentPrice);
    case 'price_asc':
      return sorted.sort((left, right) => left.currentPrice - right.currentPrice);
    case 'change_desc':
      return sorted.sort(
        (left, right) =>
          right.priceChangePercentage24h - left.priceChangePercentage24h,
      );
    case 'change_asc':
      return sorted.sort(
        (left, right) =>
          left.priceChangePercentage24h - right.priceChangePercentage24h,
      );
    case 'market_cap_desc':
    default:
      return sorted.sort((left, right) => right.marketCap - left.marketCap);
  }
}

export class CoinGeckoMarketDataProvider implements MarketDataProvider {
  readonly name = 'coingecko' as const;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs?: number;

  constructor(options: CoinGeckoProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.apiKey = options.apiKey?.trim() || undefined;
    this.timeoutMs = options.timeoutMs;
  }

  async getMarkets(params: GetMarketsParams = {}): Promise<MarketAsset[]> {
    const currency = params.currency ?? 'CAD';
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const perPage = Math.min(250, Math.max(1, Math.trunc(params.perPage ?? 50)));
    const order = params.order ?? 'market_cap_desc';
    const query = queryString({
      vs_currency: currency.toLowerCase(),
      order: coinGeckoOrder(order),
      per_page: perPage,
      page,
      sparkline: true,
      price_change_percentage: '24h',
    });
    const raw = await fetchValidatedJson(
      `${this.baseUrl}/coins/markets?${query}`,
      coinGeckoMarketsSchema,
      this.requestOptions(params.signal),
    );
    return sortMarkets(mapCoinGeckoMarkets(raw), order);
  }

  async searchAssets(
    query: string,
    options: MarketRequestOptions = {},
  ): Promise<SearchResult[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }
    const raw = await fetchValidatedJson(
      `${this.baseUrl}/search?${queryString({query: normalizedQuery})}`,
      coinGeckoSearchResponseSchema,
      this.requestOptions(options.signal),
    );
    return mapCoinGeckoSearchResults(raw);
  }

  async getAssetDetails(
    id: string,
    options: GetAssetDetailsOptions = {},
  ): Promise<AssetDetails> {
    const currency = options.currency ?? 'CAD';
    const query = queryString({
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: true,
    });
    const raw = await fetchValidatedJson(
      `${this.baseUrl}/coins/${encodeURIComponent(id.trim())}?${query}`,
      coinGeckoAssetDetailsSchema,
      this.requestOptions(options.signal),
    );
    return mapCoinGeckoAssetDetails(raw, currency);
  }

  async getMarketChart(
    id: string,
    options: GetMarketChartOptions,
  ): Promise<MarketPoint[]> {
    const currency: CurrencyCode = options.currency ?? 'CAD';
    const query = queryString({
      vs_currency: currency.toLowerCase(),
      days: options.days,
    });
    const raw = await fetchValidatedJson(
      `${this.baseUrl}/coins/${encodeURIComponent(
        id.trim(),
      )}/market_chart?${query}`,
      coinGeckoMarketChartSchema,
      this.requestOptions(options.signal),
    );
    return mapCoinGeckoMarketChart(raw);
  }

  private requestOptions(signal?: AbortSignal) {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey;
    }
    return {
      signal,
      timeoutMs: this.timeoutMs,
      headers,
    };
  }
}

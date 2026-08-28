import type {
  AssetDetails,
  CurrencyCode,
  MarketAsset,
  MarketPoint,
  SearchResult,
} from '../../types';
import {MarketDataError} from '../../types';
import type {
  CoinGeckoAssetDetails,
  CoinGeckoMarketAsset,
  CoinGeckoMarketChart,
  CoinGeckoSearchResponse,
} from '../schemas';

function definedNumber(value: number | null | undefined, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new MarketDataError(
      'invalid_response',
      `The market data response is missing ${field}.`,
    );
  }
  return value;
}

function optionalNumber(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optionalString(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function currencyKey(currency: CurrencyCode): string {
  return currency.toLowerCase();
}

export function mapCoinGeckoMarketAsset(
  raw: CoinGeckoMarketAsset,
): MarketAsset {
  const sparkline = raw.sparkline_in_7d?.price;
  return {
    id: raw.id,
    symbol: raw.symbol.toUpperCase(),
    name: raw.name,
    imageUrl: raw.image,
    currentPrice: raw.current_price,
    priceChange24h: optionalNumber(raw.price_change_24h),
    priceChangePercentage24h: raw.price_change_percentage_24h ?? 0,
    marketCap: raw.market_cap ?? 0,
    marketCapRank: optionalNumber(raw.market_cap_rank),
    totalVolume: raw.total_volume ?? 0,
    high24h: optionalNumber(raw.high_24h),
    low24h: optionalNumber(raw.low_24h),
    lastUpdated: raw.last_updated,
    sparkline,
    sparkline7d: sparkline,
  };
}

export function mapCoinGeckoMarkets(
  raw: CoinGeckoMarketAsset[],
): MarketAsset[] {
  return raw.map(mapCoinGeckoMarketAsset);
}

export function mapCoinGeckoSearchResults(
  raw: CoinGeckoSearchResponse,
): SearchResult[] {
  return raw.coins.map(coin => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    imageUrl: optionalString(coin.large) ?? optionalString(coin.thumb),
    marketCapRank: optionalNumber(coin.market_cap_rank),
  }));
}

export function mapCoinGeckoAssetDetails(
  raw: CoinGeckoAssetDetails,
  currency: CurrencyCode,
): AssetDetails {
  const key = currencyKey(currency);
  const marketData = raw.market_data;
  const imageUrl = raw.image.large ?? raw.image.small ?? raw.image.thumb ?? '';
  const homepage = raw.links?.homepage?.find(candidate => candidate.trim());

  const sparkline = marketData.sparkline_7d?.price;
  const ath = definedNumber(marketData.ath[key], 'all-time high');
  const atl = definedNumber(marketData.atl[key], 'all-time low');

  return {
    id: raw.id,
    symbol: raw.symbol.toUpperCase(),
    name: raw.name,
    imageUrl,
    currentPrice: definedNumber(marketData.current_price[key], 'current price'),
    priceChange24h: optionalNumber(
      marketData.price_change_24h_in_currency?.[key],
    ),
    priceChangePercentage24h: marketData.price_change_percentage_24h ?? 0,
    marketCap: marketData.market_cap[key] ?? 0,
    marketCapRank: optionalNumber(raw.market_cap_rank),
    totalVolume: marketData.total_volume[key] ?? 0,
    high24h: optionalNumber(marketData.high_24h?.[key]),
    low24h: optionalNumber(marketData.low_24h?.[key]),
    lastUpdated: raw.last_updated,
    sparkline,
    sparkline7d: sparkline,
    circulatingSupply: marketData.circulating_supply ?? 0,
    totalSupply: optionalNumber(marketData.total_supply),
    maxSupply: optionalNumber(marketData.max_supply),
    ath,
    allTimeHigh: ath,
    athChangePercentage: optionalNumber(
      marketData.ath_change_percentage?.[key],
    ),
    athDate: optionalString(marketData.ath_date?.[key]),
    atl,
    allTimeLow: atl,
    atlChangePercentage: optionalNumber(
      marketData.atl_change_percentage?.[key],
    ),
    atlDate: optionalString(marketData.atl_date?.[key]),
    description: raw.description.en?.trim() ?? '',
    homepage: optionalString(homepage),
  };
}

export function mapCoinGeckoMarketChart(
  raw: CoinGeckoMarketChart,
): MarketPoint[] {
  return raw.prices
    .map(([timestamp, price]) => ({timestamp, price}))
    .sort((left, right) => left.timestamp - right.timestamp);
}

import type {MarketDataError} from '../../../types';

export const MARKET_STALE_TIME_MS = 60_000;
export const DETAILS_STALE_TIME_MS = 2 * 60_000;
export const SEARCH_STALE_TIME_MS = 5 * 60_000;
export const CHART_STALE_TIME_MS = 5 * 60_000;
export const MARKET_CACHE_TIME_MS = 24 * 60 * 60_000;

export function retryMarketQuery(
  failureCount: number,
  error: MarketDataError,
): boolean {
  return error.retryable && failureCount < 2;
}

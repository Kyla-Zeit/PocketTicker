export const MARKET_DATA_ERROR_CODES = [
  'network',
  'timeout',
  'rate_limit',
  'not_found',
  'server',
  'invalid_response',
  'aborted',
  'unknown',
] as const;

export type MarketDataErrorCode = (typeof MARKET_DATA_ERROR_CODES)[number];

export class MarketDataError extends Error {
  readonly code: MarketDataErrorCode;
  readonly status?: number;
  readonly retryable: boolean;
  readonly originalError?: unknown;

  get userMessage(): string {
    return this.message;
  }

  constructor(
    code: MarketDataErrorCode,
    message: string,
    options: {
      status?: number;
      retryable?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'MarketDataError';
    this.code = code;
    this.status = options.status;
    this.retryable = options.retryable ?? isRetryableMarketDataError(code);
    this.originalError = options.cause;
    Object.setPrototypeOf(this, MarketDataError.prototype);
  }
}

export function isRetryableMarketDataError(code: MarketDataErrorCode): boolean {
  return code === 'network' || code === 'timeout' || code === 'rate_limit' || code === 'server';
}

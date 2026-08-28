import type {z} from 'zod';
import {MarketDataError} from '../types';

export const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;

export interface FetchJsonOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Readonly<Record<string, string>>;
}

function errorForHttpStatus(status: number): MarketDataError {
  if (status === 404) {
    return new MarketDataError('not_found', 'The requested asset was not found.', {
      status,
      retryable: false,
    });
  }
  if (status === 429) {
    return new MarketDataError(
      'rate_limit',
      'Market data is temporarily rate limited. Please try again shortly.',
      {status},
    );
  }
  if (status >= 500) {
    return new MarketDataError(
      'server',
      'The market data service is temporarily unavailable.',
      {status},
    );
  }
  return new MarketDataError(
    'server',
    'The market data request could not be completed.',
    {status, retryable: status >= 500},
  );
}

export function normalizeMarketDataError(error: unknown): MarketDataError {
  if (error instanceof MarketDataError) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new MarketDataError('aborted', 'The market data request was cancelled.', {
      retryable: false,
      cause: error,
    });
  }

  if (error instanceof TypeError) {
    return new MarketDataError(
      'network',
      'Unable to reach the market data service. Check your connection.',
      {cause: error},
    );
  }

  return new MarketDataError(
    'unknown',
    'Something went wrong while loading market data.',
    {retryable: false, cause: error},
  );
}

export async function fetchValidatedJson<T>(
  url: string,
  schema: z.ZodType<T>,
  options: FetchJsonOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  let timedOut = false;
  let externallyAborted = false;

  const abortForExternalSignal = () => {
    externallyAborted = true;
    controller.abort();
  };

  if (options.signal?.aborted) {
    abortForExternalSignal();
  } else {
    options.signal?.addEventListener('abort', abortForExternalSignal, {once: true});
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, Math.max(1, timeoutMs));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw errorForHttpStatus(response.status);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      throw new MarketDataError(
        'invalid_response',
        'The market data service returned unreadable data.',
        {retryable: false, cause: error},
      );
    }

    const result = schema.safeParse(json);
    if (!result.success) {
      throw new MarketDataError(
        'invalid_response',
        'The market data service returned an unexpected response.',
        {retryable: false, cause: result.error},
      );
    }

    return result.data;
  } catch (error) {
    if (timedOut) {
      throw new MarketDataError(
        'timeout',
        'The market data request took too long. Please try again.',
        {cause: error},
      );
    }
    if (externallyAborted || controller.signal.aborted) {
      throw new MarketDataError(
        'aborted',
        'The market data request was cancelled.',
        {retryable: false, cause: error},
      );
    }
    throw normalizeMarketDataError(error);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abortForExternalSignal);
  }
}

import {z} from 'zod';
import {fetchValidatedJson} from '../client';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('market API client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('returns only schema-validated JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({price: 42})) as typeof fetch;
    await expect(
      fetchValidatedJson('https://example.test', z.object({price: z.number()})),
    ).resolves.toEqual({price: 42});
  });

  it('normalizes rate limiting into a retryable domain error', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({}, 429)) as typeof fetch;
    await expect(
      fetchValidatedJson('https://example.test', z.object({price: z.number()})),
    ).rejects.toMatchObject({code: 'rate_limit', status: 429, retryable: true});
  });

  it('normalizes a schema mismatch into a non-retryable invalid response', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({price: '42'})) as typeof fetch;
    await expect(
      fetchValidatedJson('https://example.test', z.object({price: z.number()})),
    ).rejects.toMatchObject({code: 'invalid_response', retryable: false});
  });

  it('aborts and normalizes requests that exceed their timeout', async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockImplementation((_url, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    }) as typeof fetch;

    const pending = fetchValidatedJson(
      'https://example.test',
      z.object({price: z.number()}),
      {timeoutMs: 50},
    );
    pending.catch(() => {});

    await jest.advanceTimersByTimeAsync(50);
    await expect(pending).rejects.toMatchObject({code: 'timeout', retryable: true});
  });
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import type { Holding, PriceAlert, RecentlyViewedAsset } from '../../types';
import { AlertRepository } from '../AlertRepository';
import { RepositoryHydrationError, RepositoryStorageError } from '../errors';
import { PortfolioRepository } from '../PortfolioRepository';
import {
  DEFAULT_USER_PREFERENCES,
  PreferencesRepository,
} from '../PreferencesRepository';
import { RecentSearchRepository } from '../RecentSearchRepository';
import {
  RECENTLY_VIEWED_LIMIT,
  RecentlyViewedRepository,
} from '../RecentlyViewedRepository';
import type { RepositoryStorage } from '../storage';
import { WatchlistRepository } from '../WatchlistRepository';

class MemoryStorage implements RepositoryStorage {
  readonly values = new Map<string, string>();
  readError: unknown;
  writeError: unknown;

  async getItem(key: string): Promise<string | null> {
    if (this.readError !== undefined) {
      throw this.readError;
    }
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.writeError !== undefined) {
      throw this.writeError;
    }
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

const fixedNow = new Date('2026-08-25T12:00:00.000Z');

describe('WatchlistRepository', () => {
  it('persists immutable updates and notifies subscribers', async () => {
    const storage = new MemoryStorage();
    const repository = new WatchlistRepository(
      storage,
      'watchlist',
      () => fixedNow,
    );
    await repository.hydrate();
    const emptySnapshot = repository.getSnapshot();
    const listener = jest.fn();
    const unsubscribe = repository.subscribe(listener);

    await repository.add('bitcoin');

    expect(repository.getAll()).toEqual([
      { assetId: 'bitcoin', addedAt: fixedNow.toISOString() },
    ]);
    expect(emptySnapshot.items).toEqual([]);
    expect(Object.isFrozen(repository.getAll())).toBe(true);
    expect(Object.isFrozen(repository.getAll()[0])).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.values.get('watchlist') ?? '')).toEqual(
      repository.getAll(),
    );

    unsubscribe();
    await repository.remove('bitcoin');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('serializes simultaneous mutations without dropping items', async () => {
    const repository = new WatchlistRepository(
      new MemoryStorage(),
      'watchlist',
      () => fixedNow,
    );

    await Promise.all([
      repository.add('bitcoin'),
      repository.add('ethereum'),
      repository.add('solana'),
    ]);

    expect(repository.getAll().map(item => item.assetId)).toEqual([
      'bitcoin',
      'ethereum',
      'solana',
    ]);
  });

  it('salvages valid records from corrupt storage', async () => {
    const storage = new MemoryStorage();
    storage.values.set(
      'watchlist',
      JSON.stringify([
        { assetId: 'bitcoin', addedAt: fixedNow.toISOString() },
        { assetId: '', addedAt: 'yesterday' },
      ]),
    );
    const repository = new WatchlistRepository(storage, 'watchlist');

    const snapshot = await repository.hydrate();

    expect(snapshot.items).toEqual([
      { assetId: 'bitcoin', addedAt: fixedNow.toISOString() },
    ]);
    expect(snapshot.isHydrated).toBe(true);
    expect(snapshot.error).toBeInstanceOf(RepositoryHydrationError);
  });
});

describe('PortfolioRepository', () => {
  const holding: Holding = {
    id: 'btc-main',
    assetId: 'bitcoin',
    symbol: 'btc',
    amount: 0.25,
  };

  it('adds, updates, and restores holdings through injected storage', async () => {
    const storage = new MemoryStorage();
    const first = new PortfolioRepository(storage, 'holdings');
    await first.add(holding);
    await first.update(holding.id, {
      amount: 0.5,
      averagePurchasePrice: 50_000,
    });

    const restored = new PortfolioRepository(storage, 'holdings');
    await restored.hydrate();

    expect(restored.getById(holding.id)).toEqual({
      ...holding,
      amount: 0.5,
      averagePurchasePrice: 50_000,
    });
  });

  it('rejects invalid holdings without changing current state', async () => {
    const repository = new PortfolioRepository(new MemoryStorage(), 'holdings');
    await repository.add(holding);

    await expect(
      repository.update(holding.id, { amount: -1 }),
    ).rejects.toThrow();
    expect(repository.getById(holding.id)?.amount).toBe(0.25);
  });

  it('generates an id for editor creation payloads', async () => {
    const repository = new PortfolioRepository(
      new MemoryStorage(),
      'holdings',
      () => 'generated-holding',
    );

    await repository.add({
      assetId: 'ethereum',
      symbol: 'eth',
      amount: 2,
    });

    expect(repository.getAll()[0]).toMatchObject({id: 'generated-holding'});
  });
});

describe('AlertRepository', () => {
  const alert: PriceAlert = {
    id: 'btc-above',
    assetId: 'bitcoin',
    symbol: 'btc',
    condition: 'above',
    targetPrice: 100_000,
    enabled: true,
    createdAt: '2026-08-20T12:00:00.000Z',
  };

  it('marks a triggered alert and disables it atomically', async () => {
    const repository = new AlertRepository(
      new MemoryStorage(),
      'alerts',
      () => fixedNow,
    );
    await repository.add(alert);

    await repository.markTriggered(alert.id);

    expect(repository.getById(alert.id)).toEqual({
      ...alert,
      enabled: false,
      triggeredAt: fixedNow.toISOString(),
    });
  });

  it('generates identity and creation time for editor payloads', async () => {
    const repository = new AlertRepository(
      new MemoryStorage(),
      'alerts',
      () => fixedNow,
      () => 'generated-alert',
    );

    await repository.add({
      assetId: 'ethereum',
      symbol: 'eth',
      condition: 'below',
      targetPrice: 2_000,
      enabled: true,
    });

    expect(repository.getAll()[0]).toMatchObject({
      id: 'generated-alert',
      createdAt: fixedNow.toISOString(),
    });
  });
});

describe('RecentSearchRepository', () => {
  it('moves repeated searches to the front case-insensitively', async () => {
    const repository = new RecentSearchRepository(
      new MemoryStorage(),
      'searches',
      () => fixedNow,
    );
    await repository.add('Bitcoin');
    await repository.add({
      query: 'ethereum',
      searchedAt: '2026-08-25T12:01:00.000Z',
    });
    await repository.add({
      query: ' bitcoin ',
      searchedAt: '2026-08-25T12:02:00.000Z',
    });

    expect(repository.getAll().map(item => item.query)).toEqual([
      'bitcoin',
      'ethereum',
    ]);
  });
});

describe('RecentlyViewedRepository', () => {
  const viewedAsset = (index: number): RecentlyViewedAsset => ({
    assetId: `asset-${index}`,
    symbol: `a${index}`,
    name: `Asset ${index}`,
    viewedAt: `2026-08-25T12:${String(index).padStart(2, '0')}:00.000Z`,
  });

  it('deduplicates, puts the latest view first, and keeps at most ten', async () => {
    const repository = new RecentlyViewedRepository(
      new MemoryStorage(),
      'viewed',
      () => fixedNow,
    );
    for (let index = 0; index < RECENTLY_VIEWED_LIMIT + 2; index += 1) {
      await repository.add(viewedAsset(index));
    }

    await repository.add({ ...viewedAsset(5), name: 'Asset Five' });

    expect(repository.getAll()).toHaveLength(RECENTLY_VIEWED_LIMIT);
    expect(repository.getAll()[0]).toMatchObject({
      assetId: 'asset-5',
      name: 'Asset Five',
    });
    expect(
      repository.getAll().filter(item => item.assetId === 'asset-5'),
    ).toHaveLength(1);
  });
});

describe('PreferencesRepository', () => {
  it('hydrates defaults and persists partial updates', async () => {
    const storage = new MemoryStorage();
    const repository = new PreferencesRepository(storage, 'preferences');

    await repository.hydrate();
    expect(repository.get()).toEqual(DEFAULT_USER_PREFERENCES);
    await repository.update({ currency: 'EUR', theme: 'dark' });

    const restored = new PreferencesRepository(storage, 'preferences');
    await restored.hydrate();
    expect(restored.get()).toEqual({
      ...DEFAULT_USER_PREFERENCES,
      currency: 'EUR',
      theme: 'dark',
    });
  });

  it('falls back safely when persisted preferences are malformed', async () => {
    const storage = new MemoryStorage();
    storage.values.set('preferences', JSON.stringify({ currency: 'DOGE' }));
    const repository = new PreferencesRepository(storage, 'preferences');

    const snapshot = await repository.hydrate();

    expect(snapshot.value).toEqual(DEFAULT_USER_PREFERENCES);
    expect(snapshot.error).toBeInstanceOf(RepositoryHydrationError);
  });

  it('reports writes that fail and preserves the last good value', async () => {
    const storage = new MemoryStorage();
    const repository = new PreferencesRepository(storage, 'preferences');
    await repository.hydrate();
    storage.writeError = new Error('disk full');

    await expect(repository.update({ currency: 'USD' })).rejects.toBeInstanceOf(
      RepositoryStorageError,
    );
    expect(repository.get().currency).toBe('CAD');
    expect(repository.getSnapshot().error).toBeInstanceOf(
      RepositoryStorageError,
    );
  });
});

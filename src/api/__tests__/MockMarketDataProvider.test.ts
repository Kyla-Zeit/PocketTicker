import {MockMarketDataProvider} from '../providers/MockMarketDataProvider';

describe('MockMarketDataProvider', () => {
  const provider = new MockMarketDataProvider({latencyMs: 0});

  it('provides a complete seeded demo market', async () => {
    const markets = await provider.getMarkets({currency: 'USD'});
    expect(markets).toHaveLength(10);
    expect(markets.map(asset => asset.id)).toEqual(
      expect.arrayContaining([
        'bitcoin',
        'ethereum',
        'solana',
        'usd-coin',
        'dogecoin',
        'cardano',
        'chainlink',
        'avalanche-2',
        'polygon-ecosystem-token',
        'litecoin',
      ]),
    );
    expect(markets.every(asset => (asset.sparkline?.length ?? 0) > 1)).toBe(true);
  });

  it('searches by ticker without case sensitivity', async () => {
    const results = await provider.searchAssets('BtC');
    expect(results[0]).toMatchObject({id: 'bitcoin', symbol: 'BTC'});
  });

  it('returns deterministic chart data ending at the current price', async () => {
    const [details, chart] = await Promise.all([
      provider.getAssetDetails('solana', {currency: 'CAD'}),
      provider.getMarketChart('solana', {currency: 'CAD', days: 30}),
    ]);
    expect(chart.length).toBeGreaterThan(30);
    expect(chart.at(-1)?.price).toBeCloseTo(details.currentPrice);
    expect(chart.every((point, index) => index === 0 || point.timestamp > chart[index - 1]!.timestamp)).toBe(true);
  });

  it('normalizes an unknown asset into a not-found domain error', async () => {
    await expect(provider.getAssetDetails('missing')).rejects.toMatchObject({
      code: 'not_found',
      retryable: false,
    });
  });
});

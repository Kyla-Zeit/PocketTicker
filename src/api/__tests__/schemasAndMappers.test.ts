import {
  mapCoinGeckoAssetDetails,
  mapCoinGeckoMarketAsset,
  mapCoinGeckoMarketChart,
} from '../mappers';
import {
  coinGeckoAssetDetailsSchema,
  coinGeckoMarketAssetSchema,
  coinGeckoMarketChartSchema,
} from '../schemas';

const marketFixture = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://example.com/bitcoin.png',
  current_price: 100_000,
  market_cap: 2_000_000_000_000,
  market_cap_rank: 1,
  total_volume: 40_000_000_000,
  high_24h: 102_000,
  low_24h: 96_000,
  price_change_24h: 2_500,
  price_change_percentage_24h: 2.56,
  last_updated: '2026-08-25T20:00:00.000Z',
  sparkline_in_7d: {price: [96_000, 98_000, 100_000]},
};

describe('CoinGecko runtime schemas and mappers', () => {
  it('rejects malformed market payloads instead of blindly casting them', () => {
    const result = coinGeckoMarketAssetSchema.safeParse({
      ...marketFixture,
      current_price: '100000',
    });
    expect(result.success).toBe(false);
  });

  it('maps a validated market asset into the internal model', () => {
    const parsed = coinGeckoMarketAssetSchema.parse(marketFixture);
    const asset = mapCoinGeckoMarketAsset(parsed);

    expect(asset).toMatchObject({
      id: 'bitcoin',
      symbol: 'BTC',
      currentPrice: 100_000,
      priceChangePercentage24h: 2.56,
      marketCapRank: 1,
      sparkline: [96_000, 98_000, 100_000],
      sparkline7d: [96_000, 98_000, 100_000],
    });
  });

  it('selects the requested currency when mapping asset details', () => {
    const parsed = coinGeckoAssetDetailsSchema.parse({
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      image: {large: 'https://example.com/ethereum.png'},
      description: {en: 'A programmable blockchain.'},
      links: {homepage: ['', 'https://ethereum.org']},
      market_cap_rank: 2,
      market_data: {
        current_price: {usd: 4_000, cad: 5_440},
        market_cap: {usd: 480_000_000_000, cad: 652_800_000_000},
        total_volume: {usd: 20_000_000_000, cad: 27_200_000_000},
        high_24h: {usd: 4_100, cad: 5_576},
        low_24h: {usd: 3_900, cad: 5_304},
        price_change_24h_in_currency: {usd: 100, cad: 136},
        price_change_percentage_24h: 2.56,
        circulating_supply: 120_000_000,
        total_supply: 120_000_000,
        max_supply: null,
        ath: {usd: 4_900, cad: 6_664},
        ath_change_percentage: {usd: -18.36, cad: -18.36},
        ath_date: {usd: '2021-11-10T14:24:19.604Z', cad: '2021-11-10T14:24:19.604Z'},
        atl: {usd: 0.43, cad: 0.58},
        atl_change_percentage: {usd: 930_000, cad: 930_000},
        atl_date: {usd: '2015-10-20T00:00:00.000Z', cad: '2015-10-20T00:00:00.000Z'},
        sparkline_7d: {price: [5_300, 5_440]},
      },
      last_updated: '2026-08-25T20:00:00.000Z',
    });

    const details = mapCoinGeckoAssetDetails(parsed, 'CAD');
    expect(details.currentPrice).toBe(5_440);
    expect(details.ath).toBe(6_664);
    expect(details.allTimeHigh).toBe(6_664);
    expect(details.atl).toBe(0.58);
    expect(details.homepage).toBe('https://ethereum.org');
  });

  it('sorts chart points chronologically', () => {
    const parsed = coinGeckoMarketChartSchema.parse({
      prices: [
        [300, 3],
        [100, 1],
        [200, 2],
      ],
    });
    expect(mapCoinGeckoMarketChart(parsed)).toEqual([
      {timestamp: 100, price: 1},
      {timestamp: 200, price: 2},
      {timestamp: 300, price: 3},
    ]);
  });
});

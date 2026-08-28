import type {
  AssetDetails,
  ChartDays,
  CurrencyCode,
  MarketAsset,
  MarketOrder,
  MarketPoint,
  SearchResult,
} from '../../types';
import {MarketDataError} from '../../types';
import type {
  GetAssetDetailsOptions,
  GetMarketChartOptions,
  GetMarketsParams,
  MarketDataProvider,
  MarketRequestOptions,
} from './MarketDataProvider';

const SEEDED_AT = '2026-08-25T20:00:00.000Z';

const CURRENCY_RATES: Readonly<Record<CurrencyCode, number>> = {
  USD: 1,
  CAD: 1.36,
  EUR: 0.92,
  GBP: 0.78,
};

interface MockAssetSeed {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string;
  currentPrice: number;
  priceChangePercentage24h: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  totalSupply?: number;
  maxSupply?: number;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  description: string;
  homepage: string;
  volatility: number;
}

export const MOCK_MARKET_SEEDS: readonly MockAssetSeed[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    imageUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    currentPrice: 112_480.32,
    priceChangePercentage24h: 2.47,
    marketCap: 2_239_000_000_000,
    marketCapRank: 1,
    totalVolume: 51_300_000_000,
    high24h: 114_201.18,
    low24h: 108_932.44,
    circulatingSupply: 19_905_831,
    totalSupply: 19_905_831,
    maxSupply: 21_000_000,
    ath: 123_091.61,
    athDate: '2026-07-14T07:56:01.937Z',
    atl: 67.81,
    atlDate: '2013-07-06T00:00:00.000Z',
    description:
      'Bitcoin is a decentralized digital currency secured by a proof-of-work network and a fixed maximum supply.',
    homepage: 'https://bitcoin.org',
    volatility: 0.035,
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    imageUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    currentPrice: 4_782.16,
    priceChangePercentage24h: 1.84,
    marketCap: 577_190_000_000,
    marketCapRank: 2,
    totalVolume: 31_850_000_000,
    high24h: 4_891.22,
    low24h: 4_611.09,
    circulatingSupply: 120_704_122,
    totalSupply: 120_704_122,
    ath: 5_202.48,
    athDate: '2026-08-13T18:42:00.000Z',
    atl: 0.432979,
    atlDate: '2015-10-20T00:00:00.000Z',
    description:
      'Ethereum is a programmable blockchain for decentralized applications and digital assets.',
    homepage: 'https://ethereum.org',
    volatility: 0.046,
  },
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USDC',
    imageUrl: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
    currentPrice: 0.9998,
    priceChangePercentage24h: -0.02,
    marketCap: 71_490_000_000,
    marketCapRank: 6,
    totalVolume: 12_760_000_000,
    high24h: 1.001,
    low24h: 0.9989,
    circulatingSupply: 71_503_400_000,
    totalSupply: 71_503_400_000,
    ath: 1.17,
    athDate: '2019-05-08T00:40:28.300Z',
    atl: 0.877647,
    atlDate: '2023-03-11T08:02:13.981Z',
    description:
      'USDC is a reserve-backed digital dollar designed to track the value of the United States dollar.',
    homepage: 'https://www.circle.com/usdc',
    volatility: 0.0015,
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    imageUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    currentPrice: 211.47,
    priceChangePercentage24h: 4.32,
    marketCap: 114_830_000_000,
    marketCapRank: 5,
    totalVolume: 8_220_000_000,
    high24h: 216.09,
    low24h: 198.72,
    circulatingSupply: 543_022_000,
    totalSupply: 610_317_000,
    ath: 293.31,
    athDate: '2025-01-19T11:15:27.957Z',
    atl: 0.500801,
    atlDate: '2020-05-11T19:35:23.449Z',
    description:
      'Solana is a high-throughput smart-contract network designed for fast, low-cost applications.',
    homepage: 'https://solana.com',
    volatility: 0.065,
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    imageUrl: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    currentPrice: 0.2364,
    priceChangePercentage24h: -1.73,
    marketCap: 35_720_000_000,
    marketCapRank: 9,
    totalVolume: 2_910_000_000,
    high24h: 0.2448,
    low24h: 0.2291,
    circulatingSupply: 151_100_000_000,
    totalSupply: 151_100_000_000,
    ath: 0.731578,
    athDate: '2021-05-08T05:08:23.458Z',
    atl: 0.0000869,
    atlDate: '2015-05-06T00:00:00.000Z',
    description:
      'Dogecoin is an open-source peer-to-peer cryptocurrency that began as a community-driven project.',
    homepage: 'https://dogecoin.com',
    volatility: 0.08,
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    imageUrl: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    currentPrice: 0.884,
    priceChangePercentage24h: 0.91,
    marketCap: 31_720_000_000,
    marketCapRank: 10,
    totalVolume: 1_540_000_000,
    high24h: 0.902,
    low24h: 0.851,
    circulatingSupply: 35_882_000_000,
    totalSupply: 44_995_000_000,
    maxSupply: 45_000_000_000,
    ath: 3.09,
    athDate: '2021-09-02T06:00:10.474Z',
    atl: 0.01925275,
    atlDate: '2020-03-13T02:22:55.044Z',
    description:
      'Cardano is a proof-of-stake blockchain developed through a research-led engineering process.',
    homepage: 'https://cardano.org',
    volatility: 0.06,
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    imageUrl: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    currentPrice: 25.37,
    priceChangePercentage24h: 3.06,
    marketCap: 17_210_000_000,
    marketCapRank: 14,
    totalVolume: 1_210_000_000,
    high24h: 25.91,
    low24h: 24.18,
    circulatingSupply: 678_100_000,
    totalSupply: 1_000_000_000,
    maxSupply: 1_000_000_000,
    ath: 52.7,
    athDate: '2021-05-10T00:13:57.214Z',
    atl: 0.148183,
    atlDate: '2017-11-29T00:00:00.000Z',
    description:
      'Chainlink is a decentralized oracle network that connects smart contracts with external data.',
    homepage: 'https://chain.link',
    volatility: 0.058,
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    imageUrl: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    currentPrice: 31.62,
    priceChangePercentage24h: -0.86,
    marketCap: 13_320_000_000,
    marketCapRank: 18,
    totalVolume: 612_000_000,
    high24h: 32.71,
    low24h: 30.88,
    circulatingSupply: 421_250_000,
    totalSupply: 463_100_000,
    maxSupply: 720_000_000,
    ath: 144.96,
    athDate: '2021-11-21T14:18:56.538Z',
    atl: 2.8,
    atlDate: '2020-12-31T13:15:21.540Z',
    description:
      'Avalanche is a smart-contract platform built around a family of interoperable blockchain networks.',
    homepage: 'https://avax.network',
    volatility: 0.07,
  },
  {
    id: 'polygon-ecosystem-token',
    symbol: 'POL',
    name: 'Polygon',
    imageUrl: 'https://assets.coingecko.com/coins/images/32440/large/polygon.png',
    currentPrice: 0.291,
    priceChangePercentage24h: 1.21,
    marketCap: 3_050_000_000,
    marketCapRank: 46,
    totalVolume: 238_000_000,
    high24h: 0.299,
    low24h: 0.281,
    circulatingSupply: 10_480_000_000,
    totalSupply: 10_480_000_000,
    ath: 1.29,
    athDate: '2024-03-13T18:55:06.692Z',
    atl: 0.1533,
    atlDate: '2026-04-08T16:12:00.000Z',
    description:
      'POL is the utility token supporting the Polygon ecosystem of Ethereum scaling networks.',
    homepage: 'https://polygon.technology',
    volatility: 0.068,
  },
  {
    id: 'litecoin',
    symbol: 'LTC',
    name: 'Litecoin',
    imageUrl: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
    currentPrice: 122.84,
    priceChangePercentage24h: -2.14,
    marketCap: 9_380_000_000,
    marketCapRank: 24,
    totalVolume: 884_000_000,
    high24h: 126.91,
    low24h: 120.77,
    circulatingSupply: 76_350_000,
    totalSupply: 84_000_000,
    maxSupply: 84_000_000,
    ath: 410.26,
    athDate: '2021-05-10T03:13:07.904Z',
    atl: 1.15,
    atlDate: '2015-01-14T00:00:00.000Z',
    description:
      'Litecoin is a peer-to-peer digital currency derived from Bitcoin with faster block confirmation times.',
    homepage: 'https://litecoin.org',
    volatility: 0.045,
  },
] as const;

export interface MockMarketDataProviderOptions {
  latencyMs?: number;
}

function convert(value: number, currency: CurrencyCode): number {
  return value * CURRENCY_RATES[currency];
}

function priceChange24h(seed: MockAssetSeed): number {
  const previousPrice = seed.currentPrice / (1 + seed.priceChangePercentage24h / 100);
  return seed.currentPrice - previousPrice;
}

function pointCount(days: ChartDays): number {
  if (days === 1) {
    return 49;
  }
  if (days <= 30) {
    return days * 4 + 1;
  }
  return days + 1;
}

function stablePhase(id: string): number {
  return [...id].reduce((total, character) => total + character.charCodeAt(0), 0) % 17;
}

function generateChart(
  seed: MockAssetSeed,
  days: ChartDays,
  currency: CurrencyCode,
): MarketPoint[] {
  const count = pointCount(days);
  const end = Date.parse(SEEDED_AT);
  const duration = days * 24 * 60 * 60 * 1000;
  const start = end - duration;
  const phase = stablePhase(seed.id);
  const longTermMove = Math.max(-0.22, Math.min(0.48, seed.volatility * Math.log2(days + 1)));

  return Array.from({length: count}, (_, index) => {
    const progress = count === 1 ? 1 : index / (count - 1);
    const wave =
      Math.sin(progress * Math.PI * 4 + phase) * seed.volatility * 0.55 +
      Math.sin(progress * Math.PI * 11 + phase / 2) * seed.volatility * 0.2;
    const multiplier = 1 - longTermMove * (1 - progress) + wave * (1 - progress);
    return {
      timestamp: Math.round(start + duration * progress),
      price: convert(
        index === count - 1 ? seed.currentPrice : seed.currentPrice * multiplier,
        currency,
      ),
    };
  });
}

function toMarketAsset(seed: MockAssetSeed, currency: CurrencyCode): MarketAsset {
  const sparkline = generateChart(seed, 7, currency).map(point => point.price);
  return {
    id: seed.id,
    symbol: seed.symbol,
    name: seed.name,
    imageUrl: seed.imageUrl,
    currentPrice: convert(seed.currentPrice, currency),
    priceChange24h: convert(priceChange24h(seed), currency),
    priceChangePercentage24h: seed.priceChangePercentage24h,
    marketCap: convert(seed.marketCap, currency),
    marketCapRank: seed.marketCapRank,
    totalVolume: convert(seed.totalVolume, currency),
    high24h: convert(seed.high24h, currency),
    low24h: convert(seed.low24h, currency),
    lastUpdated: SEEDED_AT,
    sparkline,
    sparkline7d: sparkline,
  };
}

function toAssetDetails(seed: MockAssetSeed, currency: CurrencyCode): AssetDetails {
  const currentPrice = convert(seed.currentPrice, currency);
  const ath = convert(seed.ath, currency);
  const atl = convert(seed.atl, currency);
  return {
    ...toMarketAsset(seed, currency),
    circulatingSupply: seed.circulatingSupply,
    totalSupply: seed.totalSupply,
    maxSupply: seed.maxSupply,
    ath,
    allTimeHigh: ath,
    athChangePercentage: ((currentPrice - ath) / ath) * 100,
    athDate: seed.athDate,
    atl,
    allTimeLow: atl,
    atlChangePercentage: ((currentPrice - atl) / atl) * 100,
    atlDate: seed.atlDate,
    description: seed.description,
    homepage: seed.homepage,
  };
}

function sortMarkets(markets: MarketAsset[], order: MarketOrder): MarketAsset[] {
  const comparators: Record<MarketOrder, (left: MarketAsset, right: MarketAsset) => number> = {
    market_cap_desc: (left, right) => right.marketCap - left.marketCap,
    market_cap_asc: (left, right) => left.marketCap - right.marketCap,
    price_desc: (left, right) => right.currentPrice - left.currentPrice,
    price_asc: (left, right) => left.currentPrice - right.currentPrice,
    change_desc: (left, right) => right.priceChangePercentage24h - left.priceChangePercentage24h,
    change_asc: (left, right) => left.priceChangePercentage24h - right.priceChangePercentage24h,
  };
  return [...markets].sort(comparators[order]);
}

export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = 'mock' as const;
  private readonly latencyMs: number;

  constructor(options: MockMarketDataProviderOptions = {}) {
    this.latencyMs = Math.max(0, options.latencyMs ?? 120);
  }

  async getMarkets(params: GetMarketsParams = {}): Promise<MarketAsset[]> {
    await this.wait(params.signal);
    const currency = params.currency ?? 'CAD';
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const perPage = Math.max(1, Math.trunc(params.perPage ?? 50));
    const order = params.order ?? 'market_cap_desc';
    const start = (page - 1) * perPage;
    return sortMarkets(
      MOCK_MARKET_SEEDS.map(seed => toMarketAsset(seed, currency)),
      order,
    ).slice(start, start + perPage);
  }

  async searchAssets(
    query: string,
    options: MarketRequestOptions = {},
  ): Promise<SearchResult[]> {
    await this.wait(options.signal);
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) {
      return [];
    }
    return MOCK_MARKET_SEEDS.filter(
      seed =>
        seed.name.toLocaleLowerCase().includes(normalized) ||
        seed.symbol.toLocaleLowerCase().includes(normalized) ||
        seed.id.includes(normalized),
    )
      .sort((left, right) => {
        const leftStarts =
          left.name.toLocaleLowerCase().startsWith(normalized) ||
          left.symbol.toLocaleLowerCase().startsWith(normalized);
        const rightStarts =
          right.name.toLocaleLowerCase().startsWith(normalized) ||
          right.symbol.toLocaleLowerCase().startsWith(normalized);
        return Number(rightStarts) - Number(leftStarts) || left.marketCapRank - right.marketCapRank;
      })
      .map(seed => ({
        id: seed.id,
        symbol: seed.symbol,
        name: seed.name,
        imageUrl: seed.imageUrl,
        marketCapRank: seed.marketCapRank,
      }));
  }

  async getAssetDetails(
    id: string,
    options: GetAssetDetailsOptions = {},
  ): Promise<AssetDetails> {
    await this.wait(options.signal);
    const seed = this.findSeed(id);
    return toAssetDetails(seed, options.currency ?? 'CAD');
  }

  async getMarketChart(
    id: string,
    options: GetMarketChartOptions,
  ): Promise<MarketPoint[]> {
    await this.wait(options.signal);
    const seed = this.findSeed(id);
    return generateChart(seed, options.days, options.currency ?? 'CAD');
  }

  private findSeed(id: string): MockAssetSeed {
    const normalized = id.trim().toLocaleLowerCase();
    const seed = MOCK_MARKET_SEEDS.find(
      candidate =>
        candidate.id === normalized ||
        candidate.symbol.toLocaleLowerCase() === normalized,
    );
    if (!seed) {
      throw new MarketDataError('not_found', 'The requested demo asset was not found.', {
        retryable: false,
      });
    }
    return seed;
  }

  private async wait(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw new MarketDataError('aborted', 'The market data request was cancelled.', {
        retryable: false,
      });
    }
    if (this.latencyMs === 0) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, this.latencyMs);
      const onAbort = () => {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', onAbort);
        reject(
          new MarketDataError('aborted', 'The market data request was cancelled.', {
            retryable: false,
          }),
        );
      };
      signal?.addEventListener('abort', onAbort, {once: true});
    });
  }
}

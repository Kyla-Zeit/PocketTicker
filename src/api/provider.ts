import Config from 'react-native-config';
import {CoinGeckoMarketDataProvider} from './providers/CoinGeckoMarketDataProvider';
import {MockMarketDataProvider} from './providers/MockMarketDataProvider';
import type {
  MarketDataProvider,
  MarketDataProviderName,
} from './providers/MarketDataProvider';

export interface CreateMarketDataProviderOptions {
  apiKey?: string;
  timeoutMs?: number;
  mockLatencyMs?: number;
}

export function resolveMarketDataProviderName(
  configuredValue: unknown,
): MarketDataProviderName {
  return configuredValue === 'coingecko' ? 'coingecko' : 'mock';
}

function configuredProviderName(): MarketDataProviderName {
  try {
    return resolveMarketDataProviderName(Config?.MARKET_DATA_PROVIDER);
  } catch {
    return 'mock';
  }
}

function configuredApiKey(): string | undefined {
  try {
    return Config?.COINGECKO_API_KEY?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function createMarketDataProvider(
  mode: MarketDataProviderName = configuredProviderName(),
  options: CreateMarketDataProviderOptions = {},
): MarketDataProvider {
  if (mode === 'coingecko') {
    return new CoinGeckoMarketDataProvider({
      apiKey: options.apiKey ?? configuredApiKey(),
      timeoutMs: options.timeoutMs,
    });
  }
  return new MockMarketDataProvider({latencyMs: options.mockLatencyMs});
}

export const marketDataProvider: MarketDataProvider = createMarketDataProvider();

export function getMarketDataProvider(): MarketDataProvider {
  return marketDataProvider;
}

export const marketDataProviderName = marketDataProvider.name;

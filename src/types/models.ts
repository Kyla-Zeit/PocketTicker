export const CURRENCY_CODES = ['CAD', 'USD', 'EUR', 'GBP'] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const CHART_TIMEFRAMES = ['1D', '7D', '30D', '90D', '1Y'] as const;

export type ChartTimeframe = (typeof CHART_TIMEFRAMES)[number];
export type ChartDays = 1 | 7 | 30 | 90 | 365;

export const MARKET_ORDERS = [
  'market_cap_desc',
  'market_cap_asc',
  'price_desc',
  'price_asc',
  'change_desc',
  'change_asc',
] as const;

export type MarketOrder = (typeof MARKET_ORDERS)[number];

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string;
  currentPrice: number;
  priceChange24h?: number;
  priceChangePercentage24h: number;
  marketCap: number;
  marketCapRank?: number;
  totalVolume: number;
  high24h?: number;
  low24h?: number;
  lastUpdated: string;
  sparkline?: number[];
  /** Backward-compatible descriptive alias used by compact trend components. */
  sparkline7d?: number[];
}

export interface AssetDetails extends MarketAsset {
  circulatingSupply: number;
  totalSupply?: number;
  maxSupply?: number;
  ath: number;
  /** Descriptive alias for ath. */
  allTimeHigh: number;
  athChangePercentage?: number;
  athDate?: string;
  atl: number;
  /** Descriptive alias for atl. */
  allTimeLow: number;
  atlChangePercentage?: number;
  atlDate?: string;
  description: string;
  homepage?: string;
}

export interface MarketPoint {
  timestamp: number;
  price: number;
}

export interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  marketCapRank?: number;
}

export interface WatchlistItem {
  assetId: string;
  addedAt: string;
}

export interface Holding {
  id: string;
  assetId: string;
  symbol: string;
  amount: number;
  averagePurchasePrice?: number;
}

export type AlertCondition = 'above' | 'below';

export interface PriceAlert {
  id: string;
  assetId: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  enabled: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface UserPreferences {
  currency: CurrencyCode;
  theme: ThemePreference;
  hideBalances: boolean;
  requireBiometricUnlock: boolean;
  notificationsEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

export interface RecentSearch {
  query: string;
  searchedAt: string;
}

export interface RecentlyViewedAsset {
  assetId: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  viewedAt: string;
}

export interface PortfolioHoldingValue {
  holding: Holding;
  currentPrice: number;
  marketValue: number;
  costBasis?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
  allocationPercentage: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis?: number;
  totalGainLoss?: number;
  totalGainLossPercentage?: number;
  holdings: PortfolioHoldingValue[];
}

export interface AlertEvaluation {
  isTriggered: boolean;
  reason: 'disabled' | 'already_triggered' | 'condition_met' | 'condition_not_met';
}

export const DEFAULT_USER_PREFERENCES: Readonly<UserPreferences> = {
  currency: 'CAD',
  theme: 'system',
  hideBalances: false,
  requireBiometricUnlock: false,
  notificationsEnabled: true,
  hasCompletedOnboarding: false,
};

export const CHART_DAYS_BY_TIMEFRAME: Readonly<
  Record<ChartTimeframe, ChartDays>
> = {
  '1D': 1,
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '1Y': 365,
};

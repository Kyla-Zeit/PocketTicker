import { z } from 'zod';

import type {
  Holding,
  PriceAlert,
  RecentSearch,
  RecentlyViewedAsset,
  UserPreferences,
  WatchlistItem,
} from '../types';

const isoDateTimeSchema = z.string().datetime();

export const watchlistItemSchema: z.ZodType<WatchlistItem> = z.object({
  assetId: z.string().trim().min(1),
  addedAt: isoDateTimeSchema,
});

export const holdingSchema: z.ZodType<Holding> = z.object({
  id: z.string().trim().min(1),
  assetId: z.string().trim().min(1),
  symbol: z.string().trim().min(1),
  amount: z.number().finite().positive(),
  averagePurchasePrice: z.number().finite().positive().optional(),
});

export const priceAlertSchema: z.ZodType<PriceAlert> = z.object({
  id: z.string().trim().min(1),
  assetId: z.string().trim().min(1),
  symbol: z.string().trim().min(1),
  condition: z.enum(['above', 'below']),
  targetPrice: z.number().finite().positive(),
  enabled: z.boolean(),
  createdAt: isoDateTimeSchema,
  triggeredAt: isoDateTimeSchema.optional(),
});

export const recentSearchSchema: z.ZodType<RecentSearch> = z.object({
  query: z.string().trim().min(1),
  searchedAt: isoDateTimeSchema,
});

export const recentlyViewedAssetSchema: z.ZodType<RecentlyViewedAsset> =
  z.object({
    assetId: z.string().trim().min(1),
    symbol: z.string().trim().min(1),
    name: z.string().trim().min(1),
    imageUrl: z.string().trim().min(1).optional(),
    viewedAt: isoDateTimeSchema,
  });

export const userPreferencesSchema: z.ZodType<UserPreferences> = z.object({
  currency: z.enum(['CAD', 'USD', 'EUR', 'GBP']),
  theme: z.enum(['system', 'light', 'dark']),
  hideBalances: z.boolean(),
  requireBiometricUnlock: z.boolean(),
  notificationsEnabled: z.boolean(),
  hasCompletedOnboarding: z.boolean(),
});

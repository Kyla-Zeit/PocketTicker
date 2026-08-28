import {z} from 'zod';

const finiteNumber = z.number().finite();
const nullableFiniteNumber = finiteNumber.nullable();
const currencyNumberMap = z.record(z.string(), nullableFiniteNumber);
const currencyDateMap = z.record(z.string(), z.string().nullable());

export const coinGeckoMarketAssetSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  image: z.string(),
  current_price: finiteNumber,
  market_cap: nullableFiniteNumber,
  market_cap_rank: finiteNumber.int().positive().nullable().optional(),
  total_volume: nullableFiniteNumber,
  high_24h: nullableFiniteNumber.optional(),
  low_24h: nullableFiniteNumber.optional(),
  price_change_24h: nullableFiniteNumber.optional(),
  price_change_percentage_24h: nullableFiniteNumber,
  circulating_supply: nullableFiniteNumber.optional(),
  total_supply: nullableFiniteNumber.optional(),
  max_supply: nullableFiniteNumber.optional(),
  ath: nullableFiniteNumber.optional(),
  ath_change_percentage: nullableFiniteNumber.optional(),
  ath_date: z.string().nullable().optional(),
  atl: nullableFiniteNumber.optional(),
  atl_change_percentage: nullableFiniteNumber.optional(),
  atl_date: z.string().nullable().optional(),
  last_updated: z.string().min(1),
  sparkline_in_7d: z
    .object({
      price: z.array(finiteNumber),
    })
    .optional(),
});

export const coinGeckoMarketsSchema = z.array(coinGeckoMarketAssetSchema);

export const coinGeckoSearchResultSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  api_symbol: z.string().optional(),
  symbol: z.string().min(1),
  market_cap_rank: finiteNumber.int().positive().nullable().optional(),
  thumb: z.string().optional(),
  large: z.string().optional(),
});

export const coinGeckoSearchResponseSchema = z.object({
  coins: z.array(coinGeckoSearchResultSchema),
});

export const coinGeckoAssetDetailsSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  image: z.object({
    thumb: z.string().optional(),
    small: z.string().optional(),
    large: z.string().optional(),
  }),
  description: z.object({
    en: z.string().optional(),
  }),
  links: z
    .object({
      homepage: z.array(z.string()).optional(),
    })
    .optional(),
  market_cap_rank: finiteNumber.int().positive().nullable().optional(),
  market_data: z.object({
    current_price: currencyNumberMap,
    market_cap: currencyNumberMap,
    total_volume: currencyNumberMap,
    high_24h: currencyNumberMap.optional(),
    low_24h: currencyNumberMap.optional(),
    price_change_24h_in_currency: currencyNumberMap.optional(),
    price_change_percentage_24h: nullableFiniteNumber,
    circulating_supply: nullableFiniteNumber,
    total_supply: nullableFiniteNumber,
    max_supply: nullableFiniteNumber,
    ath: currencyNumberMap,
    ath_change_percentage: currencyNumberMap.optional(),
    ath_date: currencyDateMap.optional(),
    atl: currencyNumberMap,
    atl_change_percentage: currencyNumberMap.optional(),
    atl_date: currencyDateMap.optional(),
    sparkline_7d: z
      .object({
        price: z.array(finiteNumber),
      })
      .optional(),
  }),
  last_updated: z.string().min(1),
});

export const coinGeckoMarketChartSchema = z.object({
  prices: z.array(z.tuple([finiteNumber, finiteNumber])),
});

export type CoinGeckoMarketAsset = z.infer<
  typeof coinGeckoMarketAssetSchema
>;
export type CoinGeckoSearchResponse = z.infer<
  typeof coinGeckoSearchResponseSchema
>;
export type CoinGeckoAssetDetails = z.infer<
  typeof coinGeckoAssetDetailsSchema
>;
export type CoinGeckoMarketChart = z.infer<
  typeof coinGeckoMarketChartSchema
>;

import type {
  Holding,
  MarketAsset,
  PortfolioHoldingValue,
  PortfolioSummary,
} from '../types';

export type PriceLookup =
  | Readonly<Record<string, number | undefined>>
  | ReadonlyMap<string, number>;

function finiteOrZero(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function priceForAsset(prices: PriceLookup, assetId: string): number {
  if (prices instanceof Map) {
    return finiteOrZero(prices.get(assetId));
  }
  return finiteOrZero(
    (prices as Readonly<Record<string, number | undefined>>)[assetId],
  );
}

export function marketAssetsToPriceLookup(
  assets: readonly MarketAsset[],
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    assets.map(asset => [asset.id, asset.currentPrice]),
  );
}

export function calculateHoldingMarketValue(
  holding: Pick<Holding, 'amount'>,
  currentPrice: number,
): number {
  const amount = finiteOrZero(holding.amount);
  const price = finiteOrZero(currentPrice);
  return amount * price;
}

export function calculateHoldingCostBasis(
  holding: Pick<Holding, 'amount' | 'averagePurchasePrice'>,
): number | undefined {
  if (
    typeof holding.averagePurchasePrice !== 'number' ||
    !Number.isFinite(holding.averagePurchasePrice)
  ) {
    return undefined;
  }
  return finiteOrZero(holding.amount) * holding.averagePurchasePrice;
}

export function calculateGainLoss(
  marketValue: number,
  costBasis: number | undefined,
): {gainLoss?: number; gainLossPercentage?: number} {
  if (costBasis === undefined || !Number.isFinite(costBasis)) {
    return {};
  }
  const gainLoss = finiteOrZero(marketValue) - costBasis;
  return {
    gainLoss,
    gainLossPercentage: costBasis === 0 ? 0 : (gainLoss / costBasis) * 100,
  };
}

export function calculatePortfolioValue(
  holdings: readonly Holding[],
  prices: PriceLookup,
): number {
  return holdings.reduce(
    (total, holding) =>
      total + calculateHoldingMarketValue(holding, priceForAsset(prices, holding.assetId)),
    0,
  );
}

export function calculatePortfolioSummary(
  holdings: readonly Holding[],
  prices: PriceLookup,
): PortfolioSummary {
  const values = holdings.map(holding => {
    const currentPrice = priceForAsset(prices, holding.assetId);
    const marketValue = calculateHoldingMarketValue(holding, currentPrice);
    const costBasis = calculateHoldingCostBasis(holding);
    return {
      holding,
      currentPrice,
      marketValue,
      costBasis,
      ...calculateGainLoss(marketValue, costBasis),
    };
  });
  const totalValue = values.reduce((total, value) => total + value.marketValue, 0);
  const valuesWithCostBasis = values.filter(
    (value): value is typeof value & {costBasis: number} =>
      value.costBasis !== undefined,
  );
  const hasCostBasis = valuesWithCostBasis.length > 0;
  const totalCostBasis = hasCostBasis
    ? valuesWithCostBasis.reduce((total, value) => total + value.costBasis, 0)
    : undefined;
  const marketValueWithCostBasis = valuesWithCostBasis.reduce(
    (total, value) => total + value.marketValue,
    0,
  );
  const totalGainLoss =
    totalCostBasis === undefined
      ? undefined
      : marketValueWithCostBasis - totalCostBasis;
  const totalGainLossPercentage =
    totalCostBasis === undefined
      ? undefined
      : totalCostBasis === 0
        ? 0
        : ((totalGainLoss ?? 0) / totalCostBasis) * 100;
  const portfolioHoldings: PortfolioHoldingValue[] = values.map(value => ({
    ...value,
    allocationPercentage:
      totalValue === 0 ? 0 : (value.marketValue / totalValue) * 100,
  }));

  return {
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercentage,
    holdings: portfolioHoldings,
  };
}

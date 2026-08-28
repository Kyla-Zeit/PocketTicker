import type {Holding} from '../../types';
import {
  calculateHoldingCostBasis,
  calculatePortfolioSummary,
  calculatePortfolioValue,
} from '../portfolio';

const holdings: Holding[] = [
  {
    id: 'holding-btc',
    assetId: 'bitcoin',
    symbol: 'BTC',
    amount: 0.25,
    averagePurchasePrice: 80_000,
  },
  {
    id: 'holding-eth',
    assetId: 'ethereum',
    symbol: 'ETH',
    amount: 2,
    averagePurchasePrice: 3_000,
  },
  {
    id: 'holding-sol',
    assetId: 'solana',
    symbol: 'SOL',
    amount: 10,
  },
];

const prices = {bitcoin: 100_000, ethereum: 4_000, solana: 200};

describe('portfolio calculations', () => {
  it('calculates holding and complete portfolio values', () => {
    expect(calculateHoldingCostBasis(holdings[0]!)).toBe(20_000);
    expect(calculatePortfolioValue(holdings, prices)).toBe(35_000);
  });

  it('calculates cost-aware gain/loss and allocation without inventing cost basis', () => {
    const summary = calculatePortfolioSummary(holdings, prices);
    expect(summary.totalValue).toBe(35_000);
    expect(summary.totalCostBasis).toBe(26_000);
    expect(summary.totalGainLoss).toBe(7_000);
    expect(summary.holdings[0]).toMatchObject({
      marketValue: 25_000,
      costBasis: 20_000,
      gainLoss: 5_000,
    });
    expect(summary.holdings[2]?.costBasis).toBeUndefined();
    expect(
      summary.holdings.reduce(
        (total, holding) => total + holding.allocationPercentage,
        0,
      ),
    ).toBeCloseTo(100);
  });

  it('handles an empty portfolio without division by zero', () => {
    expect(calculatePortfolioSummary([], {})).toEqual({
      totalValue: 0,
      totalCostBasis: undefined,
      totalGainLoss: undefined,
      totalGainLossPercentage: undefined,
      holdings: [],
    });
  });
});

import type {PriceAlert} from '../../types';
import {
  evaluateAlertCondition,
  evaluatePriceAlert,
  isAlertConditionMet,
  markAlertTriggered,
} from '../alerts';

function alert(overrides: Partial<PriceAlert> = {}): PriceAlert {
  return {
    id: 'alert-1',
    assetId: 'bitcoin',
    symbol: 'BTC',
    condition: 'above',
    targetPrice: 100_000,
    enabled: true,
    createdAt: '2026-08-25T20:00:00.000Z',
    ...overrides,
  };
}

describe('price alert evaluation', () => {
  it('treats the threshold itself as a crossing for both conditions', () => {
    expect(isAlertConditionMet('above', 100, 100)).toBe(true);
    expect(isAlertConditionMet('below', 100, 100)).toBe(true);
  });

  it('evaluates enabled alerts against the current price', () => {
    expect(evaluateAlertCondition(alert(), 100_001)).toBe(true);
    expect(evaluateAlertCondition(alert(), 99_999)).toBe(false);
    expect(evaluateAlertCondition(alert({condition: 'below'}), 99_999)).toBe(true);
  });

  it('does not retrigger disabled or previously triggered alerts', () => {
    expect(evaluatePriceAlert(alert({enabled: false}), 120_000)).toEqual({
      isTriggered: false,
      reason: 'disabled',
    });
    expect(
      evaluatePriceAlert(
        alert({triggeredAt: '2026-08-25T21:00:00.000Z'}),
        120_000,
      ),
    ).toEqual({isTriggered: false, reason: 'already_triggered'});
  });

  it('marks a triggered alert atomically', () => {
    expect(markAlertTriggered(alert(), '2026-08-25T21:00:00.000Z')).toMatchObject({
      enabled: false,
      triggeredAt: '2026-08-25T21:00:00.000Z',
    });
  });
});

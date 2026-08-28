import type { PriceAlert } from '../../types';
import { checkPriceAlerts } from '../alertEngine';

const aboveAlert: PriceAlert = {
  id: 'alert-1',
  assetId: 'bitcoin',
  symbol: 'BTC',
  condition: 'above',
  targetPrice: 100_000,
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('checkPriceAlerts', () => {
  it('marks a crossed alert and displays one notification', async () => {
    const markTriggered = jest.fn().mockResolvedValue(undefined);
    const displayPriceAlert = jest.fn().mockResolvedValue(true);
    const getAssetDetails = jest.fn().mockResolvedValue({
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'btc',
      currentPrice: 101_250,
    });

    const result = await checkPriceAlerts({
      alerts: {
        hydrate: jest.fn().mockResolvedValue(undefined),
        getSnapshot: () => ({ items: [aboveAlert], error: null }),
        markTriggered,
      },
      marketData: { getAssetDetails },
      notifications: { displayPriceAlert },
      currency: 'CAD',
      now: () => new Date('2026-02-03T04:05:06.000Z'),
    });

    expect(markTriggered).toHaveBeenCalledWith(
      'alert-1',
      '2026-02-03T04:05:06.000Z',
    );
    expect(displayPriceAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'bitcoin',
        currentPrice: 101_250,
        targetPrice: 100_000,
      }),
    );
    expect(result.triggeredAlertIds).toEqual(['alert-1']);
    expect(result.notificationsDisplayed).toBe(1);
  });

  it('skips disabled, already-triggered, and unmet alerts', async () => {
    const alerts: PriceAlert[] = [
      { ...aboveAlert, enabled: false },
      { ...aboveAlert, id: 'alert-2', triggeredAt: '2026-01-02T00:00:00.000Z' },
      { ...aboveAlert, id: 'alert-3' },
    ];
    const markTriggered = jest.fn();
    const displayPriceAlert = jest.fn();

    const result = await checkPriceAlerts({
      alerts: {
        hydrate: jest.fn().mockResolvedValue(undefined),
        getSnapshot: () => ({ items: alerts, error: null }),
        markTriggered,
      },
      marketData: {
        getAssetDetails: jest.fn().mockResolvedValue({
          id: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'btc',
          currentPrice: 99_000,
        }),
      },
      notifications: { displayPriceAlert },
    });

    expect(result.alertsChecked).toBe(1);
    expect(result.triggeredAlertIds).toEqual([]);
    expect(markTriggered).not.toHaveBeenCalled();
    expect(displayPriceAlert).not.toHaveBeenCalled();
  });

  it('isolates provider failures by asset', async () => {
    const alerts: PriceAlert[] = [
      aboveAlert,
      { ...aboveAlert, id: 'alert-2', assetId: 'ethereum', symbol: 'ETH' },
    ];
    const getAssetDetails = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'eth',
        currentPrice: 101_000,
      });

    const result = await checkPriceAlerts({
      alerts: {
        hydrate: jest.fn().mockResolvedValue(undefined),
        getSnapshot: () => ({ items: alerts, error: null }),
        markTriggered: jest.fn().mockResolvedValue(undefined),
      },
      marketData: { getAssetDetails },
      notifications: { displayPriceAlert: jest.fn().mockResolvedValue(false) },
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.assetId).toBe('bitcoin');
    expect(result.triggeredAlertIds).toEqual(['alert-2']);
  });
});

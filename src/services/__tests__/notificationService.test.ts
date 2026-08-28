jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {},
  AndroidImportance: { HIGH: 4 },
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));

import { AuthorizationStatus } from '@notifee/react-native';
import { NotificationService } from '../notificationService';

const createNative = (authorizationStatus: AuthorizationStatus) => ({
  createChannel: jest.fn().mockResolvedValue('price-alerts'),
  displayNotification: jest.fn().mockResolvedValue('notification-id'),
  getNotificationSettings: jest.fn().mockResolvedValue({ authorizationStatus }),
  requestPermission: jest.fn().mockResolvedValue({ authorizationStatus }),
});

describe('NotificationService', () => {
  it('returns Android notification permission as a boolean', async () => {
    const native = createNative(AuthorizationStatus.AUTHORIZED);
    const service = new NotificationService(native as never);

    await expect(service.requestPermission()).resolves.toBe(true);
  });

  it('does not display alerts when permission is denied', async () => {
    const native = createNative(AuthorizationStatus.DENIED);
    const service = new NotificationService(native as never);

    await expect(
      service.displayPriceAlert({
        alertId: 'alert-1',
        assetId: 'bitcoin',
        assetName: 'Bitcoin',
        symbol: 'BTC',
        condition: 'above',
        currentPrice: 101_000,
        targetPrice: 100_000,
      }),
    ).resolves.toBe(false);
    expect(native.displayNotification).not.toHaveBeenCalled();
  });

  it('creates the channel and displays a navigable price alert', async () => {
    const native = createNative(AuthorizationStatus.AUTHORIZED);
    const service = new NotificationService(native as never);

    await expect(
      service.displayPriceAlert({
        alertId: 'alert-1',
        assetId: 'bitcoin',
        assetName: 'Bitcoin',
        symbol: 'BTC',
        condition: 'above',
        currentPrice: 101_000,
        targetPrice: 100_000,
        currency: 'CAD',
      }),
    ).resolves.toBe(true);

    expect(native.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'price-alerts' }),
    );
    expect(native.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bitcoin Price Alert',
        data: expect.objectContaining({ assetId: 'bitcoin' }),
      }),
    );
  });
});

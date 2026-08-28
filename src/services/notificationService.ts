import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  type NotificationSettings,
} from '@notifee/react-native';

const ALERT_CHANNEL_ID = 'price-alerts';

export type NotificationPermissionStatus =
  | 'authorized'
  | 'provisional'
  | 'denied'
  | 'not_determined';

export interface PriceAlertNotification {
  alertId: string;
  assetId: string;
  assetName: string;
  symbol: string;
  condition: 'above' | 'below';
  currentPrice: number;
  targetPrice: number;
  currency?: string;
}

interface NotifeeAdapter {
  createChannel(channel: {
    id: string;
    name: string;
    description?: string;
    importance?: AndroidImportance;
  }): Promise<string>;
  displayNotification(
    notification: Parameters<typeof notifee.displayNotification>[0],
  ): Promise<string>;
  getNotificationSettings(): Promise<NotificationSettings>;
  requestPermission(): Promise<NotificationSettings>;
}

const mapPermissionStatus = (
  authorizationStatus: AuthorizationStatus,
): NotificationPermissionStatus => {
  switch (authorizationStatus) {
    case AuthorizationStatus.AUTHORIZED:
      return 'authorized';
    case AuthorizationStatus.PROVISIONAL:
      return 'provisional';
    case AuthorizationStatus.NOT_DETERMINED:
      return 'not_determined';
    case AuthorizationStatus.DENIED:
    default:
      return 'denied';
  }
};

const isAllowed = (status: NotificationPermissionStatus): boolean =>
  status === 'authorized' || status === 'provisional';

const formatPrice = (value: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: value >= 1 ? 2 : 6,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

export class NotificationService {
  public constructor(private readonly native: NotifeeAdapter = notifee) {}

  public async initialize(): Promise<void> {
    await this.native.createChannel({
      id: ALERT_CHANNEL_ID,
      name: 'Price alerts',
      description:
        'Notifications when a tracked asset crosses an alert target.',
      importance: AndroidImportance.HIGH,
    });
  }

  public async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const settings = await this.native.getNotificationSettings();
    return mapPermissionStatus(settings.authorizationStatus);
  }

  public async requestPermission(): Promise<boolean> {
    const settings = await this.native.requestPermission();
    return isAllowed(mapPermissionStatus(settings.authorizationStatus));
  }

  public async displayPriceAlert(
    alert: PriceAlertNotification,
  ): Promise<boolean> {
    const permissionStatus = await this.getPermissionStatus();
    if (!isAllowed(permissionStatus)) {
      return false;
    }

    await this.initialize();

    const currency = alert.currency ?? 'CAD';
    const currentPrice = formatPrice(alert.currentPrice, currency);
    const targetPrice = formatPrice(alert.targetPrice, currency);
    const direction = alert.condition === 'above' ? 'above' : 'below';

    await this.native.displayNotification({
      id: `price-alert-${alert.alertId}`,
      title: `${alert.assetName} Price Alert`,
      body: `${alert.symbol.toUpperCase()} reached ${currentPrice}. Your alert was set for ${direction} ${targetPrice}.`,
      data: {
        route: 'AssetDetails',
        assetId: alert.assetId,
        alertId: alert.alertId,
      },
      android: {
        channelId: ALERT_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
    });

    return true;
  }
}

export const notificationService = new NotificationService();

export { ALERT_CHANNEL_ID };

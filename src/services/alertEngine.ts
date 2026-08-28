import type { PriceAlert, UserPreferences } from '../types';
import { evaluateAlertCondition } from '../utils/alerts';
import type { Analytics } from './analytics';
import type { PriceAlertNotification } from './notificationService';

type CurrencyCode = UserPreferences['currency'];

export interface AlertRepositoryPort {
  hydrate(): Promise<unknown>;
  getSnapshot(): {
    items: readonly PriceAlert[];
    error?: unknown;
  };
  markTriggered(id: string, triggeredAt?: string): Promise<unknown>;
}

export interface AlertMarketDataProvider {
  getAssetDetails(
    assetId: string,
    options?: { currency?: CurrencyCode; signal?: AbortSignal },
  ): Promise<{
    id: string;
    name: string;
    symbol: string;
    currentPrice: number;
  }>;
}

export interface AlertNotificationPort {
  displayPriceAlert(alert: PriceAlertNotification): Promise<boolean>;
}

export interface AlertCheckDependencies {
  alerts: AlertRepositoryPort;
  marketData: AlertMarketDataProvider;
  notifications: AlertNotificationPort;
  analytics?: Analytics;
  currency?: CurrencyCode;
  notificationsEnabled?: boolean;
  now?: () => Date;
  signal?: AbortSignal;
}

export interface AlertCheckError {
  assetId?: string;
  alertId?: string;
  message: string;
}

export interface AlertCheckResult {
  alertsChecked: number;
  assetsFetched: number;
  triggeredAlertIds: string[];
  notificationsDisplayed: number;
  errors: AlertCheckError[];
}

const errorMessage = (error: unknown): string => {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'The alert check was cancelled.';
  }
  return 'Price data could not be checked for this asset.';
};

/**
 * Evaluates each enabled one-shot alert against fresh provider data. The alert is
 * persisted as triggered before notification delivery so notification permission or
 * native delivery failures never cause the same crossing to trigger on every fetch.
 */
export const checkPriceAlerts = async (
  dependencies: AlertCheckDependencies,
): Promise<AlertCheckResult> => {
  const result: AlertCheckResult = {
    alertsChecked: 0,
    assetsFetched: 0,
    triggeredAlertIds: [],
    notificationsDisplayed: 0,
    errors: [],
  };

  await dependencies.alerts.hydrate();
  const snapshot = dependencies.alerts.getSnapshot();
  const activeAlerts = snapshot.items.filter(
    alert => alert.enabled && !alert.triggeredAt,
  );

  if (snapshot.error) {
    result.errors.push({ message: 'Saved alerts could not be loaded.' });
  }

  const byAsset = new Map<string, PriceAlert[]>();
  for (const alert of activeAlerts) {
    const existing = byAsset.get(alert.assetId) ?? [];
    existing.push(alert);
    byAsset.set(alert.assetId, existing);
  }

  for (const [assetId, alerts] of byAsset) {
    if (dependencies.signal?.aborted) {
      result.errors.push({
        assetId,
        message: 'The alert check was cancelled.',
      });
      break;
    }

    let asset: Awaited<ReturnType<AlertMarketDataProvider['getAssetDetails']>>;
    try {
      asset = await dependencies.marketData.getAssetDetails(assetId, {
        currency: dependencies.currency ?? 'CAD',
        ...(dependencies.signal ? { signal: dependencies.signal } : {}),
      });
      result.assetsFetched += 1;
    } catch (error) {
      result.errors.push({ assetId, message: errorMessage(error) });
      continue;
    }

    for (const alert of alerts) {
      result.alertsChecked += 1;
      if (!evaluateAlertCondition(alert, asset.currentPrice)) {
        continue;
      }

      const triggeredAt = (
        dependencies.now ?? (() => new Date())
      )().toISOString();
      try {
        await dependencies.alerts.markTriggered(alert.id, triggeredAt);
        result.triggeredAlertIds.push(alert.id);
        dependencies.analytics?.track({
          name: 'alert_triggered',
          properties: { alertId: alert.id, assetId: alert.assetId },
        });
      } catch {
        result.errors.push({
          assetId,
          alertId: alert.id,
          message: 'The triggered alert could not be saved.',
        });
        continue;
      }

      if (dependencies.notificationsEnabled === false) {
        continue;
      }

      try {
        const displayed = await dependencies.notifications.displayPriceAlert({
          alertId: alert.id,
          assetId: alert.assetId,
          assetName: asset.name,
          symbol: alert.symbol || asset.symbol,
          condition: alert.condition,
          currentPrice: asset.currentPrice,
          targetPrice: alert.targetPrice,
          currency: dependencies.currency ?? 'CAD',
        });
        if (displayed) {
          result.notificationsDisplayed += 1;
        }
      } catch {
        result.errors.push({
          assetId,
          alertId: alert.id,
          message:
            'The alert was triggered, but its notification could not be shown.',
        });
      }
    }
  }

  return result;
};

export { evaluateAlertCondition };

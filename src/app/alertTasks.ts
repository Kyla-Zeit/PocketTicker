import {getMarketDataProvider} from '../api';
import {alertRepository} from '../repositories';
import {hydratePreferences, usePreferencesStore} from '../store/preferencesStore';
import {analytics} from '../services/analytics';
import {checkPriceAlerts} from '../services/alertEngine';
import {notificationService} from '../services/notificationService';

export async function runConfiguredAlertCheck(): Promise<void> {
  await hydratePreferences();
  const preferences = usePreferencesStore.getState();
  await checkPriceAlerts({
    alerts: alertRepository,
    marketData: getMarketDataProvider(),
    notifications: notificationService,
    analytics,
    currency: preferences.currency,
    notificationsEnabled: preferences.notificationsEnabled,
  });
}

import React, {useCallback} from 'react';
import {Alert, Pressable, StyleSheet, Switch, View} from 'react-native';
import {Bell, Bug, ChevronRight, Database, Fingerprint, Info, Moon, RotateCcw, Sun} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../navigation';
import type {CurrencyCode, ThemePreference} from '../../../types';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useSnackbarStore} from '../../../store/snackbarStore';
import {alertRepository, portfolioRepository, recentSearchRepository, recentlyViewedRepository, watchlistRepository} from '../../../repositories';
import {notificationService} from '../../../services/notificationService';
import {queryClient, queryPersister} from '../../../app/queryClient';
import {AppText, Button, Card, Divider, Screen, SectionHeader} from '../../../components';
import {useAppTheme} from '../../../theme';
import {APP_VERSION} from '../../../config/app';

type RowProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{size?: number; color?: string}>;
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  danger?: boolean;
};

function SettingsRow({title, subtitle, icon: Icon, onPress, value, onValueChange, danger}: RowProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole={onValueChange ? 'switch' : 'button'}
      accessibilityLabel={title}
      accessibilityState={onValueChange ? {checked: value} : undefined}
      disabled={!onPress && !onValueChange}
      onPress={onPress}
      style={({pressed}) => [styles.row, {opacity: pressed ? 0.7 : 1}]}>
      <View style={[styles.rowIcon, {backgroundColor: danger ? theme.colors.negativeSoft : theme.colors.primarySoft}]}>
        <Icon size={20} color={danger ? theme.colors.negative : theme.colors.primary} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="bodyStrong" color={danger ? 'negative' : 'text'}>{title}</AppText>
        {subtitle ? <AppText variant="caption" color="muted">{subtitle}</AppText> : null}
      </View>
      {onValueChange ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{false: theme.colors.border, true: theme.colors.primarySoft}}
          thumbColor={value ? theme.colors.primary : theme.colors.textMuted}
        />
      ) : (
        <ChevronRight size={18} color={theme.colors.textMuted} />
      )}
    </Pressable>
  );
}

function SegmentedSetting<T extends string>({values, selected, onChange}: {values: readonly T[]; selected: T; onChange: (value: T) => void}) {
  return (
    <View style={styles.segment}>
      {values.map(value => (
        <Button
          key={value}
          label={value === 'system' ? 'System' : value.toUpperCase()}
          onPress={() => onChange(value)}
          variant={selected === value ? 'secondary' : 'ghost'}
          style={styles.segmentButton}
        />
      ))}
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = usePreferencesStore(state => state.theme);
  const currency = usePreferencesStore(state => state.currency);
  const hideBalances = usePreferencesStore(state => state.hideBalances);
  const notificationsEnabled = usePreferencesStore(state => state.notificationsEnabled);
  const setTheme = usePreferencesStore(state => state.setTheme);
  const setCurrency = usePreferencesStore(state => state.setCurrency);
  const setHideBalances = usePreferencesStore(state => state.setHideBalances);
  const setNotificationsEnabled = usePreferencesStore(state => state.setNotificationsEnabled);
  const resetPreferences = usePreferencesStore(state => state.resetPreferences);
  const showSnackbar = useSnackbarStore(state => state.show);

  const toggleNotifications = useCallback(async (enabled: boolean) => {
    const granted = enabled ? await notificationService.requestPermission() : false;
    await setNotificationsEnabled(enabled ? granted : false);
    showSnackbar(enabled && !granted ? 'Notification permission was not granted' : 'Notification preference saved', enabled && !granted ? 'info' : 'success');
  }, [setNotificationsEnabled, showSnackbar]);

  const handleToggleNotifications = useCallback((value: boolean) => {
    toggleNotifications(value).catch(() => {});
  }, [toggleNotifications]);

  const handleThemeChange = useCallback((value: ThemePreference) => {
    setTheme(value).catch(() => {});
  }, [setTheme]);

  const handleCurrencyChange = useCallback((value: CurrencyCode) => {
    setCurrency(value).catch(() => {});
  }, [setCurrency]);

  const handleHideBalancesChange = useCallback((value: boolean) => {
    setHideBalances(value).catch(() => {});
  }, [setHideBalances]);

  const clearCache = useCallback(() => {
    Alert.alert('Clear cached market data?', 'Saved prices and chart data will be removed. Your watchlist, alerts, and holdings will stay intact.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear cache',
        style: 'destructive',
        onPress: () => {
          Promise.resolve(queryPersister.removeClient())
            .then(() => {
              queryClient.clear();
              showSnackbar('Market cache cleared', 'success');
            })
            .catch(() => {});
        },
      },
    ]);
  }, [showSnackbar]);

  const resetData = useCallback(() => {
    Alert.alert('Reset application data?', 'This deletes the watchlist, simulated holdings, alerts, recent activity, cached prices, and preferences.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Reset everything',
        style: 'destructive',
        onPress: () => {
          Promise.all([
            watchlistRepository.clear(),
            portfolioRepository.clear(),
            alertRepository.clear(),
            recentSearchRepository.clear(),
            recentlyViewedRepository.clear(),
            queryPersister.removeClient(),
            resetPreferences(),
          ])
            .then(() => {
              queryClient.clear();
              showSnackbar('Application data reset', 'success');
            })
            .catch(() => {});
        },
      },
    ]);
  }, [resetPreferences, showSnackbar]);

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View style={styles.heading}>
        <AppText variant="display">Settings</AppText>
        <AppText color="muted">Make PocketTicker feel at home on your device.</AppText>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Appearance" />
        <Card style={styles.card}>
          <AppText variant="caption" color="muted">THEME</AppText>
          <SegmentedSetting<ThemePreference> values={['system', 'light', 'dark']} selected={theme} onChange={handleThemeChange} />
          <Divider />
          <AppText variant="caption" color="muted">DISPLAY CURRENCY</AppText>
          <SegmentedSetting<CurrencyCode> values={['CAD', 'USD', 'EUR', 'GBP']} selected={currency} onChange={handleCurrencyChange} />
        </Card>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Privacy & security" />
        <Card style={styles.cardRows}>
          <SettingsRow title="Hide balances" subtitle="Mask portfolio values throughout the app" icon={hideBalances ? Moon : Sun} value={hideBalances} onValueChange={handleHideBalancesChange} />
          <Divider />
          <SettingsRow title="App lock" subtitle="Biometric or device credential authentication" icon={Fingerprint} onPress={() => navigation.navigate('Security')} />
        </Card>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Notifications" />
        <Card style={styles.cardRows}>
          <SettingsRow title="Price alert notifications" subtitle="Local notifications when an alert is detected" icon={Bell} value={notificationsEnabled} onValueChange={handleToggleNotifications} />
        </Card>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Data" />
        <Card style={styles.cardRows}>
          <SettingsRow title="Clear cached market data" subtitle="Keep personal lists and preferences" icon={Database} onPress={clearCache} />
          <Divider />
          <SettingsRow title="Reset application data" subtitle="Delete all locally saved PocketTicker data" icon={RotateCcw} onPress={resetData} danger />
        </Card>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Project" />
        <Card style={styles.cardRows}>
          <SettingsRow title="About PocketTicker" subtitle={`Version ${APP_VERSION} · engineering portfolio project`} icon={Info} onPress={() => navigation.navigate('About')} />
          {__DEV__ ? (
            <>
              <Divider />
              <SettingsRow title="Developer diagnostics" subtitle="Provider, network, cache, and native capability" icon={Bug} onPress={() => navigation.navigate('Diagnostics')} />
            </>
          ) : null}
        </Card>
      </View>
      <AppText variant="caption" color="muted" style={styles.footer}>PocketTicker is not a trading platform. It does not custody assets or execute financial transactions.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {padding: 20, paddingBottom: 42, gap: 24},
  heading: {gap: 4},
  section: {gap: 12},
  card: {gap: 16},
  cardRows: {paddingVertical: 2, paddingHorizontal: 16},
  row: {minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12},
  rowIcon: {width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
  rowText: {flex: 1, gap: 2},
  segment: {flexDirection: 'row', gap: 7},
  segmentButton: {flex: 1, minHeight: 42, paddingHorizontal: 5},
  footer: {textAlign: 'center', paddingHorizontal: 12},
});

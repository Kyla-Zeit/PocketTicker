import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Config from 'react-native-config';
import {RefreshCw} from 'lucide-react-native';
import {queryClient} from '../../../app/queryClient';
import {APP_VERSION} from '../../../config/app';
import {useNetworkStatus} from '../../../hooks/useNetworkStatus';
import {biometricService, type BiometricCapability} from '../../../services/biometricService';
import {notificationService, type NotificationPermissionStatus} from '../../../services/notificationService';
import {AppText, Button, Card, Screen, SectionHeader} from '../../../components';
import {useAppTheme} from '../../../theme';
import {formatDateTime} from '../../../utils/formatters';

export function DiagnosticsScreen() {
  const theme = useAppTheme();
  const network = useNetworkStatus();
  const [permission, setPermission] = useState<NotificationPermissionStatus>('not_determined');
  const [biometric, setBiometric] = useState<BiometricCapability>();
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    Promise.all([
      notificationService.getPermissionStatus().then(setPermission),
      biometricService.getCapability().then(setBiometric),
    ])
      .finally(() => setTick(value => value + 1))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const queries = queryClient.getQueryCache().getAll();
  const lastUpdate = queries.reduce((latest, query) => Math.max(latest, query.state.dataUpdatedAt), 0);
  const rows = [
    ['Provider mode', Config.MARKET_DATA_PROVIDER ?? 'mock'],
    ['Network', network.isOffline ? 'Offline' : `${network.type} · connected`],
    ['Cached queries', `${queries.length}`],
    ['Last query update', lastUpdate ? formatDateTime(lastUpdate) : 'No cached data'],
    ['App version', APP_VERSION],
    ['Notifications', permission],
    ['Device authentication', biometric?.available ? biometric.biometryType ?? 'Available' : biometric?.reason ?? 'Checking…'],
  ];

  return (
    <Screen scroll edges={[]} contentContainerStyle={styles.screen}>
      <View style={styles.heading}><AppText variant="title">Development build diagnostics</AppText><AppText color="muted">This section is only linked from Settings in development builds.</AppText></View>
      <SectionHeader title="Runtime state" subtitle={`Snapshot ${tick}`} />
      <Card style={styles.card}>
        {rows.map(([label, value], index) => (
          <View key={label} style={[styles.row, index > 0 && styles.rowBorder, index > 0 && {borderTopColor: theme.colors.divider}]}>
            <AppText color="muted">{label}</AppText>
            <AppText variant="bodyStrong" style={styles.value}>{value}</AppText>
          </View>
        ))}
      </Card>
      <Button label="Refresh diagnostics" icon={RefreshCw} onPress={refresh} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {padding: 20, paddingBottom: 40, gap: 18},
  heading: {gap: 6},
  card: {paddingVertical: 2},
  row: {minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16},
  rowBorder: {borderTopWidth: 1},
  value: {flex: 1, textAlign: 'right'},
});

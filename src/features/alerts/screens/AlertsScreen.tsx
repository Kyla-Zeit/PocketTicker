import React, {useCallback, useMemo} from 'react';
import {Alert, FlatList, StyleSheet, Switch, View} from 'react-native';
import {BellPlus, Plus, Trash2} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../navigation';
import type {PriceAlert} from '../../../types';
import {useAlerts} from '../../../repositories';
import {useMarkets} from '../../markets/hooks/useMarkets';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useSnackbarStore} from '../../../store/snackbarStore';
import {AppText, AssetIcon, Button, Card, EmptyState, PriceText, Screen} from '../../../components';
import {useAppTheme} from '../../../theme';

function AlertGap() {
  return <View style={styles.gap} />;
}

export function AlertsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currency = usePreferencesStore(state => state.currency);
  const showSnackbar = useSnackbarStore(state => state.show);
  const {items, setEnabled, remove, clear} = useAlerts();
  const markets = useMarkets({currency});

  const byId = useMemo(() => new Map((markets.data ?? []).map(asset => [asset.id, asset])), [markets.data]);

  const deleteAlert = useCallback((id: string, symbol: string) => {
    Alert.alert('Delete price alert?', `The ${symbol.toUpperCase()} alert will be permanently removed.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(id).then(() => showSnackbar('Alert deleted', 'success')).catch(() => {});
        },
      },
    ]);
  }, [remove, showSnackbar]);

  const deleteAll = useCallback(() => {
    Alert.alert('Delete all alerts?', 'This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: () => {
          clear().then(() => showSnackbar('All alerts deleted', 'success')).catch(() => {});
        },
      },
    ]);
  }, [clear, showSnackbar]);

  const handleToggleEnabled = useCallback((id: string, value: boolean) => {
    setEnabled(id, value).catch(() => {});
  }, [setEnabled]);

  const renderItem = useCallback(({item}: {item: PriceAlert}) => {
    const asset = byId.get(item.assetId);
    return (
      <Card style={[styles.card, !item.enabled && styles.disabled]}>
        <View style={styles.row}>
          <AssetIcon name={asset?.name ?? item.symbol} symbol={item.symbol} imageUrl={asset?.imageUrl} />
          <View style={styles.identity}>
            <AppText variant="bodyStrong">{asset?.name ?? item.symbol.toUpperCase()}</AppText>
            <AppText variant="caption" color="muted">{item.condition === 'above' ? 'Rises above' : 'Falls below'} <PriceText value={item.targetPrice} currency={currency} variant="bodyStrong" /></AppText>
          </View>
          <Switch
            accessibilityLabel={`${item.enabled ? 'Disable' : 'Enable'} ${item.symbol.toUpperCase()} alert`}
            value={item.enabled}
            onValueChange={value => handleToggleEnabled(item.id, value)}
            trackColor={{false: theme.colors.border, true: theme.colors.primarySoft}}
            thumbColor={item.enabled ? theme.colors.primary : theme.colors.textMuted}
          />
        </View>
        {asset ? <View style={[styles.status, {borderTopColor: theme.colors.divider}]}><AppText variant="caption" color="muted">Current price</AppText><PriceText value={asset.currentPrice} currency={currency} /></View> : null}
        {item.triggeredAt ? <AppText variant="caption" color="positive">Triggered · {new Date(item.triggeredAt).toLocaleString()}</AppText> : null}
        <View style={styles.actions}>
          <Button label="Edit" onPress={() => navigation.navigate('AlertEditor', {alertId: item.id})} variant="ghost" style={styles.action} />
          <Button label="Delete" icon={Trash2} onPress={() => deleteAlert(item.id, item.symbol)} variant="danger" style={styles.action} />
        </View>
      </Card>
    );
  }, [byId, currency, deleteAlert, handleToggleEnabled, navigation, theme.colors.border, theme.colors.divider, theme.colors.primary, theme.colors.primarySoft, theme.colors.textMuted]);

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList]}
        ListHeaderComponent={items.length ? (
          <View style={styles.header}>
            <View style={styles.heading}><AppText variant="display">Alerts</AppText><AppText color="muted">Opportunistic price checks with local notifications.</AppText></View>
            <Button label="Add" icon={Plus} onPress={() => navigation.navigate('AlertEditor')} variant="secondary" />
          </View>
        ) : undefined}
        ListFooterComponent={items.length ? <Button label="Delete all alerts" icon={Trash2} onPress={deleteAll} variant="ghost" style={styles.deleteAll} /> : undefined}
        ListEmptyComponent={<EmptyState title="No price alerts" message="Create an alert for any asset and PocketTicker will check it when Android allows background work." actionLabel="Create an alert" onAction={() => navigation.navigate('AlertEditor')} icon={BellPlus} />}
        renderItem={renderItem}
        ItemSeparatorComponent={AlertGap}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {padding: 20, paddingBottom: 34},
  emptyList: {flexGrow: 1},
  header: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20},
  heading: {flex: 1, gap: 4},
  card: {gap: 14},
  disabled: {opacity: 0.62},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  identity: {flex: 1, gap: 2},
  status: {borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between'},
  actions: {flexDirection: 'row', gap: 10},
  action: {flex: 1, minHeight: 42},
  gap: {height: 12},
  deleteAll: {marginTop: 22},
});

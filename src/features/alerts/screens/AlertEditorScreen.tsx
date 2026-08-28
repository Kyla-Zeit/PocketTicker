import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, View} from 'react-native';
import {BellRing} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../navigation';
import type {AlertCondition, MarketAsset} from '../../../types';
import {useAlerts} from '../../../repositories';
import {useMarkets} from '../../markets/hooks/useMarkets';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useSnackbarStore} from '../../../store/snackbarStore';
import {notificationService} from '../../../services/notifications';
import {analytics} from '../../../services/analytics';
import {AppText, AssetIcon, Button, Card, LoadingState, PriceText, Screen, SectionHeader, TextField} from '../../../components';
import {useAppTheme} from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AlertEditor'>;

export function AlertEditorScreen({route, navigation}: Props) {
  const theme = useAppTheme();
  const currency = usePreferencesStore(state => state.currency);
  const notificationsEnabled = usePreferencesStore(state => state.notificationsEnabled);
  const setNotificationsEnabled = usePreferencesStore(state => state.setNotificationsEnabled);
  const showSnackbar = useSnackbarStore(state => state.show);
  const {items, add, update} = useAlerts();
  const existing = items.find(item => item.id === route.params?.alertId);
  const markets = useMarkets({currency});
  const [assetId, setAssetId] = useState(route.params?.assetId ?? existing?.assetId ?? '');
  const [condition, setCondition] = useState<AlertCondition>(existing?.condition ?? 'above');
  const [target, setTarget] = useState(existing ? String(existing.targetPrice) : '');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assetId && markets.data?.[0]) setAssetId(markets.data[0].id);
  }, [assetId, markets.data]);

  const selected = useMemo(() => markets.data?.find(asset => asset.id === assetId), [assetId, markets.data]);

  const save = useCallback(async () => {
    const targetPrice = Number(target.replace(',', '.'));
    if (!assetId || !selected) {
      setError('Select an asset.');
      return;
    }
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      setError('Enter a positive numeric target price.');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      if (existing) {
        await update(existing.id, {assetId, symbol: selected.symbol, condition, targetPrice});
      } else {
        await add({assetId, symbol: selected.symbol, condition, targetPrice, enabled: true});
        analytics.track({name: 'alert_created', properties: {assetId, condition}});
      }
      if (!notificationsEnabled) {
        const granted = await notificationService.requestPermission();
        await setNotificationsEnabled(granted);
        if (!granted) showSnackbar('Alert saved, but notifications are disabled', 'info');
      }
      showSnackbar(existing ? 'Alert updated' : 'Alert created', 'success');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [add, assetId, condition, existing, navigation, notificationsEnabled, selected, setNotificationsEnabled, showSnackbar, target, update]);

  const handleSave = useCallback(() => {
    save().catch(() => {});
  }, [save]);

  const renderAssetItem = useCallback(({item}: {item: MarketAsset}) => {
    const active = item.id === assetId;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected: active}}
        onPress={() => setAssetId(item.id)}
        style={[
          styles.asset,
          {
            backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
            borderColor: active ? theme.colors.primary : theme.colors.border,
          },
        ]}>
        <AssetIcon name={item.name} symbol={item.symbol} imageUrl={item.imageUrl} size={36} />
        <AppText variant="caption" style={{color: active ? theme.colors.primary : theme.colors.text}}>{item.symbol.toUpperCase()}</AppText>
      </Pressable>
    );
  }, [assetId, theme.colors.border, theme.colors.primary, theme.colors.primarySoft, theme.colors.surface, theme.colors.text]);

  if (markets.isLoading) return <Screen edges={[]}><LoadingState label="Loading assets…" /></Screen>;

  return (
    <Screen scroll edges={[]} contentContainerStyle={styles.screen}>
      <SectionHeader title="Choose an asset" subtitle="Alerts are checked using the latest available price." />
      <FlatList
        horizontal
        data={markets.data ?? []}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.assets}
        renderItem={renderAssetItem}
      />
      {selected ? <Card style={styles.current}><View><AppText color="muted" variant="caption">Current {selected.name} price</AppText><PriceText value={selected.currentPrice} currency={currency} variant="title" /></View><BellRing color={theme.colors.primary} size={26} /></Card> : null}
      <SectionHeader title="Condition" />
      <View style={styles.segment}>
        {(['above', 'below'] as AlertCondition[]).map(value => {
          const active = condition === value;
          return <Button key={value} label={value === 'above' ? 'Rises above' : 'Falls below'} onPress={() => setCondition(value)} variant={active ? 'secondary' : 'ghost'} style={styles.segmentButton} />;
        })}
      </View>
      <TextField label={`Target price (${currency})`} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="100000" error={error} />
      <AppText color="muted" variant="caption">Android background checks are best-effort and may be delayed by battery optimization. Opening the app also checks active alerts.</AppText>
      <Button label={existing ? 'Save changes' : 'Create alert'} onPress={handleSave} loading={saving} icon={BellRing} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {padding: 20, paddingBottom: 40, gap: 18},
  assets: {gap: 9},
  asset: {minWidth: 74, minHeight: 76, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6},
  current: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  segment: {flexDirection: 'row', gap: 10},
  segmentButton: {flex: 1},
});

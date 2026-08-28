import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, View} from 'react-native';
import {Save} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../navigation';
import type {MarketAsset} from '../../../types';
import {useHoldings} from '../../../repositories';
import {useMarkets} from '../../markets/hooks/useMarkets';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useSnackbarStore} from '../../../store/snackbarStore';
import {analytics} from '../../../services/analytics';
import {AppText, AssetIcon, Button, Card, LoadingState, PriceText, Screen, SectionHeader, TextField} from '../../../components';
import {useAppTheme} from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PortfolioEditor'>;

export function PortfolioEditorScreen({route, navigation}: Props) {
  const theme = useAppTheme();
  const currency = usePreferencesStore(state => state.currency);
  const showSnackbar = useSnackbarStore(state => state.show);
  const {items, add, update} = useHoldings();
  const existing = items.find(item => item.id === route.params?.holdingId);
  const markets = useMarkets({currency});
  const [assetId, setAssetId] = useState(existing?.assetId ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [purchasePrice, setPurchasePrice] = useState(existing?.averagePurchasePrice !== undefined ? String(existing.averagePurchasePrice) : '');
  const [errors, setErrors] = useState<{amount?: string; purchasePrice?: string; asset?: string}>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assetId && markets.data?.[0]) setAssetId(markets.data[0].id);
  }, [assetId, markets.data]);

  const selected = useMemo(() => markets.data?.find(asset => asset.id === assetId), [assetId, markets.data]);

  const save = useCallback(async () => {
    const numericAmount = Number(amount.replace(',', '.'));
    const numericPurchase = purchasePrice.trim() ? Number(purchasePrice.replace(',', '.')) : undefined;
    const nextErrors: typeof errors = {};
    if (!selected) nextErrors.asset = 'Select an asset.';
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) nextErrors.amount = 'Quantity must be greater than zero.';
    if (numericPurchase !== undefined && (!Number.isFinite(numericPurchase) || numericPurchase <= 0)) nextErrors.purchasePrice = 'Purchase price must be positive or left blank.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const payload = {assetId, symbol: selected!.symbol, amount: numericAmount, averagePurchasePrice: numericPurchase};
      if (existing) {
        await update(existing.id, payload);
      } else {
        await add(payload);
        analytics.track({name: 'portfolio_holding_added', properties: {assetId}});
      }
      showSnackbar(existing ? 'Holding updated' : 'Holding added', 'success');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [add, amount, assetId, existing, navigation, purchasePrice, selected, showSnackbar, update]);

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
      <SectionHeader title="Asset" subtitle="Choose the asset represented by this simulated holding." />
      <FlatList
        horizontal
        data={markets.data ?? []}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.assets}
        renderItem={renderAssetItem}
      />
      {errors.asset ? <AppText color="negative" variant="caption">{errors.asset}</AppText> : null}
      {selected ? <Card style={styles.current}><View><AppText variant="caption" color="muted">Current {selected.name} price</AppText><PriceText value={selected.currentPrice} currency={currency} variant="title" /></View></Card> : null}
      <TextField label={`Quantity${selected ? ` (${selected.symbol.toUpperCase()})` : ''}`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.25" error={errors.amount} />
      <TextField label={`Average purchase price (${currency}) · Optional`} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="Leave blank if unknown" error={errors.purchasePrice} />
      <AppText variant="caption" color="muted">PocketTicker calculates an estimated value from market prices. This entry does not represent funds held by the app.</AppText>
      <Button label={existing ? 'Save changes' : 'Add simulated holding'} onPress={handleSave} loading={saving} icon={Save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {padding: 20, paddingBottom: 40, gap: 18},
  assets: {gap: 9},
  asset: {minWidth: 74, minHeight: 76, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6},
  current: {flexDirection: 'row', justifyContent: 'space-between'},
});

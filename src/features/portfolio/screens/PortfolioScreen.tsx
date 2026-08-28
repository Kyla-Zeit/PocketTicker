import React, {useCallback, useMemo} from 'react';
import {Alert, FlatList, StyleSheet, View} from 'react-native';
import {Eye, EyeOff, Pencil, Plus, Trash2, WalletCards} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../navigation';
import type {Holding, MarketAsset} from '../../../types';
import {useHoldings} from '../../../repositories';
import {useMarkets} from '../../markets/hooks/useMarkets';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useSnackbarStore} from '../../../store/snackbarStore';
import {AppText, AssetIcon, Button, Card, EmptyState, IconButton, PriceText, Screen, SectionHeader} from '../../../components';
import {useAppTheme} from '../../../theme';

interface HoldingRowData {
  holding: Holding;
  asset?: MarketAsset;
  value: number;
  gainLoss?: number;
}

function PortfolioGap() {
  return <View style={styles.gap} />;
}

export function PortfolioScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currency = usePreferencesStore(state => state.currency);
  const hideBalances = usePreferencesStore(state => state.hideBalances);
  const setHideBalances = usePreferencesStore(state => state.setHideBalances);
  const showSnackbar = useSnackbarStore(state => state.show);
  const {items, remove} = useHoldings();
  const markets = useMarkets({currency});

  const rows: HoldingRowData[] = useMemo(() => {
    const byId = new Map((markets.data ?? []).map(asset => [asset.id, asset]));
    return items.map(holding => {
      const asset = byId.get(holding.assetId);
      const value = asset ? asset.currentPrice * holding.amount : 0;
      const gainLoss = asset && holding.averagePurchasePrice !== undefined ? (asset.currentPrice - holding.averagePurchasePrice) * holding.amount : undefined;
      return {holding, asset, value, gainLoss};
    });
  }, [items, markets.data]);

  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const totalGainLoss = rows.reduce((sum, row) => sum + (row.gainLoss ?? 0), 0);

  const confirmDelete = useCallback((id: string, symbol: string) => {
    Alert.alert('Delete holding?', `Remove the simulated ${symbol.toUpperCase()} holding?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(id).then(() => showSnackbar('Holding deleted', 'success')).catch(() => {});
        },
      },
    ]);
  }, [remove, showSnackbar]);

  const handleToggleHideBalances = useCallback(() => {
    setHideBalances(!hideBalances).catch(() => {});
  }, [hideBalances, setHideBalances]);

  const renderItem = useCallback(({item: row}: {item: HoldingRowData}) => (
    <Card style={styles.holding}>
      <View style={styles.holdingMain}>
        <AssetIcon name={row.asset?.name ?? row.holding.symbol} symbol={row.holding.symbol} imageUrl={row.asset?.imageUrl} />
        <View style={styles.holdingIdentity}><AppText variant="bodyStrong">{row.asset?.name ?? row.holding.symbol.toUpperCase()}</AppText><AppText variant="caption" color="muted">{hideBalances ? '••••' : row.holding.amount.toLocaleString()} {row.holding.symbol.toUpperCase()}</AppText></View>
        <View style={styles.holdingValue}><PriceText value={row.value} currency={currency} hidden={hideBalances} />{row.gainLoss !== undefined ? <AppText variant="caption" color={row.gainLoss >= 0 ? 'positive' : 'negative'}>{hideBalances ? '••••' : `${row.gainLoss >= 0 ? '+' : ''}${row.gainLoss.toFixed(2)}`}</AppText> : null}</View>
      </View>
      <View style={[styles.actions, {borderTopColor: theme.colors.divider}]}><Button label="Edit" icon={Pencil} onPress={() => navigation.navigate('PortfolioEditor', {holdingId: row.holding.id})} variant="ghost" style={styles.action} /><Button label="Delete" icon={Trash2} onPress={() => confirmDelete(row.holding.id, row.holding.symbol)} variant="danger" style={styles.action} /></View>
    </Card>
  ), [confirmDelete, currency, hideBalances, navigation, theme.colors.divider]);

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={row => row.holding.id}
        contentContainerStyle={[styles.list, rows.length === 0 && styles.emptyList]}
        ListHeaderComponent={rows.length ? (
          <View style={styles.top}>
            <View style={styles.header}><View style={styles.heading}><AppText variant="display">Portfolio</AppText><AppText color="muted">Simulated holdings · no funds or wallets</AppText></View><IconButton icon={hideBalances ? Eye : EyeOff} label={hideBalances ? 'Show balances' : 'Hide balances'} active={hideBalances} onPress={handleToggleHideBalances} /></View>
            <Card style={[styles.totalCard, {backgroundColor: theme.colors.primarySoft}]}>
              <AppText variant="label" style={{color: theme.colors.primary}}>ESTIMATED VALUE</AppText>
              <PriceText value={total} currency={currency} hidden={hideBalances} variant="display" />
              {rows.some(row => row.gainLoss !== undefined) ? <AppText variant="bodyStrong" color={totalGainLoss >= 0 ? 'positive' : 'negative'}>{hideBalances ? '••••••' : `${totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)} ${currency}`} estimated gain/loss</AppText> : null}
            </Card>
            <View style={styles.allocation}>
              <SectionHeader title="Allocation" />
              {rows.filter(row => row.value > 0).map(row => {
                const percent = total ? (row.value / total) * 100 : 0;
                return (
                  <View key={row.holding.id} style={styles.allocationRow} accessibilityLabel={`${row.holding.symbol.toUpperCase()}, ${percent.toFixed(1)} percent allocation`}>
                    <View style={styles.allocationLabel}><AppText variant="caption">{row.holding.symbol.toUpperCase()}</AppText><AppText variant="caption" color="muted">{hideBalances ? '••%' : `${percent.toFixed(1)}%`}</AppText></View>
                    <View style={[styles.track, {backgroundColor: theme.colors.border}]}><View style={[styles.fill, {backgroundColor: theme.colors.primary, width: `${Math.max(2, percent)}%`}]} /></View>
                  </View>
                );
              })}
            </View>
            <View style={styles.holdingsHeader}><SectionHeader title="Holdings" /><Button label="Add" icon={Plus} onPress={() => navigation.navigate('PortfolioEditor')} variant="secondary" /></View>
          </View>
        ) : undefined}
        ListEmptyComponent={<EmptyState title="No holdings yet" message="Add a simulated holding to track its estimated market value. PocketTicker never holds real funds." actionLabel="Add a holding" onAction={() => navigation.navigate('PortfolioEditor')} icon={WalletCards} />}
        renderItem={renderItem}
        ItemSeparatorComponent={PortfolioGap}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {padding: 20, paddingBottom: 34}, emptyList: {flexGrow: 1}, top: {gap: 20, marginBottom: 14}, header: {flexDirection: 'row', alignItems: 'center', gap: 12}, heading: {flex: 1, gap: 4}, totalCard: {gap: 7}, allocation: {gap: 12}, allocationRow: {gap: 6}, allocationLabel: {flexDirection: 'row', justifyContent: 'space-between'}, track: {height: 8, borderRadius: 999, overflow: 'hidden'}, fill: {height: 8, borderRadius: 999}, holdingsHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}, holding: {padding: 0, overflow: 'hidden'}, holdingMain: {padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12}, holdingIdentity: {flex: 1, gap: 2}, holdingValue: {alignItems: 'flex-end', gap: 3}, actions: {borderTopWidth: 1, padding: 10, flexDirection: 'row', gap: 10}, action: {flex: 1, minHeight: 42}, gap: {height: 12},
});

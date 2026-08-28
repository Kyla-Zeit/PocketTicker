import React, {useCallback, useMemo} from 'react';
import {Alert, FlatList, StyleSheet, View} from 'react-native';
import {ArrowDown, ArrowUp, Search, Trash2} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../navigation';
import type {MarketAsset} from '../../../types';
import {useMarkets} from '../../markets/hooks/useMarkets';
import {useWatchlist} from '../../../repositories';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useSnackbarStore} from '../../../store/snackbarStore';
import {AppText, Button, EmptyState, ErrorState, IconButton, LoadingState, MarketRow, Screen} from '../../../components';
import {useAppTheme} from '../../../theme';

function WatchlistGap() {
  return <View style={styles.gap} />;
}

export function WatchlistScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currency = usePreferencesStore(state => state.currency);
  const showSnackbar = useSnackbarStore(state => state.show);
  const {items, remove, reorder, clear} = useWatchlist();
  const markets = useMarkets({currency});

  const assets = useMemo(() => {
    const byId = new Map((markets.data ?? []).map(asset => [asset.id, asset]));
    return items.map(item => byId.get(item.assetId)).filter((asset): asset is MarketAsset => Boolean(asset));
  }, [items, markets.data]);

  const openAsset = useCallback((asset: MarketAsset) => navigation.navigate('AssetDetails', {assetId: asset.id}), [navigation]);

  const move = useCallback(async (index: number, direction: -1 | 1) => {
    const ids = items.map(item => item.assetId);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await reorder(ids);
  }, [items, reorder]);

  const handleRemove = useCallback(async (id: string, symbol: string) => {
    await remove(id);
    showSnackbar(`${symbol.toUpperCase()} removed`, 'success');
  }, [remove, showSnackbar]);

  const handleRefetch = useCallback(() => {
    markets.refetch().catch(() => {});
  }, [markets]);

  const confirmClear = useCallback(() => {
    Alert.alert('Clear watchlist?', 'This removes every saved asset from your watchlist.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clear().then(() => showSnackbar('Watchlist cleared', 'success')).catch(() => {});
        },
      },
    ]);
  }, [clear, showSnackbar]);

  const renderItem = useCallback(({item, index}: {item: MarketAsset; index: number}) => (
    <View style={[styles.item, {backgroundColor: theme.colors.surface}]}>
      <MarketRow asset={item} currency={currency} onPress={openAsset} showTrend={false} />
      <View style={[styles.controls, {borderTopColor: theme.colors.divider}]}>
        <IconButton icon={ArrowUp} label={`Move ${item.name} up`} disabled={index === 0} onPress={() => { move(index, -1).catch(() => {}); }} />
        <IconButton icon={ArrowDown} label={`Move ${item.name} down`} disabled={index === assets.length - 1} onPress={() => { move(index, 1).catch(() => {}); }} />
        <Button label="Remove" icon={Trash2} variant="danger" onPress={() => { handleRemove(item.id, item.symbol).catch(() => {}); }} style={styles.remove} />
      </View>
    </View>
  ), [assets.length, currency, handleRemove, move, openAsset, theme.colors.divider, theme.colors.surface]);

  if (markets.isLoading && items.length > 0) return <Screen><LoadingState label="Refreshing watchlist…" /></Screen>;
  if (markets.isError && !markets.data && items.length > 0) return <Screen><ErrorState message={markets.error.userMessage} onRetry={handleRefetch} /></Screen>;

  return (
    <Screen>
      <FlatList
        data={assets}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, assets.length === 0 && styles.emptyList]}
        ListHeaderComponent={assets.length ? (
          <View style={styles.header}>
            <View style={styles.heading}><AppText variant="display">Watchlist</AppText><AppText color="muted">Your saved market signals in one place.</AppText></View>
            <Button label="Clear" icon={Trash2} onPress={confirmClear} variant="ghost" />
          </View>
        ) : undefined}
        ListEmptyComponent={<EmptyState title="Your watchlist is empty" message="Search for an asset to start tracking it." actionLabel="Search assets" onAction={() => navigation.navigate('Search')} icon={Search} />}
        renderItem={renderItem}
        ItemSeparatorComponent={WatchlistGap}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {padding: 20, paddingBottom: 32}, emptyList: {flexGrow: 1},
  header: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20}, heading: {flex: 1, gap: 4},
  item: {borderRadius: 18, overflow: 'hidden'}, controls: {minHeight: 56, paddingHorizontal: 10, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6}, remove: {marginLeft: 'auto', minHeight: 40}, gap: {height: 12},
});

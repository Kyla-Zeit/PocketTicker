import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, Pressable, RefreshControl, StyleSheet, View} from 'react-native';
import {Search, SlidersHorizontal} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {MarketAsset} from '../../../types';
import type {RootStackParamList} from '../../../navigation';
import {useMarkets} from '../hooks/useMarkets';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useRecentlyViewed} from '../../../repositories';
import {useNetworkStatus} from '../../../hooks/useNetworkStatus';
import {AppText, ErrorState, IconButton, LoadingState, MarketRow, OfflineBanner, Screen, SectionHeader} from '../../../components';
import {useAppTheme} from '../../../theme';

type SortMode = 'marketCap' | 'price' | 'gainers' | 'losers';
const sortOptions: {key: SortMode; label: string}[] = [
  {key: 'marketCap', label: 'Market cap'},
  {key: 'price', label: 'Price'},
  {key: 'gainers', label: '24h gain'},
  {key: 'losers', label: '24h loss'},
];

function MarketItemSeparator({color}: {color: string}) {
  return <View style={[styles.separator, {backgroundColor: color}]} />;
}

export function MarketsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currency = usePreferencesStore(state => state.currency);
  const {isOffline} = useNetworkStatus();
  const {items: recentlyViewed} = useRecentlyViewed();
  const [sort, setSort] = useState<SortMode>('marketCap');
  const markets = useMarkets({currency});

  const sorted = useMemo(() => {
    const assets = [...(markets.data ?? [])];
    switch (sort) {
      case 'price': return assets.sort((a, b) => b.currentPrice - a.currentPrice);
      case 'gainers': return assets.sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h);
      case 'losers': return assets.sort((a, b) => a.priceChangePercentage24h - b.priceChangePercentage24h);
      default: return assets.sort((a, b) => b.marketCap - a.marketCap);
    }
  }, [markets.data, sort]);

  const recentAssets = useMemo(() => {
    const byId = new Map((markets.data ?? []).map(asset => [asset.id, asset]));
    return recentlyViewed.map(item => byId.get(item.assetId)).filter((asset): asset is MarketAsset => Boolean(asset)).slice(0, 5);
  }, [markets.data, recentlyViewed]);

  const openAsset = useCallback((asset: MarketAsset) => navigation.navigate('AssetDetails', {assetId: asset.id}), [navigation]);
  const handleRefetch = useCallback(() => {
    markets.refetch().catch(() => {});
  }, [markets]);

  const lastUpdated = markets.data?.reduce((latest, asset) => Math.max(latest, new Date(asset.lastUpdated).getTime()), 0);

  const renderMarketRow = useCallback(({item}: {item: MarketAsset}) => (
    <MarketRow asset={item} currency={currency} onPress={openAsset} />
  ), [currency, openAsset]);

  const renderSeparator = useCallback(() => (
    <MarketItemSeparator color={theme.colors.divider} />
  ), [theme.colors.divider]);

  const renderRecentItem = useCallback(({item}: {item: MarketAsset}) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name}`}
      onPress={() => openAsset(item)}
      style={({pressed}) => [styles.recentCard, {backgroundColor: theme.colors.surface, opacity: pressed ? 0.75 : 1}]}>
      <AppText variant="label" color="muted">{item.symbol.toUpperCase()}</AppText>
      <AppText variant="bodyStrong" numberOfLines={1}>{item.name}</AppText>
      <AppText variant="caption" color={item.priceChangePercentage24h >= 0 ? 'positive' : 'negative'}>{item.priceChangePercentage24h >= 0 ? '+' : ''}{item.priceChangePercentage24h.toFixed(2)}%</AppText>
    </Pressable>
  ), [openAsset, theme.colors.surface]);

  const renderSortItem = useCallback(({item}: {item: (typeof sortOptions)[number]}) => {
    const active = sort === item.key;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected: active}}
        onPress={() => setSort(item.key)}
        style={[styles.chip, {backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.border}]}>
        <AppText variant="caption" style={{color: active ? theme.colors.primary : theme.colors.textMuted}}>{item.label}</AppText>
      </Pressable>
    );
  }, [sort, theme.colors.border, theme.colors.primary, theme.colors.primarySoft, theme.colors.surface, theme.colors.textMuted]);

  const header = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="display">Markets</AppText>
          <AppText color="muted">A clear view of the market, wherever you are.</AppText>
        </View>
        <IconButton icon={Search} label="Search assets" onPress={() => navigation.navigate('Search')} />
      </View>
      <OfflineBanner offline={isOffline} lastUpdated={lastUpdated} />
      {recentAssets.length ? (
        <View style={styles.section}>
          <SectionHeader title="Recently viewed" />
          <FlatList
            horizontal
            data={recentAssets}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
            renderItem={renderRecentItem}
          />
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionHeader title="Top assets" subtitle={`${sorted.length} assets · ${currency}`} />
        <View style={styles.sortRow} accessibilityLabel="Sort markets">
          <SlidersHorizontal size={17} color={theme.colors.textMuted} />
          <FlatList
            horizontal
            data={sortOptions}
            keyExtractor={item => item.key}
            showsHorizontalScrollIndicator={false}
            renderItem={renderSortItem}
          />
        </View>
      </View>
    </View>
  );

  if (markets.isLoading && !markets.data) return <Screen><LoadingState /></Screen>;
  if (markets.isError && !markets.data) return <Screen><ErrorState message={markets.error.userMessage} onRetry={handleRefetch} /></Screen>;

  return (
    <Screen>
      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        renderItem={renderMarketRow}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={renderSeparator}
        refreshControl={<RefreshControl refreshing={markets.isRefetching} onRefresh={handleRefetch} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {paddingBottom: 24},
  header: {paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 16},
  headerText: {flex: 1, gap: 4},
  section: {paddingTop: 18, gap: 12},
  recentList: {paddingHorizontal: 20, gap: 10},
  recentCard: {width: 150, padding: 14, borderRadius: 16, gap: 5},
  sortRow: {paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8},
  chip: {minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, marginRight: 8, borderWidth: 1, borderRadius: 999},
  separator: {height: 1, marginLeft: 70},
});

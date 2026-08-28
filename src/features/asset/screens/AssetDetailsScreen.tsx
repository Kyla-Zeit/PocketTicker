import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BellPlus, Star, StarOff} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../../navigation';
import type {ChartTimeframe} from '../../../types';
import {useAssetDetails} from '../hooks/useAssetDetails';
import {useMarketChart} from '../hooks/useMarketChart';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useSnackbarStore} from '../../../store/snackbarStore';
import {useRecentlyViewed, useWatchlist} from '../../../repositories';
import {analytics} from '../../../services/analytics';
import {AppText, AssetIcon, Button, Card, ChangeBadge, ErrorState, LoadingState, PriceChart, PriceText, Screen, SectionHeader} from '../../../components';
import {formatCompactNumber, formatDateTime} from '../../../utils/formatters';
import {useAppTheme} from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetDetails'>;
const timeframes: ChartTimeframe[] = ['1D', '7D', '30D', '90D', '1Y'];

export function AssetDetailsScreen({route, navigation}: Props) {
  const {assetId} = route.params;
  const theme = useAppTheme();
  const currency = usePreferencesStore(state => state.currency);
  const {items: watchlist, toggle} = useWatchlist();
  const {add: addRecentlyViewed} = useRecentlyViewed();
  const showSnackbar = useSnackbarStore(state => state.show);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7D');
  const details = useAssetDetails(assetId, currency);
  const chart = useMarketChart(assetId, timeframe, currency, {enabled: Boolean(details.data)});
  const isWatched = watchlist.some(item => item.assetId === assetId);

  useEffect(() => {
    if (!details.data) return;
    const asset = details.data;
    addRecentlyViewed({assetId: asset.id, name: asset.name, symbol: asset.symbol, imageUrl: asset.imageUrl}).catch(() => {});
    analytics.track({name: 'asset_viewed', properties: {assetId: asset.id}});
  }, [addRecentlyViewed, details.data]);

  const metrics = useMemo(() => details.data ? [
    ['Market cap', formatCompactNumber(details.data.marketCap)],
    ['24h volume', formatCompactNumber(details.data.totalVolume)],
    ['Circulating supply', formatCompactNumber(details.data.circulatingSupply)],
    ['All-time high', formatCompactNumber(details.data.allTimeHigh)],
    ['All-time low', formatCompactNumber(details.data.allTimeLow)],
    ['Last updated', formatDateTime(details.data.lastUpdated)],
  ] : [], [details.data]);

  const handleWatchlist = useCallback(async () => {
    if (!details.data) return;
    const asset = details.data;
    await toggle(asset.id);
    showSnackbar(isWatched ? `Removed ${asset.symbol.toUpperCase()} from watchlist` : `Added ${asset.symbol.toUpperCase()} to watchlist`, 'success');
    if (!isWatched) analytics.track({name: 'watchlist_added', properties: {assetId: asset.id}});
  }, [details.data, isWatched, showSnackbar, toggle]);

  const handleWatchlistPress = useCallback(() => {
    handleWatchlist().catch(() => {});
  }, [handleWatchlist]);

  const handleRefetch = useCallback(() => {
    details.refetch().catch(() => {});
  }, [details]);

  const handleChartRefetch = useCallback(() => {
    chart.refetch().catch(() => {});
  }, [chart]);

  if (details.isLoading) return <Screen edges={[]}><LoadingState label="Loading asset details…" /></Screen>;
  if (details.isError || !details.data) return <Screen edges={[]}><ErrorState message={details.error?.userMessage ?? 'This asset could not be found.'} onRetry={handleRefetch} /></Screen>;
  const asset = details.data;

  return (
    <Screen scroll edges={[]} contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <AssetIcon name={asset.name} symbol={asset.symbol} imageUrl={asset.imageUrl} size={58} />
        <View style={styles.identity}>
          <AppText variant="title">{asset.name}</AppText>
          <AppText color="muted">{asset.symbol.toUpperCase()} · Rank #{asset.marketCapRank}</AppText>
        </View>
      </View>
      <View style={styles.priceRow}>
        <PriceText value={asset.currentPrice} currency={currency} variant="display" />
        <ChangeBadge value={asset.priceChangePercentage24h} />
      </View>
      <View style={styles.actions}>
        <Button label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'} icon={isWatched ? StarOff : Star} onPress={handleWatchlistPress} variant={isWatched ? 'ghost' : 'secondary'} style={styles.action} />
        <Button label="Set alert" icon={BellPlus} onPress={() => navigation.navigate('AlertEditor', {assetId: asset.id, symbol: asset.symbol})} variant="ghost" style={styles.action} />
      </View>
      <Card style={styles.chartCard}>
        <View style={styles.timeframes}>
          {timeframes.map(item => {
            const active = timeframe === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                onPress={() => setTimeframe(item)}
                style={[styles.timeframe, active && {backgroundColor: theme.colors.primarySoft}]}>
                <AppText variant="caption" style={{color: active ? theme.colors.primary : theme.colors.textMuted}}>{item}</AppText>
              </Pressable>
            );
          })}
        </View>
        {chart.isLoading ? <LoadingState compact label="Loading chart…" /> : chart.isError ? <ErrorState message="Historical prices are temporarily unavailable." onRetry={handleChartRefetch} /> : <PriceChart points={chart.data ?? []} currency={currency} />}
      </Card>
      <SectionHeader title="Market statistics" />
      <Card style={styles.metrics}>
        {metrics.map(([label, value], index) => (
          <View key={label} style={[styles.metric, index > 0 && styles.metricBorder, index > 0 && {borderTopColor: theme.colors.divider}]}>
            <AppText color="muted">{label}</AppText>
            <AppText variant="bodyStrong" numeric>{value}</AppText>
          </View>
        ))}
      </Card>
      {asset.description ? (
        <View style={styles.description}>
          <SectionHeader title={`About ${asset.name}`} />
          <AppText color="muted">{asset.description}</AppText>
        </View>
      ) : null}
      <AppText variant="caption" color="muted" style={styles.disclaimer}>Market information is for demonstration only and is not financial advice.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {padding: 20, paddingBottom: 40, gap: 20},
  hero: {flexDirection: 'row', alignItems: 'center', gap: 14},
  identity: {flex: 1, gap: 2},
  priceRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  actions: {flexDirection: 'row', gap: 10},
  action: {flex: 1, paddingHorizontal: 10},
  chartCard: {gap: 16},
  timeframes: {flexDirection: 'row', justifyContent: 'space-between'},
  timeframe: {minWidth: 44, minHeight: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  metrics: {paddingVertical: 2},
  metric: {minHeight: 54, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16},
  metricBorder: {borderTopWidth: 1},
  description: {gap: 10},
  disclaimer: {textAlign: 'center', marginTop: 6},
});

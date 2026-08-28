import React, {memo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import type {CurrencyCode, MarketAsset} from '../types';
import {formatCompactNumber, formatCurrency} from '../utils/formatters';
import {useAppTheme} from '../theme';
import {AppText} from './AppText';
import {AssetIcon} from './AssetIcon';
import {ChangeBadge} from './ChangeBadge';
import {MiniTrend} from './MiniTrend';

type Props = {asset: MarketAsset; currency: CurrencyCode; onPress: (asset: MarketAsset) => void; showTrend?: boolean};

export const MarketRow = memo(function MarketRowBase({asset, currency, onPress, showTrend = true}: Props) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${asset.name}, ${formatCurrency(asset.currentPrice, currency)}, ${asset.priceChangePercentage24h >= 0 ? 'up' : 'down'} ${Math.abs(asset.priceChangePercentage24h).toFixed(2)} percent in 24 hours`}
      onPress={() => onPress(asset)}
      style={({pressed}) => [styles.row, {backgroundColor: pressed ? theme.colors.surfaceRaised : theme.colors.surface}]}>
      <AssetIcon name={asset.name} symbol={asset.symbol} imageUrl={asset.imageUrl} />
      <View style={styles.identity}>
        <AppText variant="bodyStrong" numberOfLines={1}>{asset.name}</AppText>
        <AppText variant="caption" color="muted">{asset.symbol.toUpperCase()} · {formatCompactNumber(asset.marketCap)}</AppText>
      </View>
      {showTrend ? <MiniTrend values={asset.sparkline7d} /> : null}
      <View style={styles.price}>
        <AppText variant="bodyStrong" numeric numberOfLines={1}>{formatCurrency(asset.currentPrice, currency)}</AppText>
        <ChangeBadge value={asset.priceChangePercentage24h} />
      </View>
      <ChevronRight size={17} color={theme.colors.textMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({row: {minHeight: 78, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12}, identity: {flex: 1, minWidth: 80, gap: 2}, price: {alignItems: 'flex-end', gap: 5, maxWidth: 112}});

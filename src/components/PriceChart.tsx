import React, {useMemo, useRef, useState} from 'react';
import {PanResponder, StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import Svg, {Circle, Line, Path} from 'react-native-svg';
import type {CurrencyCode, MarketPoint} from '../types';
import {formatCurrency, formatDateTime} from '../utils/formatters';
import {useAppTheme} from '../theme';
import {AppText} from './AppText';
import {EmptyState} from './EmptyState';

const CHART_HEIGHT = 220;

export function PriceChart({points, currency}: {points: MarketPoint[]; currency: CurrencyCode}) {
  const theme = useAppTheme();
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const currentIndex = selectedIndex ?? points.length - 1;
  const selected = currentIndex >= 0 ? points[currentIndex] : undefined;

  const geometry = useMemo(() => {
    if (width <= 0 || points.length < 2) return null;
    const prices = points.map(point => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || Math.max(max * 0.02, 1);
    const pad = 10;
    const coords = points.map((point, index) => ({
      x: (index / (points.length - 1)) * width,
      y: pad + (1 - (point.price - min) / range) * (CHART_HEIGHT - pad * 2),
    }));
    return {coords, path: coords.map((coord, index) => `${index ? 'L' : 'M'}${coord.x.toFixed(2)},${coord.y.toFixed(2)}`).join(' ')};
  }, [points, width]);

  const updateSelection = (x: number) => {
    if (!width || points.length < 2) return;
    const next = Math.max(0, Math.min(points.length - 1, Math.round((x / width) * (points.length - 1))));
    setSelectedIndex(next);
  };

  const updateRef = useRef(updateSelection);
  updateRef.current = updateSelection;
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => updateRef.current(event.nativeEvent.locationX),
    onPanResponderMove: event => updateRef.current(event.nativeEvent.locationX),
    onPanResponderRelease: () => undefined,
  })).current;

  if (points.length < 2) return <EmptyState title="Chart unavailable" message="Historical prices are not available for this timeframe." />;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const change = ((last.price - first.price) / first.price) * 100;
  const activeCoord = geometry?.coords[currentIndex];

  return (
    <View accessibilityLabel={`Price chart from ${formatCurrency(first.price, currency)} to ${formatCurrency(last.price, currency)}, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(2)} percent`}>
      <View style={styles.summary}>
        <View>
          <AppText variant="title" numeric>{selected ? formatCurrency(selected.price, currency) : '—'}</AppText>
          <AppText variant="caption" color="muted">{selected ? formatDateTime(selected.timestamp) : ''}</AppText>
        </View>
        <AppText variant="bodyStrong" numeric color={change >= 0 ? 'positive' : 'negative'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</AppText>
      </View>
      <View
        {...panResponder.panHandlers}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        style={styles.chart}>
        {width > 0 && geometry ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {[0.25, 0.5, 0.75].map(ratio => <Line key={ratio} x1={0} x2={width} y1={CHART_HEIGHT * ratio} y2={CHART_HEIGHT * ratio} stroke={theme.colors.chartGrid} strokeWidth={1} />)}
            <Path d={geometry.path} fill="none" stroke={change >= 0 ? theme.colors.positive : theme.colors.negative} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            {activeCoord ? <Line x1={activeCoord.x} x2={activeCoord.x} y1={0} y2={CHART_HEIGHT} stroke={theme.colors.textMuted} strokeDasharray="4 4" /> : null}
            {activeCoord ? <Circle cx={activeCoord.x} cy={activeCoord.y} r={5} fill={theme.colors.surface} stroke={theme.colors.primary} strokeWidth={3} /> : null}
          </Svg>
        ) : null}
      </View>
      <AppText variant="caption" color="muted" style={styles.hint}>Touch and drag to inspect prices</AppText>
    </View>
  );
}

const styles = StyleSheet.create({summary: {minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12}, chart: {height: CHART_HEIGHT, width: '100%'}, hint: {textAlign: 'center', marginTop: 6}});

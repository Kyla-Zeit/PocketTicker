import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ArrowDownRight, ArrowUpRight, Minus} from 'lucide-react-native';
import {AppText} from './AppText';
import {useAppTheme} from '../theme';
import {formatPercentage} from '../utils/formatters';

export function ChangeBadge({value}: {value: number | null | undefined}) {
  const theme = useAppTheme();
  const normalized = value ?? 0;
  const rising = normalized > 0;
  const falling = normalized < 0;
  const Icon = rising ? ArrowUpRight : falling ? ArrowDownRight : Minus;
  const color = rising ? theme.colors.positive : falling ? theme.colors.negative : theme.colors.textMuted;
  const bg = rising ? theme.colors.positiveSoft : falling ? theme.colors.negativeSoft : theme.colors.surfaceRaised;
  const label = `${rising ? 'Up' : falling ? 'Down' : 'Unchanged'} ${formatPercentage(Math.abs(normalized), false)}`;
  return (
    <View accessibilityLabel={label} style={[styles.badge, {backgroundColor: bg}]}>
      <Icon size={14} color={color} />
      <AppText variant="caption" numeric style={{color}}>{formatPercentage(normalized)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({badge: {alignSelf: 'flex-start', minHeight: 28, borderRadius: 999, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 3}});

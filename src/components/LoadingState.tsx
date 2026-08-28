import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {AppText} from './AppText';
import {useAppTheme} from '../theme';

export function LoadingState({label = 'Loading market data…', compact = false}: {label?: string; compact?: boolean}) {
  const theme = useAppTheme();
  return (
    <View accessibilityRole="progressbar" style={[styles.base, compact && styles.compact]}>
      <ActivityIndicator color={theme.colors.primary} />
      <AppText variant="caption" color="muted">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({base: {flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12}, compact: {flex: 0, minHeight: 72}});

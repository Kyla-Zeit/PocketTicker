import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useAppTheme} from '../theme';

export function Skeleton({height = 16, width = '100%', radius = 8}: {height?: number; width?: number | `${number}%`; radius?: number}) {
  const theme = useAppTheme();
  return <View accessibilityLabel="Loading" style={[styles.base, {height, width, borderRadius: radius, backgroundColor: theme.colors.skeleton}]} />;
}

const styles = StyleSheet.create({base: {opacity: 0.8}});

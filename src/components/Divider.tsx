import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useAppTheme} from '../theme';

export function Divider() {
  const theme = useAppTheme();
  return <View style={[styles.divider, {backgroundColor: theme.colors.divider}]} />;
}

const styles = StyleSheet.create({
  divider: {height: 1},
});

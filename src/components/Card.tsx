import React from 'react';
import {StyleSheet, View, type ViewProps} from 'react-native';
import {useAppTheme} from '../theme';

export function Card({style, ...props}: ViewProps) {
  const theme = useAppTheme();
  return (
    <View
      {...props}
      style={[
        styles.base,
        theme.shadows.card,
        {backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg},
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({base: {padding: 16}});

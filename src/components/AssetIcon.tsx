import React, {useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {AppText} from './AppText';
import {useAppTheme} from '../theme';

const swatches = ['#6658F5', '#2D9CDB', '#F2994A', '#27AE60', '#EB5757', '#9B51E0'];

function colorFor(value: string): string {
  const total = [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return swatches[total % swatches.length] ?? swatches[0]!;
}

export function AssetIcon({name, symbol, imageUrl, size = 42}: {name: string; symbol: string; imageUrl?: string | null; size?: number}) {
  const theme = useAppTheme();
  const [failed, setFailed] = useState(false);
  const sizeStyle = {width: size, height: size, borderRadius: size / 2};
  if (imageUrl && !failed) {
    return <Image accessibilityLabel={`${name} logo`} source={{uri: imageUrl}} onError={() => setFailed(true)} style={[sizeStyle, {backgroundColor: theme.colors.surfaceRaised}]} />;
  }
  return (
    <View accessibilityLabel={`${name} symbol`} style={[styles.fallback, sizeStyle, {backgroundColor: colorFor(symbol)}]}>
      <AppText variant="label" style={[styles.fallbackText, {fontSize: Math.max(11, size * 0.3)}]}>{symbol.slice(0, 3).toUpperCase()}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {alignItems: 'center', justifyContent: 'center'},
  fallbackText: {color: '#FFFFFF'},
});

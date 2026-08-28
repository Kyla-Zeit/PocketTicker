import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useAppTheme} from '../theme';

export function MiniTrend({values, width = 60, height = 28}: {values?: number[]; width?: number; height?: number}) {
  const theme = useAppTheme();
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const path = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const positive = values[values.length - 1]! >= values[0]!;
  return <Svg accessibilityLabel={`${positive ? 'Rising' : 'Falling'} seven-day trend`} width={width} height={height}><Path d={path} fill="none" stroke={positive ? theme.colors.positive : theme.colors.negative} strokeWidth={2} strokeLinecap="round" /></Svg>;
}

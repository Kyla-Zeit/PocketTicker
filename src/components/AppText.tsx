import React from 'react';
import {Text, type TextProps, type TextStyle} from 'react-native';
import {useAppTheme} from '../theme';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'label';

type Props = TextProps & {
  variant?: TextVariant;
  color?: 'text' | 'muted' | 'primary' | 'positive' | 'negative' | 'warning';
  numeric?: boolean;
};

export function AppText({variant = 'body', color = 'text', numeric, style, ...props}: Props) {
  const theme = useAppTheme();
  const colorValue = color === 'muted' ? theme.colors.textMuted : theme.colors[color];
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.6}
      {...props}
      style={[
        theme.typography[variant] as TextStyle,
        numeric && theme.typography.numeric,
        {color: colorValue},
        style,
      ]}
    />
  );
}

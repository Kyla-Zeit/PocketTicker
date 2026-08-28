import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, type ViewStyle} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {AppText} from './AppText';
import {useAppTheme} from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  accessibilityHint?: string;
  style?: ViewStyle | ViewStyle[];
};

export function Button({label, onPress, variant = 'primary', disabled, loading, icon: Icon, accessibilityHint, style}: Props) {
  const theme = useAppTheme();
  const palette = {
    primary: {bg: theme.colors.primary, fg: theme.dark ? '#10101A' : '#FFFFFF', border: theme.colors.primary},
    secondary: {bg: theme.colors.primarySoft, fg: theme.colors.primary, border: theme.colors.primarySoft},
    danger: {bg: theme.colors.negativeSoft, fg: theme.colors.negative, border: theme.colors.negativeSoft},
    ghost: {bg: 'transparent', fg: theme.colors.text, border: theme.colors.border},
  }[variant];
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled: inactive, busy: loading}}
      disabled={inactive}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        {backgroundColor: palette.bg, borderColor: palette.border, opacity: inactive ? 0.5 : pressed ? 0.82 : 1},
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={palette.fg} /> : null}
      {!loading && Icon ? <Icon size={18} color={palette.fg} /> : null}
      <AppText variant="bodyStrong" style={{color: palette.fg}}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {minHeight: 48, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8},
});

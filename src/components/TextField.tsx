import React from 'react';
import {StyleSheet, TextInput, View, type TextInputProps} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {AppText} from './AppText';
import {useAppTheme} from '../theme';

type Props = TextInputProps & {label?: string; error?: string; icon?: LucideIcon};

export function TextField({label, error, icon: Icon, style, ...props}: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.wrapper}>
      {label ? <AppText variant="caption" style={styles.label}>{label}</AppText> : null}
      <View style={[styles.field, {backgroundColor: theme.colors.surface, borderColor: error ? theme.colors.negative : theme.colors.border}]}>
        {Icon ? <Icon size={20} color={theme.colors.textMuted} /> : null}
        <TextInput
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          {...props}
          style={[styles.input, theme.typography.body, {color: theme.colors.text}, style]}
        />
      </View>
      {error ? <AppText color="negative" variant="caption" accessibilityRole="alert">{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {gap: 6},
  label: {marginLeft: 2},
  field: {minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10},
  input: {flex: 1, paddingVertical: 0},
});

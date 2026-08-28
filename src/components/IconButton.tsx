import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useAppTheme} from '../theme';

type Props = {icon: LucideIcon; label: string; onPress: () => void; active?: boolean; disabled?: boolean};

export function IconButton({icon: Icon, label, onPress, active, disabled}: Props) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected: active, disabled}}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        {backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface, opacity: disabled ? 0.4 : pressed ? 0.7 : 1},
      ]}>
      <Icon size={21} color={active ? theme.colors.primary : theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({base: {width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center'}});

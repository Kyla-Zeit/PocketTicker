import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Inbox, type LucideIcon} from 'lucide-react-native';
import {AppText} from './AppText';
import {Button} from './Button';
import {useAppTheme} from '../theme';

type Props = {title: string; message: string; actionLabel?: string; onAction?: () => void; icon?: LucideIcon};

export function EmptyState({title, message, actionLabel, onAction, icon: Icon = Inbox}: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.base} accessibilityLabel={`${title}. ${message}`}>
      <View style={[styles.icon, {backgroundColor: theme.colors.primarySoft}]}><Icon size={28} color={theme.colors.primary} /></View>
      <AppText variant="heading" style={styles.center}>{title}</AppText>
      <AppText color="muted" style={styles.center}>{message}</AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({base: {flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10}, icon: {width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4}, center: {textAlign: 'center'}, button: {marginTop: 8}});

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppText} from './AppText';
import {Button} from './Button';

type Props = {title: string; subtitle?: string; actionLabel?: string; onAction?: () => void};

export function SectionHeader({title, subtitle, actionLabel, onAction}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="heading">{title}</AppText>
        {subtitle ? <AppText variant="caption" color="muted">{subtitle}</AppText> : null}
      </View>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="ghost" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12}, text: {flex: 1, gap: 2}, action: {minHeight: 40, paddingHorizontal: 12}});

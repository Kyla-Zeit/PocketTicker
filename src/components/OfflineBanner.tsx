import React from 'react';
import {StyleSheet, View} from 'react-native';
import {WifiOff} from 'lucide-react-native';
import {AppText} from './AppText';
import {useAppTheme} from '../theme';
import {formatRelativeTime} from '../utils/formatters';

export function OfflineBanner({offline, lastUpdated}: {offline: boolean; lastUpdated?: number}) {
  const theme = useAppTheme();
  if (!offline) return null;
  return (
    <View accessibilityRole="alert" style={[styles.base, {backgroundColor: theme.colors.primarySoft}]}>
      <WifiOff size={16} color={theme.colors.primary} />
      <AppText variant="caption" style={{color: theme.colors.primary}}>
        Offline · Showing cached prices{lastUpdated ? ` from ${formatRelativeTime(lastUpdated)}` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({base: {minHeight: 36, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7}});

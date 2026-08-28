import React, {useEffect} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {CheckCircle2, CircleAlert, Info, X} from 'lucide-react-native';
import {useSnackbarStore} from '../store/snackbarStore';
import {useAppTheme} from '../theme';
import {AppText} from './AppText';

export function SnackbarHost() {
  const theme = useAppTheme();
  const message = useSnackbarStore(state => state.message);
  const variant = useSnackbarStore(state => state.variant);
  const dismiss = useSnackbarStore(state => state.dismiss);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(dismiss, 3_200);
    return () => clearTimeout(timer);
  }, [dismiss, message]);
  if (!message) return null;
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? CircleAlert : Info;
  const color = variant === 'success' ? theme.colors.positive : variant === 'error' ? theme.colors.negative : theme.colors.primary;
  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View accessibilityRole="alert" style={[styles.snackbar, theme.shadows.card, {backgroundColor: theme.colors.surfaceRaised, borderColor: theme.colors.border}]}>
        <Icon size={20} color={color} />
        <AppText variant="bodyStrong" style={styles.message}>{message}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" hitSlop={10} onPress={dismiss}><X size={19} color={theme.colors.textMuted} /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({host: {position: 'absolute', left: 16, right: 16, bottom: 22, alignItems: 'center'}, snackbar: {width: '100%', maxWidth: 520, minHeight: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10}, message: {flex: 1}});

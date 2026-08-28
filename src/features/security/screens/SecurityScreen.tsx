import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Fingerprint, LockKeyhole, ShieldCheck} from 'lucide-react-native';
import {usePreferencesStore} from '../../../store/preferencesStore';
import {useSnackbarStore} from '../../../store/snackbarStore';
import {biometricService, type BiometricCapability} from '../../../services/biometricService';
import {AppText, Button, Card, LoadingState, Screen, SectionHeader} from '../../../components';
import {useAppTheme} from '../../../theme';

export function SecurityScreen() {
  const theme = useAppTheme();
  const enabled = usePreferencesStore(state => state.requireBiometricUnlock);
  const setEnabled = usePreferencesStore(state => state.setRequireBiometricUnlock);
  const showSnackbar = useSnackbarStore(state => state.show);
  const [capability, setCapability] = useState<BiometricCapability>();
  const [working, setWorking] = useState(false);

  useEffect(() => {
    biometricService.getCapability().then(setCapability).catch(() => {});
  }, []);

  const toggle = useCallback(async () => {
    setWorking(true);
    try {
      if (!enabled) {
        const configured = await biometricService.enableLock();
        if (!configured.success) {
          showSnackbar(configured.error ?? 'App lock could not be enabled', 'error');
          return;
        }
        const authenticated = await biometricService.authenticate('Confirm PocketTicker app lock');
        if (!authenticated.success) {
          await biometricService.disableLock();
          showSnackbar(authenticated.error ?? 'Authentication was not completed', 'error');
          return;
        }
        await setEnabled(true);
        showSnackbar('App lock enabled', 'success');
      } else {
        const authenticated = await biometricService.authenticate('Disable PocketTicker app lock');
        if (!authenticated.success) {
          showSnackbar(authenticated.error ?? 'Authentication was not completed', 'error');
          return;
        }
        const removed = await biometricService.disableLock();
        if (!removed.success) {
          showSnackbar(removed.error ?? 'App lock could not be disabled', 'error');
          return;
        }
        await setEnabled(false);
        showSnackbar('App lock disabled', 'success');
      }
    } finally {
      setWorking(false);
    }
  }, [enabled, setEnabled, showSnackbar]);

  const handleToggle = useCallback(() => {
    toggle().catch(() => {});
  }, [toggle]);

  if (!capability) return <Screen edges={[]}><LoadingState label="Checking device security…" /></Screen>;

  return (
    <Screen scroll edges={[]} contentContainerStyle={styles.screen}>
      <View style={[styles.hero, {backgroundColor: theme.colors.primarySoft}]}><ShieldCheck size={42} color={theme.colors.primary} /><AppText variant="title">Protect your local portfolio</AppText><AppText color="muted" style={styles.center}>PocketTicker can require Android biometrics or your device credential before displaying the application.</AppText></View>
      <Card style={styles.status}><Fingerprint size={28} color={capability.available ? theme.colors.positive : theme.colors.textMuted} /><View style={styles.statusText}><AppText variant="bodyStrong">{capability.available ? 'Device authentication available' : 'Authentication unavailable'}</AppText><AppText variant="caption" color="muted">{capability.biometryType ? `Detected: ${capability.biometryType}` : capability.reason ?? 'Device credential fallback may be used.'}</AppText></View></Card>
      <SectionHeader title="Require authentication" subtitle="The app waits behind a lock screen during startup, so portfolio values are never flashed before authentication." />
      <Button label={enabled ? 'Disable app lock' : 'Enable app lock'} icon={enabled ? LockKeyhole : Fingerprint} onPress={handleToggle} disabled={!enabled && !capability.available} loading={working} variant={enabled ? 'danger' : 'primary'} />
      <AppText variant="caption" color="muted">Security depends on the screen lock and biometric enrollment configured in Android. If biometrics change, Android may require the device passcode or invalidate the secure sentinel.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {padding: 20, paddingBottom: 40, gap: 20},
  hero: {padding: 24, borderRadius: 22, alignItems: 'center', gap: 10},
  center: {textAlign: 'center'},
  status: {flexDirection: 'row', alignItems: 'center', gap: 14},
  statusText: {flex: 1, gap: 3},
});

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, StyleSheet, View} from 'react-native';
import {LockKeyhole, RefreshCw, ShieldCheck} from 'lucide-react-native';
import {useIsRestoring} from '@tanstack/react-query';
import {alertRepository, portfolioRepository, recentSearchRepository, recentlyViewedRepository, watchlistRepository} from '../repositories';
import {usePreferencesStore} from '../store/preferencesStore';
import {biometricService} from '../services/biometricService';
import {configureBackgroundAlerts} from '../services/backgroundAlerts';
import {notificationService} from '../services/notificationService';
import {runConfiguredAlertCheck} from './alertTasks';
import {AppText, Button, LoadingState, Screen} from '../components';
import {useAppTheme} from '../theme';

type Phase = 'booting' | 'locked' | 'ready';

export function StartupGate({children}: React.PropsWithChildren) {
  const theme = useAppTheme();
  const isRestoring = useIsRestoring();
  const hydratePreferences = usePreferencesStore(state => state.hydrate);
  const [phase, setPhase] = useState<Phase>('booting');
  const [authError, setAuthError] = useState<string>();
  const started = useRef(false);

  const authenticate = useCallback(async () => {
    setAuthError(undefined);
    const result = await biometricService.authenticate();
    if (result.success) {
      setPhase('ready');
    } else {
      setAuthError(result.error ?? 'Authentication was not completed.');
      setPhase('locked');
    }
  }, []);

  const handleAuthenticate = useCallback(() => {
    authenticate().catch(() => {});
  }, [authenticate]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const bootstrap = async () => {
      await Promise.all([
        hydratePreferences(),
        watchlistRepository.hydrate(),
        portfolioRepository.hydrate(),
        alertRepository.hydrate(),
        recentSearchRepository.hydrate(),
        recentlyViewedRepository.hydrate(),
        notificationService.initialize().catch(() => undefined),
      ]);
      if (usePreferencesStore.getState().requireBiometricUnlock) {
        await authenticate();
      } else {
        setPhase('ready');
      }
      runConfiguredAlertCheck().catch(() => undefined);
      configureBackgroundAlerts(runConfiguredAlertCheck).catch(() => undefined);
    };

    bootstrap().catch(() => {});
  }, [authenticate, hydratePreferences]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && phase === 'ready') {
        runConfiguredAlertCheck().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [phase]);

  if (phase === 'booting' || isRestoring) return <Screen><LoadingState label={isRestoring ? 'Restoring offline market cache…' : 'Securing PocketTicker…'} /></Screen>;
  if (phase === 'locked') {
    return (
      <Screen contentContainerStyle={styles.lockScreen}>
        <View style={[styles.lockIcon, {backgroundColor: theme.colors.primarySoft}]}><LockKeyhole size={42} color={theme.colors.primary} /></View>
        <AppText variant="title" style={styles.center}>PocketTicker is locked</AppText>
        <AppText color="muted" style={styles.center}>Authenticate with your Android biometric or device credential to reveal portfolio information.</AppText>
        {authError ? <AppText color="negative" variant="caption" style={styles.center}>{authError}</AppText> : null}
        <Button label="Unlock PocketTicker" icon={ShieldCheck} onPress={handleAuthenticate} />
        <Button label="Try again" icon={RefreshCw} variant="ghost" onPress={handleAuthenticate} />
      </Screen>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  lockScreen: {padding: 28, alignItems: 'stretch', justifyContent: 'center', gap: 14},
  lockIcon: {width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 4},
  center: {textAlign: 'center'},
});

import React, {useEffect} from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {AppThemeProvider, useAppTheme} from '../theme';
import {QUERY_CACHE_MAX_AGE, configureQueryManagers, queryClient, queryPersister} from './queryClient';
import {SnackbarHost} from '../components/SnackbarHost';

function ThemedChrome({children}: React.PropsWithChildren) {
  const theme = useAppTheme();
  return (
    <>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      {children}
      <SnackbarHost />
    </>
  );
}

export function AppProviders({children}: React.PropsWithChildren) {
  useEffect(() => configureQueryManagers(), []);
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: QUERY_CACHE_MAX_AGE,
            buster: 'pocketticker-v1',
            dehydrateOptions: {shouldDehydrateQuery: query => query.state.status === 'success'},
          }}>
          <AppThemeProvider><ThemedChrome>{children}</ThemedChrome></AppThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {AppState, type AppStateStatus, Platform} from 'react-native';
import {QueryClient, focusManager, onlineManager} from '@tanstack/react-query';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';

export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: QUERY_CACHE_MAX_AGE,
      retry: failureCount => failureCount < 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {networkMode: 'offlineFirst'},
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@pocketticker/query-cache/v1',
  throttleTime: 1_000,
});

let configured = false;

export function configureQueryManagers(): () => void {
  if (configured) return () => undefined;
  configured = true;
  const unsubscribeNetwork = NetInfo.addEventListener(state => {
    onlineManager.setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  });
  return () => {
    configured = false;
    unsubscribeNetwork();
    subscription.remove();
  };
}

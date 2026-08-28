import NetInfo, {
  type NetInfoState,
  type NetInfoStateType,
} from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  type: NetInfoStateType;
}

const INITIAL_NETWORK_STATUS: NetworkStatus = {
  isConnected: null,
  isInternetReachable: null,
  isOffline: false,
  type: 'unknown' as NetInfoStateType,
};

let currentStatus = INITIAL_NETWORK_STATUS;
const listeners = new Set<() => void>();
let unsubscribeNetInfo: (() => void) | undefined;

const toNetworkStatus = (state: NetInfoState): NetworkStatus => ({
  isConnected: state.isConnected,
  isInternetReachable: state.isInternetReachable,
  isOffline: state.isConnected === false || state.isInternetReachable === false,
  type: state.type,
});

const publish = (state: NetInfoState): void => {
  const next = toNetworkStatus(state);
  if (
    next.isConnected === currentStatus.isConnected &&
    next.isInternetReachable === currentStatus.isInternetReachable &&
    next.type === currentStatus.type
  ) {
    return;
  }

  currentStatus = next;
  listeners.forEach(listener => listener());
};

const start = (): void => {
  if (unsubscribeNetInfo) {
    return;
  }

  unsubscribeNetInfo = NetInfo.addEventListener(publish);
  NetInfo.fetch()
    .then(publish)
    .catch(() => {
      // Keep the last known state. Native reachability events will retry naturally.
    });
};

const stop = (): void => {
  unsubscribeNetInfo?.();
  unsubscribeNetInfo = undefined;
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
    }
  };
};

export const getNetworkStatus = (): NetworkStatus => currentStatus;

export const useNetworkStatus = (): NetworkStatus =>
  useSyncExternalStore(subscribe, getNetworkStatus, getNetworkStatus);

/** Call once during application setup so Query pauses requests offline and resumes
 * stale queries after reachability returns. */
export const configureQueryOnlineManager = (): void => {
  onlineManager.setEventListener(setOnline =>
    NetInfo.addEventListener(state => {
      setOnline(
        state.isConnected === true && state.isInternetReachable !== false,
      );
    }),
  );
};

export const configureNetworkAwareness = configureQueryOnlineManager;

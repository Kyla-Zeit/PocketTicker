import { focusManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const toAppStateStatus = (state: string | null | undefined): AppStateStatus => {
  switch (state) {
    case 'active':
    case 'background':
    case 'inactive':
    case 'unknown':
    case 'extension':
      return state;
    default:
      return 'unknown';
  }
};

let currentAppState: AppStateStatus = toAppStateStatus(AppState.currentState);
const listeners = new Set<() => void>();
let removeNativeListener: (() => void) | undefined;

const start = (): void => {
  if (removeNativeListener) {
    return;
  }

  const subscription = AppState.addEventListener('change', nativeState => {
    const nextState = toAppStateStatus(nativeState);
    if (nextState === currentAppState) {
      return;
    }
    currentAppState = nextState;
    listeners.forEach(listener => listener());
  });
  removeNativeListener = () => subscription.remove();
};

const stop = (): void => {
  removeNativeListener?.();
  removeNativeListener = undefined;
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

export const getAppLifecycleState = (): AppStateStatus => currentAppState;

export const useAppLifecycle = (): AppStateStatus =>
  useSyncExternalStore(subscribe, getAppLifecycleState, getAppLifecycleState);

/** Call once during Query setup so background transitions do not masquerade as
 * browser focus and returning to the foreground can refresh stale data. */
export const configureQueryFocusManager = (): void => {
  focusManager.setEventListener(setFocused => {
    const subscription = AppState.addEventListener('change', state => {
      setFocused(toAppStateStatus(state) === 'active');
    });
    return () => subscription.remove();
  });
};

export const configureAppLifecycleAwareness = configureQueryFocusManager;

import { create } from 'zustand';

import { preferencesRepository } from '../repositories';
import {
  DEFAULT_USER_PREFERENCES,
  type CurrencyCode,
  type ThemePreference,
  type UserPreferences,
} from '../types';

export interface PreferencesState extends UserPreferences {
  /** Compatibility alias used by the theme provider. */
  themeMode: ThemePreference;
  /** Compatibility aliases that read naturally in startup/security UI. */
  biometricLockEnabled: boolean;
  onboardingComplete: boolean;
  isHydrated: boolean;
  hydrationError: string | null;
  hydrate(): Promise<void>;
  updatePreferences(patch: Partial<UserPreferences>): Promise<void>;
  setCurrency(currency: CurrencyCode): Promise<void>;
  setTheme(theme: ThemePreference): Promise<void>;
  setThemeMode(theme: ThemePreference): Promise<void>;
  setHideBalances(hidden: boolean): Promise<void>;
  setRequireBiometricUnlock(enabled: boolean): Promise<void>;
  setBiometricLockEnabled(enabled: boolean): Promise<void>;
  setNotificationsEnabled(enabled: boolean): Promise<void>;
  setHasCompletedOnboarding(completed: boolean): Promise<void>;
  setOnboardingComplete(completed: boolean): Promise<void>;
  resetPreferences(): Promise<void>;
}

const toPreferenceFields = (
  preferences: Readonly<UserPreferences>,
): Pick<
  PreferencesState,
  | keyof UserPreferences
  | 'themeMode'
  | 'biometricLockEnabled'
  | 'onboardingComplete'
> => ({
  ...preferences,
  themeMode: preferences.theme,
  biometricLockEnabled: preferences.requireBiometricUnlock,
  onboardingComplete: preferences.hasCompletedOnboarding,
});

const friendlyPersistenceError = (): string =>
  'Preferences could not be saved on this device.';

let hydrationPromise: Promise<void> | null = null;

export const usePreferencesStore = create<PreferencesState>()((set, get) => {
  const persist = async (patch: Partial<UserPreferences>): Promise<void> => {
    try {
      await preferencesRepository.update(patch);
      const snapshot = preferencesRepository.getSnapshot();
      set({
        ...toPreferenceFields(snapshot.value),
        isHydrated: snapshot.isHydrated,
        hydrationError: snapshot.error ? friendlyPersistenceError() : null,
      });
    } catch {
      set({ hydrationError: friendlyPersistenceError() });
    }
  };

  return {
    ...toPreferenceFields(DEFAULT_USER_PREFERENCES),
    isHydrated: false,
    hydrationError: null,
    hydrate: async () => {
      if (get().isHydrated) {
        return;
      }

      if (!hydrationPromise) {
        hydrationPromise = preferencesRepository
          .hydrate()
          .then(snapshot => {
            set({
              ...toPreferenceFields(snapshot.value),
              isHydrated: true,
              hydrationError: snapshot.error
                ? 'Some saved preferences were invalid and have been reset.'
                : null,
            });
          })
          .catch(() => {
            set({
              ...toPreferenceFields(DEFAULT_USER_PREFERENCES),
              isHydrated: true,
              hydrationError: 'Preferences could not be loaded.',
            });
          })
          .finally(() => {
            hydrationPromise = null;
          });
      }

      await hydrationPromise;
    },
    updatePreferences: persist,
    setCurrency: currency => persist({ currency }),
    setTheme: theme => persist({ theme }),
    setThemeMode: theme => persist({ theme }),
    setHideBalances: hideBalances => persist({ hideBalances }),
    setRequireBiometricUnlock: requireBiometricUnlock =>
      persist({ requireBiometricUnlock }),
    setBiometricLockEnabled: requireBiometricUnlock =>
      persist({ requireBiometricUnlock }),
    setNotificationsEnabled: notificationsEnabled =>
      persist({ notificationsEnabled }),
    setHasCompletedOnboarding: hasCompletedOnboarding =>
      persist({ hasCompletedOnboarding }),
    setOnboardingComplete: hasCompletedOnboarding =>
      persist({ hasCompletedOnboarding }),
    resetPreferences: async () => {
      try {
        const preferences = await preferencesRepository.reset();
        set({
          ...toPreferenceFields(preferences),
          isHydrated: true,
          hydrationError: null,
        });
      } catch {
        set({ hydrationError: friendlyPersistenceError() });
      }
    },
  };
});

// Keep Zustand as a reactive view of the repository without giving it a second
// persistence mechanism or a competing source of truth.
preferencesRepository.subscribe(() => {
  const snapshot = preferencesRepository.getSnapshot();
  usePreferencesStore.setState({
    ...toPreferenceFields(snapshot.value),
    isHydrated: snapshot.isHydrated,
    hydrationError: snapshot.error ? friendlyPersistenceError() : null,
  });
});

export const hydratePreferences = (): Promise<void> =>
  usePreferencesStore.getState().hydrate();

import type { UserPreferences } from '../types';
import { PersistentValueRepository } from './base';
import { userPreferencesSchema } from './schemas';
import {
  REPOSITORY_STORAGE_KEYS,
  repositoryStorage,
  type RepositoryStorage,
} from './storage';

export const DEFAULT_USER_PREFERENCES: Readonly<UserPreferences> =
  Object.freeze({
    currency: 'CAD',
    theme: 'system',
    hideBalances: false,
    requireBiometricUnlock: false,
    notificationsEnabled: true,
    hasCompletedOnboarding: false,
  });

export class PreferencesRepository extends PersistentValueRepository<UserPreferences> {
  constructor(
    storage: RepositoryStorage = repositoryStorage,
    storageKey: string = REPOSITORY_STORAGE_KEYS.preferences,
  ) {
    super({
      storage,
      storageKey,
      schema: userPreferencesSchema,
      defaultValue: { ...DEFAULT_USER_PREFERENCES },
    });
  }

  readonly update = (
    patch: Partial<UserPreferences>,
  ): Promise<Readonly<UserPreferences>> =>
    this.commit(preferences => ({ ...preferences, ...patch }));

  readonly reset = (): Promise<Readonly<UserPreferences>> =>
    this.resetToDefault();
}

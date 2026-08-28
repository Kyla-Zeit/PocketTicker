import * as Keychain from 'react-native-keychain';

const APP_LOCK_SERVICE = 'com.pocketticker.secure-app-lock';
const SENTINEL_USERNAME = 'pocketticker-app-lock';

export interface BiometricCapability {
  available: boolean;
  biometryType?: string;
  reason?: string;
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
}

interface KeychainAdapter {
  canImplyAuthentication(
    options?: Keychain.AuthenticationTypeOption,
  ): Promise<boolean>;
  getSupportedBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null>;
  hasGenericPassword(options?: Keychain.BaseOptions): Promise<boolean>;
  isPasscodeAuthAvailable(): Promise<boolean>;
  getGenericPassword(
    options?: Keychain.GetOptions,
  ): ReturnType<typeof Keychain.getGenericPassword>;
  resetGenericPassword(options?: Keychain.BaseOptions): Promise<boolean>;
  setGenericPassword(
    username: string,
    password: string,
    options?: Keychain.SetOptions,
  ): ReturnType<typeof Keychain.setGenericPassword>;
}

const friendlyAuthenticationError = (error: unknown): string => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (
    message.includes('cancel') ||
    message.includes('user canceled') ||
    message.includes('user cancelled')
  ) {
    return 'Authentication was cancelled.';
  }

  if (message.includes('lockout') || message.includes('too many')) {
    return 'Authentication is temporarily locked. Use your device credential or try again later.';
  }

  return 'Authentication failed. Please try again.';
};

const createSentinel = (): string =>
  `configured:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2)}`;

export class BiometricService {
  public constructor(private readonly native: KeychainAdapter = Keychain) {}

  public async getCapability(): Promise<BiometricCapability> {
    try {
      const [canAuthenticate, biometryType, passcodeAvailable] =
        await Promise.all([
          this.native.canImplyAuthentication({
            authenticationType:
              Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          }),
          this.native.getSupportedBiometryType(),
          this.native.isPasscodeAuthAvailable(),
        ]);

      if (!canAuthenticate && !biometryType && !passcodeAvailable) {
        return {
          available: false,
          reason:
            'Set up a screen lock or biometrics in Android settings first.',
        };
      }

      return {
        available: true,
        ...(biometryType ? { biometryType: String(biometryType) } : {}),
      };
    } catch {
      return {
        available: false,
        reason: 'Device authentication is unavailable.',
      };
    }
  }

  public async isLockConfigured(): Promise<boolean> {
    try {
      return await this.native.hasGenericPassword({
        service: APP_LOCK_SERVICE,
      });
    } catch {
      return false;
    }
  }

  public async enableLock(): Promise<AuthenticationResult> {
    const capability = await this.getCapability();
    if (!capability.available) {
      return {
        success: false,
        error: capability.reason ?? 'Device authentication is unavailable.',
      };
    }

    try {
      const saved = await this.native.setGenericPassword(
        SENTINEL_USERNAME,
        createSentinel(),
        {
          service: APP_LOCK_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
          accessControl:
            Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
          securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
        },
      );

      return saved
        ? { success: true }
        : { success: false, error: 'App lock could not be enabled.' };
    } catch (error) {
      return { success: false, error: friendlyAuthenticationError(error) };
    }
  }

  public async authenticate(
    reason = 'Unlock PocketTicker',
  ): Promise<AuthenticationResult> {
    if (!(await this.isLockConfigured())) {
      return { success: false, error: 'App lock is not configured.' };
    }

    try {
      const credentials = await this.native.getGenericPassword({
        service: APP_LOCK_SERVICE,
        accessControl:
          Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
        authenticationPrompt: {
          title: reason,
          subtitle: 'Confirm your identity to continue',
          cancel: 'Cancel',
        },
      });

      const success =
        credentials !== false && credentials.username === SENTINEL_USERNAME;
      return success
        ? { success: true }
        : { success: false, error: 'Authentication was not completed.' };
    } catch (error) {
      return { success: false, error: friendlyAuthenticationError(error) };
    }
  }

  public async disableLock(): Promise<AuthenticationResult> {
    try {
      const removed = await this.native.resetGenericPassword({
        service: APP_LOCK_SERVICE,
      });
      return removed
        ? { success: true }
        : { success: false, error: 'App lock could not be disabled.' };
    } catch {
      return { success: false, error: 'App lock could not be disabled.' };
    }
  }
}

export const biometricService = new BiometricService();

export { APP_LOCK_SERVICE };

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'device-only' },
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'biometry-or-passcode',
  },
  AUTHENTICATION_TYPE: {
    DEVICE_PASSCODE_OR_BIOMETRICS: 'device-passcode-or-biometrics',
  },
  SECURITY_LEVEL: { SECURE_SOFTWARE: 0 },
  canImplyAuthentication: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  hasGenericPassword: jest.fn(),
  isPasscodeAuthAvailable: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

import { BiometricService } from '../biometricService';

const createNative = () => ({
  canImplyAuthentication: jest.fn().mockResolvedValue(true),
  getSupportedBiometryType: jest.fn().mockResolvedValue('Fingerprint'),
  hasGenericPassword: jest.fn().mockResolvedValue(true),
  isPasscodeAuthAvailable: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue({
    username: 'pocketticker-app-lock',
    password: 'sentinel',
    service: 'test',
    storage: 'test',
  }),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  setGenericPassword: jest.fn().mockResolvedValue({
    service: 'test',
    storage: 'test',
  }),
});

describe('BiometricService', () => {
  it('reports biometric or device-credential capability', async () => {
    const native = createNative();
    const service = new BiometricService(native as never);

    await expect(service.getCapability()).resolves.toEqual({
      available: true,
      biometryType: 'Fingerprint',
    });
  });

  it('authenticates by reading the protected secure sentinel', async () => {
    const native = createNative();
    const service = new BiometricService(native as never);

    await expect(service.authenticate()).resolves.toEqual({ success: true });
    expect(native.getGenericPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        service: 'com.pocketticker.secure-app-lock',
        accessControl: 'biometry-or-passcode',
      }),
    );
  });

  it('returns a friendly cancellation message without exposing native errors', async () => {
    const native = createNative();
    native.getGenericPassword.mockRejectedValueOnce(
      new Error('Native user cancelled operation 8127'),
    );
    const service = new BiometricService(native as never);

    await expect(service.authenticate()).resolves.toEqual({
      success: false,
      error: 'Authentication was cancelled.',
    });
  });
});

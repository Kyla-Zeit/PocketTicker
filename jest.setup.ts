import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  const mockApi = {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
    getAllKeys: jest.fn(async () => Array.from(store.keys())),
    multiGet: jest.fn(async (keys: string[]) => keys.map((k: string) => [k, store.get(k) ?? null])),
    multiSet: jest.fn(async (pairs: [string, string][]) => {
      for (const [k, v] of pairs) {
        store.set(k, v);
      }
    }),
    multiRemove: jest.fn(async (keys: string[]) => {
      for (const k of keys) {
        store.delete(k);
      }
    }),
  };
  return {
    __esModule: true,
    default: mockApi,
    useAsyncStorage: (key: string) => ({
      getItem: () => mockApi.getItem(key),
      setItem: (value: string) => mockApi.setItem(key, value),
      removeItem: () => mockApi.removeItem(key),
    }),
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const SafeAreaInsetsContext = React.createContext(inset);
  const SafeAreaFrameContext = React.createContext(frame);
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaConsumer: ({ children }: { children: (insets: typeof inset) => React.ReactNode }) => children(inset),
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    initialWindowMetrics: {
      insets: inset,
      frame,
    },
  };
});

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    shouldUseActivityState: jest.fn(() => true),
    compatibilityFlags: {
      usesNewAndroidHeaderHeightImplementation: false,
    },
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    NativeScreenNavigationContainer: View,
    ScreenStack: View,
    ScreenStackItem: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    SearchBar: View,
    Tabs: View,
  };
});

// Mock react-native-config
jest.mock('react-native-config', () => ({
  MARKET_DATA_PROVIDER: 'mock',
  COINGECKO_API_KEY: '',
}));

// Mock @notifee/react-native
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('price-alerts'),
    displayNotification: jest.fn().mockResolvedValue('notification-id'),
    getNotificationSettings: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
  },
  AndroidImportance: { HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 },
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));

// Mock react-native-background-fetch
jest.mock('react-native-background-fetch', () => ({
  __esModule: true,
  default: {
    NETWORK_TYPE_ANY: 1,
    configure: jest.fn().mockResolvedValue(2),
    finish: jest.fn(),
    registerHeadlessTask: jest.fn(),
    stop: jest.fn().mockResolvedValue(true),
    status: jest.fn(callback => callback && callback(2)),
    STATUS_AVAILABLE: 2,
  },
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'device-only' },
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'biometry-or-passcode',
  },
  AUTHENTICATION_TYPE: {
    DEVICE_PASSCODE_OR_BIOMETRICS: 'device-passcode-or-biometrics',
  },
  SECURITY_LEVEL: { SECURE_SOFTWARE: 0 },
  canImplyAuthentication: jest.fn().mockResolvedValue(true),
  getSupportedBiometryType: jest.fn().mockResolvedValue('Fingerprint'),
  hasGenericPassword: jest.fn().mockResolvedValue(false),
  isPasscodeAuthAvailable: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(null),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  setGenericPassword: jest.fn().mockResolvedValue({ service: 'test', storage: 'test' }),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMockComponent = (name: string) => {
    const Component = (props: any) => React.createElement(View, props, props.children);
    Component.displayName = name;
    return Component;
  };
  return {
    __esModule: true,
    default: createMockComponent('Svg'),
    Svg: createMockComponent('Svg'),
    Circle: createMockComponent('Circle'),
    Ellipse: createMockComponent('Ellipse'),
    G: createMockComponent('G'),
    Text: createMockComponent('Text'),
    TSpan: createMockComponent('TSpan'),
    TextPath: createMockComponent('TextPath'),
    Path: createMockComponent('Path'),
    Polygon: createMockComponent('Polygon'),
    Polyline: createMockComponent('Polyline'),
    Line: createMockComponent('Line'),
    Rect: createMockComponent('Rect'),
    Use: createMockComponent('Use'),
    Image: createMockComponent('Image'),
    Symbol: createMockComponent('Symbol'),
    Defs: createMockComponent('Defs'),
    LinearGradient: createMockComponent('LinearGradient'),
    RadialGradient: createMockComponent('RadialGradient'),
    Stop: createMockComponent('Stop'),
    ClipPath: createMockComponent('ClipPath'),
    Mask: createMockComponent('Mask'),
  };
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          const Icon = (props: any) => React.createElement(View, { testID: `icon-${prop}`, ...props });
          Icon.displayName = `LucideIcon(${prop})`;
          return Icon;
        }
        return undefined;
      },
    },
  );
});


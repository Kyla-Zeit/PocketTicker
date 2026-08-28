declare module 'react-native-config' {
  interface NativeConfig {
    readonly MARKET_DATA_PROVIDER?: 'mock' | 'coingecko';
    readonly COINGECKO_API_KEY?: string;
  }

  const Config: NativeConfig;
  export default Config;
}

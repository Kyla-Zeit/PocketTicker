import type {NavigatorScreenParams} from '@react-navigation/native';

export type MainTabParamList = {
  Markets: undefined;
  Watchlist: undefined;
  Alerts: undefined;
  Portfolio: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  AssetDetails: {assetId: string};
  Search: undefined;
  AlertEditor: {alertId?: string; assetId?: string; symbol?: string} | undefined;
  PortfolioEditor: {holdingId?: string} | undefined;
  Security: undefined;
  About: undefined;
  Diagnostics: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

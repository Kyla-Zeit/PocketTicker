import React from 'react';
import {NavigationContainer, type LinkingOptions, type Theme as NavigationTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Bell, ChartNoAxesCombined, LineChart, Settings, Star} from 'lucide-react-native';
import {useAppTheme} from '../theme';
import type {MainTabParamList, RootStackParamList} from './types';
import {MarketsScreen} from '../features/markets/screens/MarketsScreen';
import {WatchlistScreen} from '../features/watchlist/screens/WatchlistScreen';
import {AlertsScreen} from '../features/alerts/screens/AlertsScreen';
import {PortfolioScreen} from '../features/portfolio/screens/PortfolioScreen';
import {SettingsScreen} from '../features/settings/screens/SettingsScreen';
import {AssetDetailsScreen} from '../features/asset/screens/AssetDetailsScreen';
import {SearchScreen} from '../features/search/screens/SearchScreen';
import {AlertEditorScreen} from '../features/alerts/screens/AlertEditorScreen';
import {PortfolioEditorScreen} from '../features/portfolio/screens/PortfolioEditorScreen';
import {SecurityScreen} from '../features/security/screens/SecurityScreen';
import {AboutScreen} from '../features/settings/screens/AboutScreen';
import {DiagnosticsScreen} from '../features/settings/screens/DiagnosticsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['pocketticker://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Markets: 'markets',
          Watchlist: 'watchlist',
          Alerts: 'alerts',
          Portfolio: 'portfolio',
          Settings: 'settings',
        },
      },
      AssetDetails: 'asset/:assetId',
      Search: 'search',
      AlertEditor: 'alert/:assetId?',
      PortfolioEditor: 'holding/:assetId?',
      Security: 'security',
      About: 'about',
      Diagnostics: 'diagnostics',
    },
  },
};

const renderMarketsTabIcon = ({color, size}: {color: string; size: number}) => <LineChart color={color} size={size} strokeWidth={2.1} />;
const renderWatchlistTabIcon = ({color, size}: {color: string; size: number}) => <Star color={color} size={size} strokeWidth={2.1} />;
const renderAlertsTabIcon = ({color, size}: {color: string; size: number}) => <Bell color={color} size={size} strokeWidth={2.1} />;
const renderPortfolioTabIcon = ({color, size}: {color: string; size: number}) => <ChartNoAxesCombined color={color} size={size} strokeWidth={2.1} />;
const renderSettingsTabIcon = ({color, size}: {color: string; size: number}) => <Settings color={color} size={size} strokeWidth={2.1} />;

function MainTabs() {
  const theme = useAppTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          height: 68,
          paddingBottom: 9,
          paddingTop: 7,
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.divider,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
      }}>
      <Tabs.Screen name="Markets" component={MarketsScreen} options={{tabBarIcon: renderMarketsTabIcon}} />
      <Tabs.Screen name="Watchlist" component={WatchlistScreen} options={{tabBarIcon: renderWatchlistTabIcon}} />
      <Tabs.Screen name="Alerts" component={AlertsScreen} options={{tabBarIcon: renderAlertsTabIcon}} />
      <Tabs.Screen name="Portfolio" component={PortfolioScreen} options={{tabBarIcon: renderPortfolioTabIcon}} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{tabBarIcon: renderSettingsTabIcon}} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const theme = useAppTheme();
  const navigationTheme: NavigationTheme = {
    dark: theme.dark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.negative,
    },
    fonts: {
      regular: {fontFamily: 'sans-serif', fontWeight: '400'},
      medium: {fontFamily: 'sans-serif-medium', fontWeight: '500'},
      bold: {fontFamily: 'sans-serif', fontWeight: '700'},
      heavy: {fontFamily: 'sans-serif', fontWeight: '800'},
    },
  };
  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: theme.colors.background},
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerTitleStyle: {fontWeight: '700'},
          contentStyle: {backgroundColor: theme.colors.background},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{headerShown: false}} />
        <Stack.Screen name="AssetDetails" component={AssetDetailsScreen} options={{title: 'Asset'}} />
        <Stack.Screen name="Search" component={SearchScreen} options={{title: 'Search markets', presentation: 'modal'}} />
        <Stack.Screen name="AlertEditor" component={AlertEditorScreen} options={({route}) => ({title: route.params?.alertId ? 'Edit alert' : 'New price alert', presentation: 'modal'})} />
        <Stack.Screen name="PortfolioEditor" component={PortfolioEditorScreen} options={({route}) => ({title: route.params?.holdingId ? 'Edit holding' : 'Add holding', presentation: 'modal'})} />
        <Stack.Screen name="Security" component={SecurityScreen} options={{title: 'App security'}} />
        <Stack.Screen name="About" component={AboutScreen} options={{title: 'About PocketTicker'}} />
        <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{title: 'Developer diagnostics'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

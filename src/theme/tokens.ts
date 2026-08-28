import type {TextStyle, ViewStyle} from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AppColors = {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  positive: string;
  positiveSoft: string;
  negative: string;
  negativeSoft: string;
  warning: string;
  border: string;
  divider: string;
  overlay: string;
  skeleton: string;
  chartGrid: string;
  tabBar: string;
};

export type AppTheme = {
  dark: boolean;
  colors: AppColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: {fontSize: 34, lineHeight: 40, fontWeight: '700'} as TextStyle,
  title: {fontSize: 24, lineHeight: 30, fontWeight: '700'} as TextStyle,
  heading: {fontSize: 19, lineHeight: 25, fontWeight: '700'} as TextStyle,
  body: {fontSize: 16, lineHeight: 23, fontWeight: '400'} as TextStyle,
  bodyStrong: {fontSize: 16, lineHeight: 23, fontWeight: '600'} as TextStyle,
  caption: {fontSize: 13, lineHeight: 18, fontWeight: '500'} as TextStyle,
  label: {fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.5} as TextStyle,
  numeric: {fontVariant: ['tabular-nums']} as TextStyle,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  } as ViewStyle,
} as const;

const lightColors: AppColors = {
  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  text: '#101622',
  textMuted: '#647084',
  primary: '#5B4BE8',
  primarySoft: '#EBE9FF',
  positive: '#087A55',
  positiveSoft: '#E2F6EF',
  negative: '#C83D52',
  negativeSoft: '#FDE9EC',
  warning: '#A9660A',
  border: '#DDE2EA',
  divider: '#E8EBF0',
  overlay: 'rgba(16,22,34,0.48)',
  skeleton: '#E4E8EE',
  chartGrid: '#E2E6ED',
  tabBar: '#FFFFFF',
};

const darkColors: AppColors = {
  background: '#0C1018',
  surface: '#151B26',
  surfaceRaised: '#1B2230',
  text: '#F4F7FC',
  textMuted: '#98A4B7',
  primary: '#9B8CFF',
  primarySoft: '#2D2857',
  positive: '#58D6A5',
  positiveSoft: '#12382D',
  negative: '#FF7F90',
  negativeSoft: '#45232C',
  warning: '#F2B85B',
  border: '#2A3444',
  divider: '#242D3B',
  overlay: 'rgba(0,0,0,0.68)',
  skeleton: '#252F3F',
  chartGrid: '#283242',
  tabBar: '#111722',
};

export const lightTheme: AppTheme = {
  dark: false,
  colors: lightColors,
  spacing,
  radius,
  typography,
  shadows,
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: darkColors,
  spacing,
  radius,
  typography,
  shadows,
};

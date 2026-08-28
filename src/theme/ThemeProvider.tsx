import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {darkTheme, lightTheme, type AppTheme} from './tokens';
import {usePreferencesStore} from '../store/preferencesStore';

const ThemeContext = createContext<AppTheme>(darkTheme);

export function AppThemeProvider({children}: React.PropsWithChildren) {
  const systemScheme = useColorScheme();
  const mode = usePreferencesStore(state => state.themeMode);
  const theme = useMemo(() => {
    const resolved = mode === 'system' ? systemScheme : mode;
    return resolved === 'light' ? lightTheme : darkTheme;
  }, [mode, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}

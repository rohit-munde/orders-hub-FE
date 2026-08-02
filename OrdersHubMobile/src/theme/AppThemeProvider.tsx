import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { AppStyles, createAppStyles } from './styles';
import { darkColors, lightColors, ThemeColors } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type AppTheme = {
  mode: ResolvedTheme;
  colors: ThemeColors;
  styles: AppStyles;
};

const themes: Record<ResolvedTheme, AppTheme> = {
  light: {
    mode: 'light',
    colors: lightColors,
    styles: createAppStyles(lightColors),
  },
  dark: {
    mode: 'dark',
    colors: darkColors,
    styles: createAppStyles(darkColors),
  },
};

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type AppThemeProviderProps = PropsWithChildren<{
  initialMode?: ThemeMode;
}>;

export function AppThemeProvider({
  children,
  initialMode = 'light',
}: AppThemeProviderProps): React.JSX.Element {
  const systemMode = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const resolvedMode: ResolvedTheme =
    mode === 'system' ? (systemMode === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo(
    () => ({ theme: themes[resolvedMode], mode, setMode }),
    [mode, resolvedMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return context;
}

export function useStyles(): AppStyles {
  return useAppTheme().theme.styles;
}

export function getTheme(mode: ResolvedTheme): AppTheme {
  return themes[mode];
}

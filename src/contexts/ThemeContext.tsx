import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEMES, ThemeName } from '../theme/designSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Colors = {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceElevated: string;
  card: string;
  cardHover: string;
  border: string;
  divider: string;
  green: { primary: string; dark: string; light: string };
  blue: { primary: string; medium: string; dark: string; chart: string };
  text: { primary: string; secondary: string; tertiary: string; muted: string; dark: string; darkSecondary: string; darkMuted: string };
  alert: { warning: string; danger: string; info: string; success: string };
  gradients: { primary: readonly string[]; greenBlue: readonly string[] };
};

interface ThemeContextType {
    themeName: ThemeName;
    isDark: boolean;
    colors: Colors;
    toggleTheme: () => void;
    setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@ecopower_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeName, setThemeName] = useState<ThemeName>('ecoPowerDark');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (saved && THEMES[saved as ThemeName]) {
                setThemeName(saved as ThemeName);
            }
        } catch { } finally {
            setIsInitialized(true);
        }
    };

    const setTheme = useCallback(async (name: ThemeName) => {
        try {
            setThemeName(name);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, name);
        } catch { }
    }, []);

    const toggleTheme = useCallback(async () => {
        const pairs: Record<string, ThemeName> = {
            ecoPowerDark: 'ecoPowerLight',
            ecoPowerLight: 'ecoPowerDark',
            ecoNature: 'ecoPowerDark',
            auroraEnergy: 'ecoPowerDark',
        };
        const next = pairs[themeName] || 'ecoPowerDark';
        await setTheme(next);
    }, [themeName, setTheme]);

    const theme = THEMES[themeName];
    const colors = theme.colors as unknown as Colors;
    const isDark = theme.isDark;

    if (!isInitialized) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ themeName, isDark, colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme deve ser usado dentro de ThemeProvider');
    }
    return context;
}

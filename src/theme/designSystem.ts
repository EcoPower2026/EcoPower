import { TextStyle, ViewStyle } from 'react-native';

export const darkColors = {
  background: '#08111F',
  surface: '#0D1B2A',
  surfaceLight: '#132238',
  surfaceElevated: '#1A3150',
  card: '#0E1A2B',
  cardHover: '#132238',
  border: 'rgba(255,255,255,0.06)',
  divider: 'rgba(255,255,255,0.08)',
  green: {
    primary: '#2ECC71',
    dark: '#27AE60',
    light: '#7ED957',
  },
  blue: {
    primary: '#3498DB',
    medium: '#2980B9',
    dark: '#0D47A1',
    chart: '#1E90FF',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B8C5D6',
    tertiary: '#94A3B8',
    muted: '#64748B',
    dark: '#FFFFFF',
    darkSecondary: '#B8C5D6',
    darkMuted: '#94A3B8',
  },
  alert: {
    warning: '#F39C12',
    danger: '#E74C3C',
    info: '#3498DB',
    success: '#27AE60',
  },
  gradients: {
    primary: ['#132238', '#17304C', '#1A3150'] as const,
    greenBlue: ['#2ECC71', '#3498DB'] as const,
  },
};

export const lightColors = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceLight: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F1F5F9',
  border: '#E2E8F0',
  divider: '#E2E8F0',
  green: {
    primary: '#2ECC71',
    dark: '#27AE60',
    light: '#7ED957',
  },
  blue: {
    primary: '#3498DB',
    medium: '#2980B9',
    dark: '#0D47A1',
    chart: '#1E90FF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    muted: '#94A3B8',
    dark: '#0F172A',
    darkSecondary: '#475569',
    darkMuted: '#64748B',
  },
  alert: {
    warning: '#F39C12',
    danger: '#E74C3C',
    info: '#3498DB',
    success: '#27AE60',
  },
  gradients: {
    primary: ['#E2E8F0', '#F1F5F9', '#FFFFFF'] as const,
    greenBlue: ['#2ECC71', '#3498DB'] as const,
  },
};

export const ecoNatureColors = {
  background: '#F4FAF4',
  surface: '#FFFFFF',
  surfaceLight: '#EAF6EA',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#EAF6EA',
  border: '#D7E8D7',
  divider: '#D7E8D7',
  green: {
    primary: '#2E7D32',
    dark: '#1B5E20',
    light: '#81C784',
  },
  blue: {
    primary: '#43A047',
    medium: '#388E3C',
    dark: '#1B5E20',
    chart: '#43A047',
  },
  text: {
    primary: '#1B4332',
    secondary: '#4F6F52',
    tertiary: '#6B8E72',
    muted: '#6B8E72',
    dark: '#1B4332',
    darkSecondary: '#4F6F52',
    darkMuted: '#6B8E72',
  },
  alert: {
    warning: '#F9A825',
    danger: '#D84315',
    info: '#43A047',
    success: '#2E7D32',
  },
  gradients: {
    primary: ['#2E7D32', '#43A047', '#81C784'] as const,
    greenBlue: ['#2E7D32', '#43A047'] as const,
  },
};

export const ecoNaturePremiumColors = {
  background: '#0A1A12',
  surface: '#0F2418',
  surfaceLight: '#153021',
  surfaceElevated: '#1A3D28',
  card: '#0F2418',
  cardHover: '#153021',
  border: 'rgba(255,255,255,0.06)',
  divider: 'rgba(255,255,255,0.08)',
  green: {
    primary: '#22C55E',
    dark: '#16A34A',
    light: '#4ADE80',
  },
  blue: {
    primary: '#0EA5E9',
    medium: '#38BDF8',
    dark: '#0284C7',
    chart: '#4ADE80',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#D4EDDA',
    tertiary: '#A3D9B1',
    muted: '#6BC47E',
    dark: '#FFFFFF',
    darkSecondary: '#D4EDDA',
    darkMuted: '#A3D9B1',
  },
  alert: {
    warning: '#EAB308',
    danger: '#EF4444',
    info: '#22C55E',
    success: '#22C55E',
  },
  gradients: {
    primary: ['#0A1A12', '#0F2418', '#153021'] as const,
    greenBlue: ['#22C55E', '#0EA5E9'] as const,
  },
};

export type ThemeName = 'ecoPowerDark' | 'ecoPowerLight' | 'ecoNature' | 'ecoNaturePremium';

export const THEMES: Record<ThemeName, { name: string; colors: { [key: string]: any }; isDark: boolean; label: string }> = {
  ecoPowerDark: { name: 'ecoPowerDark', colors: darkColors, isDark: true, label: 'EcoPower Dark' },
  ecoPowerLight: { name: 'ecoPowerLight', colors: lightColors, isDark: false, label: 'EcoPower Light' },
  ecoNature: { name: 'ecoNature', colors: ecoNatureColors, isDark: false, label: 'Eco Nature' },
  ecoNaturePremium: { name: 'ecoNaturePremium', colors: ecoNaturePremiumColors, isDark: true, label: 'Eco Nature Premium' },
};

export const colors = darkColors;

export const typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: 'Poppins',
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  h2: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  micro: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  card: 18,
  button: 16,
  input: 14,
  chip: 999,
  full: 9999,
} as const;

export const shadows: Record<string, ViewStyle> = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};

export const screenPadding = {
  padding: spacing.md,
  paddingBottom: spacing.xl,
};

export const sectionHeader: TextStyle = {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  marginBottom: spacing.sm,
};

export function getChartConfig(themeName?: ThemeName) {
  const isDark = themeName ? THEMES[themeName]?.isDark : true;
  const t = themeName || 'ecoPowerDark';

  const configs: Record<string, {
    bgFrom: string; bgTo: string; lineColor: string; fillGradient: string;
    strokeColor: string; bgLineStroke: string;
  }> = {
    ecoPowerDark: {
      bgFrom: '#0D1B2A', bgTo: '#132238', lineColor: '#7ED957', fillGradient: '#7ED957',
      strokeColor: '#0D1B2A', bgLineStroke: 'rgba(255,255,255,0.08)',
    },
    ecoPowerLight: {
      bgFrom: '#FFFFFF', bgTo: '#F7F8FA', lineColor: '#2ECC71', fillGradient: '#2ECC71',
      strokeColor: '#FFFFFF', bgLineStroke: 'rgba(0,0,0,0.05)',
    },
    ecoNature: {
      bgFrom: '#EAF6EA', bgTo: '#F4FAF4', lineColor: '#43A047', fillGradient: '#81C784',
      strokeColor: '#EAF6EA', bgLineStroke: 'rgba(0,0,0,0.04)',
    },
    ecoNaturePremium: {
      bgFrom: '#0F2418', bgTo: '#153021', lineColor: '#22C55E', fillGradient: '#22C55E',
      strokeColor: '#0F2418', bgLineStroke: 'rgba(255,255,255,0.06)',
    },
  };

  const cfg = configs[t] || configs.ecoPowerDark;

  return {
    backgroundGradientFrom: cfg.bgFrom,
    backgroundGradientTo: cfg.bgTo,
    decimalPlaces: 1,
    color: () => cfg.lineColor,
    labelColor: () => isDark ? '#94A3B8' : '#6B8E72',
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: cfg.strokeColor,
    },
    propsForBackgroundLines: {
      stroke: cfg.bgLineStroke,
      strokeDasharray: '4,4',
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: '500',
    },
    fillShadowGradient: cfg.fillGradient,
    fillShadowGradientOpacity: 0.15,
    style: {
      borderRadius: borderRadius.card,
    },
  };
}

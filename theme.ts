import { colors, spacing, borderRadius, shadows } from './src/theme/designSystem';

export const lightTheme = {
  colors: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardSoft: '#F7F8FA',
    accent: colors.green.primary,
    accentSoft: colors.green.light,
    success: colors.green.dark,
    warning: colors.alert.warning,
    danger: colors.alert.danger,
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    placeholder: '#94A3B8',
    shadow: '#000000',
  },
  spacing,
  radius: {
    card: borderRadius.card,
    button: borderRadius.button,
    input: borderRadius.input,
  },
  fontSizes: {
    title: 30,
    sectionTitle: 18,
    body: 15,
    label: 14,
  },
  shadow: shadows.card,
};

export const darkTheme = {
  colors: {
    background: colors.background,
    surface: colors.surface,
    card: colors.surfaceLight,
    cardSoft: colors.surfaceElevated,
    accent: colors.green.primary,
    accentSoft: colors.green.light,
    success: colors.green.dark,
    warning: colors.alert.warning,
    danger: colors.alert.danger,
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    border: colors.border,
    placeholder: colors.text.muted,
    shadow: '#000000',
  },
  spacing,
  radius: {
    card: borderRadius.card,
    button: borderRadius.button,
    input: borderRadius.input,
  },
  fontSizes: {
    title: 30,
    sectionTitle: 18,
    body: 15,
    label: 14,
  },
  shadow: shadows.card,
};

export const theme = darkTheme;

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../theme/designSystem';

type LoadingProps = {
  message?: string;
};

export default function Loading({ message = 'Carregando...' }: LoadingProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.green.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  message: {
    marginTop: 14,
    fontFamily: 'Poppins',
    color: colors.text.tertiary,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});

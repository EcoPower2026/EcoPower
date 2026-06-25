import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, typography } from '../theme/designSystem';

type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  inputStyle?: TextStyle;
};

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  inputStyle,
}: InputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <TextInput
        style={[styles.input, { color: colors.text.primary }, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontFamily: 'Poppins',
    color: colors.text.tertiary,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: {
    fontFamily: 'Poppins',
    height: 58,
    backgroundColor: colors.surfaceLight,
    borderColor: 'transparent',
    borderWidth: 1,
    borderRadius: borderRadius.input,
    paddingHorizontal: 18,
    fontSize: 15,
  },
});

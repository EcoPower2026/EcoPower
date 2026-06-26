import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { spacing, borderRadius, shadows, ThemeName } from '../theme/designSystem';
import { useTheme } from '../contexts/ThemeContext';

type CardProps = {
  children: React.ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'normal' | 'accent' | 'flat' | 'white';
};

export default function Card({
  children,
  title,
  style,
  onPress,
  variant = 'normal',
}: CardProps) {
  const { colors, themeName } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bgColor =
    variant === 'accent'
      ? colors.green.primary
      : variant === 'flat'
        ? colors.surface
        : variant === 'white'
          ? colors.card
          : colors.surfaceLight;

  const borderStyle: ViewStyle =
    variant === 'white' ? { borderWidth: 1, borderColor: colors.border } : {};

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const isPremium = themeName === 'ecoNaturePremium';
  const cardStyle: ViewStyle = {
    backgroundColor: bgColor,
    borderRadius: isPremium ? 24 : borderRadius.card,
    padding: spacing.md,
    ...(isPremium
      ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: colors.border }
      : { ...shadows.card, ...borderStyle }
    ),
  };

  const isWhiteCard = variant === 'white';

  const content = (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <View style={cardStyle}>
        {title && (
          <Text
            style={{
              fontFamily: 'Poppins',
              fontSize: 13,
              fontWeight: '600',
              color: variant === 'accent' ? '#FFFFFF' : isWhiteCard ? colors.text.tertiary : colors.text.tertiary,
              marginBottom: spacing.sm,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Text>
        )}
        {children}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

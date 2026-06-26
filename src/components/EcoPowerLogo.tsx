import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

type EcoPowerLogoProps = {
  size?: LogoSize;
  showTagline?: boolean;
};

const sizes: Record<LogoSize, { image: number; title: number; tagline: number }> = {
  sm: { image: 80, title: 18, tagline: 9 },
  md: { image: 100, title: 22, tagline: 11 },
  lg: { image: 130, title: 28, tagline: 12 },
  xl: { image: 160, title: 34, tagline: 13 },
};

export default function EcoPowerLogo({
  size = 'md',
  showTagline = true,
}: EcoPowerLogoProps) {
  const { colors } = useTheme();
  const s = sizes[size];

  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: s.image, height: s.image, marginBottom: 8 }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontFamily: 'Poppins',
          fontSize: s.title,
          fontWeight: '700',
          color: colors.text.primary,
          letterSpacing: 0.5,
        }}
      >
        EcoPower
      </Text>
      {showTagline && (
        <Text
          style={{
            fontFamily: 'Poppins',
            fontSize: s.tagline,
            color: colors.text.muted,
            marginTop: 6,
            letterSpacing: 0.3,
          }}
        >
          Monitoramento Inteligente de Energia
        </Text>
      )}
    </View>
  );
}

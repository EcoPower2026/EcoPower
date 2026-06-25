import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

type EcoPowerLogoProps = {
  size?: LogoSize;
  showTagline?: boolean;
};

const sizes: Record<LogoSize, { icon: number; title: number; tagline: number; glow: number }> = {
  sm: { icon: 24, title: 20, tagline: 10, glow: 52 },
  md: { icon: 32, title: 26, tagline: 12, glow: 68 },
  lg: { icon: 40, title: 32, tagline: 13, glow: 84 },
  xl: { icon: 52, title: 40, tagline: 14, glow: 108 },
};

export default function EcoPowerLogo({
  size = 'md',
  showTagline = true,
}: EcoPowerLogoProps) {
  const { colors } = useTheme();
  const s = sizes[size];

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        width: s.glow,
        height: s.glow,
        borderRadius: s.glow / 2,
        backgroundColor: 'rgba(46,204,113,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
      }}>
        <LinearGradient
          colors={['#2ECC71', '#3498DB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: s.icon + 16,
            height: s.icon + 16,
            borderRadius: (s.icon + 16) / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={s.icon}
            color="#FFFFFF"
          />
        </LinearGradient>
      </View>
      <LinearGradient
        colors={['#2ECC71', '#3498DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 4 }}
      >
        <Text
          style={{
            fontFamily: 'Poppins',
            fontSize: s.title,
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: 0.5,
            paddingHorizontal: 4,
          }}
        >
          EcoPower
        </Text>
      </LinearGradient>
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

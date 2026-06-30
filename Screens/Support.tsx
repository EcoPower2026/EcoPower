import React from 'react';
import { ScrollView, View, Text, Linking, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

const channels = [
  {
    icon: 'email-outline' as const,
    title: 'E-mail',
    action: 'mailto:ecopoweroficial2026@gmail.com',
  },
  {
    icon: 'web' as const,
    title: 'Site Oficial',
    action: 'https://ecopower2026.netlify.app/',
  },
];

const faqItems = [
  {
    q: 'Como falar com o suporte?',
    r: 'Envie um e-mail para ecopoweroficial2026@gmail.com. Respondemos em até 24 horas úteis.',
  },
  {
    q: 'Onde encontro tutoriais e ajuda?',
    r: 'Acesse nosso site oficial ecopower2026.netlify.app com documentação completa e guias de uso.',
  },
  {
    q: 'O app funciona no iOS e Android?',
    r: 'Sim, o EcoPower está disponível para ambas as plataformas via Expo.',
  },
];

export default function Support() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl }}>
        <View style={{
          width: 64, height: 64, borderRadius: 20,
          backgroundColor: colors.green.primary + '15',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: spacing.md,
        }}>
          <MaterialCommunityIcons name="headset" size={32} color={colors.green.primary} />
        </View>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 24, fontWeight: '700',
          color: colors.text.primary, marginBottom: 4,
        }}>Central de Ajuda</Text>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 14, color: colors.text.tertiary,
          textAlign: 'center',
        }}>Estamos aqui para ajudar você</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {channels.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(item.action)}
            style={{
              flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.card,
              padding: spacing.md, ...shadows.card, alignItems: 'center',
            }}
          >
            <View style={{
              width: 48, height: 48, borderRadius: 16,
              backgroundColor: colors.green.primary + '15',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: spacing.sm,
            }}>
              <MaterialCommunityIcons name={item.icon} size={24} color={colors.green.primary} />
            </View>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 15, fontWeight: '700',
              color: colors.text.dark, textAlign: 'center',
            }}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '700', color: colors.text.darkMuted,
          marginBottom: spacing.md, letterSpacing: 0.5,
        }}>PERGUNTAS FREQUENTES</Text>
        {faqItems.map((item, index) => (
          <View key={index} style={{
            paddingVertical: spacing.sm + 2,
            borderTopWidth: index > 0 ? 1 : 0,
            borderTopColor: colors.divider,
          }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 14, fontWeight: '600',
              color: colors.text.dark, marginBottom: 4,
            }}>{item.q}</Text>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkSecondary,
              lineHeight: 20,
            }}>{item.r}</Text>
          </View>
        ))}
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, ...shadows.card, alignItems: 'center',
      }}>
        <View style={{
          width: 52, height: 52, borderRadius: 16,
          backgroundColor: colors.green.primary + '15',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: spacing.md,
        }}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={26} color={colors.green.primary} />
        </View>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 15, fontWeight: '700',
          color: colors.text.dark, marginBottom: spacing.xs, textAlign: 'center',
        }}>Tem uma sugestão?</Text>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkSecondary,
          textAlign: 'center', lineHeight: 20, marginBottom: spacing.md,
        }}>
          Sua opinião nos ajuda a melhorar.{'\n'}Compartilhe suas ideias conosco.
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL('mailto:ecopoweroficial2026@gmail.com')}
          style={{
            backgroundColor: colors.green.primary,
            paddingVertical: 12, paddingHorizontal: 24,
            borderRadius: borderRadius.button,
          }}
        >
          <Text style={{
            fontFamily: 'Poppins', fontSize: 14, fontWeight: '700',
            color: '#FFFFFF',
          }}>Enviar Sugestão</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

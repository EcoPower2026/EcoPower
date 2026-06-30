import React from 'react';
import { ScrollView, View, Text, Image, Linking, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';

import EcoPowerLogo from '../src/components/EcoPowerLogo';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

const features = [
  'Dashboard com indicadores de consumo',
  'Gerenciamento de aparelhos e metas de economia',
  'Alertas inteligentes de consumo excessivo',
  'Relatórios avançados com exportação em PDF',
  'Gráficos e análises de consumo energético',
  'Simulador de consumo e economia',
  'Score de eficiência energética',
  'Previsão e comparativo de consumo',
];

const technologies = [
  { label: 'Frontend', value: 'React Native + TypeScript' },
  { label: 'Backend', value: 'Firebase (Auth, Firestore)' },
  { label: 'Gráficos', value: 'react-native-chart-kit' },
  { label: 'Navegação', value: 'React Navigation' },
];

export default function About() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: spacing.lg, marginTop: spacing.md }}>
        <EcoPowerLogo size="lg" />
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.tertiary,
          marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Sobre o Aplicativo</Text>
        <Text style={{ fontFamily: 'Poppins', color: colors.text.secondary, lineHeight: 22, fontSize: 14 }}>
          O EcoPower é uma plataforma mobile de monitoramento inteligente de consumo
          de energia elétrica. Desenvolvido como Trabalho de Conclusão de Curso, o app
          permite que usuários acompanhem seu consumo em tempo real, estabeleçam metas
          de economia, recebam alertas inteligentes e gerem relatórios detalhados.
        </Text>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.tertiary,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Funcionalidades</Text>
        {features.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < features.length - 1 ? spacing.sm : 0 }}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.green.primary} style={{ marginRight: spacing.sm }} />
            <Text style={{ fontFamily: 'Poppins', color: colors.text.secondary, fontSize: 14, flex: 1, lineHeight: 20 }}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.tertiary,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Tecnologias</Text>
        {technologies.map((tech, i) => (
          <View key={i} style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingVertical: spacing.sm + 2,
            borderBottomWidth: i < technologies.length - 1 ? 1 : 0,
            borderBottomColor: 'rgba(0,0,0,0.04)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="code-tags" size={16} color={colors.text.tertiary} style={{ marginRight: spacing.sm }} />
              <Text style={{ fontFamily: 'Poppins', color: colors.text.primary, fontWeight: '600', fontSize: 14 }}>{tech.label}</Text>
            </View>
            <Text style={{ fontFamily: 'Poppins', color: colors.text.secondary, fontSize: 14, textAlign: 'right', flex: 1, marginLeft: spacing.md }}>
              {tech.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.tertiary,
          marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Desenvolvimento</Text>
        <Text style={{ fontFamily: 'Poppins', color: colors.text.secondary, lineHeight: 22, fontSize: 14 }}>
          Este aplicativo foi desenvolvido como Trabalho de Conclusão de Curso,
          demonstrando a aplicação de conceitos de Internet das Coisas (IoT),
          computação em nuvem e desenvolvimento mobile para eficiência energética
          residencial.
        </Text>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        overflow: 'hidden',
      }}>
        <View style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          borderRadius: 80, backgroundColor: colors.green.primary + '06',
        }} />
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '700', color: colors.text.tertiary,
          marginBottom: spacing.sm, letterSpacing: 0.5,
        }}>SITE OFICIAL</Text>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 15, fontWeight: '600', color: colors.text.primary,
          marginBottom: spacing.md,
        }}>Acesse e descubra mais sobre o EcoPower</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://ecopower2026.netlify.app/')}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
            padding: spacing.sm, marginBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: colors.green.primary + '15',
              alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
            }}>
              <MaterialCommunityIcons name="web" size={18} color={colors.green.primary} />
            </View>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 13, fontWeight: '500', color: colors.green.primary,
            }}>ecopower2026.netlify.app</Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={16} color={colors.text.muted} />
        </TouchableOpacity>
        <View style={{
          alignItems: 'center', backgroundColor: colors.surfaceLight,
          borderRadius: borderRadius.md, padding: spacing.md,
        }}>
          <Image
            source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://ecopower2026.netlify.app/' }}
            style={{ width: 100, height: 100, marginBottom: spacing.sm }}
            resizeMode="contain"
          />
          <Text style={{
            fontFamily: 'Poppins', fontSize: 10, color: colors.text.tertiary, textAlign: 'center',
          }}>Aponte a câmera para acessar</Text>
        </View>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '700', color: colors.text.tertiary,
          marginBottom: spacing.sm, letterSpacing: 0.5,
        }}>SUPORTE</Text>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 15, fontWeight: '600', color: colors.text.primary,
          marginBottom: spacing.md,
        }}>Entre em contato conosco</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL('mailto:ecopoweroficial2026@gmail.com')}
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
            padding: spacing.md,
          }}
        >
          <View style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: colors.green.primary + '15',
            alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
          }}>
            <MaterialCommunityIcons name="email-outline" size={22} color={colors.green.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: colors.text.primary,
            }}>ecopoweroficial2026@gmail.com</Text>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 12, color: colors.text.secondary,
            }}>Respondemos em até 24 horas</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.md }}>
        <Text style={{ fontFamily: 'Poppins', fontSize: 14, color: colors.text.primary, fontWeight: '700', marginBottom: 4 }}>
          EcoPower v1.0
        </Text>
        <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.tertiary, textAlign: 'center', marginBottom: 4 }}>
          Projeto Acadêmico de Monitoramento Inteligente de Energia
        </Text>
        <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary }}>
          © {new Date().getFullYear()} - Todos os direitos reservados
        </Text>
      </View>
    </ScrollView>
  );
}

import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import Card from '../src/components/Card';
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
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Sobre o Aplicativo</Text>
        <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, lineHeight: 22, fontSize: 14 }}>
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
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Funcionalidades</Text>
        {features.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < features.length - 1 ? spacing.sm : 0 }}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.green.primary} style={{ marginRight: spacing.sm }} />
            <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, fontSize: 14, flex: 1, lineHeight: 20 }}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
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
              <MaterialCommunityIcons name="code-tags" size={16} color={colors.text.darkMuted} style={{ marginRight: spacing.sm }} />
              <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 14 }}>{tech.label}</Text>
            </View>
            <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, fontSize: 14, textAlign: 'right', flex: 1, marginLeft: spacing.md }}>
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
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Desenvolvimento</Text>
        <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, lineHeight: 22, fontSize: 14 }}>
          Este aplicativo foi desenvolvido como Trabalho de Conclusão de Curso,
          demonstrando a aplicação de conceitos de Internet das Coisas (IoT),
          computação em nuvem e desenvolvimento mobile para eficiência energética
          residencial.
        </Text>
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

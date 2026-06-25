import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Button from '../src/components/Button';
import EcoPowerLogo from '../src/components/EcoPowerLogo';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { useDemo } from '../src/contexts/DemoContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

type DemoModeProps = {
  navigation: any;
};

export default function DemoMode({ navigation }: DemoModeProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { enableDemoMode } = useDemo();

  const handleEnterDemo = () => {
    enableDemoMode();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <EcoPowerLogo size="lg" />
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>MODO DEMONSTRAÇÃO</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sobre o Sistema</Text>
        <Text style={styles.cardText}>
          O EcoPower é um sistema inteligente de monitoramento de consumo de energia elétrica.
          Através de sensores de corrente, o sistema coleta dados em tempo real do
          consumo dos seus aparelhos e fornece análises detalhadas, relatórios e recomendações
          para economia de energia.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Funcionalidades Disponíveis</Text>
        {[
          'Dashboard com indicadores em tempo real',
          'Gerenciamento de aparelhos e metas',
          'Alertas inteligentes de consumo',
          'Relatórios avançados com exportação',
          'Gráficos e análises de consumo',
          'Simulador de consumo e economia',
          'Recomendações inteligentes',
          'Score de eficiência energética',
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados de Demonstração</Text>
        <Text style={styles.cardText}>
          Você terá acesso a um ambiente completo com dados simulados de 7 aparelhos,
          metas de economia, alertas automáticos e histórico de 30 dias de leituras.
          Todas as funcionalidades estarão disponíveis como em uma conta real.
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Os dados exibidos são simulados para fins de demonstração.
          Nenhuma conta ou cadastro é necessário.
        </Text>
      </View>

      <Button
        title="Entrar na Demonstração"
        onPress={handleEnterDemo}
        style={styles.enterButton}
      />

      <Button
        title="Voltar"
        onPress={() => navigation.goBack()}
        variant="outline"
        style={styles.backButton}
      />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginBottom: spacing.lg, marginTop: 20 },
  demoBadge: {
    backgroundColor: colors.alert.warning,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  demoBadgeText: {
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cardText: {
    fontFamily: 'Poppins',
    color: colors.text.secondary,
    lineHeight: 22,
    fontSize: 14,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureBullet: {
    color: colors.green.primary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
    width: 20,
  },
  featureText: {
    fontFamily: 'Poppins',
    color: colors.text.secondary,
    fontSize: 14,
    flex: 1,
  },
  infoBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.green.primary,
  },
  infoText: {
    fontFamily: 'Poppins',
    color: colors.text.tertiary,
    fontSize: 13,
    lineHeight: 18,
  },
  enterButton: { marginBottom: 10 },
  backButton: { marginBottom: 20 },
});

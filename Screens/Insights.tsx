import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { EfficiencyScore, Insight, Goal } from '../src/types';
import Button from '../src/components/Button';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, sectionHeader } from '../src/theme/designSystem';

type InsightsProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Insights'>;
};



export default function Insights({ navigation }: InsightsProps) {
  const { colors } = useTheme();
  const { isDemoMode } = useDemo();
  const prioridadeConfig = {
    alta: { label: 'Alta', color: colors.alert.danger },
    media: { label: 'Média', color: colors.alert.warning },
    baixa: { label: 'Baixa', color: colors.green.dark },
  };

  const scoreConfigMap: Record<string, { color: string; bgColor: string }> = {
    Excelente: { color: colors.green.dark, bgColor: 'rgba(39,174,96,0.15)' },
    Bom: { color: colors.blue.primary, bgColor: 'rgba(52,152,219,0.15)' },
    Regular: { color: colors.alert.warning, bgColor: 'rgba(243,156,18,0.15)' },
    Crítico: { color: colors.alert.danger, bgColor: 'rgba(231,76,60,0.15)' },
  };

  const [topConsumers, setTopConsumers] = useState<{ name: string; consumption: number; percentage: number }[]>([]);
  const [efficiencyScore, setEfficiencyScore] = useState<EfficiencyScore | null>(null);
  const [recommendations, setRecommendations] = useState<Insight[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsubGoals: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        unsubGoals = dataProvider.subscribeGoals(uid, list => { setGoals(list); }, isDemoMode);
        loadInsights(uid, goals);
      } else { setLoading(false); }
    });
    return () => { unsubAuth(); unsubGoals?.(); };
  }, [isDemoMode]);

  useEffect(() => { if (userId) loadInsights(userId, goals); }, [goals]);

  const loadInsights = async (uid: string, currentGoals: Goal[]) => {
    try {
      const data = await dataProvider.generateInsights(uid, currentGoals, isDemoMode);
      setTopConsumers(data.topConsumers);
      setEfficiencyScore(data.efficiencyScore);
      setRecommendations(data.recommendations);
    } catch {} finally { setLoading(false); }
  };

  const handleRefresh = () => { if (!userId) return; setLoading(true); loadInsights(userId, goals); };

  const scoreConfig = efficiencyScore ? scoreConfigMap[efficiencyScore.classificacao] : scoreConfigMap.Regular;

  if (loading) {
    return <Loading message="Gerando insights..." />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{...sectionHeader, color: colors.text.muted}}>INTELIGÊNCIA</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <MaterialCommunityIcons name="lightbulb-on" size={22} color={colors.green.primary} style={{ marginRight: spacing.sm }} />
        <Text style={{
          fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary,
        }}>Insights</Text>
      </View>

      {efficiencyScore && (
        <View style={{
          backgroundColor: scoreConfig.bgColor,
          borderRadius: borderRadius.card,
          padding: spacing.lg,
          alignItems: 'center',
          marginBottom: spacing.md,
          ...shadows.card,
        }}>
          <MaterialCommunityIcons name="star" size={36} color={scoreConfig.color} />
          <Text style={{
            fontFamily: 'Poppins', fontSize: 56, fontWeight: '700', color: scoreConfig.color, marginTop: spacing.sm,
          }}>{efficiencyScore.score}</Text>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 20, fontWeight: '700', color: scoreConfig.color, marginTop: spacing.xs,
          }}>{efficiencyScore.classificacao}</Text>
          <Text style={{
            fontFamily: 'Poppins', color: colors.text.tertiary, marginTop: spacing.sm, fontSize: 13,
          }}>Score de Eficiência Energética</Text>
        </View>
      )}

      <Button title="Atualizar Insights" onPress={handleRefresh} style={{ marginBottom: spacing.md }} />

      {topConsumers.length > 0 && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Ranking de Consumo</Text>
          {topConsumers.map((consumer, index) => {
            const barColors = [colors.alert.danger, colors.alert.warning, colors.blue.chart, colors.green.dark, '#6366F1'];
            const barColor = barColors[index] || colors.green.primary;
            return (
              <View key={consumer.name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm + 4 }}>
                <View style={{ width: 32, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 14, fontWeight: '700' }}>{index + 1}º</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 14, marginBottom: spacing.xs }}>
                    {consumer.name}
                  </Text>
                  <View style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.min(consumer.percentage, 100)}%`, backgroundColor: barColor, borderRadius: 3 }} />
                  </View>
                </View>
                <View style={{ width: 45, alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', color: barColor }}>
                    {consumer.percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {recommendations.length > 0 && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Recomendações</Text>
          {recommendations.map((rec, index) => {
            const prioridadeConf = prioridadeConfig[rec.prioridade];
            return (
              <View key={index} style={{
                marginBottom: index < recommendations.length - 1 ? spacing.md : 0,
                paddingBottom: index < recommendations.length - 1 ? spacing.md : 0,
                borderBottomWidth: index < recommendations.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(0,0,0,0.04)',
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={16} color={colors.green.primary} style={{ marginRight: spacing.sm }} />
                    <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '700', fontSize: 15, flex: 1 }}>{rec.titulo}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', color: prioridadeConf.color, marginLeft: spacing.sm }}>
                    {prioridadeConf.label}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, lineHeight: 20, fontSize: 13, marginLeft: 28 }}>
                  {rec.descricao}
                </Text>
                {rec.economiaPotencial > 0 && (
                  <Text style={{ fontFamily: 'Poppins', color: colors.green.primary, fontWeight: '600', marginTop: spacing.sm - 2, fontSize: 13, marginLeft: 28 }}>
                    Economia potencial: R$ {rec.economiaPotencial.toFixed(2)}/mês
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {efficiencyScore && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Economia Potencial</Text>
          <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
            <Text style={{ fontFamily: 'Poppins', fontSize: 36, fontWeight: '700', color: colors.green.primary }}>
              R$ {efficiencyScore.economiaPotencial.toFixed(2)}
            </Text>
            <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, marginTop: spacing.xs, fontSize: 14 }}>por mês</Text>
          </View>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, textAlign: 'center', lineHeight: 20, fontSize: 13 }}>
            Reduza seu consumo em até 15% com pequenas mudanças de hábito.
          </Text>
        </View>
      )}

      {topConsumers.length === 0 && recommendations.length === 0 && !loading && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.xl, marginTop: spacing.md, alignItems: 'center', ...shadows.card,
        }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.text.darkMuted + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <MaterialCommunityIcons name="lightbulb-on" size={28} color={colors.text.darkMuted} />
          </View>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '700', fontSize: 16, marginBottom: spacing.sm }}>
            Nenhum dado disponível
          </Text>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, textAlign: 'center', fontSize: 14 }}>
            Conecte seus aparelhos e monitore o consumo para receber insights inteligentes.
          </Text>
        </View>
      )}

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { Goal } from '../src/types';
import { GoalRecommendation } from '../src/services/goalRecommendationService';
import Button from '../src/components/Button';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, typography } from '../src/theme/designSystem';

type Props = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Goals'>;
};

export default function Goals({ navigation }: Props) {
  const { colors } = useTheme();
  const { isDemoMode } = useDemo();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<GoalRecommendation | null>(null);
  const [recommendationUsed, setRecommendationUsed] = useState(false);

  useEffect(() => {
    let unsubGoals: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        unsubGoals = dataProvider.subscribeGoals(uid, list => {
          setGoals(list);
          setLoading(false);
        }, isDemoMode);
      } else {
        setLoading(false);
      }
    });
    return () => { unsubAuth(); unsubGoals?.(); };
  }, [isDemoMode]);

  useEffect(() => {
    if (userId) {
      dataProvider.getGoalRecommendation(userId, isDemoMode).then(setRecommendation).catch(() => {});
    }
  }, [userId, isDemoMode, goals]);

  function handleDelete(item: Goal) {
    if (!userId) return;
    Alert.alert('Excluir Meta', `Deseja excluir "${item.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          try { await dataProvider.deleteGoal(userId, item.id, isDemoMode); }
          catch { Alert.alert('Erro', 'Não foi possível excluir a meta.'); }
        },
      },
    ]);
  }

  async function handleUseRecommended() {
    if (!userId || !recommendation) return;
    try {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await dataProvider.createGoal(userId, {
        titulo: `Meta ${recommendation.suggestedGoalKwh.toFixed(0)} kWh`,
        valorAlvo: recommendation.suggestedGoalCost,
        dataInicio: nextMonth.toISOString().split('T')[0],
        dataFim: new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0],
        aparelhoId: '',
        ativa: true,
      }, isDemoMode);
      setRecommendationUsed(true);
      Alert.alert('Sucesso', 'Meta recomendada criada com sucesso!');
    } catch { Alert.alert('Erro', 'Não foi possível criar a meta recomendada.'); }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  if (loading) {
    return <Loading message="Carregando metas..." />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
        <MaterialCommunityIcons name="target" size={18} color={colors.green.primary} style={{ marginRight: spacing.sm }} />
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 0, color: colors.text.muted }}>METAS</Text>
      </View>
      <Text style={{
        fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm,
      }}>Metas de Economia</Text>
      <Text style={{
        fontFamily: 'Poppins', fontSize: 15, color: colors.text.tertiary, marginBottom: spacing.lg,
      }}>
        Defina metas de consumo e acompanhe seu progresso.
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('GoalForm', {})}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.green.primary,
          borderRadius: borderRadius.button,
          paddingVertical: 16,
          marginBottom: spacing.md,
        }}
      >
        <MaterialCommunityIcons name="plus-circle" size={20} color="#FFF" style={{ marginRight: spacing.sm }} />
        <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontWeight: '700', fontSize: 15 }}>Nova Meta</Text>
      </TouchableOpacity>

      {recommendation && !recommendationUsed && (
        <View style={{
          backgroundColor: colors.card,
          borderRadius: borderRadius.card,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderLeftWidth: 3,
          borderLeftColor: recommendation.hasActiveGoal
            ? recommendation.activeGoalAdequate ? colors.green.primary : colors.alert.warning
            : colors.green.primary,
          ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted, marginBottom: spacing.sm,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Meta Recomendada</Text>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkSecondary, marginBottom: spacing.md, lineHeight: 18,
          }}>{recommendation.message}</Text>

          <View style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: borderRadius.md, padding: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkMuted }}>Média histórica</Text>
              <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: colors.text.dark }}>
                {recommendation.averageConsumption.toFixed(0)} kWh
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkMuted }}>Meta sugerida</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', color: colors.green.primary }}>
                  {recommendation.suggestedGoalKwh.toFixed(0)} kWh
                </Text>
                <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.darkMuted }}>
                  R$ {recommendation.suggestedGoalCost.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkMuted }}>Redução</Text>
              <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: colors.green.primary }}>
                {recommendation.reductionPercent.toFixed(1)}%
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkMuted }}>Economia estimada</Text>
              <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', color: colors.green.primary }}>
                R$ {recommendation.potentialEconomyCost.toFixed(2)}/mês
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleUseRecommended}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: colors.green.primary, borderRadius: borderRadius.md,
              paddingVertical: 12, marginTop: spacing.md,
            }}
          >
            <MaterialCommunityIcons name="check" size={18} color="#FFF" style={{ marginRight: spacing.sm }} />
            <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontWeight: '700', fontSize: 14 }}>Usar Meta Recomendada</Text>
          </TouchableOpacity>
        </View>
      )}

      {goals.length === 0 && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.xl, alignItems: 'center', ...shadows.card,
        }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.text.darkMuted + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <MaterialCommunityIcons name="target" size={28} color={colors.text.darkMuted} />
          </View>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '700', fontSize: 16, marginBottom: spacing.xs }}>
            Nenhuma meta cadastrada.
          </Text>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, textAlign: 'center', fontSize: 14 }}>
            Crie sua primeira meta de economia de energia.
          </Text>
        </View>
      )}

      {goals.map(item => {
        const progress = Math.min(item.progresso, 100);
        const remaining = item.valorAlvo - (item.valorAlvo * progress) / 100;

        return (
          <View key={item.id} style={{
            backgroundColor: colors.card, borderRadius: borderRadius.card,
            padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontSize: 17, fontWeight: '700', flex: 1 }}>
                {item.titulo}
              </Text>
              {item.ativa && (
                <View style={{ backgroundColor: colors.green.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginLeft: spacing.sm }}>
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontSize: 11, fontWeight: '700' }}>ATIVA</Text>
                </View>
              )}
            </View>

            <View style={{
              backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: borderRadius.md,
              padding: spacing.sm, marginBottom: spacing.sm,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 13 }}>Meta:</Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 13 }}>R$ {item.valorAlvo.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 13 }}>Atual:</Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 13 }}>R$ {((item.valorAlvo * progress) / 100).toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 13 }}>Restante:</Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 13 }}>R$ {remaining.toFixed(2)}</Text>
              </View>

              <View style={{ height: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 4, marginTop: spacing.sm, overflow: 'hidden' }}>
                <View style={{
                  height: '100%', width: `${progress}%`,
                  backgroundColor: progress >= 100 ? colors.green.primary : colors.green.primary,
                  borderRadius: 4,
                }} />
              </View>
              <Text style={{
                fontFamily: 'Poppins', color: colors.green.primary, fontWeight: '700', fontSize: 16,
                textAlign: 'center', marginTop: spacing.xs,
              }}>{progress.toFixed(0)}%</Text>
            </View>

            <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 12, textAlign: 'center', marginBottom: spacing.sm }}>
              {formatDate(item.dataInicio)} - {formatDate(item.dataFim)}
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, paddingVertical: 10,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                }}
                onPress={() => navigation.navigate('GoalForm', { goalId: item.id })}
              >
                <MaterialCommunityIcons name="pencil" size={14} color={colors.green.primary} style={{ marginRight: 4 }} />
                <Text style={{ color: colors.green.primary, fontFamily: 'Poppins', fontWeight: '700', fontSize: 13 }}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, paddingVertical: 10,
                  borderWidth: 1, borderColor: colors.alert.danger,
                }}
                onPress={() => handleDelete(item)}
              >
                <MaterialCommunityIcons name="delete" size={14} color={colors.alert.danger} style={{ marginRight: 4 }} />
                <Text style={{ color: colors.alert.danger, fontFamily: 'Poppins', fontWeight: '700', fontSize: 13 }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

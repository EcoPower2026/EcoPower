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
import { Goal, Forecast as ForecastType } from '../src/types';
import Button from '../src/components/Button';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, sectionHeader } from '../src/theme/designSystem';

type ForecastProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Forecast'>;
};

export default function Forecast({ navigation }: ForecastProps) {
  const { colors } = useTheme();
  const { isDemoMode } = useDemo();

  const [userId, setUserId] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastType | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tarifa, setTarifa] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubGoals: (() => void) | null = null;
    let unsubProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        unsubGoals = dataProvider.subscribeGoals(uid, list => { setGoals(list); }, isDemoMode);
        unsubProfile = dataProvider.subscribeUserProfile(uid, profile => { setTarifa(profile?.tarifaKwh ?? 0); }, isDemoMode);
        setLoading(false);
      } else { setLoading(false); }
    });
    return () => { unsubAuth(); unsubGoals?.(); unsubProfile?.(); };
  }, [isDemoMode]);

  useEffect(() => {
    if (userId) {
      dataProvider.generateForecast(userId, tarifa, goals, isDemoMode).then(data => { setForecast(data); }).catch(() => {});
    }
  }, [userId, goals, tarifa, isDemoMode]);

  const progressPercent = forecast ? Math.min((forecast.daysElapsed / forecast.daysInMonth) * 100, 100) : 0;

  if (loading || !forecast) {
    return <Loading message="Calculando previsão de consumo..." />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={colors.green.primary} />
        <View style={{ marginLeft: spacing.sm }}>
          <Text style={{...sectionHeader, color: colors.text.muted}}>Projeção para {forecast.month}</Text>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary, marginTop: 2,
          }}>Previsão de Consumo</Text>
        </View>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Progresso do Mês</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Text style={{ fontFamily: 'Poppins', fontSize: 14, color: colors.text.darkSecondary, fontWeight: '600' }}>
            {forecast.daysElapsed} de {forecast.daysInMonth} dias
          </Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', color: colors.green.primary }}>
            {progressPercent.toFixed(0)}%
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: colors.green.primary, borderRadius: 4 }} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <View style={{
          flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, alignItems: 'center', ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 11, color: colors.text.darkMuted, fontWeight: '600',
            letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs,
          }}>Consumo Atual</Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: '700', color: colors.text.dark }}>
            {forecast.currentConsumption.toFixed(1)}
          </Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.darkMuted, marginTop: 2 }}>kWh</Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: '600', color: colors.text.darkSecondary, marginTop: spacing.sm }}>
            R$ {forecast.currentCost.toFixed(2)}
          </Text>
        </View>
        <View style={{
          flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, alignItems: 'center', ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 11, color: colors.text.darkMuted, fontWeight: '600',
            letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs,
          }}>Previsão do Mês</Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: '700', color: colors.green.primary }}>
            {forecast.projectedConsumption.toFixed(1)}
          </Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.darkMuted, marginTop: 2 }}>kWh</Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: '600', color: colors.green.primary, marginTop: spacing.sm }}>
            R$ {forecast.projectedCost.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, alignItems: 'center', ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Média Diária</Text>
        <Text style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: '700', color: colors.green.primary }}>
          {forecast.dailyAverage.toFixed(1)} kWh/dia
        </Text>
      </View>

      {forecast.goalComparison && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
          borderLeftWidth: 4,
          borderLeftColor: forecast.goalComparison.isAbove ? colors.alert.danger : colors.green.dark,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 11, color: colors.text.darkMuted, fontWeight: '600',
            letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.sm,
          }}>Status da Meta</Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: '700', color: colors.text.dark, marginBottom: spacing.xs }}>
            {forecast.goalComparison.goalTitle}
          </Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 14, color: colors.text.darkSecondary, marginBottom: spacing.sm }}>
            Meta: R$ {forecast.goalComparison.goalTarget.toFixed(2)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 14, fontWeight: '600',
              color: forecast.goalComparison.isAbove ? colors.alert.danger : colors.green.dark,
            }}>
              {forecast.goalComparison.isAbove ? 'Acima' : 'Abaixo'}: R$ {Math.abs(forecast.goalComparison.difference).toFixed(2)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons
                name={forecast.goalComparison.isAbove ? 'trending-up' : 'trending-down'}
                size={16}
                color={forecast.goalComparison.isAbove ? colors.alert.danger : colors.green.dark}
                style={{ marginRight: 4 }}
              />
              <Text style={{
                fontFamily: 'Poppins', fontSize: 16, fontWeight: '700',
                color: forecast.goalComparison.isAbove ? colors.alert.danger : colors.green.dark,
              }}>
                {forecast.goalComparison.isAbove ? '+' : '-'}{Math.abs(forecast.goalComparison.percentageAbove).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {forecast.recommendations.length > 0 && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Recomendações</Text>
          {forecast.recommendations.map((rec, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
              <MaterialCommunityIcons name="lightbulb-outline" size={16} color={colors.green.primary} style={{ marginRight: spacing.sm, marginTop: 2 }} />
              <Text style={{ fontFamily: 'Poppins', fontSize: 14, color: colors.text.darkSecondary, flex: 1, lineHeight: 20 }}>{rec}</Text>
            </View>
          ))}
        </View>
      )}

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getDailyReadings, getWeeklyReadings, getMonthlyReadings } from '../src/services/dataProvider';
import { EnergyReading } from '../src/types';
import { useDemo } from '../src/contexts/DemoContext';
import Button from '../src/components/Button';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, getChartConfig, sectionHeader } from '../src/theme/designSystem';

type HistoryProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'History'>;
};

type PeriodKey = 'today' | 'week' | 'month';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
];

const screenWidth = Dimensions.get('window').width - spacing.md * 2;

export default function History({ navigation }: HistoryProps) {
  const { colors, themeName } = useTheme();
  const { isDemoMode } = useDemo();

  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadReadings = useCallback(async (uid: string, p: PeriodKey) => {
    setLoading(true);
    try {
      let data: EnergyReading[];
      if (p === 'today') data = await getDailyReadings(uid, isDemoMode);
      else if (p === 'week') data = await getWeeklyReadings(uid, isDemoMode);
      else data = await getMonthlyReadings(uid, isDemoMode);
      setReadings(data || []);
    } catch { setReadings([]); }
    finally { setLoading(false); }
  }, [isDemoMode]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      if (user || isDemoMode) {
        const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
        setUserId(uid);
        loadReadings(uid, period);
      } else { setLoading(false); }
    });
    return () => unsubAuth();
  }, [isDemoMode, period, loadReadings]);

  const totalConsumption = readings.reduce((s, r) => s + (r.kwh || 0), 0);
  const totalCost = readings.reduce((s, r) => s + (r.cost || 0), 0);
  const dailyAvg = readings.length > 0 ? totalConsumption / Math.max(1, readings.length > 30 ? 30 : readings.length > 7 ? 7 : 1) : 0;
  const peakConsumption = readings.length > 0 ? Math.max(...readings.map(r => r.kwh || 0)) : 0;
  const minConsumption = readings.length > 0 ? Math.min(...readings.map(r => r.kwh || 0)) : 0;

  const chartLabels = readings.slice(0, 7).map(() => '').reverse();
  const chartDataValues = readings.slice(0, 7).map(r => r.kwh || 0).reverse();

  const chartConfigLocal = {
    ...getChartConfig(themeName),
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{...sectionHeader, color: colors.text.muted}}>HISTÓRICO</Text>
      <Text style={{
        fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.lg,
      }}>Histórico de Consumo</Text>

      <View style={{ flexDirection: 'row', marginBottom: spacing.md, gap: 8 }}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
              backgroundColor: period === p.key ? colors.green.primary : colors.surfaceLight,
            }}
          >
            <Text style={{
              fontFamily: 'Poppins', color: period === p.key ? '#FFFFFF' : colors.text.tertiary,
              fontWeight: '600', fontSize: 13,
            }}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Loading message="Carregando histórico..." />
      ) : readings.length === 0 ? (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.xl, alignItems: 'center', ...shadows.card,
        }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.text.darkMuted + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <MaterialCommunityIcons name="history" size={28} color={colors.text.darkMuted} />
          </View>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
            Nenhuma leitura encontrada
          </Text>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, textAlign: 'center', fontSize: 14 }}>
            As leituras aparecerão aqui quando disponíveis.
          </Text>
        </View>
      ) : (
        <>
          <View style={{
            backgroundColor: colors.card, borderRadius: borderRadius.card,
            padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <MaterialCommunityIcons name="flash" size={18} color={colors.green.primary} />
                </View>
                <Text style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: '700', color: colors.green.primary }}>
                  {totalConsumption.toFixed(1)}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 11, marginTop: 2 }}>kWh Total</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <MaterialCommunityIcons name="currency-usd" size={18} color={colors.green.primary} />
                </View>
                <Text style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: '700', color: colors.green.primary }}>
                  R$ {totalCost.toFixed(2)}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 11, marginTop: 2 }}>Custo Total</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: '700', color: colors.green.primary }}>
                  {dailyAvg.toFixed(2)}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 11, marginTop: 2 }}>Média</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: '700', color: colors.green.primary }}>
                  {peakConsumption.toFixed(2)}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 11, marginTop: 2 }}>Pico</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: '700', color: colors.green.primary }}>
                  {minConsumption.toFixed(2)}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 11, marginTop: 2 }}>Mínimo</Text>
              </View>
            </View>
          </View>

          <View style={{
            backgroundColor: colors.card, borderRadius: borderRadius.card,
            padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
          }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
              marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
            }}>Tendência de Consumo</Text>
            <LineChart
              data={{ labels: chartLabels, datasets: [{ data: chartDataValues.length > 0 ? chartDataValues : [0] }] }}
              width={screenWidth}
              height={200}
              chartConfig={chartConfigLocal}
              fromZero
              bezier
              style={{ borderRadius: borderRadius.md }}
            />
          </View>

          <View style={{
            backgroundColor: colors.card, borderRadius: borderRadius.card,
            padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
          }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
              marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
            }}>Últimas Leituras</Text>
            {readings.slice(0, 20).map(r => (
              <View
                key={r.id || Math.random().toString()}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 14 }}>
                    {r.applianceName}
                  </Text>
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 11, marginTop: 2 }}>
                    {new Date(r.timestamp).toLocaleString('pt-BR')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="flash" size={12} color={colors.green.primary} />
                    <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, fontSize: 13, fontWeight: '600', marginLeft: 3 }}>
                      {r.kwh?.toFixed(3)} kWh
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Poppins', color: colors.green.primary, fontSize: 12 }}>
                    R$ {r.cost?.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

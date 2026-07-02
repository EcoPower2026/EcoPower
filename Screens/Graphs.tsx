import React, { useEffect, useState } from 'react';
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
import { auth } from '../src/firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { Appliance, MonitoringState, EnergyReading } from '../src/types';
import Loading from '../src/components/Loading';
import Button from '../src/components/Button';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, getChartConfig, sectionHeader } from '../src/theme/designSystem';

type GraphsProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Graphs'>;
};

type PeriodKey = 'today' | 'week' | 'month';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hora' },
  { key: 'week', label: 'Dia' },
  { key: 'month', label: 'Semana' },
];

const screenWidth = Dimensions.get('window').width - spacing.md * 2;

export default function Graphs({ navigation }: GraphsProps) {
  const { colors, themeName } = useTheme();
  const { isDemoMode } = useDemo();
  const isPremium = themeName === 'ecoNaturePremium';

  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringState | null>(null);
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [loading, setLoading] = useState(true);

  const activeAppliance = appliances.find(
    a => a.id === monitoring?.aparelhoAtivoId
  );

  useEffect(() => {
    let unsubAppliances: (() => void) | null = null;
    let unsubMonitoring: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, user => {
      if (user || isDemoMode) {
        const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
        unsubAppliances = dataProvider.subscribeAppliances(uid, list => {
          setAppliances(list);
        }, isDemoMode);
        unsubMonitoring = dataProvider.subscribeMonitoringState(uid, state => {
          setMonitoring(state);
        }, isDemoMode);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubAppliances?.();
      unsubMonitoring?.();
    };
  }, [isDemoMode]);

  useEffect(() => {
    if (!loading) {
      const unsubAuth = onAuthStateChanged(auth, user => {
        const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
        const unsub = dataProvider.subscribeReadings(uid, list => {
          setReadings(list);
        }, isDemoMode);
        return () => unsub?.();
      });
    }
  }, [loading, isDemoMode]);

  const filteredReadings = readings.filter(r => {
    const d = new Date(r.timestamp).getTime();
    const now = Date.now();
    if (period === 'today') return now - d < 86400000;
    if (period === 'week') return now - d < 7 * 86400000;
    return now - d < 30 * 86400000;
  });

  const groupedData = new Map<string, number>();
  filteredReadings.forEach(r => {
    const d = new Date(r.timestamp);
    let key: string;
    if (period === 'today') key = `${d.getHours()}h`;
    else if (period === 'week') key = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    else key = `S${Math.ceil(d.getDate() / 7)}`;
    groupedData.set(key, (groupedData.get(key) || 0) + (r.kwh || 0));
  });

  const chartLabels = Array.from(groupedData.keys()).slice(0, 10);
  const chartValues = Array.from(groupedData.values()).slice(0, 10);

  const chartConfigLocal = {
    ...getChartConfig(themeName),
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
  };

  if (loading) {
    return <Loading message="Carregando gráficos..." />;
  }

  if (!activeAppliance) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{...sectionHeader, color: colors.text.muted}}>ANALYTICS</Text>
        <Text style={{
          fontFamily: 'Poppins',
          fontSize: 26,
          fontWeight: '700',
          color: colors.text.primary,
          marginBottom: spacing.lg,
        }}>Gráficos</Text>

        <View style={{
          backgroundColor: colors.card,
          borderRadius: isPremium ? 24 : borderRadius.card,
          padding: spacing.xl,
          alignItems: 'center',
          ...(isPremium
            ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: colors.border }
            : shadows.card
          ),
        }}>
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.green.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
          }}>
            <MaterialCommunityIcons name="chart-line" size={28} color={colors.green.primary} />
          </View>
          <Text style={{
            fontFamily: 'Poppins',
            color: colors.text.dark,
            fontWeight: '700',
            fontSize: 16,
            marginBottom: spacing.sm,
            textAlign: 'center',
          }}>
            Selecione um aparelho para iniciar o monitoramento.
          </Text>
          <Text style={{
            fontFamily: 'Poppins',
            color: colors.text.darkMuted,
            textAlign: 'center',
            marginBottom: spacing.md,
            fontSize: 14,
          }}>
            Vá em "Gerenciar Aparelhos" e escolha qual aparelho deseja monitorar.
          </Text>
          <Button
            title="Gerenciar Aparelhos"
            onPress={() => navigation.navigate('Appliances')}
            style={{ width: '100%' }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{...sectionHeader, color: colors.text.muted}}>ANALYTICS</Text>
      <Text style={{
        fontFamily: 'Poppins',
        fontSize: 26,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.lg,
      }}>Gráficos</Text>

      <View style={{
          backgroundColor: colors.green.primary,
          borderRadius: isPremium ? 24 : borderRadius.card,
          padding: spacing.lg,
          marginBottom: spacing.md,
          alignItems: 'center',
          ...(isPremium ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 } : shadows.floating),
        }}>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          paddingHorizontal: spacing.sm + 6,
          paddingVertical: spacing.xs,
          borderRadius: 20,
          marginBottom: spacing.sm,
        }}>
          <Text style={{ color: '#FFF', fontFamily: 'Poppins', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
            DASHBOARD ANALÍTICO
          </Text>
        </View>
        <Text style={{ color: '#FFF', fontFamily: 'Poppins', fontSize: 13, marginBottom: spacing.xs, opacity: 0.9 }}>
          Aparelho Ativo
        </Text>
        <Text style={{ color: '#FFF', fontFamily: 'Poppins', fontSize: 36, fontWeight: '700', textAlign: 'center' }}>
          {activeAppliance.nome}
        </Text>
        {activeAppliance.descricao ? (
          <Text style={{ color: '#FFF', fontFamily: 'Poppins', fontSize: 16, marginTop: spacing.xs, fontWeight: '600', opacity: 0.9 }}>
            {activeAppliance.descricao}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm, flexWrap: 'wrap' }}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.chip,
              backgroundColor: period === p.key ? colors.green.primary : colors.surfaceLight,
            }}
          >
            <Text style={{
              fontFamily: 'Poppins',
              color: period === p.key ? '#FFFFFF' : colors.text.tertiary,
              fontWeight: '600',
              fontSize: 12,
            }}>
              Consumo por {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{
        backgroundColor: colors.card,
        borderRadius: isPremium ? 24 : borderRadius.card,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...(isPremium
          ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: colors.border }
          : shadows.card
        ),
      }}>
        <Text style={{
          fontFamily: 'Poppins',
          fontSize: 13,
          fontWeight: '600',
          color: colors.text.darkMuted,
          marginBottom: spacing.sm,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          Consumo por {period === 'today' ? 'hora' : period === 'week' ? 'dia' : 'semana'}
        </Text>
        {chartValues.length > 0 ? (
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [{ data: chartValues }],
            }}
            width={screenWidth}
            height={240}
            chartConfig={chartConfigLocal}
            fromZero
            bezier
            style={{ borderRadius: borderRadius.md }}
          />
        ) : (
          <Text style={{
            fontFamily: 'Poppins',
            color: colors.text.darkMuted,
            textAlign: 'center',
            paddingVertical: 20,
          }}>
            Nenhum dado disponível para este período
          </Text>
        )}
      </View>

      <View style={{
        backgroundColor: colors.card,
        borderRadius: isPremium ? 24 : borderRadius.card,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...(isPremium
          ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: colors.border }
          : shadows.card
        ),
      }}>
        <Text style={{
          fontFamily: 'Poppins',
          fontSize: 13,
          fontWeight: '600',
          color: colors.text.darkMuted,
          marginBottom: spacing.md,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>Participação por Aparelho</Text>
        <Text style={{
          fontFamily: 'Poppins',
          color: colors.text.darkMuted,
          marginBottom: spacing.md,
          fontSize: 13,
        }}>
          Distribuição percentual do consumo entre seus aparelhos cadastrados.
        </Text>
        {appliances.length === 0 ? (
          <Text style={{
            fontFamily: 'Poppins',
            color: colors.text.darkMuted,
            textAlign: 'center',
            paddingVertical: 16,
          }}>
            Nenhum aparelho cadastrado.
          </Text>
        ) : (
          <View>
            {appliances.map((app, index) => {
              const barColors = [colors.alert.danger, colors.alert.warning, colors.blue.chart, colors.green.dark, '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'];
              const color = barColors[index % barColors.length];
              const pct = 100 / appliances.length;
              return (
                <View key={app.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: spacing.sm }} />
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 13, width: 100 }}>{app.nome}</Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginHorizontal: spacing.sm, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 12, fontWeight: '600', width: 35, textAlign: 'right' }}>
                    {pct.toFixed(0)}%
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

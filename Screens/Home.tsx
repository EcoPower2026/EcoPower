import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useDemo } from '../src/contexts/DemoContext';
import { useTheme } from '../src/contexts/ThemeContext';
import * as dataProvider from '../src/services/dataProvider';
import {
  Appliance,
  MonitoringState,
  Goal,
  Alert as AlertType,
  EnergyReading,
} from '../src/types';
import { DashboardData } from '../src/services/dashboardService';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { spacing, borderRadius, shadows, getChartConfig } from '../src/theme/designSystem';

type HomeProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Home'>;
};

const screenWidth = Dimensions.get('window').width - spacing.md * 2;

function KpiCard({ icon, label, value, subtitle, color, trend, colors }: {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  trend?: { value: string; positive: boolean };
  colors: any;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: borderRadius.card,
      padding: spacing.md,
      ...shadows.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: color + '18',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        }}>
          <MaterialCommunityIcons name={icon as any} size={16} color={color} />
        </View>
        <Text style={{
          fontFamily: 'Poppins',
          fontSize: 11,
          color: colors.text.tertiary,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          flex: 1,
        }}>{label}</Text>
      </View>
      <Text style={{
        fontFamily: 'Poppins',
        fontSize: 22,
        fontWeight: '700',
        color: colors.text.primary,
      }}>{value}</Text>
      {subtitle && (
        <Text style={{
          fontFamily: 'Poppins',
          fontSize: 12,
          color: colors.text.tertiary,
          marginTop: 2,
        }}>{subtitle}</Text>
      )}
      {trend && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
          <MaterialCommunityIcons
            name={trend.positive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={trend.positive ? colors.alert.success : colors.alert.danger}
          />
          <Text style={{
            fontFamily: 'Poppins',
            fontSize: 11,
            color: trend.positive ? colors.alert.success : colors.alert.danger,
            fontWeight: '600',
            marginLeft: 3,
          }}>{trend.value}</Text>
        </View>
      )}
    </View>
  );
}

function WhiteCard({ children, title, icon, colors }: {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  colors: any;
}) {
  return (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: borderRadius.card,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.card,
    }}>
      {title && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={16}
              color={colors.text.tertiary}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text style={{
            fontFamily: 'Poppins',
            fontSize: 13,
            fontWeight: '600',
            color: colors.text.tertiary,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

function ValueDisplay({ kwh, cost, colors }: { kwh: number; cost: number; colors: any }) {
  return (
    <View>
      <Text style={{
        fontFamily: 'Poppins',
        fontSize: 26,
        fontWeight: '700',
        color: colors.text.primary,
      }}>{kwh.toFixed(1)} kWh</Text>
      <Text style={{
        fontFamily: 'Poppins',
        fontSize: 13,
        color: colors.text.tertiary,
        marginTop: 2,
      }}>(R$ {cost.toFixed(2)})</Text>
    </View>
  );
}

export default function Home({ navigation }: HomeProps) {
  const { isDemoMode } = useDemo();
  const { colors, themeName } = useTheme();

  const [userName, setUserName] = useState('');
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringState | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubAppliances: (() => void) | null = null;
    let unsubMonitoring: (() => void) | null = null;
    let unsubGoals: (() => void) | null = null;
    let unsubAlerts: (() => void) | null = null;
    let unsubReadings: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);

      if (user || isDemoMode) {
        unsubProfile = dataProvider.subscribeUserProfile(uid, profile => {
          setUserName(profile?.nome ?? '');
        }, isDemoMode);
        unsubAppliances = dataProvider.subscribeAppliances(uid, list => {
          setAppliances(list);
        }, isDemoMode);
        unsubMonitoring = dataProvider.subscribeMonitoringState(uid, state => {
          setMonitoring(state);
        }, isDemoMode);
        unsubGoals = dataProvider.subscribeGoals(uid, list => {
          setGoals(list);
        }, isDemoMode);
        unsubAlerts = dataProvider.subscribeAlerts(uid, list => {
          setAlerts(list);
        }, isDemoMode);
        unsubReadings = dataProvider.subscribeReadings(uid, list => {
          setReadings(list);
        }, isDemoMode);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
      unsubAppliances?.();
      unsubMonitoring?.();
      unsubGoals?.();
      unsubAlerts?.();
      unsubReadings?.();
    };
  }, [isDemoMode]);

  useEffect(() => {
    if (userId) {
      dataProvider.getDashboardData(userId, isDemoMode).then(setDashboard).catch(() => {});
    }
  }, [userId, isDemoMode, readings, goals, alerts]);

  if (loading) {
    return <Loading message="Carregando painel EcoPower..." />;
  }

  const unreadCount = alerts.filter(a => !a.lido).length;
  const topAppliances = [...appliances]
    .sort((a, b) => (b.potencia || 0) - (a.potencia || 0))
    .slice(0, 5);

  const chartConfigLocal = {
    ...getChartConfig(themeName),
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {isDemoMode && (
        <View style={{
          backgroundColor: colors.alert.warning,
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          marginBottom: spacing.md,
          alignItems: 'center',
        }}>
          <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontWeight: '700', fontSize: 13 }}>
            Modo Demonstração Ativo
          </Text>
        </View>
      )}

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
      }}>
        <View>
          <Text style={{
            fontFamily: 'Poppins',
            fontSize: 13,
            color: colors.text.tertiary,
            fontWeight: '500',
          }}>
            {userName ? `Olá, ${userName}` : 'Bem-vindo'}
          </Text>
          <Text style={{
            fontFamily: 'Poppins',
            fontSize: 28,
            fontWeight: '700',
            color: colors.text.primary,
            marginTop: 2,
          }}>Dashboard</Text>
        </View>
        <View style={{
          backgroundColor: colors.surfaceLight,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.sm + 4,
          paddingVertical: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <MaterialCommunityIcons name="calendar-today" size={14} color={colors.text.tertiary} />
          <Text style={{
            fontFamily: 'Poppins',
            fontSize: 12,
            color: colors.text.tertiary,
            marginLeft: 4,
            fontWeight: '500',
          }}>
            {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>

      {dashboard && (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <KpiCard colors={colors}
                icon="lightning-bolt"
                label="Consumo"
                value={`${dashboard.currentConsumption.toFixed(1)} kWh`}
                subtitle={`R$ ${dashboard.currentCost.toFixed(2)}`}
                color={colors.green.light}
                trend={{ value: '+12% vs mês anterior', positive: false }}
              />
              <KpiCard colors={colors}
                icon="target"
                label="Meta do Mês"
                value={dashboard.goal ? `R$ ${dashboard.goal.value.toFixed(0)}` : '---'}
                subtitle={dashboard.goal?.label}
                color={colors.alert.warning}
              />
            </View>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <KpiCard colors={colors}
                icon="currency-usd"
                label="Gasto Atual"
                value={`R$ ${dashboard.currentCost.toFixed(2)}`}
                color={colors.green.dark}
              />
              <KpiCard colors={colors}
                icon="star"
                label="Eficiência"
                value={dashboard.efficiency ? `${dashboard.efficiency.score}` : '---'}
                subtitle={dashboard.efficiency?.classificacao}
                color={
                  dashboard.efficiency
                    ? dashboard.efficiency.score >= 70
                      ? colors.green.primary
                      : dashboard.efficiency.score >= 50
                        ? colors.alert.warning
                        : colors.alert.danger
                    : colors.text.muted
                }
              />
            </View>
          </View>

          {dashboard.financialForecast && (
            <WhiteCard colors={colors} title="Previsão Mensal" icon="chart-timeline-variant">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <View>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.darkMuted }}>Consumo previsto</Text>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: '700', color: colors.text.dark, marginTop: 2 }}>
                    {dashboard.financialForecast.projectedConsumption.toFixed(0)} kWh
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.darkMuted }}>Gasto previsto</Text>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: '700', color: colors.green.primary, marginTop: 2 }}>
                    R$ {dashboard.financialForecast.projectedCost.toFixed(2)}
                  </Text>
                </View>
              </View>
              {dashboard.financialForecast.goalValue && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(0,0,0,0.04)',
                }}>
                  <MaterialCommunityIcons
                    name={dashboard.financialForecast.isWithinGoal ? 'check-circle' : 'alert-circle'}
                    size={18}
                    color={dashboard.financialForecast.isWithinGoal ? colors.green.primary : colors.alert.warning}
                    style={{ marginRight: spacing.sm }}
                  />
                  <Text style={{
                    flex: 1,
                    fontFamily: 'Poppins',
                    fontSize: 13,
                    color: dashboard.financialForecast.isWithinGoal ? colors.green.primary : colors.alert.warning,
                    fontWeight: '600',
                  }}>
                    {dashboard.financialForecast.isWithinGoal
                      ? 'Você está dentro da meta.'
                      : `Ultrapassará a meta em ${Math.abs(dashboard.financialForecast.percentAboveGoal).toFixed(1)}%`}
                  </Text>
                </View>
              )}
            </WhiteCard>
          )}

          {dashboard.insightOfTheDay && (
            <View style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.card,
              padding: spacing.md,
              marginBottom: spacing.md,
              ...shadows.card,
              borderLeftWidth: 3,
              borderLeftColor: colors.alert.warning,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialCommunityIcons
                  name={(dashboard.insightOfTheDay.icon || 'lightbulb-outline') as any}
                  size={20}
                  color={colors.alert.warning}
                  style={{ marginRight: spacing.sm, marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Poppins',
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.text.darkMuted,
                    marginBottom: 4,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}>Insight do Dia</Text>
                  <Text style={{
                    fontFamily: 'Poppins',
                    fontSize: 14,
                    color: colors.text.darkSecondary,
                    lineHeight: 21,
                  }}>
                    {dashboard.insightOfTheDay.message}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {dashboard.proactiveAlert && (
            <View style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.card,
              padding: spacing.md,
              marginBottom: spacing.md,
              ...shadows.card,
              borderLeftWidth: 3,
              borderLeftColor: dashboard.proactiveAlert.type === 'danger' ? colors.alert.danger : colors.alert.warning,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialCommunityIcons
                  name="alert"
                  size={20}
                  color={dashboard.proactiveAlert.type === 'danger' ? colors.alert.danger : colors.alert.warning}
                  style={{ marginRight: spacing.sm, marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Poppins',
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.text.darkMuted,
                    marginBottom: 4,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}>Alerta Proativo</Text>
                  <Text style={{
                    fontFamily: 'Poppins',
                    fontSize: 14,
                    color: dashboard.proactiveAlert.type === 'danger' ? colors.alert.danger : colors.alert.warning,
                    lineHeight: 21,
                  }}>
                    {dashboard.proactiveAlert.message}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {dashboard.chartData.values.length > 0 && (
            <WhiteCard colors={colors} title="Últimos 7 Dias" icon="chart-line">
              <LineChart
                data={{
                  labels: dashboard.chartData.labels,
                  datasets: [{ data: dashboard.chartData.values }],
                }}
                width={screenWidth - spacing.md * 2}
                height={160}
                chartConfig={chartConfigLocal}
                fromZero
                bezier
                style={{ borderRadius: borderRadius.md, marginLeft: -spacing.xs }}
              />
            </WhiteCard>
          )}

          {topAppliances.length > 0 && (
            <WhiteCard colors={colors} title="Top Aparelhos" icon="flash-outline">
              {topAppliances.map((app, idx) => {
                const maxPower = Math.max(...appliances.map(a => a.potencia || 0));
                const pct = ((app.potencia || 0) / maxPower) * 100;
                const barColors = [colors.green.light, colors.blue.chart, colors.alert.warning, colors.alert.danger, colors.green.dark];
                return (
                  <View key={app.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: idx < topAppliances.length - 1 ? spacing.sm : 0 }}>
                    <Text style={{
                      fontFamily: 'Poppins',
                      fontSize: 12,
                      color: colors.text.darkMuted,
                      fontWeight: '600',
                      width: 24,
                    }}>{idx + 1}º</Text>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={{
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        color: colors.text.darkSecondary,
                        fontWeight: '500',
                        marginBottom: 4,
                      }}>{app.nome}</Text>
                      <View style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: barColors[idx % barColors.length], borderRadius: 2 }} />
                      </View>
                    </View>
                    <Text style={{
                      fontFamily: 'Poppins',
                      fontSize: 12,
                      color: colors.text.darkMuted,
                      fontWeight: '600',
                      marginLeft: spacing.sm,
                    }}>{app.potencia || 0}W</Text>
                  </View>
                );
              })}
            </WhiteCard>
          )}

          {alerts.length > 0 && (
            <WhiteCard colors={colors}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={{
                  fontFamily: 'Poppins',
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.text.darkMuted,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  flex: 1,
                }}>Alertas{unreadCount > 0 ? ` (${unreadCount})` : ''}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.green.primary, fontWeight: '600' }}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              {alerts.slice(0, 3).map((alert, idx) => (
                <TouchableOpacity
                  key={alert.id}
                  onPress={() => navigation.navigate('Alerts')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingVertical: spacing.sm,
                    borderTopWidth: idx > 0 ? 1 : 0,
                    borderTopColor: 'rgba(0,0,0,0.04)',
                  }}
                >
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: (alert.nivel === 'danger' ? colors.alert.danger : alert.nivel === 'warning' ? colors.alert.warning : colors.alert.info) + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}>
                    <MaterialCommunityIcons
                      name={alert.lido ? 'alert-circle-outline' : 'alert-circle'}
                      size={14}
                      color={alert.nivel === 'danger' ? colors.alert.danger : alert.nivel === 'warning' ? colors.alert.warning : colors.alert.info}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.text.dark,
                    }}>{alert.titulo}</Text>
                    <Text style={{
                      fontFamily: 'Poppins',
                      fontSize: 12,
                      color: colors.text.darkMuted,
                      marginTop: 1,
                    }} numberOfLines={1}>{alert.mensagem}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </WhiteCard>
          )}
        </>
      )}

      {!dashboard && (
        <View style={{
          backgroundColor: colors.card,
          borderRadius: borderRadius.card,
          padding: spacing.xl,
          marginTop: spacing.md,
          alignItems: 'center',
          ...shadows.card,
        }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.green.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
          }}>
            <MaterialCommunityIcons name="lightning-bolt" size={32} color={colors.green.primary} />
          </View>
          <Text style={{
            fontFamily: 'Poppins',
            color: colors.text.dark,
            fontWeight: '700',
            fontSize: 18,
            marginBottom: spacing.sm,
          }}>Bem-vindo ao EcoPower</Text>
          <Text style={{
            fontFamily: 'Poppins',
            color: colors.text.darkMuted,
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 20,
          }}>
            Conecte seus aparelhos para começar a monitorar seu consumo de energia.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

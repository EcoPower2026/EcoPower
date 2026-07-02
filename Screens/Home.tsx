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
import { auth } from '../src/firebase';
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
import { spacing, borderRadius, shadows, getChartConfig, ThemeName } from '../src/theme/designSystem';

type HomeProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Home'>;
};

const screenWidth = Dimensions.get('window').width - spacing.md * 2;

function WhiteCard({ children, title, icon, colors, isPremium }: {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  colors: any;
  isPremium?: boolean;
}) {
  return (
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
            fontSize: 12,
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
      dataProvider.getDashboardData(userId, isDemoMode, readings, goals, alerts).then(setDashboard).catch(() => {});
    }
  }, [userId, isDemoMode, readings, goals, alerts]);

  if (loading) {
    return <Loading message="Carregando painel EcoPower..." />;
  }

  const isPremium = themeName === 'ecoNaturePremium';
  const unreadCount = alerts.filter(a => !a.lido).length;
  const topAppliances = [...appliances]
    .sort((a, b) => (b.potencia || 0) - (a.potencia || 0))
    .slice(0, 5);

  const chartConfigLocal = {
    ...getChartConfig(themeName),
  };

  const heroCard = (color: string) => ({
    backgroundColor: colors.card,
    borderRadius: isPremium ? 24 : borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(isPremium
      ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 32, shadowOffset: { width: 0, height: 10 }, elevation: 10, borderWidth: 1, borderColor: colors.border }
      : shadows.card
    ),
    borderLeftWidth: 4,
    borderLeftColor: color,
  });

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
          paddingVertical: spacing.xs + 2,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.md,
          alignItems: 'center',
          alignSelf: 'center',
        }}>
          <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 }}>
            MODO DEMONSTRAÇÃO
          </Text>
        </View>
      )}

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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

      {!dashboard && (
        <View style={{
          backgroundColor: colors.card,
          borderRadius: isPremium ? 24 : borderRadius.card,
          padding: spacing.xl,
          marginTop: spacing.md,
          alignItems: 'center',
          ...(isPremium
            ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: colors.border }
            : shadows.card
          ),
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

      {dashboard && (
        <>
          {/* HERO: Gasto em Tempo Real */}
          <View style={heroCard(dashboard.financialForecast?.isWithinGoal === false ? colors.alert.warning : colors.green.primary)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: (dashboard.financialForecast?.isWithinGoal === false ? colors.alert.warning : colors.green.primary) + '18',
                alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
              }}>
                <MaterialCommunityIcons
                  name="currency-usd"
                  size={18}
                  color={dashboard.financialForecast?.isWithinGoal === false ? colors.alert.warning : colors.green.primary}
                />
              </View>
              <Text style={{
                fontFamily: 'Poppins', fontSize: 12, fontWeight: '600',
                color: colors.text.tertiary, letterSpacing: 0.5, textTransform: 'uppercase', flex: 1,
              }}>Gasto em Tempo Real</Text>
            </View>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 40, fontWeight: '800',
              color: colors.text.primary, letterSpacing: -1,
            }}>
              R$ {dashboard.currentCost.toFixed(2)}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
              <View>
                <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary, fontWeight: '500' }}>
                  Consumo
                </Text>
                <Text style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: '700', color: colors.text.primary, marginTop: 1 }}>
                  {dashboard.currentConsumption.toFixed(1)} kWh
                </Text>
              </View>
              <View>
                <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary, fontWeight: '500' }}>
                  Média diária
                </Text>
                <Text style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: '700', color: colors.text.primary, marginTop: 1 }}>
                  {(dashboard.currentConsumption / Math.max(new Date().getDate(), 1)).toFixed(1)} kWh/dia
                </Text>
              </View>
              {dashboard.efficiency && (
                <View>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary, fontWeight: '500' }}>
                    Eficiência
                  </Text>
                  <Text style={{
                    fontFamily: 'Poppins', fontSize: 15, fontWeight: '700', marginTop: 1,
                    color: dashboard.efficiency.score >= 70 ? colors.green.primary : dashboard.efficiency.score >= 50 ? colors.alert.warning : colors.alert.danger,
                  }}>
                    {dashboard.efficiency.score}/100
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* PREVISÃO MENSAL */}
          {dashboard.financialForecast && (
            <WhiteCard colors={colors} title="Previsão para o Mês" icon="chart-timeline-variant" isPremium={isPremium}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary, fontWeight: '500', marginBottom: 2 }}>
                    Gasto estimado mantendo a média
                  </Text>
                  <Text style={{
                    fontFamily: 'Poppins', fontSize: 26, fontWeight: '800',
                    color: dashboard.financialForecast.isWithinGoal ? colors.green.primary : colors.alert.warning,
                  }}>
                    R$ {dashboard.financialForecast.projectedCost.toFixed(2)}
                  </Text>
                </View>
                <View style={{
                  width: 1, height: 48, backgroundColor: colors.divider, marginHorizontal: spacing.md,
                }} />
                <View>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary, fontWeight: '500', marginBottom: 2 }}>
                    Consumo
                  </Text>
                  <Text style={{ fontFamily: 'Poppins', fontSize: 18, fontWeight: '700', color: colors.text.primary }}>
                    {dashboard.financialForecast.projectedConsumption.toFixed(0)} kWh
                  </Text>
                </View>
              </View>
              {dashboard.financialForecast.goalValue && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm,
                  borderTopWidth: 1, borderTopColor: colors.divider,
                }}>
                  <MaterialCommunityIcons
                    name={dashboard.financialForecast.isWithinGoal ? 'check-circle' : 'alert-circle'}
                    size={18}
                    color={dashboard.financialForecast.isWithinGoal ? colors.green.primary : colors.alert.warning}
                    style={{ marginRight: spacing.sm }}
                  />
                  <Text style={{
                    flex: 1, fontFamily: 'Poppins', fontSize: 13,
                    color: dashboard.financialForecast.isWithinGoal ? colors.green.primary : colors.alert.warning, fontWeight: '600',
                  }}>
                    {dashboard.financialForecast.isWithinGoal
                      ? 'Você está dentro da meta'
                      : `Ultrapassará a meta em ${Math.abs(dashboard.financialForecast.percentAboveGoal).toFixed(1)}%`}
                  </Text>
                </View>
              )}
            </WhiteCard>
          )}

          {/* GRÁFICO COMPACTO */}
          {dashboard.chartData.values.length > 0 && (
            <WhiteCard colors={colors} title="Últimos 7 Dias" icon="chart-line" isPremium={isPremium}>
              <LineChart
                data={{
                  labels: dashboard.chartData.labels,
                  datasets: [{ data: dashboard.chartData.values }],
                }}
                width={screenWidth - spacing.md * 2}
                height={220}
                chartConfig={{
                  ...chartConfigLocal,
                  propsForLabels: {
                    ...chartConfigLocal.propsForLabels,
                    fontSize: 10,
                  },
                }}
                fromZero
                bezier
                style={{
                  borderRadius: borderRadius.md,
                  marginLeft: -spacing.xs,
                  paddingBottom: spacing.sm,
                }}
              />
            </WhiteCard>
          )}

          {/* INSIGHT OU ALERTA (apenas o mais importante) */}
          {dashboard.insightOfTheDay && (
            <View style={{
              backgroundColor: colors.card,
              borderRadius: isPremium ? 24 : borderRadius.card,
              padding: spacing.md,
              marginBottom: spacing.md,
              ...(isPremium
                ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: colors.border }
                : shadows.card
              ),
              borderLeftWidth: 3,
              borderLeftColor: colors.alert.warning,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialCommunityIcons
                  name={(dashboard.insightOfTheDay.icon || 'lightbulb-outline') as any}
                  size={18}
                  color={colors.alert.warning}
                  style={{ marginRight: spacing.sm, marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Poppins', fontSize: 11, fontWeight: '600',
                    color: colors.text.tertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2,
                  }}>Insight do Dia</Text>
                  <Text style={{
                    fontFamily: 'Poppins', fontSize: 13, color: colors.text.secondary, lineHeight: 20,
                  }}>
                    {dashboard.insightOfTheDay.message}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {dashboard.proactiveAlert && !dashboard.insightOfTheDay && (
            <View style={{
              backgroundColor: colors.card,
              borderRadius: isPremium ? 24 : borderRadius.card,
              padding: spacing.md,
              marginBottom: spacing.md,
              ...(isPremium
                ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: colors.border }
                : shadows.card
              ),
              borderLeftWidth: 3,
              borderLeftColor: dashboard.proactiveAlert.type === 'danger' ? colors.alert.danger : colors.alert.warning,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialCommunityIcons
                  name="alert"
                  size={18}
                  color={dashboard.proactiveAlert.type === 'danger' ? colors.alert.danger : colors.alert.warning}
                  style={{ marginRight: spacing.sm, marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Poppins', fontSize: 11, fontWeight: '600',
                    color: colors.text.tertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2,
                  }}>Alerta</Text>
                  <Text style={{
                    fontFamily: 'Poppins', fontSize: 13,
                    color: dashboard.proactiveAlert.type === 'danger' ? colors.alert.danger : colors.alert.warning,
                    lineHeight: 20,
                  }}>
                    {dashboard.proactiveAlert.message}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* TOP APARELHOS — compacto vertical */}
          {topAppliances.length > 0 && (
            <WhiteCard colors={colors} title="Top Aparelhos" icon="flash-outline" isPremium={isPremium}>
              {topAppliances.map((app, idx) => {
                const maxPower = Math.max(...appliances.map(a => a.potencia || 0));
                const pct = ((app.potencia || 0) / maxPower) * 100;
                const barColors = [colors.green.light, colors.blue.chart, colors.alert.warning, colors.alert.danger, colors.green.dark];
                return (
                  <View key={app.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: idx < topAppliances.length - 1 ? spacing.sm : 0 }}>
                    <Text style={{
                      fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary, fontWeight: '600', width: 20,
                    }}>{idx + 1}</Text>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                        <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.secondary, fontWeight: '500' }}>
                          {app.nome}
                        </Text>
                        <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary, fontWeight: '600' }}>
                          {app.potencia || 0}W
                        </Text>
                      </View>
                      <View style={{ height: 3, backgroundColor: colors.divider, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: barColors[idx % barColors.length], borderRadius: 2 }} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </WhiteCard>
          )}

          {/* ALERTAS — apenas badge + link */}
          {alerts.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Alerts')}
              style={{
                backgroundColor: colors.card,
                borderRadius: isPremium ? 24 : borderRadius.card,
                padding: spacing.md,
                marginBottom: spacing.md,
                ...(isPremium
                  ? { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: colors.border }
                  : shadows.card
                ),
                flexDirection: 'row', alignItems: 'center',
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: colors.alert.warning + '18',
                alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
              }}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={colors.alert.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.primary }}>
                  Alertas {unreadCount > 0 ? `(${unreadCount} não lidos)` : ''}
                </Text>
                <Text style={{ fontFamily: 'Poppins', fontSize: 11, color: colors.text.tertiary, marginTop: 1 }}>
                  Toque para visualizar
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

import { Unsubscribe } from 'firebase/firestore';
import { demoData } from '../data/demoData';
import {
  Appliance,
  Goal,
  Alert,
  EnergyReading,
  MonitoringState,
  Report,
  ReportType,
  EfficiencyScore,
  Insight,
  Forecast,
  PeriodComparison,
  ApplianceStat,
  DemoReading,
} from '../types';
import { UserProfile } from './userService';
import * as userService from './userService';
import * as applianceService from './applianceService';
import * as goalService from './goalService';
import * as alertService from './alertService';
import * as monitoringService from './monitoringService';
import * as readingService from './readingService';
import * as reportService from './reportService';
import * as insightService from './insightService';
import * as forecastService from './forecastService';
import * as comparisonService from './comparisonService';
import * as dashboardService from './dashboardService';
import * as goalRecommendationService from './goalRecommendationService';

const DEMO_TARIFF = 0.95;

function demoFilter<T>(isDemo: boolean, demoFn: () => T, firebaseFn: () => T): T {
  return isDemo ? demoFn() : firebaseFn();
}

function demoSubscribe<T>(
  isDemo: boolean,
  demoData_: T,
  callback: (data: T) => void,
  firebaseSubscribe: () => Unsubscribe
): Unsubscribe {
  if (isDemo) {
    callback(demoData_);
    return () => {};
  }
  return firebaseSubscribe();
}

function demoUnsubscribe(isDemo: boolean, unsub: Unsubscribe | null): void {
  if (!isDemo && unsub) {
    unsub();
  }
}

// ============ DEMO MUTABLE STATE ============

let _demoAppliances: Appliance[] = demoData.appliances.map(a => ({ ...a }));
let _demoMonitoring: { aparelhoAtivoId: string | null; atualizadoEm: string } = {
  aparelhoAtivoId: demoData.monitoringState.aparelhoAtivoId,
  atualizadoEm: demoData.monitoringState.atualizadoEm,
};
let _demoGoals: Goal[] = demoData.goals.map(g => ({ ...g }));

const _demoApplianceCbs = new Set<(data: Appliance[]) => void>();
const _demoMonitoringCbs = new Set<(data: { aparelhoAtivoId: string | null; atualizadoEm: string }) => void>();
const _demoGoalCbs = new Set<(data: Goal[]) => void>();

let _demoAlerts: Alert[] = demoData.alerts.map(a => ({ ...a }));
const _demoAlertCbs = new Set<(data: Alert[]) => void>();

function _notifyApplianceCbs() {
  const data = _demoAppliances.map(a => ({ ...a }));
  _demoApplianceCbs.forEach(cb => cb(data));
}

function _notifyMonitoringCbs() {
  const data = { ..._demoMonitoring };
  _demoMonitoringCbs.forEach(cb => cb(data));
}

function _notifyGoalCbs() {
  const data = _demoGoals.map(g => ({ ...g }));
  _demoGoalCbs.forEach(cb => cb(data));
}

function _notifyAlertCbs() {
  const data = _demoAlerts.map(a => ({ ...a }));
  _demoAlertCbs.forEach(cb => cb(data));
}

function _getPeriodRange(type: ReportType): { start: string; end: string } {
  const now = new Date();
  let start: Date;

  switch (type) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      start = new Date(now.getTime() - 7 * 86400000);
      break;
    case 'monthly':
    case 'appliance':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start: start.toISOString(), end: now.toISOString() };
}

function _daysInPeriod(type: ReportType): number {
  switch (type) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly':
    case 'appliance': return 30;
    default: return 30;
  }
}

async function _generateDemoReport(
  type: ReportType,
  applianceFilter?: string
): Promise<Report> {
  const { start, end } = _getPeriodRange(type);
  const allReadings = demoData.readings as DemoReading[];

  let filtered = allReadings.filter(r => {
    const ts = r.timestamp;
    return ts >= start && ts <= end;
  });

  if (applianceFilter) {
    filtered = filtered.filter(
      r => r.applianceId === applianceFilter || r.applianceName === applianceFilter
    );
  }

  const totalConsumption = filtered.reduce((acc, r) => acc + (r.kwh || 0), 0);
  const totalCost = filtered.reduce((acc, r) => acc + (r.cost || r.kwh * DEMO_TARIFF || 0), 0);

  const applianceMap = new Map<string, { consumption: number; cost: number }>();
  for (const r of filtered) {
    const key = r.applianceName || r.applianceId || 'Desconhecido';
    const existing = applianceMap.get(key) || { consumption: 0, cost: 0 };
    existing.consumption += r.kwh || 0;
    existing.cost += r.cost || r.kwh * DEMO_TARIFF || 0;
    applianceMap.set(key, existing);
  }

  const days = _daysInPeriod(type);
  const dailyAverage = totalConsumption > 0 ? totalConsumption / days : 0;

  const applianceStats: ApplianceStat[] = [];
  let topConsumer: { name: string; consumption: number; percentage: number } | null = null;
  let bottomConsumer: { name: string; consumption: number; percentage: number } | null = null;

  if (applianceMap.size > 0) {
    let maxConsumption = -1;
    let minConsumption = Infinity;
    let maxName = '';
    let minName = '';

    for (const [name, data] of applianceMap) {
      const percentage = totalConsumption > 0 ? (data.consumption / totalConsumption) * 100 : 0;
      applianceStats.push({
        name,
        consumption: Number(data.consumption.toFixed(2)),
        cost: Number(data.cost.toFixed(2)),
        percentage,
      });

      if (data.consumption > maxConsumption) {
        maxConsumption = data.consumption;
        maxName = name;
      }
      if (data.consumption < minConsumption) {
        minConsumption = data.consumption;
        minName = name;
      }
    }

    if (maxName) {
      const pct = totalConsumption > 0 ? (maxConsumption / totalConsumption) * 100 : 0;
      topConsumer = { name: maxName, consumption: maxConsumption, percentage: pct };
    }
    if (minName) {
      const pct = totalConsumption > 0 ? (minConsumption / totalConsumption) * 100 : 0;
      bottomConsumer = { name: minName, consumption: minConsumption, percentage: pct };
    }
  }

  return {
    type,
    period: { start, end },
    totalConsumption: Number(totalConsumption.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    topConsumer,
    bottomConsumer,
    dailyAverage: Number(dailyAverage.toFixed(2)),
    applianceStats,
    generatedAt: new Date().toISOString(),
    userName: 'Usuário Demonstração',
  };
}

// User
export function subscribeUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void,
  isDemo: boolean
): Unsubscribe {
  return demoSubscribe(
    isDemo,
    demoData.user,
    callback,
    () => userService.subscribeUserProfile(userId, callback)
  );
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>,
  isDemo: boolean
): Promise<void> {
  if (!isDemo) {
    await userService.updateUserProfile(userId, data);
  }
}

// Appliances
export function subscribeAppliances(
  userId: string,
  callback: (appliances: Appliance[]) => void,
  isDemo: boolean
): Unsubscribe {
  if (isDemo) {
    callback(_demoAppliances.map(a => ({ ...a })));
    _demoApplianceCbs.add(callback);
    return () => { _demoApplianceCbs.delete(callback); };
  }
  return applianceService.subscribeAppliances(userId, callback);
}

export async function createAppliance(
  userId: string,
  data: { nome: string; descricao: string },
  isDemo: boolean
): Promise<string> {
  if (isDemo) {
    const newId = `demo-app-${Date.now()}`;
    const newApp: Appliance = {
      id: newId,
      nome: data.nome.trim(),
      descricao: data.descricao.trim(),
      dataCadastro: new Date().toISOString(),
      potencia: 0,
      horasPorDia: 0,
      ativo: false,
    };
    _demoAppliances.push(newApp);
    _notifyApplianceCbs();
    return newId;
  }
  return applianceService.createAppliance(userId, data);
}

export async function updateAppliance(
  userId: string,
  aparelhoId: string,
  data: { nome: string; descricao: string },
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    const idx = _demoAppliances.findIndex(a => a.id === aparelhoId);
    if (idx >= 0) {
      _demoAppliances[idx] = {
        ..._demoAppliances[idx],
        nome: data.nome.trim(),
        descricao: data.descricao.trim(),
      };
      _notifyApplianceCbs();
    }
    return;
  }
  await applianceService.updateAppliance(userId, aparelhoId, data);
}

export async function deleteAppliance(
  userId: string,
  aparelhoId: string,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    const idx = _demoAppliances.findIndex(a => a.id === aparelhoId);
    if (idx >= 0) {
      _demoAppliances.splice(idx, 1);
      _notifyApplianceCbs();
    }
    return;
  }
  await applianceService.deleteAppliance(userId, aparelhoId);
}

// Monitoring
export function subscribeMonitoringState(
  userId: string,
  callback: (state: MonitoringState | null) => void,
  isDemo: boolean
): Unsubscribe {
  if (isDemo) {
    callback({ ..._demoMonitoring });
    _demoMonitoringCbs.add(callback);
    return () => { _demoMonitoringCbs.delete(callback); };
  }
  return monitoringService.subscribeMonitoringState(userId, callback);
}

export async function setActiveAppliance(
  userId: string,
  aparelhoId: string,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    _demoMonitoring.aparelhoAtivoId = aparelhoId;
    _demoMonitoring.atualizadoEm = new Date().toISOString();
    _notifyMonitoringCbs();
    return;
  }
  await monitoringService.setActiveAppliance(userId, aparelhoId);
}

export async function clearActiveAppliance(
  userId: string,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    _demoMonitoring.aparelhoAtivoId = null;
    _demoMonitoring.atualizadoEm = new Date().toISOString();
    _notifyMonitoringCbs();
    return;
  }
  await monitoringService.clearActiveAppliance(userId);
}

// Goals
export function subscribeGoals(
  userId: string,
  callback: (goals: Goal[]) => void,
  isDemo: boolean
): Unsubscribe {
  if (isDemo) {
    callback(_demoGoals.map(g => ({ ...g })));
    _demoGoalCbs.add(callback);
    return () => { _demoGoalCbs.delete(callback); };
  }
  return goalService.subscribeGoals(userId, callback);
}

export async function createGoal(
  userId: string,
  data: Omit<Goal, 'id' | 'progresso'>,
  isDemo: boolean
): Promise<string> {
  if (isDemo) {
    const newId = `demo-goal-${Date.now()}`;
    const newGoal: Goal = {
      id: newId,
      titulo: data.titulo,
      valorAlvo: data.valorAlvo,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      aparelhoId: data.aparelhoId || '',
      ativa: data.ativa,
      progresso: 0,
    };
    _demoGoals.unshift(newGoal);
    _notifyGoalCbs();
    return newId;
  }
  return goalService.createGoal(userId, data);
}

export async function updateGoal(
  userId: string,
  metaId: string,
  data: Partial<Omit<Goal, 'id'>>,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    const idx = _demoGoals.findIndex(g => g.id === metaId);
    if (idx >= 0) {
      _demoGoals[idx] = { ..._demoGoals[idx], ...data };
      _notifyGoalCbs();
    }
    return;
  }
  await goalService.updateGoal(userId, metaId, data);
}

export async function deleteGoal(
  userId: string,
  metaId: string,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    const idx = _demoGoals.findIndex(g => g.id === metaId);
    if (idx >= 0) {
      _demoGoals.splice(idx, 1);
      _notifyGoalCbs();
    }
    return;
  }
  await goalService.deleteGoal(userId, metaId);
}

// Alerts
export function subscribeAlerts(
  userId: string,
  callback: (alerts: Alert[]) => void,
  isDemo: boolean
): Unsubscribe {
  if (isDemo) {
    callback(_demoAlerts.map(a => ({ ...a })));
    _demoAlertCbs.add(callback);
    return () => { _demoAlertCbs.delete(callback); };
  }
  return alertService.subscribeAlerts(userId, callback);
}

export async function markAsRead(
  userId: string,
  alertaId: string,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    const idx = _demoAlerts.findIndex(a => a.id === alertaId);
    if (idx >= 0) {
      _demoAlerts[idx] = { ..._demoAlerts[idx], lido: true };
      _notifyAlertCbs();
    }
    return;
  }
  await alertService.markAsRead(userId, alertaId);
}

export async function markAllAlertsAsRead(
  userId: string,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    _demoAlerts = _demoAlerts.map(a => ({ ...a, lido: true }));
    _notifyAlertCbs();
    return;
  }
  await alertService.markAllAlertsAsRead(userId);
}

export async function deleteAlert(
  userId: string,
  alertaId: string,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    const idx = _demoAlerts.findIndex(a => a.id === alertaId);
    if (idx >= 0) {
      _demoAlerts.splice(idx, 1);
      _notifyAlertCbs();
    }
    return;
  }
  await alertService.deleteAlert(userId, alertaId);
}

export async function generateAutomaticAlerts(
  userId: string,
  goals: Goal[],
  appliances: Appliance[],
  userTarifa: number | undefined,
  isDemo: boolean
): Promise<void> {
  if (isDemo) {
    const tarifa = userTarifa || DEMO_TARIFF;
    const allReadings = demoData.readings as DemoReading[];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyReadings = allReadings.filter(r => {
      const ts = new Date(r.timestamp);
      return ts >= startOfMonth && ts <= now;
    });

    const totalKwh = monthlyReadings.reduce((acc, r) => acc + (r.kwh || 0), 0);
    const totalCost = monthlyReadings.reduce((acc, r) => acc + (r.cost || r.kwh * tarifa || 0), 0);

    const applianceMap = new Map<string, { kwh: number; cost: number }>();
    for (const r of monthlyReadings) {
      const key = r.applianceId || r.applianceName;
      if (key) {
        const existing = applianceMap.get(key) || { kwh: 0, cost: 0 };
        existing.kwh += r.kwh || 0;
        existing.cost += r.cost || r.kwh * tarifa || 0;
        applianceMap.set(key, existing);
      }
    }

    const newAlerts: Alert[] = [];

    for (const goal of goals) {
      if (!goal.ativa) continue;

      if (goal.progresso >= goal.valorAlvo && goal.valorAlvo > 0) {
        newAlerts.push({
          id: `demo-alert-${Date.now()}-${Math.random()}`,
          tipo: 'meta_atingida',
          titulo: 'Meta Atingida!',
          mensagem: `Parabéns! Você atingiu a meta "${goal.titulo}" com ${goal.progresso.toFixed(0)}% de progresso.`,
          nivel: 'info',
          lido: false,
          createdAt: new Date().toISOString(),
        });
      } else if (goal.progresso >= goal.valorAlvo * 0.9 && goal.valorAlvo > 0) {
        newAlerts.push({
          id: `demo-alert-${Date.now()}-${Math.random()}`,
          tipo: 'meta_proxima',
          titulo: 'Meta quase atingida',
          mensagem: `A meta "${goal.titulo}" está em ${goal.progresso.toFixed(0)}% de progresso. Continue assim!`,
          nivel: 'warning',
          lido: false,
          createdAt: new Date().toISOString(),
        });
      }

      if (totalCost > 0 && totalCost > goal.valorAlvo) {
        newAlerts.push({
          id: `demo-alert-${Date.now()}-${Math.random()}`,
          tipo: 'consumo_acima_meta',
          titulo: 'Consumo acima da meta',
          mensagem: `Seu consumo atual de R$ ${totalCost.toFixed(2)} ultrapassou a meta de R$ ${goal.valorAlvo.toFixed(2)} estabelecida.`,
          nivel: 'danger',
          lido: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (totalCost > 300) {
      newAlerts.push({
        id: `demo-alert-${Date.now()}-${Math.random()}`,
        tipo: 'consumo_alto',
        titulo: 'Consumo mensal elevado',
        mensagem: `Seu consumo mensal estimado é de R$ ${totalCost.toFixed(2)}, acima do limite de R$ 300,00.`,
        nivel: 'danger',
        lido: false,
        createdAt: new Date().toISOString(),
      });
    }

    let maxKwh = 0;
    let maxName = '';
    for (const [name, data] of applianceMap) {
      if (data.kwh > maxKwh) {
        maxKwh = data.kwh;
        maxName = name;
      }
    }
    if (maxName && totalKwh > 0) {
      const percentage = (maxKwh / totalKwh) * 100;
      if (percentage > 50) {
        const displayName = maxName;
        newAlerts.push({
          id: `demo-alert-${Date.now()}-${Math.random()}`,
          tipo: 'aparelho_dominante',
          titulo: 'Aparelho de alto consumo',
          mensagem: `"${displayName}" é responsável por ${percentage.toFixed(0)}% do seu consumo total.`,
          nivel: 'warning',
          lido: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    _demoAlerts = [...newAlerts, ..._demoAlerts];
    _notifyAlertCbs();
    return;
  }
  await alertService.generateAutomaticAlerts(userId, goals, appliances, userTarifa);
}

// Readings
export function subscribeReadings(
  userId: string,
  callback: (readings: EnergyReading[]) => void,
  isDemo: boolean
): Unsubscribe {
  return demoSubscribe(
    isDemo,
    demoData.readings,
    callback,
    () => readingService.subscribeReadings(userId, callback)
  );
}

export async function getDailyReadings(
  userId: string,
  isDemo: boolean
): Promise<EnergyReading[]> {
  if (isDemo) return demoData.readings.filter(r => {
    const d = new Date(r.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  return readingService.getDailyReadings(userId);
}

export async function getWeeklyReadings(
  userId: string,
  isDemo: boolean
): Promise<EnergyReading[]> {
  if (isDemo) return demoData.readings.filter(r => {
    const d = new Date(r.timestamp);
    const weekAgo = Date.now() - 7 * 86400000;
    return d.getTime() > weekAgo;
  });
  return readingService.getWeeklyReadings(userId);
}

export async function getMonthlyReadings(
  userId: string,
  isDemo: boolean
): Promise<EnergyReading[]> {
  if (isDemo) return demoData.readings.filter(r => {
    const d = new Date(r.timestamp);
    const monthAgo = Date.now() - 30 * 86400000;
    return d.getTime() > monthAgo;
  });
  return readingService.getMonthlyReadings(userId);
}

// Reports
export async function generateReport(
  userId: string,
  type: 'daily' | 'weekly' | 'monthly' | 'appliance' | 'consolidated',
  applianceFilter?: string,
  isDemo: boolean = false
): Promise<Report> {
  if (isDemo) return _generateDemoReport(type, applianceFilter);
  return reportService.generateReport(userId, type, applianceFilter);
}

// Insights
export async function generateInsights(
  userId: string,
  goals: Goal[],
  isDemo: boolean
): Promise<{
  topConsumers: { name: string; consumption: number; percentage: number }[];
  efficiencyScore: EfficiencyScore;
  recommendations: Insight[];
}> {
  if (isDemo) {
    return {
      topConsumers: demoData.ranking,
      efficiencyScore: demoData.efficiencyScore,
      recommendations: demoData.insights,
    };
  }
  return insightService.generateInsights(userId, goals);
}

// Forecast
export async function generateForecast(
  userId: string,
  tariff: number | undefined,
  goals: Goal[],
  isDemo: boolean
): Promise<Forecast> {
  if (isDemo) {
    return forecastService.generateDemoForecast(tariff, goals);
  }
  return forecastService.generateForecast(userId, tariff, goals);
}

// Comparison
export async function compareBoth(
  userId: string,
  tariff: number | undefined,
  isDemo: boolean
): Promise<{ month: PeriodComparison; week: PeriodComparison }> {
  if (isDemo) {
    return comparisonService.generateDemoComparison(tariff);
  }
  return comparisonService.compareBoth(userId, tariff);
}

// Dashboard
export async function getDashboardData(
  userId: string,
  isDemo: boolean,
  readings?: EnergyReading[],
  goals?: Goal[],
  alerts?: Alert[],
): Promise<dashboardService.DashboardData> {
  if (isDemo) {
    return dashboardService.generateDemoDashboardData();
  }

  try {
    const tariff = await getUserTariff(userId);
    const [insightsData, forecast, comparison] = await Promise.all([
      insightService.generateInsights(userId, goals || [], tariff),
      forecastService.generateForecast(userId, tariff, goals),
      comparisonService.compareBoth(userId, tariff),
    ]);

    const monthChange = comparison.month.variation.consumptionPercent;

    return dashboardService.generateDashboardData({
      readings: readings || [],
      goals: goals || [],
      alerts: alerts || [],
      efficiencyScore: insightsData.efficiencyScore,
      topConsumers: insightsData.topConsumers,
      forecast: {
        projectedConsumption: forecast.projectedConsumption,
        projectedCost: forecast.projectedCost,
      },
      comparison: { monthConsumptionChange: monthChange },
      tariff,
    });
  } catch {
    const tariff = await getUserTariff(userId).catch(() => 0.95);
    return dashboardService.generateDashboardData({
      readings: readings || [],
      goals: goals || [],
      alerts: alerts || [],
      efficiencyScore: null,
      topConsumers: [],
      forecast: null,
      comparison: null,
      tariff,
    });
  }
}

// Goal Recommendation
export async function getGoalRecommendation(
  userId: string,
  isDemo: boolean
): Promise<goalRecommendationService.GoalRecommendation> {
  if (isDemo) {
    return goalRecommendationService.generateDemoGoalRecommendation();
  }

  try {
    const readings = await getAllReadings(userId);
    const goals = await getAllGoals(userId);
    const tariff = await getUserTariff(userId);

    return goalRecommendationService.generateGoalRecommendation({
      readings,
      goals,
      tariff,
    });
  } catch {
    return goalRecommendationService.generateGoalRecommendation({
      readings: [],
      goals: [],
      tariff: 0.95,
    });
  }
}

// Internal helpers for Firebase data fetching
async function getAllReadings(userId: string): Promise<EnergyReading[]> {
  try {
    return await readingService.getMonthlyReadings(userId);
  } catch {
    return [];
  }
}

async function getAllGoals(userId: string): Promise<Goal[]> {
  return new Promise(resolve => {
    const unsub = goalService.subscribeGoals(userId, list => {
      unsub();
      resolve(list);
    });
  });
}

async function getUserTariff(userId: string): Promise<number> {
  try {
    const profile = await userService.getUserProfile(userId);
    return profile?.tarifaKwh ?? 0.95;
  } catch {
    return 0.95;
  }
}

export const demoUnsubHandler = demoUnsubscribe;

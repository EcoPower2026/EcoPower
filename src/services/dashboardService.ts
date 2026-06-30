import {
  EnergyReading,
  Goal,
  Alert,
  EfficiencyScore,
  Insight,
  DemoReading,
} from '../types';
import { demoData } from '../data/demoData';

export type TopConsumer = {
  name: string;
  consumption: number;
  percentage: number;
};

export type DashboardData = {
  currentConsumption: number;
  currentCost: number;
  goal: { value: number; unit: 'kwh' | 'cost'; label: string } | null;
  efficiency: { score: number; classificacao: string } | null;
  financialForecast: {
    projectedConsumption: number;
    projectedCost: number;
    goalValue: number | null;
    isWithinGoal: boolean;
    percentAboveGoal: number;
  } | null;
  insightOfTheDay: {
    message: string;
    icon: string;
  };
  proactiveAlert: {
    message: string;
    type: 'warning' | 'danger';
  } | null;
  chartData: {
    labels: string[];
    values: number[];
  };
  recentAlerts: {
    id: string;
    titulo: string;
    mensagem: string;
    nivel: string;
    lido: boolean;
  }[];
};

function getMonthReadings(readings: EnergyReading[]): EnergyReading[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return readings.filter(r => new Date(r.timestamp) >= monthStart);
}

function getWeekReadings(readings: EnergyReading[]): EnergyReading[] {
  const weekAgo = Date.now() - 7 * 86400000;
  return readings.filter(r => new Date(r.timestamp).getTime() > weekAgo);
}

function getTopConsumers(readings: EnergyReading[]): TopConsumer[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const r of readings) {
    const key = r.applianceName || r.applianceId || 'Desconhecido';
    map.set(key, (map.get(key) || 0) + (r.kwh || 0));
    total += r.kwh || 0;
  }
  return Array.from(map.entries())
    .map(([name, consumption]) => ({
      name,
      consumption,
      percentage: total > 0 ? (consumption / total) * 100 : 0,
    }))
    .sort((a, b) => b.consumption - a.consumption);
}

function generateInsightOfTheDay(
  monthReadings: EnergyReading[],
  topConsumers: TopConsumer[],
  efficiencyScore: { score: number; classificacao: string } | null,
  goals: Goal[],
  comparison?: { monthConsumptionChange: number } | null,
  tariff: number = 0.95
): { message: string; icon: string } {
  const insights: { message: string; icon: string }[] = [];

  if (topConsumers.length > 0) {
    const top = topConsumers[0];
    if (top.percentage > 40) {
      insights.push({
        message: `Seu ${top.name} representa ${top.percentage.toFixed(0)}% do consumo total.`,
        icon: 'lightbulb-on',
      });
      insights.push({
        message: `Reduzir 1 hora diária de ${top.name} pode economizar até R$ ${(top.consumption / 30 * tariff * 0.5).toFixed(2)} por mês.`,
        icon: 'lightbulb-on',
      });
    }
  }

  if (topConsumers.length >= 2) {
    const top1 = topConsumers[0];
    const top2 = topConsumers[1];
    if (top1.percentage > top2.percentage * 2) {
      insights.push({
        message: `${top1.name} consome ${(top1.percentage / top2.percentage).toFixed(0)}x mais que ${top2.name}.`,
        icon: 'chart-bar',
      });
    }
  }

  if (efficiencyScore) {
    if (efficiencyScore.score >= 80) {
      insights.push({
        message: `Sua eficiência energética é ${efficiencyScore.classificacao}! Continue assim.`,
        icon: 'star',
      });
    } else if (efficiencyScore.score < 50) {
      insights.push({
        message: `Sua eficiência está ${efficiencyScore.classificacao}. Reveja seus hábitos de consumo.`,
        icon: 'alert',
      });
    }
  }

  if (comparison && comparison.monthConsumptionChange < 0) {
    insights.push({
      message: `Você está consumindo ${Math.abs(comparison.monthConsumptionChange).toFixed(0)}% menos que no mês anterior.`,
      icon: 'trending-down',
    });
  }

  if (goals.length > 0) {
    const activeGoal = goals.find(g => g.ativa);
    if (activeGoal && activeGoal.progresso >= 75) {
      insights.push({
        message: `Sua meta "${activeGoal.titulo}" está sendo cumprida com folga (${activeGoal.progresso.toFixed(0)}% concluída).`,
        icon: 'flag-checkered',
      });
    }
  }

  const monthKwh = monthReadings.reduce((s, r) => s + (r.kwh || 0), 0);
  if (monthKwh > 0) {
    const avgKwhPerAppliance = monthKwh / Math.max(topConsumers.length, 1);
    const expensive = topConsumers.find(t => t.consumption > avgKwhPerAppliance * 1.5);
    if (expensive) {
      insights.push({
        message: `${expensive.name} custa aproximadamente R$ ${(expensive.consumption * tariff).toFixed(2)} este mês — bem acima da média dos demais aparelhos.`,
        icon: 'currency-usd',
      });
    }
  }

  return insights.length > 0
    ? insights[Math.floor(Math.random() * insights.length)]
    : { message: 'Monitore seus aparelhos para receber insights personalizados.', icon: 'lightbulb-outline' };
}

function generateProactiveAlert(
  forecast: { projectedConsumption: number; projectedCost: number } | null,
  goal: { value: number; unit: string } | null,
  topConsumers: TopConsumer[]
): { message: string; type: 'warning' | 'danger' } | null {
  const alerts: { message: string; type: 'warning' | 'danger' }[] = [];

  if (forecast && goal && goal.unit === 'cost') {
    if (forecast.projectedCost > goal.value) {
      const pctAbove = ((forecast.projectedCost - goal.value) / goal.value) * 100;
      if (pctAbove > 20) {
        alerts.push({
          message: `Mantendo esse ritmo, seu gasto estimado de R$ ${forecast.projectedCost.toFixed(2)} ultrapassará a meta em ${pctAbove.toFixed(0)}%.`,
          type: 'danger',
        });
      } else {
        alerts.push({
          message: `Seu gasto estimado de R$ ${forecast.projectedCost.toFixed(2)} está próximo da meta de R$ ${goal.value.toFixed(2)}. Fique atento!`,
          type: 'warning',
        });
      }
    }
  }

  if (forecast && forecast.projectedCost > 250) {
    alerts.push({
      message: `Seu gasto estimado ultrapassará R$ ${forecast.projectedCost.toFixed(0)} este mês.`,
      type: 'warning',
    });
  }

  const dominant = topConsumers.find(t => t.percentage > 50);
  if (dominant) {
    alerts.push({
      message: `${dominant.name} representa mais de 50% do consumo total. Considere reduzir o uso.`,
      type: 'warning',
    });
  }

  return alerts.length > 0 ? alerts[0] : null;
}

function buildChartData(readings: EnergyReading[]): { labels: string[]; values: number[] } {
  const days: { [key: string]: number } = {};
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' });
    days[key] = 0;
  }

  const weekAgo = Date.now() - 7 * 86400000;
  for (const r of readings) {
    const d = new Date(r.timestamp);
    if (d.getTime() < weekAgo) continue;
    const key = d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' });
    if (days[key] !== undefined) {
      days[key] += r.kwh || 0;
    }
  }

  const labels = Object.keys(days);
  const values = Object.values(days).map(v => Number(v.toFixed(2)));
  return { labels, values };
}

function getDaysInMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getDaysElapsed(): number {
  const now = new Date();
  return now.getDate();
}

export async function generateDashboardData(params: {
  readings: EnergyReading[];
  goals: Goal[];
  alerts: Alert[];
  efficiencyScore: EfficiencyScore | null;
  topConsumers: TopConsumer[];
  forecast: { projectedConsumption: number; projectedCost: number } | null;
  comparison: { monthConsumptionChange: number } | null;
  tariff: number;
}): Promise<DashboardData> {
  const { readings, goals, alerts, efficiencyScore, topConsumers, forecast, comparison, tariff } = params;

  const monthReadings = getMonthReadings(readings);
  const currentConsumption = monthReadings.reduce((s, r) => s + (r.kwh || 0), 0);
  const currentCost = monthReadings.reduce((s, r) => s + (r.cost || r.kwh * tariff || 0), 0);

  const activeGoal = goals.find(g => g.ativa);
  let goal: DashboardData['goal'] = null;
  if (activeGoal) {
    goal = {
      value: activeGoal.valorAlvo,
      unit: 'cost',
      label: activeGoal.titulo,
    };
  }

  let efficiency: DashboardData['efficiency'] = null;
  if (efficiencyScore) {
    efficiency = {
      score: efficiencyScore.score,
      classificacao: efficiencyScore.classificacao,
    };
  }

  let financialForecast: DashboardData['financialForecast'] = null;
  if (forecast) {
    const goalValue = goal?.value || null;
    let isWithinGoal = true;
    let percentAboveGoal = 0;
    if (goalValue && goalValue > 0) {
      percentAboveGoal = ((forecast.projectedCost - goalValue) / goalValue) * 100;
      isWithinGoal = forecast.projectedCost <= goalValue;
    }
    financialForecast = {
      projectedConsumption: forecast.projectedConsumption,
      projectedCost: forecast.projectedCost,
      goalValue,
      isWithinGoal,
      percentAboveGoal,
    };
  }

  const insightOfTheDay = generateInsightOfTheDay(monthReadings, topConsumers, efficiencyScore, goals, comparison, tariff);
  const proactiveAlert = generateProactiveAlert(forecast, goal, topConsumers);
  const chartData = buildChartData(readings);
  const recentAlerts = alerts.slice(0, 3).map(a => ({
    id: a.id,
    titulo: a.titulo,
    mensagem: a.mensagem,
    nivel: a.nivel,
    lido: a.lido,
  }));

  return {
    currentConsumption: Number(currentConsumption.toFixed(1)),
    currentCost: Number(currentCost.toFixed(2)),
    goal,
    efficiency,
    financialForecast,
    insightOfTheDay,
    proactiveAlert,
    chartData,
    recentAlerts,
  };
}

export function generateDemoDashboardData(): DashboardData {
  const readings = demoData.readings as unknown as EnergyReading[];
  const goals = demoData.goals;
  const alerts = demoData.alerts;

  const tariff = 0.95;
  const monthReadings = getMonthReadings(readings);
  const currentConsumption = monthReadings.reduce((s, r) => s + (r.kwh || 0), 0);
  const currentCost = monthReadings.reduce((s, r) => s + (r.cost || r.kwh * tariff || 0), 0);

  const activeGoal = goals.find((g: Goal) => g.ativa);
  let goal: DashboardData['goal'] = null;
  if (activeGoal) {
    goal = { value: activeGoal.valorAlvo, unit: 'cost', label: activeGoal.titulo };
  }

  const efficiency = { score: demoData.efficiencyScore.score, classificacao: demoData.efficiencyScore.classificacao };

  const topConsumers = getTopConsumers(readings);
  const demoKwh = currentConsumption;
  const daysElapsed = getDaysElapsed();
  const daysInMonth = getDaysInMonth();
  const dailyAvg = demoKwh / Math.max(daysElapsed, 1);
  const projectedKwh = dailyAvg * daysInMonth;
  const projectedCost = (currentCost / Math.max(daysElapsed, 1)) * daysInMonth;

  const forecast = { projectedConsumption: projectedKwh, projectedCost };

  const goalValue = goal?.value || null;
  let isWithinGoal = true;
  let percentAboveGoal = 0;
  if (goalValue && goalValue > 0) {
    percentAboveGoal = ((projectedCost - goalValue) / goalValue) * 100;
    isWithinGoal = projectedCost <= goalValue;
  }

  const financialForecast = {
    projectedConsumption: Number(projectedKwh.toFixed(1)),
    projectedCost: Number(projectedCost.toFixed(2)),
    goalValue,
    isWithinGoal,
    percentAboveGoal,
  };

  const insightOfTheDay = generateInsightOfTheDay(monthReadings, topConsumers, efficiency, goals, null, tariff);
  const proactiveAlert = generateProactiveAlert(forecast, goal, topConsumers);
  const chartData = buildChartData(readings);
  const recentAlerts = alerts.slice(0, 3).map((a: Alert) => ({
    id: a.id,
    titulo: a.titulo,
    mensagem: a.mensagem,
    nivel: a.nivel,
    lido: a.lido,
  }));

  return {
    currentConsumption: Number(currentConsumption.toFixed(1)),
    currentCost: Number(currentCost.toFixed(2)),
    goal,
    efficiency,
    financialForecast,
    insightOfTheDay,
    proactiveAlert,
    chartData,
    recentAlerts,
  };
}

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { EnergyReading, Goal, Forecast, GoalComparison, DemoReading } from '../types';
import { demoData } from '../data/demoData';

function getMonthRange(): { start: string; end: string; daysElapsed: number; daysInMonth: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = Math.min(now.getDate(), daysInMonth);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    daysElapsed,
    daysInMonth,
  };
}

function getMonthName(): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[new Date().getMonth()];
}

async function getMonthReadings(userId: string): Promise<EnergyReading[]> {
  const { start, end } = getMonthRange();
  const readingsRef = collection(db, 'usuarios', userId, 'leituras');
  const q = query(
    readingsRef,
    where('timestamp', '>=', start),
    where('timestamp', '<=', end),
    orderBy('timestamp', 'desc')
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as EnergyReading[];
  } catch {
    return [];
  }
}

async function getLegacyMonthReadings(userId: string): Promise<EnergyReading[]> {
  const { start, end } = getMonthRange();
  const readingsRef = collection(db, 'users', userId, 'readings');
  const q = query(
    readingsRef,
    where('timestamp', '>=', start),
    where('timestamp', '<=', end),
    orderBy('timestamp', 'desc')
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as EnergyReading[];
  } catch {
    return [];
  }
}

function calculateForecast(
  readings: EnergyReading[],
  tariff: number,
  goals: Goal[]
): Forecast {
  const { daysElapsed, daysInMonth } = getMonthRange();

  const totalKwh = readings.reduce((sum, r) => sum + (r.kwh || 0), 0);
  const totalCost = readings.reduce((sum, r) => sum + (r.cost || r.kwh * tariff || 0), 0);

  const daysUsed = Math.max(daysElapsed, 1);
  const dailyAverage = totalKwh / daysUsed;
  const projectedConsumption = dailyAverage * daysInMonth;
  const projectedCost = (totalCost / daysUsed) * daysInMonth;

  let goalComparison: GoalComparison | null = null;
  const activeGoal = goals.find(g => g.ativa);
  if (activeGoal && activeGoal.valorAlvo > 0) {
    const costTarget = activeGoal.valorAlvo;
    const diff = projectedCost - costTarget;
    const percentageAbove = costTarget > 0 ? (diff / costTarget) * 100 : 0;
    goalComparison = {
      goalTitle: activeGoal.titulo,
      goalTarget: costTarget,
      difference: diff,
      percentageAbove,
      isAbove: diff > 0,
    };
  }

  const recommendations: string[] = [];

  if (projectedConsumption > 0) {
    recommendations.push(
      `Se mantiver o ritmo atual, consumirá ${projectedConsumption.toFixed(0)} kWh neste mês.`
    );
  }

  if (goalComparison && goalComparison.isAbove) {
    recommendations.push(
      `Você está ${goalComparison.percentageAbove.toFixed(0)}% acima da meta mensal "${goalComparison.goalTitle}".`
    );
  } else if (goalComparison && !goalComparison.isAbove) {
    recommendations.push(
      `Você está ${Math.abs(goalComparison.percentageAbove).toFixed(0)}% abaixo da meta mensal. Continue assim!`
    );
  }

  if (dailyAverage > 10) {
    recommendations.push(
      `Seu consumo diário médio é de ${dailyAverage.toFixed(1)} kWh. Pequenas reduções podem gerar grande economia no fim do mês.`
    );
  } else if (dailyAverage > 5) {
    recommendations.push(
      `Seu consumo diário médio é de ${dailyAverage.toFixed(1)} kWh. Continue monitorando para evitar picos.`
    );
  }

  if (projectedCost > 300) {
    recommendations.push(
      `A projeção de custo é de R$ ${projectedCost.toFixed(2)}, acima dos R$ 300,00. Reveja seus hábitos de consumo.`
    );
  }

  if (projectedCost < 150) {
    recommendations.push(
      `Ótimo! Seu consumo projetado é de apenas R$ ${projectedCost.toFixed(2)}. Você está no caminho certo!`
    );
  }

  return {
    currentConsumption: totalKwh,
    currentCost: totalCost,
    projectedConsumption,
    projectedCost,
    daysElapsed: daysUsed,
    daysInMonth,
    dailyAverage,
    goalComparison,
    recommendations,
    month: getMonthName(),
  };
}

export async function generateForecast(
  userId: string,
  tariff?: number,
  goals?: Goal[]
): Promise<Forecast> {
  const readings = await getMonthReadings(userId);
  const legacyReadings = await getLegacyMonthReadings(userId);
  const allReadings = [...readings, ...legacyReadings];

  const effectiveTariff = tariff ?? 0.95;
  const effectiveGoals = goals ?? [];

  return calculateForecast(allReadings, effectiveTariff, effectiveGoals);
}

export async function generateForecastFromReadings(
  readings: EnergyReading[],
  tariff: number,
  goals: Goal[]
): Promise<Forecast> {
  return calculateForecast(readings, tariff, goals);
}

export function generateDemoForecast(tariff?: number, goals?: Goal[]): Forecast {
  const { daysElapsed, daysInMonth } = getMonthRange();

  const demoReadings = demoData.readings as DemoReading[];
  const demoKwh = demoReadings.reduce((sum, r) => sum + (r.kwh || 0), 0);
  const demoTariff = tariff ?? 0.95;
  const demoCost = demoReadings.reduce((sum, r) => sum + (r.cost || r.kwh * demoTariff || 0), 0);
  const demoDailyAvg = demoKwh / Math.max(daysElapsed, 1);
  const projectedKwh = demoDailyAvg * daysInMonth;
  const projectedCost = (demoCost / Math.max(daysElapsed, 1)) * daysInMonth;

  let goalComparison: GoalComparison | null = null;
  const activeGoal = goals?.find(g => g.ativa);
  if (activeGoal && activeGoal.valorAlvo > 0) {
    const diff = projectedCost - activeGoal.valorAlvo;
    const percentageAbove = activeGoal.valorAlvo > 0 ? (diff / activeGoal.valorAlvo) * 100 : 0;
    goalComparison = {
      goalTitle: activeGoal.titulo,
      goalTarget: activeGoal.valorAlvo,
      difference: diff,
      percentageAbove,
      isAbove: diff > 0,
    };
  }

  const recommendations: string[] = [];
  recommendations.push(
    `Se mantiver o ritmo atual, consumirá ${projectedKwh.toFixed(0)} kWh neste mês.`
  );
  if (goalComparison && goalComparison.isAbove) {
    recommendations.push(
      `Você está ${goalComparison.percentageAbove.toFixed(0)}% acima da meta mensal "${goalComparison.goalTitle}".`
    );
  } else if (goalComparison) {
    recommendations.push(
      `Você está ${Math.abs(goalComparison.percentageAbove).toFixed(0)}% abaixo da meta mensal.`
    );
  }
  const acKwh = demoReadings
    .filter(r => r.applianceName === 'Ar Condicionado')
    .reduce((sum, r) => sum + (r.kwh || 0), 0);
  const acCostPerHour = acKwh > 0 ? (acKwh / 30 / 6) * demoTariff : 1.5 * demoTariff;
  recommendations.push(
    `Reduzindo 1 hora de uso do ar condicionado por dia, você pode economizar até R$ ${(acCostPerHour * 30).toFixed(2)} no mês.`
  );

  return {
    currentConsumption: Number(demoKwh.toFixed(1)),
    currentCost: Number(demoCost.toFixed(2)),
    projectedConsumption: Number(projectedKwh.toFixed(1)),
    projectedCost: Number(projectedCost.toFixed(2)),
    daysElapsed,
    daysInMonth,
    dailyAverage: Number(demoDailyAvg.toFixed(2)),
    goalComparison,
    recommendations,
    month: getMonthName(),
  };
}

import { EnergyReading, Goal, DemoReading } from '../types';
import { demoData } from '../data/demoData';

export type GoalRecommendation = {
  averageConsumption: number;
  averageCost: number;
  suggestedGoalKwh: number;
  suggestedGoalCost: number;
  potentialEconomyKwh: number;
  potentialEconomyCost: number;
  reductionPercent: number;
  message: string;
  hasActiveGoal: boolean;
  activeGoalAdequate: boolean | null;
};

function getLast3MonthsReadings(readings: EnergyReading[]): EnergyReading[] {
  const threeMonthsAgo = Date.now() - 90 * 86400000;
  return readings.filter(r => new Date(r.timestamp).getTime() > threeMonthsAgo);
}

function calculateAverageConsumption(readings: EnergyReading[]): number {
  if (readings.length === 0) return 0;
  return readings.reduce((s, r) => s + (r.kwh || 0), 0);
}

export async function generateGoalRecommendation(params: {
  readings: EnergyReading[];
  goals: Goal[];
  tariff: number;
}): Promise<GoalRecommendation> {
  const { readings, goals, tariff } = params;

  const recentReadings = getLast3MonthsReadings(readings);
  const totalKwh = calculateAverageConsumption(recentReadings);
  const totalCost = recentReadings.reduce((s, r) => s + (r.cost || r.kwh * tariff || 0), 0);

  const averageConsumption = totalKwh;
  const averageCost = totalCost;

  const suggestedGoalKwh = Number((averageConsumption * 0.9).toFixed(1));
  const suggestedGoalCost = Number((suggestedGoalKwh * tariff).toFixed(2));

  const potentialEconomyKwh = Number((averageConsumption - suggestedGoalKwh).toFixed(1));
  const potentialEconomyCost = Number((averageCost - suggestedGoalCost).toFixed(2));
  const reductionPercent = averageConsumption > 0
    ? Number((((averageConsumption - suggestedGoalKwh) / averageConsumption) * 100).toFixed(1))
    : 0;

  const activeGoal = goals.find(g => g.ativa);
  let hasActiveGoal = !!activeGoal;
  let activeGoalAdequate: boolean | null = null;
  let message = '';

  if (hasActiveGoal && activeGoal) {
    const goalCost = activeGoal.valorAlvo;
    const diff = Math.abs(goalCost - suggestedGoalCost);
    const pctDiff = suggestedGoalCost > 0 ? (diff / suggestedGoalCost) * 100 : 0;

    if (pctDiff <= 10) {
      activeGoalAdequate = true;
      message = `Sua meta atual está adequada. Recomendamos manter a meta de R$ ${suggestedGoalCost.toFixed(2)}.`;
    } else if (goalCost < suggestedGoalCost * 0.7) {
      activeGoalAdequate = false;
      message = `Sua meta atual é muito agressiva. Com base no seu histórico, sugerimos uma meta de R$ ${suggestedGoalCost.toFixed(2)}.`;
    } else if (goalCost > suggestedGoalCost * 1.3) {
      activeGoalAdequate = true;
      message = `Sua meta atual é conservadora. Você pode economizar até R$ ${potentialEconomyCost.toFixed(2)}/mês com uma meta de R$ ${suggestedGoalCost.toFixed(2)}.`;
    } else {
      activeGoalAdequate = true;
      message = `Sua meta atual está próxima da recomendada. Bom trabalho!`;
    }
  } else {
    message = `Com base no seu histórico, recomendamos uma meta de ${suggestedGoalKwh.toFixed(0)} kWh (R$ ${suggestedGoalCost.toFixed(2)}) para o próximo mês.`;
  }

  return {
    averageConsumption: Number(averageConsumption.toFixed(1)),
    averageCost: Number(averageCost.toFixed(2)),
    suggestedGoalKwh: Number(suggestedGoalKwh.toFixed(1)),
    suggestedGoalCost: Number(suggestedGoalCost.toFixed(2)),
    potentialEconomyKwh,
    potentialEconomyCost,
    reductionPercent,
    message,
    hasActiveGoal,
    activeGoalAdequate,
  };
}

export function generateDemoGoalRecommendation(): GoalRecommendation {
  const readings = demoData.readings as unknown as EnergyReading[];
  const goals = demoData.goals;
  const tariff = demoData.user?.tarifaKwh ?? 0.95;

  const recentReadings = getLast3MonthsReadings(readings);
  const totalKwh = calculateAverageConsumption(recentReadings);
  const totalCost = recentReadings.reduce((s, r) => s + (r.cost || r.kwh * tariff || 0), 0);

  const averageConsumption = totalKwh;
  const averageCost = totalCost;

  const suggestedGoalKwh = Number((averageConsumption * 0.9).toFixed(1));
  const suggestedGoalCost = Number((suggestedGoalKwh * tariff).toFixed(2));
  const potentialEconomyKwh = Number((averageConsumption - suggestedGoalKwh).toFixed(1));
  const potentialEconomyCost = Number((averageCost - suggestedGoalCost).toFixed(2));
  const reductionPercent = averageConsumption > 0
    ? Number((((averageConsumption - suggestedGoalKwh) / averageConsumption) * 100).toFixed(1))
    : 0;

  const activeGoal = goals.find(g => g.ativa);
  const hasActiveGoal = !!activeGoal;
  let activeGoalAdequate: boolean | null = null;
  let message = '';

  if (hasActiveGoal && activeGoal) {
    const goalCost = activeGoal.valorAlvo;
    const diff = Math.abs(goalCost - suggestedGoalCost);
    const pctDiff = suggestedGoalCost > 0 ? (diff / suggestedGoalCost) * 100 : 0;

    if (pctDiff <= 10) {
      activeGoalAdequate = true;
      message = `Sua meta atual está adequada. Recomendamos manter a meta de R$ ${suggestedGoalCost.toFixed(2)}.`;
    } else if (goalCost < suggestedGoalCost * 0.7) {
      activeGoalAdequate = false;
      message = `Sua meta atual é muito agressiva. Com base no seu histórico, sugerimos uma meta de R$ ${suggestedGoalCost.toFixed(2)}.`;
    } else if (goalCost > suggestedGoalCost * 1.3) {
      activeGoalAdequate = true;
      message = `Sua meta atual é conservadora. Você pode economizar até R$ ${potentialEconomyCost.toFixed(2)}/mês com uma meta de R$ ${suggestedGoalCost.toFixed(2)}.`;
    } else {
      activeGoalAdequate = true;
      message = `Sua meta atual está próxima da recomendada. Bom trabalho!`;
    }
  } else {
    message = `Com base no seu histórico, recomendamos uma meta de ${suggestedGoalKwh.toFixed(0)} kWh (R$ ${suggestedGoalCost.toFixed(2)}) para o próximo mês.`;
  }

  return {
    averageConsumption: Number(averageConsumption.toFixed(1)),
    averageCost: Number(averageCost.toFixed(2)),
    suggestedGoalKwh: Number(suggestedGoalKwh.toFixed(1)),
    suggestedGoalCost: Number(suggestedGoalCost.toFixed(2)),
    potentialEconomyKwh,
    potentialEconomyCost,
    reductionPercent,
    message,
    hasActiveGoal,
    activeGoalAdequate,
  };
}

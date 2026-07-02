import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { EnergyReading, PeriodComparison, PeriodData, PeriodVariation, DemoReading } from '../types';
import { demoData } from '../data/demoData';

function getWeekRanges(): {
  current: { start: string; end: string; label: string };
  previous: { start: string; end: string; label: string };
} {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() + diffToMonday);
  currentWeekStart.setHours(0, 0, 0, 0);

  const currentWeekEnd = new Date(now);
  currentWeekEnd.setHours(23, 59, 59, 999);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
  previousWeekEnd.setHours(23, 59, 59, 999);

  return {
    current: {
      start: currentWeekStart.toISOString(),
      end: currentWeekEnd.toISOString(),
      label: 'Esta Semana',
    },
    previous: {
      start: previousWeekStart.toISOString(),
      end: previousWeekEnd.toISOString(),
      label: 'Semana Passada',
    },
  };
}

function getMonthRanges(): {
  current: { start: string; end: string; label: string };
  previous: { start: string; end: string; label: string };
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const currentStart = new Date(year, month, 1);
  const currentEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const previousStart = new Date(year, month - 1, 1);
  const previousEnd = new Date(year, month, 0, 23, 59, 59);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  return {
    current: {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
      label: monthNames[month],
    },
    previous: {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
      label: monthNames[month - 1] || monthNames[11],
    },
  };
}

async function getReadingsInRange(
  userId: string,
  start: string,
  end: string
): Promise<EnergyReading[]> {
  const results: EnergyReading[] = [];

  const usuariosRef = collection(db, 'usuarios', userId, 'leituras');
  try {
    const q = query(
      usuariosRef,
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    results.push(...snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as EnergyReading[]);
  } catch {
    // collection may not exist yet
  }

  const usersRef = collection(db, 'users', userId, 'readings');
  try {
    const q = query(
      usersRef,
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    results.push(...snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as EnergyReading[]);
  } catch {
    // collection may not exist yet
  }

  return results;
}

function aggregateReadings(
  readings: EnergyReading[],
  tariff: number
): { consumption: number; cost: number } {
  const consumption = readings.reduce((sum, r) => sum + (r.kwh || 0), 0);
  const cost = readings.reduce(
    (sum, r) => sum + (r.cost || r.kwh * tariff || 0),
    0
  );
  return { consumption, cost };
}

function buildPeriodData(
  readings: EnergyReading[],
  range: { start: string; end: string; label: string },
  tariff: number
): PeriodData {
  const { consumption, cost } = aggregateReadings(readings, tariff);
  return {
    label: range.label,
    consumption,
    cost,
    start: range.start,
    end: range.end,
  };
}

function calculateVariation(
  current: PeriodData,
  previous: PeriodData
): PeriodVariation {
  const consumptionDiff = current.consumption - previous.consumption;
  const costDiff = current.cost - previous.cost;
  const consumptionPercent =
    previous.consumption > 0
      ? (consumptionDiff / previous.consumption) * 100
      : 0;
  const costPercent =
    previous.cost > 0 ? (costDiff / previous.cost) * 100 : 0;
  const isSavings = consumptionDiff < 0;
  const savingsAmount = isSavings ? Math.abs(consumptionDiff) : 0;

  return {
    consumptionPercent,
    costPercent,
    consumptionDiff,
    costDiff,
    isSavings,
    savingsAmount,
  };
}

function generateMessage(
  periodLabel: string,
  variation: PeriodVariation
): string {
  const absConsumption = Math.abs(variation.consumptionPercent);
  const absCost = Math.abs(variation.costPercent);

  if (variation.isSavings) {
    if (absConsumption > 10) {
      return `Seu consumo caiu ${absConsumption.toFixed(1)}% em relação a ${periodLabel}. Ótima economia!`;
    }
    if (absConsumption > 0) {
      return `Seu consumo reduziu ${absConsumption.toFixed(1)}% comparado a ${periodLabel}. Continue assim!`;
    }
    return `Seu consumo se manteve estável em relação a ${periodLabel}.`;
  }

  if (absConsumption > 20) {
    return `Seu consumo aumentou ${absConsumption.toFixed(1)}% em relação a ${periodLabel}. Reveja seus hábitos!`;
  }
  if (absConsumption > 5) {
    return `Seu gasto aumentou ${absConsumption.toFixed(1)}% em relação a ${periodLabel}. Fique atento!`;
  }
  return `Seu consumo variou ${absConsumption.toFixed(1)}% comparado a ${periodLabel}.`;
}

export async function compareMonths(
  userId: string,
  tariff?: number
): Promise<PeriodComparison> {
  const ranges = getMonthRanges();
  const effectiveTariff = tariff ?? 0.95;

  const currentReadings = await getReadingsInRange(
    userId,
    ranges.current.start,
    ranges.current.end
  );
  const previousReadings = await getReadingsInRange(
    userId,
    ranges.previous.start,
    ranges.previous.end
  );

  const currentPeriod = buildPeriodData(currentReadings, ranges.current, effectiveTariff);
  const previousPeriod = buildPeriodData(previousReadings, ranges.previous, effectiveTariff);
  const variation = calculateVariation(currentPeriod, previousPeriod);
  const message = generateMessage(
    ranges.previous.label.toLowerCase(),
    variation
  );

  return {
    periodType: 'month',
    currentPeriod,
    previousPeriod,
    variation,
    message,
  };
}

export async function compareWeeks(
  userId: string,
  tariff?: number
): Promise<PeriodComparison> {
  const ranges = getWeekRanges();
  const effectiveTariff = tariff ?? 0.95;

  const currentReadings = await getReadingsInRange(
    userId,
    ranges.current.start,
    ranges.current.end
  );
  const previousReadings = await getReadingsInRange(
    userId,
    ranges.previous.start,
    ranges.previous.end
  );

  const currentPeriod = buildPeriodData(currentReadings, ranges.current, effectiveTariff);
  const previousPeriod = buildPeriodData(previousReadings, ranges.previous, effectiveTariff);
  const variation = calculateVariation(currentPeriod, previousPeriod);
  const message = generateMessage(
    ranges.previous.label.toLowerCase(),
    variation
  );

  return {
    periodType: 'week',
    currentPeriod,
    previousPeriod,
    variation,
    message,
  };
}

export async function compareBoth(
  userId: string,
  tariff?: number
): Promise<{ month: PeriodComparison; week: PeriodComparison }> {
  const [month, week] = await Promise.all([
    compareMonths(userId, tariff),
    compareWeeks(userId, tariff),
  ]);
  return { month, week };
}

function generateDemoPeriodData(
  label: string,
  baseKwh: number,
  tariff: number
): PeriodData {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 1);
  return {
    label,
    consumption: baseKwh,
    cost: baseKwh * tariff,
    start: start.toISOString(),
    end: now.toISOString(),
  };
}

function getMonthName(date: Date): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[date.getMonth()];
}

export function generateDemoComparison(tariff?: number): {
  month: PeriodComparison;
  week: PeriodComparison;
} {
  const effectiveTariff = tariff ?? 0.95;
  const demoReadings = demoData.readings as DemoReading[];
  const now = new Date();
  const currentMonthKwh = demoReadings.reduce((sum, r) => sum + (r.kwh || 0), 0);
  const currentCost = currentMonthKwh * effectiveTariff;
  const prevMonthKwh = currentMonthKwh * 1.15;
  const prevCost = prevMonthKwh * effectiveTariff;

  const currentMonthLabel = getMonthName(now);
  const prevMonthLabel = getMonthName(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const monthCurrent = generateDemoPeriodData(currentMonthLabel, currentMonthKwh, effectiveTariff);
  const monthPrevious = generateDemoPeriodData(prevMonthLabel, prevMonthKwh, effectiveTariff);
  const monthVariation = calculateVariation(monthCurrent, monthPrevious);
  const monthMessage = generateMessage('mês anterior', monthVariation);

  const weekKwh = currentMonthKwh / 30 * 7;
  const prevWeekKwh = weekKwh * 1.15;
  const weekCurrent = generateDemoPeriodData('Esta Semana', weekKwh, effectiveTariff);
  const weekPrevious = generateDemoPeriodData('Semana Passada', prevWeekKwh, effectiveTariff);
  const weekVariation = calculateVariation(weekCurrent, weekPrevious);
  const weekMessage = generateMessage('semana passada', weekVariation);

  return {
    month: {
      periodType: 'month',
      currentPeriod: monthCurrent,
      previousPeriod: monthPrevious,
      variation: monthVariation,
      message: monthMessage,
    },
    week: {
      periodType: 'week',
      currentPeriod: weekCurrent,
      previousPeriod: weekPrevious,
      variation: weekVariation,
      message: weekMessage,
    },
  };
}

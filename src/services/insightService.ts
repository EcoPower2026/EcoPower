import {
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { EnergyReading, Goal, EfficiencyScore, Insight } from '../types';

export type TopConsumer = {
  name: string;
  consumption: number;
  percentage: number;
};

type ApplianceConsumption = {
  kwh: number;
  cost: number;
};

async function getUserProfile(userId: string): Promise<{ nome: string; tarifaKwh: number } | null> {
  try {
    const ref = doc(db, 'usuarios', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { nome?: string; tarifaKwh?: number };
      return { nome: data.nome ?? '', tarifaKwh: data.tarifaKwh ?? 0.95 };
    }
    return null;
  } catch {
    return null;
  }
}

async function getReadings(userId: string): Promise<EnergyReading[]> {
  const results: EnergyReading[] = [];

  const usuariosRef = collection(db, 'usuarios', userId, 'leituras');
  try {
    const snap = await getDocs(usuariosRef);
    results.push(...snap.docs.map(d => ({ id: d.id, ...d.data() } as EnergyReading)));
  } catch {
    // collection may not exist
  }

  const usersRef = collection(db, 'users', userId, 'readings');
  try {
    const q = query(usersRef, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    results.push(...snap.docs.map(d => ({ id: d.id, ...d.data() } as EnergyReading)));
  } catch {
    // collection may not exist
  }

  return results;
}

export async function getTopConsumers(userId: string): Promise<TopConsumer[]> {
  const readings = await getReadings(userId);

  const applianceMap = new Map<string, ApplianceConsumption>();
  let totalKwh = 0;

  for (const r of readings) {
    const key = r.applianceName || r.applianceId || 'Desconhecido';
    const existing = applianceMap.get(key) || { kwh: 0, cost: 0 };
    existing.kwh += r.kwh || 0;
    existing.cost += r.cost || 0;
    applianceMap.set(key, existing);
    totalKwh += r.kwh || 0;
  }

  const consumers: TopConsumer[] = [];
  for (const [name, data] of applianceMap) {
    consumers.push({
      name,
      consumption: data.kwh,
      percentage: totalKwh > 0 ? (data.kwh / totalKwh) * 100 : 0,
    });
  }

  consumers.sort((a, b) => b.consumption - a.consumption);
  return consumers;
}

export async function calculatePotentialSavings(
  userId: string,
  consumer: TopConsumer
): Promise<{ hoursReduction: number; savings: number }> {
  const profile = await getUserProfile(userId);
  const tariff = profile?.tarifaKwh ?? 0.95;

  const dailyKwh = consumer.consumption / 30;
  const costPerHour = dailyKwh > 0 ? (consumer.consumption * tariff) / (30 * 24) : 0;

  return {
    hoursReduction: 2,
    savings: costPerHour * 2 * 30,
  };
}

export async function generateRecommendations(
  userId: string
): Promise<Insight[]> {
  const topConsumers = await getTopConsumers(userId);
  const insights: Insight[] = [];

  if (topConsumers.length > 0) {
    for (const consumer of topConsumers) {
      const savings = await calculatePotentialSavings(userId, consumer);

      insights.push({
        tipo: 'reducao_uso',
        titulo: `Reduza o uso de ${consumer.name}`,
        descricao: `Reduzindo 2 horas de uso por dia você economizaria R$ ${savings.savings.toFixed(2)} por mês.`,
        economiaPotencial: savings.savings,
        prioridade: consumer.percentage > 30 ? 'alta' : 'media',
      });
    }

    insights.push({
      tipo: 'standby',
      titulo: 'Desligue equipamentos em standby',
      descricao: 'Equipamentos em modo standby podem representar até 15% do consumo residencial.',
      economiaPotencial: 0,
      prioridade: 'media',
    });

    insights.push({
      tipo: 'troca_eficiente',
      titulo: 'Troque aparelhos antigos',
      descricao: 'Aparelhos com selo Procel A consomem até 40% menos energia que modelos antigos.',
      economiaPotencial: 0,
      prioridade: 'baixa',
    });
  }

  return insights;
}

export async function calculateEfficiencyScore(
  userId: string,
  goals: Goal[],
  tariff: number = 0.95
): Promise<EfficiencyScore> {
  const topConsumers = await getTopConsumers(userId);
  const totalKwh = topConsumers.reduce((acc, c) => acc + c.consumption, 0);

  if (totalKwh === 0) {
    return { score: 50, classificacao: 'Regular', economiaPotencial: 0 };
  }

  let score = 70;

  // Penalty for having a single dominant appliance (>50%)
  for (const consumer of topConsumers) {
    if (consumer.percentage > 50) {
      score -= 15;
    } else if (consumer.percentage > 30) {
      score -= 5;
    }
  }

  // Bonus for having active goals
  const activeGoals = goals.filter(g => g.ativa);
  if (activeGoals.length > 0) {
    score += 10;
    for (const goal of activeGoals) {
      if (goal.progresso >= goal.valorAlvo * 0.5) {
        score += 5;
      }
    }
  }

  // Penalty for high total consumption
  if (totalKwh > 500) {
    score -= 10;
  } else if (totalKwh > 300) {
    score -= 5;
  } else if (totalKwh < 100) {
    score += 10;
  }

  // Penalty for too many appliances
  if (topConsumers.length > 5) {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let classificacao: EfficiencyScore['classificacao'];
  if (score >= 90) classificacao = 'Excelente';
  else if (score >= 70) classificacao = 'Bom';
  else if (score >= 50) classificacao = 'Regular';
  else classificacao = 'Crítico';

  const economiaPotencial = totalKwh * 0.15 * tariff;

  return { score, classificacao, economiaPotencial };
}

export async function generateInsights(userId: string, goals: Goal[], tariff: number = 0.95): Promise<{
  topConsumers: TopConsumer[];
  efficiencyScore: EfficiencyScore;
  recommendations: Insight[];
}> {
  const [topConsumers, efficiencyScore, recommendations] = await Promise.all([
    getTopConsumers(userId),
    calculateEfficiencyScore(userId, goals, tariff),
    generateRecommendations(userId),
  ]);

  return { topConsumers, efficiencyScore, recommendations };
}

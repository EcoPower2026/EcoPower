import {
  Achievement,
  ACHIEVEMENT_DEFINITIONS,
  EFFICIENCY_LEVELS,
  EfficiencyState,
  StreakState,
  STREAK_MILESTONES,
  EnvironmentalImpact,
  CO2_PER_KWH,
  TREES_PER_KG_CO2,
} from './types';

export function calculateEfficiencyLevel(points: number): { currentLevel: number; pointsForNext: number } {
  let level = 1;
  for (const l of EFFICIENCY_LEVELS) {
    if (points >= l.pontosMinimos && points < l.pontosMaximos) {
      level = l.level;
      break;
    }
    if (points >= l.pontosMaximos) {
      level = l.level;
    }
  }
  const current = EFFICIENCY_LEVELS.find(l => l.level === level)!;
  const next = EFFICIENCY_LEVELS.find(l => l.level === level + 1);
  const pointsForNext = next ? next.pontosMinimos - points : 0;
  return { currentLevel: level, pointsForNext };
}

export function getLevelProgress(points: number, level: number): number {
  const current = EFFICIENCY_LEVELS.find(l => l.level === level)!;
  const range = current.pontosMaximos - current.pontosMinimos;
  if (range === Infinity) return 1;
  const progress = (points - current.pontosMinimos) / range;
  return Math.min(1, Math.max(0, progress));
}

export function calculateEfficiencyPoints(
  metaAtingida: boolean,
  semanaNaMeta: boolean,
  reducaoConsumo: boolean,
  semAlertasCriticos: boolean,
): number {
  let points = 0;
  if (metaAtingida) points += 50;
  if (semanaNaMeta) points += 25;
  if (reducaoConsumo) points += 10;
  if (semAlertasCriticos) points += 5;
  return points;
}

export function checkAchievements(
  savedAchievements: Achievement[],
  totalEconomia: number,
  firstGoalReached: boolean,
  streakDays: number,
  daysWithoutCriticalAlerts: number,
  consumptionReductionPercent: number | null,
  daysActive: number,
): Achievement[] {
  const updated = savedAchievements.map(a => ({ ...a }));

  for (let i = 0; i < updated.length; i++) {
    const a = updated[i];
    if (a.desbloqueada) continue;

    let shouldUnlock = false;

    switch (a.id) {
      case 'primeira-economia':
        shouldUnlock = totalEconomia >= 10;
        break;
      case 'guardiao-energia':
        shouldUnlock = totalEconomia >= 50;
        break;
      case 'mestre-economia':
        shouldUnlock = totalEconomia >= 100;
        break;
      case 'meta-conquistada':
        shouldUnlock = firstGoalReached;
        break;
      case 'persistente':
        shouldUnlock = streakDays >= 7;
        break;
      case 'consumo-inteligente':
        shouldUnlock = daysWithoutCriticalAlerts >= 30;
        break;
      case 'eco-hero':
        shouldUnlock = consumptionReductionPercent !== null && consumptionReductionPercent >= 10;
        break;
      case 'sustentavel':
        shouldUnlock = consumptionReductionPercent !== null && consumptionReductionPercent >= 20;
        break;
      case 'analista-energia':
        shouldUnlock = daysActive >= 10;
        break;
      case 'monitor-ativo':
        shouldUnlock = daysActive >= 30;
        break;
    }

    if (shouldUnlock) {
      updated[i] = { ...a, desbloqueada: true, dataDesbloqueio: new Date().toISOString() };
    }
  }

  return updated;
}

export function calculateStreak(
  previousState: StreakState,
  isConformantToday: boolean,
  today: string,
): { streak: StreakState; milestoneReached: number | null } {
  let { currentStreak, longestStreak, lastConformantDate } = previousState;

  if (!isConformantToday) {
    return {
      streak: { currentStreak: 0, longestStreak, lastConformantDate: null, milestoneJustReached: null },
      milestoneReached: null,
    };
  }

  if (lastConformantDate === today) {
    return { streak: { ...previousState, milestoneJustReached: null }, milestoneReached: null };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const lastDate = lastConformantDate ? lastConformantDate.split('T')[0] : null;

  if (lastDate === yesterdayStr || lastDate === null) {
    currentStreak += 1;
  } else if (lastDate !== today) {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  let milestoneReached: number | null = null;
  for (const m of STREAK_MILESTONES) {
    if (currentStreak === m) {
      milestoneReached = m;
      break;
    }
  }

  return {
    streak: { currentStreak, longestStreak, lastConformantDate: today, milestoneJustReached: milestoneReached },
    milestoneReached,
  };
}

export function calculateEnvironmentalImpact(
  energySavedKwh: number,
  financialSavings: number,
): EnvironmentalImpact {
  const co2AvoidedKg = Math.round(energySavedKwh * CO2_PER_KWH * 100) / 100;
  const treesEquivalent = Math.floor(co2AvoidedKg / TREES_PER_KG_CO2);
  return {
    co2AvoidedKg,
    treesEquivalent: Math.max(0, treesEquivalent),
    energySavedKwh: Math.round(energySavedKwh * 100) / 100,
    financialSavings: Math.round(financialSavings * 100) / 100,
  };
}

export function getDefaultAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    desbloqueada: false,
    dataDesbloqueio: null,
  }));
}

export function getCategoriaColor(categoria: string): string {
  const map: Record<string, string> = {
    economia: '#2ECC71',
    eficiencia: '#3498DB',
    sustentabilidade: '#27AE60',
    consistencia: '#F39C12',
    metas: '#1E90FF',
  };
  return map[categoria] || '#94A3B8';
}

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useDemo } from '../contexts/DemoContext';
import * as dataProvider from '../services/dataProvider';
import { getUserProfile } from '../services/userService';
import {
  EcoImpactState,
  StreakState,
  EnvironmentalImpact,
} from './types';
import {
  calculateEfficiencyLevel,
  getLevelProgress,
  calculateEfficiencyPoints,
  calculateStreak,
  calculateEnvironmentalImpact,
  getDefaultAchievements,
} from './ecoImpactService';

const STORAGE_KEY = '@ecopower_eco_impact';

interface EcoImpactContextType extends EcoImpactState {
  refreshImpact: () => Promise<void>;
  getLevelProgress: (points: number, level: number) => number;
}

const defaultStreak: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastConformantDate: null,
  milestoneJustReached: null,
};

const defaultImpact: EnvironmentalImpact = {
  co2AvoidedKg: 0,
  treesEquivalent: 0,
  energySavedKwh: 0,
  financialSavings: 0,
};

const defaultState: EcoImpactState = {
  achievements: getDefaultAchievements(),
  efficiency: { currentLevel: 1, currentPoints: 0 },
  streak: defaultStreak,
  impact: defaultImpact,
  totalEconomia: 0,
  isLoading: true,
};

const EcoImpactContext = createContext<EcoImpactContextType>({
  ...defaultState,
  refreshImpact: async () => {},
  getLevelProgress: () => 0,
});

const DEMO_STATE: EcoImpactState = {
  achievements: [
    { id: 'primeira-economia', nome: 'Primeira Economia', descricao: 'Economizou seus primeiros R$ 10.', icone: 'cash-outline', categoria: 'economia', desbloqueada: true, dataDesbloqueio: '2026-05-10T10:00:00.000Z' },
    { id: 'guardiao-energia', nome: 'Guardião da Energia', descricao: 'Economizou R$ 50 acumulados.', icone: 'shield-outline', categoria: 'economia', desbloqueada: true, dataDesbloqueio: '2026-05-22T14:30:00.000Z' },
    { id: 'mestre-economia', nome: 'Mestre da Economia', descricao: 'Economizou R$ 100 acumulados.', icone: 'trophy-outline', categoria: 'economia', desbloqueada: false, dataDesbloqueio: null },
    { id: 'economia-real', nome: 'Economia Real', descricao: 'Economizou R$ 200 acumulados.', icone: 'wallet-outline', categoria: 'economia', desbloqueada: false, dataDesbloqueio: null },
    { id: 'super-economia', nome: 'Super Economia', descricao: 'Economizou R$ 500 acumulados.', icone: 'diamond-outline', categoria: 'economia', desbloqueada: false, dataDesbloqueio: null },
    { id: 'meta-conquistada', nome: 'Meta Conquistada', descricao: 'Atingiu sua primeira meta.', icone: 'flag-outline', categoria: 'metas', desbloqueada: true, dataDesbloqueio: '2026-05-05T08:15:00.000Z' },
    { id: 'eco-iniciador', nome: 'Primeiros Passos', descricao: 'Criou sua primeira meta de economia.', icone: 'star-outline', categoria: 'metas', desbloqueada: true, dataDesbloqueio: '2026-05-05T08:15:00.000Z' },
    { id: 'persistente', nome: 'Persistente', descricao: 'Permaneceu 7 dias dentro da meta.', icone: 'calendar-outline', categoria: 'consistencia', desbloqueada: true, dataDesbloqueio: '2026-05-18T09:00:00.000Z' },
    { id: 'consumo-inteligente', nome: 'Consumo Inteligente', descricao: 'Permaneceu 30 dias sem alertas críticos.', icone: 'bulb-outline', categoria: 'eficiencia', desbloqueada: true, dataDesbloqueio: '2026-06-01T12:00:00.000Z' },
    { id: 'alerta-ativo', nome: 'Alerta Verde', descricao: 'Respondeu a 5 alertas de consumo.', icone: 'notifications-outline', categoria: 'eficiencia', desbloqueada: true, dataDesbloqueio: '2026-05-15T16:45:00.000Z' },
    { id: 'eco-hero', nome: 'Eco Hero', descricao: 'Reduziu 10% do consumo em comparação ao mês anterior.', icone: 'flash-outline', categoria: 'sustentabilidade', desbloqueada: true, dataDesbloqueio: '2026-05-30T11:20:00.000Z' },
    { id: 'sustentavel', nome: 'Sustentável', descricao: 'Reduziu 20% do consumo em comparação ao mês anterior.', icone: 'leaf-outline', categoria: 'sustentabilidade', desbloqueada: false, dataDesbloqueio: null },
    { id: 'impacto-ambiental', nome: 'Amigo da Terra', descricao: 'Evitou 10 kg de emissão de CO₂.', icone: 'earth-outline', categoria: 'sustentabilidade', desbloqueada: true, dataDesbloqueio: '2026-05-28T15:00:00.000Z' },
    { id: 'analista-energia', nome: 'Analista de Energia', descricao: 'Visualizou relatórios por 10 dias diferentes.', icone: 'analytics-outline', categoria: 'eficiencia', desbloqueada: true, dataDesbloqueio: '2026-05-20T10:30:00.000Z' },
    { id: 'monitor-ativo', nome: 'Monitor Ativo', descricao: 'Utilizou o aplicativo por 30 dias.', icone: 'pulse-outline', categoria: 'consistencia', desbloqueada: true, dataDesbloqueio: '2026-06-05T08:00:00.000Z' },
  ],
  efficiency: { currentLevel: 4, currentPoints: 450 },
  streak: { currentStreak: 15, longestStreak: 22, lastConformantDate: new Date().toISOString().split('T')[0], milestoneJustReached: null },
  impact: { co2AvoidedKg: 36, treesEquivalent: 1, energySavedKwh: 90, financialSavings: 85.50 },
  totalEconomia: 85.50,
  isLoading: false,
};

export function EcoImpactProvider({ children }: { children: React.ReactNode }) {
  const { isDemoMode } = useDemo();
  const [state, setState] = useState<EcoImpactState>(
    isDemoMode ? DEMO_STATE : defaultState
  );
  const isLoaded = useRef(false);

  const persistState = useCallback(async (newState: EcoImpactState) => {
    try {
      const toStore = {
        achievements: newState.achievements,
        efficiency: newState.efficiency,
        streak: { ...newState.streak, milestoneJustReached: null },
        impact: newState.impact,
        totalEconomia: newState.totalEconomia,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {}
  }, []);

  const clearPersistedState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const getUserId = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(user?.uid || 'demo-user');
      });
      setTimeout(() => resolve('demo-user'), 2000);
    });
  }, []);

  const calculateAll = useCallback(async () => {
    try {
      const userId = await getUserId();
      const profile = await getUserProfile(userId).catch(() => null);
      const tariff = profile?.tarifaKwh ?? 0.95;
      const dashboardData = await dataProvider.getDashboardData(userId, false);
      const comparisonData = await dataProvider.compareBoth(userId, tariff, false);

      const currentCost = dashboardData?.currentCost || 0;
      const projectedCost = dashboardData?.financialForecast?.projectedCost || 0;
      const monthlySavings = Math.max(0, projectedCost - currentCost);

      let totalEconomia = 0;
      if (monthlySavings > 0) {
        totalEconomia = monthlySavings;
      }

      const hasActiveGoal = !!dashboardData?.goal;
      const firstGoalReached = hasActiveGoal;

      const hasAlertCritico = dashboardData?.recentAlerts?.some(
        (a: any) => a.nivel === 'danger' || a.nivel === 'warning',
      ) || false;

      const consumptionReduction = comparisonData?.month?.variation?.consumptionPercent || null;
      const isReduction = comparisonData?.month?.variation?.isSavings || false;
      const reductionPercent = isReduction && consumptionReduction !== null ? Math.abs(consumptionReduction) : null;

      const daysWithoutCriticalAlerts = hasAlertCritico ? 0 : 1;

      const isConformantToday = hasActiveGoal && !hasAlertCritico;

      const today = new Date().toISOString().split('T')[0];
      const { streak: newStreak } = calculateStreak(defaultStreak, isConformantToday, today);

      const efficiencyPoints = calculateEfficiencyPoints(
        firstGoalReached,
        newStreak.currentStreak >= 7,
        isReduction,
        !hasAlertCritico,
      );
      const { currentLevel } = calculateEfficiencyLevel(efficiencyPoints);

      const achievements = getDefaultAchievements();

      const energySaved = totalEconomia / tariff;
      const impact = calculateEnvironmentalImpact(energySaved, totalEconomia);

      const newState: EcoImpactState = {
        achievements,
        efficiency: { currentLevel, currentPoints: efficiencyPoints },
        streak: newStreak,
        impact,
        totalEconomia,
        isLoading: false,
      };

      setState(newState);
      persistState(newState);
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [persistState]);

  useEffect(() => {
    if (isDemoMode) {
      setState(DEMO_STATE);
      return;
    }

    if (!isLoaded.current) {
      isLoaded.current = true;
      clearPersistedState().then(() => calculateAll());
    } else {
      calculateAll();
    }

    const interval = setInterval(() => {
      calculateAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [isDemoMode, calculateAll, clearPersistedState]);

  const refreshImpact = useCallback(async () => {
    if (isDemoMode) {
      setState(DEMO_STATE);
    } else {
      await calculateAll();
    }
  }, [isDemoMode, calculateAll]);

  const getProgress = useCallback((points: number, level: number) => {
    return getLevelProgress(points, level);
  }, []);

  return (
    <EcoImpactContext.Provider
      value={{
        ...state,
        refreshImpact,
        getLevelProgress: getProgress,
      }}
    >
      {children}
    </EcoImpactContext.Provider>
  );
}

export function useEcoImpact() {
  const ctx = useContext(EcoImpactContext);
  if (!ctx) {
    throw new Error('useEcoImpact must be used within EcoImpactProvider');
  }
  return ctx;
}

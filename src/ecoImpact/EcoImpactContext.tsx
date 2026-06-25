import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { useDemo } from '../contexts/DemoContext';
import * as dataProvider from '../services/dataProvider';
import {
  EcoImpactState,
  Achievement,
  EfficiencyState,
  StreakState,
  EnvironmentalImpact,
} from './types';
import {
  calculateEfficiencyLevel,
  getLevelProgress,
  calculateEfficiencyPoints,
  checkAchievements,
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

export function EcoImpactProvider({ children }: { children: React.ReactNode }) {
  const { isDemoMode } = useDemo();
  const [state, setState] = useState<EcoImpactState>(defaultState);
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

  const loadPersistedState = useCallback(async (): Promise<Partial<EcoImpactState> | null> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
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

  const calculateAll = useCallback(async (isDemo: boolean) => {
    try {
      const userId = isDemo ? 'demo-user' : await getUserId();
      const dashboardData = await dataProvider.getDashboardData(userId, isDemo);
      const comparisonData = await dataProvider.compareBoth(userId, 0.95, isDemo);

      const persisted = await loadPersistedState();
      const savedAchievements: Achievement[] = persisted?.achievements || getDefaultAchievements();
      const savedEfficiency: EfficiencyState = persisted?.efficiency || { currentLevel: 1, currentPoints: 0 };
      const savedStreak: StreakState = persisted?.streak || defaultStreak;
      const savedTotalEconomia = persisted?.totalEconomia || 0;

      const currentCost = dashboardData?.currentCost || 0;
      const projectedCost = dashboardData?.financialForecast?.projectedCost || 0;
      const monthlySavings = Math.max(0, projectedCost - currentCost);

      let totalEconomia = savedTotalEconomia;
      if (monthlySavings > 0) {
        totalEconomia = Math.max(totalEconomia, monthlySavings);
      }

      const hasActiveGoal = !!dashboardData?.goal;
      const firstGoalReached = hasActiveGoal;

      const hasAlertCritico = dashboardData?.recentAlerts?.some(
        (a: any) => a.nivel === 'danger' || a.nivel === 'warning',
      ) || false;

      const consumptionReduction = comparisonData?.month?.variation?.consumptionPercent || null;
      const isReduction = comparisonData?.month?.variation?.isSavings || false;
      const reductionPercent = isReduction && consumptionReduction !== null ? Math.abs(consumptionReduction) : null;

      const daysWithoutCriticalAlerts = hasAlertCritico ? 0 : Math.min(30, (savedStreak.currentStreak || 0) + 1);

      const isConformantToday = hasActiveGoal && !hasAlertCritico;

      const today = new Date().toISOString().split('T')[0];
      const { streak: newStreak } = calculateStreak(savedStreak, isConformantToday, today);

      const efficiencyPoints = calculateEfficiencyPoints(
        firstGoalReached,
        savedStreak.currentStreak >= 7,
        isReduction,
        !hasAlertCritico,
      );
      const newPoints = savedEfficiency.currentPoints + efficiencyPoints;
      const { currentLevel } = calculateEfficiencyLevel(newPoints);

      const achievements = checkAchievements(
        savedAchievements,
        totalEconomia,
        firstGoalReached,
        newStreak.currentStreak,
        daysWithoutCriticalAlerts,
        reductionPercent,
        newStreak.currentStreak,
      );

      const energySaved = totalEconomia / 0.95;
      const impact = calculateEnvironmentalImpact(energySaved, totalEconomia);

      const newState: EcoImpactState = {
        achievements,
        efficiency: { currentLevel, currentPoints: newPoints },
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
  }, [loadPersistedState, persistState]);

  useEffect(() => {
    if (!isLoaded.current) {
      isLoaded.current = true;
      calculateAll(isDemoMode);
    }

    const interval = setInterval(() => {
      calculateAll(isDemoMode);
    }, 30000);

    return () => clearInterval(interval);
  }, [isDemoMode, calculateAll]);

  const refreshImpact = useCallback(async () => {
    await calculateAll(isDemoMode);
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

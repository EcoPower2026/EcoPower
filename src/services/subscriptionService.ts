export type PlanType = 'eco_free' | 'eco_plus' | 'eco_premium';

export interface PlanDefinition {
  type: PlanType;
  name: string;
  price: number;
  maxAppliances: number | null;
  maxActiveGoals: number | null;
  historyDays: number | null;
  themes: string[];
  features: {
    pdfReports: boolean;
    insights: boolean;
    forecast: boolean;
    gamification: boolean;
    simulator: boolean;
    advancedCharts: boolean;
    unlimitedAlerts: boolean;
  };
}

export const PLANS: Record<PlanType, PlanDefinition> = {
  eco_free: {
    type: 'eco_free',
    name: 'Eco Free',
    price: 0,
    maxAppliances: 5,
    maxActiveGoals: 1,
    historyDays: 30,
    themes: ['ecoNature'],
    features: {
      pdfReports: false,
      insights: false,
      forecast: false,
      gamification: false,
      simulator: false,
      advancedCharts: false,
      unlimitedAlerts: false,
    },
  },
  eco_plus: {
    type: 'eco_plus',
    name: 'Eco Plus',
    price: 9.90,
    maxAppliances: null,
    maxActiveGoals: null,
    historyDays: null,
    themes: ['ecoNature', 'ecoPowerLight', 'ecoNaturePremium'],
    features: {
      pdfReports: false,
      insights: false,
      forecast: false,
      gamification: false,
      simulator: false,
      advancedCharts: true,
      unlimitedAlerts: true,
    },
  },
  eco_premium: {
    type: 'eco_premium',
    name: 'Eco Premium',
    price: 24.90,
    maxAppliances: null,
    maxActiveGoals: null,
    historyDays: null,
    themes: ['ecoNature', 'ecoPowerDark', 'ecoPowerLight', 'ecoNaturePremium'],
    features: {
      pdfReports: true,
      insights: true,
      forecast: true,
      gamification: true,
      simulator: true,
      advancedCharts: true,
      unlimitedAlerts: true,
    },
  },
};

export function getPlan(type: PlanType): PlanDefinition {
  return PLANS[type];
}

export function checkFeatureAccess(plan: PlanType, feature: keyof PlanDefinition['features']): boolean {
  return PLANS[plan].features[feature];
}

export function checkApplianceLimit(plan: PlanType, currentCount: number): { allowed: boolean; limit: number | null } {
  const limit = PLANS[plan].maxAppliances;
  if (limit === null) return { allowed: true, limit: null };
  return { allowed: currentCount < limit, limit };
}

export function checkGoalLimit(plan: PlanType, currentActive: number): { allowed: boolean; limit: number | null } {
  const limit = PLANS[plan].maxActiveGoals;
  if (limit === null) return { allowed: true, limit: null };
  return { allowed: currentActive < limit, limit };
}

export function getHistoryCutoff(plan: PlanType): Date | null {
  const days = PLANS[plan].historyDays;
  if (days === null) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export function getAvailableThemes(plan: PlanType): string[] {
  return PLANS[plan].themes;
}

export function isThemeAllowed(plan: PlanType, theme: string): boolean {
  return PLANS[plan].themes.includes(theme);
}

export function getUpgradeMessage(feature: string, targetPlan: string): string {
  return `Esta funcionalidade está disponível apenas no plano ${targetPlan}. Faça o upgrade para liberar acesso.`;
}

export function getRequiredPlanForFeature(feature: keyof PlanDefinition['features']): PlanType {
  if (feature === 'pdfReports' || feature === 'insights' || feature === 'forecast' || feature === 'gamification' || feature === 'simulator') {
    return 'eco_premium';
  }
  return 'eco_plus';
}

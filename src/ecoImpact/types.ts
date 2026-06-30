export type AchievementCategory = 'economia' | 'eficiencia' | 'sustentabilidade' | 'consistencia' | 'metas';

export interface Achievement {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  categoria: AchievementCategory;
  dataDesbloqueio: string | null;
  desbloqueada: boolean;
}

export interface EfficiencyLevel {
  level: number;
  nome: string;
  pontosMinimos: number;
  pontosMaximos: number;
}

export interface EfficiencyState {
  currentLevel: number;
  currentPoints: number;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastConformantDate: string | null;
  milestoneJustReached: number | null;
}

export interface EnvironmentalImpact {
  co2AvoidedKg: number;
  treesEquivalent: number;
  energySavedKwh: number;
  financialSavings: number;
}

export interface EcoImpactState {
  achievements: Achievement[];
  efficiency: EfficiencyState;
  streak: StreakState;
  impact: EnvironmentalImpact;
  totalEconomia: number;
  isLoading: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'desbloqueada' | 'dataDesbloqueio'>[] = [
  { id: 'primeira-economia', nome: 'Primeira Economia', descricao: 'Economizou seus primeiros R$ 10.', icone: 'cash-outline', categoria: 'economia' },
  { id: 'guardiao-energia', nome: 'Guardião da Energia', descricao: 'Economizou R$ 50 acumulados.', icone: 'shield-outline', categoria: 'economia' },
  { id: 'mestre-economia', nome: 'Mestre da Economia', descricao: 'Economizou R$ 100 acumulados.', icone: 'trophy-outline', categoria: 'economia' },
  { id: 'economia-real', nome: 'Economia Real', descricao: 'Economizou R$ 200 acumulados.', icone: 'wallet-outline', categoria: 'economia' },
  { id: 'super-economia', nome: 'Super Economia', descricao: 'Economizou R$ 500 acumulados.', icone: 'diamond-outline', categoria: 'economia' },
  { id: 'meta-conquistada', nome: 'Meta Conquistada', descricao: 'Atingiu sua primeira meta.', icone: 'flag-outline', categoria: 'metas' },
  { id: 'eco-iniciador', nome: 'Primeiros Passos', descricao: 'Criou sua primeira meta de economia.', icone: 'star-outline', categoria: 'metas' },
  { id: 'persistente', nome: 'Persistente', descricao: 'Permaneceu 7 dias dentro da meta.', icone: 'calendar-outline', categoria: 'consistencia' },
  { id: 'consumo-inteligente', nome: 'Consumo Inteligente', descricao: 'Permaneceu 30 dias sem alertas críticos.', icone: 'bulb-outline', categoria: 'eficiencia' },
  { id: 'alerta-ativo', nome: 'Alerta Verde', descricao: 'Respondeu a 5 alertas de consumo.', icone: 'notifications-outline', categoria: 'eficiencia' },
  { id: 'eco-hero', nome: 'Eco Hero', descricao: 'Reduziu 10% do consumo em comparação ao mês anterior.', icone: 'flash-outline', categoria: 'sustentabilidade' },
  { id: 'sustentavel', nome: 'Sustentável', descricao: 'Reduziu 20% do consumo em comparação ao mês anterior.', icone: 'leaf-outline', categoria: 'sustentabilidade' },
  { id: 'impacto-ambiental', nome: 'Amigo da Terra', descricao: 'Evitou 10 kg de emissão de CO₂.', icone: 'earth-outline', categoria: 'sustentabilidade' },
  { id: 'analista-energia', nome: 'Analista de Energia', descricao: 'Visualizou relatórios por 10 dias diferentes.', icone: 'analytics-outline', categoria: 'eficiencia' },
  { id: 'monitor-ativo', nome: 'Monitor Ativo', descricao: 'Utilizou o aplicativo por 30 dias.', icone: 'pulse-outline', categoria: 'consistencia' },
];

export const EFFICIENCY_LEVELS: EfficiencyLevel[] = [
  { level: 1, nome: 'Iniciante', pontosMinimos: 0, pontosMaximos: 80 },
  { level: 2, nome: 'Consciente', pontosMinimos: 80, pontosMaximos: 200 },
  { level: 3, nome: 'Eficiente', pontosMinimos: 200, pontosMaximos: 400 },
  { level: 4, nome: 'Sustentável', pontosMinimos: 400, pontosMaximos: 650 },
  { level: 5, nome: 'Eco Master', pontosMinimos: 650, pontosMaximos: 950 },
  { level: 6, nome: 'Especialista Energético', pontosMinimos: 950, pontosMaximos: 1300 },
  { level: 7, nome: 'Expert em Energia', pontosMinimos: 1300, pontosMaximos: 1750 },
  { level: 8, nome: 'Visionário', pontosMinimos: 1750, pontosMaximos: 2300 },
  { level: 9, nome: 'Lenda Verde', pontosMinimos: 2300, pontosMaximos: 3000 },
  { level: 10, nome: 'Eco Legend', pontosMinimos: 3000, pontosMaximos: Infinity },
];

export const STREAK_MILESTONES = [7, 15, 30, 60, 100];

export const CO2_PER_KWH = 0.4;
export const TREES_PER_KG_CO2 = 22;

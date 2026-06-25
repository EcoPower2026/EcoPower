export type Appliance = {
  id: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  potencia: number;
  horasPorDia: number;
  ativo: boolean;
};

export type MonitoringState = {
  aparelhoAtivoId: string | null;
  atualizadoEm: string;
};

export type Goal = {
  id: string;
  titulo: string;
  valorAlvo: number;
  dataInicio: string;
  dataFim: string;
  progresso: number;
  aparelhoId: string;
  ativa: boolean;
};

export type EnergyReading = {
  id?: string;
  applianceId: string;
  applianceName: string;
  current: number;
  voltage: number;
  power: number;
  kwh: number;
  cost: number;
  timestamp: string;
};

export type AlertNivel = 'info' | 'warning' | 'danger';

export type Alert = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  nivel: AlertNivel;
  lido: boolean;
  createdAt: any;
};

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'appliance' | 'consolidated';

export type ReportPeriod = {
  start: string;
  end: string;
};

export type ApplianceStat = {
  name: string;
  consumption: number;
  cost: number;
  percentage: number;
};

export type Report = {
  type: ReportType;
  period: ReportPeriod;
  totalConsumption: number;
  totalCost: number;
  topConsumer: { name: string; consumption: number; percentage: number } | null;
  bottomConsumer: { name: string; consumption: number; percentage: number } | null;
  dailyAverage: number;
  applianceStats: ApplianceStat[];
  generatedAt: string;
  userName?: string;
};

export type Insight = {
  tipo: string;
  titulo: string;
  descricao: string;
  economiaPotencial: number;
  prioridade: 'alta' | 'media' | 'baixa';
};

export type EfficiencyScore = {
  score: number;
  classificacao: 'Excelente' | 'Bom' | 'Regular' | 'Crítico';
  economiaPotencial: number;
};

export type DemoAppliance = {
  id: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  potencia: number;
  horasPorDia: number;
  ativo: boolean;
};

export type ReadingFilter = 'today' | 'week' | 'month' | 'appliance';

export type SimulatorInput = {
  power: number;
  hoursPerDay: number;
  daysPerMonth: number;
  tariff: number;
  reduction: number;
};

export type SimulatorResult = {
  dailyConsumption: number;
  monthlyConsumption: number;
  monthlyCost: number;
  annualCost: number;
  economyMonthly: number;
  economyAnnual: number;
};

export type DemoReading = {
  id: string;
  applianceId: string;
  applianceName: string;
  current: number;
  voltage: number;
  power: number;
  kwh: number;
  cost: number;
  timestamp: string;
};

export type GoalComparison = {
  goalTitle: string;
  goalTarget: number;
  difference: number;
  percentageAbove: number;
  isAbove: boolean;
};

export type Forecast = {
  currentConsumption: number;
  currentCost: number;
  projectedConsumption: number;
  projectedCost: number;
  daysElapsed: number;
  daysInMonth: number;
  dailyAverage: number;
  goalComparison: GoalComparison | null;
  recommendations: string[];
  month: string;
};

export type PeriodLabel = 'month' | 'week';

export type PeriodData = {
  label: string;
  consumption: number;
  cost: number;
  start: string;
  end: string;
};

export type PeriodVariation = {
  consumptionPercent: number;
  costPercent: number;
  consumptionDiff: number;
  costDiff: number;
  isSavings: boolean;
  savingsAmount: number;
};

export type PeriodComparison = {
  periodType: PeriodLabel;
  currentPeriod: PeriodData;
  previousPeriod: PeriodData;
  variation: PeriodVariation;
  message: string;
};

import {
  Appliance,
  Goal,
  Alert,
  Insight,
  EfficiencyScore,
  DemoReading,
  Report,
} from '../types';

const DEMO_USER_ID = 'demo-user';

const DEMO_USER = {
  nome: 'Usuário Demonstração',
  email: 'demo@ecopower.com',
  tarifaKwh: 0.95,
};

const DEMO_APPLIANCES: (Appliance & { potencia: number; horasPorDia: number; ativo: boolean })[] = [
  { id: 'demo-app-1', nome: 'Geladeira', descricao: 'Geladeira Frost Free 340L', dataCadastro: '2024-01-15T10:00:00Z', potencia: 150, horasPorDia: 24, ativo: true },
  { id: 'demo-app-2', nome: 'TV Smart', descricao: 'TV LED 55" 4K', dataCadastro: '2024-02-10T14:00:00Z', potencia: 120, horasPorDia: 6, ativo: true },
  { id: 'demo-app-3', nome: 'Ar Condicionado', descricao: 'Ar Condicionado Split 12000 BTUs', dataCadastro: '2024-03-05T09:00:00Z', potencia: 1500, horasPorDia: 8, ativo: true },
  { id: 'demo-app-4', nome: 'Microondas', descricao: 'Microondas 30L', dataCadastro: '2024-01-20T11:00:00Z', potencia: 1200, horasPorDia: 0.5, ativo: false },
  { id: 'demo-app-5', nome: 'Chuveiro Elétrico', descricao: 'Chuveiro Elétrico 5500W', dataCadastro: '2024-04-12T16:00:00Z', potencia: 5500, horasPorDia: 1, ativo: true },
  { id: 'demo-app-6', nome: 'Computador Gamer', descricao: 'PC Gamer RTX 4070', dataCadastro: '2024-05-01T18:00:00Z', potencia: 500, horasPorDia: 6, ativo: false },
  { id: 'demo-app-7', nome: 'Máquina de Lavar', descricao: 'Lava e Seca 12kg', dataCadastro: '2024-02-25T08:00:00Z', potencia: 1000, horasPorDia: 1, ativo: false },
];

const DEMO_GOALS: Goal[] = [
  { id: 'demo-goal-1', titulo: 'Reduzir 15% do consumo mensal', valorAlvo: 200, dataInicio: '2024-06-01', dataFim: '2024-12-31', progresso: 65, aparelhoId: '', ativa: true },
  { id: 'demo-goal-2', titulo: 'Economizar R$ 50 por mês', valorAlvo: 50, dataInicio: '2024-06-01', dataFim: '2024-12-31', progresso: 40, aparelhoId: 'demo-app-3', ativa: true },
  { id: 'demo-goal-3', titulo: 'Meta de eficiência energética', valorAlvo: 300, dataInicio: '2024-07-01', dataFim: '2025-06-30', progresso: 25, aparelhoId: '', ativa: false },
];

const DEMO_ALERTS: Alert[] = [
  { id: 'demo-alert-1', tipo: 'consumo_alto', titulo: 'Consumo acima da média', mensagem: 'Seu consumo este mês está 25% acima da média dos últimos 3 meses. Considere revisar seus hábitos de uso.', nivel: 'warning', lido: false, createdAt: { toDate: () => new Date(Date.now() - 3600000) } },
  { id: 'demo-alert-2', tipo: 'meta_proxima', titulo: 'Meta quase atingida', mensagem: 'Você está a 10% de atingir a meta "Reduzir 15% do consumo mensal". Continue assim!', nivel: 'info', lido: false, createdAt: { toDate: () => new Date(Date.now() - 86400000) } },
  { id: 'demo-alert-3', tipo: 'aparelho_dominante', titulo: 'Alto consumo do Chuveiro', mensagem: 'O Chuveiro Elétrico representa 43% do seu consumo total. Reduzir 5 minutos por dia pode gerar grande economia.', nivel: 'danger', lido: true, createdAt: { toDate: () => new Date(Date.now() - 172800000) } },
  { id: 'demo-alert-4', tipo: 'economia', titulo: 'Economia detectada', mensagem: 'Seu consumo reduziu 8% comparado ao mês passado. Parabéns pela economia!', nivel: 'info', lido: true, createdAt: { toDate: () => new Date(Date.now() - 259200000) } },
];

const APPLIANCE_TARIFF = 0.95;

function generateDemoReadings(): DemoReading[] {
  const readings: DemoReading[] = [];
  const now = Date.now();
  let idCounter = 0;

  const activeAppliances = DEMO_APPLIANCES.filter(a => a.ativo);

  for (const app of activeAppliances) {
    const intervaloMinutos = Math.max(1, Math.round((24 / app.horasPorDia) * 2));
    const leiturasPorDia = Math.min(24, Math.max(1, Math.round(app.horasPorDia * 2)));

    // 30 days of readings
    for (let day = 0; day < 30; day++) {
      for (let leitura = 0; leitura < leiturasPorDia; leitura++) {
        const variacao = 0.8 + Math.random() * 0.4;
        const currentPower = app.potencia * variacao;
        const voltage = 127;
        const current = currentPower / voltage;
        const kwh = (currentPower * (24 / leiturasPorDia)) / 1000;
        const cost = kwh * APPLIANCE_TARIFF;

        const timestamp = new Date(now - (day * 86400000) - ((leiturasPorDia - leitura) * (86400000 / leiturasPorDia))).toISOString();

        readings.push({
          id: `demo-reading-${idCounter++}`,
          applianceId: app.id,
          applianceName: app.nome,
          current: Number(current.toFixed(2)),
          voltage,
          power: Number(currentPower.toFixed(0)),
          kwh: Number(kwh.toFixed(4)),
          cost: Number(cost.toFixed(4)),
          timestamp,
        });
      }
    }
  }

  return readings.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

const DEMO_READINGS = generateDemoReadings();

function getConsumptionByAppliance(): { name: string; consumption: number; percentage: number }[] {
  const map = new Map<string, number>();
  let total = 0;

  for (const r of DEMO_READINGS) {
    const key = r.applianceName;
    map.set(key, (map.get(key) || 0) + r.kwh);
    total += r.kwh;
  }

  return Array.from(map.entries())
    .map(([name, consumption]) => ({
      name,
      consumption: Number(consumption.toFixed(2)),
      percentage: total > 0 ? Number(((consumption / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.consumption - a.consumption);
}

const DEMO_INSIGHTS: Insight[] = [
  {
    tipo: 'reducao_uso',
    titulo: 'Reduza o uso do Chuveiro Elétrico',
    descricao: 'Reduzindo 5 minutos por dia no banho você economizaria aproximadamente R$ 24,50 por mês.',
    economiaPotencial: 24.50,
    prioridade: 'alta',
  },
  {
    tipo: 'reducao_uso',
    titulo: 'Otimize o Ar Condicionado',
    descricao: 'Aumentar a temperatura em 2°C pode reduzir o consumo do ar condicionado em até 15%.',
    economiaPotencial: 18.30,
    prioridade: 'alta',
  },
  {
    tipo: 'standby',
    titulo: 'Desligue equipamentos em standby',
    descricao: 'Equipamentos em modo standby podem representar até 15% do consumo residencial.',
    economiaPotencial: 8.40,
    prioridade: 'media',
  },
  {
    tipo: 'troca_eficiente',
    titulo: 'Troque aparelhos antigos',
    descricao: 'Aparelhos com selo Procel A consomem até 40% menos energia que modelos antigos.',
    economiaPotencial: 35.00,
    prioridade: 'baixa',
  },
];

const DEMO_RANKING = getConsumptionByAppliance();

const DEMO_EFFICIENCY_SCORE: EfficiencyScore = {
  score: 72,
  classificacao: 'Bom',
  economiaPotencial: 45.80,
};

const MONTHLY_TOTAL_KWH = DEMO_READINGS
  .filter(r => Date.now() - new Date(r.timestamp).getTime() < 30 * 86400000)
  .reduce((sum, r) => sum + r.kwh, 0);

const MONTHLY_TOTAL_COST = MONTHLY_TOTAL_KWH * APPLIANCE_TARIFF;

const DEMO_REPORT: Report = {
  type: 'monthly',
  period: {
    start: new Date(Date.now() - 30 * 86400000).toISOString(),
    end: new Date().toISOString(),
  },
  totalConsumption: Number(MONTHLY_TOTAL_KWH.toFixed(2)),
  totalCost: Number(MONTHLY_TOTAL_COST.toFixed(2)),
  topConsumer: getConsumptionByAppliance()[0] || null,
  bottomConsumer: getConsumptionByAppliance()[getConsumptionByAppliance().length - 1] || null,
  dailyAverage: Number((MONTHLY_TOTAL_KWH / 30).toFixed(2)),
  applianceStats: getConsumptionByAppliance().map(a => ({
    name: a.name,
    consumption: a.consumption,
    cost: Number((a.consumption * APPLIANCE_TARIFF).toFixed(2)),
    percentage: a.percentage,
  })),
  generatedAt: new Date().toISOString(),
  userName: 'Usuário Demonstração',
};

const DEMO_MONITORING_STATE = {
  aparelhoAtivoId: 'demo-app-3',
  atualizadoEm: new Date().toISOString(),
};

export const demoData = {
  userId: DEMO_USER_ID,
  user: DEMO_USER,
  appliances: DEMO_APPLIANCES,
  fullAppliances: DEMO_APPLIANCES,
  goals: DEMO_GOALS,
  alerts: DEMO_ALERTS,
  readings: DEMO_READINGS,
  ranking: DEMO_RANKING,
  insights: DEMO_INSIGHTS,
  efficiencyScore: DEMO_EFFICIENCY_SCORE,
  report: DEMO_REPORT,
  monitoringState: DEMO_MONITORING_STATE,
  tariff: APPLIANCE_TARIFF,
};

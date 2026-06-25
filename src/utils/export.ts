import { Share, Platform } from 'react-native';
import { ApplianceStat, Report } from '../types';

type ApplianceConfig = {
  name: string;
  power: number;
  hoursPerDay: number;
  costPerKwh: number;
};

export function generateCSV(
  appliances: ApplianceConfig[],
  dailyKwh: number,
  dailyCost: number,
  userName?: string
): string {
  const headers = [
    'Nome do Aparelho',
    'Potência (W)',
    'Horas/Dia',
    'Custo por kWh',
    'Consumo (kWh)',
    'Custo Diário',
  ];

  const rows = appliances.map(app => {
    const kwh = (app.power * app.hoursPerDay) / 1000;
    const cost = kwh * app.costPerKwh;
    return [
      app.name,
      String(app.power),
      String(app.hoursPerDay),
      String(app.costPerKwh.toFixed(2)),
      kwh.toFixed(2),
      cost.toFixed(2),
    ];
  });

  const summaryRows = [
    ['', '', '', '', '', ''],
    ['RESUMO', '', '', '', '', ''],
    ['Consumo Diário Total', '', '', '', dailyKwh.toFixed(2), 'kWh'],
    ['Custo Diário Total', '', '', '', '', `R$ ${dailyCost.toFixed(2)}`],
    [
      'Consumo Mensal Estimado',
      '',
      '',
      '',
      (dailyKwh * 30).toFixed(2),
      'kWh',
    ],
    [
      'Custo Mensal Estimado',
      '',
      '',
      '',
      '',
      `R$ ${(dailyCost * 30).toFixed(2)}`,
    ],
  ];

  const headerRow = headers.join(',');
  const dataRows = rows.map(row => row.join(',')).join('\n');
  const summaryRowsStr = summaryRows.map(row => row.join(',')).join('\n');

  const timestamp = new Date().toLocaleString('pt-BR');
  const userInfo = userName ? `Usuário: ${userName}\n` : '';

  return `${userInfo}Data de Exportação: ${timestamp}\n\n${headerRow}\n${dataRows}\n${summaryRowsStr}`;
}

export function generateAdvancedCSV(report: Report): string {
  const lines: string[] = [];

  lines.push('Relatório de Consumo de Energia - EcoPower');
  if (report.userName) lines.push(`Usuário: ${report.userName}`);
  lines.push(`Data de Geração: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`);
  lines.push(`Período: ${new Date(report.period.start).toLocaleDateString('pt-BR')} a ${new Date(report.period.end).toLocaleDateString('pt-BR')}`);
  lines.push(`Tipo: ${report.type}`);
  lines.push('');

  lines.push('RESUMO EXECUTIVO');
  lines.push(`Consumo Total,${report.totalConsumption.toFixed(2)},kWh`);
  lines.push(`Custo Total,R$ ${report.totalCost.toFixed(2)}`);
  lines.push(`Média Diária,${report.dailyAverage.toFixed(2)},kWh`);
  if (report.topConsumer) {
    lines.push(`Maior Consumidor,${report.topConsumer.name},${report.topConsumer.percentage.toFixed(1)}%`);
  }
  if (report.bottomConsumer) {
    lines.push(`Menor Consumidor,${report.bottomConsumer.name},${report.bottomConsumer.percentage.toFixed(1)}%`);
  }
  lines.push('');

  lines.push('ESTATÍSTICAS POR APARELHO');
  lines.push('Aparelho,Consumo (kWh),Custo (R$),Participação (%)');
  for (const stat of report.applianceStats) {
    lines.push(
      `${stat.name},${stat.consumption.toFixed(2)},${stat.cost.toFixed(2)},${stat.percentage.toFixed(1)}`
    );
  }

  return lines.join('\n');
}

export async function shareReport(content: string, title: string) {
  try {
    await Share.share({
      message: content,
      title: title,
    });
  } catch (error) {
    console.error('Erro ao compartilhar relatório:', error);
    throw error;
  }
}

export function checkHighConsumption(
  appliances: ApplianceConfig[],
  dailyCost: number,
  thresholdPercentage: number = 0.8
): {
  isHighConsumption: boolean;
  message: string;
  highConsumers: ApplianceConfig[];
} {
  const monthlyEstimate = dailyCost * 30;
  const referenceValue = 300;
  const threshold = referenceValue * thresholdPercentage;

  const highConsumers = appliances.filter(app => {
    const appCost = (app.power * app.hoursPerDay / 1000) * app.costPerKwh;
    return appCost > 1.5;
  });

  return {
    isHighConsumption: monthlyEstimate > threshold,
    message:
      monthlyEstimate > threshold
        ? `Consumo alto detectado! Estimativa mensal: R$ ${monthlyEstimate.toFixed(2)} (acima de R$ ${threshold.toFixed(2)})`
        : `Seu consumo está normal. Estimativa mensal: R$ ${monthlyEstimate.toFixed(2)}`,
    highConsumers,
  };
}

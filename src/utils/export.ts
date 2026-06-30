import { Share, Platform } from 'react-native';
import { ApplianceStat, Report } from '../types';

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

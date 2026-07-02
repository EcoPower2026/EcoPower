import { cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Report } from '../types';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateAdvancedCSV(report: Report): string {
  const lines: string[] = [];

  lines.push('Relatório de Consumo de Energia - EcoPower');
  if (report.userName) lines.push(`Usuário: ${escapeCSV(report.userName)}`);
  lines.push(`Data de Geração,${new Date(report.generatedAt).toLocaleString('pt-BR')}`);
  lines.push(`Período,${new Date(report.period.start).toLocaleDateString('pt-BR')} a ${new Date(report.period.end).toLocaleDateString('pt-BR')}`);
  lines.push(`Tipo,${report.type}`);
  lines.push('');

  lines.push('RESUMO EXECUTIVO');
  lines.push(`Consumo Total,${report.totalConsumption.toFixed(2)},kWh`);
  lines.push(`Custo Total,R$ ${report.totalCost.toFixed(2)}`);
  lines.push(`Média Diária,${report.dailyAverage.toFixed(2)},kWh`);
  if (report.topConsumer) {
    lines.push(`Maior Consumidor,${escapeCSV(report.topConsumer.name)},${report.topConsumer.percentage.toFixed(1)}%`);
  }
  if (report.bottomConsumer) {
    lines.push(`Menor Consumidor,${escapeCSV(report.bottomConsumer.name)},${report.bottomConsumer.percentage.toFixed(1)}%`);
  }
  lines.push('');

  lines.push('ESTATÍSTICAS POR APARELHO');
  lines.push('Aparelho,Consumo (kWh),Custo (R$),Participação (%)');
  for (const stat of report.applianceStats) {
    lines.push(`${escapeCSV(stat.name)},${stat.consumption.toFixed(2)},${stat.cost.toFixed(2)},${stat.percentage.toFixed(1)}`);
  }

  lines.push('');
  lines.push(`Gerado por EcoPower — ${new Date(report.generatedAt).toLocaleString('pt-BR')}`);

  return '\uFEFF' + lines.join('\n');
}

export async function shareReport(content: string, title: string) {
  const fileName = `EcoPower_${title.replace(/\s+/g, '_')}.csv`;
  const fileUri = cacheDirectory + fileName;

  await writeAsStringAsync(fileUri, content, {
    encoding: EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `Exportar ${title}`,
    });
  } else if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

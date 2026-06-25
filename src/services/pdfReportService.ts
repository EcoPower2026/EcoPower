import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { cacheDirectory, readAsStringAsync, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { Report, PeriodComparison, Forecast, EfficiencyScore, Insight, Goal } from '../types';

export interface PDFReportData {
  report: Report;
  comparison: { month: PeriodComparison; week: PeriodComparison } | null;
  forecast: Forecast | null;
  insights: {
    topConsumers: { name: string; consumption: number; percentage: number }[];
    efficiencyScore: EfficiencyScore;
    recommendations: Insight[];
  } | null;
  goals: Goal[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getMonthName(date: Date): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[date.getMonth()];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')} de ${getMonthName(d)} de ${d.getFullYear()}`;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

function getEfficiencyColor(classificacao: string): string {
  switch (classificacao) {
    case 'Excelente': return '#2ECC71';
    case 'Bom': return '#7ED957';
    case 'Regular': return '#F39C12';
    case 'Crítico': return '#E74C3C';
    default: return '#7B8CA5';
  }
}

function getPriorityColor(prioridade: string): string {
  switch (prioridade) {
    case 'alta': return '#E74C3C';
    case 'media': return '#F39C12';
    case 'baixa': return '#2ECC71';
    default: return '#7B8CA5';
  }
}

function getPriorityLabel(prioridade: string): string {
  switch (prioridade) {
    case 'alta': return 'Alta Prioridade';
    case 'media': return 'Média Prioridade';
    case 'baixa': return 'Baixa Prioridade';
    default: return '';
  }
}

function generateConsumptionChart(stats: { name: string; consumption: number; percentage: number }[]): string {
  if (stats.length === 0) return '';
  const maxConsumption = Math.max(...stats.map(s => s.consumption), 1);
  const barH = 26;
  const gap = 10;
  const h = stats.length * (barH + gap) + 20;
  const labelW = 130;
  const maxBarW = 320;
  let bars = '';
  stats.forEach((s, i) => {
    const y = i * (barH + gap) + 10;
    const bw = (s.consumption / maxConsumption) * maxBarW;
    const pct = s.percentage.toFixed(1);
    bars += `
      <text x="0" y="${y + barH - 7}" font-family="Poppins, sans-serif" font-size="11" fill="#475569">${escapeHtml(s.name)}</text>
      <rect x="${labelW}" y="${y}" width="${bw}" height="${barH}" rx="4" fill="#3498DB" opacity="0.85"/>
      <text x="${labelW + bw + 8}" y="${y + barH - 7}" font-family="Poppins, sans-serif" font-size="11" fill="#1E293B" font-weight="bold">${formatNumber(s.consumption, 1)} kWh (${pct}%)</text>
    `;
  });
  return `<svg width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

function generateComparisonChart(comparison: PeriodComparison): string {
  const { currentPeriod, previousPeriod, variation } = comparison;
  const maxVal = Math.max(currentPeriod.consumption, previousPeriod.consumption, 1);
  const barW = 60;
  const gap = 12;
  const chartH = 200;
  const chartW = 180;
  const bottomMargin = 30;
  const maxBarH = chartH - bottomMargin - 30;
  const curH = (currentPeriod.consumption / maxVal) * maxBarH;
  const prevH = (previousPeriod.consumption / maxVal) * maxBarH;
  return `
    <svg width="${chartW}" height="${chartH}" xmlns="http://www.w3.org/2000/svg">
      <text x="${chartW / 2}" y="${chartH - 2}" font-family="Poppins, sans-serif" font-size="10" fill="#7B8CA5" text-anchor="middle">${comparison.periodType === 'month' ? 'Comparativo Mensal' : 'Comparativo Semanal'}</text>
      <rect x="20" y="${chartH - bottomMargin - curH}" width="${barW}" height="${curH}" rx="4" fill="#2ECC71"/>
      <text x="${20 + barW / 2}" y="${chartH - bottomMargin - curH - 6}" font-family="Poppins, sans-serif" font-size="10" fill="#2ECC71" text-anchor="middle" font-weight="bold">${formatNumber(currentPeriod.consumption, 1)}</text>
      <text x="${20 + barW / 2}" y="${chartH - 10}" font-family="Poppins, sans-serif" font-size="9" fill="#475569" text-anchor="middle">Atual</text>
      <rect x="${20 + barW + gap}" y="${chartH - bottomMargin - prevH}" width="${barW}" height="${prevH}" rx="4" fill="#9CAFC4"/>
      <text x="${20 + barW + gap + barW / 2}" y="${chartH - bottomMargin - prevH - 6}" font-family="Poppins, sans-serif" font-size="10" fill="#9CAFC4" text-anchor="middle" font-weight="bold">${formatNumber(previousPeriod.consumption, 1)}</text>
      <text x="${20 + barW + gap + barW / 2}" y="${chartH - 10}" font-family="Poppins, sans-serif" font-size="9" fill="#475569" text-anchor="middle">Anterior</text>
      <text x="${chartW - 5}" y="12" font-family="Poppins, sans-serif" font-size="10" fill="#7B8CA5" text-anchor="end">kWh</text>
    </svg>
  `;
}

function generateGoalProgressBar(progress: number, target: number): string {
  const pct = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  const barW = 300;
  const barH = 18;
  return `
    <div style="display:flex;align-items:center;gap:10px;">
      <svg width="${barW}" height="${barH + 10}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#2ECC71"/>
            <stop offset="100%" stop-color="#7ED957"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${barW}" height="${barH}" rx="9" fill="#E2E8F0"/>
        <rect x="0" y="0" width="${(pct / 100) * barW}" height="${barH}" rx="9" fill="url(#barGrad)"/>
        <text x="${barW / 2}" y="${barH / 2 + 5}" font-family="Poppins, sans-serif" font-size="10" fill="${pct > 30 ? '#FFFFFF' : '#1E293B'}" text-anchor="middle" font-weight="bold">${pct.toFixed(0)}%</text>
      </svg>
      <span style="font-size:12px;color:#475569;font-weight:600;">${formatNumber(progress, 1)} / ${formatNumber(target, 1)}</span>
    </div>
  `;
}

function generateEfficiencyGauge(score: number): string {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const cx = 50;
  const cy = 50;
  return `
    <svg width="120" height="110" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="8"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2ECC71" stroke-width="8" stroke-dasharray="${filled} ${circ - filled}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy}" font-family="Poppins, sans-serif" font-size="22" fill="#1E293B" text-anchor="middle" font-weight="bold" dy="6">${score}</text>
      <text x="${cx}" y="${cy + 24}" font-family="Poppins, sans-serif" font-size="9" fill="#7B8CA5" text-anchor="middle">/ 100</text>
    </svg>
  `;
}

function generateCoverWaves(): string {
  return `
    <svg style="position:absolute;bottom:0;left:0;width:100%;height:240px;" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="rgba(46,204,113,0.08)" d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,165.3C960,139,1056,117,1152,122.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"/>
      <path fill="rgba(52,152,219,0.06)" d="M0,256L48,245.3C96,235,192,213,288,213.3C384,213,480,235,576,224C672,213,768,171,864,149.3C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"/>
      <path fill="rgba(46,204,113,0.04)" d="M0,288L48,277.3C96,267,192,245,288,240C384,235,480,245,576,256C672,267,768,277,864,266.7C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"/>
    </svg>
  `;
}

function generateConclusionText(data: PDFReportData): string {
  const { report, comparison, insights, forecast, goals } = data;
  const parts: string[] = [];
  const monthName = getMonthName(new Date(report.generatedAt));

  if (comparison) {
    const { month } = comparison;
    const absPct = Math.abs(month.variation.consumptionPercent);
    if (month.variation.isSavings) {
      parts.push(`O consumo energético apresentou redução de ${formatNumber(absPct, 1)}% em ${comparison.month.periodType === 'month' ? 'comparação ao mês anterior' : 'relação à semana anterior'}.`);
    } else if (absPct > 0) {
      parts.push(`O consumo energético apresentou aumento de ${formatNumber(absPct, 1)}% em relação ao período anterior.`);
    } else {
      parts.push(`O consumo energético manteve-se estável em comparação ao período anterior.`);
    }
  } else {
    parts.push(`Durante o mês de ${monthName}, o consumo total registrado foi de ${formatNumber(report.totalConsumption, 1)} kWh, com custo total de ${formatCurrency(report.totalCost)}.`);
  }

  if (insights && insights.efficiencyScore.economiaPotencial > 0) {
    parts.push(`Existe potencial estimado de economia de ${formatCurrency(insights.efficiencyScore.economiaPotencial)} por mês, com base na otimização do uso dos aparelhos.`);
  }

  if (insights) {
    const { classificacao } = insights.efficiencyScore;
    parts.push(`O usuário mantém eficiência energética classificada como <strong>${classificacao}</strong>.`);
  }

  if (report.topConsumer) {
    parts.push(`O maior consumidor de energia é <strong>${escapeHtml(report.topConsumer.name)}</strong>, responsável por ${formatNumber(report.topConsumer.percentage, 1)}% do consumo total.`);
  }

  if (forecast && forecast.projectedConsumption > 0) {
    parts.push(`A previsão para o mês é de ${formatNumber(forecast.projectedConsumption, 1)} kWh, com custo estimado de ${formatCurrency(forecast.projectedCost)}.`);
  }

  const activeGoals = goals.filter(g => g.ativa);
  if (activeGoals.length > 0) {
    parts.push(`O sistema possui ${activeGoals.length} meta(s) ativa(s) de economia de energia atualmente.`);
  }

  parts.push(`Este relatório foi gerado automaticamente pelo sistema <strong>EcoPower Smart Energy Monitoring</strong> na data de ${formatDate(report.generatedAt)}.`);

  return parts.join(' ');
}

function buildHTML(data: PDFReportData): string {
  const { report, comparison, forecast, insights, goals } = data;
  const formattedDate = formatDate(report.generatedAt);
  const monthName = getMonthName(new Date(report.generatedAt));
  const year = new Date(report.generatedAt).getFullYear();
  const userName = report.userName || 'Usuário EcoPower';

  const totalConsumption = report.totalConsumption;
  const totalCost = report.totalCost;
  const dailyAverage = report.dailyAverage;

  const monthComparison = comparison?.month ?? null;
  const weekComparison = comparison?.week ?? null;
  const monthVar = monthComparison?.variation ?? null;
  const weekVar = weekComparison?.variation ?? null;

  const efficiencyScore = insights?.efficiencyScore ?? null;
  const topConsumers = insights?.topConsumers ?? [];
  const recommendations = insights?.recommendations ?? [];

  const activeGoal = goals.find(g => g.ativa) ?? null;
  const forecastData = forecast ?? null;

  const economyAmount = monthVar?.isSavings ? Math.abs(monthVar.consumptionDiff) * (report.totalCost / (report.totalConsumption || 1)) : 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório EcoPower - ${monthName} ${year}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Poppins', sans-serif;
    color: #1E293B;
    background: #F5F7FA;
    line-height: 1.5;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 16mm 18mm 16mm;
    position: relative;
    background: #FFFFFF;
    page-break-after: always;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }

  /* COVER */
  .cover-page {
    background: linear-gradient(150deg, #08111F 0%, #0E1A2B 40%, #132238 100%);
    color: #FFFFFF;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 30mm 20mm;
    position: relative;
    overflow: hidden;
  }
  .cover-glow {
    position: absolute;
    top: -40%;
    right: -20%;
    width: 70%;
    height: 70%;
    background: radial-gradient(circle, rgba(46,204,113,0.12) 0%, transparent 70%);
    border-radius: 50%;
  }
  .cover-glow-2 {
    position: absolute;
    bottom: -30%;
    left: -15%;
    width: 50%;
    height: 50%;
    background: radial-gradient(circle, rgba(52,152,219,0.08) 0%, transparent 70%);
    border-radius: 50%;
  }
  .cover-content { position: relative; z-index: 1; }
  .cover-icon {
    width: 80px;
    height: 80px;
    border-radius: 40px;
    background: linear-gradient(135deg, #2ECC71, #3498DB);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px auto;
    font-size: 36px;
    line-height: 1;
  }
  .cover-logo {
    font-size: 48px;
    font-weight: 800;
    letter-spacing: 3px;
    margin-bottom: 2px;
    background: linear-gradient(135deg, #2ECC71, #3498DB);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .cover-subtitle {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 6px;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 24px;
  }
  .cover-divider {
    width: 50px;
    height: 3px;
    background: #2ECC71;
    margin: 0 auto 24px auto;
    border-radius: 2px;
  }
  .cover-title {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 36px;
    opacity: 0.95;
  }
  .cover-info { font-size: 13px; opacity: 0.75; line-height: 2; }
  .cover-info strong { font-weight: 700; opacity: 1; }
  .cover-footer {
    position: absolute;
    bottom: 18mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 10px;
    opacity: 0.5;
    line-height: 1.8;
    z-index: 1;
  }

  /* HEADER */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 2px solid #2ECC71;
    margin-bottom: 16px;
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 8px; }
  .header-logo {
    font-size: 14px;
    font-weight: 800;
    color: #2ECC71;
    letter-spacing: 1px;
  }
  .header-divider {
    color: #CBD5E1;
    font-size: 14px;
    font-weight: 300;
  }
  .header-subtitle {
    font-size: 11px;
    color: #7B8CA5;
    font-weight: 500;
  }
  .header-right { font-size: 9px; color: #94A3B8; }

  /* TITLE */
  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  .page-subtitle {
    font-size: 12px;
    color: #7B8CA5;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  /* KPI CARDS */
  .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; flex-shrink: 0; }
  .kpi-card {
    flex: 1 1 calc(33.33% - 10px);
    min-width: 140px;
    background: #FFFFFF;
    border-radius: 20px;
    padding: 18px 16px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.10);
    text-align: center;
  }
  .kpi-value { font-size: 20px; font-weight: 800; color: #2ECC71; margin-bottom: 4px; }
  .kpi-label { font-size: 10px; color: #7B8CA5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-trend { font-size: 9px; color: #94A3B8; margin-top: 2px; }
  .kpi-card.highlight {
    background: linear-gradient(135deg, #132238, #1A3150);
    color: #FFFFFF;
  }
  .kpi-card.highlight .kpi-value { color: #7ED957; }
  .kpi-card.highlight .kpi-label { color: rgba(255,255,255,0.7); }
  .kpi-card.highlight .kpi-trend { color: rgba(255,255,255,0.5); }

  /* SECTION */
  .section { margin-bottom: 14px; flex-shrink: 0; }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 8px;
    padding-left: 10px;
    border-left: 3px solid #2ECC71;
  }
  .section-content { padding: 0 2px; }

  /* TABLES */
  .data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
  .data-table thead th {
    background: #0E1A2B;
    color: #FFFFFF;
    font-weight: 700;
    padding: 9px 10px;
    text-align: left;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .data-table thead th:first-child { border-radius: 12px 0 0 0; }
  .data-table thead th:last-child { border-radius: 0 12px 0 0; }
  .data-table tbody td { padding: 7px 10px; border-bottom: 1px solid #F1F5F9; color: #475569; }
  .data-table tbody tr:nth-child(even) { background: #F8FAFC; }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tfoot td {
    padding: 8px 10px;
    background: #F0FDF4;
    font-weight: 700;
    color: #2ECC71;
    border-top: 2px solid #2ECC71;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  /* COMPARISON */
  .comparison-grid { display: flex; gap: 10px; margin-bottom: 8px; }
  .comparison-card {
    flex: 1;
    background: #FFFFFF;
    border-radius: 20px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
    padding: 14px;
  }
  .comparison-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #E2E8F0;
  }
  .comparison-label { font-size: 11px; font-weight: 700; color: #1E293B; }
  .comparison-badge { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .badge-success { background: #DCFCE7; color: #2ECC71; }
  .badge-warning { background: #FEF3C7; color: #F39C12; }
  .badge-danger { background: #FEE2E2; color: #E74C3C; }
  .comparison-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
  .comparison-row .label { color: #7B8CA5; }
  .comparison-row .value { font-weight: 600; color: #1E293B; }
  .comparison-row .value.positive { color: #2ECC71; }
  .comparison-row .value.negative { color: #E74C3C; }
  .comparison-message {
    margin-top: 8px;
    padding: 6px 10px;
    background: #F0FDF4;
    border-radius: 12px;
    font-size: 10px;
    color: #2ECC71;
    font-weight: 500;
    border-left: 3px solid #2ECC71;
  }
  .chart-container { display: flex; justify-content: center; margin: 8px 0; }

  /* GOALS */
  .forecast-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F1F5F9; font-size: 11px; }
  .forecast-row:last-child { border-bottom: none; }
  .forecast-row .label { color: #7B8CA5; }
  .forecast-row .value { font-weight: 600; color: #1E293B; }
  .goal-card {
    background: #F0FDF4;
    border-radius: 20px;
    border: 1px solid #BBF7D0;
    padding: 14px;
    margin-bottom: 8px;
  }
  .goal-title { font-size: 13px; font-weight: 700; color: #2ECC71; margin-bottom: 6px; }
  .progress-container { margin: 6px 0; }
  .goal-stats { display: flex; gap: 12px; margin-top: 6px; font-size: 10px; color: #475569; }
  .goal-stats span { display: flex; align-items: center; gap: 3px; }
  .goal-stats .stat-value { font-weight: 700; color: #1E293B; }

  /* INSIGHTS */
  .insight-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
  .insight-card {
    flex: 1 1 calc(50% - 8px);
    min-width: 180px;
    background: #132238;
    border-radius: 20px;
    padding: 14px;
    color: #FFFFFF;
  }
  .insight-priority {
    display: inline-block;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 10px;
    margin-bottom: 4px;
  }
  .insight-title { font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 3px; }
  .insight-desc { font-size: 10px; color: #B8C5D6; line-height: 1.5; }
  .insight-savings { margin-top: 4px; font-size: 10px; font-weight: 700; color: #7ED957; }

  .efficiency-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #FFFFFF;
    border-radius: 20px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
    padding: 14px;
    margin-bottom: 8px;
  }
  .efficiency-info { flex: 1; }
  .efficiency-info h3 { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 3px; }
  .efficiency-class { font-size: 16px; font-weight: 800; margin-bottom: 3px; }
  .efficiency-potential { font-size: 11px; color: #7B8CA5; }
  .efficiency-potential strong { color: #2ECC71; }

  .top-consumers-list { margin: 6px 0; }
  .top-consumer-row { display: flex; align-items: center; gap: 6px; padding: 5px 0; border-bottom: 1px solid #F1F5F9; font-size: 11px; }
  .top-consumer-row:last-child { border-bottom: none; }
  .top-consumer-rank {
    width: 20px; height: 20px; border-radius: 50%;
    background: #2ECC71; color: #FFFFFF;
    font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .top-consumer-rank.rank-2 { background: #7ED957; }
  .top-consumer-rank.rank-3 { background: #3498DB; }
  .top-consumer-name { flex: 1; font-weight: 600; color: #1E293B; }
  .top-consumer-pct { font-weight: 700; color: #2ECC71; min-width: 40px; text-align: right; }
  .top-consumer-kwh { color: #7B8CA5; min-width: 55px; text-align: right; }

  /* CONCLUSION */
  .conclusion-text {
    font-size: 12px;
    color: #475569;
    line-height: 2;
    text-align: justify;
    padding: 14px;
    background: #F8FAFC;
    border-radius: 20px;
  }
  .conclusion-text strong { color: #2ECC71; }
  .conclusion-highlight {
    background: #F0FDF4;
    border-left: 4px solid #2ECC71;
    padding: 10px 14px;
    margin-top: 12px;
    border-radius: 0 12px 12px 0;
    font-size: 11px;
    color: #1E293B;
  }
  .conclusion-highlight strong { color: #2ECC71; }

  /* FOOTER */
  .page-footer {
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    color: #94A3B8;
    flex-shrink: 0;
  }
  .page-footer .footer-left { font-weight: 700; color: #2ECC71; }
  .page-footer .footer-right { text-align: right; }

  .no-data { color: #94A3B8; font-style: italic; font-size: 11px; padding: 10px; text-align: center; }
  .flex-grow { flex: 1; }
  .row { display: flex; gap: 10px; margin-bottom: 10px; }
  .col { flex: 1; }
  .info-box {
    background: #FFFFFF;
    border-radius: 20px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
    padding: 10px 12px;
    margin-bottom: 6px;
  }
  .info-box .info-label { font-size: 9px; color: #7B8CA5; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 1px; }
  .info-box .info-value { font-size: 14px; font-weight: 800; color: #1E293B; }
  .info-box .info-value.green { color: #2ECC71; }
  .stats-row { display: flex; gap: 8px; margin-top: 10px; }
  .stat-chip {
    flex: 1;
    text-align: center;
    padding: 8px;
    background: #F0FDF4;
    border-radius: 14px;
  }
  .stat-chip .chip-value { font-size: 14px; font-weight: 800; color: #2ECC71; }
  .stat-chip .chip-label { font-size: 8px; color: #7B8CA5; text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px; margin-top: 1px; }
  .variation-up { color: #E74C3C; }
  .variation-down { color: #2ECC71; }
  .variation-neutral { color: #7B8CA5; }
  .flex-0-6 { flex: 0.6; }
</style>
</head>
<body>

<!-- ==================== COVER PAGE ==================== -->
<div class="page cover-page">
  <div class="cover-glow"></div>
  <div class="cover-glow-2"></div>
  <div class="cover-content">
    <div class="cover-icon">⚡</div>
    <div class="cover-logo">EcoPower</div>
    <div class="cover-subtitle">Smart Energy Monitoring</div>
    <div class="cover-divider"></div>
    <div class="cover-title">Relatório Inteligente<br>de Consumo Energético</div>
    <div class="cover-info">
      <p>Preparado para: <strong>${escapeHtml(userName)}</strong></p>
      <p>Data de geração: ${formattedDate}</p>
    </div>
  </div>
  ${generateCoverWaves()}
  <div class="cover-footer">
    <p>© ${year} EcoPower — Monitoramento Inteligente de Energia</p>
  </div>
</div>

<!-- ==================== PAGE 1: EXECUTIVE SUMMARY ==================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="header-logo">⚡ EcoPower</span>
      <span class="header-divider">|</span>
      <span class="header-subtitle">Relatório de Consumo Energético</span>
    </div>
    <div class="header-right">${formattedDate} | v1.0</div>
  </div>

  <h2 class="page-title">Resumo Executivo</h2>
  <p class="page-subtitle">Visão geral do consumo energético — ${formatDate(report.period.start)} a ${formatDate(report.period.end)}</p>

  <div class="kpi-grid">
    <div class="kpi-card highlight">
      <div class="kpi-value">${formatNumber(totalConsumption, 1)} kWh</div>
      <div class="kpi-label">Consumo Total</div>
      <div class="kpi-trend">no período analisado</div>
    </div>
    <div class="kpi-card highlight">
      <div class="kpi-value">${formatCurrency(totalCost)}</div>
      <div class="kpi-label">Custo Total</div>
      <div class="kpi-trend">no período analisado</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${efficiencyScore ? `${efficiencyScore.score}` : '---'}</div>
      <div class="kpi-label">Eficiência</div>
      <div class="kpi-trend">${efficiencyScore ? escapeHtml(efficiencyScore.classificacao) : 'não disponível'}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value" style="color:${getEfficiencyColor(efficiencyScore?.classificacao || '')}">
        ${efficiencyScore ? escapeHtml(efficiencyScore.classificacao) : '---'}
      </div>
      <div class="kpi-label">Classificação</div>
      <div class="kpi-trend">eficiência energética</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${formatNumber(dailyAverage, 2)} kWh</div>
      <div class="kpi-label">Média Diária</div>
      <div class="kpi-trend">consumo por dia</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${forecastData ? formatNumber(forecastData.projectedConsumption, 1) + ' kWh' : '---'}</div>
      <div class="kpi-label">Previsão Mensal</div>
      <div class="kpi-trend">${forecastData ? formatCurrency(forecastData.projectedCost) : 'não disponível'}</div>
    </div>
  </div>

  ${monthVar ? `
  <div class="row" style="margin-top:2px;">
    <div class="col">
      <div class="comparison-card" style="margin:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;">
          <span style="font-size:11px;font-weight:700;color:#1E293B;">Comparativo Mensal</span>
          <span class="comparison-badge ${monthVar.isSavings ? 'badge-success' : Math.abs(monthVar.consumptionPercent) > 10 ? 'badge-danger' : 'badge-warning'}">
            ${monthVar.isSavings ? '▼ Economia' : '▲ Aumento'}
          </span>
        </div>
        <div class="comparison-row"><span class="label">Variação consumo:</span><span class="value ${monthVar.consumptionPercent < 0 ? 'positive' : monthVar.consumptionPercent > 0 ? 'negative' : ''}">${monthVar.consumptionPercent >= 0 ? '+' : ''}${formatNumber(monthVar.consumptionPercent, 1)}%</span></div>
        <div class="comparison-row"><span class="label">Variação custo:</span><span class="value ${monthVar.costPercent < 0 ? 'positive' : monthVar.costPercent > 0 ? 'negative' : ''}">${monthVar.costPercent >= 0 ? '+' : ''}${formatNumber(monthVar.costPercent, 1)}%</span></div>
        ${monthVar.isSavings ? `<div class="comparison-row"><span class="label">Economia estimada:</span><span class="value positive">${formatCurrency(Math.abs(monthVar.costDiff))}</span></div>` : ''}
        <div class="comparison-message">${escapeHtml(monthComparison!.message)}</div>
      </div>
    </div>
    <div class="col">
      <div class="comparison-card" style="margin:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;">
          <span style="font-size:11px;font-weight:700;color:#1E293B;">Comparativo Semanal</span>
          <span class="comparison-badge ${weekVar?.isSavings ? 'badge-success' : 'badge-warning'}">${weekVar?.isSavings ? '▼ Economia' : '▲ Aumento'}</span>
        </div>
        <div class="comparison-row"><span class="label">Variação:</span><span class="value ${weekVar && weekVar.consumptionPercent < 0 ? 'positive' : weekVar && weekVar.consumptionPercent > 0 ? 'negative' : ''}">${weekVar ? `${weekVar.consumptionPercent >= 0 ? '+' : ''}${formatNumber(weekVar.consumptionPercent, 1)}%` : '---'}</span></div>
        <div class="comparison-row"><span class="label">Atual:</span><span class="value">${formatNumber(weekComparison?.currentPeriod.consumption ?? 0, 1)} kWh</span></div>
        <div class="comparison-row"><span class="label">Anterior:</span><span class="value">${formatNumber(weekComparison?.previousPeriod.consumption ?? 0, 1)} kWh</span></div>
        ${weekComparison ? `<div class="comparison-message">${escapeHtml(weekComparison.message)}</div>` : ''}
      </div>
    </div>
  </div>
  ` : ''}

  <div class="page-footer">
    <span class="footer-left">⚡ EcoPower</span>
    <span>${formattedDate}</span>
    <span class="footer-right">Página 2<br><span style="font-size:7px;">Documento gerado automaticamente pelo sistema EcoPower.</span></span>
  </div>
</div>

<!-- ==================== PAGE 2: CONSUMPTION ==================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="header-logo">⚡ EcoPower</span>
      <span class="header-divider">|</span>
      <span class="header-subtitle">Relatório de Consumo Energético</span>
    </div>
    <div class="header-right">${formattedDate} | v1.0</div>
  </div>

  <h2 class="page-title">Análise de Consumo</h2>
  <p class="page-subtitle">Detalhamento do consumo por aparelho — ${formatDate(report.period.start)} a ${formatDate(report.period.end)}</p>

  <table class="data-table">
    <thead><tr><th>Aparelho</th><th class="text-right">Consumo (kWh)</th><th class="text-right">Custo (R$)</th><th class="text-right">Participação</th></tr></thead>
    <tbody>
      ${report.applianceStats.map(stat => `
      <tr>
        <td>${escapeHtml(stat.name)}</td>
        <td class="text-right">${formatNumber(stat.consumption, 2)}</td>
        <td class="text-right">${formatCurrency(stat.cost)}</td>
        <td class="text-right">${formatNumber(stat.percentage, 1)}%</td>
      </tr>`).join('')}
      ${report.applianceStats.length === 0 ? '<tr><td colspan="4" class="text-center no-data" style="padding:20px;">Nenhum dado de consumo disponível para o período.</td></tr>' : ''}
    </tbody>
    <tfoot>
      <tr><td>TOTAL</td><td class="text-right">${formatNumber(totalConsumption, 2)} kWh</td><td class="text-right">${formatCurrency(totalCost)}</td><td class="text-right">100%</td></tr>
    </tfoot>
  </table>

  ${report.applianceStats.length > 0 ? `
  <div class="section">
    <div class="section-title">Gráfico de Consumo</div>
    <div class="section-content">
      <div class="chart-container">${generateConsumptionChart(report.applianceStats)}</div>
    </div>
  </div>` : ''}

  <div class="stats-row">
    <div class="stat-chip"><div class="chip-value">${formatNumber(totalConsumption, 1)} kWh</div><div class="chip-label">Total</div></div>
    <div class="stat-chip"><div class="chip-value">${formatCurrency(totalCost)}</div><div class="chip-label">Gasto</div></div>
    <div class="stat-chip"><div class="chip-value">${formatNumber(dailyAverage, 2)} kWh</div><div class="chip-label">Média</div></div>
    ${report.topConsumer ? `<div class="stat-chip"><div class="chip-value">${formatNumber(report.topConsumer.percentage, 1)}%</div><div class="chip-label">Maior</div></div>` : ''}
  </div>

  <div class="page-footer">
    <span class="footer-left">⚡ EcoPower</span>
    <span>${formattedDate}</span>
    <span class="footer-right">Página 3<br><span style="font-size:7px;">Documento gerado automaticamente pelo sistema EcoPower.</span></span>
  </div>
</div>

<!-- ==================== PAGE 3: COMPARISON ==================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="header-logo">⚡ EcoPower</span>
      <span class="header-divider">|</span>
      <span class="header-subtitle">Relatório de Consumo Energético</span>
    </div>
    <div class="header-right">${formattedDate} | v1.0</div>
  </div>

  <h2 class="page-title">Comparação de Períodos</h2>
  <p class="page-subtitle">Análise comparativa entre períodos para identificar tendências de consumo.</p>

  ${monthComparison ? `
  <div class="section">
    <div class="section-title">Mês Atual × Mês Anterior</div>
    <div class="section-content">
      <div class="comparison-card">
        <div class="comparison-header">
          <span class="comparison-label">${escapeHtml(monthComparison.currentPeriod.label)} vs ${escapeHtml(monthComparison.previousPeriod.label)}</span>
          <span class="comparison-badge ${monthComparison.variation.isSavings ? 'badge-success' : 'badge-danger'}">
            ${monthComparison.variation.isSavings ? '▼ ' + formatNumber(Math.abs(monthComparison.variation.consumptionPercent), 1) + '%' : '▲ ' + formatNumber(monthComparison.variation.consumptionPercent, 1) + '%'}
          </span>
        </div>
        <div class="row" style="gap:12px;">
          <div class="col">
            <div class="comparison-row"><span class="label">Consumo atual:</span><span class="value">${formatNumber(monthComparison.currentPeriod.consumption, 1)} kWh</span></div>
            <div class="comparison-row"><span class="label">Consumo anterior:</span><span class="value">${formatNumber(monthComparison.previousPeriod.consumption, 1)} kWh</span></div>
            <div class="comparison-row"><span class="label">Diferença:</span><span class="value ${monthComparison.variation.consumptionDiff < 0 ? 'positive' : 'negative'}">${monthComparison.variation.consumptionDiff >= 0 ? '+' : ''}${formatNumber(monthComparison.variation.consumptionDiff, 1)} kWh</span></div>
          </div>
          <div class="col">
            <div class="comparison-row"><span class="label">Custo atual:</span><span class="value">${formatCurrency(monthComparison.currentPeriod.cost)}</span></div>
            <div class="comparison-row"><span class="label">Custo anterior:</span><span class="value">${formatCurrency(monthComparison.previousPeriod.cost)}</span></div>
            <div class="comparison-row"><span class="label">Diferença:</span><span class="value ${monthComparison.variation.costDiff < 0 ? 'positive' : 'negative'}">${monthComparison.variation.costDiff >= 0 ? '+' : ''}${formatCurrency(Math.abs(monthComparison.variation.costDiff))}</span></div>
          </div>
        </div>
        <div class="chart-container">${generateComparisonChart(monthComparison)}</div>
        <div class="comparison-message">${escapeHtml(monthComparison.message)}</div>
      </div>
    </div>
  </div>` : '<p class="no-data">Dados de comparação mensal não disponíveis.</p>'}

  ${weekComparison ? `
  <div class="section">
    <div class="section-title">Semana Atual × Semana Anterior</div>
    <div class="section-content">
      <div class="comparison-card">
        <div class="comparison-header">
          <span class="comparison-label">${escapeHtml(weekComparison.currentPeriod.label)} vs ${escapeHtml(weekComparison.previousPeriod.label)}</span>
          <span class="comparison-badge ${weekComparison.variation.isSavings ? 'badge-success' : 'badge-warning'}">${weekComparison.variation.isSavings ? '▼ Economia' : '▲ Aumento'}</span>
        </div>
        <div class="row" style="gap:12px;">
          <div class="col">
            <div class="comparison-row"><span class="label">Consumo atual:</span><span class="value">${formatNumber(weekComparison.currentPeriod.consumption, 1)} kWh</span></div>
            <div class="comparison-row"><span class="label">Consumo anterior:</span><span class="value">${formatNumber(weekComparison.previousPeriod.consumption, 1)} kWh</span></div>
            <div class="comparison-row"><span class="label">Variação:</span><span class="value ${weekComparison.variation.consumptionPercent < 0 ? 'positive' : 'negative'}">${weekComparison.variation.consumptionPercent >= 0 ? '+' : ''}${formatNumber(weekComparison.variation.consumptionPercent, 1)}%</span></div>
          </div>
          <div class="col">
            <div class="comparison-row"><span class="label">Custo atual:</span><span class="value">${formatCurrency(weekComparison.currentPeriod.cost)}</span></div>
            <div class="comparison-row"><span class="label">Custo anterior:</span><span class="value">${formatCurrency(weekComparison.previousPeriod.cost)}</span></div>
          </div>
        </div>
        <div class="chart-container">${generateComparisonChart(weekComparison)}</div>
        <div class="comparison-message">${escapeHtml(weekComparison.message)}</div>
      </div>
    </div>
  </div>` : ''}

  <div class="page-footer">
    <span class="footer-left">⚡ EcoPower</span>
    <span>${formattedDate}</span>
    <span class="footer-right">Página 4<br><span style="font-size:7px;">Documento gerado automaticamente pelo sistema EcoPower.</span></span>
  </div>
</div>

<!-- ==================== PAGE 4: GOALS & FORECAST ==================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="header-logo">⚡ EcoPower</span>
      <span class="header-divider">|</span>
      <span class="header-subtitle">Relatório de Consumo Energético</span>
    </div>
    <div class="header-right">${formattedDate} | v1.0</div>
  </div>

  <h2 class="page-title">Metas e Previsões</h2>
  <p class="page-subtitle">Acompanhamento das metas de economia e projeções de consumo para o mês de ${getMonthName(new Date())}.</p>

  <div class="row">
    <div class="col">
      <div class="section">
        <div class="section-title">Meta de Consumo</div>
        ${activeGoal ? `
        <div class="goal-card">
          <div class="goal-title">${escapeHtml(activeGoal.titulo)}</div>
          <div class="progress-container">${generateGoalProgressBar(activeGoal.progresso, activeGoal.valorAlvo)}</div>
          <div class="goal-stats">
            <span>Progresso: <span class="stat-value">${formatNumber(activeGoal.progresso, 1)}</span></span>
            <span>Meta: <span class="stat-value">${formatNumber(activeGoal.valorAlvo, 1)}</span></span>
            <span>Restante: <span class="stat-value">${formatNumber(Math.max(0, activeGoal.valorAlvo - activeGoal.progresso), 1)}</span></span>
          </div>
        </div>` : `
        <div class="info-box"><p class="no-data">Nenhuma meta ativa no momento.</p></div>`}
        ${goals.filter(g => !g.ativa).length > 0 ? `<div style="margin-top:6px;"><p style="font-size:10px;color:#94A3B8;">${goals.filter(g => !g.ativa).length} meta(s) inativa(s) não exibida(s).</p></div>` : ''}
      </div>
    </div>
    <div class="col">
      <div class="section">
        <div class="section-title">Previsão Mensal</div>
        ${forecastData ? `
        <div class="info-box"><div class="info-label">Consumo atual</div><div class="info-value green">${formatNumber(forecastData.currentConsumption, 1)} kWh</div></div>
        <div class="info-box"><div class="info-label">Previsão para o mês</div><div class="info-value green">${formatNumber(forecastData.projectedConsumption, 1)} kWh</div></div>
        <div class="info-box"><div class="info-label">Custo projetado</div><div class="info-value green">${formatCurrency(forecastData.projectedCost)}</div></div>
        <div class="info-box"><div class="info-label">Média diária atual</div><div class="info-value" style="font-size:13px;">${formatNumber(forecastData.dailyAverage, 2)} kWh</div></div>` : `
        <div class="info-box"><p class="no-data">Dados de previsão não disponíveis.</p></div>`}
      </div>
    </div>
  </div>

  ${forecastData && forecastData.recommendations.length > 0 ? `
  <div class="section">
    <div class="section-title">Recomendações</div>
    <div class="section-content" style="background:#F8FAFC;border-radius:20px;padding:10px;">
      <ul style="list-style:none;padding:0;">
        ${forecastData.recommendations.map(rec => `
        <li style="padding:3px 0 3px 18px;position:relative;font-size:11px;color:#475569;line-height:1.6;">
          <span style="position:absolute;left:0;top:6px;width:7px;height:7px;border-radius:50%;background:#2ECC71;display:inline-block;"></span>
          ${escapeHtml(rec)}
        </li>`).join('')}
      </ul>
    </div>
  </div>` : ''}

  ${forecastData?.goalComparison ? `
  <div class="section">
    <div class="section-title">Comparação com a Meta</div>
    <div class="section-content">
      <div class="comparison-card">
        <div class="comparison-row"><span class="label">Meta:</span><span class="value">${escapeHtml(forecastData.goalComparison.goalTitle)}</span></div>
        <div class="comparison-row"><span class="label">Valor:</span><span class="value">${formatCurrency(forecastData.goalComparison.goalTarget)}</span></div>
        <div class="comparison-row"><span class="label">Diferença:</span><span class="value ${forecastData.goalComparison.isAbove ? 'negative' : 'positive'}">${forecastData.goalComparison.isAbove ? '+' : ''}${formatCurrency(forecastData.goalComparison.difference)}</span></div>
        <div class="comparison-row"><span class="label">Percentual:</span><span class="value ${forecastData.goalComparison.isAbove ? 'negative' : 'positive'}">${forecastData.goalComparison.isAbove ? '+' : ''}${formatNumber(forecastData.goalComparison.percentageAbove, 1)}%</span></div>
        <div class="comparison-message">${forecastData.goalComparison.isAbove ? `O consumo projetado está ${formatNumber(forecastData.goalComparison.percentageAbove, 1)}% acima da meta. Reveja seus hábitos de consumo.` : `O consumo projetado está ${formatNumber(Math.abs(forecastData.goalComparison.percentageAbove), 1)}% abaixo da meta. Continue assim!`}</div>
      </div>
    </div>
  </div>` : ''}

  <div class="page-footer">
    <span class="footer-left">⚡ EcoPower</span>
    <span>${formattedDate}</span>
    <span class="footer-right">Página 5<br><span style="font-size:7px;">Documento gerado automaticamente pelo sistema EcoPower.</span></span>
  </div>
</div>

<!-- ==================== PAGE 5: INSIGHTS ==================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="header-logo">⚡ EcoPower</span>
      <span class="header-divider">|</span>
      <span class="header-subtitle">Relatório de Consumo Energético</span>
    </div>
    <div class="header-right">${formattedDate} | v1.0</div>
  </div>

  <h2 class="page-title">Insights Inteligentes</h2>
  <p class="page-subtitle">Análise inteligente do perfil de consumo com recomendações personalizadas.</p>

  <div class="row">
    <div class="col flex-0-6">
      <div class="section">
        <div class="section-title">Eficiência Energética</div>
        ${efficiencyScore ? `
        <div class="efficiency-card">
          ${generateEfficiencyGauge(efficiencyScore.score)}
          <div class="efficiency-info">
            <h3>Classificação</h3>
            <div class="efficiency-class" style="color:${getEfficiencyColor(efficiencyScore.classificacao)}">${escapeHtml(efficiencyScore.classificacao)}</div>
            <div class="efficiency-potential">Potencial de economia: <strong>${formatCurrency(efficiencyScore.economiaPotencial)}/mês</strong></div>
          </div>
        </div>` : '<p class="no-data">Dados de eficiência não disponíveis.</p>'}
      </div>
    </div>
    <div class="col">
      <div class="section">
        <div class="section-title">Top Consumidores</div>
        <div class="top-consumers-list">
          ${topConsumers.slice(0, 5).map((c, i) => `
          <div class="top-consumer-row">
            <div class="top-consumer-rank ${i === 0 ? '' : i === 1 ? 'rank-2' : 'rank-3'}">${i + 1}</div>
            <span class="top-consumer-name">${escapeHtml(c.name)}</span>
            <span class="top-consumer-pct">${formatNumber(c.percentage, 1)}%</span>
            <span class="top-consumer-kwh">${formatNumber(c.consumption, 1)} kWh</span>
          </div>`).join('')}
          ${topConsumers.length === 0 ? '<p class="no-data">Nenhum dado disponível.</p>' : ''}
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Recomendações Automáticas</div>
    <div class="insight-grid">
      ${recommendations.slice(0, 4).map(insight => `
      <div class="insight-card">
        <div class="insight-priority" style="background:${getPriorityColor(insight.prioridade)}25;color:${getPriorityColor(insight.prioridade)};">
          ${getPriorityLabel(insight.prioridade)}
        </div>
        <div class="insight-title">${escapeHtml(insight.titulo)}</div>
        <div class="insight-desc">${escapeHtml(insight.descricao)}</div>
        ${insight.economiaPotencial > 0 ? `<div class="insight-savings">Economia potencial: ${formatCurrency(insight.economiaPotencial)}/mês</div>` : ''}
      </div>`).join('')}
      ${recommendations.length === 0 ? '<p class="no-data">Nenhuma recomendação disponível no momento.</p>' : ''}
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">⚡ EcoPower</span>
    <span>${formattedDate}</span>
    <span class="footer-right">Página 6<br><span style="font-size:7px;">Documento gerado automaticamente pelo sistema EcoPower.</span></span>
  </div>
</div>

<!-- ==================== PAGE 6: CONCLUSION ==================== -->
<div class="page">
  <div class="page-header">
    <div class="header-left">
      <span class="header-logo">⚡ EcoPower</span>
      <span class="header-divider">|</span>
      <span class="header-subtitle">Relatório de Consumo Energético</span>
    </div>
    <div class="header-right">${formattedDate} | v1.0</div>
  </div>

  <h2 class="page-title">Conclusão</h2>
  <p class="page-subtitle">Resumo e considerações finais sobre o desempenho energético do período.</p>

  <div class="conclusion-text">${generateConclusionText(data)}</div>

  ${report.topConsumer ? `
  <div class="conclusion-highlight">
    <strong>⚡ Dica EcoPower:</strong> O <strong>${escapeHtml(report.topConsumer.name)}</strong> é responsável por ${formatNumber(report.topConsumer.percentage, 1)}% do seu consumo total. Reduzir o tempo de uso deste aparelho pode gerar uma economia significativa na sua conta de energia.
  </div>` : ''}

  ${efficiencyScore && efficiencyScore.economiaPotencial > 0 ? `
  <div class="conclusion-highlight">
    <strong>💰 Potencial de Economia:</strong> Aplicando as recomendações do sistema, você pode economizar até <strong>${formatCurrency(efficiencyScore.economiaPotencial)} por mês</strong>, o que representa ${formatCurrency(efficiencyScore.economiaPotencial * 12)} ao ano.
  </div>` : ''}

  <div style="margin-top:auto;padding-top:16px;text-align:center;">
    <div style="font-size:20px;font-weight:800;letter-spacing:2px;margin-bottom:2px;background:linear-gradient(135deg,#2ECC71,#3498DB);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">⚡ EcoPower</div>
    <div style="font-size:10px;color:#7B8CA5;">Smart Energy Monitoring</div>
    <div style="margin-top:8px;font-size:9px;color:#CBD5E1;">
      © ${year} EcoPower — Todos os direitos reservados.<br>
      Documento gerado automaticamente em ${formattedDate}.
    </div>
  </div>

  <div class="page-footer">
    <span class="footer-left">⚡ EcoPower</span>
    <span>${formattedDate}</span>
    <span class="footer-right">Página 7<br><span style="font-size:7px;">Documento gerado automaticamente pelo sistema EcoPower.</span></span>
  </div>
</div>

</body>
</html>`;
}

function getFileName(report: Report): string {
  const date = new Date(report.generatedAt);
  const month = getMonthName(date);
  const year = date.getFullYear();
  return `Relatorio_EcoPower_${month}_${year}.pdf`;
}

export async function generateProfessionalPDF(data: PDFReportData): Promise<{ uri: string; base64?: string }> {
  const html = buildHTML(data);

  if (Platform.OS === 'web') {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
    setTimeout(() => document.body.removeChild(iframe), 1000);
    return { uri: '' };
  }

  const result = await Print.printToFileAsync({
    html,
    width: 595.28,
    height: 841.89,
    base64: true,
  });
  return { uri: result.uri, base64: result.base64 };
}

export async function sharePDF(uri: string, report: Report, base64?: string): Promise<void> {
  const fileName = getFileName(report);
  if (Platform.OS === 'web') return;

  const content = base64 || await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  const dest = (cacheDirectory ?? '') + fileName;
  await writeAsStringAsync(dest, content, { encoding: EncodingType.Base64 });

  await Sharing.shareAsync(dest, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartilhar Relatório EcoPower',
    UTI: 'com.adobe.pdf',
  });
}

export async function generateAndSharePDFReport(data: PDFReportData): Promise<void> {
  const { uri, base64 } = await generateProfessionalPDF(data);
  if (uri) {
    await sharePDF(uri, data.report, base64);
  }
}

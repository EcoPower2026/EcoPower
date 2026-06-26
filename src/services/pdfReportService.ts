import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
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
    case 'Excelente': return '#22C55E';
    case 'Bom': return '#4ADE80';
    case 'Regular': return '#D4A017';
    case 'Crítico': return '#D84315';
    default: return '#7B8D82';
  }
}

function getPriorityColor(prioridade: string): string {
  switch (prioridade) {
    case 'alta': return '#D84315';
    case 'media': return '#D4A017';
    case 'baixa': return '#2B6777';
    default: return '#7B8D82';
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
  const barH = 28;
  const gap = 12;
  const h = stats.length * (barH + gap) + 20;
  const labelW = 140;
  const maxBarW = 300;
  let bars = '';
  stats.forEach((s, i) => {
    const y = i * (barH + gap) + 10;
    const bw = (s.consumption / maxConsumption) * maxBarW;
    const pct = s.percentage.toFixed(1);
    bars += `
      <text x="0" y="${y + barH - 8}" font-family="Poppins, sans-serif" font-size="10" fill="#475569">${escapeHtml(s.name)}</text>
      <rect x="${labelW}" y="${y}" width="${Math.max(bw, 4)}" height="${barH}" rx="6" fill="#22C55E" opacity="0.8"/>
      <text x="${labelW + bw + 10}" y="${y + barH - 8}" font-family="Poppins, sans-serif" font-size="10" fill="#1E293B" font-weight="600">${formatNumber(s.consumption, 1)} kWh</text>
      <text x="${labelW + bw + 10}" y="${y + barH + 5}" font-family="Poppins, sans-serif" font-size="8" fill="#94A3B8">${pct}%</text>
    `;
  });
  return `<svg width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

function generateComparisonChart(comparison: PeriodComparison): string {
  const { currentPeriod, previousPeriod, variation } = comparison;
  const maxVal = Math.max(currentPeriod.consumption, previousPeriod.consumption, 1);
  const barW = 50;
  const gap = 16;
  const chartH = 180;
  const chartW = 200;
  const bottomMargin = 28;
  const maxBarH = chartH - bottomMargin - 30;
  const curH = (currentPeriod.consumption / maxVal) * maxBarH;
  const prevH = (previousPeriod.consumption / maxVal) * maxBarH;
  const isSavings = variation.isSavings;
  const curColor = isSavings ? '#22C55E' : '#2B6777';
  const prevColor = '#A5D6A7';
  return `
    <svg width="${chartW}" height="${chartH}" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="${chartH - bottomMargin}" x2="${chartW}" y2="${chartH - bottomMargin}" stroke="#E2E8F0" stroke-width="1"/>
      <rect x="30" y="${chartH - bottomMargin - curH}" width="${barW}" height="${curH}" rx="4" fill="${curColor}"/>
      <text x="${30 + barW / 2}" y="${chartH - bottomMargin - curH - 8}" font-family="Poppins, sans-serif" font-size="10" fill="${curColor}" text-anchor="middle" font-weight="700">${formatNumber(currentPeriod.consumption, 1)}</text>
      <text x="${30 + barW / 2}" y="${chartH - 6}" font-family="Poppins, sans-serif" font-size="8" fill="#94A3B8" text-anchor="middle">Atual</text>
      <rect x="${30 + barW + gap}" y="${chartH - bottomMargin - prevH}" width="${barW}" height="${prevH}" rx="4" fill="${prevColor}"/>
      <text x="${30 + barW + gap + barW / 2}" y="${chartH - bottomMargin - prevH - 8}" font-family="Poppins, sans-serif" font-size="10" fill="#64748B" text-anchor="middle" font-weight="700">${formatNumber(previousPeriod.consumption, 1)}</text>
      <text x="${30 + barW + gap + barW / 2}" y="${chartH - 6}" font-family="Poppins, sans-serif" font-size="8" fill="#94A3B8" text-anchor="middle">Anterior</text>
      <text x="${chartW - 5}" y="12" font-family="Poppins, sans-serif" font-size="8" fill="#94A3B8" text-anchor="end">kWh</text>
    </svg>
  `;
}

function generateGoalProgressBar(progress: number, target: number): string {
  const pct = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  const barW = 320;
  const barH = 10;
  return `
    <div style="margin:4px 0 8px 0;">
      <svg width="${barW}" height="${barH + 10}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#22C55E"/>
            <stop offset="100%" stop-color="#4ADE80"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${barW}" height="${barH}" rx="4" fill="#E2E8F0"/>
        <rect x="0" y="0" width="${(pct / 100) * barW}" height="${barH}" rx="4" fill="url(#barGrad)"/>
        <text x="0" y="${barH + 8}" font-family="Poppins, sans-serif" font-size="8" fill="#94A3B8">${pct.toFixed(0)}% concluído</text>
      </svg>
    </div>
  `;
}

function generateEfficiencyGauge(score: number): string {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const cx = 44;
  const cy = 44;
  return `
    <svg width="100" height="98" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="6"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#22C55E" stroke-width="6" stroke-dasharray="${filled} ${circ - filled}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy}" font-family="Poppins, sans-serif" font-size="20" fill="#1E293B" text-anchor="middle" font-weight="800" dy="5">${score}</text>
      <text x="${cx}" y="${cy + 20}" font-family="Poppins, sans-serif" font-size="8" fill="#94A3B8" text-anchor="middle">/ 100</text>
    </svg>
  `;
}

function generateCoverWaves(): string {
  return `
    <svg style="position:absolute;bottom:0;left:0;width:100%;height:280px;" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="rgba(34,197,94,0.06)" d="M0,160 C240,260 480,80 720,160 C960,240 1200,100 1440,180 L1440,320 L0,320 Z"/>
      <path fill="rgba(43,103,119,0.04)" d="M0,200 C240,120 480,280 720,200 C960,120 1200,240 1440,160 L1440,320 L0,320 Z"/>
      <path fill="rgba(34,197,94,0.03)" d="M0,240 C360,180 720,300 1080,220 C1260,180 1350,240 1440,260 L1440,320 L0,320 Z"/>
      <circle cx="85%" cy="15%" r="3" fill="#22C55E" opacity="0.3"/>
      <circle cx="90%" cy="25%" r="2" fill="#2B6777" opacity="0.2"/>
      <circle cx="78%" cy="8%" r="4" fill="#16A34A" opacity="0.15"/>
      <circle cx="92%" cy="10%" r="1.5" fill="#4ADE80" opacity="0.25"/>
      <line x1="82%" y1="20%" x2="95%" y2="8%" stroke="#22C55E" stroke-width="0.5" opacity="0.1"/>
      <line x1="75%" y1="12%" x2="88%" y2="22%" stroke="#2B6777" stroke-width="0.5" opacity="0.08"/>
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

function buildHTML(data: PDFReportData, coverImage?: string): string {
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

  const co2Avoided = Math.round(report.totalConsumption * 0.4 * 100) / 100;
  const treesEquivalent = Math.floor(co2Avoided / 22);

  function pageHeader(pageNum: number): string {
    return `
    <div class="page-header">
      <div class="header-left">
        <span class="header-logo">ECOPOWER</span>
        <span class="header-divider"></span>
      </div>
      <div class="header-right">
        <span class="header-date">${formattedDate}</span>
        <span class="header-page">${pageNum}</span>
      </div>
    </div>
    <div class="header-subtitle-line">Relatório Inteligente de Consumo Energético</div>`;
  }

  function pageFooter(pageNum: number): string {
    return `
    <div class="page-footer">
      <span class="footer-left">ECOPOWER</span>
      <span class="footer-center">${formattedDate}</span>
      <span class="footer-right">${pageNum}</span>
    </div>`;
  }

  function sectionTitle(title: string): string {
    return `<div class="section-title"><span class="title-dot"></span>${title}</div>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EcoPower — Relatório ${monthName} ${year}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Poppins', sans-serif;
    color: #334155;
    background: #0A1A12;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 18mm 12mm 18mm;
    position: relative;
    background: #FFFFFF;
    page-break-after: always;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }

  /* ========== COVER ========== */
  .cover-page {
    background: linear-gradient(160deg, #0A1A12 0%, #1A3D28 50%, #22C55E 100%);
    color: #FFFFFF;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 34mm 24mm;
    position: relative;
    overflow: hidden;
  }
  .cover-glow {
    position: absolute;
    top: -35%;
    right: -18%;
    width: 65%;
    height: 65%;
    background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%);
    border-radius: 50%;
  }
  .cover-glow-2 {
    position: absolute;
    bottom: -25%;
    left: -12%;
    width: 45%;
    height: 45%;
    background: radial-gradient(circle, rgba(63,163,77,0.08) 0%, transparent 65%);
    border-radius: 50%;
  }
  .cover-content { position: relative; z-index: 1; }
  .cover-seal {
    display: inline-block;
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 6px 16px;
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 20px;
    color: rgba(255,255,255,0.7);
    margin-bottom: 24px;
  }
  .cover-logo {
    font-size: 56px;
    font-weight: 800;
    letter-spacing: 4px;
    margin-bottom: 4px;
    background: linear-gradient(135deg, #16A34A, #4ADE80);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .cover-subtitle {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 5px;
    text-transform: uppercase;
    opacity: 0.55;
    margin-bottom: 32px;
  }
  .cover-divider {
    width: 48px;
    height: 3px;
    background: #16A34A;
    margin: 0 auto 28px auto;
    border-radius: 2px;
  }
  .cover-title {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 36px;
    opacity: 0.95;
  }
  .cover-info { font-size: 12px; opacity: 0.7; line-height: 2.2; }
  .cover-info strong { font-weight: 700; opacity: 1; }
  .cover-meta {
    position: absolute;
    bottom: 18mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9px;
    opacity: 0.4;
    line-height: 2;
    z-index: 1;
  }

  /* ========== HEADER ========== */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 6px;
    margin-bottom: 0;
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-logo {
    font-size: 14px;
    font-weight: 800;
    color: #1E293B;
    letter-spacing: 1.5px;
  }
  .header-divider {
    display: inline-block;
    width: 1px;
    height: 14px;
    background: #CBD5E1;
  }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .header-date { font-size: 8px; color: #94A3B8; letter-spacing: 0.3px; }
  .header-page {
    font-size: 8px;
    color: #FFFFFF;
    background: #22C55E;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }
  .header-subtitle-line {
    font-size: 9px;
    color: #94A3B8;
    font-weight: 500;
    padding-bottom: 10px;
    border-bottom: 1px solid #E2E8F0;
    margin-bottom: 18px;
    flex-shrink: 0;
    letter-spacing: 0.3px;
  }

  /* ========== TITLE ========== */
  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 2px;
    flex-shrink: 0;
  }
  .page-subtitle {
    font-size: 10px;
    color: #94A3B8;
    margin-bottom: 18px;
    flex-shrink: 0;
    font-weight: 400;
  }

  /* ========== KPI CARDS ========== */
  .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; flex-shrink: 0; }
  .kpi-card {
    flex: 1 1 calc(33.33% - 10px);
    min-width: 150px;
    background: #F8FAFC;
    border-radius: 16px;
    padding: 16px 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #E2E8F0;
    text-align: center;
  }
  .kpi-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px auto;
    font-size: 13px;
    font-weight: 700;
  }
  .kpi-value { font-size: 26px; font-weight: 800; color: #1E293B; margin-bottom: 2px; letter-spacing: -0.5px; }
  .kpi-label { font-size: 9px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
  .kpi-trend { font-size: 8px; color: #CBD5E1; margin-top: 4px; }
  .kpi-card.dark {
    background: #1E293B;
    color: #FFFFFF;
    border: none;
  }
  .kpi-card.dark .kpi-value { color: #FFFFFF; }
  .kpi-card.dark .kpi-label { color: rgba(255,255,255,0.6); }
  .kpi-card.dark .kpi-trend { color: rgba(255,255,255,0.35); }
  .kpi-card.accent-green .kpi-value { color: #22C55E; }
  .kpi-card.accent-blue .kpi-value { color: #2B6777; }
  .kpi-card.accent-gold .kpi-value { color: #D4A017; }

  /* ========== SECTION ========== */
  .section { margin-bottom: 18px; flex-shrink: 0; }
  .section-title {
    font-size: 12px;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #22C55E;
    display: inline-block;
    flex-shrink: 0;
  }
  .section-content { padding: 0; }

  /* ========== TABLE ========== */
  .data-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 9px; margin-bottom: 10px; border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0; }
  .data-table thead th {
    background: #F1F5F9;
    color: #64748B;
    font-weight: 600;
    padding: 9px 12px;
    text-align: left;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #E2E8F0;
  }
  .data-table tbody td { padding: 8px 12px; border-bottom: 1px solid #F1F5F9; color: #475569; font-weight: 400; }
  .data-table tbody tr:nth-child(even) { background: #FAFAFA; }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tfoot td {
    padding: 9px 12px;
    background: #F8FAFC;
    font-weight: 700;
    color: #1E293B;
    border-top: 1px solid #E2E8F0;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .table-icon { width: 18px; height: 18px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; margin-right: 8px; vertical-align: middle; }
  .table-icon.appliance { background: #F1F5F9; color: #64748B; }

  /* ========== COMPARISON ========== */
  .comparison-grid { display: flex; gap: 12px; margin-bottom: 8px; }
  .comparison-card {
    flex: 1;
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #E2E8F0;
    padding: 16px;
  }
  .comparison-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #F1F5F9;
  }
  .comparison-label { font-size: 12px; font-weight: 700; color: #1E293B; }
  .comparison-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .badge-success { background: #F0FDF4; color: #16A34A; }
  .badge-warning { background: #FFFBEB; color: #D97706; }
  .badge-danger { background: #FEF2F2; color: #DC2626; }
  .badge-neutral { background: #F8FAFC; color: #64748B; }
  .comparison-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px; }
  .comparison-row .label { color: #94A3B8; }
  .comparison-row .value { font-weight: 600; color: #1E293B; }
  .comparison-row .value.positive { color: #22C55E; }
  .comparison-row .value.negative { color: #DC2626; }
  .comparison-message {
    margin-top: 8px;
    padding: 8px 12px;
    background: #F8FAFC;
    border-radius: 10px;
    font-size: 9px;
    color: #64748B;
    font-weight: 500;
    border-left: 3px solid #22C55E;
  }
  .chart-container { display: flex; justify-content: center; margin: 10px 0; }

  /* ========== GOALS ========== */
  .goal-dashboard { display: flex; gap: 10px; margin-bottom: 12px; }
  .goal-stat-card {
    flex: 1;
    background: #F8FAFC;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #E2E8F0;
    padding: 12px;
    text-align: center;
  }
  .goal-stat-label { font-size: 8px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 4px; }
  .goal-stat-value { font-size: 18px; font-weight: 800; color: #1E293B; }
  .goal-stat-value.green { color: #22C55E; }
  .goal-stat-value.blue { color: #2B6777; }
  .goal-stat-value.orange { color: #D97706; }
  .goal-card {
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #E2E8F0;
    padding: 16px;
    margin-bottom: 10px;
  }
  .goal-title { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 2px; }
  .goal-desc { font-size: 9px; color: #94A3B8; margin-bottom: 6px; }

  .forecast-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F1F5F9; font-size: 10px; }
  .forecast-row:last-child { border-bottom: none; }
  .forecast-row .label { color: #94A3B8; }
  .forecast-row .value { font-weight: 600; color: #1E293B; }

  /* ========== INSIGHTS ========== */
  .insight-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .insight-card {
    flex: 1 1 calc(50% - 10px);
    min-width: 200px;
    background: #1E293B;
    border-radius: 16px;
    padding: 16px;
    color: #FFFFFF;
  }
  .insight-priority {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 10px;
    border-radius: 20px;
    margin-bottom: 6px;
  }
  .insight-title { font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px; }
  .insight-desc { font-size: 9px; color: #CBD5E1; line-height: 1.6; }
  .insight-savings { margin-top: 6px; font-size: 10px; font-weight: 700; color: #4ADE80; }
  .insight-marker { font-size: 14px; margin-bottom: 6px; }

  .efficiency-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #E2E8F0;
    padding: 16px;
    margin-bottom: 10px;
  }
  .efficiency-info { flex: 1; }
  .efficiency-info h3 { font-size: 10px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .efficiency-class { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  .efficiency-potential { font-size: 10px; color: #94A3B8; }
  .efficiency-potential strong { color: #22C55E; }

  .top-consumers-list { margin: 4px 0; }
  .top-consumer-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #F1F5F9; font-size: 10px; }
  .top-consumer-row:last-child { border-bottom: none; }
  .top-consumer-rank {
    width: 20px; height: 20px; border-radius: 50%;
    background: #22C55E; color: #FFFFFF;
    font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .top-consumer-rank.r2 { background: #4ADE80; }
  .top-consumer-rank.r3 { background: #2B6777; }
  .top-consumer-rank.r4 { background: #94A3B8; }
  .top-consumer-rank.r5 { background: #CBD5E1; color: #1E293B; }
  .top-consumer-name { flex: 1; font-weight: 600; color: #1E293B; }
  .top-consumer-pct { font-weight: 700; color: #22C55E; min-width: 38px; text-align: right; }
  .top-consumer-kwh { color: #94A3B8; min-width: 55px; text-align: right; }

  /* ========== CONCLUSION ========== */
  .conclusion-block {
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid #E2E8F0;
  }
  .conclusion-block.dark {
    background: #1E293B;
    color: #FFFFFF;
    border: none;
  }
  .conclusion-block.light {
    background: #F8FAFC;
  }
  .conclusion-block.white {
    background: #FFFFFF;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .conclusion-block-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .conclusion-block.dark .conclusion-block-title { color: rgba(255,255,255,0.6); }
  .conclusion-block.light .conclusion-block-title { color: #64748B; }
  .conclusion-block.white .conclusion-block-title { color: #64748B; }
  .conclusion-text {
    font-size: 10px;
    color: #475569;
    line-height: 1.9;
    text-align: justify;
  }
  .conclusion-block.dark .conclusion-text { color: #CBD5E1; }
  .conclusion-text strong { color: #22C55E; }
  .conclusion-block.dark .conclusion-text strong { color: #4ADE80; }
  .conclusion-highlight-list { list-style: none; padding: 0; }
  .conclusion-highlight-list li {
    padding: 5px 0 5px 18px;
    position: relative;
    font-size: 10px;
    color: #475569;
    line-height: 1.6;
    border-bottom: 1px solid #F1F5F9;
  }
  .conclusion-highlight-list li:last-child { border-bottom: none; }
  .conclusion-highlight-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 11px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #22C55E;
  }
  .conclusion-block.dark .conclusion-highlight-list li { color: #CBD5E1; border-bottom-color: rgba(255,255,255,0.06); }
  .conclusion-block.dark .conclusion-highlight-list li::before { background: #4ADE80; }

  /* ========== ENVIRONMENTAL IMPACT ========== */
  .impact-grid { display: flex; gap: 10px; flex-wrap: wrap; }
  .impact-card {
    flex: 1 1 calc(33.33% - 10px);
    min-width: 130px;
    background: #F8FAFC;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #E2E8F0;
    padding: 14px;
    text-align: center;
  }
  .impact-marker {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px auto;
    font-size: 14px;
    font-weight: 700;
  }
  .impact-value { font-size: 18px; font-weight: 800; color: #1E293B; margin-bottom: 2px; }
  .impact-label { font-size: 8px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

  /* ========== FOOTER ========== */
  .page-footer {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    color: #94A3B8;
    flex-shrink: 0;
  }
  .footer-left { font-weight: 700; color: #1E293B; letter-spacing: 1px; }
  .footer-center { color: #CBD5E1; }
  .footer-right {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #94A3B8;
    background: #F1F5F9;
  }

  .no-data { color: #94A3B8; font-style: italic; font-size: 10px; padding: 14px; text-align: center; }
  .flex-grow { flex: 1; }
  .row { display: flex; gap: 12px; margin-bottom: 12px; }
  .col { flex: 1; }
  .info-box {
    background: #F8FAFC;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #E2E8F0;
    padding: 10px 12px;
    margin-bottom: 6px;
  }
  .info-box .info-label { font-size: 8px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; margin-bottom: 2px; }
  .info-box .info-value { font-size: 14px; font-weight: 800; color: #1E293B; }
  .info-box .info-value.green { color: #22C55E; }
  .spacer { flex: 1; }
  .no-wrap { white-space: nowrap; }
</style>
</head>
<body>

<!-- ==================== COVER ==================== -->
<div class="page cover-page">
  <div class="cover-glow"></div>
  <div class="cover-glow-2"></div>
  <div class="cover-content">
    ${coverImage ? `
    <img src="${coverImage}" style="width:280px;height:280px;margin-bottom:24px;border-radius:32px;box-shadow:0 0 60px rgba(34,197,94,0.15);" />` : `
    <div class="cover-seal">✦ Edição Inteligente EcoPower</div>
    <div class="cover-logo">ECOPOWER</div>
    <div class="cover-subtitle">Smart Energy Monitoring</div>
    <div class="cover-divider"></div>`}
    <div class="cover-title">Análise Inteligente<br>de Consumo Energético</div>
    <div class="cover-info">
      <p>Preparado para: <strong>${escapeHtml(userName)}</strong></p>
      <p>Período: ${formatDate(report.period.start)} a ${formatDate(report.period.end)}</p>
      <p>Data de geração: ${formattedDate}</p>
    </div>
  </div>
  ${generateCoverWaves()}
  <div class="cover-meta">
    <p>© ${year} EcoPower — Monitoramento Inteligente de Energia</p>
  </div>
</div>

<!-- ==================== PAGE 2: EXECUTIVE SUMMARY ==================== -->
<div class="page">
  ${pageHeader(2)}

  <div class="page-title">Resumo Executivo</div>
  <div class="page-subtitle">Visão geral do desempenho energético — ${formatDate(report.period.start)} a ${formatDate(report.period.end)}</div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon" style="background:rgba(34,197,94,0.08);color:#22C55E;">kWh</div>
      <div class="kpi-value" style="font-size:34px;">${formatNumber(totalConsumption, 1)}</div>
      <div class="kpi-label">Consumo Total</div>
      <div class="kpi-trend">${formatNumber(totalConsumption, 1)} kWh no período</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:rgba(212,160,23,0.08);color:#D4A017;">R$</div>
      <div class="kpi-value" style="font-size:34px;">${formatCurrency(totalCost)}</div>
      <div class="kpi-label">Custo Total</div>
      <div class="kpi-trend">${formatCurrency(totalCost)} no período</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:rgba(43,103,119,0.08);color:#2B6777;">%</div>
      <div class="kpi-value" style="font-size:34px;">${efficiencyScore ? `${efficiencyScore.score}` : '---'}</div>
      <div class="kpi-label">Eficiência</div>
      <div class="kpi-trend">${efficiencyScore ? escapeHtml(efficiencyScore.classificacao) : 'Não disponível'}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:rgba(34,197,94,0.08);color:#22C55E;">M</div>
      <div class="kpi-value" style="font-size:34px;">${formatNumber(dailyAverage, 2)}</div>
      <div class="kpi-label">Média Diária</div>
      <div class="kpi-trend">${formatNumber(dailyAverage, 2)} kWh/dia</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:rgba(43,103,119,0.08);color:#2B6777;">P</div>
      <div class="kpi-value" style="font-size:34px;">${forecastData ? formatNumber(forecastData.projectedConsumption, 1) : '---'}</div>
      <div class="kpi-label">Previsão Mensal</div>
      <div class="kpi-trend">${forecastData ? formatCurrency(forecastData.projectedCost) : 'Não disponível'}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon" style="background:rgba(63,163,77,0.08);color:#16A34A;">E</div>
      <div class="kpi-value" style="font-size:34px;">${economyAmount > 0 ? formatCurrency(economyAmount) : '---'}</div>
      <div class="kpi-label">Economia</div>
      <div class="kpi-trend">${economyAmount > 0 ? 'Economia no período' : 'Sem economia'}</div>
    </div>
  </div>

  ${monthVar ? `
  <div class="row" style="margin-top:0;">
    <div class="col">
      <div class="comparison-card" style="margin:0;padding:14px;">
        <div class="comparison-header" style="margin-bottom:8px;">
          <span class="comparison-label" style="font-size:11px;">Comparativo Mensal</span>
          <span class="comparison-badge ${monthVar.isSavings ? 'badge-success' : Math.abs(monthVar.consumptionPercent) > 10 ? 'badge-danger' : 'badge-warning'}">
            ${monthVar.isSavings ? '▼ Economia ' + formatNumber(Math.abs(monthVar.consumptionPercent), 1) + '%' : '▲ Aumento ' + formatNumber(monthVar.consumptionPercent, 1) + '%'}
          </span>
        </div>
        <div class="comparison-row"><span class="label">Consumo atual:</span><span class="value">${formatNumber(monthComparison!.currentPeriod.consumption, 1)} kWh</span></div>
        <div class="comparison-row"><span class="label">Consumo anterior:</span><span class="value">${formatNumber(monthComparison!.previousPeriod.consumption, 1)} kWh</span></div>
        <div class="comparison-row"><span class="label">Variação:</span><span class="value ${monthVar.consumptionPercent < 0 ? 'positive' : 'negative'}">${monthVar.consumptionPercent >= 0 ? '+' : ''}${formatNumber(monthVar.consumptionPercent, 1)}%</span></div>
        ${monthVar.isSavings ? `<div class="comparison-row"><span class="label">Economia estimada:</span><span class="value positive">${formatCurrency(Math.abs(monthVar.costDiff))}</span></div>` : ''}
      </div>
    </div>
    <div class="col">
      <div class="comparison-card" style="margin:0;padding:14px;">
        <div class="comparison-header" style="margin-bottom:8px;">
          <span class="comparison-label" style="font-size:11px;">Comparativo Semanal</span>
          <span class="comparison-badge ${weekVar?.isSavings ? 'badge-success' : 'badge-warning'}">${weekVar?.isSavings ? '▼ Economia' : '▲ Aumento'}</span>
        </div>
        <div class="comparison-row"><span class="label">Variação:</span><span class="value ${weekVar && weekVar.consumptionPercent < 0 ? 'positive' : 'negative'}">${weekVar ? `${weekVar.consumptionPercent >= 0 ? '+' : ''}${formatNumber(weekVar.consumptionPercent, 1)}%` : '---'}</span></div>
        <div class="comparison-row"><span class="label">Atual:</span><span class="value">${formatNumber(weekComparison?.currentPeriod.consumption ?? 0, 1)} kWh</span></div>
        <div class="comparison-row"><span class="label">Anterior:</span><span class="value">${formatNumber(weekComparison?.previousPeriod.consumption ?? 0, 1)} kWh</span></div>
      </div>
    </div>
  </div>` : ''}

  ${pageFooter(2)}
</div>

<!-- ==================== PAGE 3: CONSUMPTION ==================== -->
<div class="page">
  ${pageHeader(3)}

  <div class="page-title">Análise de Consumo</div>
  <div class="page-subtitle">Detalhamento do consumo por aparelho no período</div>

  <table class="data-table">
    <thead><tr><th>Aparelho</th><th class="text-right">Consumo (kWh)</th><th class="text-right">Custo (R$)</th><th class="text-right">Participação</th></tr></thead>
    <tbody>
      ${report.applianceStats.map(stat => `
      <tr>
        <td><span class="table-icon appliance">i</span>${escapeHtml(stat.name)}</td>
        <td class="text-right">${formatNumber(stat.consumption, 2)}</td>
        <td class="text-right">${formatCurrency(stat.cost)}</td>
        <td class="text-right">${formatNumber(stat.percentage, 1)}%</td>
      </tr>`).join('')}
      ${report.applianceStats.length === 0 ? '<tr><td colspan="4" class="text-center no-data" style="padding:24px;">Nenhum dado de consumo disponível para o período.</td></tr>' : ''}
    </tbody>
    <tfoot>
      <tr><td>TOTAL</td><td class="text-right">${formatNumber(totalConsumption, 2)} kWh</td><td class="text-right">${formatCurrency(totalCost)}</td><td class="text-right">100%</td></tr>
    </tfoot>
  </table>

  ${report.applianceStats.length > 0 ? `
  <div class="section">
    ${sectionTitle('Gráfico de Consumo')}
    <div class="section-content">
      <div class="chart-container">${generateConsumptionChart(report.applianceStats)}</div>
    </div>
  </div>` : ''}

  ${pageFooter(3)}
</div>

<!-- ==================== PAGE 4: COMPARISON ==================== -->
<div class="page">
  ${pageHeader(4)}

  <div class="page-title">Comparação de Períodos</div>
  <div class="page-subtitle">Análise comparativa entre períodos para identificar tendências de consumo.</div>

  ${monthComparison ? `
  <div class="section">
    ${sectionTitle('Mês Atual × Mês Anterior')}
    <div class="comparison-card">
      <div class="comparison-header">
        <span class="comparison-label">${escapeHtml(monthComparison.currentPeriod.label)} vs ${escapeHtml(monthComparison.previousPeriod.label)}</span>
        <span class="comparison-badge ${monthComparison.variation.isSavings ? 'badge-success' : 'badge-danger'}">
          ${monthComparison.variation.isSavings ? '▼ ' + formatNumber(Math.abs(monthComparison.variation.consumptionPercent), 1) + '%' : '▲ ' + formatNumber(monthComparison.variation.consumptionPercent, 1) + '%'}
        </span>
      </div>
      <div class="row" style="gap:12px;margin-bottom:8px;">
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
  </div>` : '<p class="no-data">Dados de comparação mensal não disponíveis.</p>'}

  ${weekComparison ? `
  <div class="section" style="margin-top:12px;">
    ${sectionTitle('Semana Atual × Semana Anterior')}
    <div class="comparison-card">
      <div class="comparison-header">
        <span class="comparison-label">${escapeHtml(weekComparison.currentPeriod.label)} vs ${escapeHtml(weekComparison.previousPeriod.label)}</span>
        <span class="comparison-badge ${weekComparison.variation.isSavings ? 'badge-success' : 'badge-warning'}">${weekComparison.variation.isSavings ? '▼ Economia' : '▲ Aumento'}</span>
      </div>
      <div class="row" style="gap:12px;margin-bottom:8px;">
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
  </div>` : ''}

  ${pageFooter(4)}
</div>

<!-- ==================== PAGE 5: GOALS & FORECAST ==================== -->
<div class="page">
  ${pageHeader(5)}

  <div class="page-title">Metas e Previsões</div>
  <div class="page-subtitle">Acompanhamento de metas de economia e projeções de consumo.</div>

  ${activeGoal ? `
  <div class="goal-card" style="margin-bottom:12px;">
    <div class="goal-title">${escapeHtml(activeGoal.titulo)}</div>
    ${generateGoalProgressBar(activeGoal.progresso, activeGoal.valorAlvo)}
    <div class="goal-dashboard">
      <div class="goal-stat-card">
        <div class="goal-stat-label">Meta</div>
        <div class="goal-stat-value green">${formatNumber(activeGoal.valorAlvo, 1)}</div>
      </div>
      <div class="goal-stat-card">
        <div class="goal-stat-label">Atual</div>
        <div class="goal-stat-value blue">${formatNumber(activeGoal.progresso, 1)}</div>
      </div>
      <div class="goal-stat-card">
        <div class="goal-stat-label">Restante</div>
        <div class="goal-stat-value orange">${formatNumber(Math.max(0, activeGoal.valorAlvo - activeGoal.progresso), 1)}</div>
      </div>
    </div>
  </div>` : '<p class="no-data" style="margin-bottom:12px;">Nenhuma meta ativa no momento.</p>'}

  <div class="row">
    <div class="col">
      <div class="section">
        ${sectionTitle('Previsão Mensal')}
        ${forecastData ? `
        <div class="info-box"><div class="info-label">Consumo atual</div><div class="info-value green">${formatNumber(forecastData.currentConsumption, 1)} kWh</div></div>
        <div class="info-box"><div class="info-label">Previsão para o mês</div><div class="info-value green">${formatNumber(forecastData.projectedConsumption, 1)} kWh</div></div>
        <div class="info-box"><div class="info-label">Custo projetado</div><div class="info-value green">${formatCurrency(forecastData.projectedCost)}</div></div>
        <div class="info-box"><div class="info-label">Média diária</div><div class="info-value" style="font-size:13px;">${formatNumber(forecastData.dailyAverage, 2)} kWh</div></div>` : `
        <div class="info-box"><p class="no-data" style="padding:4px;">Previsão não disponível.</p></div>`}
      </div>
    </div>
    <div class="col">
      ${forecastData && forecastData.recommendations.length > 0 ? `
      <div class="section">
        ${sectionTitle('Recomendações')}
          <div style="background:#F8FAFC;border-radius:14px;padding:12px;">
          <ul style="list-style:none;padding:0;">
            ${forecastData.recommendations.map(rec => `
            <li style="padding:4px 0 4px 18px;position:relative;font-size:10px;color:#475569;line-height:1.6;">
              <span style="position:absolute;left:0;top:8px;width:4px;height:4px;border-radius:50%;background:#22C55E;display:inline-block;"></span>
              ${escapeHtml(rec)}
            </li>`).join('')}
          </ul>
        </div>
      </div>` : ''}
    </div>
  </div>

  ${forecastData?.goalComparison ? `
  <div class="section">
    ${sectionTitle('Comparação com a Meta')}
    <div class="comparison-card">
      <div class="comparison-row"><span class="label">Meta:</span><span class="value">${escapeHtml(forecastData.goalComparison.goalTitle)}</span></div>
      <div class="comparison-row"><span class="label">Valor alvo:</span><span class="value">${formatCurrency(forecastData.goalComparison.goalTarget)}</span></div>
      <div class="comparison-row"><span class="label">Diferença:</span><span class="value ${forecastData.goalComparison.isAbove ? 'negative' : 'positive'}">${forecastData.goalComparison.isAbove ? '+' : ''}${formatCurrency(forecastData.goalComparison.difference)}</span></div>
      <div class="comparison-row"><span class="label">Percentual:</span><span class="value ${forecastData.goalComparison.isAbove ? 'negative' : 'positive'}">${forecastData.goalComparison.isAbove ? '+' : ''}${formatNumber(forecastData.goalComparison.percentageAbove, 1)}%</span></div>
      <div class="comparison-message">${forecastData.goalComparison.isAbove ? `O consumo projetado está ${formatNumber(forecastData.goalComparison.percentageAbove, 1)}% acima da meta. Reveja seus hábitos de consumo.` : `O consumo projetado está ${formatNumber(Math.abs(forecastData.goalComparison.percentageAbove), 1)}% abaixo da meta. Continue assim!`}</div>
    </div>
  </div>` : ''}

  ${pageFooter(5)}
</div>

<!-- ==================== PAGE 6: INSIGHTS ==================== -->
<div class="page">
  ${pageHeader(6)}

  <div class="page-title">Insights Inteligentes</div>
  <div class="page-subtitle">Análise do perfil de consumo com recomendações personalizadas.</div>

  <div class="row">
    <div class="col" style="flex:0.55;">
      <div class="section">
        ${sectionTitle('Eficiência Energética')}
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
        ${sectionTitle('Top Consumidores')}
        <div class="top-consumers-list">
          ${topConsumers.slice(0, 5).map((c, i) => `
          <div class="top-consumer-row">
            <div class="top-consumer-rank ${i === 0 ? '' : i === 1 ? 'r2' : i === 2 ? 'r3' : i === 3 ? 'r4' : 'r5'}">${i + 1}</div>
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
    ${sectionTitle('Recomendações Automáticas')}
    <div class="insight-grid">
      ${recommendations.slice(0, 4).map(insight => {
        const pColor = getPriorityColor(insight.prioridade);
        return `
      <div class="insight-card">
        <div class="insight-marker" style="color:${pColor};">${insight.prioridade === 'alta' ? '!!' : insight.prioridade === 'media' ? '!' : 'i'}</div>
        <div class="insight-priority" style="background:${pColor}18;color:${pColor};">
          ${getPriorityLabel(insight.prioridade)}
        </div>
        <div class="insight-title">${escapeHtml(insight.titulo)}</div>
        <div class="insight-desc">${escapeHtml(insight.descricao)}</div>
        ${insight.economiaPotencial > 0 ? `<div class="insight-savings">Economia potencial: ${formatCurrency(insight.economiaPotencial)}/mês</div>` : ''}
      </div>`;}).join('')}
      ${recommendations.length === 0 ? '<p class="no-data">Nenhuma recomendação disponível no momento.</p>' : ''}
    </div>
  </div>

  ${pageFooter(6)}
</div>

<!-- ==================== PAGE 7: IMPACT + CONCLUSION ==================== -->
<div class="page">
  ${pageHeader(7)}

  <div class="page-title">Impacto e Conclusão</div>
  <div class="page-subtitle">Sustentabilidade, impacto ambiental e considerações finais.</div>

  <div class="section">
    ${sectionTitle('Impacto Ambiental')}
    <div class="impact-grid" style="margin-bottom:12px;">
      <div class="impact-card">
        <div class="impact-marker" style="background:rgba(43,103,119,0.08);color:#2B6777;">CO₂</div>
        <div class="impact-value" style="color:#2B6777;">${formatNumber(co2Avoided, 1)} kg</div>
        <div class="impact-label">CO₂ Evitado</div>
      </div>
      <div class="impact-card">
        <div class="impact-marker" style="background:rgba(34,197,94,0.08);color:#22C55E;">Arv</div>
        <div class="impact-value" style="color:#22C55E;">${treesEquivalent}</div>
        <div class="impact-label">Árvores Equivalentes</div>
      </div>
      <div class="impact-card">
        <div class="impact-marker" style="background:rgba(124,179,66,0.08);color:#4ADE80;">kWh</div>
        <div class="impact-value" style="color:#4ADE80;">${formatNumber(totalConsumption, 1)}</div>
        <div class="impact-label">Energia (kWh)</div>
      </div>
      <div class="impact-card">
        <div class="impact-marker" style="background:rgba(34,197,94,0.08);color:#22C55E;">R$</div>
        <div class="impact-value" style="color:#22C55E;">${formatCurrency(totalCost)}</div>
        <div class="impact-label">Impacto Financeiro</div>
      </div>
      <div class="impact-card">
        <div class="impact-marker" style="background:rgba(43,103,119,0.08);color:#2B6777;">Sc</div>
        <div class="impact-value" style="color:#2B6777;">${efficiencyScore ? `${efficiencyScore.score}` : '---'}</div>
        <div class="impact-label">Score Eficiência</div>
      </div>
      <div class="impact-card">
        <div class="impact-marker" style="background:rgba(63,163,77,0.08);color:#16A34A;">M</div>
        <div class="impact-value" style="color:#16A34A;">${formatNumber(dailyAverage, 2)}</div>
        <div class="impact-label">Média (kWh/dia)</div>
      </div>
    </div>
  </div>

  <div class="section">
    ${sectionTitle('Resumo Final')}
    <div class="conclusion-block light">
      <div class="conclusion-text">${generateConclusionText(data)}</div>
    </div>
  </div>

  <div class="row" style="margin-bottom:12px;">
    <div class="col">
      <div class="conclusion-block white" style="margin:0;">
        <div class="conclusion-block-title" style="color:#22C55E;">Impacto Financeiro</div>
        <ul class="conclusion-highlight-list">
          <li>Custo total no período: <strong>${formatCurrency(totalCost)}</strong></li>
          <li>Média diária: <strong>${formatCurrency(totalCost / Math.max(Math.ceil((new Date(report.period.end).getTime() - new Date(report.period.start).getTime()) / 86400000), 1))}</strong></li>
          ${efficiencyScore && efficiencyScore.economiaPotencial > 0 ? `<li>Potencial de economia: <strong>${formatCurrency(efficiencyScore.economiaPotencial)}/mês</strong></li>` : ''}
          ${economyAmount > 0 ? `<li>Economia no período: <strong style="color:#22C55E;">${formatCurrency(economyAmount)}</strong></li>` : ''}
        </ul>
      </div>
    </div>
    <div class="col">
      <div class="conclusion-block white" style="margin:0;">
        <div class="conclusion-block-title" style="color:#2B6777;">Próximos Passos</div>
        <ul class="conclusion-highlight-list">
          ${report.topConsumer ? `<li>Reduza o uso de <strong>${escapeHtml(report.topConsumer.name)}</strong></li>` : ''}
          ${!activeGoal ? '<li>Defina uma meta de economia</li>' : '<li>Acompanhe sua meta ativa</li>'}
          <li>Monitore os alertas do sistema</li>
          <li>Revise os insights mensalmente</li>
        </ul>
      </div>
    </div>
  </div>

  ${report.topConsumer ? `
  <div class="conclusion-block" style="background:#F0FDF4;border-left:4px solid #22C55E;border-radius:0 14px 14px 0;padding:12px 16px;margin-bottom:12px;">
    <div style="font-size:10px;color:#475569;line-height:1.7;">
      <strong style="color:#22C55E;">Dica EcoPower:</strong> O <strong>${escapeHtml(report.topConsumer.name)}</strong> é responsável por ${formatNumber(report.topConsumer.percentage, 1)}% do seu consumo total. Reduzir o tempo de uso deste aparelho pode gerar uma economia significativa na sua conta de energia.
    </div>
  </div>` : ''}

  <div style="text-align:center;padding:16px;background:#F8FAFC;border-radius:16px;border:1px solid #E2E8F0;margin-bottom:12px;">
    <div style="font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Saiba mais sobre o EcoPower</div>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://ecopower2026.netlify.app/" alt="QR Code EcoPower" style="width:100px;height:100px;border-radius:8px;" />
    <div style="font-size:9px;color:#22C55E;font-weight:600;margin-top:6px;">ecopower2026.netlify.app</div>
  </div>

  ${pageFooter(7)}
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
  let coverImage: string | undefined;

  try {
    const asset = Asset.fromModule(require('../../assets/principal.png'));
    await asset.downloadAsync();
    if (asset.localUri) {
      coverImage = await readAsStringAsync(asset.localUri, { encoding: EncodingType.Base64 });
      coverImage = `data:image/png;base64,${coverImage}`;
    }
  } catch { }

  const html = buildHTML(data, coverImage);

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

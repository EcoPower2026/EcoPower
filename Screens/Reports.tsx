import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { generateAdvancedCSV, shareReport } from '../src/utils/export';
import { generateAndSharePDFReport, PDFReportData } from '../src/services/pdfReportService';
import { Report, ReportType, Appliance } from '../src/types';
import Button from '../src/components/Button';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, sectionHeader } from '../src/theme/designSystem';

type ReportsProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Reports'>;
};

const REPORT_TYPES: { key: ReportType; label: string }[] = [
  { key: 'daily', label: 'Diário' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensal' },
  { key: 'consolidated', label: 'Consolidado' },
];

export default function Reports({ navigation }: ReportsProps) {
  const { colors } = useTheme();
  const { isDemoMode } = useDemo();


  const [report, setReport] = useState<Report | null>(null);
  const [consolidatedReports, setConsolidatedReports] = useState<Report[]>([]);
  const [selectedType, setSelectedType] = useState<ReportType>('monthly');
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [selectedAppliance, setSelectedAppliance] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let unsubAppliances: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        unsubAppliances = dataProvider.subscribeAppliances(uid, list => { setAppliances(list); }, isDemoMode);
      }
    });
    return () => { unsubAuth(); unsubAppliances?.(); };
  }, [isDemoMode]);

  const handleGenerate = async () => {
    if (!userId) return;
    setLoading(true);
    setGenerated(false);
    try {
      if (selectedType === 'consolidated') {
        const daily = await dataProvider.generateReport(userId, 'daily', undefined, isDemoMode);
        const weekly = await dataProvider.generateReport(userId, 'weekly', undefined, isDemoMode);
        const monthly = await dataProvider.generateReport(userId, 'monthly', undefined, isDemoMode);
        setConsolidatedReports([daily, weekly, monthly]);
        setReport(monthly);
      } else {
        setReport(await dataProvider.generateReport(userId, selectedType, selectedAppliance, isDemoMode));
        setConsolidatedReports([]);
      }
      setGenerated(true);
    } catch { RNAlert.alert('Erro', 'Não foi possível gerar o relatório.'); }
    finally { setLoading(false); }
  };

  const handleExportCSV = async () => {
    if (!report) return;
    try {
      const csv = generateAdvancedCSV(report);
      await shareReport(csv, 'Relatório EcoPower');
    } catch { RNAlert.alert('Erro', 'Não foi possível exportar o CSV.'); }
  };

  const fetchGoalsOnce = (): Promise<any[]> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve([]), 8000);
      const unsub = dataProvider.subscribeGoals(userId!, (goals) => {
        clearTimeout(timer); resolve(goals || []);
        if (!isDemoMode) setTimeout(() => { if (typeof unsub === 'function') unsub(); }, 100);
      }, isDemoMode);
    });
  };

  const handleExportPDF = async () => {
    if (!report || !userId) return;
    setPdfLoading(true);
    try {
      const [comparison, forecast, insightsData, goalsData] = await Promise.all([
        dataProvider.compareBoth(userId, undefined, isDemoMode).catch(() => null),
        dataProvider.generateForecast(userId, undefined, [], isDemoMode).catch(() => null),
        dataProvider.generateInsights(userId, [], isDemoMode).catch(() => null),
        fetchGoalsOnce().catch(() => []),
      ]);
      const pdfData: PDFReportData = { report, comparison, forecast, insights: insightsData || null, goals: Array.isArray(goalsData) ? goalsData : [] };
      await generateAndSharePDFReport(pdfData);
    } catch (e: any) { RNAlert.alert('Erro', e?.message || 'Não foi possível gerar o PDF.'); }
    finally { setPdfLoading(false); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{...sectionHeader, color: colors.text.muted}}>RELATÓRIOS</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <MaterialCommunityIcons name="file-document" size={22} color={colors.green.primary} style={{ marginRight: spacing.sm }} />
        <Text style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary }}>Relatórios</Text>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Tipo de Relatório</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {REPORT_TYPES.map(rt => (
            <TouchableOpacity
              key={rt.key}
              onPress={() => { setSelectedType(rt.key); setSelectedAppliance(undefined); }}
              style={{
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999,
                backgroundColor: selectedType === rt.key ? colors.green.primary : 'rgba(0,0,0,0.04)',
              }}
            >
              <Text style={{
                fontFamily: 'Poppins', color: selectedType === rt.key ? '#FFFFFF' : colors.text.darkMuted,
                fontWeight: '600', fontSize: 13,
              }}>{rt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {appliances.length > 0 && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Filtrar por Aparelho</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setSelectedAppliance(undefined)}
              style={{
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999,
                backgroundColor: !selectedAppliance ? colors.green.primary : 'rgba(0,0,0,0.04)',
                marginRight: spacing.sm,
              }}
            >
              <Text style={{ fontFamily: 'Poppins', color: !selectedAppliance ? '#FFFFFF' : colors.text.darkMuted, fontWeight: '600', fontSize: 13 }}>Todos</Text>
            </TouchableOpacity>
            {appliances.map(app => (
              <TouchableOpacity
                key={app.id}
                onPress={() => setSelectedAppliance(app.id)}
                style={{
                  paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999,
                  backgroundColor: selectedAppliance === app.id ? colors.green.primary : 'rgba(0,0,0,0.04)',
                  marginRight: spacing.sm,
                }}
              >
                <Text style={{ fontFamily: 'Poppins', color: selectedAppliance === app.id ? '#FFFFFF' : colors.text.darkMuted, fontWeight: '600', fontSize: 13 }}>{app.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Button title={loading ? 'Gerando...' : 'Gerar Relatório'} onPress={handleGenerate} disabled={loading} />

      {loading && <Loading message="Gerando relatório..." />}

      {generated && report && !loading && (
        <>
          <View style={{
            backgroundColor: colors.card, borderRadius: borderRadius.card,
            padding: spacing.md, marginTop: spacing.md, marginBottom: spacing.md, ...shadows.card,
          }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
              marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
            }}>Indicadores</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm + 4 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: '700', color: colors.green.primary }}>
                  {report.totalConsumption.toFixed(1)}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' }}>kWh Total</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: '700', color: colors.green.primary }}>
                  R$ {report.totalCost.toFixed(2)}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' }}>Custo Total</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: '700', color: colors.green.primary }}>
                  {report.dailyAverage.toFixed(2)}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' }}>Média (kWh)</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: '700', color: colors.green.primary }}>
                  {report.topConsumer?.percentage.toFixed(1) ?? 0}%
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' }}>Maior Consumidor</Text>
              </View>
            </View>

            {report.topConsumer && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)', marginTop: spacing.sm }}>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, fontSize: 13 }}>Maior Consumidor:</Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 13 }}>
                  {report.topConsumer.name} ({report.topConsumer.percentage.toFixed(1)}%)
                </Text>
              </View>
            )}
            {report.bottomConsumer && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' }}>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, fontSize: 13 }}>Menor Consumidor:</Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 13 }}>
                  {report.bottomConsumer.name} ({report.bottomConsumer.percentage.toFixed(1)}%)
                </Text>
              </View>
            )}
          </View>

          {report.applianceStats.length > 0 && (
            <View style={{
              backgroundColor: colors.card, borderRadius: borderRadius.card,
              padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
            }}>
              <Text style={{
                fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
                marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
              }}>Consumo por Aparelho</Text>
              {report.applianceStats.map(stat => (
                <View key={stat.name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm + 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 14 }}>{stat.name}</Text>
                    <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 12, marginTop: 2 }}>
                      {stat.consumption.toFixed(1)} kWh - R$ {stat.cost.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ height: 6, flex: 1, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginLeft: spacing.sm, marginRight: spacing.sm, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.min(stat.percentage, 100)}%`, backgroundColor: colors.green.primary, borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, fontSize: 12, fontWeight: '600', width: 45, textAlign: 'right' }}>
                    {stat.percentage.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{
            backgroundColor: colors.card, borderRadius: borderRadius.card,
            padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
          }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
              marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
            }}>Exportar</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.green.primary} style={{ marginRight: spacing.sm }} />
              <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkMuted, flex: 1 }}>
                Gere um relatório completo em PDF com gráficos e análises.
              </Text>
            </View>
            <Button title={pdfLoading ? 'Gerando PDF...' : 'Gerar Relatório PDF'} onPress={handleExportPDF} disabled={pdfLoading} />
          </View>
        </>
      )}

      {generated && consolidatedReports.length > 0 && !loading && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Comparativo</Text>
          {consolidatedReports.map(r => (
            <View key={r.type} style={{
              flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm + 2,
              borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
            }}>
              <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', flex: 1 }}>
                {r.type === 'daily' ? 'Diário' : r.type === 'weekly' ? 'Semanal' : 'Mensal'}
              </Text>
              <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, flex: 1, textAlign: 'center' }}>
                {r.totalConsumption.toFixed(1)} kWh
              </Text>
              <Text style={{ fontFamily: 'Poppins', color: colors.green.primary, fontWeight: '700', flex: 1, textAlign: 'right' }}>
                R$ {r.totalCost.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!generated && !loading && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.xl, marginTop: spacing.md, alignItems: 'center', ...shadows.card,
        }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.text.darkMuted + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <MaterialCommunityIcons name="file-document" size={28} color={colors.text.darkMuted} />
          </View>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '700', fontSize: 16, marginBottom: spacing.sm }}>
            Nenhum relatório gerado
          </Text>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, textAlign: 'center', fontSize: 14 }}>
            Selecione o tipo de relatório e clique em "Gerar Relatório".
          </Text>
        </View>
      )}

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { demoData } from '../src/data/demoData';
import { Appliance } from '../src/types';
import Button from '../src/components/Button';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

type SimulatorProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Simulator'>;
};

type SimulatorInputs = {
  power: string;
  hoursPerDay: string;
  daysPerMonth: string;
  tariff: string;
  reduction: string;
};

type ComparatorInputs = {
  powerA: string;
  hoursA: string;
  powerB: string;
  hoursB: string;
};

const createInputStyle = (colors: any) => ({
  fontFamily: 'Poppins' as const,
  backgroundColor: colors.surfaceLight,
  color: colors.text.primary,
  borderRadius: borderRadius.input,
  padding: 14,
  fontSize: 15,
  borderWidth: 1,
  borderColor: colors.border,
  marginBottom: spacing.sm,
});

const createLabelStyle = (colors: any) => ({
  fontFamily: 'Poppins' as const,
  color: colors.text.tertiary,
  fontSize: 13,
  fontWeight: '600' as const,
  marginBottom: 6,
  marginTop: spacing.xs,
});

export default function Simulator({ navigation }: SimulatorProps) {
  const { colors } = useTheme();
  const { isDemoMode } = useDemo();
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [inputs, setInputs] = useState<SimulatorInputs>({
    power: '', hoursPerDay: '', daysPerMonth: '30', tariff: '0.95', reduction: '10',
  });
  const [result, setResult] = useState<{
    dailyConsumption: number; monthlyConsumption: number; monthlyCost: number;
    annualCost: number; economyMonthly: number; economyAnnual: number;
  } | null>(null);

  const [comp, setComp] = useState<ComparatorInputs>({ powerA: '', hoursA: '', powerB: '', hoursB: '' });
  const [compResult, setCompResult] = useState<{ consA: number; consB: number; diff: number; annualEconomy: number } | null>(null);

  useEffect(() => {
    let unsubApps: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, user => {
      if (user || isDemoMode) {
        unsubApps = dataProvider.subscribeAppliances(
          isDemoMode ? 'demo-user' : (user?.uid || ''),
          list => {
            setAppliances(list);
          },
          isDemoMode
        );
      }
    });
    return () => { unsubAuth(); unsubApps?.(); };
  }, [isDemoMode]);

  const handleCalculate = () => {
    const power = Number(inputs.power);
    const hours = Number(inputs.hoursPerDay);
    const days = Number(inputs.daysPerMonth) || 30;
    const tariff = Number(inputs.tariff) || 0.95;
    const reduction = Number(inputs.reduction) || 0;
    if (!power || !hours) return;
    if (hours > 24) {
      Alert.alert('Horas inválidas', 'O máximo permitido é 24 horas por dia.');
      return;
    }
    const dailyConsumption = (power * hours) / 1000;
    const monthlyConsumption = dailyConsumption * days;
    const monthlyCost = monthlyConsumption * tariff;
    const annualCost = monthlyCost * 12;
    const economyMonthly = monthlyCost * (reduction / 100);
    const economyAnnual = economyMonthly * 12;
    setResult({ dailyConsumption, monthlyConsumption, monthlyCost, annualCost, economyMonthly, economyAnnual });
  };

  const handleCompare = () => {
    const pA = Number(comp.powerA); const hA = Number(comp.hoursA);
    const pB = Number(comp.powerB); const hB = Number(comp.hoursB);
    if (!pA || !hA || !pB || !hB) return;
    if (hA > 24 || hB > 24) {
      Alert.alert('Horas inválidas', 'O máximo permitido é 24 horas por dia.');
      return;
    }
    const consA = (pA * hA) / 1000; const consB = (pB * hB) / 1000;
    const diff = Math.abs(consA - consB);
    const tariff = Number(inputs.tariff) || 0.95;
    const annualEconomy = diff * 30 * 12 * tariff;
    setCompResult({ consA, consB, diff, annualEconomy });
  };

  const fillDemoAppliance = (appName: string) => {
    const app = demoData.fullAppliances.find(a => a.nome === appName);
    if (app) {
      setInputs(prev => ({ ...prev, power: String(app.potencia), hoursPerDay: String(app.horasPorDia) }));
    }
  };

  const fillUserAppliance = (app: Appliance) => {
    setInputs(prev => ({ ...prev, power: String(app.potencia || 0), hoursPerDay: String(app.horasPorDia || 1) }));
  };

  const demoPresets = isDemoMode
    ? [{ label: 'Simular Chuveiro', name: 'Chuveiro Elétrico' }, { label: 'Simular Ar', name: 'Ar Condicionado' }, { label: 'Simular Geladeira', name: 'Geladeira' }]
    : [];

  const userPresets = !isDemoMode && appliances.length > 0
    ? appliances
    : [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.sm, color: colors.text.muted }}>SIMULADOR</Text>
      <Text style={{
        fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.lg,
      }}>Simulador de Consumo</Text>

      {demoPresets.length > 0 && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Exemplos Rápidos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {demoPresets.map(p => (
              <TouchableOpacity key={p.name} onPress={() => fillDemoAppliance(p.name)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.green.primary }}>
                <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontWeight: '600', fontSize: 13 }}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {userPresets.length > 0 && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Seus Aparelhos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {userPresets.map(app => (
              <TouchableOpacity key={app.id} onPress={() => fillUserAppliance(app)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.green.primary }}>
                <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontWeight: '600', fontSize: 13 }}>{app.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Dados do Aparelho</Text>

        <Text style={createLabelStyle(colors)}>Potência (W)</Text>
        <TextInput
          style={createInputStyle(colors)}
          value={inputs.power} onChangeText={t => setInputs(prev => ({ ...prev, power: t }))}
          keyboardType="decimal-pad" placeholder="Ex: 1500" placeholderTextColor={colors.text.muted}
        />
        <Text style={createLabelStyle(colors)}>Horas por Dia</Text>
        <TextInput
          style={createInputStyle(colors)}
          value={inputs.hoursPerDay} onChangeText={t => setInputs(prev => ({ ...prev, hoursPerDay: t }))}
          keyboardType="decimal-pad" placeholder="Ex: 8" placeholderTextColor={colors.text.muted}
        />
        <Text style={createLabelStyle(colors)}>Dias por Mês</Text>
        <TextInput
          style={createInputStyle(colors)}
          value={inputs.daysPerMonth} onChangeText={t => setInputs(prev => ({ ...prev, daysPerMonth: t }))}
          keyboardType="decimal-pad" placeholder="30" placeholderTextColor={colors.text.muted}
        />
        <Text style={createLabelStyle(colors)}>Tarifa (R$/kWh)</Text>
        <TextInput
          style={createInputStyle(colors)}
          value={inputs.tariff} onChangeText={t => setInputs(prev => ({ ...prev, tariff: t }))}
          keyboardType="decimal-pad" placeholder="0.95" placeholderTextColor={colors.text.muted}
        />
        <Button title="Calcular Consumo" onPress={handleCalculate} />
      </View>

      {result && (
        <View style={{
          backgroundColor: colors.green.primary, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.floating,
        }}>
          <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
            <MaterialCommunityIcons name="flash-outline" size={28} color="#FFFFFF" />
          </View>
          {[
            { label: 'Consumo Diário', value: `${result.dailyConsumption.toFixed(2)} kWh` },
            { label: 'Consumo Mensal', value: `${result.monthlyConsumption.toFixed(2)} kWh` },
            { label: 'Custo Mensal', value: `R$ ${result.monthlyCost.toFixed(2)}` },
            { label: 'Custo Anual', value: `R$ ${result.annualCost.toFixed(2)}` },
          ].map((row, i) => (
            <View key={i} style={{
              flexDirection: 'row', justifyContent: 'space-between',
              paddingVertical: spacing.sm,
              borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.2)',
            }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontSize: 14 }}>{row.label}</Text>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontWeight: '700', fontSize: 14 }}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}

      {result && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Simulação de Economia</Text>

          <Text style={createLabelStyle(colors)}>Redução de uso (%)</Text>
          <TextInput
            style={createInputStyle(colors)}
            value={inputs.reduction} onChangeText={t => setInputs(prev => ({ ...prev, reduction: t }))}
            keyboardType="decimal-pad" placeholder="10" placeholderTextColor={colors.text.muted}
          />
          <Button title="Calcular Economia" onPress={handleCalculate} variant="secondary" />

          <View style={{ marginTop: spacing.sm, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.card, padding: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
              <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, fontSize: 14 }}>Economia Mensal</Text>
              <Text style={{ fontFamily: 'Poppins', color: colors.green.primary, fontWeight: '700', fontSize: 15 }}>R$ {result.economyMonthly.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
              <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, fontSize: 14 }}>Economia Anual</Text>
              <Text style={{ fontFamily: 'Poppins', color: colors.green.primary, fontWeight: '700', fontSize: 15 }}>R$ {result.economyAnnual.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Comparador de Aparelhos</Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 14, marginBottom: spacing.sm }}>Equipamento A</Text>
            <TextInput style={createInputStyle(colors)} value={comp.powerA} onChangeText={t => setComp(prev => ({ ...prev, powerA: t }))} keyboardType="decimal-pad" placeholder="Potência (W)" placeholderTextColor={colors.text.muted} />
            <TextInput style={createInputStyle(colors)} value={comp.hoursA} onChangeText={t => setComp(prev => ({ ...prev, hoursA: t }))} keyboardType="decimal-pad" placeholder="Horas/dia" placeholderTextColor={colors.text.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '600', fontSize: 14, marginBottom: spacing.sm }}>Equipamento B</Text>
            <TextInput style={createInputStyle(colors)} value={comp.powerB} onChangeText={t => setComp(prev => ({ ...prev, powerB: t }))} keyboardType="decimal-pad" placeholder="Potência (W)" placeholderTextColor={colors.text.muted} />
            <TextInput style={createInputStyle(colors)} value={comp.hoursB} onChangeText={t => setComp(prev => ({ ...prev, hoursB: t }))} keyboardType="decimal-pad" placeholder="Horas/dia" placeholderTextColor={colors.text.muted} />
          </View>
        </View>

        <Button title="Comparar" onPress={handleCompare} variant="secondary" />

        {compResult && (
          <View style={{ marginTop: spacing.sm, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.card, padding: spacing.md }}>
            <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', color: colors.text.dark, marginBottom: spacing.sm }}>Comparação</Text>
            {[
              { label: 'Consumo A', value: `${compResult.consA.toFixed(2)} kWh/dia`, color: colors.text.dark },
              { label: 'Consumo B', value: `${compResult.consB.toFixed(2)} kWh/dia`, color: colors.text.dark },
              { label: 'Diferença', value: `${compResult.diff.toFixed(2)} kWh/dia`, color: colors.green.primary },
              { label: 'Economia Anual', value: `R$ ${compResult.annualEconomy.toFixed(2)}`, color: colors.green.dark },
            ].map((row, i) => (
              <View key={i} style={{
                flexDirection: 'row', justifyContent: 'space-between',
                paddingVertical: spacing.xs,
                borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: 'rgba(0,0,0,0.04)',
              }}>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, fontSize: 13 }}>{row.label}</Text>
                <Text style={{ fontFamily: 'Poppins', color: row.color, fontWeight: '600', fontSize: 13 }}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

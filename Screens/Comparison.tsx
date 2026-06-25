import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { PeriodComparison } from '../src/types';
import Button from '../src/components/Button';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, sectionHeader } from '../src/theme/designSystem';

type ComparisonProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Comparison'>;
};

type ComparisonTab = 'month' | 'week';

export default function Comparison({ navigation }: ComparisonProps) {
  const { colors } = useTheme();
  const { isDemoMode } = useDemo();

  const [userId, setUserId] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<{ month: PeriodComparison; week: PeriodComparison } | null>(null);
  const [tarifa, setTarifa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ComparisonTab>('month');

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        unsubProfile = dataProvider.subscribeUserProfile(uid, profile => { setTarifa(profile?.tarifaKwh ?? 0); }, isDemoMode);
        setLoading(false);
      } else { setLoading(false); }
    });
    return () => { unsubAuth(); unsubProfile?.(); };
  }, [isDemoMode]);

  useEffect(() => {
    if (userId) {
      dataProvider.compareBoth(userId, tarifa, isDemoMode).then(data => { setComparisons(data); }).catch(() => {});
    }
  }, [userId, tarifa, isDemoMode]);

  if (loading || !comparisons) {
    return <Loading message="Carregando comparativos..." />;
  }

  const active = activeTab === 'month' ? comparisons.month : comparisons.week;
  const variationColor = active.variation.isSavings ? colors.green.dark : colors.alert.danger;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <MaterialCommunityIcons name="compare" size={24} color={colors.green.primary} />
        <View style={{ marginLeft: spacing.sm }}>
          <Text style={{...sectionHeader, color: colors.text.muted}}>Compare seu consumo entre períodos</Text>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary, marginTop: 2,
          }}>Comparativo</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm }}>
        <TouchableOpacity
          onPress={() => setActiveTab('month')}
          style={{
            flex: 1, paddingVertical: 12, borderRadius: borderRadius.md,
            backgroundColor: activeTab === 'month' ? colors.green.primary : colors.surfaceLight,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontFamily: 'Poppins', color: activeTab === 'month' ? '#FFFFFF' : colors.text.tertiary,
            fontWeight: '700', fontSize: 14,
          }}>Mensal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('week')}
          style={{
            flex: 1, paddingVertical: 12, borderRadius: borderRadius.md,
            backgroundColor: activeTab === 'week' ? colors.green.primary : colors.surfaceLight,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontFamily: 'Poppins', color: activeTab === 'week' ? '#FFFFFF' : colors.text.tertiary,
            fontWeight: '700', fontSize: 14,
          }}>Semanal</Text>
        </TouchableOpacity>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        borderLeftWidth: 4, borderLeftColor: variationColor,
      }}>
        <Text style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: '600', color: colors.text.dark, lineHeight: 22 }}>
          {active.message}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <View style={{
            flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.card,
            padding: spacing.md, alignItems: 'center', ...shadows.card,
          }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 11, color: colors.text.darkMuted, fontWeight: '600',
              letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs,
            }}>{active.previousPeriod.label}</Text>
            <Text style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.dark }}>
              {active.previousPeriod.consumption.toFixed(1)}
            </Text>
            <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.darkMuted, marginTop: 2 }}>kWh</Text>
            <Text style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: '600', color: colors.text.darkSecondary, marginTop: spacing.sm }}>
              R$ {active.previousPeriod.cost.toFixed(2)}
            </Text>
          </View>
        <View style={{ paddingHorizontal: spacing.sm, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', color: colors.text.tertiary }}>VS</Text>
        </View>
          <View style={{
            flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.card,
            padding: spacing.md, alignItems: 'center', ...shadows.card,
          }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 11, color: colors.text.darkMuted, fontWeight: '600',
              letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs,
            }}>{active.currentPeriod.label}</Text>
            <Text style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.green.primary }}>
              {active.currentPeriod.consumption.toFixed(1)}
            </Text>
            <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.darkMuted, marginTop: 2 }}>kWh</Text>
            <Text style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: '600', color: colors.green.primary, marginTop: spacing.sm }}>
              R$ {active.currentPeriod.cost.toFixed(2)}
            </Text>
          </View>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Variação</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.darkMuted, marginBottom: spacing.sm }}>Consumo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name={active.variation.isSavings ? 'arrow-down-bold' : 'arrow-up-bold'} size={18} color={variationColor} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: '700', color: variationColor }}>
                {active.variation.isSavings ? '-' : '+'}{Math.abs(active.variation.consumptionPercent).toFixed(1)}%
              </Text>
            </View>
            <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkSecondary, marginTop: spacing.xs }}>
              {active.variation.isSavings ? '-' : '+'}{Math.abs(active.variation.consumptionDiff).toFixed(1)} kWh
            </Text>
          </View>
          <View style={{ width: 1, height: 60, backgroundColor: 'rgba(0,0,0,0.04)', marginHorizontal: spacing.sm }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: colors.text.darkMuted, marginBottom: spacing.sm }}>Custo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name={active.variation.isSavings ? 'arrow-down-bold' : 'arrow-up-bold'} size={18} color={variationColor} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: '700', color: variationColor }}>
                {active.variation.isSavings ? '-' : '+'}{Math.abs(active.variation.costPercent).toFixed(1)}%
              </Text>
            </View>
            <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkSecondary, marginTop: spacing.xs }}>
              {active.variation.isSavings ? '-' : '+'}R$ {Math.abs(active.variation.costDiff).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {active.variation.isSavings && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, alignItems: 'center', ...shadows.card,
          borderWidth: 1, borderColor: colors.green.primary,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 11, color: colors.text.darkMuted, fontWeight: '600',
            letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.sm,
          }}>Economia</Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: '700', color: colors.green.primary, marginBottom: spacing.xs }}>
            {active.variation.savingsAmount.toFixed(1)} kWh
          </Text>
          <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkSecondary, textAlign: 'center' }}>
            Você consumiu menos em relação ao período anterior.
          </Text>
        </View>
      )}

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Resumo</Text>
        {[
          { label: 'Período atual', value: active.currentPeriod.label },
          { label: 'Período anterior', value: active.previousPeriod.label },
          { label: 'Consumo atual', value: `${active.currentPeriod.consumption.toFixed(1)} kWh` },
          { label: 'Consumo anterior', value: `${active.previousPeriod.consumption.toFixed(1)} kWh` },
          { label: 'Diferença', value: `${active.variation.isSavings ? '-' : '+'}${Math.abs(active.variation.consumptionDiff).toFixed(1)} kWh`, color: variationColor },
        ].map((row, i) => (
          <View key={i} style={{
            flexDirection: 'row', justifyContent: 'space-between',
            paddingVertical: 10,
            borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: 'rgba(0,0,0,0.04)',
          }}>
            <Text style={{ fontFamily: 'Poppins', fontSize: 14, color: colors.text.darkSecondary }}>{row.label}</Text>
            <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: (row as any).color || colors.text.dark }}>{row.value}</Text>
          </View>
        ))}
      </View>

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

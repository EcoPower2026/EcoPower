import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { borderRadius, shadows, spacing } from '../../theme/designSystem';
import { EnvironmentalImpact } from '../types';

interface ImpactCardProps {
  impact: EnvironmentalImpact;
}

export default function ImpactCard({ impact }: ImpactCardProps) {
  const { colors } = useTheme();

  const metrics = [
    {
      icon: 'cloud-outline' as const,
      label: 'CO₂ Evitado',
      value: `${impact.co2AvoidedKg} kg`,
      color: '#3498DB',
    },
    {
      icon: 'leaf-outline' as const,
      label: 'Árvores Equivalentes',
      value: `${impact.treesEquivalent} ${impact.treesEquivalent === 1 ? 'árvore' : 'árvores'}`,
      color: '#2ECC71',
    },
    {
      icon: 'flash-outline' as const,
      label: 'Energia Economizada',
      value: `${impact.energySavedKwh} kWh`,
      color: '#F39C12',
    },
    {
      icon: 'cash-outline' as const,
      label: 'Impacto Financeiro',
      value: `R$ ${impact.financialSavings.toFixed(2)}`,
      color: '#27AE60',
    },
  ];

  return (
    <View style={styles.grid}>
      {metrics.map((metric, idx) => (
        <View
          key={idx}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: metric.color + '15', borderColor: metric.color + '30' }]}>
            <Ionicons name={metric.icon} size={22} color={metric.color} />
          </View>
          <Text style={[styles.value, { color: colors.text.primary }]}>
            {metric.value}
          </Text>
          <Text style={[styles.label, { color: colors.text.muted }]}>
            {metric.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    ...shadows.soft,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  value: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnvironmentalImpact, EfficiencyState, StreakState } from '../types';
import { spacing, borderRadius } from '../../theme/designSystem';

type ShareCardProps = {
  impact: EnvironmentalImpact;
  efficiency: EfficiencyState;
  streak: StreakState;
  totalEconomia: number;
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Iniciante', 2: 'Consciente', 3: 'Eficiente', 4: 'Sustentável',
  5: 'Eco Master', 6: 'Especialista Energético', 7: 'Expert em Energia',
  8: 'Visionário', 9: 'Lenda Verde', 10: 'Eco Legend',
};

export default function ShareCard({ impact, efficiency, streak, totalEconomia }: ShareCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="leaf" size={28} color="#FFFFFF" />
        <Text style={styles.title}>EcoPower</Text>
      </View>

      <Text style={styles.subtitle}>Impacto Ambiental</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="flash" size={20} color="#4ADE80" />
          <Text style={styles.statValue}>{impact.energySavedKwh.toFixed(0)}</Text>
          <Text style={styles.statLabel}>kWh</Text>
          <Text style={styles.statDesc}>Economizados</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="leaf-outline" size={20} color="#4ADE80" />
          <Text style={styles.statValue}>{impact.co2AvoidedKg.toFixed(0)}</Text>
          <Text style={styles.statLabel}>kg</Text>
          <Text style={styles.statDesc}>CO₂ Evitado</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="leaf" size={20} color="#4ADE80" />
          <Text style={styles.statValue}>{impact.treesEquivalent.toFixed(0)}</Text>
          <Text style={styles.statLabel}>árvores</Text>
          <Text style={styles.statDesc}>Equivalentes</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Economia Total</Text>
          <Text style={styles.rowValue}>R$ {totalEconomia.toFixed(2)}</Text>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Nível</Text>
          <Text style={styles.rowValue}>{LEVEL_NAMES[efficiency.currentLevel] || 'Iniciante'}</Text>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.rowLabel}>Sequência</Text>
          <Text style={styles.rowValue}>{streak.currentStreak} dias</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Ionicons name="leaf" size={14} color="#22C55E" />
        <Text style={styles.footerText}>Economize energia. Preserve o planeta.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: '#0A1A12',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#22C55E30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: '#22C55E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDesc: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#22C55E20',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rowItem: {
    alignItems: 'center',
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rowValue: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#22C55E20',
  },
  footerText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 0.3,
  },
});

import React, { useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, typography } from '../src/theme/designSystem';
import { useEcoImpact } from '../src/ecoImpact/EcoImpactContext';
import { EFFICIENCY_LEVELS } from '../src/ecoImpact/types';
import EfficiencyLevelCard from '../src/ecoImpact/components/EfficiencyLevelCard';
import StreakCard from '../src/ecoImpact/components/StreakCard';
import ImpactCard from '../src/ecoImpact/components/ImpactCard';
import AchievementCard from '../src/ecoImpact/components/AchievementCard';
import Loading from '../src/components/Loading';

const IMPACT_ICONS: Record<string, { icon: string; bg: string }> = {
  'CO₂ Evitado': { icon: 'leaf-outline', bg: '#2B6777' },
  'Árvores Equivalentes': { icon: 'leaf', bg: '#3FA34D' },
  'Energia Economizada': { icon: 'flash', bg: '#7CB342' },
  'Impacto Financeiro': { icon: 'cash', bg: '#2E7D32' },
};

export default function ImpactScreen() {
  const { colors, themeName } = useTheme();
  const isPremium = themeName === 'ecoNaturePremium';

  const {
    achievements,
    efficiency,
    streak,
    impact,
    totalEconomia,
    isLoading,
    refreshImpact,
    getLevelProgress,
  } = useEcoImpact();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshImpact();
    setRefreshing(false);
  }, [refreshImpact]);

  const unlockedCount = achievements.filter(a => a.desbloqueada).length;
  const totalCount = achievements.length;

  if (isLoading) {
    return <Loading message="Calculando seu impacto..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.green.primary}
          colors={[colors.green.primary]}
        />
      }
    >
      <View style={[styles.summaryRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: isPremium ? 24 : borderRadius.card }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.green.primary }]}>
            {unlockedCount}/{totalCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.text.muted }]}>
            Conquistas
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
            {streak.longestStreak}d
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.text.muted }]}>
            Maior Sequência
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
            R$ {totalEconomia.toFixed(0)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.text.muted }]}>
            Economia Total
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.blue.primary }]}>
            {impact.co2AvoidedKg}kg
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.text.muted }]}>
            CO₂ Evitado
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Nível de Eficiência
        </Text>
        <EfficiencyLevelCard
          currentLevel={efficiency.currentLevel}
          currentPoints={efficiency.currentPoints}
          getProgress={getLevelProgress}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Sequência de Economia
        </Text>
        <StreakCard
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Seu Impacto Ambiental
        </Text>
        <ImpactCard impact={impact} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Conquistas
          </Text>
          <TouchableOpacity>
            <Text style={[styles.showAll, { color: colors.green.primary }]}>
              {unlockedCount}/{totalCount}
            </Text>
          </TouchableOpacity>
        </View>
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: isPremium ? 24 : borderRadius.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Estatísticas
        </Text>
        <View style={styles.statsGrid}>
          <StatItem label="Conquistas Desbloqueadas" value={`${unlockedCount} / ${totalCount}`} color={colors.green.primary} colors={colors} />
          <StatItem label="Maior Sequência" value={`${streak.longestStreak} dias`} color={colors.text.primary} colors={colors} />
          <StatItem label="Economia Total" value={`R$ ${totalEconomia.toFixed(2)}`} color={colors.green.primary} colors={colors} />
          <StatItem label="CO₂ Evitado" value={`${impact.co2AvoidedKg} kg`} color={colors.blue.primary} colors={colors} />
          <StatItem label="Nível Atual" value={EFFICIENCY_LEVELS.find(l => l.level === efficiency.currentLevel)?.nome || '-'} color={colors.text.primary} colors={colors} />
          <StatItem label="Pontuação" value={`${efficiency.currentPoints} pts`} color={colors.green.light} colors={colors} />
        </View>
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  showAll: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: 18,
    ...shadows.card,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

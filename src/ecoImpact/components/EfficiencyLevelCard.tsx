import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { borderRadius, shadows, spacing, typography } from '../../theme/designSystem';
import { EFFICIENCY_LEVELS } from '../types';

interface EfficiencyLevelCardProps {
  currentLevel: number;
  currentPoints: number;
  getProgress: (points: number, level: number) => number;
}

export default function EfficiencyLevelCard({ currentLevel, currentPoints, getProgress }: EfficiencyLevelCardProps) {
  const { colors } = useTheme();
  const levelDef = EFFICIENCY_LEVELS.find(l => l.level === currentLevel) || EFFICIENCY_LEVELS[0];
  const progress = getProgress(currentPoints, currentLevel);
  const nextLevel = EFFICIENCY_LEVELS.find(l => l.level === currentLevel + 1);
  const nextLevelPoints = nextLevel ? nextLevel.pontosMinimos : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{currentLevel}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
            Eco Level
          </Text>
          <Text style={[styles.levelName, { color: colors.text.primary }]}>
            {levelDef.nome}
          </Text>
        </View>
        <Ionicons name="flash" size={24} color={colors.green.primary} />
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.green.primary }]} />
        </View>
        <View style={styles.pointsRow}>
          <Text style={[styles.pointsText, { color: colors.text.secondary }]}>
            {currentPoints} pts
          </Text>
          {nextLevelPoints && (
            <Text style={[styles.pointsText, { color: colors.text.muted }]}>
              {nextLevelPoints} pts
            </Text>
          )}
        </View>
      </View>

      <View style={styles.levelsPreview}>
        {EFFICIENCY_LEVELS.slice(0, 6).map((lvl, idx) => (
          <React.Fragment key={lvl.level}>
            <View style={styles.levelDot}>
              <View style={[
                styles.dot,
                { backgroundColor: lvl.level <= currentLevel ? colors.green.primary : colors.surfaceLight },
              ]} />
              <Text style={[styles.dotLabel, {
                color: lvl.level <= currentLevel ? colors.green.primary : colors.text.muted,
                fontWeight: lvl.level === currentLevel ? '700' : '500',
              }]}>
                {lvl.level}
              </Text>
            </View>
            {idx < 5 && (
              <View style={[styles.dotLine, { backgroundColor: lvl.level < currentLevel ? colors.green.primary : colors.divider }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: 18,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2ECC7120',
    borderWidth: 2,
    borderColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  levelNumber: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: '#2ECC71',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  pointsText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
  },
  levelsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDot: {
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 2,
  },
  dotLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
  },
  dotLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 12,
  },
});

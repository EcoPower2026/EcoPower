import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { borderRadius, shadows, spacing } from '../../theme/designSystem';
import { STREAK_MILESTONES } from '../types';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.streakInfo}>
          <Text style={[styles.label, { color: colors.text.muted }]}>
            Sequência Atual
          </Text>
          <View style={styles.streakValueRow}>
            <Text style={[styles.streakNumber, { color: colors.green.primary }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.streakUnit, { color: colors.text.secondary }]}>
              dias
            </Text>
          </View>
        </View>
        <View style={[styles.longestBox, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.longestLabel, { color: colors.text.muted }]}>
            Maior
          </Text>
          <Text style={[styles.longestValue, { color: colors.text.primary }]}>
            {longestStreak} dias
          </Text>
        </View>
      </View>

      <View style={styles.milestonesRow}>
        {STREAK_MILESTONES.map((milestone, idx) => {
          const reached = currentStreak >= milestone;
          return (
            <React.Fragment key={milestone}>
              <View style={styles.milestoneItem}>
                <View style={[
                  styles.milestoneDot,
                  { backgroundColor: reached ? colors.green.primary : colors.surfaceLight, borderColor: reached ? colors.green.primary : colors.divider },
                ]}>
                  {reached && (
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.milestoneLabel, { color: reached ? colors.text.primary : colors.text.muted }]}>
                  {milestone}d
                </Text>
              </View>
              {idx < STREAK_MILESTONES.length - 1 && (
                <View style={[styles.milestoneLine, { backgroundColor: reached ? colors.green.primary : colors.divider }]} />
              )}
            </React.Fragment>
          );
        })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  streakInfo: {},
  label: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakNumber: {
    fontFamily: 'Poppins',
    fontSize: 36,
    fontWeight: '800',
    marginRight: 6,
  },
  streakUnit: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '500',
  },
  longestBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  longestLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  longestValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  milestonesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneItem: {
    alignItems: 'center',
  },
  milestoneDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  milestoneLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
  },
  milestoneLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 22,
  },
});

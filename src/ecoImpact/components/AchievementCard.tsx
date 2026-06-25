import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { borderRadius, shadows, spacing } from '../../theme/designSystem';
import { Achievement } from '../types';
import { getCategoriaColor } from '../ecoImpactService';

interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
}

export default function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement.desbloqueada) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [achievement.desbloqueada, scaleAnim, opacityAnim]);

  const catColor = getCategoriaColor(achievement.categoria);

  if (compact) {
    return (
      <Animated.View
        style={[
          compactStyles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: achievement.desbloqueada ? 1 : 0.4,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[compactStyles.iconCircle, { backgroundColor: achievement.desbloqueada ? catColor + '20' : 'transparent', borderColor: achievement.desbloqueada ? catColor : colors.border }]}>
          <Ionicons
            name={achievement.icone as any}
            size={20}
            color={achievement.desbloqueada ? catColor : colors.text.muted}
          />
        </View>
        <View style={compactStyles.textArea}>
          <Text style={[compactStyles.name, { color: achievement.desbloqueada ? colors.text.primary : colors.text.muted }]}>
            {achievement.nome}
          </Text>
          <Text style={[compactStyles.desc, { color: colors.text.muted }]} numberOfLines={1}>
            {achievement.descricao}
          </Text>
        </View>
        {achievement.desbloqueada && (
          <View style={[compactStyles.badge, { backgroundColor: catColor }]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: achievement.desbloqueada ? catColor + '25' : colors.border,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: achievement.desbloqueada ? catColor + '15' : colors.surfaceLight, borderColor: achievement.desbloqueada ? catColor : colors.divider }]}>
        <Ionicons
          name={achievement.icone as any}
          size={28}
          color={achievement.desbloqueada ? catColor : colors.text.muted}
        />
      </View>
      <View style={styles.textArea}>
        <Text style={[styles.name, { color: achievement.desbloqueada ? colors.text.primary : colors.text.tertiary }]}>
          {achievement.nome}
        </Text>
        <Text style={[styles.desc, { color: colors.text.muted }]}>
          {achievement.descricao}
        </Text>
        {achievement.desbloqueada && achievement.dataDesbloqueio && (
          <Text style={[styles.date, { color: catColor }]}>
            {new Date(achievement.dataDesbloqueio).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </View>
      {achievement.desbloqueada ? (
        <View style={[styles.statusBadge, { backgroundColor: catColor }]}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        </View>
      ) : (
        <Ionicons name="lock-closed-outline" size={16} color={colors.text.muted} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textArea: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  desc: {
    fontFamily: 'Poppins',
    fontSize: 12,
    lineHeight: 16,
  },
  date: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});

const compactStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 160,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textArea: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
  },
  desc: {
    fontFamily: 'Poppins',
    fontSize: 10,
    marginTop: 1,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Flame, Calendar, Star, Trophy } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';

interface GamificationStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalPoints: number;
  dailyStreak: number;
  weeklyStreak: number;
  perfectDays: number;
  xpToNext: number;
  xpProgress: number;
}

interface GamificationDashboardProps {
  stats: GamificationStats;
  levelLabel: string;
  xpLabel: string;
  nextLevelLabel: string;
  dailyStreakLabel: string;
  weeklyStreakLabel: string;
  perfectDaysLabel: string;
  totalPointsLabel: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  stats,
  levelLabel,
  xpLabel,
  nextLevelLabel,
  dailyStreakLabel,
  weeklyStreakLabel,
  perfectDaysLabel,
  totalPointsLabel,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.gradient}
      >
        {/* Level Section */}
        <View style={styles.levelSection}>
          <View style={styles.levelInfo}>
            <View style={styles.levelIcon}>
              <Crown size={36} color={colors.warning[500]} />
            </View>
            <View style={styles.levelDetails}>
              <Text style={styles.levelText}>
                {levelLabel} {stats.level}
              </Text>
              <Text style={styles.xpText}>
                {stats.currentXP.toLocaleString()} / {stats.nextLevelXP.toLocaleString()} {xpLabel}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <LinearGradient
                colors={colors.gradients.warning}
                style={[styles.progressFill, { width: `${stats.xpProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {stats.xpToNext.toLocaleString()} {nextLevelLabel}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.error[50] }]}>
              <Flame size={24} color={colors.error[500]} />
            </View>
            <Text style={styles.statValue}>{stats.dailyStreak}</Text>
            <Text style={styles.statLabel}>{dailyStreakLabel}</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary[50] }]}>
              <Calendar size={24} color={colors.primary[500]} />
            </View>
            <Text style={styles.statValue}>{stats.weeklyStreak}</Text>
            <Text style={styles.statLabel}>{weeklyStreakLabel}</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning[50] }]}>
              <Star size={24} color={colors.warning[500]} />
            </View>
            <Text style={styles.statValue}>{stats.perfectDays}</Text>
            <Text style={styles.statLabel}>{perfectDaysLabel}</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.success[50] }]}>
              <Trophy size={24} color={colors.success[500]} />
            </View>
            <Text style={styles.statValue}>{stats.totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{totalPointsLabel}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  gradient: {
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    ...shadows.lg,
  },
  levelSection: {
    marginBottom: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  levelIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warning[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xl,
    ...shadows.md,
  },
  levelDetails: {
    flex: 1,
  },
  levelText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  xpText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[600],
    letterSpacing: 0.1,
  },
  progressContainer: {
    gap: spacing.sm,
  },
  progressBackground: {
    height: 12,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
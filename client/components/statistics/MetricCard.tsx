import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from "../../constants/theme";
import { NutritionMetric } from "../../src/types/statistics";
import { getStatusColor } from "../../src/utils/statisticsHelper";
import { getStatusIcon, getTrendIcon } from "@/src/utils/iconHelper";

interface MetricCardProps {
  metric: NutritionMetric;
  targetLabel: string;
  trendLabel: string;
  shouldShowWarnings: boolean;
  language: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  targetLabel,
  trendLabel,
  shouldShowWarnings,
  language,
}) => {
  const handlePress = () => {
    Alert.alert(metric.name, metric.description);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      <LinearGradient colors={["#FFFFFF", "#FAFBFC"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>{metric.icon}</View>
          <View style={styles.info}>
            <Text style={styles.name}>{metric.name}</Text>
            <View style={styles.statusContainer}>
              {getStatusIcon(metric.status)}
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(metric.status) },
                ]}
              >
                {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.trendContainer}>
            {getTrendIcon(metric.trend)}
            <Text style={styles.trendText}>
              {metric.lastWeekChange > 0 ? "+" : ""}
              {metric.lastWeekChange.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Values */}
        <View style={styles.valuesContainer}>
          <View style={styles.currentValue}>
            <Text style={styles.valueText}>
              {metric.value.toLocaleString()} {metric.unit}
            </Text>
            <Text style={styles.targetText}>
              {targetLabel}: {metric.target.toLocaleString()} {metric.unit}
            </Text>
          </View>
          <View
            style={[
              styles.percentageContainer,
              { backgroundColor: `${metric.color}15` },
            ]}
          >
            <Text style={[styles.percentageText, { color: metric.color }]}>
              {metric.percentage}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(metric.percentage, 100)}%`,
                  backgroundColor: metric.color,
                },
              ]}
            />
          </View>
        </View>

        {/* Mini Chart */}
        {metric.chartData && metric.chartData.some((v: number) => v > 0) && (
          <View style={styles.miniChart}>
            <Text style={styles.miniChartTitle}>
              {language === "he" ? "מגמה" : "Trend"}
            </Text>
            <View style={styles.miniChartContainer}>
              {metric.chartData
                .slice(-7)
                .map((value: number, index: React.Key | null | undefined) => (
                  <View
                    key={index}
                    style={[
                      styles.miniChartBar,
                      {
                        height: Math.max(
                          4,
                          (value / Math.max(...metric.chartData!.slice(-7))) *
                            24
                        ),
                        backgroundColor: metric.color,
                        opacity: 0.4 + (Number(index) / 7) * 0.6,
                      },
                    ]}
                  />
                ))}
            </View>
          </View>
        )}

        {/* Recommendation */}
        {metric.recommendation && shouldShowWarnings && (
          <View style={styles.recommendationContainer}>
            <View
              style={[
                styles.recommendationIcon,
                { backgroundColor: `${metric.color}20` },
              ]}
            >
              <Sparkles size={16} color={metric.color} />
            </View>
            <Text style={styles.recommendationText}>
              {metric.recommendation}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  gradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neutral[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
    ...shadows.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
    letterSpacing: 0.2,
    textTransform: "capitalize",
  },
  trendContainer: {
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  trendText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[600],
    marginTop: spacing.xs,
    letterSpacing: 0.1,
  },
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  currentValue: {
    flex: 1,
  },
  valueText: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  targetText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.medium,
  },
  percentageContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  percentageText: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: typography.fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBackground: {
    height: 12,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.sm,
  },
  miniChart: {
    marginBottom: spacing.md,
  },
  miniChartTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  miniChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 28,
    gap: 3,
  },
  miniChartBar: {
    flex: 1,
    minHeight: 4,
    borderRadius: 2,
  },
  recommendationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  recommendationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  recommendationText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[800],
    flex: 1,
    letterSpacing: 0.1,
  },
});

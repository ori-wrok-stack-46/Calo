import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from "../../constants/theme";
import { TimePeriod } from "../../src/types/statistics";

interface TimeFilter {
  key: TimePeriod;
  label: string;
}

interface TimePeriodFilterProps {
  filters: TimeFilter[];
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export const TimePeriodFilter: React.FC<TimePeriodFilterProps> = ({
  filters,
  selectedPeriod,
  onPeriodChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={styles.filterButton}
            onPress={() => onPeriodChange(filter.key)}
            activeOpacity={0.8}
          >
            {selectedPeriod === filter.key ? (
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.activeGradient}
              >
                <Text style={styles.activeText}>{filter.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveButton}>
                <Text style={styles.inactiveText}>{filter.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing["2xl"],
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    ...shadows.sm,
  },
  filterButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  activeGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
    ...shadows.md,
  },
  inactiveButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  activeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  inactiveText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[600],
    letterSpacing: 0.2,
  },
});

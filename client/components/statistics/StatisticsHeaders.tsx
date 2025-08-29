import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography, shadows } from "../../constants/theme";

interface StatisticsHeaderProps {
  title: string;
  subtitle: string;
}

export const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({
  title,
  subtitle,
}) => {
  return (
    <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["4xl"],
    paddingBottom: spacing["3xl"],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.neutral[900],
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.relaxed,
    letterSpacing: 0.1,
    textAlign: "center",
  },
});

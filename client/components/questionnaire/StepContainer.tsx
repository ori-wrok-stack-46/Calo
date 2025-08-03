import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface StepContainerProps {
  title: string;
  subtitle: string;
  icon?: string;
  children: React.ReactNode;
}

export default function StepContainer({
  title,
  subtitle,
  icon,
  children,
}: StepContainerProps) {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text
          style={[
            styles.title,
            { color: colors.text },
            isRTL && styles.titleRTL,
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textSecondary },
            isRTL && styles.subtitleRTL,
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerRTL: {
    alignItems: "center",
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  titleRTL: {
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  subtitleRTL: {
    textAlign: "center",
  },
  content: {
    gap: 24,
  },
});

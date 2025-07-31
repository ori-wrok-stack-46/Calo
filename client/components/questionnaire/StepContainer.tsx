import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5fdf8", // subtle green-tinted background
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
    color: "#22c55e", // Tailwind green-500
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#065f46", // Tailwind green-800
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#047857", // Tailwind green-700
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  content: {
    gap: 24,
  },
});

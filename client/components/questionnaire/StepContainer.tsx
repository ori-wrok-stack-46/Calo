import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface StepContainerProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const StepContainer: React.FC<StepContainerProps> = ({
  title,
  description,
  children,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            isRTL && styles.textRTL,
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.description,
            { color: colors.textSecondary },
            isRTL && styles.textRTL,
          ]}
        >
          {description}
        </Text>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  textRTL: {
    textAlign: "right",
  },
});

export default StepContainer;

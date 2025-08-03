import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTranslation } from "react-i18next";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  progress,
}) => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.content, isRTL && styles.contentRTL]}>
        <Text style={[styles.stepText, { color: colors.text }]}>
          {t("questionnaire.step")} {currentStep} {t("common.of")} {totalSteps}
        </Text>

        <View
          style={[
            styles.progressContainer,
            isRTL && styles.progressContainerRTL,
          ]}
        >
          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progress}%`,
                  transform: isRTL ? [{ scaleX: -1 }] : undefined,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.percentageText, { color: colors.textSecondary }]}
          >
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  content: {
    flexDirection: "column",
    gap: 8,
  },
  contentRTL: {
    alignItems: "flex-end",
  },
  stepText: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressContainerRTL: {
    flexDirection: "row-reverse",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "500",
    minWidth: 35,
    textAlign: "center",
  },
});

export default ProgressIndicator;

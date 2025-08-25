import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import ButtonLoader from "./ButtonLoader";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  style?: any;
  showIcon?: boolean;
  variant?: "card" | "inline" | "fullscreen";
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  onRetry,
  retrying = false,
  style,
  showIcon = true,
  variant = "card",
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getContainerStyle = () => {
    switch (variant) {
      case "inline":
        return [styles.inlineContainer, { backgroundColor: colors.surface }];
      case "fullscreen":
        return [
          styles.fullscreenContainer,
          { backgroundColor: colors.background },
        ];
      default:
        return [
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ];
    }
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {showIcon && (
        <AlertTriangle
          size={variant === "fullscreen" ? 48 : 32}
          color={colors.destructive}
          style={styles.icon}
        />
      )}

      {title && (
        <Text
          style={[
            styles.title,
            { color: colors.text },
            variant === "fullscreen" && styles.fullscreenTitle,
          ]}
        >
          {title}
        </Text>
      )}

      <Text
        style={[
          styles.message,
          { color: colors.textSecondary },
          variant === "fullscreen" && styles.fullscreenMessage,
        ]}
      >
        {message}
      </Text>

      {onRetry && (
        <ButtonLoader
          loading={retrying}
          onPress={onRetry}
          title={t("common.retry")}
          variant="outline"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 8,
  },
  inlineContainer: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 4,
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  fullscreenTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  fullscreenMessage: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    minWidth: 120,
  },
});

export default ErrorDisplay;

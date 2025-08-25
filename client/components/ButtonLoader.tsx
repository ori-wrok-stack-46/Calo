import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

interface ButtonLoaderProps {
  loading: boolean;
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  loadingColor?: string;
  variant?: "primary" | "secondary" | "outline" | "destructive";
  error?: boolean;
  fullWidth?: boolean;
}

const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  loading,
  onPress,
  title,
  disabled = false,
  style,
  textStyle,
  loadingColor,
  variant = "primary",
  error = false,
  fullWidth = false,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const getButtonStyle = () => {
    const baseStyle = [styles.button, fullWidth && styles.fullWidth];

    if (error) {
      return [
        ...baseStyle,
        styles.errorButton,
        { backgroundColor: theme.destructive || "#ef4444" },
      ];
    }

    switch (variant) {
      case "secondary":
        return [
          ...baseStyle,
          styles.secondaryButton,
          { backgroundColor: theme.tabIconDefault },
        ];
      case "outline":
        return [
          ...baseStyle,
          styles.outlineButton,
          { borderColor: theme.tint },
        ];
      case "destructive":
        return [
          ...baseStyle,
          styles.destructiveButton,
          { backgroundColor: theme.destructive || "#ef4444" },
        ];
      default:
        return [
          ...baseStyle,
          styles.primaryButton,
          { backgroundColor: theme.tint },
        ];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "outline":
        return [styles.buttonText, { color: theme.tint }];
      case "secondary":
        return [styles.buttonText, { color: theme.text }];
      default:
        return [styles.buttonText, { color: "#FFFFFF" }];
    }
  };

  const loaderColor =
    loadingColor || (variant === "outline" ? theme.tint : "#FFFFFF");

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    // backgroundColor set dynamically
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  destructiveButton: {
    // backgroundColor set dynamically
  },
  errorButton: {
    // backgroundColor set dynamically
  },
  fullWidth: {
    width: "100%",
  },
});

export default ButtonLoader;

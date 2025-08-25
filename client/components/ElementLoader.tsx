import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

interface ElementLoaderProps {
  size?: "small" | "large";
  text?: string;
  color?: string;
  style?: any;
  showText?: boolean;
  inline?: boolean;
}

const ElementLoader: React.FC<ElementLoaderProps> = ({
  size = "small",
  text = "Loading...",
  color,
  style,
  showText = true,
  inline = false,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const loaderColor = color || theme.tint;

  const containerStyle = inline
    ? [styles.inlineContainer, style]
    : [styles.container, style];

  return (
    <View style={containerStyle}>
      <ActivityIndicator
        size={size}
        color={loaderColor}
        style={styles.indicator}
      />
      {showText && (
        <Text style={[styles.text, { color: theme.text }]}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  indicator: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});

export default ElementLoader;

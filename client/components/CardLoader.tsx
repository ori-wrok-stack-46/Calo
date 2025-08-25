import React from "react";
import { View, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import ElementLoader from "./ElementLoader";

interface CardLoaderProps {
  height?: number;
  style?: any;
  showText?: boolean;
  text?: string;
}

const CardLoader: React.FC<CardLoaderProps> = ({
  height = 120,
  style,
  showText = false,
  text = "Loading...",
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.background,
          borderColor: theme.tabIconDefault,
          height,
        },
        style,
      ]}
    >
      <ElementLoader
        size="small"
        showText={showText}
        text={text}
        inline={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CardLoader;

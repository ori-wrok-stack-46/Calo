import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  selectedValues,
  onToggle,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  const CheckboxItem: React.FC<{ option: string; isSelected: boolean }> = ({
    option,
    isSelected,
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const handlePress = () => {
      scale.value = withSpring(0.95, {}, () => {
        scale.value = withSpring(1);
      });
      onToggle(option);
    };

    return (
      <AnimatedTouchableOpacity
        style={[
          styles.checkboxItem,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            shadowColor: colors.shadow,
          },
          animatedStyle,
          isRTL && styles.checkboxItemRTL,
        ]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: isSelected ? colors.primary : colors.border,
              backgroundColor: isSelected ? colors.primary : "transparent",
            },
          ]}
        >
          {isSelected && <Check size={16} color="white" strokeWidth={3} />}
        </View>

        <Text
          style={[
            styles.checkboxLabel,
            { color: colors.text },
            isRTL && styles.textRTL,
          ]}
        >
          {option}
        </Text>
      </AnimatedTouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text
        style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}
      >
        {label}
      </Text>

      <View style={styles.checkboxGroup}>
        {options.map((option) => (
          <CheckboxItem
            key={option}
            option={option}
            isSelected={selectedValues.includes(option)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  checkboxGroup: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checkboxItemRTL: {
    flexDirection: "row-reverse",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 8,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  textRTL: {
    textAlign: "right",
  },
});

export default CheckboxGroup;

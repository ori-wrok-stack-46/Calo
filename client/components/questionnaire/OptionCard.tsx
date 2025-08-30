import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const OptionCard: React.FC<OptionCardProps> = ({
  label,
  description,
  icon,
  isSelected,
  onPress,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
    opacity.value = withTiming(0.8);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1);
  };

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? colors.primary + "10" : colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
          shadowColor: colors.shadow,
        },
        animatedStyle,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <View style={[styles.content, isRTL && styles.contentRTL]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.label,
              {
                color: isSelected ? colors.primary : colors.text,
              },
              isRTL && styles.textRTL,
            ]}
          >
            {label}
          </Text>
          {description && (
            <Text
              style={[
                styles.description,
                { color: colors.textSecondary },
                isRTL && styles.textRTL,
              ]}
            >
              {description}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  contentRTL: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    marginRight: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkmarkText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  textRTL: {
    textAlign: "right",
  },
});

export default OptionCard;

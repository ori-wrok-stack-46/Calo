import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Check, X } from "lucide-react-native";
import { COLORS } from "./PreferencesStep";

interface ModernSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
}

export default function ModernSwitch({
  label,
  value,
  onValueChange,
  description,
}: ModernSwitchProps) {
  const translateX = useSharedValue(value ? 28 : 2);
  const backgroundColor = useSharedValue(
    value ? COLORS.emerald[500] : COLORS.gray[200]
  );

  React.useEffect(() => {
    translateX.value = withTiming(value ? 28 : 2, { duration: 200 });
    backgroundColor.value = withTiming(
      value ? COLORS.emerald[500] : COLORS.gray[200],
      { duration: 200 }
    );
  }, [value]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  return (
    <View style={switchStyles.container}>
      <View style={switchStyles.content}>
        <View style={switchStyles.textContainer}>
          <Text style={switchStyles.label}>{label}</Text>
          {description && (
            <Text style={switchStyles.description}>{description}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onValueChange(!value)}
          activeOpacity={0.8}
        >
          <Animated.View style={[switchStyles.track, animatedTrackStyle]}>
            <Animated.View style={[switchStyles.thumb, animatedThumbStyle]}>
              {value ? (
                <Check size={14} color={COLORS.emerald[500]} />
              ) : (
                <X size={14} color={COLORS.gray[500]} />
              )}
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const switchStyles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[800],
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  track: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface WeightScaleProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  label: string;
}

const WeightScale: React.FC<WeightScaleProps> = ({
  value,
  onValueChange,
  min = 30,
  max = 200,
  unit = "kg",
  label,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  const [currentValue, setCurrentValue] = useState(value);
  const translateX = useSharedValue(0);

  const screenWidth = Dimensions.get("window").width;
  const SCALE_WIDTH = screenWidth - 60;
  const MARK_SPACING = 6; // Reduced spacing for better precision
  const CENTER_X = SCALE_WIDTH / 2;

  // Calculate the total range and positioning
  const totalRange = max - min;

  // Calculate initial position based on current value
  const getPositionForValue = (val: number) => {
    const valueOffset = (val - min) * MARK_SPACING;
    return CENTER_X - valueOffset;
  };

  // Calculate value from current position
  const getValueFromPosition = (position: number) => {
    const offset = CENTER_X - position;
    const valueIndex = Math.round(offset / MARK_SPACING);
    return Math.max(min, Math.min(max, min + valueIndex));
  };

  // Initialize position based on current value
  useEffect(() => {
    const initialPosition = getPositionForValue(value);
    translateX.value = initialPosition;
    setCurrentValue(value);
  }, [value, min, max]);

  const updateValue = (newValue: number) => {
    setCurrentValue(newValue);
  };

  const handleValueChangeEnd = (finalValue: number) => {
    onValueChange(finalValue);
  };

  // Pan responder for handling touch events
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Store the initial position when gesture starts
    },
    onPanResponderMove: (evt, gestureState) => {
      const currentPosition = translateX.value;
      const newTranslateX = currentPosition + gestureState.dx;

      // Calculate bounds to prevent over-scrolling
      const maxTranslate = getPositionForValue(min); // When min value is centered
      const minTranslate = getPositionForValue(max); // When max value is centered

      const clampedTranslate = Math.max(
        minTranslate,
        Math.min(maxTranslate, newTranslateX)
      );
      translateX.value = clampedTranslate;

      // Calculate new value based on position
      const newValue = getValueFromPosition(clampedTranslate);
      runOnJS(updateValue)(newValue);
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Snap to the nearest mark
      const currentPos = translateX.value;
      const newValue = getValueFromPosition(currentPos);
      const targetPosition = getPositionForValue(newValue);

      translateX.value = withSpring(targetPosition, {
        damping: 15,
        stiffness: 200,
      });

      runOnJS(setCurrentValue)(newValue);
      runOnJS(handleValueChangeEnd)(newValue);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderScaleMarks = () => {
    const marks = [];

    for (let i = 0; i <= totalRange; i++) {
      const markValue = min + i;
      const isMainMark = markValue % 10 === 0;
      const isMiddleMark = markValue % 5 === 0;

      marks.push(
        <View
          key={`mark-${markValue}`}
          style={[
            styles.scaleMark,
            {
              left: i * MARK_SPACING,
              height: isMainMark ? 25 : isMiddleMark ? 18 : 12,
              backgroundColor: isMainMark
                ? colors.primary
                : colors.textSecondary,
              width: isMainMark ? 2 : 1,
              opacity: isMainMark ? 1 : 0.6,
            },
          ]}
        />
      );

      if (isMainMark) {
        marks.push(
          <Text
            key={`text-${markValue}`}
            style={[
              styles.scaleText,
              {
                left: i * MARK_SPACING - 10,
                color: colors.textSecondary,
              },
            ]}
          >
            {markValue}
          </Text>
        );
      }
    }

    return marks;
  };

  return (
    <View style={styles.container}>
      <Text
        style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}
      >
        {label}
      </Text>

      <View style={styles.scaleContainer}>
        {/* Current Value Display */}
        <View
          style={[
            styles.valueDisplay,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.valueText, { color: colors.primary }]}>
            {currentValue}
          </Text>
          <Text style={[styles.unitText, { color: colors.primary }]}>
            {unit}
          </Text>
        </View>

        {/* Scale Wrapper */}
        <View style={[styles.scaleWrapper, { width: SCALE_WIDTH }]}>
          {/* Center Indicator Line */}
          <View
            style={[
              styles.centerIndicator,
              { backgroundColor: colors.primary },
            ]}
          />

          {/* Scrollable Scale */}
          <View style={styles.scaleContainer} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.scaleTrack,
                animatedStyle,
                { width: (totalRange + 1) * MARK_SPACING + SCALE_WIDTH },
              ]}
            >
              {renderScaleMarks()}
            </Animated.View>
          </View>
        </View>

        {/* Min/Max Labels */}
        <View style={[styles.rangeLabels, isRTL && styles.rangeLabelsRTL]}>
          <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
            {min} {unit}
          </Text>
          <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
            {max} {unit}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  textRTL: {
    textAlign: "right",
  },
  scaleContainer: {
    alignItems: "center",
    overflow: "hidden",
  },
  valueDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 32,
    alignSelf: "center",
  },
  valueText: {
    fontSize: 36,
    fontWeight: "700",
  },
  unitText: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 4,
  },
  scaleWrapper: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  centerIndicator: {
    position: "absolute",
    top: 5,
    width: 3,
    height: 35,
    borderRadius: 1.5,
    zIndex: 10,
  },
  scaleTrack: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    position: "relative",
  },
  scaleMark: {
    position: "absolute",
    bottom: 15,
    borderRadius: 0.5,
  },
  scaleText: {
    position: "absolute",
    bottom: 42,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    width: 20,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  rangeLabelsRTL: {
    flexDirection: "row-reverse",
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default WeightScale;

import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "./PreferencesStep";

const { width } = Dimensions.get("window");

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: number;
    title: string;
    icon: any;
    color: string;
  }>;
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  steps,
}: ProgressIndicatorProps) {
  const progressWidth = useSharedValue(0);

  React.useEffect(() => {
    progressWidth.value = withTiming((currentStep / totalSteps) * 100, {
      duration: 300,
    });
  }, [currentStep, totalSteps]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const currentStepData = steps[currentStep - 1];

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.progressBar}>
        <View style={progressStyles.progressTrack}>
          <Animated.View style={[progressStyles.progressFill, animatedStyle]}>
            <LinearGradient
              colors={[COLORS.emerald[500], COLORS.emerald[400]]}
              style={progressStyles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>

        <View style={progressStyles.stepsContainer}>
          {steps.map((step, index) => {
            const isCompleted = index < currentStep - 1;
            const isCurrent = index === currentStep - 1;
            const StepIcon = step.icon;

            return (
              <View
                key={step.id}
                style={[
                  progressStyles.stepDot,
                  isCompleted && progressStyles.stepDotCompleted,
                  isCurrent && progressStyles.stepDotCurrent,
                ]}
              >
                <StepIcon
                  size={12}
                  color={
                    isCompleted || isCurrent ? COLORS.white : COLORS.gray[400]
                  }
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={progressStyles.textContainer}>
        <Text style={progressStyles.stepText}>
          שלב {currentStep} מתוך {totalSteps}
        </Text>
        <Text
          style={[progressStyles.progressText, { color: COLORS.emerald[600] }]}
        >
          {Math.round((currentStep / totalSteps) * 100)}% הושלם
        </Text>
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: COLORS.white,
  },
  progressBar: {
    position: "relative",
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.emerald[100],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 4,
  },
  stepsContainer: {
    position: "absolute",
    top: -6,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.emerald[300],
    borderWidth: 2,
    borderColor: COLORS.emerald[300],
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotCompleted: {
    backgroundColor: COLORS.emerald[500],
    borderColor: COLORS.emerald[500],
  },
  stepDotCurrent: {
    backgroundColor: COLORS.emerald[600],
    borderWidth: 3,
    borderColor: COLORS.emerald[400],
    transform: [{ scale: 1.2 }],
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepText: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: "500",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

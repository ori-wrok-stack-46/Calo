import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { Flame } from "lucide-react-native";

interface DailyGoals {
  calories: number;
  targetCalories: number;
  carbs: number;
  targetCarbs: number;
  fat: number;
  targetFat: number;
}

interface CircularCaloriesProgressProps {
  calories?: number;
  targetCalories?: number;
  dailyGoals: DailyGoals;
  size?: number;
}

const CircularCaloriesProgress: React.FC<CircularCaloriesProgressProps> = ({
  calories = 1739,
  targetCalories = 2205,
  dailyGoals,
  size = 180,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const percentage = Math.min((calories / targetCalories) * 100, 100);
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Animation for progress
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  // Create 3/4 circle path (270 degrees) - from left, up, right (no bottom)
  const createArcPath = (
    startAngle: number,
    endAngle: number,
    radius: number,
    centerX: number,
    centerY: number
  ): string => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ): { x: number; y: number } => {
    const angleInRadians = ((angleInDegrees - 45) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Background arc: 180° to 450° (3/4 circle, no bottom)
  const backgroundPath = createArcPath(180, 450, radius, centerX, centerY);

  // Progress arc: calculate end angle based on percentage
  const progressEndAngle = 180 + (percentage / 100) * 270;
  const progressPath = createArcPath(
    180,
    progressEndAngle,
    radius,
    centerX,
    centerY
  );

  const remainingCalories = Math.max(targetCalories - calories, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            {/* Simple green gradient for progress */}
            <LinearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <Stop offset="0%" stopColor="#4ADE80" stopOpacity="1" />
              <Stop offset="100%" stopColor="#22C55E" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background Arc - Very light green */}
          <Path
            d={backgroundPath}
            fill="none"
            stroke="#E8F5E8"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress Arc - Clean green */}
          {percentage > 0 && (
            <Path
              d={progressPath}
              fill="none"
              stroke="#22C55E"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
        </Svg>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <Flame size={16} color="#22C55E" style={styles.icon} />
          <Text style={styles.label}>Calories</Text>
          <Text style={styles.value}>{calories}</Text>
          <Text style={styles.unit}>kcal</Text>
          <Text style={styles.target}>of {targetCalories} kcal</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dailyGoals.carbs}g</Text>
          <Text style={styles.statLabel}>Total Carbs</Text>
          <Text style={styles.statPercent}>
            {" "}
            {dailyGoals.targetCarbs > 0
              ? Math.round((dailyGoals.carbs / dailyGoals.targetCarbs) * 100)
              : 0}
            %
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dailyGoals.fat}g</Text>
          <Text style={styles.statLabel}>Total Fat</Text>
          <Text style={styles.statPercent}>
            {" "}
            {dailyGoals.targetFat > 0
              ? Math.round((dailyGoals.fat / dailyGoals.targetFat) * 100)
              : 0}
            %
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8FDF8",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },

  circleContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },

  svg: {
    position: "absolute",
  },

  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    marginBottom: 4,
  },

  label: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 2,
  },

  value: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 36,
    marginBottom: 0,
  },

  unit: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
  },

  target: {
    fontSize: 10,
    fontWeight: "400",
    color: "#9CA3AF",
    textAlign: "center",
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 2,
    textAlign: "center",
  },

  statPercent: {
    fontSize: 10,
    fontWeight: "600",
    color: "#22C55E",
  },
});

// Usage Example:
const App: React.FC = () => {
  const dailyGoals: DailyGoals = {
    calories: 1739,
    targetCalories: 2205,
    carbs: 45,
    targetCarbs: 275,
    fat: 58,
    targetFat: 73,
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: 60,
      }}
    >
      <CircularCaloriesProgress
        calories={dailyGoals.calories}
        targetCalories={dailyGoals.targetCalories}
        dailyGoals={dailyGoals}
        size={180}
      />
    </View>
  );
};

// Additional styles for the app
const headerStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },

  subGreeting: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },

  mealSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },

  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  mealTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },

  addButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },

  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

// Merge styles
Object.assign(styles, headerStyles);

export default CircularCaloriesProgress;

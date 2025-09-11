import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Sunrise,
  Sun,
  Moon,
  Cookie,
  Clock,
  MoreHorizontal,
} from "lucide-react-native";

export interface MealType {
  id: string;
  label: string;
  period: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
}

interface MealTypeSelectorProps {
  onSelect: (mealType: MealType) => void;
  selectedType?: MealType;
}

const MEAL_TYPES: MealType[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    period: "breakfast",
    icon: <Sunrise size={24} color="#ffffff" />,
    color: "#14B8A6", // Light teal
    backgroundColor: "#F0FDFA",
  },
  {
    id: "lunch",
    label: "Lunch",
    period: "lunch",
    icon: <Sun size={24} color="#ffffff" />,
    color: "#0891B2", // Mid teal
    backgroundColor: "#E6FFFA",
  },
  {
    id: "dinner",
    label: "Dinner",
    period: "dinner",
    icon: <Moon size={24} color="#ffffff" />,
    color: "#0E7490", // Dark teal
    backgroundColor: "#CCFBF1",
  },
  {
    id: "snack",
    label: "Snack",
    period: "snack",
    icon: <Cookie size={24} color="#ffffff" />,
    color: "#5EEAD4", // Super light teal
    backgroundColor: "#F7FFFE",
  },
  {
    id: "late_night",
    label: "Late Night",
    period: "late_night",
    icon: <Clock size={24} color="#ffffff" />,
    color: "#2DD4BF",
    backgroundColor: "#ECFDF5",
  },
  {
    id: "other",
    label: "Other",
    period: "other",
    icon: <MoreHorizontal size={24} color="#ffffff" />,
    color: "#6B7280",
    backgroundColor: "#F9FAFB",
  },
];

// Time restriction configuration
const TIME_RESTRICTIONS = {
  breakfast: { start: 5, end: 11.59 }, // 5:00 AM to 11:59 AM
  lunch: { start: 12, end: 17.59 }, // 12:00 PM to 5:59 PM
  dinner: { start: 18, end: 21.59 }, // 6:00 PM to 9:59 PM
  late_night: { start: 22, end: 4.59 }, // 10:00 PM to 4:59 AM (next day)
  snack: { start: 0, end: 23.59 }, // Snacks available all day
  other: { start: 0, end: 23.59 }, // Other available all day
};

const formatTimeString = (hour: number): string => {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
};

const getCurrentHour = (): number => {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
};

const isMealTypeAvailable = (mealTypeId: string): boolean => {
  // Always allow snack and other meal types
  if (mealTypeId === "snack" || mealTypeId === "other") {
    return true;
  }

  const currentHour = getCurrentHour();
  const restriction =
    TIME_RESTRICTIONS[mealTypeId as keyof typeof TIME_RESTRICTIONS];

  if (!restriction) return true;

  // Handle overnight periods (like late_night)
  if (restriction.start > restriction.end) {
    return currentHour >= restriction.start || currentHour <= restriction.end;
  }

  return currentHour >= restriction.start && currentHour <= restriction.end;
};

const getNextAvailableTime = (mealTypeId: string): string => {
  const restriction =
    TIME_RESTRICTIONS[mealTypeId as keyof typeof TIME_RESTRICTIONS];
  if (!restriction) return "";

  return formatTimeString(Math.floor(restriction.start));
};

export const MealTypeSelector: React.FC<MealTypeSelectorProps> = ({
  onSelect,
  selectedType,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleMealTypeSelect = (mealType: MealType) => {
    const isAvailable = isMealTypeAvailable(mealType.id);

    if (!isAvailable) {
      const nextAvailableTime = getNextAvailableTime(mealType.id);
      Alert.alert(
        "Too Early",
        `The time is a bit too early for ${mealType.label.toLowerCase()}. You can upload ${mealType.label.toLowerCase()} at ${nextAvailableTime}.`,
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    onSelect(mealType);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Meal Type</Text>
      <Text style={styles.subtitle}>
        Choose the type of meal you're about to capture
      </Text>

      <View style={styles.grid}>
        {MEAL_TYPES.map((mealType) => {
          const isAvailable = isMealTypeAvailable(mealType.id);
          const isSelected = selectedType?.id === mealType.id;

          return (
            <TouchableOpacity
              key={mealType.id}
              style={[
                styles.mealTypeCard,
                { backgroundColor: mealType.backgroundColor },
                isSelected && styles.selected,
                !isAvailable && styles.unavailable,
              ]}
              onPress={() => handleMealTypeSelect(mealType)}
              activeOpacity={isAvailable ? 0.8 : 1}
            >
              <LinearGradient
                colors={[
                  isAvailable ? mealType.color : "#9CA3AF",
                  isAvailable ? `${mealType.color}CC` : "#9CA3AFCC",
                ]}
                style={[
                  styles.iconContainer,
                  !isAvailable && styles.unavailableIcon,
                ]}
              >
                {mealType.icon}
              </LinearGradient>
              <Text
                style={[
                  styles.label,
                  { color: isAvailable ? mealType.color : "#9CA3AF" },
                ]}
              >
                {mealType.label}
              </Text>
              {!isAvailable && (
                <Text style={styles.unavailableText}>
                  Available at {getNextAvailableTime(mealType.id)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 24,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  mealTypeCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 12,
  },
  selected: {
    borderColor: "#14B8A6",
    shadowColor: "#14B8A6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  unavailable: {
    opacity: 0.5,
    borderColor: "#E5E7EB",
  },
  unavailableIcon: {
    opacity: 0.6,
  },
  unavailableText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
});

export { MEAL_TYPES };

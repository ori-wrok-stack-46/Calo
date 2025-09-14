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

// Updated MEAL_TYPES with new time ranges and icons
export const MEAL_TYPES: MealType[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    period: "morning",
    icon: <Sunrise size={24} color="#ffffff" />, // Changed to lucide-react-native icon
    color: "#F39C12",
    backgroundColor: "#Fef3c7", // Kept original background color for consistency
  },
  {
    id: "lunch",
    label: "Lunch",
    period: "afternoon",
    icon: <Sun size={24} color="#ffffff" />, // Changed to lucide-react-native icon
    color: "#E67E22",
    backgroundColor: "#d1fae5", // Kept original background color
  },
  {
    id: "dinner",
    label: "Dinner",
    period: "evening",
    icon: <Moon size={24} color="#ffffff" />, // Changed to lucide-react-native icon
    color: "#8E44AD",
    backgroundColor: "#ede9fe", // Kept original background color
  },
  {
    id: "snack",
    label: "Snack",
    period: "anytime",
    icon: <Cookie size={24} color="#ffffff" />, // Changed to lucide-react-native icon
    color: "#16A085",
    backgroundColor: "#fee2e2", // Kept original background color
  },
  {
    id: "morning_snack",
    label: "Morning Snack",
    period: "morning_snack",
    icon: <Cookie size={24} color="#ffffff" />,
    color: "#f97316",
    backgroundColor: "#fed7aa",
  },
  {
    id: "afternoon_snack",
    label: "Afternoon Snack",
    period: "afternoon_snack",
    icon: <Cookie size={24} color="#ffffff" />,
    color: "#ec4899",
    backgroundColor: "#fce7f3",
  },
  {
    id: "late_night",
    label: "Late Night",
    period: "late_night",
    icon: <Clock size={24} color="#ffffff" />,
    color: "#6366f1",
    backgroundColor: "#e0e7ff",
  },
  {
    id: "other",
    label: "Other",
    period: "other",
    icon: <MoreHorizontal size={24} color="#ffffff" />,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
  },
];

// Proper time ranges for meal types, adjusted for 24-hour format and midnight crossing
const MEAL_TIME_RANGES = {
  breakfast: { start: 5, end: 24 }, // 5:00 AM to 11:59 PM
  morning_snack: { start: 9, end: 12 }, // 9:00 AM - 11:59 AM
  lunch: { start: 12, end: 24 }, // 12:00 PM to 11:59 PM
  afternoon_snack: { start: 14, end: 18 }, // 2:00 PM - 5:59 PM
  dinner: { start: 18, end: 24 }, // 6:00 PM to 11:59 PM
  late_night: { start: 22, end: 24 }, // 10:00 PM to 11:59 PM
  snack: { start: 0, end: 24 }, // Available all day
  other: { start: 0, end: 24 }, // Available all day
};

// Proper meal type ID to display name mapping
const MEAL_TYPE_DISPLAY_MAP = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  morning_snack: "Morning Snack",
  afternoon_snack: "Afternoon Snack",
  late_night: "Late Night",
  other: "Other",
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

const isMealTypeAvailable = (mealType: MealType) => {
  const now = new Date();
  const currentHour = now.getHours();
  const ranges = MEAL_TIME_RANGES[mealType.id as keyof typeof MEAL_TIME_RANGES];

  if (!ranges) return true;

  // Check if the current hour falls within the defined range
  return currentHour >= ranges.start && currentHour < ranges.end;
};

const getNextAvailableTime = (mealTypeId: string) => {
  const ranges = MEAL_TIME_RANGES[mealTypeId as keyof typeof MEAL_TIME_RANGES];
  if (!ranges) return "now";

  const formatHour = (hour: number) => {
    if (hour === 0) return "12:00 AM";
    if (hour === 24) return "11:59 PM"; // Handle end of day
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return "12:00 PM";
    return `${hour - 12}:00 PM`;
  };

  const currentHour = new Date().getHours();

  if (currentHour < ranges.start) {
    return formatHour(ranges.start);
  } else if (currentHour >= ranges.end) {
    // If current hour is beyond the end time, the next availability is the start time of the next day
    return `tomorrow at ${formatHour(ranges.start)}`;
  }

  return formatHour(ranges.start); // Fallback, should ideally not be reached if logic is sound
};

// Removed getAutoMealType as it was not used in the provided snippet.

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
    const isAvailable = isMealTypeAvailable(mealType);

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
          const isAvailable = isMealTypeAvailable(mealType);
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

// Updated styles for improved design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#F8FAFC", // Light gray background
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    color: "#1F2937", // Dark gray title
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
    color: "#6B7280", // Medium gray subtitle
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  grid: {
    gap: 16,
    paddingHorizontal: 8,
  },
  mealTypeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 160,
    width: "100%",
    marginBottom: 16,
  },
  selected: {
    // Renamed from selectedCard for consistency with original code's selected state
    borderColor: "#16A085", // Teal border for selected card
    backgroundColor: "#F0FDFA", // Light teal background for selected card
    transform: [{ scale: 1.05 }], // Slightly enlarge selected card
    shadowColor: "#16A085",
    shadowOpacity: 0.25, // Stronger shadow for selected card
  },
  iconContainer: {
    width: 56, // Larger icon container
    height: 56,
    borderRadius: 28, // Circular container
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16, // Increased margin below icon
  },
  label: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  unavailableText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
  unavailable: {
    opacity: 0.5,
    borderColor: "#E5E7EB",
  },
  unavailableIcon: {
    opacity: 0.6,
  },
});


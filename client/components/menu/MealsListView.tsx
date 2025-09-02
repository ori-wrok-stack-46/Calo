import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import {
  Clock,
  Flame,
  Star,
  Activity,
  ChefHat,
  Plus,
  ArrowRight,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

interface MealsListViewProps {
  meals: Array<{
    meal_id: string;
    name: string;
    description?: string;
    image?: string;
    calories: number;
    protein: number;
    carbs?: number;
    fat?: number;
    prep_time_minutes?: number;
    cooking_method?: string;
    meal_type: string;
    day_number: number;
    rating?: number;
    ingredients: Array<{
      ingredient_id: string;
      name: string;
      quantity: number;
      unit: string;
    }>;
  }>;
  onMealPress: (meal: any) => void;
  onAddMeal?: () => void;
}

export const MealsListView: React.FC<MealsListViewProps> = ({
  meals,
  onMealPress,
  onAddMeal,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState("all");

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case "breakfast":
        return "#f59e0b";
      case "lunch":
        return "#10b981";
      case "dinner":
        return "#8b5cf6";
      case "snack":
        return "#ef4444";
      default:
        return colors.emerald500;
    }
  };

  const getMealImageUri = (meal: any) => {
    if (meal.image) return meal.image;

    const mealName = meal.name.toLowerCase();
    const mealType = meal.meal_type.toLowerCase();

    // Smart placeholder based on meal type and name
    if (mealType === "breakfast") {
      if (mealName.includes("toast"))
        return "https://via.placeholder.com/300x200/f59e0b/ffffff?text=🍞";
      if (mealName.includes("yogurt"))
        return "https://via.placeholder.com/300x200/f59e0b/ffffff?text=🥣";
      return "https://via.placeholder.com/300x200/f59e0b/ffffff?text=🥐";
    }
    if (mealType === "lunch") {
      if (mealName.includes("salad"))
        return "https://via.placeholder.com/300x200/10b981/ffffff?text=🥗";
      if (mealName.includes("sandwich"))
        return "https://via.placeholder.com/300x200/10b981/ffffff?text=🥪";
      return "https://via.placeholder.com/300x200/10b981/ffffff?text=🍽️";
    }
    if (mealType === "dinner") {
      if (mealName.includes("pizza"))
        return "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=🍕";
      if (mealName.includes("pasta"))
        return "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=🍝";
      return "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=🍖";
    }
    return "https://via.placeholder.com/300x200/ef4444/ffffff?text=🍿";
  };

  const filteredMeals = meals.filter((meal) => {
    if (selectedFilter === "all") return true;
    return meal.meal_type.toLowerCase() === selectedFilter;
  });

  const mealTypes = [
    "all",
    ...Array.from(new Set(meals.map((meal) => meal.meal_type.toLowerCase()))),
  ];

  const renderMealItem = ({
    item: meal,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.mealItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => onMealPress(meal)}
      activeOpacity={0.8}
    >
      {/* Meal Image */}
      <Image source={{ uri: getMealImageUri(meal) }} style={styles.mealImage} />

      {/* Meal Type Badge */}
      <View
        style={[
          styles.mealTypeBadge,
          { backgroundColor: getMealTypeColor(meal.meal_type) },
        ]}
      >
        <Text style={styles.mealTypeText}>{meal.meal_type.toUpperCase()}</Text>
      </View>

      {/* Content */}
      <View style={styles.mealContent}>
        <Text
          style={[styles.mealName, { color: colors.text }]}
          numberOfLines={1}
        >
          {meal.name}
        </Text>

        {meal.description && (
          <Text
            style={[styles.mealDescription, { color: colors.icon }]}
            numberOfLines={2}
          >
            {meal.description}
          </Text>
        )}

        {/* Stats Row */}
        <View style={styles.mealStats}>
          <View style={styles.statGroup}>
            <View style={styles.statItem}>
              <Flame size={12} color="#f59e0b" />
              <Text style={[styles.statText, { color: colors.icon }]}>
                {meal.calories}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Activity size={12} color="#3b82f6" />
              <Text style={[styles.statText, { color: colors.icon }]}>
                {meal.protein}g
              </Text>
            </View>

            <View style={styles.statItem}>
              <Clock size={12} color={colors.emerald500} />
              <Text style={[styles.statText, { color: colors.icon }]}>
                {meal.prep_time_minutes || 15}m
              </Text>
            </View>
          </View>

          <ArrowRight size={16} color={colors.icon} />
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <View style={styles.starsContainer}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={10}
                color={i < (meal.rating || 4) ? "#f59e0b" : colors.border}
                fill={i < (meal.rating || 4) ? "#f59e0b" : "transparent"}
              />
            ))}
          </View>
          <Text style={[styles.ratingNumber, { color: colors.icon }]}>
            {meal.rating || 4.5}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAddMealItem = () => (
    <TouchableOpacity
      style={[
        styles.addMealItem,
        {
          backgroundColor: colors.emerald500 + "10",
          borderColor: colors.emerald500 + "30",
        },
      ]}
      onPress={onAddMeal}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.addMealIcon,
          { backgroundColor: colors.emerald500 + "20" },
        ]}
      >
        <Plus size={24} color={colors.emerald500} />
      </View>
      <Text style={[styles.addMealText, { color: colors.emerald500 }]}>
        {t("menu.addMeal") || "Add New Meal"}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterChip = (filterType: string) => {
    const isSelected = selectedFilter === filterType;
    const displayName =
      filterType === "all"
        ? t("menu.all") || "All"
        : filterType.charAt(0).toUpperCase() + filterType.slice(1);

    return (
      <TouchableOpacity
        key={filterType}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? colors.emerald500 : colors.surface,
            borderColor: isSelected ? colors.emerald500 : colors.border,
          },
        ]}
        onPress={() => setSelectedFilter(filterType)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterChipText,
            { color: isSelected ? "#ffffff" : colors.text },
          ]}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("menu.mealsInMenu") || "Meals in Menu"}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          {filteredMeals.length} {t("menu.mealsAvailable") || "meals available"}
        </Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {mealTypes.map(renderFilterChip)}
        </ScrollView>
      </View>

      {/* Meals List */}
      <FlatList
        data={filteredMeals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.meal_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={onAddMeal ? renderAddMealItem : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  filtersContainer: {
    paddingVertical: 12,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
    paddingTop: 8,
    gap: 12,
  },
  mealItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    resizeMode: "cover",
  },
  mealTypeBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealTypeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  mealContent: {
    flex: 1,
    paddingLeft: 16,
    gap: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  mealDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  mealStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statGroup: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 1,
  },
  ratingNumber: {
    fontSize: 11,
    fontWeight: "600",
  },
  addMealItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    gap: 12,
    marginTop: 8,
  },
  addMealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addMealText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import {
  fetchMeals,
  saveMealFeedback,
  toggleMealFavorite,
  duplicateMeal,
  removeMeal,
} from "@/src/store/mealSlice";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import {
  Search,
  Filter,
  Heart,
  Star,
  Copy,
  Clock,
  Flame,
  Zap,
  Droplets,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  MoreHorizontal,
  Camera,
  Wheat,
  Apple,
  Beaker,
  TreePine,
  Candy,
  Dumbbell,
} from "lucide-react-native";
import LoadingScreen from "@/components/LoadingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

const { width } = Dimensions.get("window");

interface FilterOptions {
  category: string;
  dateRange: string;
  minCalories: number;
  maxCalories: number;
  showFavoritesOnly: boolean;
}

const CATEGORIES = [
  { key: "all", label: "All Categories" },
  { key: "high_protein", label: "High Protein" },
  { key: "high_carb", label: "High Carb" },
  { key: "high_fat", label: "High Fat" },
  { key: "balanced", label: "Balanced" },
  { key: "low_calorie", label: "Low Calorie" },
];

const DATE_RANGES = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

// Nutrition icons mapping
const NUTRITION_ICONS = {
  calories: { icon: Flame, name: "Calories", color: "#f59e0b" },
  protein: { icon: Dumbbell, name: "Protein", color: "#3b82f6" },
  carbs: { icon: Wheat, name: "Carbohydrates", color: "#10b981" },
  fat: { icon: Droplets, name: "Total Fat", color: "#ef4444" },
  fiber: { icon: TreePine, name: "Dietary Fiber", color: "#8b5cf6" },
  sugar: { icon: Candy, name: "Sugars", color: "#f97316" },
  sodium: { icon: Beaker, name: "Sodium", color: "#6b7280" },
};

// Compact Meal Card component
const CompactMealCard = ({
  meal,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  colors,
  isDark,
}: {
  meal: any;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  colors: any;
  isDark: boolean;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [savingRatings, setSavingRatings] = useState(false);
  const [ratings, setRatings] = useState({
    taste_rating: meal.taste_rating || 0,
    satiety_rating: meal.satiety_rating || 0,
    energy_rating: meal.energy_rating || 0,
    heaviness_rating: meal.heaviness_rating || 0,
  });

  // Update ratings when meal data changes
  useEffect(() => {
    setRatings({
      taste_rating: meal.taste_rating || 0,
      satiety_rating: meal.satiety_rating || 0,
      energy_rating: meal.energy_rating || 0,
      heaviness_rating: meal.heaviness_rating || 0,
    });
  }, [
    meal.taste_rating,
    meal.satiety_rating,
    meal.energy_rating,
    meal.heaviness_rating,
  ]);

  const handleRatingChange = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveRatings = async () => {
    try {
      setSavingRatings(true);
      const mealId = meal.id || meal.meal_id?.toString();
      if (!mealId) throw new Error("No meal ID found");

      const result = await dispatch(
        saveMealFeedback({
          mealId,
          feedback: {
            tasteRating: ratings.taste_rating,
            satietyRating: ratings.satiety_rating,
            energyRating: ratings.energy_rating,
            heavinessRating: ratings.heaviness_rating,
          },
        })
      ).unwrap();

      if (result) {
        Alert.alert("Success", "Ratings saved successfully!");
        // Update local meal state immediately
        meal.taste_rating = ratings.taste_rating;
        meal.satiety_rating = ratings.satiety_rating;
        meal.energy_rating = ratings.energy_rating;
        meal.heaviness_rating = ratings.heaviness_rating;

        // Refresh the meals list
        await dispatch(fetchMeals());
      }
    } catch (error) {
      console.error("Failed to save ratings:", error);
      Alert.alert("Error", "Failed to save ratings. Please try again.");
    } finally {
      setSavingRatings(false);
    }
  };

  const renderLeftActions = () => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: colors.emerald }]}
        onPress={() => onDuplicate(meal.id || meal.meal_id?.toString())}
      >
        <Copy size={20} color="#fff" />
        <Text style={styles.swipeActionText}>Duplicate</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, styles.deleteAction]}
        onPress={() => onDelete(meal.id || meal.meal_id?.toString())}
      >
        <Trash2 size={20} color="#fff" />
        <Text style={styles.swipeActionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStarRating = (
    rating: number,
    onPress: (rating: number) => void
  ) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
          >
            <Star
              size={16}
              color={star <= rating ? "#fbbf24" : colors.icon}
              fill={star <= rating ? "#fbbf24" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Get nutrition values with proper fallbacks
  const getNutritionValue = (key: string) => {
    switch (key) {
      case "calories":
        return Math.round(meal.calories || 0);
      case "protein":
        return Math.round(meal.protein_g || meal.protein || 0);
      case "carbs":
        return Math.round(meal.carbs_g || meal.carbs || 0);
      case "fat":
        return Math.round(meal.fats_g || meal.fat || 0);
      case "fiber":
        return Math.round(meal.fiber_g || meal.fiber || 0);
      case "sugar":
        return Math.round(meal.sugar_g || meal.sugar || 0);
      case "sodium":
        return Math.round(meal.sodium_mg || meal.sodium || 0);
      default:
        return 0;
    }
  };

  // Parse ingredients safely
  const getIngredients = () => {
    if (!meal.ingredients) return [];
    if (Array.isArray(meal.ingredients)) return meal.ingredients;
    if (typeof meal.ingredients === "string") {
      try {
        return JSON.parse(meal.ingredients);
      } catch {
        return [];
      }
    }
    return [];
  };

  const ingredients = getIngredients();

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      rightThreshold={80}
      leftThreshold={80}
    >
      <View
        style={[
          styles.mealCard,
          {
            backgroundColor: colors.card,
            borderTopColor: isDark ? "#333" : "#e5e5e5",
          },
        ]}
      >
        {/* Main Card Content */}
        <TouchableOpacity
          style={styles.mealCardContent}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          {/* Meal Image */}
          <View style={styles.mealImageContainer}>
            {meal.image_url ? (
              <Image
                source={{ uri: meal.image_url }}
                style={styles.mealImage}
              />
            ) : (
              <View
                style={[
                  styles.mealImagePlaceholder,
                  { backgroundColor: colors.icon + "20" },
                ]}
              >
                <Camera size={20} color={colors.icon} />
              </View>
            )}
          </View>

          {/* Meal Details */}
          <View style={styles.mealDetails}>
            <View style={styles.mealHeader}>
              <Text
                style={[styles.mealName, { color: colors.text }]}
                numberOfLines={1}
              >
                {meal.meal_name || meal.name || "Unknown Meal"}
              </Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() =>
                    onToggleFavorite(meal.id || meal.meal_id?.toString())
                  }
                  style={styles.favoriteButton}
                >
                  <Heart
                    size={16}
                    color={meal.is_favorite ? "#ef4444" : colors.icon}
                    fill={meal.is_favorite ? "#ef4444" : "transparent"}
                  />
                </TouchableOpacity>
                {/* Rating display */}
                {(meal.taste_rating || 0) > 0 && (
                  <View style={styles.ratingDisplay}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>
                      {meal.taste_rating}
                    </Text>
                  </View>
                )}
                {isExpanded ? (
                  <ChevronUp size={16} color={colors.icon} />
                ) : (
                  <ChevronDown size={16} color={colors.icon} />
                )}
              </View>
            </View>

            <Text style={[styles.mealTime, { color: colors.icon }]}>
              {new Date(
                meal.created_at || meal.upload_time
              ).toLocaleDateString()}
            </Text>

            {/* Enhanced Nutrition Info with Icons */}
            <View style={styles.nutritionCompact}>
              {Object.entries(NUTRITION_ICONS)
                .slice(0, 4)
                .map(([key, config]) => {
                  const IconComponent = config.icon;
                  const value = getNutritionValue(key);
                  const unit =
                    key === "calories" ? "" : key === "sodium" ? "mg" : "g";

                  return (
                    <View key={key} style={styles.nutritionItem}>
                      <IconComponent size={12} color={config.color} />
                      <Text
                        style={[styles.nutritionLabel, { color: colors.icon }]}
                      >
                        {config.name}
                      </Text>
                      <Text
                        style={[styles.nutritionValue, { color: colors.text }]}
                      >
                        {value}
                        {unit}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View
            style={[
              styles.expandedContent,
              { borderTopColor: isDark ? "#333" : "#e5e5e5" },
            ]}
          >
            {/* Complete Nutrition Info */}
            <View style={styles.nutritionSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Nutrition Information
              </Text>
              <View style={styles.nutritionGrid}>
                {Object.entries(NUTRITION_ICONS).map(([key, config]) => {
                  const IconComponent = config.icon;
                  const value = getNutritionValue(key);
                  const unit =
                    key === "calories" ? "kcal" : key === "sodium" ? "mg" : "g";

                  return (
                    <View key={key} style={styles.nutritionGridItem}>
                      <View style={styles.nutritionItemHeader}>
                        <IconComponent size={16} color={config.color} />
                        <Text
                          style={[
                            styles.nutritionItemName,
                            { color: colors.text },
                          ]}
                        >
                          {config.name}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.nutritionItemValue,
                          { color: colors.text },
                        ]}
                      >
                        {value} {unit}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Ingredients Section */}
            {ingredients && ingredients.length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Ingredients ({ingredients.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.ingredientsScroll}
                  contentContainerStyle={[
                    styles.ingredientsContainer,
                    isRTL && styles.rtlContainer,
                  ]}
                >
                  {ingredients.map((ingredient: any, index: number) => {
                    const ingredientName =
                      typeof ingredient === "string"
                        ? ingredient
                        : ingredient.name ||
                          ingredient.ingredient_name ||
                          `Ingredient ${index + 1}`;

                    const hasNutrition =
                      typeof ingredient === "object" &&
                      (ingredient.calories > 0 ||
                        ingredient.protein > 0 ||
                        ingredient.carbs > 0);

                    return (
                      <View
                        key={`ingredient-${index}`}
                        style={[
                          styles.ingredientChip,
                          {
                            backgroundColor: colors.emerald + "15",
                            borderColor: colors.emerald + "30",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.ingredientText,
                            { color: colors.emerald },
                            isRTL && styles.rtlText,
                          ]}
                        >
                          {ingredientName}
                        </Text>
                        {hasNutrition && (
                          <View style={styles.ingredientNutritionBadge}>
                            <Text style={styles.ingredientNutritionText}>
                              {Math.round(ingredient.calories || 0)} cal
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Rate this meal
              </Text>

              <View style={styles.ratingsGrid}>
                <View style={styles.ratingItem}>
                  <Text style={[styles.ratingLabel, { color: colors.icon }]}>
                    Taste
                  </Text>
                  {renderStarRating(ratings.taste_rating, (rating) =>
                    handleRatingChange("taste_rating", rating)
                  )}
                </View>

                <View style={styles.ratingItem}>
                  <Text style={[styles.ratingLabel, { color: colors.icon }]}>
                    Fullness
                  </Text>
                  {renderStarRating(ratings.satiety_rating, (rating) =>
                    handleRatingChange("satiety_rating", rating)
                  )}
                </View>

                <View style={styles.ratingItem}>
                  <Text style={[styles.ratingLabel, { color: colors.icon }]}>
                    Energy
                  </Text>
                  {renderStarRating(ratings.energy_rating, (rating) =>
                    handleRatingChange("energy_rating", rating)
                  )}
                </View>

                <View style={styles.ratingItem}>
                  <Text style={[styles.ratingLabel, { color: colors.icon }]}>
                    Heaviness
                  </Text>
                  {renderStarRating(ratings.heaviness_rating, (rating) =>
                    handleRatingChange("heaviness_rating", rating)
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveRatingsButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSaveRatings}
                disabled={savingRatings}
              >
                {savingRatings ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveRatingsText}>Save Ratings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Swipeable>
  );
};

export default function HistoryScreen() {
  // ALL hooks must be called before any conditional logic or early returns
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: "all",
    dateRange: "all",
    minCalories: 0,
    maxCalories: 2000,
    showFavoritesOnly: false,
  });

  useEffect(() => {
    dispatch(fetchMeals());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchMeals());
    setRefreshing(false);
  }, [dispatch]);

  // Filter and search meals
  const filteredMeals = useMemo(() => {
    if (!meals) return [];

    return meals.filter((meal: any) => {
      // Search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          meal.name?.toLowerCase().includes(query) ||
          meal.meal_name?.toLowerCase().includes(query) ||
          meal.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category !== "all") {
        const calories = meal.calories || 0;
        const protein = meal.protein || meal.protein_g || 0;
        const carbs = meal.carbs || meal.carbs_g || 0;
        const fat = meal.fat || meal.fats_g || 0;
        const total = protein + carbs + fat;

        switch (filters.category) {
          case "high_protein":
            if (total === 0 || protein / total < 0.3) return false;
            break;
          case "high_carb":
            if (total === 0 || carbs / total < 0.5) return false;
            break;
          case "high_fat":
            if (total === 0 || fat / total < 0.35) return false;
            break;
          case "balanced":
            if (total === 0) return false;
            const proteinRatio = protein / total;
            const carbRatio = carbs / total;
            const fatRatio = fat / total;
            if (
              proteinRatio < 0.2 ||
              proteinRatio > 0.4 ||
              carbRatio < 0.3 ||
              carbRatio > 0.6 ||
              fatRatio < 0.15 ||
              fatRatio > 0.4
            )
              return false;
            break;
          case "low_calorie":
            if (calories > 300) return false;
            break;
        }
      }

      // Calorie range filter
      const calories = meal.calories || 0;
      if (calories < filters.minCalories || calories > filters.maxCalories) {
        return false;
      }

      // Favorites filter
      if (filters.showFavoritesOnly && !meal.is_favorite) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== "all") {
        const mealDate = new Date(meal.created_at || meal.upload_time);
        const now = new Date();

        switch (filters.dateRange) {
          case "today":
            if (mealDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (mealDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (mealDate < monthAgo) return false;
            break;
        }
      }

      return true;
    });
  }, [meals, searchQuery, filters]);

  // Calculate insights
  const insights = useMemo(() => {
    if (!filteredMeals.length) return null;

    const totalCalories = filteredMeals.reduce(
      (sum, meal) => sum + (meal.calories || 0),
      0
    );
    const avgCalories = Math.round(totalCalories / filteredMeals.length);

    const favoriteMeals = filteredMeals.filter((meal) => meal.is_favorite);
    const ratedMeals = filteredMeals.filter(
      (meal) => meal.taste_rating && meal.taste_rating > 0
    );
    const avgRating =
      ratedMeals.length > 0
        ? ratedMeals.reduce((sum, meal) => sum + (meal.taste_rating || 0), 0) /
          ratedMeals.length
        : 0;

    return {
      totalMeals: filteredMeals.length,
      avgCalories,
      favoriteMeals: favoriteMeals.length,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  }, [filteredMeals]);

  const handleToggleFavorite = useCallback(
    async (mealId: string) => {
      try {
        // Optimistically update the UI
        const mealToUpdate = meals.find(
          (m) => (m.id || m.meal_id?.toString()) === mealId
        );
        if (mealToUpdate) {
          mealToUpdate.is_favorite = !mealToUpdate.is_favorite;
        }

        const result = await dispatch(toggleMealFavorite(mealId)).unwrap();

        if (result) {
          // Show success feedback
          Alert.alert(
            "Success",
            mealToUpdate?.is_favorite
              ? "Added to favorites!"
              : "Removed from favorites!"
          );

          // Refresh the meals list to ensure consistency
          await dispatch(fetchMeals());
        }
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        // Revert optimistic update on error
        const mealToRevert = meals.find(
          (m) => (m.id || m.meal_id?.toString()) === mealId
        );
        if (mealToRevert) {
          mealToRevert.is_favorite = !mealToRevert.is_favorite;
        }
        Alert.alert(
          "Error",
          "Failed to update favorite status. Please try again."
        );
      }
    },
    [dispatch, meals]
  );

  const handleDuplicateMeal = useCallback(
    async (mealId: string) => {
      try {
        await dispatch(
          duplicateMeal({
            mealId,
            newDate: new Date().toISOString().split("T")[0],
          })
        ).unwrap();
        Alert.alert("Success", "Meal duplicated successfully!");
        // Refresh the meals list
        dispatch(fetchMeals());
      } catch (error) {
        console.error("Failed to duplicate meal:", error);
        Alert.alert("Error", "Failed to duplicate meal");
      }
    },
    [dispatch]
  );

  const handleRemoveMeal = useCallback(
    async (mealId: string) => {
      Alert.alert("Delete Meal", "Are you sure you want to delete this meal?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(removeMeal(mealId)).unwrap();
              Alert.alert("Success", "Meal deleted successfully!");
              // Refresh the meals list
              dispatch(fetchMeals());
            } catch (error) {
              console.error("Failed to remove meal:", error);
              Alert.alert("Error", "Failed to remove meal");
            }
          },
        },
      ]);
    },
    [dispatch]
  );

  // Prepare data with insights as header
  const listData = useMemo(() => {
    const data = [];
    if (insights) {
      data.push({ type: "insights", data: insights });
    }
    return data.concat(
      filteredMeals.map((meal) => ({ type: "meal", data: meal }))
    );
  }, [filteredMeals, insights]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "insights") {
      return (
        <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
          <LinearGradient
            colors={[colors.emerald + "10", colors.emerald + "05"]}
            style={styles.insightsGradient}
          >
            <View style={styles.insightsHeader}>
              <TrendingUp size={16} color={colors.emerald} />
              <Text style={[styles.insightsTitle, { color: colors.emerald }]}>
                Your Insights
              </Text>
            </View>
            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Text style={[styles.insightValue, { color: colors.emerald }]}>
                  {item.data.totalMeals}
                </Text>
                <Text style={[styles.insightLabel, { color: colors.icon }]}>
                  Meals
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={[styles.insightValue, { color: colors.emerald }]}>
                  {item.data.avgCalories}
                </Text>
                <Text style={[styles.insightLabel, { color: colors.icon }]}>
                  Avg Cal
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={[styles.insightValue, { color: colors.emerald }]}>
                  {item.data.favoriteMeals}
                </Text>
                <Text style={[styles.insightLabel, { color: colors.icon }]}>
                  Favorites
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={[styles.insightValue, { color: colors.emerald }]}>
                  {item.data.avgRating}
                </Text>
                <Text style={[styles.insightLabel, { color: colors.icon }]}>
                  Rating
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    }

    return (
      <CompactMealCard
        meal={item.data}
        onDelete={handleRemoveMeal}
        onDuplicate={handleDuplicateMeal}
        onToggleFavorite={handleToggleFavorite}
        colors={colors}
        isDark={isDark}
      />
    );
  };

  // Only show loading screen if truly loading and no meals exist
  if (isLoading && !meals.length) {
    return (
      <LoadingScreen text={isRTL ? "טוען היסטוריה..." : "Loading history..."} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("history.title") || "Meal History"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: colors.emerald + "20",
                  borderColor: colors.emerald + "30",
                },
              ]}
              onPress={() => setShowFilters(true)}
            >
              <Filter size={18} color={colors.emerald} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.emerald + "20",
              },
            ]}
          >
            <Search size={16} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search meals..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.icon}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={16} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Meals List */}
        {listData.length > 0 ? (
          <FlatList
            data={listData}
            keyExtractor={(item, index) =>
              item.type === "insights" ? "insights" : index.toString()
            }
            renderItem={renderItem}
            contentContainerStyle={styles.mealsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.emerald]}
                tintColor={colors.emerald}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Clock size={48} color={colors.icon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No meals found
            </Text>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery ||
              filters.category !== "all" ||
              filters.showFavoritesOnly
                ? "Try adjusting your search or filters"
                : "Start logging meals to see your history"}
            </Text>
          </View>
        )}

        {/* Filter Modal */}
        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.filterModal,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Filter Meals
                </Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <X size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterContent}>
                {/* Category Filter */}
                <View style={styles.filterSection}>
                  <Text
                    style={[styles.filterSectionTitle, { color: colors.text }]}
                  >
                    Category
                  </Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category.key}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor:
                              filters.category === category.key
                                ? colors.emerald + "20"
                                : colors.card,
                            borderColor:
                              filters.category === category.key
                                ? colors.emerald
                                : colors.icon + "30",
                          },
                        ]}
                        onPress={() =>
                          setFilters((prev) => ({
                            ...prev,
                            category: category.key,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            {
                              color:
                                filters.category === category.key
                                  ? colors.emerald
                                  : colors.text,
                            },
                          ]}
                        >
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Date Range Filter */}
                <View style={styles.filterSection}>
                  <Text
                    style={[styles.filterSectionTitle, { color: colors.text }]}
                  >
                    Date Range
                  </Text>
                  <View style={styles.dateRangeGrid}>
                    {DATE_RANGES.map((range) => (
                      <TouchableOpacity
                        key={range.key}
                        style={[
                          styles.dateRangeChip,
                          {
                            backgroundColor:
                              filters.dateRange === range.key
                                ? colors.emerald + "20"
                                : colors.card,
                            borderColor:
                              filters.dateRange === range.key
                                ? colors.emerald
                                : colors.icon + "30",
                          },
                        ]}
                        onPress={() =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: range.key,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.dateRangeChipText,
                            {
                              color:
                                filters.dateRange === range.key
                                  ? colors.emerald
                                  : colors.text,
                            },
                          ]}
                        >
                          {range.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Favorites Toggle */}
                <View style={styles.filterSection}>
                  <TouchableOpacity
                    style={[
                      styles.favoritesToggle,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.icon + "20",
                      },
                    ]}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        showFavoritesOnly: !prev.showFavoritesOnly,
                      }))
                    }
                  >
                    <Heart
                      size={18}
                      color={
                        filters.showFavoritesOnly ? "#ef4444" : colors.icon
                      }
                      fill={
                        filters.showFavoritesOnly ? "#ef4444" : "transparent"
                      }
                    />
                    <Text
                      style={[
                        styles.favoritesToggleText,
                        { color: colors.text },
                      ]}
                    >
                      Show Favorites Only
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Reset Filters */}
                <TouchableOpacity
                  style={[
                    styles.resetFiltersButton,
                    { backgroundColor: colors.emerald },
                  ]}
                  onPress={() =>
                    setFilters({
                      category: "all",
                      dateRange: "all",
                      minCalories: 0,
                      maxCalories: 2000,
                      showFavoritesOnly: false,
                    })
                  }
                >
                  <Text style={styles.resetFiltersText}>Reset All Filters</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  insightsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  insightsGradient: {
    padding: 16,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  insightsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  insightItem: {
    alignItems: "center",
  },
  insightValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  mealsList: {
    paddingBottom: 20,
  },
  swipeActionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  swipeAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    minWidth: "100%",
  },

  deleteAction: {
    backgroundColor: "#ef4444",
  },

  swipeActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  mealCard: {
    borderTopWidth: 1,
    shadowOpacity: 0,
  },
  mealCardContent: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  mealImageContainer: {
    marginRight: 12,
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  mealImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  mealDetails: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  ratingDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "500",
  },
  mealTime: {
    fontSize: 12,
    marginBottom: 6,
  },
  nutritionCompact: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  nutritionItem: {
    alignItems: "center",
    gap: 2,
  },
  nutritionLabel: {
    fontSize: 9,
    fontWeight: "500",
  },
  nutritionValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  nutritionSection: {
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nutritionGridItem: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  nutritionItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  nutritionItemName: {
    fontSize: 11,
    fontWeight: "500",
  },
  nutritionItemValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  ingredientsScroll: {
    marginHorizontal: -4,
  },
  ingredientChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  ingredientText: {
    fontSize: 12,
    fontWeight: "500",
  },
  ingredientsContainer: {
    paddingRight: 8,
  },
  rtlContainer: {
    flexDirection: "row-reverse",
    paddingLeft: 8,
    paddingRight: 0,
  },
  ingredientNutritionBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  ingredientNutritionText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "600",
  },
  ratingSection: {
    marginTop: 8,
  },
  ratingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  ratingItem: {
    width: "48%",
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  starContainer: {
    flexDirection: "row",
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  saveRatingsButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveRatingsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dateRangeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dateRangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateRangeChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  favoritesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  favoritesToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  resetFiltersButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  resetFiltersText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

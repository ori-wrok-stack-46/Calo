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
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
  MoveHorizontal as MoreHorizontal,
  Camera,
  Wheat,
  Apple,
  Beaker,
  TreePine,
  Candy,
  Dumbbell,
  Calendar,
  Award,
  Activity,
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
  { key: "all", label: "All Categories", icon: Target },
  { key: "high_protein", label: "High Protein", icon: Dumbbell },
  { key: "high_carb", label: "High Carb", icon: Wheat },
  { key: "high_fat", label: "High Fat", icon: Droplets },
  { key: "balanced", label: "Balanced", icon: Activity },
  { key: "low_calorie", label: "Low Calorie", icon: Flame },
];

const DATE_RANGES = [
  { key: "all", label: "All Time", icon: Calendar },
  { key: "today", label: "Today", icon: Clock },
  { key: "week", label: "This Week", icon: Calendar },
  { key: "month", label: "This Month", icon: Calendar },
];

const NUTRITION_ICONS = {
  calories: { icon: Flame, name: "Calories", color: "#f59e0b", unit: "kcal" },
  protein: { icon: Dumbbell, name: "Protein", color: "#3b82f6", unit: "g" },
  carbs: { icon: Wheat, name: "Carbs", color: "#10b981", unit: "g" },
  fat: { icon: Droplets, name: "Fat", color: "#ef4444", unit: "g" },
  fiber: { icon: TreePine, name: "Fiber", color: "#8b5cf6", unit: "g" },
  sugar: { icon: Candy, name: "Sugar", color: "#f97316", unit: "g" },
  sodium: { icon: Beaker, name: "Sodium", color: "#6b7280", unit: "mg" },
};

// Enhanced Swipeable Meal Card Component
const SwipeableMealCard = ({
  meal,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  colors,
  isDark,
}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [savingRatings, setSavingRatings] = useState(false);
  const [ratings, setRatings] = useState({
    taste_rating: meal.taste_rating || 0,
    satiety_rating: meal.satiety_rating || 0,
    energy_rating: meal.energy_rating || 0,
    heaviness_rating: meal.heaviness_rating || 0,
  });
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  const animatedHeight = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

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
        meal.taste_rating = ratings.taste_rating;
        meal.satiety_rating = ratings.satiety_rating;
        meal.energy_rating = ratings.energy_rating;
        meal.heaviness_rating = ratings.heaviness_rating;
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
        style={[styles.swipeAction, { backgroundColor: "#10b981" }]}
        onPress={() => onDuplicate(meal.id || meal.meal_id?.toString())}
      >
        <Copy size={20} color="#fff" />
        <Text style={styles.swipeActionText}>Copy</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: "#ef4444" }]}
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
            activeOpacity={0.7}
          >
            <Star
              size={18}
              color={star <= rating ? "#fbbf24" : colors.border}
              fill={star <= rating ? "#fbbf24" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

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
    <View style={styles.swipeContainer}>
      <Swipeable
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        rightThreshold={60}
        leftThreshold={60}
      >
        <View
          style={[
            styles.enhancedMealCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.9}
          >
            <View style={styles.imageContainer}>
              {meal.image_url ? (
                <Image
                  source={{ uri: meal.image_url }}
                  style={styles.mealImageEnhanced}
                />
              ) : (
                <LinearGradient
                  colors={[colors.emerald500 + "20", colors.emerald500 + "10"]}
                  style={styles.imagePlaceholder}
                >
                  <Camera size={20} color={colors.emerald500} />
                </LinearGradient>
              )}

              {meal.is_favorite && (
                <View style={styles.favoriteIndicator}>
                  <Heart size={10} color="#fff" fill="#ef4444" />
                </View>
              )}
            </View>

            <View style={styles.mealInfo}>
              <Text
                style={[styles.mealNameEnhanced, { color: colors.text }]}
                numberOfLines={1}
              >
                {meal.meal_name || meal.name || "Unknown Meal"}
              </Text>

              <View style={styles.mealMeta}>
                <View style={styles.metaItem}>
                  <Clock size={12} color={colors.icon} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    {new Date(
                      meal.created_at || meal.upload_time
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>

                {(meal.taste_rating || 0) > 0 && (
                  <View style={styles.metaItem}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={[styles.metaText, { color: colors.icon }]}>
                      {meal.taste_rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.nutritionPreview}>
                {Object.entries(NUTRITION_ICONS)
                  .slice(0, 3)
                  .map(([key, config]) => {
                    const IconComponent = config.icon;
                    const value = getNutritionValue(key);
                    return (
                      <View key={key} style={styles.nutritionPreviewItem}>
                        <IconComponent size={12} color={config.color} />
                        <Text
                          style={[
                            styles.nutritionPreviewValue,
                            { color: colors.text },
                          ]}
                        >
                          {value}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() =>
                  onToggleFavorite(meal.id || meal.meal_id?.toString())
                }
                style={[
                  styles.actionButton,
                  meal.is_favorite && { backgroundColor: "#ef444420" },
                ]}
                activeOpacity={0.7}
              >
                <Heart
                  size={16}
                  color={meal.is_favorite ? "#ef4444" : colors.icon}
                  fill={meal.is_favorite ? "#ef4444" : "transparent"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.surface },
                ]}
              >
                {isExpanded ? (
                  <ChevronUp size={16} color={colors.text} />
                ) : (
                  <ChevronDown size={16} color={colors.text} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.expandedSection,
              {
                opacity: animatedHeight,
                maxHeight: animatedHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 800],
                }),
              },
            ]}
          >
            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.nutritionSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Nutrition Information
                  </Text>
                  <View style={styles.nutritionGrid}>
                    {Object.entries(NUTRITION_ICONS).map(([key, config]) => {
                      const IconComponent = config.icon;
                      const value = getNutritionValue(key);
                      return (
                        <View
                          key={key}
                          style={[
                            styles.nutritionCard,
                            { backgroundColor: colors.surface },
                          ]}
                        >
                          <View style={styles.nutritionCardHeader}>
                            <View
                              style={[
                                styles.nutritionIconContainer,
                                { backgroundColor: config.color + "15" },
                              ]}
                            >
                              <IconComponent size={14} color={config.color} />
                            </View>
                            <Text
                              style={[
                                styles.nutritionCardName,
                                { color: colors.icon },
                              ]}
                            >
                              {config.name}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.nutritionCardValue,
                              { color: colors.text },
                            ]}
                          >
                            {value} {config.unit}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {ingredients && ingredients.length > 0 && (
                  <View style={styles.ingredientsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Ingredients ({ingredients.length})
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.ingredientsScrollContainer}
                    >
                      {ingredients.map((ingredient: any, index: number) => {
                        const ingredientName =
                          typeof ingredient === "string"
                            ? ingredient
                            : ingredient.name ||
                              ingredient.ingredient_name ||
                              `Ingredient ${index + 1}`;

                        return (
                          <View
                            key={`ingredient-${index}`}
                            style={[
                              styles.ingredientChipEnhanced,
                              {
                                backgroundColor: colors.emerald500 + "10",
                                borderColor: colors.emerald500 + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.ingredientTextEnhanced,
                                { color: colors.emerald500 },
                              ]}
                            >
                              {ingredientName}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.ratingSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Rate Your Experience
                  </Text>

                  <View style={styles.ratingsContainer}>
                    {[
                      { key: "taste_rating", label: "Taste", icon: "😋" },
                      { key: "satiety_rating", label: "Fullness", icon: "🤤" },
                      { key: "energy_rating", label: "Energy", icon: "⚡" },
                      {
                        key: "heaviness_rating",
                        label: "Heaviness",
                        icon: "🥱",
                      },
                    ].map(({ key, label, icon }) => (
                      <View
                        key={key}
                        style={[
                          styles.ratingItemEnhanced,
                          { backgroundColor: colors.surface },
                        ]}
                      >
                        <View style={styles.ratingItemHeader}>
                          <Text style={styles.ratingEmoji}>{icon}</Text>
                          <Text
                            style={[
                              styles.ratingLabelEnhanced,
                              { color: colors.text },
                            ]}
                          >
                            {label}
                          </Text>
                        </View>
                        {renderStarRating(
                          ratings[key as keyof typeof ratings],
                          (rating) => handleRatingChange(key, rating)
                        )}
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      { backgroundColor: colors.emerald500 },
                    ]}
                    onPress={handleSaveRatings}
                    disabled={savingRatings}
                    activeOpacity={0.8}
                  >
                    {savingRatings ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Award size={16} color="#fff" />
                        <Text style={styles.saveButtonText}>Save Ratings</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Swipeable>
    </View>
  );
};

// Expandable Search Component
const ExpandableSearch = ({
  searchQuery,
  setSearchQuery,
  colors,
  onFilterPress,
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const searchWidth = useState(new Animated.Value(44))[0];
  const searchOpacity = useState(new Animated.Value(0))[0];

  const expandSearch = () => {
    setIsExpanded(true);
    Animated.parallel([
      Animated.timing(searchWidth, {
        toValue: width - 120,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(searchOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const collapseSearch = () => {
    if (searchQuery.length === 0) {
      Animated.parallel([
        Animated.timing(searchWidth, {
          toValue: 44,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(searchOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsExpanded(false);
      });
    }
  };

  return (
    <View style={styles.searchRow}>
      <Animated.View
        style={[
          styles.expandableSearchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            width: searchWidth,
          },
        ]}
      >
        <TouchableOpacity
          onPress={expandSearch}
          style={styles.searchIconButton}
          activeOpacity={0.7}
        >
          <Search size={18} color={colors.icon} />
        </TouchableOpacity>

        <Animated.View
          style={[styles.searchInputContainer, { opacity: searchOpacity }]}
        >
          <TextInput
            style={[styles.expandableSearchInput, { color: colors.text }]}
            placeholder="Search meals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.icon}
            onBlur={collapseSearch}
            autoFocus={isExpanded}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchButton}
              activeOpacity={0.7}
            >
              <X size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>

      <TouchableOpacity
        style={[
          styles.filterButtonCompact,
          {
            backgroundColor: colors.emerald500 + "15",
            borderColor: colors.emerald500 + "30",
          },
        ]}
        onPress={onFilterPress}
        activeOpacity={0.8}
      >
        <Filter size={18} color={colors.emerald500} />
      </TouchableOpacity>
    </View>
  );
};

export default function HistoryScreen() {
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

  const handleToggleFavorite = useCallback(
    async (mealId: string) => {
      try {
        const mealToUpdate = meals.find(
          (m) => (m.id || m.meal_id?.toString()) === mealId
        );
        if (mealToUpdate) {
          mealToUpdate.is_favorite = !mealToUpdate.is_favorite;
        }

        const result = await dispatch(toggleMealFavorite(mealId)).unwrap();

        if (result) {
          Alert.alert(
            "Success",
            mealToUpdate?.is_favorite
              ? "Added to favorites!"
              : "Removed from favorites!"
          );
          await dispatch(fetchMeals());
        }
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
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

  const filteredMeals = useMemo(() => {
    if (!meals) return [];

    return meals.filter((meal: any) => {
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          meal.name?.toLowerCase().includes(query) ||
          meal.meal_name?.toLowerCase().includes(query) ||
          meal.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

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

      const calories = meal.calories || 0;
      if (calories < filters.minCalories || calories > filters.maxCalories) {
        return false;
      }

      if (filters.showFavoritesOnly && !meal.is_favorite) {
        return false;
      }

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

  const insights = useMemo(() => {
    if (!filteredMeals.length) return null;

    const totalCalories = filteredMeals.reduce(
      (sum: number, meal: any) => sum + (meal.calories || 0),
      0
    );
    const avgCalories = Math.round(totalCalories / filteredMeals.length);
    const favoriteMeals = filteredMeals.filter((meal: any) => meal.is_favorite);
    const ratedMeals = filteredMeals.filter(
      (meal: any) => meal.taste_rating && meal.taste_rating > 0
    );
    const avgRating =
      ratedMeals.length > 0
        ? ratedMeals.reduce(
            (sum: number, meal: any) => sum + (meal.taste_rating || 0),
            0
          ) / ratedMeals.length
        : 0;

    return {
      totalMeals: filteredMeals.length,
      avgCalories,
      favoriteMeals: favoriteMeals.length,
      avgRating: Math.round(avgRating * 10) / 10,
      totalCalories,
    };
  }, [filteredMeals]);

  const listData = useMemo(() => {
    const data = [];
    if (insights) {
      data.push({ type: "insights", data: insights });
    }
    return data.concat(
      filteredMeals.map((meal: any) => ({ type: "meal", data: meal }))
    );
  }, [filteredMeals, insights]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "insights") {
      return (
        <View
          style={[
            styles.insightsCardEnhanced,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <LinearGradient
            colors={[colors.emerald500 + "08", colors.emerald500 + "15"]}
            style={styles.insightsGradientEnhanced}
          >
            <View style={styles.insightsHeaderEnhanced}>
              <View
                style={[
                  styles.insightsIconContainer,
                  { backgroundColor: colors.emerald500 + "20" },
                ]}
              >
                <TrendingUp size={20} color={colors.emerald500} />
              </View>
              <View>
                <Text
                  style={[styles.insightsTitleEnhanced, { color: colors.text }]}
                >
                  Your Insights
                </Text>
                <Text style={[styles.insightsSubtitle, { color: colors.icon }]}>
                  Track your progress
                </Text>
              </View>
            </View>

            <View style={styles.insightsGridEnhanced}>
              <View
                style={[
                  styles.insightItemEnhanced,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.insightIconBox,
                    { backgroundColor: colors.emerald500 + "15" },
                  ]}
                >
                  <Target size={16} color={colors.emerald500} />
                </View>
                <Text
                  style={[styles.insightValueEnhanced, { color: colors.text }]}
                >
                  {item.data.totalMeals}
                </Text>
                <Text
                  style={[styles.insightLabelEnhanced, { color: colors.icon }]}
                >
                  Total Meals
                </Text>
              </View>

              <View
                style={[
                  styles.insightItemEnhanced,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.insightIconBox,
                    { backgroundColor: "#f59e0b15" },
                  ]}
                >
                  <Flame size={16} color="#f59e0b" />
                </View>
                <Text
                  style={[styles.insightValueEnhanced, { color: colors.text }]}
                >
                  {item.data.avgCalories}
                </Text>
                <Text
                  style={[styles.insightLabelEnhanced, { color: colors.icon }]}
                >
                  Avg Calories
                </Text>
              </View>

              <View
                style={[
                  styles.insightItemEnhanced,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.insightIconBox,
                    { backgroundColor: "#ef444415" },
                  ]}
                >
                  <Heart size={16} color="#ef4444" />
                </View>
                <Text
                  style={[styles.insightValueEnhanced, { color: colors.text }]}
                >
                  {item.data.favoriteMeals}
                </Text>
                <Text
                  style={[styles.insightLabelEnhanced, { color: colors.icon }]}
                >
                  Favorites
                </Text>
              </View>

              <View
                style={[
                  styles.insightItemEnhanced,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.insightIconBox,
                    { backgroundColor: "#fbbf2415" },
                  ]}
                >
                  <Star size={16} color="#fbbf24" />
                </View>
                <Text
                  style={[styles.insightValueEnhanced, { color: colors.text }]}
                >
                  {item.data.avgRating}
                </Text>
                <Text
                  style={[styles.insightLabelEnhanced, { color: colors.icon }]}
                >
                  Avg Rating
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    }

    return (
      <SwipeableMealCard
        meal={item.data}
        onDelete={handleRemoveMeal}
        onDuplicate={handleDuplicateMeal}
        onToggleFavorite={handleToggleFavorite}
        colors={colors}
        isDark={isDark}
      />
    );
  };

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
        <View
          style={[styles.headerCompact, { backgroundColor: colors.background }]}
        >
          <View style={styles.headerContentCompact}>
            <Text style={[styles.titleCompact, { color: colors.text }]}>
              {t("history.title") || "History"}
            </Text>

            <ExpandableSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              colors={colors}
              onFilterPress={() => setShowFilters(true)}
            />
          </View>
        </View>

        {listData.length > 0 ? (
          <FlatList
            data={listData}
            keyExtractor={(item, index) =>
              item.type === "insights" ? "insights" : index.toString()
            }
            renderItem={renderItem}
            contentContainerStyle={styles.mealsListEnhanced}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.emerald500]}
                tintColor={colors.emerald500}
              />
            }
          />
        ) : (
          <View style={styles.emptyStateEnhanced}>
            <View
              style={[
                styles.emptyStateIcon,
                { backgroundColor: colors.emerald500 + "15" },
              ]}
            >
              <Clock size={48} color={colors.emerald500} />
            </View>
            <Text style={[styles.emptyTitleEnhanced, { color: colors.text }]}>
              No meals found
            </Text>
            <Text style={[styles.emptyTextEnhanced, { color: colors.icon }]}>
              {searchQuery ||
              filters.category !== "all" ||
              filters.showFavoritesOnly
                ? "Try adjusting your search or filters"
                : "Start logging meals to see your history"}
            </Text>
          </View>
        )}

        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
            <View
              style={[
                styles.filterModalEnhanced,
                { backgroundColor: colors.card },
              ]}
            >
              <View
                style={[
                  styles.modalHeaderEnhanced,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View>
                  <Text
                    style={[styles.modalTitleEnhanced, { color: colors.text }]}
                  >
                    Filter & Sort
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
                    Customize your meal view
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.surface },
                  ]}
                  activeOpacity={0.8}
                >
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.filterContentEnhanced}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.filterSectionEnhanced}>
                  <Text
                    style={[
                      styles.filterSectionTitleEnhanced,
                      { color: colors.text },
                    ]}
                  >
                    Category
                  </Text>
                  <View style={styles.categoryGridEnhanced}>
                    {CATEGORIES.map((category) => {
                      const IconComponent = category.icon;
                      const isSelected = filters.category === category.key;
                      return (
                        <TouchableOpacity
                          key={category.key}
                          style={[
                            styles.categoryChipEnhanced,
                            {
                              backgroundColor: isSelected
                                ? colors.emerald500 + "15"
                                : colors.surface,
                              borderColor: isSelected
                                ? colors.emerald500
                                : colors.border,
                            },
                          ]}
                          onPress={() =>
                            setFilters((prev) => ({
                              ...prev,
                              category: category.key,
                            }))
                          }
                          activeOpacity={0.8}
                        >
                          <IconComponent
                            size={16}
                            color={isSelected ? colors.emerald500 : colors.text}
                          />
                          <Text
                            style={[
                              styles.categoryChipTextEnhanced,
                              {
                                color: isSelected
                                  ? colors.emerald500
                                  : colors.text,
                              },
                            ]}
                          >
                            {category.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.filterSectionEnhanced}>
                  <Text
                    style={[
                      styles.filterSectionTitleEnhanced,
                      { color: colors.text },
                    ]}
                  >
                    Time Period
                  </Text>
                  <View style={styles.dateRangeGridEnhanced}>
                    {DATE_RANGES.map((range) => {
                      const IconComponent = range.icon;
                      const isSelected = filters.dateRange === range.key;
                      return (
                        <TouchableOpacity
                          key={range.key}
                          style={[
                            styles.dateRangeChipEnhanced,
                            {
                              backgroundColor: isSelected
                                ? colors.emerald500 + "15"
                                : colors.surface,
                              borderColor: isSelected
                                ? colors.emerald500
                                : colors.border,
                            },
                          ]}
                          onPress={() =>
                            setFilters((prev) => ({
                              ...prev,
                              dateRange: range.key,
                            }))
                          }
                          activeOpacity={0.8}
                        >
                          <IconComponent
                            size={16}
                            color={isSelected ? colors.emerald500 : colors.text}
                          />
                          <Text
                            style={[
                              styles.dateRangeChipTextEnhanced,
                              {
                                color: isSelected
                                  ? colors.emerald500
                                  : colors.text,
                              },
                            ]}
                          >
                            {range.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.filterSectionEnhanced}>
                  <TouchableOpacity
                    style={[
                      styles.favoritesToggleEnhanced,
                      {
                        backgroundColor: colors.surface,
                        borderColor: filters.showFavoritesOnly
                          ? colors.emerald500
                          : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        showFavoritesOnly: !prev.showFavoritesOnly,
                      }))
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.toggleLeft}>
                      <Heart
                        size={18}
                        color={
                          filters.showFavoritesOnly ? "#ef4444" : colors.icon
                        }
                        fill={
                          filters.showFavoritesOnly ? "#ef4444" : "transparent"
                        }
                      />
                      <View>
                        <Text
                          style={[
                            styles.favoritesToggleTextEnhanced,
                            { color: colors.text },
                          ]}
                        >
                          Show Favorites Only
                        </Text>
                        <Text
                          style={[styles.toggleSubtext, { color: colors.icon }]}
                        >
                          Filter by your favorite meals
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.toggleSwitch,
                        {
                          backgroundColor: filters.showFavoritesOnly
                            ? colors.emerald500
                            : colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleSwitchThumb,
                          {
                            backgroundColor: "#fff",
                            transform: [
                              {
                                translateX: filters.showFavoritesOnly ? 18 : 2,
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.resetButtonEnhanced,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
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
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.resetButtonText, { color: colors.text }]}
                    >
                      Reset
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.applyButtonEnhanced,
                      { backgroundColor: colors.emerald500 },
                    ]}
                    onPress={() => setShowFilters(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Compact Header Styles
  headerCompact: {
    paddingTop: 4,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },

  headerContentCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  titleCompact: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // Expandable Search Styles
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  expandableSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  searchIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },

  expandableSearchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingLeft: 8,
  },

  clearSearchButton: {
    padding: 4,
  },

  filterButtonCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  // Swipe Container Styles
  swipeContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
    position: "relative",
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
    paddingHorizontal: 20,
    minWidth: "100%",
    borderRadius: 16,
  },

  swipeActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  // Enhanced Insights Card
  insightsCardEnhanced: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
  },

  insightsGradientEnhanced: {
    padding: 20,
  },

  insightsHeaderEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },

  insightsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  insightsTitleEnhanced: {
    fontSize: 18,
    fontWeight: "700",
  },

  insightsSubtitle: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },

  insightsGridEnhanced: {
    flexDirection: "row",
    gap: 12,
  },

  insightItemEnhanced: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  insightIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  insightValueEnhanced: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },

  insightLabelEnhanced: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // Enhanced Meal Card
  enhancedMealCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    marginBottom: 8,
  },

  cardHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },

  imageContainer: {
    position: "relative",
    marginRight: 16,
  },

  mealImageEnhanced: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },

  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  favoriteIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  mealInfo: {
    flex: 1,
  },

  mealNameEnhanced: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  mealMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 12,
    fontWeight: "500",
  },

  nutritionPreview: {
    flexDirection: "row",
    gap: 14,
  },

  nutritionPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  nutritionPreviewValue: {
    fontSize: 11,
    fontWeight: "600",
  },

  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  // Expanded Content
  expandedSection: {
    overflow: "hidden",
  },

  expandedContent: {
    padding: 16,
    paddingTop: 0,
  },

  nutritionSection: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },

  nutritionCard: {
    flex: 1,
    minWidth: "30%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  nutritionCardHeader: {
    alignItems: "center",
    marginBottom: 8,
  },

  nutritionIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  nutritionCardName: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  nutritionCardValue: {
    fontSize: 13,
    fontWeight: "800",
  },

  // Ingredients
  ingredientsSection: {
    marginBottom: 20,
  },

  ingredientsScrollContainer: {
    paddingRight: 16,
    gap: 8,
  },

  ingredientChipEnhanced: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },

  ingredientTextEnhanced: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Ratings
  ratingSection: {
    marginBottom: 20,
  },

  ratingsContainer: {
    gap: 12,
    marginBottom: 16,
  },

  ratingItemEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
  },

  ratingItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  ratingEmoji: {
    fontSize: 18,
  },

  ratingLabelEnhanced: {
    fontSize: 14,
    fontWeight: "600",
  },

  starContainer: {
    flexDirection: "row",
    gap: 2,
  },

  starButton: {
    padding: 4,
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Lists
  mealsListEnhanced: {
    paddingBottom: 24,
    paddingTop: 8,
  },

  // Empty State
  emptyStateEnhanced: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitleEnhanced: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  emptyTextEnhanced: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  filterModalEnhanced: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },

  modalHeaderEnhanced: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },

  modalTitleEnhanced: {
    fontSize: 20,
    fontWeight: "800",
  },

  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  filterContentEnhanced: {
    padding: 20,
  },

  filterSectionEnhanced: {
    marginBottom: 24,
  },

  filterSectionTitleEnhanced: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  categoryGridEnhanced: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },

  categoryChipEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },

  categoryChipTextEnhanced: {
    fontSize: 12,
    fontWeight: "600",
  },

  dateRangeGridEnhanced: {
    gap: 8,
  },

  dateRangeChipEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },

  dateRangeChipTextEnhanced: {
    fontSize: 14,
    fontWeight: "600",
  },

  favoritesToggleEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  favoritesToggleTextEnhanced: {
    fontSize: 14,
    fontWeight: "600",
  },

  toggleSubtext: {
    fontSize: 11,
    marginTop: 2,
  },

  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },

  toggleSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  resetButtonEnhanced: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  applyButtonEnhanced: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },

  applyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});

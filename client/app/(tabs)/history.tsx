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
  Pressable,
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
import { useMealDataRefresh } from "@/hooks/useMealDataRefresh";
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
  Calendar,
  Award,
  Activity,
  ShoppingCart,
  Plus,
  User,
  Bell,
  BarChart3,
  PieChart,
  List,
  Settings,
} from "lucide-react-native";
import LoadingScreen from "@/components/LoadingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { nutritionAPI } from "@/src/services/api";

const { width, height } = Dimensions.get("window");

interface FilterOptions {
  category: string;
  dateRange: string;
  minCalories: number;
  maxCalories: number;
  showFavoritesOnly: boolean;
}

const CATEGORIES = [
  { key: "all", label: "history.categories.all", icon: Target },
  {
    key: "high_protein",
    label: "history.categories.highProtein",
    icon: Dumbbell,
  },
  { key: "high_carb", label: "history.categories.highCarb", icon: Wheat },
  { key: "high_fat", label: "history.categories.highFat", icon: Droplets },
  { key: "balanced", label: "history.categories.balanced", icon: Activity },
  { key: "low_calorie", label: "history.categories.lowCalorie", icon: Flame },
];

const DATE_RANGES = [
  { key: "all", label: "history.timeRanges.all", icon: Calendar },
  { key: "today", label: "history.timeRanges.today", icon: Clock },
  { key: "week", label: "history.timeRanges.thisWeek", icon: Calendar },
  { key: "month", label: "history.timeRanges.thisMonth", icon: Calendar },
];

const NUTRITION_ICONS = {
  calories: {
    icon: Flame,
    name: "nutrition.calories",
    color: "#f59e0b",
    unit: "kcal",
  },
  protein: {
    icon: Dumbbell,
    name: "nutrition.protein",
    color: "#3b82f6",
    unit: "g",
  },
  carbs: { icon: Wheat, name: "nutrition.carbs", color: "#10b981", unit: "g" },
  fat: { icon: Droplets, name: "nutrition.fat", color: "#ef4444", unit: "g" },
  fiber: {
    icon: TreePine,
    name: "nutrition.fiber",
    color: "#8b5cf6",
    unit: "g",
  },
  sugar: { icon: Candy, name: "nutrition.sugar", color: "#f97316", unit: "g" },
  sodium: {
    icon: Beaker,
    name: "nutrition.sodium",
    color: "#6b7280",
    unit: "mg",
  },
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
  const { t } = useTranslation();
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
  const { refreshMealData, immediateRefresh } = useMealDataRefresh();

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
        Alert.alert(t("common.success"), t("history.messages.ratingsSaved"));
        meal.taste_rating = ratings.taste_rating;
        meal.satiety_rating = ratings.satiety_rating;
        meal.energy_rating = ratings.energy_rating;
        meal.heaviness_rating = ratings.heaviness_rating;
        immediateRefresh();
      }
    } catch (error) {
      console.error("Failed to save ratings:", error);
      Alert.alert(t("common.error"), t("history.messages.ratingsSaveFailed"));
    } finally {
      setSavingRatings(false);
    }
  };

  const renderLeftActions = () => (
    <View
      style={[
        styles.swipeActionContainer,
        { backgroundColor: colors.background },
      ]}
    >
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: colors.emerald }]}
        onPress={() => onDuplicate(meal.id || meal.meal_id?.toString())}
      >
        <Copy size={20} color={colors.background} />
        <Text style={[styles.swipeActionText, { color: colors.background }]}>
          {t("history.actions.copy")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRightActions = () => (
    <View
      style={[
        styles.swipeActionContainer,
        { backgroundColor: colors.background },
      ]}
    >
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: colors.error }]}
        onPress={() => onDelete(meal.id || meal.meal_id?.toString())}
      >
        <Trash2 size={20} color={colors.background} />
        <Text style={[styles.swipeActionText, { color: colors.background }]}>
          {t("history.actions.delete")}
        </Text>
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
              color={star <= rating ? colors.warning : colors.border}
              fill={star <= rating ? colors.warning : "transparent"}
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

  const handleAddSingleIngredientToShopping = (ingredient: string) => {
    Alert.alert(
      t("shoppingList.addSingle.title"),
      t("shoppingList.addSingle.message", { 0: ingredient }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.add"),
          onPress: async () => {
            try {
              const response = await nutritionAPI.addShoppingItem(ingredient);
              if (response.status === 200) {
                Alert.alert(
                  t("common.success"),
                  t("shoppingList.addSingle.success", { 0: ingredient })
                );
              } else {
                Alert.alert(
                  t("common.error"),
                  t("shoppingList.addSingle.error")
                );
              }
            } catch (error) {
              console.error(
                "Failed to add ingredient to shopping list:",
                error
              );
              Alert.alert(
                t("common.error"),
                t("history.messages.generalError")
              );
            }
          },
        },
      ]
    );
  };

  const handleAddIngredientsToShopping = (ingredientsList: any[]) => {
    Alert.alert(
      t("shoppingList.addAll.title"),
      t("shoppingList.addAll.message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("shoppingList.addAll.action"),
          onPress: async () => {
            try {
              const itemsToAdd = ingredientsList.map((ing) =>
                typeof ing === "string" ? ing : ing.name || ing.ingredient_name
              );
              const response = await fetch("/api/shopping_lists/add_items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: itemsToAdd }),
              });
              if (response.ok) {
                Alert.alert(
                  t("common.success"),
                  t("shoppingList.addAll.success")
                );
              } else {
                Alert.alert(t("common.error"), t("shoppingList.addAll.error"));
              }
            } catch (error) {
              console.error(
                "Failed to add ingredients to shopping list:",
                error
              );
              Alert.alert(
                t("common.error"),
                t("history.messages.generalError")
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={[styles.swipeContainer, { backgroundColor: colors.background }]}
    >
      <Swipeable
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        rightThreshold={60}
        leftThreshold={60}
      >
        <View
          style={[
            styles.modernMealCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.95}
          >
            <View style={styles.cardImageContainer}>
              {meal.image_url ? (
                <Image
                  source={{ uri: meal.image_url }}
                  style={styles.cardImage}
                />
              ) : (
                <View
                  style={[
                    styles.imagePlaceholder,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Camera size={24} color={colors.emerald} />
                </View>
              )}

              {meal.is_favorite && (
                <View
                  style={[
                    styles.heartOverlay,
                    { backgroundColor: colors.emerald },
                  ]}
                >
                  <Heart
                    size={14}
                    color={colors.background}
                    fill={colors.emerald}
                  />
                </View>
              )}
            </View>

            <View style={styles.cardInfo}>
              <Text
                style={[styles.mealTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {meal.meal_name || meal.name || t("common.unknown_meal")}
              </Text>

              <View style={styles.mealMetaRow}>
                <View
                  style={[
                    styles.caloriesBadge,
                    { backgroundColor: colors.emerald + "15" },
                  ]}
                >
                  <Flame size={12} color={colors.emerald} />
                  <Text
                    style={[styles.caloriesText, { color: colors.emerald }]}
                  >
                    {Math.round(meal.calories || 0)} {t("nutrition.calories")}
                  </Text>
                </View>

                <Text
                  style={[styles.mealDate, { color: colors.textSecondary }]}
                >
                  {new Date(
                    meal.created_at || meal.upload_time
                  ).toLocaleDateString()}
                </Text>
              </View>

              {(meal.taste_rating || 0) > 0 && (
                <View style={styles.ratingRow}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      color={
                        i < meal.taste_rating ? colors.warning : colors.border
                      }
                      fill={
                        i < meal.taste_rating ? colors.warning : "transparent"
                      }
                    />
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() =>
                onToggleFavorite(meal.id || meal.meal_id?.toString())
              }
              style={styles.favoriteButton}
              activeOpacity={0.7}
            >
              <Heart
                size={18}
                color={meal.is_favorite ? colors.emerald : colors.icon}
                fill={meal.is_favorite ? colors.emerald : "transparent"}
              />
            </TouchableOpacity>

            <View style={styles.expandButton}>
              {isExpanded ? (
                <ChevronUp size={16} color={colors.icon} />
              ) : (
                <ChevronDown size={16} color={colors.icon} />
              )}
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
              <View
                style={[
                  styles.expandedContent,
                  { borderTopColor: colors.border },
                ]}
              >
                <View style={styles.nutritionSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t("history.nutritionInfo")}
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
                                { color: colors.textSecondary },
                              ]}
                            >
                              {t(config.name)}
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
                    <View style={styles.ingredientsSectionHeader}>
                      <Text
                        style={[styles.sectionTitle, { color: colors.text }]}
                      >
                        {t("history.ingredients")} ({ingredients.length})
                      </Text>
                      {ingredients.length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.addToShoppingButton,
                            { backgroundColor: colors.emerald + "15" },
                          ]}
                          onPress={() =>
                            handleAddIngredientsToShopping(ingredients)
                          }
                        >
                          <ShoppingCart size={16} color={colors.emerald} />
                          <Text
                            style={[
                              styles.addToShoppingText,
                              { color: colors.emerald },
                            ]}
                          >
                            {t("history.addToShopping")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
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
                          <TouchableOpacity
                            key={`ingredient-${index}`}
                            style={[
                              styles.ingredientChip,
                              {
                                backgroundColor: colors.emerald + "15",
                                borderColor: colors.emerald + "20",
                              },
                            ]}
                            onPress={() =>
                              handleAddSingleIngredientToShopping(
                                ingredientName
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.ingredientText,
                                { color: colors.emerald },
                              ]}
                            >
                              {ingredientName}
                            </Text>
                            <Plus size={12} color={colors.emerald} />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.ratingSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t("history.rateExperience")}
                  </Text>

                  <View style={styles.ratingsContainer}>
                    {[
                      {
                        key: "taste_rating",
                        label: "history.ratings.taste",
                        icon: "😋",
                      },
                      {
                        key: "satiety_rating",
                        label: "history.ratings.fullness",
                        icon: "🤤",
                      },
                      {
                        key: "energy_rating",
                        label: "history.ratings.energy",
                        icon: "⚡",
                      },
                      {
                        key: "heaviness_rating",
                        label: "history.ratings.heaviness",
                        icon: "🥱",
                      },
                    ].map(({ key, label, icon }) => (
                      <View
                        key={key}
                        style={[
                          styles.ratingItem,
                          { backgroundColor: colors.surface },
                        ]}
                      >
                        <View style={styles.ratingItemHeader}>
                          <Text style={styles.ratingEmoji}>{icon}</Text>
                          <Text
                            style={[styles.ratingLabel, { color: colors.text }]}
                          >
                            {t(label)}
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
                      { backgroundColor: colors.emerald },
                    ]}
                    onPress={handleSaveRatings}
                    disabled={savingRatings}
                    activeOpacity={0.8}
                  >
                    {savingRatings ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.background}
                      />
                    ) : (
                      <>
                        <Award size={16} color={colors.background} />
                        <Text
                          style={[
                            styles.saveButtonText,
                            { color: colors.background },
                          ]}
                        >
                          {t("history.saveRatings")}
                        </Text>
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

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { colors, isDark, theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { refreshAllMealData, refreshMealData } = useMealDataRefresh();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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
    try {
      await refreshAllMealData();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllMealData]);

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
            t("common.success"),
            mealToUpdate?.is_favorite
              ? t("history.messages.addedToFavorites")
              : t("history.messages.removedFromFavorites")
          );
          refreshMealData();
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
          t("common.error"),
          t("history.messages.favoriteUpdateFailed")
        );
      }
    },
    [dispatch, meals, refreshMealData, t]
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
        Alert.alert(t("common.success"), t("history.messages.mealDuplicated"));
        refreshMealData();
      } catch (error) {
        console.error("Failed to duplicate meal:", error);
        Alert.alert(t("common.error"), t("history.messages.duplicateFailed"));
      }
    },
    [dispatch, refreshMealData, t]
  );

  const handleRemoveMeal = useCallback(
    async (mealId: string) => {
      Alert.alert(
        t("history.messages.deleteMeal"),
        t("history.messages.deleteConfirmation"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await dispatch(removeMeal(mealId)).unwrap();
                Alert.alert(
                  t("common.success"),
                  t("history.messages.mealDeleted")
                );
                refreshMealData();
              } catch (error) {
                console.error("Failed to remove meal:", error);
                Alert.alert(
                  t("common.error"),
                  t("history.messages.deleteFailed")
                );
              }
            },
          },
        ]
      );
    },
    [dispatch, refreshMealData, t]
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
          style={[styles.insightsCard, { backgroundColor: colors.background }]}
        >
          <LinearGradient
            colors={[colors.emerald, colors.emerald600]}
            style={styles.insightsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.insightsHeader}>
              <Text
                style={[styles.insightsTitle, { color: colors.background }]}
              >
                {t("history.insights.title")}
              </Text>
              <Text
                style={[styles.insightsSubtitle, { color: colors.background }]}
              >
                {t("history.insights.subtitle")}
              </Text>
            </View>

            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Text
                  style={[styles.insightValue, { color: colors.background }]}
                >
                  {item.data.totalMeals}
                </Text>
                <Text
                  style={[styles.insightLabel, { color: colors.background }]}
                >
                  {t("history.insights.totalMeals")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text
                  style={[styles.insightValue, { color: colors.background }]}
                >
                  {item.data.avgCalories}
                </Text>
                <Text
                  style={[styles.insightLabel, { color: colors.background }]}
                >
                  {t("history.insights.avgCalories")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text
                  style={[styles.insightValue, { color: colors.background }]}
                >
                  {item.data.favoriteMeals}
                </Text>
                <Text
                  style={[styles.insightLabel, { color: colors.background }]}
                >
                  {t("history.insights.favorites")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text
                  style={[styles.insightValue, { color: colors.background }]}
                >
                  {item.data.avgRating}
                </Text>
                <Text
                  style={[styles.insightLabel, { color: colors.background }]}
                >
                  {t("history.insights.avgRating")}
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
      <LoadingScreen
        text={t("history.loading")}

      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Modern Header */}
        <View
          style={[
            styles.modernHeader,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {t("greetings.morning")}
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t("history.title")}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  { backgroundColor: colors.card },
                ]}
                onPress={() =>
                  setViewMode(viewMode === "list" ? "grid" : "list")
                }
              >
                {viewMode === "list" ? (
                  <BarChart3 size={18} color={colors.emerald} />
                ) : (
                  <List size={18} color={colors.emerald} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
              <Search size={18} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t("history.searchPlaceholder")}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colors.emerald + "20" },
              ]}
              onPress={() => setShowFilters(true)}
            >
              <Filter size={18} color={colors.emerald} />
            </TouchableOpacity>
          </View>

          {/* Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category) => {
              const isSelected = filters.category === category.key;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isSelected
                        ? colors.emerald
                        : colors.card,
                      borderColor: isSelected ? colors.emerald : colors.border,
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
                      styles.categoryPillText,
                      { color: isSelected ? colors.background : colors.text },
                    ]}
                  >
                    {t(category.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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
                progressBackgroundColor={colors.surface}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyStateIcon,
                { backgroundColor: colors.emerald + "15" },
              ]}
            >
              <Clock size={48} color={colors.emerald} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("history.emptyState.title")}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ||
              filters.category !== "all" ||
              filters.showFavoritesOnly
                ? t("history.emptyState.adjustedFilters")
                : t("history.emptyState.default")}
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
          <BlurView intensity={20} style={styles.modalOverlay}>
            <View
              style={[styles.filterModal, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {t("history.filter.title")}
                  </Text>
                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("history.filter.subtitle")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={[styles.closeButton, { backgroundColor: colors.card }]}
                >
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.filterContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.filterSection}>
                  <Text
                    style={[styles.filterSectionTitle, { color: colors.text }]}
                  >
                    {t("history.filter.category")}
                  </Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((category) => {
                      const IconComponent = category.icon;
                      const isSelected = filters.category === category.key;
                      return (
                        <TouchableOpacity
                          key={category.key}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: isSelected
                                ? colors.emerald + "15"
                                : colors.card,
                              borderColor: isSelected
                                ? colors.emerald
                                : colors.border,
                            },
                          ]}
                          onPress={() =>
                            setFilters((prev) => ({
                              ...prev,
                              category: category.key,
                            }))
                          }
                        >
                          <IconComponent
                            size={16}
                            color={isSelected ? colors.emerald : colors.icon}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              {
                                color: isSelected
                                  ? colors.emerald
                                  : colors.text,
                              },
                            ]}
                          >
                            {t(category.label)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text
                    style={[styles.filterSectionTitle, { color: colors.text }]}
                  >
                    {t("history.filter.timePeriod")}
                  </Text>
                  <View style={styles.dateRangeGrid}>
                    {DATE_RANGES.map((range) => {
                      const IconComponent = range.icon;
                      const isSelected = filters.dateRange === range.key;
                      return (
                        <TouchableOpacity
                          key={range.key}
                          style={[
                            styles.dateRangeChip,
                            {
                              backgroundColor: isSelected
                                ? colors.emerald + "15"
                                : colors.card,
                              borderColor: isSelected
                                ? colors.emerald
                                : colors.border,
                            },
                          ]}
                          onPress={() =>
                            setFilters((prev) => ({
                              ...prev,
                              dateRange: range.key,
                            }))
                          }
                        >
                          <IconComponent
                            size={16}
                            color={isSelected ? colors.emerald : colors.icon}
                          />
                          <Text
                            style={[
                              styles.dateRangeChipText,
                              {
                                color: isSelected
                                  ? colors.emerald
                                  : colors.text,
                              },
                            ]}
                          >
                            {t(range.label)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <TouchableOpacity
                    style={[
                      styles.favoritesToggle,
                      {
                        backgroundColor: filters.showFavoritesOnly
                          ? colors.emerald + "15"
                          : colors.card,
                        borderColor: filters.showFavoritesOnly
                          ? colors.emerald
                          : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        showFavoritesOnly: !prev.showFavoritesOnly,
                      }))
                    }
                  >
                    <View style={styles.toggleLeft}>
                      <Heart
                        size={18}
                        color={
                          filters.showFavoritesOnly
                            ? colors.emerald
                            : colors.icon
                        }
                        fill={
                          filters.showFavoritesOnly
                            ? colors.emerald
                            : "transparent"
                        }
                      />
                      <View>
                        <Text
                          style={[
                            styles.favoritesToggleText,
                            { color: colors.text },
                          ]}
                        >
                          {t("history.filter.favoritesOnly")}
                        </Text>
                        <Text
                          style={[
                            styles.toggleSubtext,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("history.filter.favoritesSubtext")}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.toggleSwitch,
                        {
                          backgroundColor: filters.showFavoritesOnly
                            ? colors.emerald
                            : colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleSwitchThumb,
                          { backgroundColor: colors.background },
                          {
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
                      styles.resetButton,
                      {
                        backgroundColor: colors.card,
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
                  >
                    <Text
                      style={[styles.resetButtonText, { color: colors.text }]}
                    >
                      {t("history.filter.reset")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      { backgroundColor: colors.emerald },
                    ]}
                    onPress={() => setShowFilters(false)}
                  >
                    <Text
                      style={[
                        styles.applyButtonText,
                        { color: colors.background },
                      ]}
                    >
                      {t("history.filter.apply")}
                    </Text>
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

  // Modern Header
  modernHeader: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  headerLeft: {
    flex: 1,
  },

  greeting: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search Container
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  // Categories
  categoriesContainer: {
    marginHorizontal: -20,
  },

  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },

  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  categoryPillText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Insights Card
  insightsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  insightsGradient: {
    padding: 20,
  },

  insightsHeader: {
    marginBottom: 20,
  },

  insightsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },

  insightsSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },

  insightsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  insightItem: {
    alignItems: "center",
    flex: 1,
  },

  insightValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },

  insightLabel: {
    fontSize: 12,
    opacity: 0.9,
    fontWeight: "600",
    textAlign: "center",
  },

  // Modern Meal Card
  swipeContainer: {
    marginHorizontal: 20,
    marginVertical: 6,
  },

  modernMealCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  cardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },

  cardImageContainer: {
    position: "relative",
    marginRight: 16,
  },

  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },

  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  heartOverlay: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  cardInfo: {
    flex: 1,
  },

  mealTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  mealMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  caloriesBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },

  caloriesText: {
    fontSize: 12,
    fontWeight: "600",
  },

  mealDate: {
    fontSize: 12,
    fontWeight: "500",
  },

  ratingRow: {
    flexDirection: "row",
    gap: 2,
  },

  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  expandButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // Swipe Actions
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
    borderRadius: 20,
  },

  swipeActionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  // Expanded Section
  expandedSection: {
    overflow: "hidden",
  },

  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
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
    gap: 8,
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

  ingredientsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  ingredientsScrollContainer: {
    paddingRight: 16,
    gap: 8,
  },

  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },

  ingredientText: {
    fontSize: 12,
    fontWeight: "600",
  },

  addToShoppingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },

  addToShoppingText: {
    fontSize: 11,
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

  ratingItem: {
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

  ratingLabel: {
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
    fontSize: 14,
    fontWeight: "700",
  },

  // Lists
  mealsList: {
    paddingBottom: 24,
    paddingTop: 8,
  },

  // Empty State
  emptyState: {
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

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyText: {
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

  filterModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },

  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  filterContent: {
    padding: 20,
  },

  filterSection: {
    marginBottom: 24,
  },

  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },

  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  dateRangeGrid: {
    gap: 8,
  },

  dateRangeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },

  dateRangeChipText: {
    fontSize: 14,
    fontWeight: "600",
  },

  favoritesToggle: {
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

  favoritesToggleText: {
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

  resetButton: {
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

  applyButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },

  applyButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

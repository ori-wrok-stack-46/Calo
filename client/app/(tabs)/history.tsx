import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../src/store";
import {
  fetchMeals,
  saveMealFeedback,
  toggleMealFavorite,
  duplicateMeal,
  updateMeal,
} from "../../src/store/mealSlice";
import { Meal } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRTLStyles } from "../../hooks/useRTLStyle";
import { useMealDataRefresh } from "@/hooks/useMealDataRefresh";
import LanguageToolbar from "@/components/LanguageToolbar";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";

interface MealWithFeedback extends Meal {
  userRating?: number;
  expanded?: boolean;
  taste_rating?: number;
  satiety_rating?: number;
  energy_rating?: number;
  heaviness_rating?: number;
}

interface FilterOptions {
  dateFrom?: Date;
  dateTo?: Date;
  mealType?: string;
  category?: string;
}

interface ExpandedMealData {
  [key: string]: boolean;
}

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { isSavingFeedback, isTogglingFavorite, isDuplicating, isUpdating } =
    useSelector((state: RootState) => state.meal);
  const { refreshAllMealData } = useMealDataRefresh();

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "he";

  const [filteredMeals, setFilteredMeals] = useState<MealWithFeedback[]>([]);
  const [expandedMeals, setExpandedMeals] = useState<ExpandedMealData>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [smartInsight, setSmartInsight] = useState<string>("");
  const [updateText, setUpdateText] = useState("");

  // Feedback ratings
  const [tasteRating, setTasteRating] = useState(0);
  const [satietyRating, setSatietyRating] = useState(0);
  const [energyRating, setEnergyRating] = useState(0);
  const [heavinessRating, setHeavinessRating] = useState(0);

  useEffect(() => {
    dispatch(fetchMeals());
  }, [dispatch]);

  const getIngredientIcon = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase();
    if (
      name.includes("rice") ||
      name.includes("quinoa") ||
      name.includes("pasta") ||
      name.includes("bread") ||
      name.includes("oats")
    )
      return "leaf-outline";
    if (
      name.includes("chicken") ||
      name.includes("beef") ||
      name.includes("pork") ||
      name.includes("fish") ||
      name.includes("salmon") ||
      name.includes("turkey")
    )
      return "restaurant-outline";
    if (
      name.includes("cheese") ||
      name.includes("milk") ||
      name.includes("yogurt") ||
      name.includes("cream")
    )
      return "cafe-outline";
    if (
      name.includes("broccoli") ||
      name.includes("carrot") ||
      name.includes("peas") ||
      name.includes("lettuce") ||
      name.includes("spinach") ||
      name.includes("tomato") ||
      name.includes("pepper")
    )
      return "leaf";
    if (
      name.includes("oil") ||
      name.includes("butter") ||
      name.includes("avocado") ||
      name.includes("nuts") ||
      name.includes("seeds")
    )
      return "water-outline";
    if (
      name.includes("apple") ||
      name.includes("banana") ||
      name.includes("orange") ||
      name.includes("berry") ||
      name.includes("fruit")
    )
      return "nutrition-outline";
    if (name.includes("egg")) return "ellipse-outline";
    if (
      name.includes("bean") ||
      name.includes("lentil") ||
      name.includes("chickpea")
    )
      return "fitness-outline";
    return "nutrition-outline";
  };

  useEffect(() => {
    applyFilters();
    generateSmartInsight();
  }, [meals, filters, searchText]);

  const applyFilters = () => {
    let filtered = [...meals] as MealWithFeedback[];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (meal) =>
          meal.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          meal.description?.toLowerCase().includes(searchText.toLowerCase()) ||
          meal.ingredients?.some((ing) =>
            ing.name?.toLowerCase().includes(searchText.toLowerCase())
          )
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (meal) => new Date(meal.created_at) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (meal) => new Date(meal.created_at) <= filters.dateTo!
      );
    }

    // Category filter (based on macros)
    if (filters.category) {
      filtered = filtered.filter((meal) => {
        const category = getMealCategory(meal);
        return category === filters.category;
      });
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredMeals(filtered);
  };

  const getMealCategory = (meal: Meal): string => {
    const protein = meal.protein || meal.protein_g || 0;
    const carbs = meal.carbs || meal.carbs_g || 0;
    const fat = meal.fat || meal.fats_g || 0;
    const total = protein + carbs + fat;

    if (total === 0) return "unknown";

    const proteinPercent = ((protein * 4) / (total * 4)) * 100;
    const carbsPercent = ((carbs * 4) / (total * 4)) * 100;
    const fatPercent = ((fat * 9) / (total * 4)) * 100;

    if (proteinPercent > 40) return "high-protein";
    if (carbsPercent > 50) return "high-carb";
    if (fatPercent > 35) return "high-fat";
    return "balanced";
  };

  const getMealScore = (meal: Meal): { score: number; color: string } => {
    let score = 5; // Start with base score

    const calories = meal.calories || 0;
    const protein = meal.protein || meal.protein_g || 0;
    const carbs = meal.carbs || meal.carbs_g || 0;
    const fat = meal.fat || meal.fats_g || 0;
    const fiber = meal.fiber || meal.fiber_g || 0;

    // Protein adequacy (good if 15-30% of calories)
    const proteinCalories = protein * 4;
    const proteinPercent =
      calories > 0 ? (proteinCalories / calories) * 100 : 0;
    if (proteinPercent >= 15 && proteinPercent <= 30) score += 1;
    else if (proteinPercent < 10) score -= 1;

    // Fiber content (good if >3g per 100 calories)
    const fiberRatio = calories > 0 ? (fiber / calories) * 100 : 0;
    if (fiberRatio > 3) score += 1;
    else if (fiberRatio < 1) score -= 1;

    // Calorie density (prefer moderate density)
    if (calories > 800) score -= 1; // Very high calorie meal
    if (calories < 100) score -= 1; // Very low calorie meal

    // Processing level penalty
    if (
      meal.processing_level === "Ultra-processed" ||
      meal.processing_level === "ULTRA_PROCESSED"
    ) {
      score -= 1;
    }

    // Ensure score is between 1-10
    score = Math.max(1, Math.min(10, score));

    let color = "#059669"; // Emerald green
    if (score <= 4) color = "#DC2626"; // Red
    else if (score <= 6) color = "#EA580C"; // Orange

    return { score, color };
  };

  const generateSmartInsight = () => {
    if (meals.length === 0) {
      setSmartInsight(
        t("history.no_meals_insight") || "Start logging meals to see insights"
      );
      return;
    }

    const lastWeekMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return mealDate >= weekAgo;
    });

    const thisWeekCalories = lastWeekMeals.reduce(
      (sum, meal) => sum + (meal.calories || 0),
      0
    );
    const avgDailyCalories = thisWeekCalories / 7;

    const insights = [
      t("history.insight_calories", {
        calories: Math.round(avgDailyCalories),
      }) ||
        `This week you consumed an average of ${Math.round(
          avgDailyCalories
        )} calories per day`,
      t("history.insight_meals", {
        count: lastWeekMeals.length,
      }) || `You logged ${lastWeekMeals.length} meals this week`,
      t("history.insight_score", {
        score: Math.max(...lastWeekMeals.map((m) => getMealScore(m).score)),
      }) ||
        `Your healthiest meal this week scored ${Math.max(
          ...lastWeekMeals.map((m) => getMealScore(m).score)
        )}`,
    ];

    setSmartInsight(insights[Math.floor(Math.random() * insights.length)]);
  };

  const toggleMealExpansion = (mealId: string) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealId]: !prev[mealId],
    }));
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedMeal) return;

    const feedback = {
      tasteRating,
      satietyRating,
      energyRating,
      heavinessRating,
    };

    try {
      await dispatch(
        saveMealFeedback({
          mealId: selectedMeal.id,
          feedback,
        })
      ).unwrap();

      Alert.alert(
        t("common.success") || "Success",
        t("history.feedback_saved") ||
          "Your feedback has been saved successfully"
      );
      setShowFeedbackModal(false);
      resetFeedbackRatings();
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("history.feedback_error") || "Failed to save feedback"
      );
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedMeal || !updateText.trim()) {
      Alert.alert(
        t("common.error") || "Error",
        t("history.update_text_required") || "Please enter update text"
      );
      return;
    }

    try {
      await dispatch(
        updateMeal({
          meal_id: selectedMeal.id,
          updateText: updateText.trim(),
        })
      ).unwrap();

      Alert.alert(
        t("common.success") || "Success",
        t("history.meal_updated") || "Meal updated successfully!"
      );
      setShowUpdateModal(false);
      setUpdateText("");
      setSelectedMeal(null);
      // Refresh meals
      dispatch(fetchMeals());
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("history.update_error") || "Failed to update meal"
      );
    }
  };

  const resetFeedbackRatings = () => {
    setTasteRating(0);
    setSatietyRating(0);
    setEnergyRating(0);
    setHeavinessRating(0);
  };

  const handleToggleFavorite = async (mealId: string) => {
    try {
      await dispatch(toggleMealFavorite(mealId)).unwrap();
      Alert.alert(
        t("common.success") || "Success",
        t("history.favorite_updated") || "Favorite status updated"
      );
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("history.favorite_error") || "Failed to update favorite status"
      );
    }
  };

  const handleDuplicateMeal = async (meal: Meal) => {
    Alert.alert(
      t("history.duplicate_meal") || "Duplicate Meal",
      t("history.duplicate_confirmation") ||
        "Would you like to duplicate this meal to today?",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        {
          text: t("common.yes") || "Yes",
          onPress: async () => {
            try {
              console.log("🔄 Starting duplicate process for meal:", meal.id);
              console.log("📋 Meal data:", meal);

              const result = await dispatch(
                duplicateMeal({
                  mealId: meal.id,
                  newDate: new Date().toISOString().split("T")[0],
                })
              ).unwrap();

              console.log("✅ Duplicate result:", result);
              Alert.alert(
                t("common.success") || "Success",
                t("history.meal_duplicated") || "Meal duplicated successfully!"
              );

              // Refresh meals to show the new duplicate
              dispatch(fetchMeals());
            } catch (error) {
              console.error("💥 Duplicate error:", error);
              Alert.alert(
                t("common.error") || "Error",
                (t("history.duplicate_error") || "Failed to duplicate meal: ") +
                  (error instanceof Error
                    ? error.message
                    : t("common.unknown_error") || "Unknown error")
              );
            }
          },
        },
      ]
    );
  };

  const handleUpdateMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setUpdateText("");
    setShowUpdateModal(true);
  };

  const renderStarRating = (
    rating: number,
    setRating: (rating: number) => void
  ) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={30}
              color={star <= rating ? "#F59E0B" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderIngredientsSection = (meal: MealWithFeedback) => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      return null;
    }

    return (
      <View style={styles.ingredientsSection}>
        <View style={styles.ingredientsSectionHeader}>
          <Ionicons name="restaurant-outline" size={20} color="#059669" />
          <Text style={styles.ingredientsSectionTitle}>
            {t("food_scanner.ingredients") || "Ingredients"} (
            {meal.ingredients.length})
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.ingredientsScrollView}
          contentContainerStyle={styles.ingredientsScrollContent}
        >
          {meal.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.modernIngredientCard}>
              <View style={styles.ingredientCardHeader}>
                <View style={styles.modernIngredientIconContainer}>
                  <Ionicons
                    name={getIngredientIcon(ingredient.name) as any}
                    size={18}
                    color="#059669"
                  />
                </View>
                <Text style={styles.modernIngredientName} numberOfLines={2}>
                  {ingredient.name}
                </Text>
              </View>

              <View style={styles.ingredientNutritionInfo}>
                <View style={styles.nutritionInfoRow}>
                  <Text style={styles.nutritionInfoValue}>
                    {Math.round(ingredient.calories || 0)}
                  </Text>
                  <Text style={styles.nutritionInfoLabel}>cal</Text>
                </View>
                <View style={styles.nutritionInfoRow}>
                  <Text style={styles.nutritionInfoValue}>
                    {Math.round(ingredient.protein || 0)}g
                  </Text>
                  <Text style={styles.nutritionInfoLabel}>protein</Text>
                </View>
                <View style={styles.nutritionInfoRow}>
                  <Text style={styles.nutritionInfoValue}>
                    {Math.round(ingredient.carbs || 0)}g
                  </Text>
                  <Text style={styles.nutritionInfoLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionInfoRow}>
                  <Text style={styles.nutritionInfoValue}>
                    {Math.round(ingredient.fat || 0)}g
                  </Text>
                  <Text style={styles.nutritionInfoLabel}>fat</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderNutritionDetails = (meal: MealWithFeedback) => {
    return (
      <View style={styles.nutritionDetails}>
        <Text style={styles.nutritionDetailsTitle}>
          {t("history.detailed_nutrition") || "Detailed Nutrition Information"}
        </Text>

        {/* Basic Macros */}
        <View style={styles.macroSection}>
          <Text style={styles.sectionTitle}>
            {t("meals.nutrition_info") || "Macronutrients"}
          </Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionDetailItem}>
              <Text style={styles.nutritionDetailLabel}>
                {t("meals.calories") || "Calories"}
              </Text>
              <Text style={styles.nutritionDetailValue}>
                {Math.round(meal.calories || 0)}
              </Text>
            </View>
            <View style={styles.nutritionDetailItem}>
              <Text style={styles.nutritionDetailLabel}>
                {t("meals.protein") || "Protein"}
              </Text>
              <Text style={styles.nutritionDetailValue}>
                {Math.round(meal.protein || meal.protein_g || 0)}g
              </Text>
            </View>
            <View style={styles.nutritionDetailItem}>
              <Text style={styles.nutritionDetailLabel}>
                {t("meals.carbs") || "Carbs"}
              </Text>
              <Text style={styles.nutritionDetailValue}>
                {Math.round(meal.carbs || meal.carbs_g || 0)}g
              </Text>
            </View>
            <View style={styles.nutritionDetailItem}>
              <Text style={styles.nutritionDetailLabel}>
                {t("meals.fat") || "Fat"}
              </Text>
              <Text style={styles.nutritionDetailValue}>
                {Math.round(meal.fat || meal.fats_g || 0)}g
              </Text>
            </View>
          </View>
        </View>

        {/* Extended Nutrition */}
        {(meal.fiber ||
          meal.fiber_g ||
          meal.sugar ||
          meal.sugar_g ||
          meal.sodium ||
          meal.sodium_mg) && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("statistics.additional_nutrients") || "Additional Nutrients"}
            </Text>
            <View style={styles.nutritionGrid}>
              {(meal.fiber || meal.fiber_g) && (
                <View style={styles.nutritionDetailItem}>
                  <Text style={styles.nutritionDetailLabel}>
                    {t("meals.fiber") || "Fiber"}
                  </Text>
                  <Text style={styles.nutritionDetailValue}>
                    {Math.round(meal.fiber || meal.fiber_g || 0)}g
                  </Text>
                </View>
              )}
              {(meal.sugar || meal.sugar_g) && (
                <View style={styles.nutritionDetailItem}>
                  <Text style={styles.nutritionDetailLabel}>
                    {t("meals.sugar") || "Sugar"}
                  </Text>
                  <Text style={styles.nutritionDetailValue}>
                    {Math.round(meal.sugar || meal.sugar_g || 0)}g
                  </Text>
                </View>
              )}
              {(meal.sodium || meal.sodium_mg) && (
                <View style={styles.nutritionDetailItem}>
                  <Text style={styles.nutritionDetailLabel}>
                    {t("meals.sodium") || "Sodium"}
                  </Text>
                  <Text style={styles.nutritionDetailValue}>
                    {Math.round(meal.sodium || meal.sodium_mg || 0)}mg
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Vitamins and Minerals */}
        {meal.vitamins_json && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("statistics.vitamins") || "Vitamins"}
            </Text>
            <View style={styles.nutritionGrid}>
              {Object.entries(meal.vitamins_json).map(([key, value]) => {
                if (!value || value === 0) return null;
                const vitaminName = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                return (
                  <View key={key} style={styles.nutritionDetailItem}>
                    <Text style={styles.nutritionDetailLabel}>
                      {vitaminName}
                    </Text>
                    <Text style={styles.nutritionDetailValue}>
                      {typeof value === "number"
                        ? Math.round(value * 100) / 100
                        : String(value)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {meal.micronutrients_json && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("history.vitamins_minerals") || "Minerals"}
            </Text>
            <View style={styles.nutritionGrid}>
              {Object.entries(meal.micronutrients_json).map(([key, value]) => {
                if (!value || value === 0) return null;
                const mineralName = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                return (
                  <View key={key} style={styles.nutritionDetailItem}>
                    <Text style={styles.nutritionDetailLabel}>
                      {mineralName}
                    </Text>
                    <Text style={styles.nutritionDetailValue}>
                      {typeof value === "number"
                        ? Math.round(value * 100) / 100
                        : String(value)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Food Analysis */}
        {(meal.processing_level ||
          meal.food_category ||
          meal.cooking_method) && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("history.meal_analysis") || "Food Analysis"}
            </Text>
            {meal.processing_level && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>
                  {t("history.processing_level") || "Processing Level"}
                </Text>
                <Text style={styles.analysisValue}>
                  {meal.processing_level}
                </Text>
              </View>
            )}
            {meal.food_category && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>
                  {t("history.food_category") || "Food Category"}
                </Text>
                <Text style={styles.analysisValue}>{meal.food_category}</Text>
              </View>
            )}
            {meal.cooking_method && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>
                  {t("food_scanner.cooking_method") || "Cooking Method"}
                </Text>
                <Text style={styles.analysisValue}>{meal.cooking_method}</Text>
              </View>
            )}
          </View>
        )}

        {/* Allergens */}
        {meal.allergens_json &&
          meal.allergens_json.possible_allergens &&
          meal.allergens_json.possible_allergens.length > 0 && (
            <View style={styles.macroSection}>
              <Text style={styles.sectionTitle}>
                {t("history.allergens") || "Possible Allergens"}
              </Text>
              <View style={styles.allergensContainer}>
                {meal.allergens_json.possible_allergens.map(
                  (allergen: string, index: number) => (
                    <View key={index} style={styles.allergenTag}>
                      <Text style={styles.allergenText}>{allergen}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          )}

        {/* Health Warnings */}
        {meal.health_risk_notes && meal.health_risk_notes.length > 0 && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("history.health_warnings") || "Health Warnings"}
            </Text>
            {meal.health_risk_notes && (
              <View style={styles.warningItem}>
                <Ionicons name="warning" size={16} color="#EA580C" />
                <Text style={styles.warningText}>{meal.health_risk_notes}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderMealItem = ({ item }: { item: MealWithFeedback }) => {
    const mealScore = getMealScore(item);
    const mealDate = new Date(item.created_at);
    const isExpanded = expandedMeals[item.id];

    return (
      <View style={styles.mealCard}>
        <TouchableOpacity
          style={styles.mealHeader}
          onPress={() => toggleMealExpansion(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.mealInfo}>
            <View style={styles.mealTitleRow}>
              <Text style={styles.mealName}>
                {item.name ||
                  item.meal_name ||
                  t("history.unnamed_meal") ||
                  "Unnamed Meal"}
              </Text>
              {item.is_favorite && (
                <Ionicons name="heart" size={16} color="#EF4444" />
              )}
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </View>
            <Text style={styles.mealTime}>
              {mealDate.toLocaleDateString()} •{" "}
              {mealDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {item.description && (
              <Text
                style={styles.mealDescription}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {item.description}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.scoreContainer,
              { backgroundColor: mealScore.color },
            ]}
          >
            <Text style={styles.scoreText}>{mealScore.score}</Text>
          </View>
        </TouchableOpacity>

        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.mealImage} />
        )}

        <View style={styles.nutritionSummary}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.calories || 0)}
            </Text>
            <Text style={styles.nutritionLabel}>
              {t("meals.calories") || "Calories"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.protein || item.protein_g || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>
              {t("meals.protein") || "Protein"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.carbs || item.carbs_g || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>
              {t("meals.carbs") || "Carbs"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.fat || item.fats_g || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>{t("meals.fat") || "Fat"}</Text>
          </View>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Enhanced Ingredients Display */}
            {renderIngredientsSection(item)}

            {/* Detailed Nutrition */}
            {renderNutritionDetails(item)}
          </View>
        )}

        {/* User Ratings Display */}
        {(item.taste_rating ||
          item.satiety_rating ||
          item.energy_rating ||
          item.heaviness_rating) && (
          <View style={styles.ratingsDisplay}>
            <Text style={styles.ratingsTitle}>
              {t("history.your_ratings") || "Your Ratings"}:
            </Text>
            <View style={styles.ratingsRow}>
              {item.taste_rating && (
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>
                    {t("history.taste") || "Taste"}
                  </Text>
                  <View style={styles.miniStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= (item.taste_rating || 0)
                            ? "star"
                            : "star-outline"
                        }
                        size={12}
                        color={
                          star <= (item.taste_rating || 0)
                            ? "#F59E0B"
                            : "#D1D5DB"
                        }
                      />
                    ))}
                  </View>
                </View>
              )}
              {item.satiety_rating && (
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>
                    {t("history.satiety") || "Satiety"}
                  </Text>
                  <View style={styles.miniStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= (item.satiety_rating || 0)
                            ? "star"
                            : "star-outline"
                        }
                        size={12}
                        color={
                          star <= (item.satiety_rating || 0)
                            ? "#F59E0B"
                            : "#D1D5DB"
                        }
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.mealActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedMeal(item);
              // Pre-fill existing ratings
              setTasteRating(item.taste_rating || 0);
              setSatietyRating(item.satiety_rating || 0);
              setEnergyRating(item.energy_rating || 0);
              setHeavinessRating(item.heaviness_rating || 0);
              setShowFeedbackModal(true);
            }}
            disabled={isSavingFeedback}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
            <Text style={styles.actionText}>{t("history.rate") || "Rate"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleFavorite(item.id)}
            disabled={isTogglingFavorite}
          >
            <Ionicons
              name={item.is_favorite ? "heart" : "heart-outline"}
              size={20}
              color="#EF4444"
            />
            <Text style={styles.actionText}>
              {item.is_favorite
                ? t("history.unfavorite") || "Unfavorite"
                : t("history.favorite") || "Favorite"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDuplicateMeal(item)}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Ionicons name="copy-outline" size={20} color="#059669" />
            )}
            <Text style={styles.actionText}>
              {t("history.duplicate") || "Duplicate"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUpdateMeal(item)}
            disabled={isUpdating}
          >
            <Ionicons name="create-outline" size={20} color="#EA580C" />
            <Text style={styles.actionText}>
              {t("history.update") || "Update"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onRefresh = () => {
    dispatch(fetchMeals());
  };

  const helpContent = {
    title: t("history.title") || "Meal History",
    description:
      t("history.help_description") ||
      "Here you can see all the meals you've photographed and uploaded. You can filter by meal type or date. Click on a meal to see more details or edit it.",
  };

  if (isLoading && filteredMeals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>
          {t("common.loading") || "Loading"}...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LanguageToolbar helpContent={helpContent} />

      {/* Search and Filter Header with RTL Support */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        {!isRTL && <Ionicons name="search" size={20} color="#6B7280" />}
        <TextInput
          style={[styles.searchInput, isRTL && styles.searchInputRTL]}
          placeholder={t("history.search_meals") || "Search meals..."}
          value={searchText}
          onChangeText={setSearchText}
          textAlign={isRTL ? "right" : "left"}
        />
        {isRTL && <Ionicons name="search" size={20} color="#6B7280" />}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Smart Insight */}
      {smartInsight ? (
        <View style={styles.insightContainer}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <Text style={styles.insightText}>{smartInsight}</Text>
        </View>
      ) : null}

      {/* Meals List */}
      <FlatList
        data={filteredMeals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          filteredMeals.length === 0
            ? styles.emptyContainer
            : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {t("history.no_meals") || "No meals to display"}
            </Text>
            <Text style={styles.emptyText}>
              {t("history.start_logging") ||
                "Start logging your meals to see your history here"}
            </Text>
          </View>
        }
      />

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("history.rate_meal") || "Rate Meal"}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedMeal?.name || ""}</Text>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t("history.taste") || "Taste"}
              </Text>
              {renderStarRating(tasteRating, setTasteRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t("history.satiety") || "Satiety"}
              </Text>
              {renderStarRating(satietyRating, setSatietyRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t("history.energy") || "Energy"}
              </Text>
              {renderStarRating(energyRating, setEnergyRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t("history.heaviness") || "Heaviness"}
              </Text>
              {renderStarRating(heavinessRating, setHeavinessRating)}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowFeedbackModal(false);
                  resetFeedbackRatings();
                }}
                disabled={isSavingFeedback}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleFeedbackSubmit}
                disabled={isSavingFeedback}
              >
                {isSavingFeedback ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t("common.save") || "Save"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("history.update_meal") || "Update Meal"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t("history.add_additional_info") ||
                "Add additional information about"}{" "}
              "{selectedMeal?.name || ""}"
            </Text>

            <TextInput
              style={styles.updateInput}
              placeholder={
                t("history.enter_additional_info") ||
                "Enter additional meal information..."
              }
              value={updateText}
              onChangeText={setUpdateText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowUpdateModal(false);
                  setUpdateText("");
                  setSelectedMeal(null);
                }}
                disabled={isUpdating}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUpdateSubmit}
                disabled={!updateText.trim() || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t("common.update") || "Update"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("history.filter_meals") || "Filter Meals"}
            </Text>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                {t("history.category") || "Category"}
              </Text>
              <View style={styles.categoryButtons}>
                {[
                  { key: "", label: t("common.all") || "All" },
                  {
                    key: "high-protein",
                    label: t("history.high_protein") || "High Protein",
                  },
                  {
                    key: "high-carb",
                    label: t("history.high_carb") || "High Carb",
                  },
                  {
                    key: "high-fat",
                    label: t("history.high_fat") || "High Fat",
                  },
                  {
                    key: "balanced",
                    label: t("history.balanced") || "Balanced",
                  },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      filters.category === category.key &&
                        styles.categoryButtonActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, category: category.key })
                    }
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        filters.category === category.key &&
                          styles.categoryButtonTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setFilters({});
                  setShowFilters(false);
                }}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.refresh") || "Reset"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.submitButtonText}>
                  {t("common.ok") || "Apply"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#1F2937",
  },
  searchInputRTL: {
    marginLeft: 0,
    marginRight: 12,
  },
  filterButton: {
    padding: 10,
    marginLeft: 8,
  },
  insightContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mealCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginBottom: 20,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mealName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  mealTime: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
    fontWeight: "500",
  },
  mealDescription: {
    fontSize: 15,
    color: "#4B5563",
    marginTop: 8,
    lineHeight: 22,
  },
  scoreContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  scoreText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  mealImage: {
    width: "100%",
    height: 200,
  },
  nutritionSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  ingredientsSection: {
    padding: 20,
  },
  ingredientsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ingredientsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 12,
  },
  ingredientsScrollView: {
    marginTop: 8,
  },
  ingredientsScrollContent: {
    paddingRight: 16,
  },
  modernIngredientCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  ingredientCardHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  modernIngredientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modernIngredientName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 16,
  },
  ingredientNutritionInfo: {
    gap: 6,
  },
  nutritionInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nutritionInfoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  nutritionInfoLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  nutritionDetails: {
    padding: 20,
  },
  nutritionDetailsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
  },
  macroSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nutritionDetailItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    minWidth: "45%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  nutritionDetailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  nutritionDetailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  analysisItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  analysisLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    fontWeight: "500",
  },
  analysisValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  allergensContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  allergenTag: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  allergenText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "500",
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  warningText: {
    fontSize: 14,
    color: "#EA580C",
    flex: 1,
    fontWeight: "500",
  },
  ratingsDisplay: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  ratingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  ratingsRow: {
    flexDirection: "row",
    gap: 24,
  },
  ratingItem: {
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  miniStars: {
    flexDirection: "row",
    gap: 2,
  },
  mealActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 16,
    color: "#1F2937",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#6B7280",
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    padding: 24,
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#1F2937",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  ratingSection: {
    marginBottom: 24,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  updateInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
    backgroundColor: "#F9FAFB",
    color: "#1F2937",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  submitButton: {
    backgroundColor: "#059669",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1F2937",
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  categoryButtonActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  categoryButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
});

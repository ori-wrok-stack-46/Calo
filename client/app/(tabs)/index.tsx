import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/src/services/api";
import { RootState, AppDispatch } from "@/src/store";
import FloatingChatButton from "@/components/FloatingChatButton";
import { fetchMeals } from "../../src/store/mealSlice";
import { Meal } from "../../src/types";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { GlobalStyles, Spacing, Typography } from "@/src/styles/globalStyles";
import { Droplets, Waves } from "lucide-react-native";

interface UserStats {
  totalMeals: number;
  totalCalories: number;
  avgCaloriesPerDay: number;
  streakDays: number;
}

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

const { width } = Dimensions.get("window");

const HomeScreen = React.memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { user } = useSelector((state: RootState) => state.auth);

  // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    targetCalories: 1800,
    targetProtein: 120,
    targetCarbs: 200,
    targetFat: 60,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [waterCups, setWaterCups] = useState(0);
  const [waterLoading, setWaterLoading] = useState(false);

  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  // utils/formatTime.ts
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    const year = date.getFullYear();
    // getMonth() returns 0-11, so add 1
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Refs for preventing overlapping loads and caching
  const isLoadingRef = useRef(false);
  const lastDataLoadRef = useRef<number>(0);
  const lastFocusTimeRef = useRef<number>(0);

  // Memoized calculations to prevent unnecessary re-renders
  const processedMealsData = useMemo(() => {
    if (!meals || meals.length === 0) {
      return {
        recentMeals: [],
        todaysMeals: [],
        dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      };
    }

    const sortedMeals = [...meals].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const today = new Date().toISOString().split("T")[0];
    const todayMeals = meals.filter((meal) =>
      meal.created_at.startsWith(today)
    );

    const dailyTotals = todayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      recentMeals: sortedMeals.slice(0, 3),
      todaysMeals: todayMeals,
      dailyTotals,
    };
  }, [meals]);

  // Update daily goals when processed data changes
  const updateDailyGoals = useCallback(() => {
    setDailyGoals((prev) => ({
      ...prev,
      ...processedMealsData.dailyTotals,
    }));
  }, [processedMealsData.dailyTotals]);

  // Optimized user stats loading with caching
  const loadUserStats = useCallback(async () => {
    if (!user?.user_id) return;

    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    // Skip if we loaded recently
    if (now - lastDataLoadRef.current < CACHE_DURATION) {
      return;
    }

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    try {
      const response = await api.get(`/calendar/statistics/${year}/${month}`);
      if (response.data.success) {
        const stats = response.data.data;
        const summaryStats: UserStats = {
          totalMeals: stats.totalMeals,
          totalCalories: stats.totalCalories,
          avgCaloriesPerDay: stats.avgCaloriesPerDay,
          streakDays: stats.streakDays || 0,
        };
        setUserStats(summaryStats);
        lastDataLoadRef.current = now;
      }
    } catch (error) {
      console.error("💥 Error loading user stats:", error);
    }
  }, [user?.user_id]);

  // Optimized data loading with debouncing
  const loadAllData = useCallback(
    async (force = false) => {
      if (!user?.user_id || isLoadingRef.current) return;

      const now = Date.now();
      const MIN_RELOAD_INTERVAL = 30 * 1000; // 30 seconds minimum between loads

      // Skip if we loaded very recently (unless forced)
      if (!force && now - lastDataLoadRef.current < MIN_RELOAD_INTERVAL) {
        return;
      }

      isLoadingRef.current = true;
      setIsDataLoading(true);

      try {
        // Load stats and meals in parallel
        const [statsResult, mealsResult] = await Promise.allSettled([
          loadUserStats(),
          dispatch(fetchMeals()).unwrap(),
        ]);

        if (statsResult.status === "rejected") {
          console.error("Stats loading failed:", statsResult.reason);
        }
        if (mealsResult.status === "rejected") {
          console.error("Meals loading failed:", mealsResult.reason);
        }

        lastDataLoadRef.current = now;
      } catch (error) {
        console.error("💥 Error loading data:", error);
      } finally {
        setIsDataLoading(false);
        setInitialLoading(false);
        isLoadingRef.current = false;
      }
    },
    [user?.user_id, loadUserStats, dispatch]
  );

  // Optimized refresh with proper state management
  const onRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes

    setRefreshing(true);
    try {
      await loadAllData(true); // Force reload on manual refresh
    } finally {
      setRefreshing(false);
    }
  }, [loadAllData, refreshing]);

  // Memoized percentage calculations
  const percentages = useMemo(
    () => ({
      calories: Math.min(
        (dailyGoals.calories / dailyGoals.targetCalories) * 100,
        100
      ),
      protein: Math.min(
        (dailyGoals.protein / dailyGoals.targetProtein) * 100,
        100
      ),
    }),
    [dailyGoals]
  );

  const navigateToCamera = useCallback(() => {
    router.push("/(tabs)/camera");
  }, []);

  // Water tracking functions
  const loadWaterIntake = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(`/nutrition/water-intake/${today}`);
      if (response.data.success) {
        setWaterCups(response.data.data.cups_consumed || 0);
      }
    } catch (error) {
      console.error("Error loading water intake:", error);
    }
  }, [user?.user_id]);

  const updateWaterIntake = useCallback(
    async (cups: number) => {
      if (!user?.user_id) return;

      // Update UI immediately for better UX
      setWaterCups(cups);

      // Then sync with server in background
      try {
        const response = await api.post("/nutrition/water-intake", {
          cups,
          date: new Date().toISOString().split("T")[0],
        });

        if (response.data.success) {
          // Show badge notification if earned
          if (response.data.badgeAwarded) {
            console.log("Badge earned: Scuba Diver! 🤿");
            // You can add a toast notification here
          }

          // Update XP if awarded
          if (response.data.xpAwarded > 0) {
            console.log(`XP earned: ${response.data.xpAwarded}`);
          }
        }
      } catch (error) {
        console.error("Error updating water intake:", error);
        // Revert UI change on error
        loadWaterIntake();
      }
    },
    [user?.user_id, loadWaterIntake]
  );

  const incrementWater = useCallback(() => {
    if (waterCups < 25 && !waterLoading) {
      updateWaterIntake(waterCups + 1);
    }
  }, [waterCups, updateWaterIntake, waterLoading]);

  const decrementWater = useCallback(() => {
    if (waterCups > 0 && !waterLoading) {
      updateWaterIntake(waterCups - 1);
    }
  }, [waterCups, updateWaterIntake, waterLoading]);

  // EFFECTS SECTION - All useEffect and useFocusEffect hooks go here
  useEffect(() => {
    updateDailyGoals();
  }, [updateDailyGoals]);

  // Initial load when user id is available
  useEffect(() => {
    if (user?.user_id && initialLoading) {
      loadAllData(true);
      loadWaterIntake();
    }
  }, [user?.user_id, loadAllData, initialLoading, loadWaterIntake]);

  // Optimized focus effect with throttling
  useFocusEffect(
    useCallback(() => {
      if (!user?.user_id || initialLoading) return;

      const now = Date.now();
      const FOCUS_RELOAD_THROTTLE = 10 * 1000; // 10 seconds minimum between focus reloads

      // Throttle focus-based reloads
      if (now - lastFocusTimeRef.current > FOCUS_RELOAD_THROTTLE) {
        lastFocusTimeRef.current = now;
        loadAllData();
      }
    }, [user?.user_id, initialLoading, loadAllData])
  );

  // NOW WE CAN HAVE CONDITIONAL LOGIC - ALL HOOKS ARE DECLARED ABOVE
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  // Memoized components to prevent unnecessary re-renders
  const QuickActionButton = React.memo(
    ({
      icon,
      title,
      onPress,
      color = "#007AFF",
      gradient = false,
    }: {
      icon: any;
      title: string;
      onPress: () => void;
      color?: string;
      gradient?: boolean;
    }) => {
      const ButtonContent = () => (
        <View style={[styles.quickActionButton]}>
          <Ionicons name={icon} size={28} color={gradient ? "#fff" : color} />
          <Text
            style={[
              styles.quickActionText,
              { color: gradient ? "#fff" : color },
            ]}
          >
            {title}
          </Text>
        </View>
      );

      return (
        <TouchableOpacity onPress={onPress} style={styles.quickActionContainer}>
          {gradient ? (
            <LinearGradient
              colors={[color, `${color}DD`]}
              style={styles.quickActionButton}
            >
              <Ionicons name={icon} size={28} color="#fff" />
              <Text style={[styles.quickActionText, { color: "#fff" }]}>
                {title}
              </Text>
            </LinearGradient>
          ) : (
            <ButtonContent />
          )}
        </TouchableOpacity>
      );
    }
  );

  const CalorieCard = React.memo(() => (
    <View style={styles.calorieCard}>
      <LinearGradient
        colors={["#4ECDC4", "#44A08D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.calorieGradient}
      >
        <View style={styles.calorieHeader}>
          <Ionicons name="flame" size={24} color="#fff" />
          <Text style={styles.calorieLabel}>{t("meals.calories")}</Text>
        </View>

        <View style={styles.calorieContent}>
          <Text style={styles.calorieValue}>
            {dailyGoals.calories.toLocaleString()}
          </Text>
          <Text style={styles.calorieTarget}>
            / {dailyGoals.targetCalories.toLocaleString()} {t("meals.calories")}
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentages.calories}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(percentages.calories)}%
          </Text>
        </View>

        <View style={styles.calorieFooter}>
          <View style={styles.calorieDetail}>
            <Ionicons name="time" size={16} color="#fff" />
            <Text style={styles.calorieDetailText}>
              {userStats?.streakDays || 0} {t("home.streak_days")}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  ));

  const TotalNutritionCard = React.memo(() => (
    <View style={styles.totalNutritionCard}>
      <LinearGradient
        colors={["#1B5E20", "#2E7D32", "#388E3C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalNutritionGradient}
      >
        <View style={styles.totalNutritionHeader}>
          <Ionicons name="analytics" size={24} color="#E8F5E8" />
          <Text style={styles.totalNutritionLabel}>
            Daily Nutrition Overview
          </Text>
          <View style={styles.totalNutritionBadge}>
            <Text style={styles.totalNutritionBadgeText}>
              {processedMealsData.todaysMeals.length} meals
            </Text>
          </View>
        </View>

        <View style={styles.totalNutritionGrid}>
          <View style={styles.totalNutritionMainItem}>
            <View style={styles.totalNutritionMainIconContainer}>
              <Ionicons name="flame" size={20} color="#FFD54F" />
            </View>
            <Text style={styles.totalNutritionMainValue}>
              {dailyGoals.calories.toLocaleString()}
            </Text>
            <Text style={styles.totalNutritionMainLabel}>Total Calories</Text>
            <View style={styles.totalNutritionProgressContainer}>
              <View style={styles.totalNutritionProgressBar}>
                <View
                  style={[
                    styles.totalNutritionProgressFill,
                    { width: `${percentages.calories}%` },
                  ]}
                />
              </View>
              <Text style={styles.totalNutritionProgressText}>
                {Math.round(percentages.calories)}%
              </Text>
            </View>
          </View>

          <View style={styles.totalNutritionRow}>
            <View style={styles.totalNutritionItem}>
              <View style={styles.totalNutritionIconContainer}>
                <Ionicons name="barbell" size={16} color="#81C784" />
              </View>
              <Text style={styles.totalNutritionValue}>
                {Math.round(dailyGoals.protein)}g
              </Text>
              <Text style={styles.totalNutritionItemLabel}>Protein</Text>
              <View style={styles.totalNutritionMiniProgress}>
                <View
                  style={[
                    styles.totalNutritionMiniProgressFill,
                    {
                      width: `${percentages.protein}%`,
                      backgroundColor: "#81C784",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.totalNutritionItem}>
              <View style={styles.totalNutritionIconContainer}>
                <Ionicons name="leaf" size={16} color="#64B5F6" />
              </View>
              <Text style={styles.totalNutritionValue}>
                {Math.round(dailyGoals.carbs)}g
              </Text>
              <Text style={styles.totalNutritionItemLabel}>Carbs</Text>
              <View style={styles.totalNutritionMiniProgress}>
                <View
                  style={[
                    styles.totalNutritionMiniProgressFill,
                    {
                      width: `${Math.min(
                        (dailyGoals.carbs / dailyGoals.targetCarbs) * 100,
                        100
                      )}%`,
                      backgroundColor: "#64B5F6",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.totalNutritionItem}>
              <View style={styles.totalNutritionIconContainer}>
                <Ionicons name="water" size={16} color="#FFB74D" />
              </View>
              <Text style={styles.totalNutritionValue}>
                {Math.round(dailyGoals.fat)}g
              </Text>
              <Text style={styles.totalNutritionItemLabel}>Fats</Text>
              <View style={styles.totalNutritionMiniProgress}>
                <View
                  style={[
                    styles.totalNutritionMiniProgressFill,
                    {
                      width: `${Math.min(
                        (dailyGoals.fat / dailyGoals.targetFat) * 100,
                        100
                      )}%`,
                      backgroundColor: "#FFB74D",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.totalNutritionFooter}>
          <View style={styles.totalNutritionDetail}>
            <Ionicons name="trending-up" size={16} color="#E8F5E8" />
            <Text style={styles.totalNutritionDetailText}>
              {userStats?.avgCaloriesPerDay
                ? Math.round(userStats.avgCaloriesPerDay)
                : 0}{" "}
              avg daily calories
            </Text>
          </View>
          <TouchableOpacity
            style={styles.totalNutritionViewButton}
            onPress={() => router.push("/(tabs)/statistics")}
          >
            <Text style={styles.totalNutritionViewText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#E8F5E8" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  ));

  const WaterTrackingCard = React.memo(() => (
    <View style={styles.waterCard}>
      <LinearGradient
        colors={["#3498DB", "#2980B9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.waterGradient}
      >
        <View style={styles.waterHeader}>
          <Ionicons name="water" size={24} color="#fff" />
          <Text style={styles.waterLabel}>Daily Water Intake</Text>
          <View style={styles.waterBadge}>
            <Text style={styles.waterBadgeText}>
              {waterCups >= 16 ? (
                <Waves size={24} color="blue" />
              ) : (
                <Droplets size={24} color="lightblue" />
              )}
            </Text>
          </View>
        </View>

        <View style={styles.waterContent}>
          <Text style={styles.waterValue}>{waterCups} / 25 cups</Text>
          <Text style={styles.waterTarget}>
            {(waterCups * 250).toLocaleString()} ml
          </Text>
        </View>

        <View style={styles.waterControls}>
          <TouchableOpacity
            style={[styles.waterButton, { opacity: waterCups <= 0 ? 0.5 : 1 }]}
            onPress={decrementWater}
            disabled={waterCups <= 0 || waterLoading}
          >
            <Ionicons name="remove" size={24} color="#fff" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cupsContainer}
            contentContainerStyle={styles.cupsContent}
          >
            {Array.from({ length: 25 }, (_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.cupIcon,
                  { opacity: i < waterCups ? 1 : 0.3 },
                  i < waterCups && styles.cupIconFilled,
                ]}
                onPress={() => updateWaterIntake(i + 1)}
                disabled={waterLoading}
              >
                <Ionicons
                  name="water"
                  size={20}
                  color={i < waterCups ? "#fff" : "#87CEEB"}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.waterButton, { opacity: waterCups >= 25 ? 0.5 : 1 }]}
            onPress={incrementWater}
            disabled={waterCups >= 25 || waterLoading}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.waterFooter}>
          <View style={styles.waterDetail}>
            <Ionicons name="trophy" size={16} color="#fff" />
            <Text style={styles.waterDetailText}>
              {waterCups >= 16
                ? "Goal Achieved! 🎉"
                : `${16 - waterCups} more for bonus`}
            </Text>
          </View>
          <Text style={styles.waterXP}>{waterCups >= 16 ? "+100 XP" : ""}</Text>
        </View>
      </LinearGradient>
    </View>
  ));

  const NutritionCard = React.memo(() => (
    <View style={styles.nutritionCard}>
      <Text style={styles.nutritionTitle}>{t("home.nutrition_breakdown")}</Text>

      <View style={styles.nutritionItem}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.nutritionLabel}>{t("meals.protein")}</Text>
          <Text style={styles.nutritionValue}>
            {Math.round(dailyGoals.protein)}g / {dailyGoals.targetProtein}g
          </Text>
        </View>
        <View style={styles.nutritionProgressBar}>
          <View
            style={[
              styles.nutritionProgressFill,
              {
                width: `${percentages.protein}%`,
                backgroundColor: "#FF6B6B",
              },
            ]}
          />
        </View>
        <Text style={styles.nutritionPercentage}>
          {Math.round(percentages.protein)}%
        </Text>
      </View>

      <View style={styles.macroRow}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>{t("meals.carbs")}</Text>
          <Text style={styles.macroValue}>{Math.round(dailyGoals.carbs)}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>{t("meals.fat")}</Text>
          <Text style={styles.macroValue}>{Math.round(dailyGoals.fat)}g</Text>
        </View>
      </View>
    </View>
  ));

  // Memoized meal card component
  const MealCard = React.memo(
    ({ meal, index }: { meal: Meal; index: number }) => (
      <TouchableOpacity
        key={meal.meal_id || `meal-${index}`}
        style={styles.mealCard}
        onPress={() => router.push(`/(tabs)/history`)}
      >
        {meal.image_url ? (
          <Image
            source={{ uri: meal.image_url }}
            style={styles.mealImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.mealPlaceholder}>
            <Ionicons name="restaurant" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.mealInfo}>
          <Text style={styles.mealName} numberOfLines={2}>
            {meal.name || t("meals.unknown_meal")}
          </Text>
          <Text style={styles.mealCalories}>
            {meal.calories || 0} {t("meals.cal")}
          </Text>
        </View>
      </TouchableOpacity>
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4ECDC4"]}
            tintColor="#4ECDC4"
          />
        }
      >
        {/* Header with gradient */}
        <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View
              style={[styles.headerText, isRTL && { alignItems: "flex-end" }]}
            >
              <Text style={styles.welcomeText}>
                {t("home.welcome")}
                {user?.name ? `, ${user.name}` : ""}
              </Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString(isRTL ? "he-IL" : "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* <CalorieCard /> */}
          {/* <NutritionCard /> */}
          <TotalNutritionCard />
          <WaterTrackingCard />

          {/* Quick Actions */}
          <View style={styles.waterCard}>
            <LinearGradient
              colors={["#FFA000", "#FFBF00", "#FFC107"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.totalNutritionGradient}
            >
              <Text style={styles.sectionTitle}>{t("home.quick_actions")}</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionButton
                  icon="camera"
                  title={t("home.scan_meal")}
                  onPress={() => router.push("/(tabs)/food-scanner")}
                  color="#ffffff"
                />
                <QuickActionButton
                  icon="add-circle"
                  title={t("home.add_meal")}
                  onPress={() => router.push("/(tabs)/camera")}
                  color="#ffffff"
                />
                <QuickActionButton
                  icon="restaurant"
                  title={t("home.meal_plan")}
                  onPress={() => router.push("/(tabs)/history")}
                  color="#ffffff"
                />
                <QuickActionButton
                  icon="stats-chart"
                  title={t("home.statistics")}
                  onPress={() => router.push("/(tabs)/statistics")}
                  color="#ffffff"
                />
              </View>
            </LinearGradient>
          </View>

          {/* Recent Meals */}
          <View style={styles.waterCard}>
            <LinearGradient
              colors={["#00695C", "#00897B", "#26A69A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.totalNutritionGradient}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t("home.recent_meals")}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/history")}
                >
                  <Text style={styles.viewAllText}>{t("common.view_all")}</Text>
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#4ECDC4"
                  style={styles.loader}
                />
              ) : processedMealsData.recentMeals.length > 0 ? (
                <View style={styles.mealsContainer}>
                  {processedMealsData.recentMeals.map((meal, index) => (
                    <TouchableOpacity
                      onPress={() => router.push(`/(tabs)/history`)}
                    >
                      <View
                        key={meal.meal_id || `meal-${index}`}
                        style={styles.mealSection}
                      >
                        <View style={styles.mealCard}>
                          <View style={styles.mealImageContainer}>
                            {meal.image_url ? (
                              <Image
                                source={{ uri: meal.image_url }}
                                style={styles.mealImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.mealPlaceholder}>
                                <Ionicons
                                  name="restaurant-outline"
                                  size={32}
                                  color="rgba(255, 255, 255, 0.6)"
                                />
                              </View>
                            )}
                          </View>

                          <View style={styles.mealInfo}>
                            <Text style={styles.mealName} numberOfLines={2}>
                              {meal.name || t("meals.unnamed_meal")}
                            </Text>

                            <View style={styles.mealMeta}>
                              <View style={styles.caloriesRow}>
                                <Ionicons
                                  name="flame-outline"
                                  size={14}
                                  color="#fff"
                                />
                                <Text style={styles.mealCalories}>
                                  {meal.calories || 0} {t("common.calories")}
                                </Text>
                              </View>

                              {meal.created_at && (
                                <Text style={styles.mealTime}>
                                  {formatTime(meal.created_at)}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>{t("meals.no_meals")}</Text>
                  <Text style={styles.emptySubtext}>
                    {t("home.add_meal_hint")}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      <FloatingChatButton />
    </SafeAreaView>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  ...GlobalStyles,
  titleContainer: {
    ...GlobalStyles.row,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stepContainer: {
    ...GlobalStyles.card,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  welcomeText: {
    ...Typography.h2,
    textAlign: "center",
    marginBottom: Spacing.lg,
    color: "#fafafa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  notificationButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
    marginTop: -20,
    paddingHorizontal: 20,
  },
  calorieCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  calorieGradient: {
    padding: 20,
  },
  calorieHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  calorieLabel: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  calorieContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  calorieTarget: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    minWidth: 40,
  },
  calorieFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calorieDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  calorieDetailText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
  },
  nutritionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  nutritionItem: {
    marginBottom: 15,
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  nutritionValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  nutritionProgressBar: {
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    marginBottom: 4,
  },
  nutritionProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  nutritionPercentage: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  viewAllText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionContainer: {
    width: "48%",
    marginBottom: 10,
  },
  quickActionButton: {
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)", // Subtle white border for glass effect
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)", // More transparent for glass look
    backdropFilter: "blur(10px)", // Glass blur effect (iOS)
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    minHeight: 120,
    justifyContent: "center",
    overflow: "hidden",
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#E8F5E8", // Light mint color for text
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  // Updated styles for sleek glassy meal displayer
  mealsContainer: {
    gap: 16,
    paddingTop: 8,
  },

  mealSection: {
    marginBottom: 4,
    transform: [{ translateY: 0 }],
  },

  mealCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    marginHorizontal: 2,
  },

  mealImageContainer: {
    position: "relative",
    overflow: "hidden",
    height: 120,
  },

  mealImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  mealPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },

  mealInfo: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
  },

  mealName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    lineHeight: 22,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  mealMeta: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 2,
    gap: 5,
  },

  caloriesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 255, 170, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  mealCalories: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
  },

  mealTime: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: "rgba(0, 255, 170, 0.1)",
    paddingVertical: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
  },

  // Alternative Horizontal Glass Layout
  mealCardHorizontal: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    backdropFilter: "blur(8px)",
    flexDirection: "row",
    height: 100,
    marginBottom: 12,
  },

  mealImageHorizontal: {
    width: 100,
    height: "100%",
    resizeMode: "cover",
  },

  mealInfoHorizontal: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },

  mealNameHorizontal: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  mealMetaHorizontal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  caloriesRowHorizontal: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },

  mealCaloriesHorizontal: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },

  mealTimeHorizontal: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "500",
  },

  // Minimal Glass List Layout
  mealCardMinimal: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(6px)",
  },

  mealImageMinimal: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: "cover",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  mealInfoMinimal: {
    flex: 1,
    gap: 4,
  },

  mealNameMinimal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  mealMetaMinimal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  caloriesRowMinimal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  mealCaloriesMinimal: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
  },

  mealTimeMinimal: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  emptyState: {
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  loader: {
    marginTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  waterCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  waterGradient: {
    padding: 20,
  },
  waterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  waterLabel: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
    flex: 1,
  },
  waterBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  waterBadgeText: {
    fontSize: 16,
  },
  waterContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  waterValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  waterTarget: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  waterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cupsContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  cupsContent: {
    alignItems: "center",
    paddingHorizontal: 5,
  },
  cupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  cupIconFilled: {
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  waterFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  waterDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  waterDetailText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
  },
  waterXP: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  totalNutritionCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  totalNutritionGradient: {
    padding: 24,
    borderRadius: 16,
  },
  totalNutritionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  totalNutritionLabel: {
    fontSize: 16,
    color: "#E8F5E8",
    marginLeft: 8,
    fontWeight: "600",
    flex: 1,
  },
  totalNutritionBadge: {
    backgroundColor: "rgba(232, 245, 232, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(232, 245, 232, 0.3)",
  },
  totalNutritionBadgeText: {
    fontSize: 12,
    color: "#E8F5E8",
    fontWeight: "600",
  },
  totalNutritionGrid: {
    marginBottom: 20,
  },
  totalNutritionMainItem: {
    alignItems: "center",
    backgroundColor: "rgba(232, 245, 232, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(232, 245, 232, 0.2)",
  },
  totalNutritionMainIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 213, 79, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  totalNutritionMainValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E8F5E8",
    marginBottom: 4,
  },
  totalNutritionMainLabel: {
    fontSize: 14,
    color: "#C8E6C9",
    fontWeight: "500",
    marginBottom: 12,
  },
  totalNutritionProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  totalNutritionProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(232, 245, 232, 0.3)",
    borderRadius: 3,
    marginRight: 10,
  },
  totalNutritionProgressFill: {
    height: "100%",
    backgroundColor: "#E8F5E8",
    borderRadius: 3,
  },
  totalNutritionProgressText: {
    fontSize: 12,
    color: "#E8F5E8",
    fontWeight: "600",
    minWidth: 35,
  },
  totalNutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  totalNutritionItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(232, 245, 232, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(232, 245, 232, 0.2)",
  },
  totalNutritionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(232, 245, 232, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  totalNutritionValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E8F5E8",
    marginBottom: 4,
  },
  totalNutritionItemLabel: {
    fontSize: 11,
    color: "#C8E6C9",
    fontWeight: "500",
    marginBottom: 8,
  },
  totalNutritionMiniProgress: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(232, 245, 232, 0.3)",
    borderRadius: 2,
  },
  totalNutritionMiniProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  totalNutritionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalNutritionDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalNutritionDetailText: {
    fontSize: 12,
    color: "#C8E6C9",
    marginLeft: 4,
  },
  totalNutritionViewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(232, 245, 232, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232, 245, 232, 0.3)",
  },
  totalNutritionViewText: {
    fontSize: 12,
    color: "#E8F5E8",
    fontWeight: "600",
    marginRight: 4,
  },
});

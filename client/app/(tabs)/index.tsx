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
  I18nManager,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Target,
  Flame,
  Droplets,
  Zap,
  ChevronLeft,
  TrendingUp,
  Clock,
  Award,
  Plus,
  Camera,
  ChartBar as BarChart3,
  Check,
  Trophy,
  Star,
  Calendar,
} from "lucide-react-native";
import { api, APIError } from "@/src/services/api";
import { fetchMeals } from "../../src/store/mealSlice";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import XPNotification from "@/components/XPNotification";
import { Colors, EmeraldSpectrum } from "@/constants/Colors";
import { getStatistics } from "@/src/store/calendarSlice";
import { setUser } from "@/src/store/authSlice"; // Assuming setUser is in authSlice
import { useOptimizedSelector } from "../../src/utils/useOptimizedSelector"; // Import the optimized selector
import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/src/store";

// Enable RTL support
I18nManager.allowRTL(true);

const { width } = Dimensions.get("window");

interface UserStats {
  totalMeals: number;
  totalCalories: number;
  avgCaloriesPerDay: number;
  streakDays: number;
  xp?: number;
  level?: number;
  bestStreak?: number;
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

interface GoalProgress {
  type: "calories" | "protein" | "water" | "steps";
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
  label: string;
}

const HomeScreen = React.memo(() => {
  const dispatch = useDispatch<AppDispatch>();

  // Move the useMemo selectors INSIDE the component
  const selectMealState = useMemo(
    () => (state: RootState) => ({
      meals: state.meal.meals,
      isLoading: state.meal.isLoading,
    }),
    []
  );

  const selectAuthState = useMemo(
    () => (state: RootState) => ({
      user: state.auth.user,
    }),
    []
  );

  const { meals, isLoading } = useOptimizedSelector(selectMealState); // Use optimized selector
  const { user } = useOptimizedSelector(selectAuthState); // Use optimized selector
  const { colors } = useTheme();
  // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [userStats, setUserStats] = useState<UserStats>({
    totalMeals: 0,
    totalCalories: 0,
    avgCaloriesPerDay: 0,
    streakDays: 0,
    xp: 0,
    level: 1,
    bestStreak: 0,
  });
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
  const [language, setLanguage] = useState<"he" | "en">("he");
  const [waterSyncErrors, setWaterSyncErrors] = useState<string[]>([]);
  const [waterSyncInProgress, setWaterSyncInProgress] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [userStatsError, setUserStatsError] = useState<string | null>(null);

  // XP Notification State
  const [showXPNotification, setShowXPNotification] = useState(false);
  const [xpNotificationData, setXPNotificationData] = useState<{
    xpGained: number;
    leveledUp?: boolean;
    newLevel?: number;
    newAchievements?: any[];
  }>({ xpGained: 0 });

  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "he" ? "en" : "he"));
  };

  // utils/formatTime.ts
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
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
  const abortControllerRef = useRef<AbortController | null>(null);

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
    const todayMeals = meals.filter((meal: { created_at: string; }) =>
      meal.created_at.startsWith(today)
    );

    const dailyTotals = todayMeals.reduce(
      (acc: { calories: any; protein: any; carbs: any; fat: any; }, meal: { calories: any; protein: any; carbs: any; fat: any; }) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      recentMeals: sortedMeals.slice(0, 4),
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

  // Optimized data loading with debouncing
  const loadAllData = useCallback(
    async (force = false) => {
      if (!user?.user_id || isLoadingRef.current) return;

      const now = Date.now();
      const MIN_RELOAD_INTERVAL = 30 * 1000; // 30 seconds minimum between loads

      if (!force && now - lastDataLoadRef.current < MIN_RELOAD_INTERVAL) {
        return;
      }

      isLoadingRef.current = true;
      setIsDataLoading(true);
      setDataError(null);

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 15000)
        );

        const [mealsResult] = await Promise.allSettled([
          Promise.race([dispatch(fetchMeals()).unwrap(), timeoutPromise]),
        ]);

        if (mealsResult.status === "rejected") {
          console.error("Meals loading failed:", mealsResult.reason);
          setDataError("Failed to load meals data");
        }

        setRetryCount(0);
      } catch (error) {
        console.error("Error loading data:", error);
        setDataError(
          error instanceof APIError ? error.message : "Failed to load data"
        );
        setRetryCount((prev) => prev + 1);
      } finally {
        setIsDataLoading(false);
        setInitialLoading(false);
        isLoadingRef.current = false;
      }
    },
    [user?.user_id, dispatch, retryCount]
  );

  // Optimized refresh with proper state management
  const onRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await loadAllData(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadAllData, refreshing]);

  // Water tracking functions with optimistic updates
  const [optimisticWaterCups, setOptimisticWaterCups] = useState(0);
  const [pendingSyncActions, setPendingSyncActions] = useState<
    Array<{ id: string; type: string; timestamp: number; targetValue?: number }>
  >([]);

  const loadWaterIntake = useCallback(async () => {
    if (!user?.user_id) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(`/nutrition/water-intake/${today}`, {
        signal: controller.signal,
      });
      if (response.data.success) {
        const serverCups = response.data.data.cups_consumed || 0;
        setWaterCups(serverCups);
        setOptimisticWaterCups(serverCups);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Water intake request aborted");
        return;
      }
      console.error("Error loading water intake:", error);
    } finally {
      clearTimeout(timeoutId);
    }
  }, [user?.user_id]);

  // Dummy showToast function if not provided elsewhere
  const showToast = (message: string, type: "success" | "info" | "error") => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // In a real app, this would use a toast library or component
  };

  // Dummy setUser function if not provided elsewhere
  const setUserInState = (userData: any) => {
    dispatch(setUser(userData));
  };

  const syncWaterWithServer = async (totalCups: number, actionId: string) => {
    if (!user?.user_id) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const today = new Date().toISOString().split("T")[0];
      console.log(`💧 Syncing water intake: ${totalCups} cups for ${today}`);

      const response = await api.post(
        "/nutrition/water-intake",
        {
          cups_consumed: totalCups,
          date: today,
        },
        {
          signal: controller.signal,
        }
      );

      if (response.data.success) {
        console.log(`✅ Water intake synced successfully: ${totalCups} cups`);
        setWaterCups(totalCups);

        if (
          response.data.xpAwarded > 0 ||
          response.data.newAchievements?.length > 0
        ) {
          setXPNotificationData({
            xpGained: response.data.xpAwarded || 0,
            leveledUp: response.data.leveledUp,
            newLevel: response.data.newLevel,
            newAchievements: response.data.newAchievements || [],
          });
          setShowXPNotification(true);
        }

        setPendingSyncActions((prev) =>
          prev.filter((action) => action.id !== actionId)
        );

        setWaterSyncErrors((prev) =>
          prev.filter((error) => !error.includes(actionId))
        );
      } else {
        throw new Error(
          response.data.error || "Server returned success: false"
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("💧 Water sync request aborted");
        return;
      }
      console.error("❌ Error syncing water intake:", error);

      setWaterSyncErrors((prev) => [
        ...prev,
        `Sync failed for action ${actionId}: ${
          error.message || "Unknown error"
        }`,
      ]);

      setOptimisticWaterCups(waterCups);
    } finally {
      clearTimeout(timeoutId);
      setWaterSyncInProgress(false);
    }
  };

  // Water sync debouncing
  const waterSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRequestRef = useRef<number>(0);

  const optimisticWaterUpdate = (delta: number) => {
    const goalMaxCups = 10;
    if (delta > 0 && optimisticWaterCups >= goalMaxCups) return;
    if (delta < 0 && optimisticWaterCups <= 0) return;

    const newTotal = Math.max(
      0,
      Math.min(goalMaxCups, optimisticWaterCups + delta)
    );

    setOptimisticWaterCups(newTotal);

    if (waterSyncTimeoutRef.current) {
      clearTimeout(waterSyncTimeoutRef.current);
    }

    const actionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    lastSyncRequestRef.current = Date.now();

    setPendingSyncActions([
      {
        id: actionId,
        type: "water",
        timestamp: Date.now(),
        targetValue: newTotal,
      },
    ]);

    waterSyncTimeoutRef.current = setTimeout(() => {
      const timeSinceRequest = Date.now() - lastSyncRequestRef.current;
      if (timeSinceRequest >= 800) {
        syncWaterWithServer(newTotal, actionId);
      }
    }, 1000);
  };

  // Add button debouncing for water controls
  const [buttonCooldown, setButtonCooldown] = useState(false);

  const incrementWater = useCallback(() => {
    if (buttonCooldown) return;
    setButtonCooldown(true);
    optimisticWaterUpdate(1);
    setTimeout(() => setButtonCooldown(false), 200);
  }, [optimisticWaterUpdate, buttonCooldown]);

  const decrementWater = useCallback(() => {
    if (buttonCooldown) return;
    setButtonCooldown(true);
    optimisticWaterUpdate(-1);
    setTimeout(() => setButtonCooldown(false), 200);
  }, [optimisticWaterUpdate, buttonCooldown]);

  const retryFailedSyncs = () => {
    pendingSyncActions.forEach((action) => {
      syncWaterWithServer(action.targetValue || optimisticWaterCups, action.id);
    });
    setWaterSyncErrors([]);
  };

  const dismissWaterErrors = () => {
    setWaterSyncErrors([]);
  };

  // Goal progress data
  const goalProgress: GoalProgress[] = useMemo(
    () => [
      {
        type: "calories",
        current: dailyGoals.calories,
        target: dailyGoals.targetCalories,
        unit: t("meals.kcal") || "kcal",
        color: EmeraldSpectrum.emerald600,
        icon: <Flame size={24} color={EmeraldSpectrum.emerald600} />,
        label: t("meals.calories") || "Calories",
      },
      {
        type: "protein",
        current: dailyGoals.protein,
        target: dailyGoals.targetProtein,
        unit: "g",
        color: EmeraldSpectrum.emerald700,
        icon: <Zap size={24} color={EmeraldSpectrum.emerald700} />,
        label: t("meals.protein") || "Protein",
      },
      {
        type: "water",
        current: optimisticWaterCups * 250,
        target: 2500,
        unit: "ml",
        color: EmeraldSpectrum.emerald500,
        icon: <Droplets size={24} color={EmeraldSpectrum.emerald500} />,
        label: t("home.water") || "Water",
      },
    ],
    [dailyGoals, optimisticWaterCups, t]
  );

  // Calculate time-based progress
  const currentHour = new Date().getHours();
  const hoursLeft = 24 - currentHour;
  const expectedCaloriesByNow = (goalProgress[0].target * currentHour) / 24;
  const calorieStatus =
    goalProgress[0].current > expectedCaloriesByNow
      ? "ahead"
      : goalProgress[0].current < expectedCaloriesByNow * 0.8
      ? "behind"
      : "onTrack";

  // EFFECTS SECTION
  useEffect(() => {
    updateDailyGoals();
  }, [updateDailyGoals]);

  useEffect(() => {
    if (user?.user_id && initialLoading) {
      loadAllData(true);
      loadWaterIntake();
    }
  }, [user?.user_id, loadAllData, initialLoading, loadWaterIntake]);

  useEffect(() => {
    setOptimisticWaterCups(waterCups);
  }, [waterCups]);

  // Cleanup effect for abort controllers
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user?.user_id || initialLoading) return;

      const now = Date.now();
      const FOCUS_RELOAD_THROTTLE = 30 * 1000;

      if (now - lastFocusTimeRef.current > FOCUS_RELOAD_THROTTLE) {
        lastFocusTimeRef.current = now;
        loadAllData();
      }
    }, [user?.user_id, initialLoading, loadAllData])
  );

  // Render functions
  const renderGoalGauge = (goal: GoalProgress) => {
    const percentage = Math.min((goal.current / goal.target) * 100, 100);
    const remaining = Math.max(goal.target - goal.current, 0);

    return (
      <View style={styles.gaugeContainer}>
        <LinearGradient
          colors={[`${goal.color}15`, `${goal.color}05`]}
          style={styles.gaugeGradient}
        >
          <View style={styles.gaugeHeader}>
            <View style={styles.gaugeIconContainer}>{goal.icon}</View>
            <View style={styles.gaugeInfo}>
              <Text style={styles.gaugeLabel}>{goal.label}</Text>
              <Text style={styles.gaugeCurrent}>
                {goal.current.toLocaleString()}
                {goal.unit}
              </Text>
            </View>
            <View style={styles.gaugePercentage}>
              <Text style={[styles.gaugePercentageText, { color: goal.color }]}>
                {percentage.toFixed(0)}%
              </Text>
            </View>
          </View>

          <View style={styles.gaugeProgressContainer}>
            <View style={styles.gaugeProgressBg}>
              <LinearGradient
                colors={[goal.color, `${goal.color}80`]}
                style={[styles.gaugeProgressFill, { width: `${percentage}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          <View style={styles.gaugeFooter}>
            <Text style={styles.gaugeTarget}>
              {t("home.target") || "Target"}: {goal.target.toLocaleString()}
              {goal.unit}
            </Text>
            {remaining > 0 ? (
              <Text style={[styles.gaugeRemaining, { color: goal.color }]}>
                {`${remaining.toLocaleString()}${goal.unit} ${
                  t("home.remaining") || "remaining"
                }`}
              </Text>
            ) : (
              <View style={styles.completedContainer}>
                <Check size={18} color="green" strokeWidth={2} />
                <Text style={styles.completedText}>
                  {t("home.completed") || "Completed"}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  // User Stats Render Function
  const renderUserStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("home.user_stats") || "Your Progress"}
      </Text>

      {userStatsError && (
        <View style={styles.statsErrorBanner}>
          <Text style={styles.statsErrorText}>{userStatsError}</Text>
        </View>
      )}

      <View style={styles.statsMainContainer}>
        <LinearGradient
          colors={[EmeraldSpectrum.emerald600, EmeraldSpectrum.emerald500]}
          style={styles.statsGradient}
        >
          {userStatsLoading ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.statsLoadingText}>Loading stats...</Text>
            </View>
          ) : (
            <>
              {/* XP and Level Row */}
              <View style={styles.statsTopRow}>
                <View style={styles.statsXPContainer}>
                  <View style={styles.statsIconWrapper}>
                    <Star size={24} color="#FFD700" fill="#FFD700" />
                  </View>
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsLabel}>
                      {t("home.total_xp") || "Total XP"}
                    </Text>
                    <Text style={styles.statsValue}>{user?.total_points}</Text>
                  </View>
                </View>
                <View style={styles.statsLevelContainer}>
                  <View style={styles.statsIconWrapper}>
                    <Trophy size={24} color="#FFD700" fill="#FFD700" />
                  </View>
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsLabel}>
                      {t("home.level") || "Level"}
                    </Text>
                    <Text style={styles.statsValue}>{user?.level || 1}</Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.statsDivider} />

              {/* Bottom Statistics Row */}
              <View style={styles.statsBottomRow}>
                <View style={styles.statsItem}>
                  <View style={styles.statsIconWrapper}>
                    <Flame size={20} color="#FF6B35" />
                  </View>
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsSmallLabel}>
                      {t("home.streak") || "Streak"}
                    </Text>
                    <Text style={styles.statsSmallValue}>
                      {user?.current_streak || 0} days
                    </Text>
                  </View>
                </View>

                <View style={styles.statsItem}>
                  <View style={styles.statsIconWrapper}>
                    <Calendar size={20} color="#9B59B6" />
                  </View>
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsSmallLabel}>
                      {t("home.best_streak") || "Best"}
                    </Text>
                    <Text style={styles.statsSmallValue}>
                      {user?.best_streak || 0} days
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </LinearGradient>
      </View>
    </View>
  );

  // NOW WE CAN HAVE CONDITIONAL LOGIC
  if (initialLoading) {
    return (
      <LoadingScreen text={isRTL ? "טוען מידע..." : "Loading your data..."} />
    );
  }

  // Show error state with retry option
  if (dataError && retryCount > 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{dataError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadAllData(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={EmeraldSpectrum.emerald600}
        />

        <XPNotification
          visible={showXPNotification}
          xpGained={xpNotificationData.xpGained}
          leveledUp={xpNotificationData.leveledUp}
          newLevel={xpNotificationData.newLevel}
          newAchievements={xpNotificationData.newAchievements}
          onHide={() => setShowXPNotification(false)}
          language={language}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[EmeraldSpectrum.emerald500]}
              tintColor={EmeraldSpectrum.emerald500}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {t("home.welcome")}
                {user?.name ? `, ${user.name}` : ""}!
              </Text>
              <Text style={styles.subtitle}>
                {t("home.track_goals") || "Let's track your goals today"}
              </Text>
            </View>
          </View>

          {/* User Stats */}
          {renderUserStats()}

          {/* Main Goal Progress - Calories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("home.goal_progress") || "Goal Progress"}
            </Text>
            <View style={styles.mainGoalContainer}>
              <LinearGradient
                colors={[
                  EmeraldSpectrum.emerald600,
                  EmeraldSpectrum.emerald500,
                ]}
                style={styles.mainGoalGradient}
              >
                <View style={styles.mainGoalContent}>
                  <View style={styles.mainGoalHeader}>
                    <Flame size={32} color="#FFFFFF" />
                    <Text style={styles.mainGoalTitle}>
                      {t("meals.calories") || "Calories"}
                    </Text>
                  </View>
                  <View style={styles.mainGoalValues}>
                    <Text style={styles.mainGoalCurrent}>
                      {dailyGoals.calories.toLocaleString()}
                    </Text>
                    <Text style={styles.mainGoalTarget}>
                      / {dailyGoals.targetCalories.toLocaleString()}{" "}
                      {t("meals.kcal") || "kcal"}
                    </Text>
                  </View>
                  <View style={styles.mainGoalProgress}>
                    <View style={styles.mainGoalProgressBg}>
                      <View
                        style={[
                          styles.mainGoalProgressFill,
                          {
                            width: `${Math.min(
                              (dailyGoals.calories /
                                dailyGoals.targetCalories) *
                                100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.mainGoalPercentage}>
                      {Math.min(
                        (dailyGoals.calories / dailyGoals.targetCalories) * 100,
                        100
                      ).toFixed(0)}
                      %
                    </Text>
                  </View>
                  <View style={styles.mainGoalRemaining}>
                    <Text style={styles.mainGoalRemainingText}>
                      {Math.max(
                        dailyGoals.targetCalories - dailyGoals.calories,
                        0
                      )}{" "}
                      {t("meals.kcal") || "kcal"}{" "}
                      {t("home.remaining") || "remaining"}
                    </Text>
                    <View style={styles.mainGoalStatus}>
                      <Clock size={16} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.mainGoalStatusText}>
                        {hoursLeft} {t("home.hours_left") || "hours left"}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Goal Gauges */}
          <View style={styles.section}>
            <View style={styles.goalGaugesContainer}>
              {goalProgress.slice(1).map((goal, index) => (
                <View key={index} style={styles.goalGaugeWrapper}>
                  {renderGoalGauge(goal)}
                </View>
              ))}
            </View>
          </View>

          {/* Water Tracking Section */}
          <View style={styles.section}>
            <View style={styles.waterTrackingContainer}>
              <LinearGradient
                colors={[
                  EmeraldSpectrum.emerald500,
                  EmeraldSpectrum.emerald600,
                ]}
                style={styles.waterTrackingGradient}
              >
                <View style={styles.waterTrackingHeader}>
                  <Droplets size={24} color="#FFFFFF" />
                  <Text style={styles.waterTrackingTitle}>
                    {t("home.daily_water") || "Daily Water Intake"}
                  </Text>
                  <View style={styles.waterBadge}>
                    <Text style={styles.waterBadgeText}>
                      {optimisticWaterCups >= 10 ? "🏆" : "💧"}
                    </Text>
                  </View>
                </View>

                <View style={styles.waterTrackingContent}>
                  <View style={styles.waterValueContainer}>
                    <Text style={styles.waterTrackingValue}>
                      {optimisticWaterCups} / 10 {t("home.cups") || "cups"}
                    </Text>
                  </View>
                  <Text style={styles.waterTrackingTarget}>
                    {(optimisticWaterCups * 250).toLocaleString()} ml / 2,500 ml
                  </Text>
                </View>

                <View style={styles.waterControls}>
                  <TouchableOpacity
                    style={[
                      styles.waterButton,
                      styles.waterButtonMinus,
                      { opacity: optimisticWaterCups <= 0 ? 0.4 : 1 },
                    ]}
                    onPress={decrementWater}
                    disabled={optimisticWaterCups <= 0}
                    activeOpacity={0.7}
                  >
                    <Plus
                      size={24}
                      color="#FFFFFF"
                      style={{ transform: [{ rotate: "45deg" }] }}
                    />
                  </TouchableOpacity>

                  <View style={styles.waterProgress}>
                    <View style={styles.waterProgressBg}>
                      <View
                        style={[
                          styles.waterProgressFill,
                          {
                            width: `${Math.min(
                              (optimisticWaterCups / 10) * 100,
                              100
                            )}%`,
                            backgroundColor: "#FFFFFF",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.waterProgressText}>
                      {Math.min((optimisticWaterCups / 10) * 100, 100).toFixed(
                        0
                      )}
                      %
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.waterButton,
                      styles.waterButtonPlus,
                      { opacity: optimisticWaterCups >= 10 ? 0.4 : 1 },
                    ]}
                    onPress={incrementWater}
                    disabled={optimisticWaterCups >= 10}
                    activeOpacity={0.7}
                  >
                    <Plus size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.waterTrackingFooter}>
                  <Text style={styles.waterTrackingRemaining}>
                    {Math.max(10 - optimisticWaterCups, 0)}{" "}
                    {t("home.cups") || "cups"}{" "}
                    {t("home.remaining") || "remaining"}
                  </Text>
                  <Text style={styles.waterXP}>
                    {optimisticWaterCups >= 8
                      ? "🎉 +50 XP"
                      : optimisticWaterCups >= 4
                      ? "⭐ +25 XP"
                      : optimisticWaterCups > 0
                      ? "💧 +10 XP"
                      : ""}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Status Indicator */}
          <View style={styles.section}>
            <View style={styles.statusContainer}>
              <LinearGradient
                colors={
                  calorieStatus === "ahead"
                    ? [
                        EmeraldSpectrum.emerald500 + "15",
                        EmeraldSpectrum.emerald500 + "05",
                      ]
                    : calorieStatus === "behind"
                    ? ["#E74C3C15", "#E74C3C05"]
                    : ["#F39C1215", "#F39C1205"]
                }
                style={styles.statusGradient}
              >
                <View style={styles.statusContent}>
                  <View style={styles.statusIcon}>
                    {calorieStatus === "ahead" ? (
                      <TrendingUp
                        size={24}
                        color={EmeraldSpectrum.emerald500}
                      />
                    ) : calorieStatus === "behind" ? (
                      <Target size={24} color="#E74C3C" />
                    ) : (
                      <Award size={24} color="#F39C12" />
                    )}
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusTitle}>
                      {calorieStatus === "ahead"
                        ? t("home.ahead_schedule") || "Ahead of Schedule"
                        : calorieStatus === "behind"
                        ? t("home.behind_schedule") || "Behind Schedule"
                        : t("home.on_track") || "On Track"}
                    </Text>
                    <Text style={styles.statusDescription}>
                      {calorieStatus === "ahead"
                        ? t("home.ahead_description") ||
                          "You're ahead of schedule - excellent!"
                        : calorieStatus === "behind"
                        ? t("home.behind_description") ||
                          "Time to add a meal or snack"
                        : t("home.track_description") ||
                          "You're on track to reach your goal"}
                    </Text>
                  </View>
                  <View style={styles.statusStreak}>
                    <Text style={styles.statusStreakNumber}>
                      {user?.current_streak || 0}
                    </Text>
                    <Text style={styles.statusStreakLabel}>
                      {t("home.days") || "days"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("home.quick_actions") || "Quick Actions"}
            </Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/camera")}
              >
                <LinearGradient
                  colors={[
                    EmeraldSpectrum.emerald600,
                    EmeraldSpectrum.emerald600 + "E6",
                  ]}
                  style={styles.quickActionGradient}
                >
                  <View style={styles.quickActionIconContainer}>
                    <Camera size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.quickActionText}>
                    {t("home.add_meal") || "Add Meal"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/food-scanner")}
              >
                <LinearGradient
                  colors={[
                    EmeraldSpectrum.emerald500,
                    EmeraldSpectrum.emerald500 + "E6",
                  ]}
                  style={styles.quickActionGradient}
                >
                  <View style={styles.quickActionIconContainer}>
                    <Target size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.quickActionText}>
                    {t("home.scan_meal") || "Scan Food"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/statistics")}
              >
                <LinearGradient
                  colors={[
                    EmeraldSpectrum.emerald700,
                    EmeraldSpectrum.emerald700 + "E6",
                  ]}
                  style={styles.quickActionGradient}
                >
                  <View style={styles.quickActionIconContainer}>
                    <BarChart3 size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.quickActionText}>
                    {t("home.statistics") || "Statistics"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("home.todays_summary") || "Today's Summary"}
            </Text>
            <View style={styles.mealsContainer}>
              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color={EmeraldSpectrum.emerald500}
                  style={styles.loader}
                />
              ) : processedMealsData.recentMeals.length > 0 ? (
                processedMealsData.recentMeals.map((meal, index) => (
                  <TouchableOpacity
                    key={meal.meal_id || `meal-${index}`}
                    style={styles.mealCard}
                    onPress={() => router.push("/(tabs)/history")}
                  >
                    <View style={styles.mealImageContainer}>
                      {meal.image_url ? (
                        <Image
                          source={{ uri: meal.image_url }}
                          style={styles.mealImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.mealPlaceholder}>
                          <Target size={32} color="rgba(255,255,255,0.6)" />
                        </View>
                      )}
                    </View>
                    <View style={styles.mealInfo}>
                      <View style={styles.mealDetails}>
                        <Text style={styles.mealName} numberOfLines={2}>
                          {meal.name || t("meals.unknown_meal")}
                        </Text>
                        {meal.created_at && (
                          <Text style={styles.mealTime}>
                            {formatTime(meal.created_at)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.mealCaloriesContainer}>
                        <Text style={styles.mealCalories}>
                          {meal.calories || 0} {t("meals.kcal") || "kcal"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chevronContainer}>
                      <ChevronLeft size={16} color="#BDC3C7" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Target size={48} color="#ccc" />
                  <Text style={styles.emptyText}>
                    {t("meals.no_meals") || "No meals today"}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {t("home.add_meal_hint") ||
                      "Add your first meal to get started"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A202C",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#718096",
    marginTop: 4,
    lineHeight: 20,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A202C",
    marginBottom: 20,
    letterSpacing: -0.3,
  },

  // Enhanced User Stats Styles
  statsMainContainer: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: EmeraldSpectrum.emerald600,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  statsGradient: {
    padding: 24,
  },
  statsLoadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  statsLoadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "500",
  },
  statsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statsXPContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statsLevelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 16,
  },
  statsBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 4,
  },
  statsSmallLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginBottom: 2,
  },
  statsSmallValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statsErrorBanner: {
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#E74C3C",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsErrorText: {
    color: "#E74C3C",
    fontSize: 13,
    fontWeight: "500",
  },

  // Main Goal Progress
  mainGoalContainer: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: EmeraldSpectrum.emerald600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  mainGoalGradient: {
    padding: 24,
  },
  mainGoalContent: {
    alignItems: "center",
  },
  mainGoalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  mainGoalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  mainGoalValues: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  mainGoalCurrent: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  mainGoalTarget: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 8,
  },
  mainGoalProgress: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  mainGoalProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  mainGoalProgressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  mainGoalPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    minWidth: 40,
  },
  mainGoalRemaining: {
    alignItems: "center",
  },
  mainGoalRemainingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  mainGoalStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainGoalStatusText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 6,
  },

  // Goal Gauges
  goalGaugesContainer: {
    gap: 16,
  },
  goalGaugeWrapper: {
    width: "100%",
  },
  gaugeContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  gaugeGradient: {
    padding: 20,
  },
  gaugeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  gaugeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  gaugeInfo: {
    flex: 1,
  },
  gaugeLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 4,
  },
  gaugeCurrent: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  gaugePercentage: {
    alignItems: "center",
  },
  gaugePercentageText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  gaugeProgressContainer: {
    marginBottom: 12,
  },
  gaugeProgressBg: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  gaugeProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  gaugeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gaugeTarget: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  gaugeRemaining: {
    fontSize: 14,
    fontWeight: "600",
  },
  completedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "green",
  },

  // Water Tracking
  waterTrackingContainer: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: EmeraldSpectrum.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  waterTrackingGradient: {
    padding: 24,
  },
  waterTrackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  waterTrackingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 12,
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
  waterTrackingContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  waterTrackingValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  waterTrackingTarget: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  waterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  waterProgress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
  },
  waterProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  waterProgressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  waterProgressText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    minWidth: 35,
  },
  waterTrackingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  waterTrackingRemaining: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  waterXP: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // Status Container
  statusContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
  },
  statusStreak: {
    alignItems: "center",
  },
  statusStreakNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: EmeraldSpectrum.emerald600,
  },
  statusStreakLabel: {
    fontSize: 12,
    color: "#7F8C8D",
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 88,
    justifyContent: "center",
  },
  quickActionIconContainer: {
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 16,
  },

  // Meals
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    overflow: "hidden",
  },
  mealImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    margin: 12,
  },
  mealImage: {
    width: "100%",
    height: "100%",
  },
  mealPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F7FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  mealInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  mealDetails: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A202C",
    lineHeight: 20,
  },
  mealTime: {
    fontSize: 13,
    color: "#718096",
    marginTop: 2,
    lineHeight: 16,
  },
  mealCaloriesContainer: {
    marginRight: 8,
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: "600",
    color: EmeraldSpectrum.emerald600,
  },
  chevronContainer: {
    paddingRight: 16,
  },

  // States
  emptyState: {
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 4,
    textAlign: "center",
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
    backgroundColor: "#FAFBFC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  waterDisplay: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    position: "relative",
  },
  syncIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
  },
  syncingText: {
    fontSize: 10,
    fontStyle: "italic",
  },
  errorNotification: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  errorActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  errorButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  errorDismissButton: {
    padding: 4,
  },

  // Enhanced Water Tracking Styles
  waterValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  syncText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  waterButtonPlus: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  waterButtonMinus: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  waterErrorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(231, 76, 60, 0.3)",
  },
  waterErrorText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  waterErrorActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: EmeraldSpectrum.emerald600,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  dismissButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
  },
  dismissButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FAFBFC",
  },
});

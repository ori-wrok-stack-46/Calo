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
  ChevronRight,
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
  Menu,
  Minus,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Utensils,
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
import { setUser } from "@/src/store/authSlice";
import { useOptimizedSelector } from "../../src/utils/useOptimizedSelector";
import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/src/store";
import CircularCaloriesProgress from "@/components/index/CircularCaloriesProgress";

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

  const { meals, isLoading } = useOptimizedSelector(selectMealState);
  const { user } = useOptimizedSelector(selectAuthState);
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
    targetCalories: 2205,
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
    const todayMeals = meals.filter((meal: { created_at: string }) =>
      meal.created_at.startsWith(today)
    );

    const dailyTotals = todayMeals.reduce(
      (
        acc: { calories: any; protein: any; carbs: any; fat: any },
        meal: { calories: any; protein: any; carbs: any; fat: any }
      ) => ({
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
        color: "#10B981",
        icon: <Flame size={24} color="#10B981" />,
        label: t("meals.calories") || "Calories",
      },
      {
        type: "protein",
        current: dailyGoals.protein,
        target: dailyGoals.targetProtein,
        unit: "g",
        color: "#059669",
        icon: <Zap size={24} color="#059669" />,
        label: t("meals.protein") || "Protein",
      },
      {
        type: "water",
        current: optimisticWaterCups * 250,
        target: 2500,
        unit: "ml",
        color: "#06B6D4",
        icon: <Droplets size={24} color="#06B6D4" />,
        label: t("home.water") || "Water",
      },
    ],
    [dailyGoals, optimisticWaterCups, t]
  );

  // Calculate time-based progress
  const currentHour = new Date().getHours();
  // Time-based greeting function with icons
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) {
      // Morning: 5:00 AM - 11:59 AM
      return {
        text: t("greetings.morning"),
        icon: currentHour <= 7 ? Sunrise : Coffee,
        color: "#F59E0B", // Warm orange/yellow
        bgColor: "#FEF3C7", // Light yellow background
      };
    } else if (currentHour >= 12 && currentHour < 17) {
      // Afternoon: 12:00 PM - 4:59 PM
      return {
        text: t("greetings.afternoon"),
        icon: currentHour <= 13 ? Utensils : Sun,
        color: "#EAB308", // Bright yellow
        bgColor: "#FEF9C3", // Light yellow background
      };
    } else if (currentHour >= 17 && currentHour < 22) {
      // Evening: 5:00 PM - 9:59 PM
      return {
        text: t("greetings.evening"),
        icon: Sunset,
        color: "#F97316", // Orange
        bgColor: "#FED7AA", // Light orange background
      };
    } else {
      // Night: 10:00 PM - 4:59 AM
      return {
        text: t("greetings.night"),
        icon: Moon,
        color: "#6366F1", // Indigo/purple
        bgColor: "#E0E7FF", // Light indigo background
      };
    }
  };
  const GreetingWithIcon = () => {
    const greeting = getTimeBasedGreeting();
    const IconComponent = greeting.icon;

    return (
      <View style={styles.textColumn}>
        <View style={styles.welcomeContainer}>
          <View
            style={[styles.greetingRow, { backgroundColor: greeting.bgColor }]}
          >
            <IconComponent
              size={20}
              color={greeting.color}
              style={styles.greetingIcon}
            />
            <Text style={[styles.welcomeText, { color: greeting.color }]}>
              {greeting.text} {user?.name}
            </Text>
          </View>
        </View>
      </View>
    );
  };
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
        <View style={styles.gaugeCard}>
          <View style={styles.gaugeHeader}>
            <View
              style={[
                styles.gaugeIconContainer,
                { backgroundColor: goal.color + "15" },
              ]}
            >
              {goal.icon}
            </View>
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
              <View
                style={[
                  styles.gaugeProgressFill,
                  { width: `${percentage}%`, backgroundColor: goal.color },
                ]}
              />
            </View>
          </View>

          <View style={styles.gaugeFooter}>
            <Text style={styles.gaugeTarget}>
              Target: {goal.target.toLocaleString()}
              {goal.unit}
            </Text>
            {remaining > 0 ? (
              <Text style={[styles.gaugeRemaining, { color: goal.color }]}>
                {remaining.toLocaleString()}
                {goal.unit} remaining
              </Text>
            ) : (
              <View style={styles.completedContainer}>
                <Check size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // User Stats Render Function
  const renderUserStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Progress</Text>

      {userStatsError && (
        <View style={styles.statsErrorBanner}>
          <Text style={styles.statsErrorText}>{userStatsError}</Text>
        </View>
      )}

      <View style={styles.statsMainContainer}>
        <View style={styles.statsCard}>
          {userStatsLoading ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.statsLoadingText}>Loading stats...</Text>
            </View>
          ) : (
            <>
              {/* XP and Level Row */}
              <View style={styles.statsTopRow}>
                <View style={styles.statsXPContainer}>
                  <View style={styles.statsIconWrapper}>
                    <Star size={20} color="#FFD700" fill="#FFD700" />
                  </View>
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsLabel}>Total XP</Text>
                    <Text style={styles.statsValue}>
                      {user?.total_points || 0}
                    </Text>
                  </View>
                </View>
                <View style={styles.statsLevelContainer}>
                  <View style={styles.statsIconWrapper}>
                    <Trophy size={20} color="#FFD700" fill="#FFD700" />
                  </View>
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsLabel}>Level</Text>
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
                    <Flame size={18} color="#FF6B35" />
                  </View>
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsSmallLabel}>Streak</Text>
                    <Text style={styles.statsSmallValue}>
                      {user?.current_streak || 0} days
                    </Text>
                  </View>
                </View>

                <View style={styles.statsItem}>
                  <View style={styles.statsIconWrapper}>
                    <Calendar size={18} color="#9B59B6" />
                  </View>
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsSmallLabel}>Best</Text>
                    <Text style={styles.statsSmallValue}>
                      {user?.best_streak || 0} days
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
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

  // Get current date formatted
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return now.toLocaleDateString("en-US", options);
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
              colors={["#10B981"]}
              tintColor="#10B981"
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.profileContainer}>
                <Image
                  source={{
                    uri:
                      user?.avatar_url ||
                      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1",
                  }}
                  style={styles.profileImage}
                  onError={(error) => {
                    console.warn("Avatar image failed to load:", error);
                  }}
                />
                <View style={styles.onlineIndicator} />
              </View>
            </View>
            <View style={styles.headerCenter}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{getCurrentDate()}</Text>
              </View>
            </View>
          </View>
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <GreetingWithIcon />
          </View>

          {/* Main Circular Progress - Calories */}
          <CircularCaloriesProgress
            calories={dailyGoals.calories}
            targetCalories={dailyGoals.targetCalories}
            dailyGoals={dailyGoals}
            size={200}
          />
          {/* User Stats */}
          {renderUserStats()}

          {/* Goal Progress Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Goals</Text>
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
            <Text style={styles.sectionTitle}>Daily Water Intake</Text>
            <View style={styles.waterTrackingContainer}>
              <View style={styles.waterCard}>
                <View style={styles.waterTrackingHeader}>
                  <View style={styles.waterIconContainer}>
                    <Droplets size={24} color="#06B6D4" />
                  </View>
                  <View style={styles.waterInfo}>
                    <Text style={styles.waterTrackingTitle}>Water Goal</Text>
                    <Text style={styles.waterTrackingValue}>
                      {optimisticWaterCups} / 10 cups
                    </Text>
                    <Text style={styles.waterTrackingTarget}>
                      {(optimisticWaterCups * 250).toLocaleString()} ml / 2,500
                      ml
                    </Text>
                  </View>
                  <View style={styles.waterBadge}>
                    <Text style={styles.waterBadgeText}>
                      {optimisticWaterCups >= 10 ? "🏆" : "💧"}
                    </Text>
                  </View>
                </View>

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
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.waterProgressText}>
                    {Math.min((optimisticWaterCups / 10) * 100, 100).toFixed(0)}
                    %
                  </Text>
                </View>

                <View style={styles.waterControls}>
                  <TouchableOpacity
                    style={[
                      styles.waterButton,
                      { opacity: optimisticWaterCups <= 0 ? 0.4 : 1 },
                    ]}
                    onPress={decrementWater}
                    disabled={optimisticWaterCups <= 0}
                    activeOpacity={0.7}
                  >
                    <Minus size={20} color="#06B6D4" />
                  </TouchableOpacity>

                  <View style={styles.waterCupsDisplay}>
                    <Text style={styles.waterCupsText}>
                      {optimisticWaterCups} cups
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.waterButton,
                      { opacity: optimisticWaterCups >= 10 ? 0.4 : 1 },
                    ]}
                    onPress={incrementWater}
                    disabled={optimisticWaterCups >= 10}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color="#06B6D4" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/camera")}
              >
                <View style={styles.quickActionContent}>
                  <View style={styles.quickActionIconContainer}>
                    <Camera size={24} color="#10B981" />
                  </View>
                  <Text style={styles.quickActionText}>Add Meal</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/food-scanner")}
              >
                <View style={styles.quickActionContent}>
                  <View style={styles.quickActionIconContainer}>
                    <Target size={24} color="#10B981" />
                  </View>
                  <Text style={styles.quickActionText}>Scan Food</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/statistics")}
              >
                <View style={styles.quickActionContent}>
                  <View style={styles.quickActionIconContainer}>
                    <BarChart3 size={24} color="#10B981" />
                  </View>
                  <Text style={styles.quickActionText}>Statistics</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Meal Section */}
          <View style={styles.section}>
            <View style={styles.mealSectionHeader}>
              <Text style={styles.sectionTitle}>Today's Meals</Text>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => router.push("/(tabs)/history")}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mealsContainer}>
              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#10B981"
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
                          <Target size={24} color="#10B981" />
                        </View>
                      )}
                    </View>
                    <View style={styles.mealInfo}>
                      <View style={styles.mealDetails}>
                        <Text style={styles.mealName} numberOfLines={1}>
                          {meal.name || "Unknown Meal"}
                        </Text>
                        {meal.created_at && (
                          <Text style={styles.mealTime}>
                            {formatTime(meal.created_at)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.mealCaloriesContainer}>
                        <Text style={styles.mealCalories}>
                          {meal.calories || 0} kcal
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chevronContainer}>
                      <ChevronRight size={16} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Target size={48} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyText}>No meals today</Text>
                  <Text style={styles.emptySubtext}>
                    Add your first meal to get started
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={() => router.push("/(tabs)/camera")}
                  >
                    <Plus size={20} color="#FFFFFF" />
                    <Text style={styles.emptyActionText}>Add Meal</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Spacing for Navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 100,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileContainer: {
    position: "relative",
    marginRight: 12,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }, // Text column container
  textColumn: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: "center",
    alignItems: "center", // Centers the entire content
  },

  // Welcome container
  welcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  // Greeting row with icon and text
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 8,
    alignSelf: "center",
    minWidth: 180,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Icon styling
  greetingIcon: {
    marginRight: 10,
    marginLeft: 2,
  },

  // Welcome text styling
  welcomeText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "capitalize", // Better than uppercase for readability
  },

  // User name styling (if you want to add it)
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 28,
    letterSpacing: -0.5,
    textAlign: "center",
    writingDirection: "auto", // Supports RTL for Hebrew
    marginTop: 4,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  welcomeTextContainer: {
    flex: 1,
  },
  compactGreetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    alignSelf: "center",
  },

  compactIcon: {
    marginRight: 6,
  },

  compactGreetingText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    opacity: 0.9,
    textAlign: "center",
  },
  dateContainer: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  menuButton: {
    width: 40,
    height: 40,
    backgroundColor: "#10B981",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // Greeting Section
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  greetingSubtext: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 22,
  },

  // Main Progress Section
  mainProgressSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  circularProgressContainer: {
    alignItems: "center",
  },
  circularProgressBackground: {
    width: 280,
    height: 280,
    backgroundColor: "#F0FDF4",
    borderRadius: 140,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  circularProgress: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  progressRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 16,
    borderColor: "#E5E7EB",
    borderTopColor: "#10B981",
    borderRightColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  progressLabel: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  progressValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 52,
  },
  progressUnit: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  progressTarget: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "400",
  },

  // Statistics Row
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  statPercentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },

  // User Stats Card
  statsMainContainer: {
    marginBottom: 8,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statsLoadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  statsLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  statsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statsXPContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statsLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  statsIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  statsDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  statsBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statsSmallLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  statsSmallValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statsErrorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsErrorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },

  // Goal Gauges
  goalGaugesContainer: {
    gap: 16,
  },
  goalGaugeWrapper: {
    marginBottom: 8,
  },
  gaugeContainer: {
    width: "100%",
  },
  gaugeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  gaugeInfo: {
    flex: 1,
  },
  gaugeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  gaugeCurrent: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  gaugePercentage: {
    alignItems: "flex-end",
  },
  gaugePercentageText: {
    fontSize: 18,
    fontWeight: "700",
  },
  gaugeProgressContainer: {
    marginBottom: 12,
  },
  gaugeProgressBg: {
    height: 8,
    backgroundColor: "#F3F4F6",
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
    color: "#6B7280",
    fontWeight: "500",
  },
  gaugeRemaining: {
    fontSize: 14,
    fontWeight: "600",
  },
  completedContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  completedText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
    marginLeft: 4,
  },

  // Water Tracking
  waterTrackingContainer: {
    marginBottom: 8,
  },
  waterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  waterTrackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  waterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  waterInfo: {
    flex: 1,
  },
  waterTrackingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  waterTrackingValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  waterTrackingTarget: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  waterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  waterBadgeText: {
    fontSize: 16,
  },
  waterProgress: {
    marginBottom: 16,
  },
  waterProgressBg: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  waterProgressFill: {
    height: "100%",
    backgroundColor: "#06B6D4",
    borderRadius: 4,
  },
  waterProgressText: {
    fontSize: 14,
    color: "#06B6D4",
    fontWeight: "600",
    textAlign: "center",
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#06B6D4",
  },
  waterCupsDisplay: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 20,
  },
  waterCupsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  quickActionContent: {
    padding: 20,
    alignItems: "center",
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },

  // Meal Section
  mealSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewButton: {
    backgroundColor: "#064E3B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  mealImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
  },
  mealImage: {
    width: "100%",
    height: "100%",
  },
  mealPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  mealInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealDetails: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  mealCaloriesContainer: {
    marginRight: 12,
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  chevronContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Bottom Navigation
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#064E3B",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navIcon: {
    width: 24,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
  },
  navIconActive: {
    backgroundColor: "#FFFFFF",
  },
  bottomSpacing: {
    height: 20,
  },

  // Loading and Error States
  loader: {
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Droplets,
  Zap,
  Shield,
  Leaf,
  Calendar,
  Target,
  Flame,
  Apple,
  Wheat,
  Fish,
  Sparkles,
  Scale,
  Award,
  Trophy,
  Star,
  Crown,
  X,
  Medal,
  Waves,
  Mountain,
  Sunrise,
  Moon,
  Dumbbell,
  Gem,
  DumbbellIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { api } from "@/src/services/api";
import LoadingScreen from "@/components/LoadingScreen";
import { StatisticsData } from "@/src/store/calendarSlice";
import {
  UserQuestionnaire,
  NutritionMetric,
  ProgressData,
  Achievement,
  TimeFilter,
} from "@/src/types/statistics";

const { width } = Dimensions.get("window");

// Helper function to get the appropriate Lucide icon component
const getAchievementIcon = (
  iconName: string,
  size: number = 20,
  color: string = "#16A085"
) => {
  const iconProps = { size, color };

  switch (iconName) {
    case "target":
      return <Target {...iconProps} />;
    case "sparkles":
      return <Sparkles {...iconProps} />;
    case "star":
      return <Star {...iconProps} />;
    case "medal":
      return <Medal {...iconProps} />;
    case "trophy":
      return <Trophy {...iconProps} />;
    case "crown":
      return <Crown {...iconProps} />;
    case "droplets":
      return <Droplets {...iconProps} />;
    case "waves":
      return <Waves {...iconProps} />;
    case "droplet":
      return <Droplets {...iconProps} />;
    case "mountain-snow":
      return <Mountain {...iconProps} />;
    case "flame":
      return <Flame {...iconProps} />;
    case "calendar":
      return <Calendar {...iconProps} />;
    case "muscle":
      return <DumbbellIcon {...iconProps} />;
    case "sunrise":
      return <Sunrise {...iconProps} />;
    case "moon":
      return <Moon {...iconProps} />;
    case "bar-chart-3":
      return <BarChart3 {...iconProps} />;
    case "apple":
      return <Apple {...iconProps} />;
    case "dumbbell":
      return <Dumbbell {...iconProps} />;
    case "scale":
      return <Scale {...iconProps} />;
    case "wheat":
      return <Wheat {...iconProps} />;
    case "gem":
      return <Gem {...iconProps} />;
    case "zap":
      return <Zap {...iconProps} />;
    case "award":
    default:
      return <Award {...iconProps} />;
  }
};

// Helper functions for achievement styling
const getAchievementBackgroundColor = (rarity: string, unlocked: boolean) => {
  if (!unlocked) return "#FFFFFF";

  switch (rarity.toUpperCase()) {
    case "LEGENDARY":
      return "#FFFBEB"; // Very light gold
    case "EPIC":
      return "#F9F5FF"; // Very light purple
    case "RARE":
      return "#F0F9FF"; // Very light blue
    case "UNCOMMON":
      return "#FFF7ED"; // Very light orange
    case "COMMON":
    default:
      return "#F0FDF4"; // Very light green
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case "LEGENDARY":
      return "#F59E0B";
    case "EPIC":
      return "#8B5CF6";
    case "RARE":
      return "#3B82F6";
    case "UNCOMMON":
      return "#F97316";
    case "COMMON":
    default:
      return "#10B981";
  }
};

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === "he";
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("week");
  const [showAlerts, setShowAlerts] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(
    null
  );
  const [userQuestionnaire, setUserQuestionnaire] =
    useState<UserQuestionnaire | null>(null);

  // Fetch statistics data from API
  const fetchStatistics = async (period: "today" | "week" | "month") => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📊 Fetching statistics for period: ${period}`);
      const [statisticsResponse, questionnaireResponse] = await Promise.all([
        api.get(`/statistics?period=${period}`),
        api.get("/questionnaire"),
      ]);

      console.log("📊 Raw statistics response:", statisticsResponse.data);

      if (statisticsResponse.data.success && statisticsResponse.data.data) {
        setStatisticsData(statisticsResponse.data.data);
        console.log(
          `✅ Statistics loaded successfully:`,
          statisticsResponse.data.data
        );
      } else {
        console.warn("⚠️ Statistics response unsuccessful or no data");
        setError(
          statisticsResponse.data.message || "No statistics data available"
        );
      }

      // Set user questionnaire for meal requirements
      if (
        questionnaireResponse.data.success &&
        questionnaireResponse.data.data
      ) {
        const qData = questionnaireResponse.data.data;
        // Fix the meals_per_day parsing issue
        let mealsPerDay = 3; // default
        if (qData.meals_per_day) {
          const cleanedMeals = qData.meals_per_day
            .toString()
            .replace(/[^0-9]/g, "");
          mealsPerDay = parseInt(cleanedMeals) || 3;
        }

        setUserQuestionnaire({
          mealsPerDay,
          dailyCalories: qData.daily_calories || 2000,
          dailyProtein: qData.daily_protein || 120,
          dailyCarbs: qData.daily_carbs || 250,
          dailyFats: qData.daily_fats || 70,
          dailyFiber: qData.daily_fiber || 25,
          dailyWater: qData.daily_water || 2500,
        });
      }
    } catch (err: any) {
      console.error("❌ Error fetching statistics:", err);
      setError(err.response?.data?.message || "Failed to load statistics data");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchStatistics(selectedPeriod);
  }, [selectedPeriod]);

  // Generate nutrition data from real API response
  const generateNutritionMetrics = (): NutritionMetric[] => {
    if (!statisticsData || !userQuestionnaire) {
      console.warn(
        "⚠️ No statistics data or questionnaire available for metrics generation"
      );
      return [];
    }

    console.log("📊 Generating nutrition metrics from data:", statisticsData);

    const calculateTrend = (
      current: number,
      target: number
    ): "up" | "down" | "stable" => {
      const ratio = current / target;
      if (ratio > 1.1) return "up";
      if (ratio < 0.9) return "down";
      return "stable";
    };

    const calculateWeeklyChange = (
      current: number,
      previous: number
    ): number => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const baseData = [
      {
        id: "calories",
        name: t("statistics.total_calories"),
        nameEn: "Total Calories",
        value: statisticsData.averageCalories || 0,
        target: userQuestionnaire.dailyCalories,
        unit: t("statistics.kcal"),
        icon: <Flame size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "macros" as const,
        description:
          language === "he"
            ? "צריכת קלוריות יומית כוללת"
            : "Total daily calorie intake",
        trend: calculateTrend(
          statisticsData.averageCalories || 0,
          userQuestionnaire.dailyCalories
        ),
        weeklyAverage: statisticsData.averageCalories || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageCalories || 0,
          statisticsData.averageCalories || 0
        ),
      },
      {
        id: "protein",
        name: t("statistics.protein"),
        nameEn: "Protein",
        value: statisticsData.averageProtein || 0,
        target: userQuestionnaire.dailyProtein,
        unit: t("statistics.g"),
        icon: <Zap size={20} color="#9B59B6" />,
        color: "#9B59B6",
        category: "macros" as const,
        description:
          language === "he"
            ? "חלבון לבניית שרירים ותיקון רקמות"
            : "Protein for muscle building and tissue repair",
        trend: calculateTrend(
          statisticsData.averageProtein || 0,
          userQuestionnaire.dailyProtein
        ),
        weeklyAverage: statisticsData.averageProtein || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageProtein || 0,
          statisticsData.averageProtein || 0
        ),
      },
      {
        id: "carbs",
        name: t("statistics.carbohydrates"),
        nameEn: "Carbohydrates",
        value: statisticsData.averageCarbs || 0,
        target: userQuestionnaire.dailyCarbs,
        unit: t("statistics.g"),
        icon: <Wheat size={20} color="#F39C12" />,
        color: "#F39C12",
        category: "macros" as const,
        description:
          language === "he"
            ? "פחמימות לאנרגיה ותפקוד המוח"
            : "Carbohydrates for energy and brain function",
        trend: calculateTrend(
          statisticsData.averageCarbs || 0,
          userQuestionnaire.dailyCarbs
        ),
        weeklyAverage: statisticsData.averageCarbs || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageCarbs || 0,
          statisticsData.averageCarbs || 0
        ),
      },
      {
        id: "fats",
        name: t("statistics.fats"),
        nameEn: "Fats",
        value: statisticsData.averageFats || 0,
        target: userQuestionnaire.dailyFats,
        unit: t("statistics.g"),
        icon: <Fish size={20} color="#16A085" />,
        color: "#16A085",
        category: "macros" as const,
        description:
          language === "he"
            ? "שומנים בריאים לתפקוד הורמונלי"
            : "Healthy fats for hormonal function",
        trend: calculateTrend(
          statisticsData.averageFats || 0,
          userQuestionnaire.dailyFats
        ),
        weeklyAverage: statisticsData.averageFats || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageFats || 0,
          statisticsData.averageFats || 0
        ),
      },
      {
        id: "fiber",
        name: t("statistics.fiber"),
        nameEn: "Fiber",
        value: statisticsData.averageFiber || 0,
        target: userQuestionnaire.dailyFiber,
        unit: t("statistics.g"),
        icon: <Leaf size={20} color="#27AE60" />,
        color: "#27AE60",
        category: "micros" as const,
        description:
          language === "he"
            ? "סיבים תזונתיים לבריאות העיכול"
            : "Dietary fiber for digestive health",
        recommendation: t("statistics.increaseIntake"),
        trend: calculateTrend(
          statisticsData.averageFiber || 0,
          userQuestionnaire.dailyFiber
        ),
        weeklyAverage: statisticsData.averageFiber || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageFiber || 0,
          statisticsData.averageFiber || 0
        ),
      },
      {
        id: "sugars",
        name: t("statistics.sugars"),
        nameEn: "Sugars",
        value: statisticsData.averageSugar || 0,
        target: 50,
        maxTarget: 50,
        unit: t("statistics.g"),
        icon: <Apple size={20} color="#E67E22" />,
        color: "#E67E22",
        category: "micros" as const,
        description:
          language === "he"
            ? "סוכרים פשוטים - מומלץ להגביל"
            : "Simple sugars - recommended to limit",
        recommendation: t("statistics.decreaseIntake"),
        trend: calculateTrend(statisticsData.averageSugar || 0, 50),
        weeklyAverage: statisticsData.averageSugar || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageSugar || 0,
          statisticsData.averageSugar || 0
        ),
      },
      {
        id: "sodium",
        name: t("statistics.sodium"),
        nameEn: "Sodium",
        value: statisticsData.averageSodium || 0,
        target: 2300,
        maxTarget: 2300,
        unit: t("statistics.mg"),
        icon: <Shield size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "micros" as const,
        description:
          language === "he"
            ? "נתרן - חשוב להגביל למניעת יתר לחץ דם"
            : "Sodium - important to limit to prevent hypertension",
        recommendation: t("statistics.decreaseIntake"),
        trend: calculateTrend(statisticsData.averageSodium || 0, 2300),
        weeklyAverage: statisticsData.averageSodium || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageSodium || 0,
          statisticsData.averageSodium || 0
        ),
      },
      {
        id: "hydration",
        name: t("statistics.hydration"),
        nameEn: "Hydration",
        value: statisticsData.averageFluids || 0,
        target: userQuestionnaire.dailyWater,
        unit: t("statistics.ml"),
        icon: <Droplets size={20} color="#3498DB" />,
        color: "#3498DB",
        category: "lifestyle" as const,
        description:
          language === "he" ? "רמת הידרציה יומית" : "Daily hydration level",
        recommendation: t("statistics.increaseIntake"),
        trend: calculateTrend(
          statisticsData.averageFluids || 0,
          userQuestionnaire.dailyWater
        ),
        weeklyAverage: statisticsData.averageFluids || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageFluids || 0,
          statisticsData.averageFluids || 0
        ),
      },
    ];

    return baseData.map((metric) => {
      const percentage = metric.maxTarget
        ? Math.min((metric.target / Math.max(metric.value, 1)) * 100, 100)
        : Math.min((metric.value / Math.max(metric.target, 1)) * 100, 100);

      let status: "excellent" | "good" | "warning" | "danger";

      if (metric.maxTarget) {
        if (metric.value <= metric.target * 0.8) status = "excellent";
        else if (metric.value <= metric.target) status = "good";
        else if (metric.value <= metric.target * 1.2) status = "warning";
        else status = "danger";
      } else {
        if (percentage >= 100) status = "excellent";
        else if (percentage >= 80) status = "good";
        else if (percentage >= 60) status = "warning";
        else status = "danger";
      }

      return {
        ...metric,
        percentage: Math.round(percentage),
        status,
      };
    });
  };

  // Generate weekly progress data with meal completion tracking
  const generateWeeklyData = (): ProgressData[] => {
    if (
      !statisticsData?.dailyBreakdown ||
      statisticsData.dailyBreakdown.length === 0 ||
      !userQuestionnaire
    ) {
      return [];
    }

    return statisticsData.dailyBreakdown.map((day: any) => ({
      date: day.date,
      calories: day.calories || 0,
      protein: day.protein_g || 0,
      carbs: day.carbs_g || 0,
      fats: day.fats_g || 0,
      water: day.liquids_ml || 0,
      weight: day.weight_kg,
      mood: (day.mood as "happy" | "neutral" | "sad") || "neutral",
      energy: (day.energy as "high" | "medium" | "low") || "medium",
      satiety:
        (day.satiety as "very_full" | "satisfied" | "hungry") || "satisfied",
      mealQuality: day.meal_quality || 3,
      mealsCount: day.meals_count || 0,
      requiredMeals: userQuestionnaire.mealsPerDay,
    }));
  };

  // Check if user has completed daily meals for warnings
  const shouldShowWarnings = (): boolean => {
    if (!userQuestionnaire) return false;

    const weeklyData = generateWeeklyData();
    const today = new Date().toISOString().split("T")[0];
    const todayData = weeklyData.find((day) => day.date === today);

    return todayData ? todayData.mealsCount >= todayData.requiredMeals : false;
  };

  // Generate achievements from real API data
  const generateAchievements = (): Achievement[] => {
    if (!statisticsData?.achievements) return [];

    return statisticsData.achievements.map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title || { en: "Achievement", he: "הישג" },
      description: achievement.description || {
        en: "Description",
        he: "תיאור",
      },
      icon: achievement.icon || "trophy",
      color: getRarityColor(achievement.rarity || "COMMON"),
      progress: achievement.progress || 0,
      maxProgress: achievement.max_progress || 1,
      unlocked: achievement.unlocked || false,
      category: achievement.category || "MILESTONE",
      xpReward: achievement.xpReward || 0,
      rarity: achievement.rarity || "COMMON",
      unlockedDate: achievement.unlockedDate,
    }));
  };

  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Update metrics when data changes
  useEffect(() => {
    if (statisticsData && userQuestionnaire) {
      setMetrics(generateNutritionMetrics());
      setWeeklyData(generateWeeklyData());
      setAchievements(generateAchievements());
    }
  }, [statisticsData, userQuestionnaire]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStatistics(selectedPeriod);
    } finally {
      setRefreshing(false);
    }
  };

  const timeFilters: TimeFilter[] = [
    { key: "today", label: t("statistics.today") },
    { key: "week", label: t("statistics.week") },
    { key: "month", label: t("statistics.month") },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "#2ECC71";
      case "good":
        return "#F39C12";
      case "warning":
        return "#E67E22";
      case "danger":
        return "#E74C3C";
      default:
        return "#95A5A6";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle size={16} color="#2ECC71" />;
      case "good":
        return <CheckCircle size={16} color="#F39C12" />;
      case "warning":
        return <AlertTriangle size={16} color="#E67E22" />;
      case "danger":
        return <AlertTriangle size={16} color="#E74C3C" />;
      default:
        return <CheckCircle size={16} color="#95A5A6" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={14} color="#2ECC71" />;
      case "down":
        return <TrendingDown size={14} color="#E74C3C" />;
      default:
        return <Target size={14} color="#95A5A6" />;
    }
  };

  const getAlertsData = () => {
    if (!shouldShowWarnings()) {
      return [];
    }

    return metrics
      .filter(
        (metric) => metric.status === "danger" || metric.status === "warning"
      )
      .map((metric) => ({
        id: metric.id,
        title: metric.name,
        message:
          metric.recommendation ||
          (metric.status === "danger"
            ? t("statistics.consultDoctor")
            : t("statistics.maintainLevel")),
        severity: metric.status,
        icon: metric.icon,
      }));
  };

  // Calculate progress statistics
  const calculateProgressStats = () => {
    if (!statisticsData) {
      return {
        totalDays: 0,
        successfulDays: 0,
        averageCompletion: 0,
        bestStreak: 0,
        currentStreak: 0,
        averages: { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 },
      };
    }

    const averages = {
      calories: Math.round(statisticsData.averageCalories || 0),
      protein: Math.round(statisticsData.averageProtein || 0),
      carbs: Math.round(statisticsData.averageCarbs || 0),
      fats: Math.round(statisticsData.averageFats || 0),
      water: Math.round(statisticsData.averageFluids || 0),
    };

    return {
      totalDays: statisticsData.totalDays || 0,
      successfulDays: statisticsData.successfulDays || 0,
      averageCompletion: Math.round(statisticsData.averageCompletion || 0),
      bestStreak: statisticsData.bestStreak || 0,
      currentStreak: statisticsData.currentStreak || 0,
      averages,
    };
  };

  // Calculate gamification stats from real data
  const calculateGamificationStats = () => {
    if (!statisticsData) {
      return {
        level: 1,
        currentXP: 0,
        nextLevelXP: 1000,
        totalPoints: 0,
        dailyStreak: 0,
        weeklyStreak: 0,
        perfectDays: 0,
        xpToNext: 1000,
        xpProgress: 0,
      };
    }

    const totalPoints = statisticsData.totalPoints || 0;
    // Use the same level calculation as the server: level starts at 1, every 1000 XP = 1 level
    const level = Math.max(1, Math.floor(totalPoints / 1000) + 1);
    const currentXP = totalPoints % 1000;
    const nextLevelXP = 1000;
    const dailyStreak = statisticsData.currentStreak || 0;
    const weeklyStreak = statisticsData.weeklyStreak || 0;
    const perfectDays = statisticsData.perfectDays || 0;

    return {
      level,
      currentXP,
      nextLevelXP,
      totalPoints,
      dailyStreak,
      weeklyStreak,
      perfectDays,
      xpToNext: nextLevelXP - currentXP,
      xpProgress: (currentXP / nextLevelXP) * 100,
    };
  };

  const categorizedMetrics = {
    macros: metrics.filter((m) => m.category === "macros"),
    micros: metrics.filter((m) => m.category === "micros"),
    lifestyle: metrics.filter((m) => m.category === "lifestyle"),
  };

  const progressStats = calculateProgressStats();
  const gamificationStats = calculateGamificationStats();

  const renderMetricCard = (metric: NutritionMetric) => (
    <TouchableOpacity
      key={metric.id}
      style={styles.metricCard}
      onPress={() => Alert.alert(metric.name, metric.description)}
    >
      <View style={styles.metricCardContent}>
        <View style={styles.metricHeader}>
          <View style={styles.metricIconContainer}>{metric.icon}</View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricName}>{metric.name}</Text>
            <View style={styles.metricStatus}>
              {getStatusIcon(metric.status)}
              <Text
                style={[
                  styles.metricStatusText,
                  { color: getStatusColor(metric.status) },
                ]}
              >
                {metric.status}
              </Text>
            </View>
          </View>
          <View style={styles.metricTrend}>
            {getTrendIcon(metric.trend)}
            <Text style={styles.metricTrendText}>
              {metric.lastWeekChange > 0 ? "+" : ""}
              {metric.lastWeekChange.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.metricValues}>
          <View style={styles.metricCurrentValue}>
            <Text style={styles.metricValueText}>
              {metric.value.toLocaleString()} {metric.unit}
            </Text>
            <Text style={styles.metricTargetText}>
              {language === "he" ? "יעד" : "Target"}:{" "}
              {metric.target.toLocaleString()} {metric.unit}
            </Text>
          </View>
          <View style={styles.metricPercentage}>
            <Text
              style={[styles.metricPercentageText, { color: metric.color }]}
            >
              {metric.percentage}%
            </Text>
          </View>
        </View>

        <View style={styles.metricProgress}>
          <View style={styles.metricProgressBg}>
            <View
              style={[
                styles.metricProgressFill,
                {
                  width: `${Math.min(metric.percentage, 100)}%`,
                  backgroundColor: metric.color,
                },
              ]}
            />
          </View>
        </View>

        {metric.recommendation && shouldShowWarnings() && (
          <View style={styles.metricRecommendation}>
            <Sparkles size={12} color={metric.color} />
            <Text style={styles.metricRecommendationText}>
              {metric.recommendation}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const alerts = getAlertsData();

  // Loading state
  if (isLoading) {
    return (
      <LoadingScreen
        text={isRTL ? "טוען סטיסטיקות..." : "Loading your statistics..."}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{t("statistics.error_message")}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>
              {t("statistics.retry_button")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Meal completion status component
  const renderMealCompletionStatus = () => {
    const weeklyData = generateWeeklyData();
    const today = new Date().toISOString().split("T")[0];
    const todayData = weeklyData.find((day) => day.date === today);

    if (!todayData || !userQuestionnaire) return null;

    const isCompleted = todayData.mealsCount >= todayData.requiredMeals;

    return (
      <View style={styles.mealCompletionCard}>
        <View style={styles.mealCompletionHeader}>
          <View style={styles.mealCompletionIcon}>
            {isCompleted ? (
              <CheckCircle size={24} color="#2ECC71" />
            ) : (
              <Clock size={24} color="#E67E22" />
            )}
          </View>
          <Text style={styles.mealCompletionTitle}>
            {t("statistics.meals_completed")}
          </Text>
        </View>
        <Text style={styles.mealCompletionText}>
          {todayData.mealsCount} {t("statistics.of")} {todayData.requiredMeals}
        </Text>
        {!isCompleted && (
          <Text style={styles.mealCompletionMessage}>
            {t("statistics.complete_meals_first")}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#16A085"]}
            tintColor="#16A085"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t("statistics.title")}</Text>
            <Text style={styles.subtitle}>{t("statistics.subtitle")}</Text>
          </View>
        </View>

        {/* Time Filter */}
        <View style={styles.timeFilterContainer}>
          <View style={styles.timeFilter}>
            {timeFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.timeFilterButton,
                  selectedPeriod === filter.key &&
                    styles.timeFilterButtonActive,
                ]}
                onPress={() => setSelectedPeriod(filter.key)}
              >
                {selectedPeriod === filter.key ? (
                  <LinearGradient
                    colors={["#16A085", "#1ABC9C"]}
                    style={styles.timeFilterGradient}
                  >
                    <Text style={styles.timeFilterTextActive}>
                      {filter.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.timeFilterText}>{filter.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* No Data Message */}
        {!statisticsData && !isLoading && (
          <View style={styles.noDataContainer}>
            <BarChart3 size={64} color="#BDC3C7" />
            <Text style={styles.noDataText}>
              {t("statistics.noDataMessage")}
            </Text>
          </View>
        )}

        {/* Main Content */}
        {statisticsData && (
          <>
            {/* Meal Completion Status */}
            {renderMealCompletionStatus()}

            {/* Gamification Dashboard */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.gamification")}
              </Text>
              <View style={styles.gamificationContainer}>
                <View style={styles.levelContainer}>
                  <View style={styles.levelInfo}>
                    <View style={styles.levelIcon}>
                      <Crown size={32} color="#F39C12" />
                    </View>
                    <View style={styles.levelDetails}>
                      <Text style={styles.levelText}>
                        {t("statistics.level")} {gamificationStats.level}
                      </Text>
                      <Text style={styles.xpText}>
                        {gamificationStats.currentXP} /{" "}
                        {gamificationStats.nextLevelXP} {t("statistics.xp")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.xpProgress}>
                    <View style={styles.xpProgressBg}>
                      <View
                        style={[
                          styles.xpProgressFill,
                          { width: `${gamificationStats.xpProgress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.xpToNext}>
                      {gamificationStats.xpToNext} {t("statistics.next_level")}
                    </Text>
                  </View>
                </View>

                <View style={styles.gamificationStats}>
                  <View style={styles.gamificationStatItem}>
                    <Flame size={20} color="#E74C3C" />
                    <Text style={styles.gamificationStatValue}>
                      {gamificationStats.dailyStreak}
                    </Text>
                    <Text style={styles.gamificationStatLabel}>
                      {t("statistics.daily_streak")}
                    </Text>
                  </View>
                  <View style={styles.gamificationStatItem}>
                    <Calendar size={20} color="#3498DB" />
                    <Text style={styles.gamificationStatValue}>
                      {gamificationStats.weeklyStreak}
                    </Text>
                    <Text style={styles.gamificationStatLabel}>
                      {t("statistics.weekly_streak")}
                    </Text>
                  </View>
                  <View style={styles.gamificationStatItem}>
                    <Star size={20} color="#F39C12" />
                    <Text style={styles.gamificationStatValue}>
                      {gamificationStats.perfectDays}
                    </Text>
                    <Text style={styles.gamificationStatLabel}>
                      {t("statistics.perfect_days")}
                    </Text>
                  </View>
                  <View style={styles.gamificationStatItem}>
                    <Trophy size={20} color="#16A085" />
                    <Text style={styles.gamificationStatValue}>
                      {gamificationStats.totalPoints.toLocaleString()}
                    </Text>
                    <Text style={styles.gamificationStatLabel}>
                      {t("statistics.total_points")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Enhanced Achievements Section */}
            <View style={styles.section}>
              <View style={styles.achievementsHeader}>
                <Text style={styles.sectionTitle}>
                  {t("statistics.achievements")}
                </Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAchievements(true)}
                >
                  <Text style={styles.viewAllText}>
                    {t("statistics.view_all_achievements")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.achievementsContainer}>
                {achievements.slice(0, 3).map((achievement) => (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      {
                        backgroundColor: getAchievementBackgroundColor(
                          achievement.rarity,
                          achievement.unlocked
                        ),
                        borderWidth: 1,
                        borderColor: achievement.unlocked
                          ? `${achievement.color}30`
                          : "#E5E7EB",
                      },
                    ]}
                  >
                    <View style={styles.achievementContent}>
                      <View
                        style={[
                          styles.achievementIconContainer,
                          {
                            backgroundColor: achievement.unlocked
                              ? `${achievement.color}20`
                              : "#F3F4F6",
                          },
                        ]}
                      >
                        {getAchievementIcon(
                          achievement.icon,
                          28,
                          achievement.unlocked ? achievement.color : "#9CA3AF"
                        )}
                      </View>

                      <View style={styles.achievementDetails}>
                        <View style={styles.achievementHeader}>
                          <Text
                            style={[
                              styles.achievementTitle,
                              {
                                color: achievement.unlocked
                                  ? "#111827"
                                  : "#6B7280",
                              },
                            ]}
                          >
                            {typeof achievement.title === "object"
                              ? achievement.title.en
                              : achievement.title}
                          </Text>
                          <View
                            style={[
                              styles.rarityBadge,
                              {
                                backgroundColor: achievement.unlocked
                                  ? `${achievement.color}20`
                                  : "#F3F4F6",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.rarityText,
                                {
                                  color: achievement.unlocked
                                    ? achievement.color
                                    : "#6B7280",
                                },
                              ]}
                            >
                              {achievement.rarity}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.achievementDescription,
                            {
                              color: achievement.unlocked
                                ? "#374151"
                                : "#9CA3AF",
                            },
                          ]}
                        >
                          {typeof achievement.description === "object"
                            ? achievement.description.en
                            : achievement.description}
                        </Text>

                        <View style={styles.achievementProgress}>
                          <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarBg}>
                              <View
                                style={[
                                  styles.progressBarFill,
                                  {
                                    width: `${
                                      achievement.unlocked
                                        ? 100
                                        : (achievement.progress /
                                            (achievement.maxProgress || 1)) *
                                          100
                                    }%`,
                                    backgroundColor: achievement.unlocked
                                      ? achievement.color
                                      : "#D1D5DB",
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.progressText}>
                              {achievement.progress}/
                              {achievement.maxProgress || 1}
                            </Text>
                          </View>

                          <View style={styles.xpRewardContainer}>
                            <Sparkles
                              size={16}
                              color={
                                achievement.unlocked
                                  ? achievement.color
                                  : "#9CA3AF"
                              }
                            />
                            <Text
                              style={[
                                styles.xpRewardText,
                                {
                                  color: achievement.unlocked
                                    ? achievement.color
                                    : "#9CA3AF",
                                },
                              ]}
                            >
                              +{achievement.xpReward} XP
                            </Text>
                          </View>
                        </View>
                      </View>

                      {achievement.unlocked && (
                        <View style={styles.unlockedBadge}>
                          <CheckCircle size={24} color={achievement.color} />
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Progress Overview with Real Data */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.progress_overview")}
              </Text>
              <View style={styles.progressOverviewContainer}>
                <View style={styles.progressStatsGrid}>
                  <View style={styles.progressStatItem}>
                    <View style={styles.progressStatIcon}>
                      <CheckCircle size={20} color="#2ECC71" />
                    </View>
                    <Text style={styles.progressStatValue}>
                      {progressStats.successfulDays}/{progressStats.totalDays}
                    </Text>
                    <Text style={styles.progressStatLabel}>
                      {t("statistics.successful_days")}
                    </Text>
                  </View>

                  <View style={styles.progressStatItem}>
                    <View style={styles.progressStatIcon}>
                      <Target size={20} color="#3498DB" />
                    </View>
                    <Text style={styles.progressStatValue}>
                      {progressStats.averageCompletion}%
                    </Text>
                    <Text style={styles.progressStatLabel}>
                      {t("statistics.average_completion")}
                    </Text>
                  </View>

                  <View style={styles.progressStatItem}>
                    <View style={styles.progressStatIcon}>
                      <Award size={20} color="#F39C12" />
                    </View>
                    <Text style={styles.progressStatValue}>
                      {progressStats.bestStreak}
                    </Text>
                    <Text style={styles.progressStatLabel}>
                      {t("statistics.best_streak")}
                    </Text>
                  </View>

                  <View style={styles.progressStatItem}>
                    <View style={styles.progressStatIcon}>
                      <Trophy size={20} color="#E74C3C" />
                    </View>
                    <Text style={styles.progressStatValue}>
                      {progressStats.currentStreak}
                    </Text>
                    <Text style={styles.progressStatLabel}>
                      {t("statistics.current_streak")}
                    </Text>
                  </View>
                </View>

                {/* Real nutrition averages */}
                <View style={styles.nutritionAverages}>
                  <Text style={styles.nutritionAveragesTitle}>
                    {language === "he"
                      ? "ממוצעים תזונתיים"
                      : "Nutrition Averages"}
                  </Text>
                  <View style={styles.nutritionAveragesGrid}>
                    <View style={styles.nutritionAverage}>
                      <Flame size={16} color="#E74C3C" />
                      <Text style={styles.nutritionAverageValue}>
                        {progressStats.averages.calories}
                      </Text>
                      <Text style={styles.nutritionAverageLabel}>
                        {t("statistics.kcal")}
                      </Text>
                    </View>
                    <View style={styles.nutritionAverage}>
                      <Zap size={16} color="#9B59B6" />
                      <Text style={styles.nutritionAverageValue}>
                        {progressStats.averages.protein}
                      </Text>
                      <Text style={styles.nutritionAverageLabel}>
                        {t("statistics.g")}
                      </Text>
                    </View>
                    <View style={styles.nutritionAverage}>
                      <Wheat size={16} color="#F39C12" />
                      <Text style={styles.nutritionAverageValue}>
                        {progressStats.averages.carbs}
                      </Text>
                      <Text style={styles.nutritionAverageLabel}>
                        {t("statistics.g")}
                      </Text>
                    </View>
                    <View style={styles.nutritionAverage}>
                      <Fish size={16} color="#16A085" />
                      <Text style={styles.nutritionAverageValue}>
                        {progressStats.averages.fats}
                      </Text>
                      <Text style={styles.nutritionAverageLabel}>
                        {t("statistics.g")}
                      </Text>
                    </View>
                    <View style={styles.nutritionAverage}>
                      <Droplets size={16} color="#3498DB" />
                      <Text style={styles.nutritionAverageValue}>
                        {progressStats.averages.water}
                      </Text>
                      <Text style={styles.nutritionAverageLabel}>
                        {t("statistics.ml")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Alerts Section - Only show when meals are completed */}
            {shouldShowWarnings() && alerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.alertsHeader}>
                  <Text style={styles.sectionTitle}>
                    {t("statistics.alertsTitle")}
                  </Text>
                  <TouchableOpacity
                    style={styles.hideAlertsButton}
                    onPress={() => setShowAlerts(false)}
                  >
                    <Text style={styles.hideAlertsText}>
                      {t("statistics.hideAlerts")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.alertsContainer}>
                  {alerts.map((alert) => (
                    <View key={alert.id} style={styles.alertCard}>
                      <View style={styles.alertContent}>
                        <View style={styles.alertIcon}>
                          <AlertTriangle
                            size={20}
                            color={
                              alert.severity === "danger"
                                ? "#E74C3C"
                                : "#E67E22"
                            }
                          />
                        </View>
                        <View style={styles.alertText}>
                          <Text style={styles.alertTitle}>{alert.title}</Text>
                          <Text style={styles.alertMessage}>
                            {alert.message}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Macronutrients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.macronutrients")}
              </Text>
              <View style={styles.metricsGrid}>
                {categorizedMetrics.macros.map(renderMetricCard)}
              </View>
            </View>

            {/* Micronutrients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.micronutrients")}
              </Text>
              <View style={styles.metricsGrid}>
                {categorizedMetrics.micros.map(renderMetricCard)}
              </View>
            </View>

            {/* Lifestyle Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.lifestyle")}
              </Text>
              <View style={styles.metricsGrid}>
                {categorizedMetrics.lifestyle.map(renderMetricCard)}
              </View>
            </View>
          </>
        )}

        {/* Achievements Modal */}
        <Modal
          visible={showAchievements}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAchievements(false)}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("statistics.achievements")}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: getAchievementBackgroundColor(
                        achievement.rarity,
                        achievement.unlocked
                      ),
                      borderWidth: 1,
                      borderColor: achievement.unlocked
                        ? `${achievement.color}30`
                        : "#E5E7EB",
                    },
                  ]}
                >
                  <View style={styles.achievementContent}>
                    <View
                      style={[
                        styles.achievementIconContainer,
                        {
                          backgroundColor: achievement.unlocked
                            ? `${achievement.color}20`
                            : "#F3F4F6",
                        },
                      ]}
                    >
                      {getAchievementIcon(
                        achievement.icon,
                        28,
                        achievement.unlocked ? achievement.color : "#9CA3AF"
                      )}
                    </View>

                    <View style={styles.achievementDetails}>
                      <View style={styles.achievementHeader}>
                        <Text
                          style={[
                            styles.achievementTitle,
                            {
                              color: achievement.unlocked
                                ? "#111827"
                                : "#6B7280",
                            },
                          ]}
                        >
                          {typeof achievement.title === "object"
                            ? achievement.title.en
                            : achievement.title}
                        </Text>
                        <View
                          style={[
                            styles.rarityBadge,
                            {
                              backgroundColor: achievement.unlocked
                                ? `${achievement.color}20`
                                : "#F3F4F6",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.rarityText,
                              {
                                color: achievement.unlocked
                                  ? achievement.color
                                  : "#6B7280",
                              },
                            ]}
                          >
                            {achievement.rarity}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.achievementDescription,
                          {
                            color: achievement.unlocked ? "#374151" : "#9CA3AF",
                          },
                        ]}
                      >
                        {typeof achievement.description === "object"
                          ? achievement.description.en
                          : achievement.description}
                      </Text>

                      <View style={styles.achievementProgress}>
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBg}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${
                                    (achievement.progress /
                                      (achievement.maxProgress || 1)) *
                                    100
                                  }%`,
                                  backgroundColor: achievement.unlocked
                                    ? achievement.color
                                    : "#D1D5DB",
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {achievement.progress}/
                            {achievement.maxProgress || 1}
                          </Text>
                        </View>

                        <View style={styles.xpRewardContainer}>
                          <Sparkles
                            size={16}
                            color={
                              achievement.unlocked
                                ? achievement.color
                                : "#9CA3AF"
                            }
                          />
                          <Text
                            style={[
                              styles.xpRewardText,
                              {
                                color: achievement.unlocked
                                  ? achievement.color
                                  : "#9CA3AF",
                              },
                            ]}
                          >
                            +{achievement.xpReward} XP
                          </Text>
                        </View>
                      </View>
                    </View>

                    {achievement.unlocked && (
                      <View style={styles.unlockedBadge}>
                        <CheckCircle size={24} color={achievement.color} />
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Header Styles
  header: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: 0.1,
  },

  // Enhanced Error & Loading States
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 24,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  errorText: {
    fontSize: 18,
    color: "#1E293B",
    textAlign: "center",
    marginVertical: 20,
    fontWeight: "600",
    lineHeight: 26,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 24,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  noDataText: {
    marginTop: 24,
    fontSize: 18,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 26,
  },

  // Enhanced Time Filter
  timeFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timeFilter: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 6,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  timeFilterButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  timeFilterButtonActive: {},
  timeFilterGradient: {
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#16A085",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  timeFilterText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 14,
    letterSpacing: 0.2,
  },
  timeFilterTextActive: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // Meal Completion Status
  mealCompletionCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    padding: 20,
  },
  mealCompletionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mealCompletionIcon: {
    marginRight: 12,
  },
  mealCompletionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  mealCompletionText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  mealCompletionMessage: {
    fontSize: 14,
    color: "#64748B",
    fontStyle: "italic",
  },

  // Enhanced Section Styling
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 20,
    letterSpacing: -0.3,
  },

  // Enhanced Gamification
  gamificationContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  levelContainer: {
    marginBottom: 24,
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  levelIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF3E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  levelDetails: {
    flex: 1,
  },
  levelText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  xpText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    letterSpacing: 0.1,
  },
  xpProgress: {
    gap: 12,
  },
  xpProgressBg: {
    height: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    overflow: "hidden",
  },
  xpProgressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#F39C12",
  },
  xpToNext: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.1,
  },

  gamificationStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  gamificationStatItem: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  gamificationStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 6,
  },
  gamificationStatLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  // Enhanced Achievements
  achievementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#E0F2F1",
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A085",
    letterSpacing: 0.3,
  },

  achievementsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  achievementCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  achievementContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  achievementIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 12,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: "500",
  },
  achievementProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBarContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  xpRewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  xpRewardText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  unlockedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Enhanced Progress Overview
  progressOverviewContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  progressStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  progressStatItem: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  progressStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  // Nutrition Averages
  nutritionAverages: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 24,
  },
  nutritionAveragesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    textAlign: "center",
  },
  nutritionAveragesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionAverage: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  nutritionAverageValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
    marginBottom: 4,
  },
  nutritionAverageLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  // Enhanced Alerts
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  hideAlertsButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
  },
  hideAlertsText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  alertsContainer: {
    gap: 16,
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  alertMessage: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
    lineHeight: 22,
  },

  // Enhanced Metrics
  metricsGrid: {
    gap: 20,
  },
  metricCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  metricCardContent: {
    padding: 24,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  metricStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricStatusText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  metricTrend: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  metricTrendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 4,
    letterSpacing: 0.1,
  },
  metricValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  metricCurrentValue: {
    flex: 1,
  },
  metricValueText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  metricTargetText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
  },
  metricPercentage: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  metricPercentageText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  metricProgress: {
    marginBottom: 16,
  },
  metricProgressBg: {
    height: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 5,
    overflow: "hidden",
  },
  metricProgressFill: {
    height: "100%",
    borderRadius: 5,
  },
  metricRecommendation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  metricRecommendationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.1,
  },

  // Enhanced Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
});

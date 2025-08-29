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
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import {
  ChartBar as BarChart3,
  TrendingUp,
  TrendingDown,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
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
  Dumbbell as DumbbellIcon,
  Activity,
  ChartPie as PieChartIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { api } from "@/src/services/api";
import LoadingScreen from "@/components/LoadingScreen";

const { width } = Dimensions.get("window");
const chartWidth = width - 40;

interface NutritionMetric {
  id: string;
  name: string;
  nameEn: string;
  value: number;
  unit: string;
  target: number;
  minTarget?: number;
  maxTarget?: number;
  percentage: number;
  status: "excellent" | "good" | "warning" | "danger";
  icon: React.ReactNode;
  color: string;
  category: "macros" | "micros" | "lifestyle" | "quality";
  description: string;
  recommendation?: string;
  trend: "up" | "down" | "stable";
  weeklyAverage: number;
  lastWeekChange: number;
  chartData?: number[];
  chartLabels?: string[];
}

interface ProgressData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  fiber: number;
  sugar: number;
  sodium: number;
  weight?: number;
  mood?: "happy" | "neutral" | "sad";
  energy?: "high" | "medium" | "low";
  satiety?: "very_full" | "satisfied" | "hungry";
  mealQuality?: number;
  mealsCount: number;
  requiredMeals: number;
}

interface Achievement {
  id: string;
  title: {
    en: string;
    he: string;
  };
  description: {
    en: string;
    he: string;
  };
  icon: string;
  color: string;
  progress: number;
  maxProgress?: number;
  unlocked: boolean;
  category: "STREAK" | "GOAL" | "IMPROVEMENT" | "CONSISTENCY" | "MILESTONE";
  xpReward: number;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  unlockedDate?: string;
}

interface TimeFilter {
  key: "today" | "week" | "month";
  label: string;
}

interface StatisticsData {
  level: number;
  currentXP: number;
  totalPoints: number;
  currentStreak: number;
  weeklyStreak: number;
  perfectDays: number;
  dailyGoalDays: number;
  totalDays: number;
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFats: number;
  averageFiber: number;
  averageSugar: number;
  averageSodium: number;
  averageFluids: number;
  achievements: any[];
  badges: any[];
  dailyBreakdown: any[];
  successfulDays: number;
  averageCompletion: number;
  bestStreak: number;
  happyDays: number;
  highEnergyDays: number;
  satisfiedDays: number;
  averageMealQuality: number;
  userGoals: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFats: number;
    dailyFiber: number;
    dailyWater: number;
    mealsPerDay: number;
  };
}

interface UserQuestionnaire {
  mealsPerDay: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  dailyFiber: number;
  dailyWater: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
}

// Chart configuration
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(22, 160, 133, ${opacity})`,
  strokeWidth: 3,
  barPercentage: 0.7,
  fillShadowGradient: "#16A085",
  fillShadowGradientOpacity: 0.1,
  decimalPlaces: 0,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#16A085",
    fill: "#ffffff",
  },
  propsForBackgroundLines: {
    strokeWidth: 1,
    stroke: "#E5E7EB",
    strokeDasharray: "5,5",
  },
  propsForLabels: {
    fontSize: 12,
    fill: "#64748B",
  },
};

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

// Helper function to format dates based on period
const formatDateLabel = (
  date: string,
  period: "today" | "week" | "month"
): string => {
  const dateObj = new Date(date);

  switch (period) {
    case "today":
      return dateObj.toLocaleTimeString("en", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "week":
      return dateObj.toLocaleDateString("en", { weekday: "short" });
    case "month":
      return dateObj.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      });
    default:
      return dateObj.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      });
  }
};

// Helper function to generate chart data from progress data
const generateChartData = (
  data: ProgressData[],
  metric: keyof ProgressData,
  period: "today" | "week" | "month"
): ChartData => {
  if (!data || data.length === 0) {
    return {
      labels: ["No Data"],
      datasets: [{ data: [0] }],
    };
  }

  // Sort data by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const labels = sortedData.map((item) => formatDateLabel(item.date, period));
  const values = sortedData.map((item) => {
    const value = item[metric];
    return typeof value === "number" ? value : 0;
  });

  return {
    labels,
    datasets: [
      {
        data: values.length > 0 ? values : [0],
        color: (opacity = 1) => `rgba(22, 160, 133, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };
};

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === "he";
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("week");
  const [selectedChart, setSelectedChart] = useState<string>("overview");
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
        const data = statisticsResponse.data.data;

        // Ensure all required fields exist with defaults
        const processedData = {
          ...data,
          averageCalories: data.averageCalories || 0,
          averageProtein: data.averageProtein || 0,
          averageCarbs: data.averageCarbs || 0,
          averageFats: data.averageFats || 0,
          averageFiber: data.averageFiber || 0,
          averageSugar: data.averageSugar || 0,
          averageSodium: data.averageSodium || 0,
          averageFluids: data.averageFluids || 0,
          dailyBreakdown: data.dailyBreakdown || [],
          achievements: data.achievements || [],
          totalPoints: data.totalPoints || 0,
          currentStreak: data.currentStreak || 0,
          weeklyStreak: data.weeklyStreak || 0,
          perfectDays: data.perfectDays || 0,
          successfulDays: data.successfulDays || 0,
          totalDays: data.totalDays || 0,
          averageCompletion: data.averageCompletion || 0,
          bestStreak: data.bestStreak || 0,
          happyDays: data.happyDays || 0,
          highEnergyDays: data.highEnergyDays || 0,
          satisfiedDays: data.satisfiedDays || 0,
          averageMealQuality: data.averageMealQuality || 3,
        };

        setStatisticsData(processedData);
        console.log(`✅ Statistics loaded successfully:`, processedData);
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

    // Generate chart data for each metric
    const generateMetricChartData = (metricKey: keyof ProgressData) => {
      const weeklyData = generateWeeklyData();
      return generateChartData(weeklyData, metricKey, selectedPeriod);
    };

    const baseData = [
      {
        id: "calories",
        name: t("statistics.total_calories"),
        nameEn: "Total Calories",
        value: Math.round(statisticsData.averageCalories || 0),
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
        weeklyAverage: Math.round(statisticsData.averageCalories || 0),
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageCalories || 0,
          statisticsData.averageCalories || 0
        ),
        chartData: generateMetricChartData("calories").datasets[0].data,
        chartLabels: generateMetricChartData("calories").labels,
      },
      {
        id: "protein",
        name: t("statistics.protein"),
        nameEn: "Protein",
        value: Math.round(statisticsData.averageProtein || 0),
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
        weeklyAverage: Math.round(statisticsData.averageProtein || 0),
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageProtein || 0,
          statisticsData.averageProtein || 0
        ),
        chartData: generateMetricChartData("protein").datasets[0].data,
        chartLabels: generateMetricChartData("protein").labels,
      },
      {
        id: "carbs",
        name: t("statistics.carbohydrates"),
        nameEn: "Carbohydrates",
        value: Math.round(statisticsData.averageCarbs || 0),
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
        weeklyAverage: Math.round(statisticsData.averageCarbs || 0),
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageCarbs || 0,
          statisticsData.averageCarbs || 0
        ),
        chartData: generateMetricChartData("carbs").datasets[0].data,
        chartLabels: generateMetricChartData("carbs").labels,
      },
      {
        id: "fats",
        name: t("statistics.fats"),
        nameEn: "Fats",
        value: Math.round(statisticsData.averageFats || 0),
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
        weeklyAverage: Math.round(statisticsData.averageFats || 0),
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageFats || 0,
          statisticsData.averageFats || 0
        ),
        chartData: generateMetricChartData("fats").datasets[0].data,
        chartLabels: generateMetricChartData("fats").labels,
      },
      {
        id: "fiber",
        name: t("statistics.fiber"),
        nameEn: "Fiber",
        value: Math.round(statisticsData.averageFiber || 0),
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
        weeklyAverage: Math.round(statisticsData.averageFiber || 0),
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageFiber || 0,
          statisticsData.averageFiber || 0
        ),
        chartData: generateMetricChartData("fiber").datasets[0].data,
        chartLabels: generateMetricChartData("fiber").labels,
      },
      {
        id: "sugars",
        name: t("statistics.sugars"),
        nameEn: "Sugars",
        value: Math.round(statisticsData.averageSugar || 0),
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
        weeklyAverage: Math.round(statisticsData.averageSugar || 0),
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageSugar || 0,
          statisticsData.averageSugar || 0
        ),
        chartData: generateMetricChartData("sugar").datasets[0].data,
        chartLabels: generateMetricChartData("sugar").labels,
      },
      {
        id: "sodium",
        name: t("statistics.sodium"),
        nameEn: "Sodium",
        value: Math.round(statisticsData.averageSodium || 0),
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
        weeklyAverage: Math.round(statisticsData.averageSodium || 0),
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageSodium || 0,
          statisticsData.averageSodium || 0
        ),
        chartData: generateMetricChartData("sodium").datasets[0].data,
        chartLabels: generateMetricChartData("sodium").labels,
      },
      {
        id: "hydration",
        name: t("statistics.hydration"),
        nameEn: "Hydration",
        value: Math.round(statisticsData.averageFluids || 0),
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
        weeklyAverage: Math.round(statisticsData.averageFluids || 0),
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageFluids || 0,
          statisticsData.averageFluids || 0
        ),
        chartData: generateMetricChartData("water").datasets[0].data,
        chartLabels: generateMetricChartData("water").labels,
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
      fiber: day.fiber_g || 0,
      sugar: day.sugar_g || 0,
      sodium: day.sodium_mg || 0,
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
  }, [statisticsData, userQuestionnaire, selectedPeriod]);

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

  const chartTypes = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "macros", label: "Macros", icon: PieChartIcon },
    { key: "trends", label: "Trends", icon: Activity },
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

  // Generate chart data for overview
  const generateOverviewChartData = () => {
    if (!weeklyData || weeklyData.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      };
    }

    return generateChartData(weeklyData, "calories", selectedPeriod);
  };

  // Generate pie chart data for macros
  const generateMacrosPieData = () => {
    if (!statisticsData) return [];

    const totalMacros =
      (statisticsData.averageProtein || 0) * 4 +
      (statisticsData.averageCarbs || 0) * 4 +
      (statisticsData.averageFats || 0) * 9;

    if (totalMacros === 0) return [];

    return [
      {
        name: "Protein",
        calories: (statisticsData.averageProtein || 0) * 4,
        color: "#9B59B6",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "Carbs",
        calories: (statisticsData.averageCarbs || 0) * 4,
        color: "#F39C12",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "Fats",
        calories: (statisticsData.averageFats || 0) * 9,
        color: "#16A085",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
    ];
  };

  const categorizedMetrics = {
    macros: metrics.filter((m) => m.category === "macros"),
    micros: metrics.filter((m) => m.category === "micros"),
    lifestyle: metrics.filter((m) => m.category === "lifestyle"),
  };

  const progressStats = calculateProgressStats();
  const gamificationStats = calculateGamificationStats();

  // Chart rendering functions
  const renderChart = () => {
    switch (selectedChart) {
      case "overview":
        const overviewData = generateOverviewChartData();
        if (overviewData.datasets[0].data.every((value) => value === 0)) {
          return (
            <View style={styles.noChartData}>
              <BarChart3 size={48} color="#BDC3C7" />
              <Text style={styles.noChartDataText}>No data to display</Text>
            </View>
          );
        }
        return (
          <LineChart
            data={overviewData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        );

      case "macros":
        const pieData = generateMacrosPieData();
        if (pieData.length === 0) {
          return (
            <View style={styles.noChartData}>
              <PieChartIcon size={48} color="#BDC3C7" />
              <Text style={styles.noChartDataText}>
                No macro data available
              </Text>
            </View>
          );
        }
        return (
          <PieChart
            data={pieData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            accessor={"calories"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            style={styles.chart}
          />
        );

      case "trends":
        const trendMetrics = ["protein", "carbs", "fats", "water"];
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.trendChartsContainer}>
              {trendMetrics
                .map((metricKey) => {
                  const metric = metrics.find((m) => m.id === metricKey);
                  if (
                    !metric ||
                    !metric.chartData ||
                    metric.chartData.every((v) => v === 0)
                  ) {
                    return null;
                  }

                  const chartData = {
                    labels: metric.chartLabels || [],
                    datasets: [
                      {
                        data: metric.chartData,
                        color: (opacity = 1) =>
                          `rgba(22, 160, 133, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  };

                  return (
                    <View key={metricKey} style={styles.trendChart}>
                      <Text style={styles.trendChartTitle}>{metric.name}</Text>
                      <LineChart
                        data={chartData}
                        width={280}
                        height={160}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) =>
                            metric.color
                              .replace("rgb", "rgba")
                              .replace(")", `, ${opacity})`),
                        }}
                        bezier
                        style={styles.smallChart}
                      />
                    </View>
                  );
                })
                .filter(Boolean)}
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const renderMetricCard = (metric: NutritionMetric) => (
    <TouchableOpacity
      key={metric.id}
      style={styles.metricCard}
      onPress={() => Alert.alert(metric.name, metric.description)}
    >
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.85)"]}
        style={styles.metricCardGradient}
      >
        <View style={styles.metricCardContent}>
          <View style={styles.metricHeader}>
            <View
              style={[
                styles.metricIconContainer,
                { backgroundColor: `${metric.color}15` },
              ]}
            >
              {metric.icon}
            </View>
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
            <View
              style={[
                styles.metricPercentage,
                { backgroundColor: `${metric.color}10` },
              ]}
            >
              <Text
                style={[styles.metricPercentageText, { color: metric.color }]}
              >
                {metric.percentage}%
              </Text>
            </View>
          </View>

          <View style={styles.metricProgress}>
            <View style={styles.metricProgressBg}>
              <LinearGradient
                colors={[`${metric.color}80`, metric.color]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.metricProgressFill,
                  { width: `${Math.min(metric.percentage, 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Mini chart for each metric */}
          {metric.chartData && metric.chartData.some((v) => v > 0) && (
            <View style={styles.miniChart}>
              <Text style={styles.miniChartTitle}>
                {language === "he" ? "מגמה" : "Trend"}
              </Text>
              <View style={styles.miniChartContainer}>
                {metric.chartData.slice(-7).map((value, index) => (
                  <View
                    key={index}
                    style={[
                      styles.miniChartBar,
                      {
                        height: Math.max(
                          4,
                          (value / Math.max(...metric.chartData.slice(-7))) * 20
                        ),
                        backgroundColor: metric.color,
                        opacity: 0.4 + (index / 7) * 0.6,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {metric.recommendation && shouldShowWarnings() && (
            <View
              style={[
                styles.metricRecommendation,
                { backgroundColor: `${metric.color}10` },
              ]}
            >
              <Sparkles size={12} color={metric.color} />
              <Text style={styles.metricRecommendationText}>
                {metric.recommendation}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
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
      <LinearGradient colors={["#f8fafc", "#e2e8f0"]} style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <AlertTriangle size={56} color="#EF4444" />
            </View>
            <Text style={styles.errorText}>{t("statistics.errorMessage")}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <LinearGradient
                colors={["#EF4444", "#DC2626"]}
                style={styles.retryButtonGradient}
              >
                <Text style={styles.retryButtonText}>
                  {t("statistics.retryButton")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Meal completion status component
  const renderMealCompletionStatus = () => {
    const weeklyData = generateWeeklyData();
    const today = new Date().toISOString().split("T")[0];
    const todayData = weeklyData.find((day) => day.date === today);

    if (!todayData || !userQuestionnaire) return null;

    const isCompleted = todayData.mealsCount >= todayData.requiredMeals;
    const completionPercentage =
      (todayData.mealsCount / todayData.requiredMeals) * 100;

    return (
      <View style={styles.mealCompletionCard}>
        <LinearGradient
          colors={isCompleted ? ["#10B981", "#059669"] : ["#F59E0B", "#D97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mealCompletionGradient}
        >
          <View style={styles.mealCompletionContent}>
            <View style={styles.mealCompletionHeader}>
              <View style={styles.mealCompletionIconContainer}>
                {isCompleted ? (
                  <CheckCircle size={28} color="#FFFFFF" />
                ) : (
                  <Clock size={28} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.mealCompletionInfo}>
                <Text style={styles.mealCompletionTitle}>
                  {t("statistics.mealsCompleted")}
                </Text>
                <Text style={styles.mealCompletionSubtitle}>
                  {todayData.mealsCount} {t("statistics.of")}{" "}
                  {todayData.requiredMeals} meals
                </Text>
              </View>
              <View style={styles.mealCompletionPercentage}>
                <Text style={styles.mealCompletionPercentageText}>
                  {Math.round(completionPercentage)}%
                </Text>
              </View>
            </View>

            <View style={styles.mealProgressBar}>
              <View style={styles.mealProgressBg}>
                <View
                  style={[
                    styles.mealProgressFill,
                    { width: `${Math.min(completionPercentage, 100)}%` },
                  ]}
                />
              </View>
            </View>

            {!isCompleted && (
              <Text style={styles.mealCompletionMessage}>
                {t("statistics.completeMealsFirst")}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#f8fafc", "#e2e8f0"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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
          <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{t("statistics.title")}</Text>
              <Text style={styles.subtitle}>{t("statistics.subtitle")}</Text>
            </View>
          </LinearGradient>

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
              <LinearGradient
                colors={["#FFFFFF", "#F8FAFC"]}
                style={styles.noDataCard}
              >
                <BarChart3 size={72} color="#BDC3C7" />
                <Text style={styles.noDataText}>
                  {t("statistics.noDataMessage")}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Main Content */}
          {statisticsData && (
            <>
              {/* Meal Completion Status */}
              {renderMealCompletionStatus()}

              {/* Charts Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {language === "he" ? "תרשימים ונתונים" : "Charts & Data"}
                </Text>

                {/* Chart Type Filter */}
                <View style={styles.chartTypeContainer}>
                  {chartTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.chartTypeButton,
                        selectedChart === type.key &&
                          styles.chartTypeButtonActive,
                      ]}
                      onPress={() => setSelectedChart(type.key)}
                    >
                      <type.icon
                        size={20}
                        color={
                          selectedChart === type.key ? "#16A085" : "#64748B"
                        }
                      />
                      <Text
                        style={[
                          styles.chartTypeText,
                          selectedChart === type.key &&
                            styles.chartTypeTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Chart Container */}
                <LinearGradient
                  colors={["#FFFFFF", "#F8FAFC"]}
                  style={styles.chartContainer}
                >
                  {renderChart()}
                </LinearGradient>
              </View>

              {/* Gamification Dashboard */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("statistics.gamification")}
                </Text>
                <LinearGradient
                  colors={["#FFFFFF", "#F8FAFC"]}
                  style={styles.gamificationContainer}
                >
                  <View style={styles.levelContainer}>
                    <View style={styles.levelInfo}>
                      <LinearGradient
                        colors={["#FEF3E2", "#FED7AA"]}
                        style={styles.levelIcon}
                      >
                        <Crown size={40} color="#F59E0B" />
                      </LinearGradient>
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
                        <LinearGradient
                          colors={["#F59E0B", "#D97706"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.xpProgressFill,
                            { width: `${gamificationStats.xpProgress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.xpToNext}>
                        {gamificationStats.xpToNext} {t("statistics.nextLevel")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gamificationStats}>
                    <View style={styles.gamificationStatItem}>
                      <View
                        style={[
                          styles.statIconContainer,
                          { backgroundColor: "#FEF2F2" },
                        ]}
                      >
                        <Flame size={24} color="#E74C3C" />
                      </View>
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.dailyStreak}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {t("statistics.dailyStreak")}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <View
                        style={[
                          styles.statIconContainer,
                          { backgroundColor: "#EFF6FF" },
                        ]}
                      >
                        <Calendar size={24} color="#3498DB" />
                      </View>
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.weeklyStreak}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {t("statistics.weeklyStreak")}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <View
                        style={[
                          styles.statIconContainer,
                          { backgroundColor: "#FEF3E2" },
                        ]}
                      >
                        <Star size={24} color="#F39C12" />
                      </View>
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.perfectDays}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {t("statistics.perfectDays")}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <View
                        style={[
                          styles.statIconContainer,
                          { backgroundColor: "#E0F2F1" },
                        ]}
                      >
                        <Trophy size={24} color="#16A085" />
                      </View>
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.totalPoints.toLocaleString()}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {t("statistics.totalPoints")}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
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
                    <LinearGradient
                      colors={["#E0F2F1", "#B2DFDB"]}
                      style={styles.viewAllButtonGradient}
                    >
                      <Text style={styles.viewAllText}>
                        {t("statistics.viewAllAchievements")}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.achievementsContainer}>
                  {achievements.slice(0, 3).map((achievement) => (
                    <LinearGradient
                      key={achievement.id}
                      colors={[
                        getAchievementBackgroundColor(
                          achievement.rarity,
                          achievement.unlocked
                        ),
                        "#FFFFFF",
                      ]}
                      style={[
                        styles.achievementCard,
                        {
                          borderWidth: 2,
                          borderColor: achievement.unlocked
                            ? `${achievement.color}30`
                            : "#E5E7EB",
                        },
                      ]}
                    >
                      <View style={styles.achievementContent}>
                        <LinearGradient
                          colors={
                            achievement.unlocked
                              ? [
                                  `${achievement.color}20`,
                                  `${achievement.color}10`,
                                ]
                              : ["#F3F4F6", "#E5E7EB"]
                          }
                          style={styles.achievementIconContainer}
                        >
                          {getAchievementIcon(
                            achievement.icon,
                            32,
                            achievement.unlocked ? achievement.color : "#9CA3AF"
                          )}
                        </LinearGradient>

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
                            <LinearGradient
                              colors={
                                achievement.unlocked
                                  ? [
                                      `${achievement.color}20`,
                                      `${achievement.color}10`,
                                    ]
                                  : ["#F3F4F6", "#E5E7EB"]
                              }
                              style={styles.rarityBadge}
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
                            </LinearGradient>
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
                                <LinearGradient
                                  colors={
                                    achievement.unlocked
                                      ? [
                                          `${achievement.color}80`,
                                          achievement.color,
                                        ]
                                      : ["#D1D5DB", "#9CA3AF"]
                                  }
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
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
                          <LinearGradient
                            colors={[
                              "rgba(255, 255, 255, 0.95)",
                              "rgba(255, 255, 255, 0.85)",
                            ]}
                            style={styles.unlockedBadge}
                          >
                            <CheckCircle size={28} color={achievement.color} />
                          </LinearGradient>
                        )}
                      </View>
                    </LinearGradient>
                  ))}
                </View>
              </View>

              {/* Progress Overview with Real Data */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("statistics.progressOverview")}
                </Text>
                <LinearGradient
                  colors={["#FFFFFF", "#F8FAFC"]}
                  style={styles.progressOverviewContainer}
                >
                  <View style={styles.progressStatsGrid}>
                    <View style={styles.progressStatItem}>
                      <LinearGradient
                        colors={["#ECFDF5", "#D1FAE5"]}
                        style={styles.progressStatIcon}
                      >
                        <CheckCircle size={24} color="#059669" />
                      </LinearGradient>
                      <Text style={styles.progressStatValue}>
                        {progressStats.successfulDays}/{progressStats.totalDays}
                      </Text>
                      <Text style={styles.progressStatLabel}>
                        {t("statistics.successfulDays")}
                      </Text>
                    </View>

                    <View style={styles.progressStatItem}>
                      <LinearGradient
                        colors={["#EFF6FF", "#DBEAFE"]}
                        style={styles.progressStatIcon}
                      >
                        <Target size={24} color="#2563EB" />
                      </LinearGradient>
                      <Text style={styles.progressStatValue}>
                        {progressStats.averageCompletion}%
                      </Text>
                      <Text style={styles.progressStatLabel}>
                        {t("statistics.averageCompletion")}
                      </Text>
                    </View>

                    <View style={styles.progressStatItem}>
                      <LinearGradient
                        colors={["#FEF3E2", "#FED7AA"]}
                        style={styles.progressStatIcon}
                      >
                        <Award size={24} color="#D97706" />
                      </LinearGradient>
                      <Text style={styles.progressStatValue}>
                        {progressStats.bestStreak}
                      </Text>
                      <Text style={styles.progressStatLabel}>
                        {t("statistics.bestStreak")}
                      </Text>
                    </View>

                    <View style={styles.progressStatItem}>
                      <LinearGradient
                        colors={["#FEF2F2", "#FECACA"]}
                        style={styles.progressStatIcon}
                      >
                        <Trophy size={24} color="#DC2626" />
                      </LinearGradient>
                      <Text style={styles.progressStatValue}>
                        {progressStats.currentStreak}
                      </Text>
                      <Text style={styles.progressStatLabel}>
                        {t("statistics.currentStreak")}
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
                        <View
                          style={[
                            styles.nutritionAverageIcon,
                            { backgroundColor: "#FEF2F2" },
                          ]}
                        >
                          <Flame size={18} color="#E74C3C" />
                        </View>
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.calories}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.kcal")}
                        </Text>
                      </View>
                      <View style={styles.nutritionAverage}>
                        <View
                          style={[
                            styles.nutritionAverageIcon,
                            { backgroundColor: "#F3F4F6" },
                          ]}
                        >
                          <Zap size={18} color="#9B59B6" />
                        </View>
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.protein}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.g")}
                        </Text>
                      </View>
                      <View style={styles.nutritionAverage}>
                        <View
                          style={[
                            styles.nutritionAverageIcon,
                            { backgroundColor: "#FEF3E2" },
                          ]}
                        >
                          <Wheat size={18} color="#F39C12" />
                        </View>
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.carbs}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.g")}
                        </Text>
                      </View>
                      <View style={styles.nutritionAverage}>
                        <View
                          style={[
                            styles.nutritionAverageIcon,
                            { backgroundColor: "#E0F2F1" },
                          ]}
                        >
                          <Fish size={18} color="#16A085" />
                        </View>
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.fats}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.g")}
                        </Text>
                      </View>
                      <View style={styles.nutritionAverage}>
                        <View
                          style={[
                            styles.nutritionAverageIcon,
                            { backgroundColor: "#EFF6FF" },
                          ]}
                        >
                          <Droplets size={18} color="#3498DB" />
                        </View>
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.water}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.ml")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
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
                      <LinearGradient
                        key={alert.id}
                        colors={["#FFFFFF", "#FEF7F7"]}
                        style={styles.alertCard}
                      >
                        <View style={styles.alertContent}>
                          <LinearGradient
                            colors={["#FEF2F2", "#FECACA"]}
                            style={styles.alertIcon}
                          >
                            <AlertTriangle
                              size={24}
                              color={
                                alert.severity === "danger"
                                  ? "#E74C3C"
                                  : "#E67E22"
                              }
                            />
                          </LinearGradient>
                          <View style={styles.alertText}>
                            <Text style={styles.alertTitle}>{alert.title}</Text>
                            <Text style={styles.alertMessage}>
                              {alert.message}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
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
            <LinearGradient
              colors={["#f8fafc", "#e2e8f0"]}
              style={styles.modalContainer}
            >
              <SafeAreaView>
                <LinearGradient
                  colors={["#FFFFFF", "#F8FAFC"]}
                  style={styles.modalHeader}
                >
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowAchievements(false)}
                  >
                    <X size={28} color="#2C3E50" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>
                    {t("statistics.achievements")}
                  </Text>
                  <View style={{ width: 28 }} />
                </LinearGradient>

                <ScrollView style={styles.modalContent}>
                  {achievements.map((achievement) => (
                    <LinearGradient
                      key={achievement.id}
                      colors={[
                        getAchievementBackgroundColor(
                          achievement.rarity,
                          achievement.unlocked
                        ),
                        "#FFFFFF",
                      ]}
                      style={[
                        styles.achievementCard,
                        {
                          borderWidth: 2,
                          borderColor: achievement.unlocked
                            ? `${achievement.color}30`
                            : "#E5E7EB",
                        },
                      ]}
                    >
                      <View style={styles.achievementContent}>
                        <LinearGradient
                          colors={
                            achievement.unlocked
                              ? [
                                  `${achievement.color}20`,
                                  `${achievement.color}10`,
                                ]
                              : ["#F3F4F6", "#E5E7EB"]
                          }
                          style={styles.achievementIconContainer}
                        >
                          {getAchievementIcon(
                            achievement.icon,
                            32,
                            achievement.unlocked ? achievement.color : "#9CA3AF"
                          )}
                        </LinearGradient>

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
                            <LinearGradient
                              colors={
                                achievement.unlocked
                                  ? [
                                      `${achievement.color}20`,
                                      `${achievement.color}10`,
                                    ]
                                  : ["#F3F4F6", "#E5E7EB"]
                              }
                              style={styles.rarityBadge}
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
                            </LinearGradient>
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
                                <LinearGradient
                                  colors={
                                    achievement.unlocked
                                      ? [
                                          `${achievement.color}80`,
                                          achievement.color,
                                        ]
                                      : ["#D1D5DB", "#9CA3AF"]
                                  }
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={[
                                    styles.progressBarFill,
                                    {
                                      width: `${
                                        (achievement.progress /
                                          (achievement.maxProgress || 1)) *
                                        100
                                      }%`,
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
                          <LinearGradient
                            colors={[
                              "rgba(255, 255, 255, 0.95)",
                              "rgba(255, 255, 255, 0.85)",
                            ]}
                            style={styles.unlockedBadge}
                          >
                            <CheckCircle size={28} color={achievement.color} />
                          </LinearGradient>
                        )}
                      </View>
                    </LinearGradient>
                  ))}
                </ScrollView>
              </SafeAreaView>
            </LinearGradient>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Enhanced Header Styles
  header: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 28,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
  },
  headerContent: {
    padding: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1.2,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: 0.3,
  },

  // Enhanced Error & Loading States
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 40,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
    maxWidth: 350,
    width: "100%",
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 20,
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "700",
    lineHeight: 30,
  },
  retryButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  retryButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataCard: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    borderRadius: 32,
    alignItems: "center",
    width: "100%",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  noDataText: {
    marginTop: 32,
    fontSize: 20,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 30,
  },

  // Enhanced Time Filter
  timeFilterContainer: {
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  timeFilter: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 8,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  timeFilterButton: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  timeFilterButtonActive: {},
  timeFilterGradient: {
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#16A085",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timeFilterText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 16,
    letterSpacing: 0.4,
  },
  timeFilterTextActive: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  // Enhanced Chart Styles
  chartTypeContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 6,
    marginBottom: 24,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 10,
  },
  chartTypeButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#16A085",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTypeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },
  chartTypeTextActive: {
    color: "#16A085",
  },
  chartContainer: {
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  chart: {
    marginVertical: 12,
    borderRadius: 20,
  },
  noChartData: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  noChartDataText: {
    marginTop: 24,
    fontSize: 18,
    color: "#64748B",
    fontWeight: "600",
  },
  trendChartsContainer: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 8,
  },
  trendChart: {
    alignItems: "center",
  },
  trendChartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  smallChart: {
    borderRadius: 16,
  },

  // Enhanced Meal Completion Status
  mealCompletionCard: {
    marginHorizontal: 20,
    marginBottom: 28,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  mealCompletionGradient: {
    padding: 28,
  },
  mealCompletionContent: {
    alignItems: "stretch",
  },
  mealCompletionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  mealCompletionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  mealCompletionInfo: {
    flex: 1,
  },
  mealCompletionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mealCompletionSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  mealCompletionPercentage: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  mealCompletionPercentageText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mealProgressBar: {
    marginBottom: 16,
  },
  mealProgressBg: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    overflow: "hidden",
  },
  mealProgressFill: {
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 6,
  },
  mealCompletionMessage: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    fontStyle: "italic",
    fontWeight: "600",
    textAlign: "center",
  },

  // Enhanced Section Styling
  section: {
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 24,
    letterSpacing: -0.8,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Enhanced Gamification
  gamificationContainer: {
    borderRadius: 32,
    padding: 32,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  },
  levelContainer: {
    marginBottom: 32,
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  levelIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 24,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  levelDetails: {
    flex: 1,
  },
  levelText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  xpText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.3,
  },
  xpProgress: {
    gap: 16,
  },
  xpProgressBg: {
    height: 16,
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  xpProgressFill: {
    height: "100%",
    borderRadius: 8,
  },
  xpToNext: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  gamificationStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 28,
    borderTopWidth: 2,
    borderTopColor: "#E2E8F0",
  },
  gamificationStatItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gamificationStatValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gamificationStatLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // Enhanced Achievements
  achievementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  viewAllButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#16A085",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewAllButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#16A085",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  achievementsContainer: {
    gap: 20,
    marginBottom: 28,
  },
  achievementCard: {
    borderRadius: 28,
    padding: 28,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  achievementContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  achievementIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    flex: 1,
    marginRight: 16,
    lineHeight: 26,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  achievementDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: "600",
  },
  achievementProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBarContainer: {
    flex: 1,
    marginRight: 20,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  xpRewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  xpRewardText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  unlockedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },

  // Enhanced Progress Overview
  progressOverviewContainer: {
    borderRadius: 32,
    padding: 32,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  },
  progressStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  progressStatItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  progressStatIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  progressStatLabel: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // Enhanced Nutrition Averages
  nutritionAverages: {
    borderTopWidth: 2,
    borderTopColor: "#E2E8F0",
    paddingTop: 32,
  },
  nutritionAveragesTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  nutritionAveragesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionAverage: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  nutritionAverageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nutritionAverageValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  nutritionAverageLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Enhanced Alerts
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  hideAlertsButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hideAlertsText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "700",
  },
  alertsContainer: {
    gap: 20,
  },
  alertCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  alertMessage: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 24,
  },

  // Enhanced Metrics
  metricsGrid: {
    gap: 24,
  },
  metricCard: {
    borderRadius: 28,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
  },
  metricCardGradient: {
    borderRadius: 28,
  },
  metricCardContent: {
    padding: 32,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  metricIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  metricStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricStatusText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metricTrend: {
    alignItems: "center",
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricTrendText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 6,
    letterSpacing: 0.3,
  },
  metricValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  metricCurrentValue: {
    flex: 1,
  },
  metricValueText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metricTargetText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "700",
  },
  metricPercentage: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricPercentageText: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metricProgress: {
    marginBottom: 20,
  },
  metricProgressBg: {
    height: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricProgressFill: {
    height: "100%",
    borderRadius: 6,
  },

  // Enhanced Mini Chart Styles
  miniChart: {
    marginTop: 20,
    marginBottom: 12,
  },
  miniChartTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  miniChartContainer: {
    flexDirection: "row",
    alignItems: "end",
    height: 28,
    gap: 3,
  },
  miniChartBar: {
    flex: 1,
    minHeight: 6,
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  metricRecommendation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricRecommendationText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 16,
    flex: 1,
    letterSpacing: 0.3,
  },

  // Enhanced Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(44, 62, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.6,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  modalContent: {
    flex: 1,
    padding: 32,
  },
});

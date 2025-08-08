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
  ActivityIndicator,
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
  Heart,
  Shield,
  Leaf,
  Sun,
  Globe,
  Calendar,
  Target,
  Activity,
  Flame,
  Apple,
  Wheat,
  Fish,
  Sparkles,
  Timer,
  Scale,
  Brain,
  Award,
  Trophy,
  Star,
  Crown,
  Smile,
  Meh,
  Frown,
  Battery,
  X,
  Medal,
  Waves,
  Mountain,
  Sunrise,
  Moon,
  Dumbbell,
  Gem,
  Muscle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { api } from "@/src/services/api";
import LoadingScreen from "@/components/LoadingScreen";

const { width } = Dimensions.get("window");

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
}

interface ProgressData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  weight?: number;
  mood?: "happy" | "neutral" | "sad";
  energy?: "high" | "medium" | "low";
  satiety?: "very_full" | "satisfied" | "hungry";
  mealQuality?: number;
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

interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  earnedDate: string;
  rarity: "common" | "rare" | "epic" | "legendary";
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
}

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
      return <Muscle {...iconProps} />;
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
const getAchievementGradientColors = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case "LEGENDARY":
      return ["#FF6B6B", "#4ECDC4"];
    case "EPIC":
      return ["#9B59B6", "#E74C3C"];
    case "RARE":
      return ["#3498DB", "#2ECC71"];
    case "UNCOMMON":
      return ["#F39C12", "#E67E22"];
    case "COMMON":
    default:
      return ["#16A085", "#27AE60"];
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case "LEGENDARY":
      return "#FF6B6B";
    case "EPIC":
      return "#9B59B6";
    case "RARE":
      return "#3498DB";
    case "UNCOMMON":
      return "#F39C12";
    case "COMMON":
    default:
      return "#16A085";
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
  const [showComparison, setShowComparison] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(
    null
  );

  const texts = {
    title: language === "he" ? "התקדמות וסטטיסטיקות" : "Progress & Statistics",
    subtitle:
      language === "he"
        ? "מעקב מפורט אחר 15 מדדי תזונה מרכזיים והתקדמות אישית"
        : "Detailed tracking of 15 key nutritional metrics and personal progress",
    today: language === "he" ? "היום" : "Today",
    week: language === "he" ? "שבוע" : "Week",
    month: language === "he" ? "חודש" : "Month",
    macronutrients: language === "he" ? "מקרו נוטריינטים" : "Macronutrients",
    micronutrients: language === "he" ? "מיקרו נוטריינטים" : "Micronutrients",
    lifestyle: language === "he" ? "אורח חיים" : "Lifestyle",
    quality: language === "he" ? "איכות תזונה" : "Nutrition Quality",
    alerts: language === "he" ? "התראות" : "Alerts",
    recommendations: language === "he" ? "המלצות" : "Recommendations",
    trend: language === "he" ? "מגמה" : "Trend",
    weeklyAverage: language === "he" ? "ממוצע שבועי" : "Weekly Average",
    change: language === "he" ? "שינוי" : "Change",
    excellent: language === "he" ? "מעולה" : "Excellent",
    good: language === "he" ? "טוב" : "Good",
    warning: language === "he" ? "זהירות" : "Warning",
    danger: language === "he" ? "חריגה" : "Out of Range",
    viewDetails: language === "he" ? "צפה בפרטים" : "View Details",
    hideAlerts: language === "he" ? "הסתר התראות" : "Hide Alerts",
    showAlerts: language === "he" ? "הצג התראות" : "Show Alerts",
    noAlerts: language === "he" ? "אין התראות כרגע" : "No alerts at the moment",
    alertsTitle: language === "he" ? "התראות חשובות" : "Important Alerts",
    progressOverview: language === "he" ? "סקירת התקדמות" : "Progress Overview",
    weeklyProgress: language === "he" ? "התקדמות שבועית" : "Weekly Progress",
    achievements: language === "he" ? "הישגים" : "Achievements",
    insights: language === "he" ? "תובנות אישיות" : "Personal Insights",
    gamification: language === "he" ? "גיימיפיקציה" : "Gamification",
    badges: language === "he" ? "תגים" : "Badges",
    streaks: language === "he" ? "רצפים" : "Streaks",
    comparison: language === "he" ? "השוואה" : "Comparison",
    wellbeing: language === "he" ? "רווחה" : "Wellbeing",
    level: language === "he" ? "רמה" : "Level",
    xp: language === "he" ? "נק׳ ניסיון" : "XP",
    nextLevel: language === "he" ? "לרמה הבאה" : "To Next Level",
    dailyStreak: language === "he" ? "רצף יומי" : "Daily Streak",
    weeklyStreak: language === "he" ? "רצף שבועי" : "Weekly Streak",
    perfectDays: language === "he" ? "ימים מושלמים" : "Perfect Days",
    totalPoints: language === "he" ? 'סה"כ נקודות' : "Total Points",
    viewAllAchievements:
      language === "he" ? "צפה בכל הישגים" : "View All Achievements",
    unlocked: language === "he" ? "נפתח" : "Unlocked",
    locked: language === "he" ? "נעול" : "Locked",
    progress: language === "he" ? "התקדמות" : "Progress",
    compareWith: language === "he" ? "השווה עם" : "Compare With",
    lastWeek: language === "he" ? "השבוע שעבר" : "Last Week",
    lastMonth: language === "he" ? "החודש שעבר" : "Last Month",
    thisWeek: language === "he" ? "השבוע" : "This Week",
    thisMonth: language === "he" ? "החודש" : "This Month",
    improvement: language === "he" ? "שיפור" : "Improvement",
    decline: language === "he" ? "ירידה" : "Decline",
    stable: language === "he" ? "יציב" : "Stable",
    mood: language === "he" ? "מצב רוח" : "Mood",
    energy: language === "he" ? "אנרגיה" : "Energy",
    satiety: language === "he" ? "שובע" : "Satiety",
    mealQuality: language === "he" ? "איכות ארוחה" : "Meal Quality",
    happy: language === "he" ? "שמח" : "Happy",
    neutral: language === "he" ? "ניטרלי" : "Neutral",
    sad: language === "he" ? "עצוב" : "Sad",
    high: language === "he" ? "גבוה" : "High",
    medium: language === "he" ? "בינוני" : "Medium",
    low: language === "he" ? "נמוך" : "Low",
    veryFull: language === "he" ? "שבע מאוד" : "Very Full",
    satisfied: language === "he" ? "מרוצה" : "Satisfied",
    hungry: language === "he" ? "רעב" : "Hungry",
    averageDaily: language === "he" ? "ממוצע יומי" : "Daily Average",
    totalConsumed: language === "he" ? 'סה"כ נצרך' : "Total Consumed",
    goalAchieved: language === "he" ? "יעד הושג" : "Goal Achieved",
    streak: language === "he" ? "רצף ימים" : "Day Streak",
    days: language === "he" ? "ימים" : "days",
    bestDay: language === "he" ? "היום הטוב ביותר" : "Best Day",
    improvementArea: language === "he" ? "אזור לשיפור" : "Improvement Area",
    successfulDays: language === "he" ? "ימים מוצלחים" : "Successful Days",
    averageCompletion: language === "he" ? "ממוצע השלמה" : "Average Completion",
    bestStreak: language === "he" ? "רצף הטוב ביותר" : "Best Streak",
    currentStreak: language === "he" ? "רצף נוכחי" : "Current Streak",
    totalCalories:
      language === "he" ? 'סה"כ קלוריות יומיות' : "Total Daily Calories",
    protein: language === "he" ? "חלבון" : "Protein",
    carbohydrates: language === "he" ? "פחמימות" : "Carbohydrates",
    fats: language === "he" ? "שומנים" : "Fats",
    fiber: language === "he" ? "סיבים תזונתיים" : "Dietary Fiber",
    sugars: language === "he" ? "סוכרים" : "Sugars",
    sodium: language === "he" ? "נתרן" : "Sodium",
    hydration: language === "he" ? "רמת הידרציה" : "Hydration Level",
    kcal: language === "he" ? 'קק"ל' : "kcal",
    g: language === "he" ? "גר׳" : "g",
    mg: language === "he" ? 'מ"ג' : "mg",
    ml: language === "he" ? 'מ"ל' : "ml",
    percent: "%",
    score: language === "he" ? "ניקוד" : "score",
    meals: language === "he" ? "ארוחות" : "meals",
    hours: language === "he" ? "שעות" : "hours",
    increaseIntake: language === "he" ? "הגדל צריכה" : "Increase intake",
    decreaseIntake: language === "he" ? "הפחת צריכה" : "Decrease intake",
    maintainLevel: language === "he" ? "שמור על הרמה" : "Maintain level",
    consultDoctor: language === "he" ? "התייעץ עם רופא" : "Consult doctor",
    addSupplement:
      language === "he" ? "שקול תוסף תזונה" : "Consider supplement",
    improveHydration: language === "he" ? "שפר הידרציה" : "Improve hydration",
    balanceMeals:
      language === "he" ? "איזן זמני ארוחות" : "Balance meal timing",
    increaseFiber:
      language === "he" ? "הוסף סיבים תזונתיים" : "Add fiber sources",
    reduceSodium: language === "he" ? "הפחת נתרן" : "Reduce sodium",
    addOmega3:
      language === "he" ? "הוסף מקורות אומגה 3" : "Add omega-3 sources",
    insightTitle:
      language === "he"
        ? "תובנות חכמות מבוססות נתונים"
        : "Smart Data-Driven Insights",
    noDataMessage:
      language === "he"
        ? "אין נתונים זמינים לתקופה זו"
        : "No data available for this period",
    loadingMessage: language === "he" ? "טוען נתונים..." : "Loading data...",
    errorMessage:
      language === "he" ? "שגיאה בטעינת הנתונים" : "Error loading data",
    retryButton: language === "he" ? "נסה שוב" : "Retry",
  };

  // Fetch statistics data from API
  const fetchStatistics = async (period: "today" | "week" | "month") => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📊 Fetching statistics for period: ${period}`);
      const response = await api.get(`/statistics?period=${period}`);

      console.log("📊 Raw statistics response:", response.data);

      if (response.data.success && response.data.data) {
        setStatisticsData(response.data.data);
        console.log(`✅ Statistics loaded successfully:`, response.data.data);
      } else {
        console.warn("⚠️ Statistics response unsuccessful or no data");
        setError(response.data.message || "No statistics data available");
      }
    } catch (err: any) {
      console.error("❌ Error fetching statistics:", err);
      console.error("❌ Error details:", err.response?.data);
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
    if (!statisticsData) {
      console.warn("⚠️ No statistics data available for metrics generation");
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
        name: texts.totalCalories,
        nameEn: "Total Calories",
        value: statisticsData.averageCalories || 0,
        target: 1800,
        unit: texts.kcal,
        icon: <Flame size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "macros" as const,
        description:
          language === "he"
            ? "צריכת קלוריות יומית כוללת"
            : "Total daily calorie intake",
        trend: calculateTrend(statisticsData.averageCalories || 0, 1800),
        weeklyAverage: statisticsData.averageCalories || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageCalories || 0,
          statisticsData.averageCalories || 0
        ),
      },
      {
        id: "protein",
        name: texts.protein,
        nameEn: "Protein",
        value: statisticsData.averageProtein || 0,
        target: 120,
        unit: texts.g,
        icon: <Zap size={20} color="#9B59B6" />,
        color: "#9B59B6",
        category: "macros" as const,
        description:
          language === "he"
            ? "חלבון לבניית שרירים ותיקון רקמות"
            : "Protein for muscle building and tissue repair",
        trend: calculateTrend(statisticsData.averageProtein || 0, 120),
        weeklyAverage: statisticsData.averageProtein || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageProtein || 0,
          statisticsData.averageProtein || 0
        ),
      },
      {
        id: "carbs",
        name: texts.carbohydrates,
        nameEn: "Carbohydrates",
        value: statisticsData.averageCarbs || 0,
        target: 225,
        unit: texts.g,
        icon: <Wheat size={20} color="#F39C12" />,
        color: "#F39C12",
        category: "macros" as const,
        description:
          language === "he"
            ? "פחמימות לאנרגיה ותפקוד המוח"
            : "Carbohydrates for energy and brain function",
        trend: calculateTrend(statisticsData.averageCarbs || 0, 225),
        weeklyAverage: statisticsData.averageCarbs || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageCarbs || 0,
          statisticsData.averageCarbs || 0
        ),
      },
      {
        id: "fats",
        name: texts.fats,
        nameEn: "Fats",
        value: statisticsData.averageFats || 0,
        target: 70,
        unit: texts.g,
        icon: <Fish size={20} color="#16A085" />,
        color: "#16A085",
        category: "macros" as const,
        description:
          language === "he"
            ? "שומנים בריאים לתפקוד הורמונלי"
            : "Healthy fats for hormonal function",
        trend: calculateTrend(statisticsData.averageFats || 0, 70),
        weeklyAverage: statisticsData.averageFats || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageFats || 0,
          statisticsData.averageFats || 0
        ),
      },
      {
        id: "fiber",
        name: texts.fiber,
        nameEn: "Fiber",
        value: statisticsData.averageFiber || 0,
        target: 25,
        unit: texts.g,
        icon: <Leaf size={20} color="#27AE60" />,
        color: "#27AE60",
        category: "micros" as const,
        description:
          language === "he"
            ? "סיבים תזונתיים לבריאות העיכול"
            : "Dietary fiber for digestive health",
        recommendation: texts.increaseFiber,
        trend: calculateTrend(statisticsData.averageFiber || 0, 25),
        weeklyAverage: statisticsData.averageFiber || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageFiber || 0,
          statisticsData.averageFiber || 0
        ),
      },
      {
        id: "sugars",
        name: texts.sugars,
        nameEn: "Sugars",
        value: statisticsData.averageSugar || 0,
        target: 50,
        maxTarget: 50,
        unit: texts.g,
        icon: <Apple size={20} color="#E67E22" />,
        color: "#E67E22",
        category: "micros" as const,
        description:
          language === "he"
            ? "סוכרים פשוטים - מומלץ להגביל"
            : "Simple sugars - recommended to limit",
        recommendation: texts.decreaseIntake,
        trend: calculateTrend(statisticsData.averageSugar || 0, 50),
        weeklyAverage: statisticsData.averageSugar || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageSugar || 0,
          statisticsData.averageSugar || 0
        ),
      },
      {
        id: "sodium",
        name: texts.sodium,
        nameEn: "Sodium",
        value: statisticsData.averageSodium || 0,
        target: 2300,
        maxTarget: 2300,
        unit: texts.mg,
        icon: <Shield size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "micros" as const,
        description:
          language === "he"
            ? "נתרן - חשוב להגביל למניעת יתר לחץ דם"
            : "Sodium - important to limit to prevent hypertension",
        recommendation: texts.reduceSodium,
        trend: calculateTrend(statisticsData.averageSodium || 0, 2300),
        weeklyAverage: statisticsData.averageSodium || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageSodium || 0,
          statisticsData.averageSodium || 0
        ),
      },
      {
        id: "hydration",
        name: texts.hydration,
        nameEn: "Hydration",
        value: statisticsData.averageFluids || 0,
        target: 2500,
        unit: texts.ml,
        icon: <Droplets size={20} color="#3498DB" />,
        color: "#3498DB",
        category: "lifestyle" as const,
        description:
          language === "he" ? "רמת הידרציה יומית" : "Daily hydration level",
        recommendation: texts.improveHydration,
        trend: calculateTrend(statisticsData.averageFluids || 0, 2500),
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

  // Generate weekly progress data from real API data
  const generateWeeklyData = (): ProgressData[] => {
    if (
      !statisticsData?.dailyBreakdown ||
      statisticsData.dailyBreakdown.length === 0
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
    }));
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
      icon: achievement.icon || getAchievementIcon(achievement.category),
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

  // Generate badges from real API data
  const generateBadges = (): Badge[] => {
    if (!statisticsData?.badges) return [];

    return statisticsData.badges.map((badge: any) => ({
      id: badge.id,
      name: badge.name,
      icon: getBadgeIcon(badge.name),
      color: getBadgeColor(badge.rarity),
      earnedDate: new Date(badge.earned_date).toLocaleDateString(),
      rarity: badge.rarity.toLowerCase(),
    }));
  };

  // Helper functions for icons and colors (existing ones)
  const getBadgeIcon = (name: string) => {
    if (
      name.toLowerCase().includes("water") ||
      name.toLowerCase().includes("מים")
    ) {
      return <Droplets size={20} color="#3498DB" />;
    } else if (
      name.toLowerCase().includes("protein") ||
      name.toLowerCase().includes("חלבון")
    ) {
      return <Zap size={20} color="#9B59B6" />;
    } else if (
      name.toLowerCase().includes("streak") ||
      name.toLowerCase().includes("רצף")
    ) {
      return <Flame size={20} color="#E74C3C" />;
    } else {
      return <Star size={20} color="#F39C12" />;
    }
  };

  const getBadgeColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "#95A5A6";
      case "rare":
        return "#3498DB";
      case "epic":
        return "#9B59B6";
      case "legendary":
        return "#F39C12";
      default:
        return "#95A5A6";
    }
  };

  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  // Update metrics when data changes
  useEffect(() => {
    if (statisticsData) {
      setMetrics(generateNutritionMetrics());
      setWeeklyData(generateWeeklyData());
      setAchievements(generateAchievements());
      setBadges(generateBadges());
    }
  }, [statisticsData]);

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
    { key: "today", label: texts.today },
    { key: "week", label: texts.week },
    { key: "month", label: texts.month },
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

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "happy":
        return <Smile size={16} color="#2ECC71" />;
      case "neutral":
        return <Meh size={16} color="#F39C12" />;
      case "sad":
        return <Frown size={16} color="#E74C3C" />;
      default:
        return <Meh size={16} color="#95A5A6" />;
    }
  };

  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case "high":
        return <Battery size={16} color="#2ECC71" />;
      case "medium":
        return <Battery size={16} color="#F39C12" />;
      case "low":
        return <Battery size={16} color="#E74C3C" />;
      default:
        return <Battery size={16} color="#95A5A6" />;
    }
  };

  const getAlertsData = () => {
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
            ? texts.consultDoctor
            : texts.maintainLevel),
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
    const level = Math.floor(totalPoints / 1000) + 1;
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

  // Calculate wellbeing insights
  const calculateWellbeingInsights = () => {
    if (!statisticsData) {
      return {
        happyDays: 0,
        highEnergyDays: 0,
        satisfiedDays: 0,
        averageMealQuality: "3.0",
        totalDays: 0,
      };
    }

    return {
      happyDays: statisticsData.happyDays || 0,
      highEnergyDays: statisticsData.highEnergyDays || 0,
      satisfiedDays: statisticsData.satisfiedDays || 0,
      averageMealQuality: (statisticsData.averageMealQuality || 3).toFixed(1),
      totalDays: statisticsData.totalDays || 0,
    };
  };

  const categorizedMetrics = {
    macros: metrics.filter((m) => m.category === "macros"),
    micros: metrics.filter((m) => m.category === "micros"),
    lifestyle: metrics.filter((m) => m.category === "lifestyle"),
    quality: metrics.filter((m) => m.category === "quality"),
  };

  const progressStats = calculateProgressStats();
  const gamificationStats = calculateGamificationStats();
  const wellbeingInsights = calculateWellbeingInsights();

  const renderMetricCard = (metric: NutritionMetric) => (
    <TouchableOpacity
      key={metric.id}
      style={styles.metricCard}
      onPress={() => Alert.alert(metric.name, metric.description)}
    >
      <LinearGradient
        colors={[`${metric.color}15`, `${metric.color}05`]}
        style={styles.metricGradient}
      >
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
                {texts[metric.status]}
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
            <LinearGradient
              colors={[metric.color, `${metric.color}80`]}
              style={[
                styles.metricProgressFill,
                { width: `${Math.min(metric.percentage, 100)}%` },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {metric.recommendation && (
          <View style={styles.metricRecommendation}>
            <Sparkles size={12} color={metric.color} />
            <Text style={styles.metricRecommendationText}>
              {metric.recommendation}
            </Text>
          </View>
        )}
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
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{texts.errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>{texts.retryButton}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.title}>{texts.title}</Text>
            <Text style={styles.subtitle}>{texts.subtitle}</Text>
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
            <Text style={styles.noDataText}>{texts.noDataMessage}</Text>
          </View>
        )}

        {/* Main Content */}
        {statisticsData && (
          <>
            {/* Gamification Dashboard */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.gamification}</Text>
              <View style={styles.gamificationContainer}>
                <LinearGradient
                  colors={["#9B59B615", "#9B59B605"]}
                  style={styles.gamificationGradient}
                >
                  <View style={styles.levelContainer}>
                    <View style={styles.levelInfo}>
                      <View style={styles.levelIcon}>
                        <Crown size={32} color="#F39C12" />
                      </View>
                      <View style={styles.levelDetails}>
                        <Text style={styles.levelText}>
                          {texts.level} {gamificationStats.level}
                        </Text>
                        <Text style={styles.xpText}>
                          {gamificationStats.currentXP} /{" "}
                          {gamificationStats.nextLevelXP} {texts.xp}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.xpProgress}>
                      <View style={styles.xpProgressBg}>
                        <LinearGradient
                          colors={["#F39C12", "#E67E22"]}
                          style={[
                            styles.xpProgressFill,
                            { width: `${gamificationStats.xpProgress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.xpToNext}>
                        {gamificationStats.xpToNext} {texts.nextLevel}
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
                        {texts.dailyStreak}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <Calendar size={20} color="#3498DB" />
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.weeklyStreak}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {texts.weeklyStreak}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <Star size={20} color="#F39C12" />
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.perfectDays}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {texts.perfectDays}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <Trophy size={20} color="#16A085" />
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.totalPoints.toLocaleString()}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {texts.totalPoints}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Achievements & Badges */}
            <View style={styles.section}>
              <View style={styles.achievementsHeader}>
                <Text style={styles.sectionTitle}>{texts.achievements}</Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAchievements(true)}
                >
                  <Text style={styles.viewAllText}>
                    {texts.viewAllAchievements}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.achievementsContainer}>
                {achievements.slice(0, 3).map((achievement) => (
                  <View key={achievement.id} style={styles.achievementCard}>
                    <LinearGradient
                      colors={
                        achievement.unlocked
                          ? getAchievementGradientColors(achievement.rarity)
                          : ["#E9ECEF15", "#E9ECEF05"]
                      }
                      style={styles.achievementGradient}
                    >
                      <View style={styles.achievementContent}>
                        <View
                          style={[
                            styles.achievementIcon,
                            {
                              backgroundColor: achievement.unlocked
                                ? `${achievement.color}20`
                                : "#E9ECEF",
                            },
                          ]}
                        >
                          {getAchievementIcon(
                            achievement.icon,
                            24,
                            achievement.color
                          )}
                        </View>
                        <View style={styles.achievementInfo}>
                          <Text style={styles.achievementTitle}>
                            {typeof achievement.title === "object"
                              ? achievement.title[language] ||
                                achievement.title.en
                              : achievement.title}
                          </Text>
                          <Text style={styles.achievementDescription}>
                            {typeof achievement.description === "object"
                              ? achievement.description[language] ||
                                achievement.description.en
                              : achievement.description}
                          </Text>
                          <View style={styles.achievementMeta}>
                            <View style={styles.achievementProgress}>
                              <View style={styles.achievementProgressBg}>
                                <View
                                  style={[
                                    styles.achievementProgressFill,
                                    {
                                      width: `${
                                        achievement.unlocked
                                          ? 100
                                          : (achievement.progress /
                                              (achievement.maxProgress || 1)) *
                                            100
                                      }%`,
                                      backgroundColor: achievement.color,
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={styles.achievementProgressText}>
                                {achievement.progress}/
                                {achievement.maxProgress || 1}
                              </Text>
                            </View>
                            <View style={styles.achievementReward}>
                              <Text
                                style={[
                                  styles.xpReward,
                                  { color: achievement.color },
                                ]}
                              >
                                +{achievement.xpReward} XP
                              </Text>
                              <Text
                                style={[
                                  styles.rarityText,
                                  { color: achievement.color },
                                ]}
                              >
                                {achievement.rarity}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {achievement.unlocked && (
                          <View style={styles.achievementBadge}>
                            <CheckCircle size={20} color={achievement.color} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>

              <View style={styles.badgesContainer}>
                <Text style={styles.badgesTitle}>{texts.badges}</Text>
                <View style={styles.badgesGrid}>
                  {badges.map((badge) => (
                    <View key={badge.id} style={styles.badgeCard}>
                      <LinearGradient
                        colors={[
                          `${getRarityColor(badge.rarity)}15`,
                          `${getRarityColor(badge.rarity)}05`,
                        ]}
                        style={styles.badgeGradient}
                      >
                        <View
                          style={[
                            styles.badgeIcon,
                            { backgroundColor: `${badge.color}20` },
                          ]}
                        >
                          {badge.icon}
                        </View>
                        <Text style={styles.badgeName}>{badge.name}</Text>
                        <Text style={styles.badgeDate}>{badge.earnedDate}</Text>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Wellbeing Analysis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.wellbeing}</Text>
              <View style={styles.wellbeingContainer}>
                <LinearGradient
                  colors={["#16A08515", "#16A08505"]}
                  style={styles.wellbeingGradient}
                >
                  <View style={styles.wellbeingStats}>
                    <View style={styles.wellbeingStatItem}>
                      <View style={styles.wellbeingStatIcon}>
                        <Smile size={20} color="#2ECC71" />
                      </View>
                      <Text style={styles.wellbeingStatValue}>
                        {wellbeingInsights.happyDays}/
                        {wellbeingInsights.totalDays}
                      </Text>
                      <Text style={styles.wellbeingStatLabel}>
                        {texts.mood}
                      </Text>
                    </View>

                    <View style={styles.wellbeingStatItem}>
                      <View style={styles.wellbeingStatIcon}>
                        <Battery size={20} color="#F39C12" />
                      </View>
                      <Text style={styles.wellbeingStatValue}>
                        {wellbeingInsights.highEnergyDays}/
                        {wellbeingInsights.totalDays}
                      </Text>
                      <Text style={styles.wellbeingStatLabel}>
                        {texts.energy}
                      </Text>
                    </View>

                    <View style={styles.wellbeingStatItem}>
                      <View style={styles.wellbeingStatIcon}>
                        <Heart size={20} color="#E74C3C" />
                      </View>
                      <Text style={styles.wellbeingStatValue}>
                        {wellbeingInsights.satisfiedDays}/
                        {wellbeingInsights.totalDays}
                      </Text>
                      <Text style={styles.wellbeingStatLabel}>
                        {texts.satiety}
                      </Text>
                    </View>

                    <View style={styles.wellbeingStatItem}>
                      <View style={styles.wellbeingStatIcon}>
                        <Star size={20} color="#9B59B6" />
                      </View>
                      <Text style={styles.wellbeingStatValue}>
                        {wellbeingInsights.averageMealQuality}/5
                      </Text>
                      <Text style={styles.wellbeingStatLabel}>
                        {texts.mealQuality}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.wellbeingChart}>
                    <Text style={styles.wellbeingChartTitle}>
                      {language === "he"
                        ? "מצב רוח ואנרגיה השבוע"
                        : "Mood and Energy This Week"}
                    </Text>
                    <View style={styles.wellbeingChartBars}>
                      {weeklyData.map((day, index) => (
                        <View key={index} style={styles.wellbeingDayContainer}>
                          <View style={styles.wellbeingDayIcons}>
                            {getMoodIcon(day.mood || "neutral")}
                            {getEnergyIcon(day.energy || "medium")}
                          </View>
                          <Text style={styles.wellbeingDayLabel}>
                            {new Date(day.date).getDate()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Progress Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.progressOverview}</Text>
              <View style={styles.progressOverviewContainer}>
                <LinearGradient
                  colors={["#16A08515", "#16A08505"]}
                  style={styles.progressOverviewGradient}
                >
                  <View style={styles.progressStatsGrid}>
                    <View style={styles.progressStatItem}>
                      <View style={styles.progressStatIcon}>
                        <CheckCircle size={20} color="#2ECC71" />
                      </View>
                      <Text style={styles.progressStatValue}>
                        {progressStats.successfulDays}/{progressStats.totalDays}
                      </Text>
                      <Text style={styles.progressStatLabel}>
                        {texts.successfulDays}
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
                        {texts.averageCompletion}
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
                        {texts.bestStreak}
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
                        {texts.currentStreak}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Weekly Progress Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.weeklyProgress}</Text>
              <View style={styles.chartContainer}>
                <LinearGradient
                  colors={["#16A08510", "#16A08505"]}
                  style={styles.chartGradient}
                >
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>{texts.totalCalories}</Text>
                    <Text style={styles.chartSubtitle}>7 {texts.days}</Text>
                  </View>

                  <View style={styles.chartBars}>
                    {weeklyData.map((day, index) => {
                      const maxCalories = Math.max(
                        ...weeklyData.map((d) => d.calories)
                      );
                      const percentage =
                        maxCalories > 0
                          ? (day.calories / maxCalories) * 100
                          : 0;
                      return (
                        <View key={index} style={styles.chartBarContainer}>
                          <View style={styles.chartBarBackground}>
                            <LinearGradient
                              colors={["#16A085", "#1ABC9C"]}
                              style={[
                                styles.chartBar,
                                { height: `${percentage}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.chartBarLabel}>
                            {new Date(day.date).getDate()}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Alerts Section */}
            {showAlerts && alerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.alertsHeader}>
                  <Text style={styles.sectionTitle}>{texts.alertsTitle}</Text>
                  <TouchableOpacity
                    style={styles.hideAlertsButton}
                    onPress={() => setShowAlerts(false)}
                  >
                    <Text style={styles.hideAlertsText}>
                      {texts.hideAlerts}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.alertsContainer}>
                  {alerts.map((alert) => (
                    <View key={alert.id} style={styles.alertCard}>
                      <LinearGradient
                        colors={
                          alert.severity === "danger"
                            ? ["#E74C3C15", "#E74C3C05"]
                            : ["#E67E2215", "#E67E2205"]
                        }
                        style={styles.alertGradient}
                      >
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
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Macronutrients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.macronutrients}</Text>
              <View style={styles.metricsGrid}>
                {categorizedMetrics.macros.map(renderMetricCard)}
              </View>
            </View>

            {/* Micronutrients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.micronutrients}</Text>
              <View style={styles.metricsGrid}>
                {categorizedMetrics.micros.map(renderMetricCard)}
              </View>
            </View>

            {/* Lifestyle Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.lifestyle}</Text>
              <View style={styles.metricsGrid}>
                {categorizedMetrics.lifestyle.map(renderMetricCard)}
              </View>
            </View>

            {/* Smart Insights Section */}
            <View style={styles.section}>
              <View style={styles.insightsContainer}>
                <LinearGradient
                  colors={["#9B59B615", "#9B59B605"]}
                  style={styles.insightsGradient}
                >
                  <View style={styles.insightsHeader}>
                    <Brain size={24} color="#9B59B6" />
                    <Text style={styles.insightsTitle}>
                      {texts.insightTitle}
                    </Text>
                  </View>
                  <View style={styles.insightsList}>
                    <View style={styles.insightItem}>
                      <Star size={16} color="#F39C12" />
                      <Text style={styles.insightText}>
                        {language === "he"
                          ? `אתה עומד ביעד החלבון ב-${Math.round(
                              (progressStats.averages.protein / 120) * 100
                            )}% מהימים השבוע - מעולה לבניית שרירים!`
                          : `You're meeting protein goals ${Math.round(
                              (progressStats.averages.protein / 120) * 100
                            )}% of days this week - excellent for muscle building!`}
                      </Text>
                    </View>
                    <View style={styles.insightItem}>
                      <TrendingUp size={16} color="#2ECC71" />
                      <Text style={styles.insightText}>
                        {language === "he"
                          ? `צריכת המים שלך עמדה על ${Math.round(
                              progressStats.averages.water
                            )}מ"ל יומית - המשך כך!`
                          : `Your water intake averaged ${Math.round(
                              progressStats.averages.water
                            )}ml daily - keep it up!`}
                      </Text>
                    </View>
                    <View style={styles.insightItem}>
                      <AlertTriangle size={16} color="#E67E22" />
                      <Text style={styles.insightText}>
                        {language === "he"
                          ? "הסיבים התזונתיים נמוכים מהמומלץ - הוסף יותר ירקות וקטניות."
                          : "Dietary fiber is below recommended - add more vegetables and legumes."}
                      </Text>
                    </View>
                    <View style={styles.insightItem}>
                      <Shield size={16} color="#E74C3C" />
                      <Text style={styles.insightText}>
                        {language === "he"
                          ? "רמת הנתרן גבוהה - נסה להפחית מזון מעובד ותבלינים."
                          : "Sodium levels are high - try reducing processed foods and seasonings."}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
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
              <Text style={styles.modalTitle}>{texts.achievements}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <LinearGradient
                    colors={
                      achievement.unlocked
                        ? getAchievementGradientColors(achievement.rarity)
                        : ["#E9ECEF15", "#E9ECEF05"]
                    }
                    style={styles.achievementGradient}
                  >
                    <View style={styles.achievementContent}>
                      <View
                        style={[
                          styles.achievementIcon,
                          {
                            backgroundColor: achievement.unlocked
                              ? `${achievement.color}20`
                              : "#E9ECEF",
                          },
                        ]}
                      >
                        {getAchievementIcon(
                          achievement.icon,
                          24,
                          achievement.color
                        )}
                      </View>
                      <View style={styles.achievementInfo}>
                        <Text style={styles.achievementTitle}>
                          {typeof achievement.title === "object"
                            ? achievement.title.en
                            : achievement.title}
                        </Text>
                        <Text style={styles.achievementDescription}>
                          {typeof achievement.description === "object"
                            ? achievement.description.en
                            : achievement.description}
                        </Text>
                        <View style={styles.achievementProgress}>
                          <View style={styles.achievementProgressBg}>
                            <View
                              style={[
                                styles.achievementProgressFill,
                                {
                                  width: `${
                                    (achievement.progress /
                                      achievement.maxProgress) *
                                    100
                                  }%`,
                                  backgroundColor: achievement.color,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.achievementProgressText}>
                            {achievement.progress}/{achievement.maxProgress}
                          </Text>
                        </View>
                      </View>
                      {achievement.unlocked && (
                        <View style={styles.achievementBadge}>
                          <CheckCircle size={20} color={achievement.color} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 24,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 18,
    color: "#64748B",
    fontWeight: "600",
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
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  gamificationGradient: {
    padding: 24,
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
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 6,
    overflow: "hidden",
  },
  xpProgressFill: {
    height: "100%",
    borderRadius: 6,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    borderTopColor: "rgba(255, 255, 255, 0.2)",
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
    shadowColor: "#16A085",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    overflow: "hidden",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  achievementGradient: {
    padding: 20,
  },
  achievementContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: "500",
  },
  achievementMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  achievementProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 16,
  },
  achievementProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  achievementProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  achievementProgressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    minWidth: 40,
  },
  achievementReward: {
    alignItems: "flex-end",
  },
  xpReward: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  achievementBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Enhanced Badges
  badgesContainer: {
    marginTop: 24,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: (width - 84) / 4,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  badgeGradient: {
    padding: 16,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  badgeDate: {
    fontSize: 9,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "500",
  },

  // Enhanced Wellbeing
  wellbeingContainer: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  wellbeingGradient: {
    padding: 24,
  },
  wellbeingStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  wellbeingStatItem: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  wellbeingStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  wellbeingStatValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  wellbeingStatLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  wellbeingChart: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
    paddingTop: 24,
  },
  wellbeingChartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  wellbeingChartBars: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  wellbeingDayContainer: {
    alignItems: "center",
    paddingHorizontal: 4,
  },
  wellbeingDayIcons: {
    flexDirection: "column",
    gap: 6,
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 8,
    borderRadius: 12,
  },
  wellbeingDayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  // Enhanced Progress Overview
  progressOverviewContainer: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  progressOverviewGradient: {
    padding: 24,
  },
  progressStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  progressStatItem: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  progressStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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

  // Enhanced Chart
  chartContainer: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  chartGradient: {
    padding: 24,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    paddingHorizontal: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 3,
  },
  chartBarBackground: {
    width: "85%",
    height: 100,
    justifyContent: "flex-end",
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },
  chartBar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 8,
    shadowColor: "#16A085",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chartBarLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  alertGradient: {
    padding: 20,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  metricGradient: {
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
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
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 5,
    overflow: "hidden",
  },
  metricProgressFill: {
    height: "100%",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  metricRecommendation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  metricRecommendationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.1,
  },

  // Enhanced Insights
  insightsContainer: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  insightsGradient: {
    padding: 24,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 16,
    letterSpacing: -0.3,
  },
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  insightText: {
    fontSize: 15,
    color: "#0F172A",
    marginLeft: 16,
    flex: 1,
    lineHeight: 22,
    fontWeight: "500",
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

  // Additional helper styles
  divider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    marginVertical: 16,
  },

  cardShadow: {
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },

  textPrimary: {
    color: "#0F172A",
  },

  textSecondary: {
    color: "#64748B",
  },
});

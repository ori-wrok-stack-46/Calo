import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ColorValue,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  Line,
  Rect,
} from "react-native-svg";
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
  Dumbbell as DumbbellIcon,
  Activity,
  ChartPie as PieChart,
  Download,
  Lock,
  ChevronRight,
  Gem,
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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { ToastService } from "@/src/services/totastService"; // Assuming ToastService is available
import { useQuery } from "@tanstack/react-query";

const { width, height } = Dimensions.get("window");
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 200;

// Custom Chart Components
const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 12,
  color = "#16A085",
  backgroundColor = "#F1F5F9",
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Circle
          stroke={backgroundColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        {children}
      </View>
    </View>
  );
};

const WeeklyProgressChart = ({
  data,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
}) => {
  if (!data || data.length === 0) return null;

  const maxCalories =
    Math.max(...data.map((d: { calories: any }) => d.calories)) || 1;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const xStep = chartWidth / (data.length - 1 || 1);

  const pathData = data
    .map((item: { calories: number }, index: number) => {
      const x = padding + index * xStep;
      const y =
        padding + chartHeight - (item.calories / maxCalories) * chartHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Weekly Calorie Progress</Text>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + chartHeight * ratio;
          return (
            <Line
              key={index}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#F1F5F9"
              strokeWidth={1}
            />
          );
        })}

        {/* Chart line */}
        <Path
          d={pathData}
          stroke="#16A085"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map(
          (item: { calories: number }, index: React.Key | null | undefined) => {
            const x = padding + index * xStep;
            const y =
              padding +
              chartHeight -
              (item.calories / maxCalories) * chartHeight;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={4}
                fill="#16A085"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            );
          }
        )}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, index) => {
          const value = Math.round(maxCalories * (1 - ratio));
          const y = padding + chartHeight * ratio;
          return (
            <SvgText
              key={index}
              x={padding - 10}
              y={y + 4}
              fontSize="12"
              fill="#64748B"
              textAnchor="end"
            >
              {value}
            </SvgText>
          );
        })}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.chartXLabels}>
        {data.map(
          (
            item: { date: string | number | Date },
            index: React.Key | null | undefined
          ) => (
            <Text key={index} style={styles.chartXLabel}>
              {new Date(item.date).toLocaleDateString("en", {
                weekday: "short",
              })}
            </Text>
          )
        )}
      </View>
    </View>
  );
};

const MacronutrientChart = ({ metrics, width = CHART_WIDTH }) => {
  const macros = metrics.filter(
    (m: { category: string }) => m.category === "macros"
  );
  if (macros.length === 0) return null;

  const total =
    macros.reduce((sum: any, macro: { value: any }) => sum + macro.value, 0) ||
    1;
  let currentAngle = 0;
  const radius = 80;
  const centerX = width / 2;
  const centerY = 120;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Macronutrient Distribution</Text>
      <Svg width={width} height={240}>
        {macros.map(
          (
            macro: {
              value: number;
              id: React.Key | null | undefined;
              color: ColorValue | undefined;
            },
            index: any
          ) => {
            const percentage = (macro.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              "Z",
            ].join(" ");

            currentAngle += angle;

            return (
              <Path
                key={macro.id}
                d={pathData}
                fill={macro.color}
                opacity={0.8}
              />
            );
          }
        )}
      </Svg>

      <View style={styles.macroLegend}>
        {macros.map(
          (macro: {
            id: React.Key | null | undefined;
            color: any;
            nameEn:
              | string
              | number
              | bigint
              | boolean
              | React.ReactElement<
                  unknown,
                  string | React.JSXElementConstructor<any>
                >
              | Iterable<React.ReactNode>
              | React.ReactPortal
              | Promise<
                  | string
                  | number
                  | bigint
                  | boolean
                  | React.ReactPortal
                  | React.ReactElement<
                      unknown,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | null
                  | undefined
                >
              | null
              | undefined;
            value: number;
          }) => (
            <View key={macro.id} style={styles.macroLegendItem}>
              <View
                style={[
                  styles.macroLegendColor,
                  { backgroundColor: macro.color },
                ]}
              />
              <Text style={styles.macroLegendText}>
                {macro.nameEn}: {macro.value.toFixed(1)}g
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
};

const ProgressBarChart = ({ metrics, width = CHART_WIDTH }) => {
  const displayMetrics = metrics.slice(0, 6); // Limit to prevent overflow
  if (displayMetrics.length === 0) return null;

  const barHeight = 24;
  const barSpacing = 40;
  const chartHeight = displayMetrics.length * barSpacing + 40;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Goal Progress Overview</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={Math.max(width, 300)} height={chartHeight}>
          {displayMetrics.map(
            (
              metric: {
                percentage:
                  | string
                  | number
                  | bigint
                  | boolean
                  | React.ReactElement<
                      unknown,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactPortal
                      | React.ReactElement<
                          unknown,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined;
                id: React.Key | null | undefined;
                color: ColorValue | undefined;
                nameEn:
                  | string
                  | number
                  | bigint
                  | boolean
                  | React.ReactElement<
                      unknown,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactPortal
                      | React.ReactElement<
                          unknown,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined;
              },
              index: number
            ) => {
              const y = 20 + index * barSpacing;
              const barWidth = Math.min(width - 120, 200);
              const fillWidth = (metric.percentage / 100) * barWidth;

              return (
                <React.Fragment key={metric.id}>
                  {/* Background bar */}
                  <Rect
                    x={100}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="#F1F5F9"
                    rx={12}
                  />

                  {/* Progress bar */}
                  <Rect
                    x={100}
                    y={y}
                    width={fillWidth}
                    height={barHeight}
                    fill={metric.color}
                    rx={12}
                  />

                  {/* Label */}
                  <SvgText
                    x={95}
                    y={y + barHeight / 2 + 4}
                    fontSize="12"
                    fill="#64748B"
                    textAnchor="end"
                  >
                    {metric.nameEn.length > 8
                      ? metric.nameEn.substring(0, 8) + "..."
                      : metric.nameEn}
                  </SvgText>

                  {/* Percentage */}
                  <SvgText
                    x={100 + barWidth + 10}
                    y={y + barHeight / 2 + 4}
                    fontSize="12"
                    fill="#0F172A"
                    fontWeight="600"
                  >
                    {metric.percentage}%
                  </SvgText>
                </React.Fragment>
              );
            }
          )}
        </Svg>
      </ScrollView>
    </View>
  );
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
  const [error, setError] = useState<string | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(
    null
  );
  const [userQuestionnaire, setUserQuestionnaire] =
    useState<UserQuestionnaire | null>(null);
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementDetail, setShowAchievementDetail] = useState(false);
  const [newAchievementModal, setNewAchievementModal] = useState<{
    show: boolean;
    achievement: Achievement | null;
  }>({ show: false, achievement: null });

  // Fetch statistics data from API
  const fetchStatistics = async (period: "today" | "week" | "month") => {
    setError(null); // Clear previous errors

    try {
      console.log(`📊 Fetching statistics for period: ${period}`);
      const [statisticsResponse, questionnaireResponse] = await Promise.all([
        api.get(`/statistics?period=${period}`),
        api.get("/questionnaire"),
      ]);

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
        setStatisticsData(null); // Clear data on error
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
      } else {
        setUserQuestionnaire(null); // Clear questionnaire data if not available
      }
    } catch (err: any) {
      console.error("❌ Error fetching statistics:", err);
      setError(err.response?.data?.message || "Failed to load statistics data");
      setStatisticsData(null); // Clear data on error
      setUserQuestionnaire(null); // Clear questionnaire data on error
    }
  };

  // Initialize data
  useEffect(() => {
    fetchStatistics(selectedPeriod);
  }, [selectedPeriod]);

  // Fetch statistics data using react-query
  const {
    data: nutritionData,
    isLoading: isNutritionLoading,
    error: nutritionError,
    refetch: refetchNutrition,
  } = useQuery({
    queryKey: ["nutrition-statistics", user?.user_id],
    queryFn: async () => {
      const response = await api.get(`/statistics?period=${selectedPeriod}`);
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch achievements data
  const {
    data: achievementsData,
    isLoading: isAchievementsLoading,
    error: achievementsError,
    refetch: refetchAchievements,
  } = useQuery({
    queryKey: ["achievements", user?.user_id],
    queryFn: async () => {
      const response = await api.get("/statistics/achievements");
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchNutrition(), refetchAchievements()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchNutrition, refetchAchievements]);

  const isLoading = isNutritionLoading || isAchievementsLoading;

  // Generate nutrition data from real API response
  const generateNutritionMetrics = (): NutritionMetric[] => {
    if (!nutritionData?.data || !userQuestionnaire) {
      console.warn(
        "⚠️ No nutrition data or questionnaire available for metrics generation"
      );
      return [];
    }

    console.log(
      "📊 Generating nutrition metrics from data:",
      nutritionData.data
    );

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
        value: nutritionData.data.averageCalories || 0,
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
          nutritionData.data.averageCalories || 0,
          userQuestionnaire.dailyCalories
        ),
        weeklyAverage: nutritionData.data.averageCalories || 0,
        lastWeekChange: calculateWeeklyChange(
          nutritionData.data.averageCalories || 0,
          nutritionData.data.averageCalories || 0 // Assuming this should be previous week's average if available
        ),
      },
      {
        id: "protein",
        name: t("statistics.protein"),
        nameEn: "Protein",
        value: nutritionData.data.averageProtein || 0,
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
          nutritionData.data.averageProtein || 0,
          userQuestionnaire.dailyProtein
        ),
        weeklyAverage: nutritionData.data.averageProtein || 0,
        lastWeekChange: calculateWeeklyChange(
          nutritionData.data.averageProtein || 0,
          nutritionData.data.averageProtein || 0 // Assuming this should be previous week's average if available
        ),
      },
      {
        id: "carbs",
        name: t("statistics.carbohydrates"),
        nameEn: "Carbohydrates",
        value: nutritionData.data.averageCarbs || 0,
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
          nutritionData.data.averageCarbs || 0,
          userQuestionnaire.dailyCarbs
        ),
        weeklyAverage: nutritionData.data.averageCarbs || 0,
        lastWeekChange: calculateWeeklyChange(
          nutritionData.data.averageCarbs || 0,
          nutritionData.data.averageCarbs || 0 // Assuming this should be previous week's average if available
        ),
      },
      {
        id: "fats",
        name: t("statistics.fats"),
        nameEn: "Fats",
        value: nutritionData.data.averageFats || 0,
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
          nutritionData.data.averageFats || 0,
          userQuestionnaire.dailyFats
        ),
        weeklyAverage: nutritionData.data.averageFats || 0,
        lastWeekChange: calculateWeeklyChange(
          nutritionData.data.averageFats || 0,
          nutritionData.data.averageFats || 0 // Assuming this should be previous week's average if available
        ),
      },
      {
        id: "fiber",
        name: t("statistics.fiber"),
        nameEn: "Fiber",
        value: nutritionData.data.averageFiber || 0,
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
          nutritionData.data.averageFiber || 0,
          userQuestionnaire.dailyFiber
        ),
        weeklyAverage: nutritionData.data.averageFiber || 0,
        lastWeekChange: calculateWeeklyChange(
          nutritionData.data.averageFiber || 0,
          nutritionData.data.averageFiber || 0 // Assuming this should be previous week's average if available
        ),
      },
      {
        id: "sugars",
        name: t("statistics.sugars"),
        nameEn: "Sugars",
        value: nutritionData.data.averageSugar || 0,
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
        trend: calculateTrend(nutritionData.data.averageSugar || 0, 50),
        weeklyAverage: nutritionData.data.averageSugar || 0,
        lastWeekChange: calculateWeeklyChange(
          nutritionData.data.averageSugar || 0,
          nutritionData.data.averageSugar || 0 // Assuming this should be previous week's average if available
        ),
      },
      {
        id: "sodium",
        name: t("statistics.sodium"),
        nameEn: "Sodium",
        value: nutritionData.data.averageSodium || 0,
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
        trend: calculateTrend(nutritionData.data.averageSodium || 0, 2300),
        weeklyAverage: nutritionData.data.averageSodium || 0,
        lastWeekChange: calculateWeeklyChange(
          nutritionData.data.averageSodium || 0,
          nutritionData.data.averageSodium || 0 // Assuming this should be previous week's average if available
        ),
      },
      {
        id: "hydration",
        name: t("statistics.hydration"),
        nameEn: "Hydration",
        value: nutritionData.data.averageFluids || 0,
        target: userQuestionnaire.dailyWater,
        unit: t("statistics.ml"),
        icon: <Droplets size={20} color="#3498DB" />,
        color: "#3498DB",
        category: "lifestyle" as const,
        description:
          language === "he" ? "רמת הידרציה יומית" : "Daily hydration level",
        recommendation: t("statistics.increaseIntake"),
        trend: calculateTrend(
          nutritionData.data.averageFluids || 0,
          userQuestionnaire.dailyWater
        ),
        weeklyAverage: nutritionData.data.averageFluids || 0,
        lastWeekChange: calculateWeeklyChange(
          nutritionData.data.averageFluids || 0,
          nutritionData.data.averageFluids || 0 // Assuming this should be previous week's average if available
        ),
      },
    ];

    return baseData.map((metric) => {
      let percentage = 0;
      let status: "excellent" | "good" | "warning" | "danger" = "danger";

      // Handle different calculation logic for limited vs target nutrients
      if (metric.maxTarget) {
        // For nutrients that should be limited (sodium, sugar)
        if (metric.target === 0) {
          percentage = 0;
          status = "excellent";
        } else if (metric.value === 0) {
          percentage = 0;
          status = "excellent";
        } else {
          // Calculate percentage of limit used
          percentage = Math.min((metric.value / metric.target) * 100, 100);

          if (metric.value <= metric.target * 0.5) status = "excellent";
          else if (metric.value <= metric.target * 0.8) status = "good";
          else if (metric.value <= metric.target) status = "warning";
          else status = "danger";
        }
      } else {
        // For nutrients with minimum targets (protein, fiber, etc.)
        if (metric.target === 0) {
          percentage = 0;
          status = "excellent";
        } else if (metric.value === 0) {
          percentage = 0;
          status = "danger";
        } else {
          percentage = Math.min((metric.value / metric.target) * 100, 100);

          if (percentage >= 100) status = "excellent";
          else if (percentage >= 80) status = "good";
          else if (percentage >= 60) status = "warning";
          else status = "danger";
        }
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
      !nutritionData?.data?.dailyBreakdown ||
      nutritionData.data.dailyBreakdown.length === 0 ||
      !userQuestionnaire
    ) {
      return [];
    }

    return nutritionData.data.dailyBreakdown.map((day: any) => ({
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

    // Show warnings only if user has completed their required meals for the day
    // This ensures users see insights only when they've provided sufficient data
    const hasCompletedMeals = todayData
      ? todayData.mealsCount >= todayData.requiredMeals
      : false;

    if (hasCompletedMeals) {
      // Trigger achievement check for meal completion
      checkMealCompletionAchievements(todayData, userQuestionnaire);
    }

    return hasCompletedMeals;
  };

  // Check for meal completion achievements
  const checkMealCompletionAchievements = async (
    todayData: any,
    questionnaire: any
  ) => {
    if (!todayData || !questionnaire) return;

    try {
      // Check if user completed all required meals
      if (todayData.mealsCount >= questionnaire.mealsPerDay) {
        // Check for streak achievements
        const weeklyData = generateWeeklyData();
        const consecutiveDays = calculateConsecutiveMealDays(
          weeklyData,
          questionnaire.mealsPerDay
        );

        if (consecutiveDays >= 7) {
          ToastService.streakAchieved(consecutiveDays);
        }

        // Check daily goal completion
        ToastService.goalCompleted("daily meal");

        // Update statistics to reflect achievement
        await refetchNutrition();
      }
    } catch (error) {
      console.error("Error checking meal achievements:", error);
    }
  };

  // Calculate consecutive days of meeting meal goals
  const calculateConsecutiveMealDays = (
    weeklyData: any[],
    requiredMeals: number
  ): number => {
    let consecutive = 0;
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      if (weeklyData[i].mealsCount >= requiredMeals) {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  };

  // Generate achievements from real API data
  const generateAchievements = (): Achievement[] => {
    if (!achievementsData?.data || !Array.isArray(achievementsData.data)) {
      console.warn("⚠️ No achievement data available or invalid format");
      return [];
    }

    console.log(
      "📊 Processing achievements data:",
      achievementsData.data.length,
      "achievements found"
    );

    return achievementsData.data.map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title || { en: "Achievement", he: "הישג" },
      description: achievement.description || {
        en: "Description",
        he: "תיאור",
      },
      icon: achievement.icon || "trophy",
      color: getRarityColor(achievement.rarity || "COMMON"),
      progress: achievement.progress || 0,
      maxProgress: achievement.maxProgress || achievement.max_progress || 1,
      unlocked: achievement.unlocked || false,
      category: achievement.category || "MILESTONE",
      xpReward: achievement.xpReward || achievement.points_awarded || 0,
      rarity: achievement.rarity || "COMMON",
      unlockedDate: achievement.unlockedDate || achievement.unlocked_date,
    }));
  };

  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Update metrics and achievements when data changes
  useEffect(() => {
    if (nutritionData?.data && userQuestionnaire) {
      setMetrics(generateNutritionMetrics());
      setWeeklyData(generateWeeklyData());
    }
    if (achievementsData?.data) {
      setAchievements(generateAchievements());
    }
  }, [nutritionData, achievementsData, userQuestionnaire]);

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

  // Handle achievement press
  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowAchievementDetail(true);
  };

  // Enhanced Achievement Card Component
  const EnhancedAchievementCard = React.memo(
    ({
      achievement,
      onPress,
      language,
    }: {
      achievement: Achievement;
      onPress: (achievement: Achievement) => void;
      language: string;
    }) => {
      const scaleValue = useRef(new Animated.Value(1)).current;
      const glowValue = useRef(new Animated.Value(0)).current;

      useEffect(() => {
        if (achievement.unlocked) {
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(glowValue, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }
      }, [achievement.unlocked]);

      const handlePressIn = () => {
        Animated.spring(scaleValue, {
          toValue: 0.95,
          useNativeDriver: true,
        }).start();
      };

      const handlePressOut = () => {
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      };

      const progressPercentage = Math.min(
        (achievement.progress / (achievement.maxProgress || 1)) * 100,
        100
      );

      return (
        <Animated.View
          style={[
            styles.enhancedAchievementCard,
            {
              transform: [{ scale: scaleValue }],
              backgroundColor: achievement.unlocked ? "#FFFFFF" : "#F9FAFB",
              borderColor: achievement.unlocked
                ? `${getRarityColor(achievement.rarity)}40`
                : "#E5E7EB",
              shadowColor: achievement.unlocked
                ? getRarityColor(achievement.rarity)
                : "#000",
              shadowOpacity: achievement.unlocked ? 0.15 : 0.05,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => onPress(achievement)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.enhancedAchievementCardContent}
            activeOpacity={0.8}
          >
            {/* Glow Effect for Unlocked Achievements */}
            {achievement.unlocked && (
              <Animated.View
                style={[
                  styles.achievementGlow,
                  {
                    opacity: glowValue,
                    backgroundColor: `${getRarityColor(achievement.rarity)}10`,
                  },
                ]}
              />
            )}

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: achievement.unlocked ? "#10B981" : "#6B7280",
                },
              ]}
            >
              {achievement.unlocked ? (
                <CheckCircle size={12} color="#FFFFFF" />
              ) : (
                <Lock size={12} color="#FFFFFF" />
              )}
            </View>

            {/* Achievement Icon */}
            <View
              style={[
                styles.enhancedAchievementIcon,
                {
                  backgroundColor: achievement.unlocked
                    ? `${getRarityColor(achievement.rarity)}15`
                    : "#F3F4F6",
                },
              ]}
            >
              {getAchievementIcon(
                achievement.icon,
                32,
                achievement.unlocked
                  ? getRarityColor(achievement.rarity)
                  : "#9CA3AF"
              )}
            </View>

            {/* Achievement Content */}
            <View style={styles.enhancedAchievementContent}>
              <Text
                style={[
                  styles.enhancedAchievementTitle,
                  { color: achievement.unlocked ? "#111827" : "#6B7280" },
                ]}
                numberOfLines={2}
              >
                {typeof achievement.title === "object"
                  ? achievement.title[language] || achievement.title.en
                  : achievement.title}
              </Text>

              <Text
                style={[
                  styles.enhancedAchievementDescription,
                  { color: achievement.unlocked ? "#374151" : "#9CA3AF" },
                ]}
                numberOfLines={2}
              >
                {typeof achievement.description === "object"
                  ? achievement.description[language] ||
                    achievement.description.en
                  : achievement.description}
              </Text>

              {/* Progress Section */}
              <View style={styles.enhancedProgressSection}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>
                    {achievement.progress}/{achievement.maxProgress || 1}
                  </Text>
                  <Text
                    style={[
                      styles.xpBadge,
                      {
                        color: achievement.unlocked
                          ? getRarityColor(achievement.rarity)
                          : "#6B7280",
                      },
                    ]}
                  >
                    +{achievement.xpReward} XP
                  </Text>
                </View>

                <View style={styles.enhancedProgressBar}>
                  <View
                    style={[
                      styles.enhancedProgressFill,
                      {
                        width: `${progressPercentage}%`,
                        backgroundColor: achievement.unlocked
                          ? getRarityColor(achievement.rarity)
                          : "#D1D5DB",
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.rarityBadgeText,
                    {
                      color: achievement.unlocked
                        ? getRarityColor(achievement.rarity)
                        : "#6B7280",
                    },
                  ]}
                >
                  {achievement.rarity}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }
  );

  // Calculate progress statistics
  const calculateProgressStats = () => {
    if (!nutritionData?.data) {
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
      calories: Math.round(nutritionData.data.averageCalories || 0),
      protein: Math.round(nutritionData.data.averageProtein || 0),
      carbs: Math.round(nutritionData.data.averageCarbs || 0),
      fats: Math.round(nutritionData.data.averageFats || 0),
      water: Math.round(nutritionData.data.averageFluids || 0),
    };

    return {
      totalDays: nutritionData.data.totalDays || 0,
      successfulDays: nutritionData.data.successfulDays || 0,
      averageCompletion: Math.round(nutritionData.data.averageCompletion || 0),
      bestStreak: nutritionData.data.bestStreak || 0,
      currentStreak: nutritionData.data.currentStreak || 0,
      averages,
    };
  };

  // Calculate gamification stats from real data
  const calculateGamificationStats = () => {
    if (!nutritionData?.data) {
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

    const totalPoints = nutritionData.data.totalPoints || 0;
    // Use the same level calculation as the server: level starts at 1, every 1000 XP = 1 level
    const level = Math.max(1, Math.floor(totalPoints / 1000) + 1);
    const currentXP = totalPoints % 1000;
    const nextLevelXP = 1000;
    const dailyStreak = nutritionData.data.currentStreak || 0;
    const weeklyStreak = nutritionData.data.weeklyStreak || 0;
    const perfectDays = nutritionData.data.perfectDays || 0;

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
            <Text style={styles.metricName} numberOfLines={1}>
              {metric.name}
            </Text>
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
            <Text style={styles.metricValueText} numberOfLines={1}>
              {metric.value.toLocaleString()} {metric.unit}
            </Text>
            <Text style={styles.metricTargetText} numberOfLines={1}>
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
            <Text style={styles.metricRecommendationText} numberOfLines={2}>
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
  if (nutritionError && achievementsError) {
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
    const completionPercentage =
      (todayData.mealsCount / todayData.requiredMeals) * 100;

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

        <View style={styles.mealCompletionContent}>
          <CircularProgress
            percentage={Math.min(completionPercentage, 100)}
            size={100}
            strokeWidth={8}
            color={isCompleted ? "#2ECC71" : "#E67E22"}
          >
            <Text style={styles.mealCompletionText}>
              {todayData.mealsCount}
            </Text>
            <Text style={styles.mealCompletionSubtext}>
              {t("statistics.of")} {todayData.requiredMeals}
            </Text>
          </CircularProgress>

          {!isCompleted && (
            <Text style={styles.mealCompletionMessage}>
              {t("statistics.complete_meals_first")}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // PDF generation function
  const generatePDFFilename = () => {
    const now = new Date();
    const formatDate = (date: Date) => {
      return date
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "-");
    };

    const formatDateRange = (period: string) => {
      const today = new Date();
      let startDate: Date;
      let endDate = today;

      switch (period) {
        case "today":
          return `daily_${formatDate(today)}`;
        case "week":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          return `weekly_${formatDate(startDate)}_to_${formatDate(endDate)}`;
        case "month":
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 1);
          return `monthly_${formatDate(startDate)}_to_${formatDate(endDate)}`;
        default:
          return `statistics_${formatDate(today)}`;
      }
    };

    return `nutrition_statistics_${formatDateRange(selectedPeriod)}.pdf`;
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Mock API call and response for demonstration purposes
      // In a real app, replace this with your actual API call
      console.log("Simulating PDF generation and download...");

      // Simulate fetching data
      const mockHtmlContent = `
        <html>
          <head><title>Mock PDF</title></head>
          <body><h1>Mock PDF Content</h1><p>This is a mock PDF report.</p></body>
        </html>
      `;

      // Simulate PDF creation using expo-print
      const { uri } = await Print.printToFileAsync({
        html: mockHtmlContent,
        base64: false,
        fileName: generatePDFFilename(), // Use the custom filename
      });

      if (!uri) {
        throw new Error("Failed to create PDF file.");
      }

      // Simulate sharing the PDF
      if (
        !(await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share your statistics report",
          UTI: "com.adobe.pdf",
          filename: generatePDFFilename(), // Ensure filename is set here too for sharing
        }))
      ) {
        // If sharing is cancelled or fails, still consider the download successful if URI was generated
        ToastService.success(
          "PDF Generated",
          `Your ${selectedPeriod} nutrition report was generated successfully.`
        );
      } else {
        ToastService.success(
          "PDF Downloaded",
          `Your ${selectedPeriod} nutrition report has been downloaded successfully!`
        );
      }
    } catch (error) {
      console.error("PDF download error:", error);
      ToastService.error(
        "Download Failed",
        "Failed to download PDF. Please check your connection and try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper to get meal completion status content for PDF
  const renderMealCompletionStatusContent = () => {
    const weeklyData = generateWeeklyData();
    const today = new Date().toISOString().split("T")[0];
    const todayData = weeklyData.find((day) => day.date === today);

    if (!todayData || !userQuestionnaire) return "No data available.";

    const isCompleted = todayData.mealsCount >= todayData.requiredMeals;
    const completionPercentage =
      (todayData.mealsCount / todayData.requiredMeals) * 100;

    return `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <div style="display: flex; align-items: center;">
          <span style="margin-right: 10px;">
            <svg width="24" height="24" fill="${
              isCompleted ? "#2ECC71" : "#E67E22"
            }">${isCompleted ? CheckCircle : Clock}</svg>
          </span>
          <p style="font-size: 18px; font-weight: 700; color: #0F172A;">${t(
            "statistics.meals_completed"
          )}</p>
        </div>
        <div style="position: relative; width: 100px; height: 100px;">
          <svg width="100" height="100" viewBox="0 0 100 100" style="transform: rotate(-90deg);">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#F1F5F9" stroke-width="8"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="${
              isCompleted ? "#2ECC71" : "#E67E22"
            }" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="${
      283 - (completionPercentage / 100) * 283
    }" stroke-linecap="round"/>
          </svg>
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; justify-content: center; align-items: center; display: flex; flex-direction: column;">
            <p style="font-size: 24px; font-weight: 800; color: #0F172A;">${
              todayData.mealsCount
            }</p>
            <p style="font-size: 14px; color: #64748B;">${t("statistics.of")} ${
      todayData.requiredMeals
    }</p>
          </div>
        </div>
        ${
          !isCompleted
            ? `<p style="font-size: 14px; color: #64748B; font-style: italic; text-align: center;">${t(
                "statistics.complete_meals_first"
              )}</p>`
            : ""
        }
      </div>
    `;
  };

  // Helper to get SVG content for icons
  const getIconSvg = (iconComponent: any) => {
    if (!iconComponent || !iconComponent.type || !iconComponent.props)
      return "";
    // Render the icon component directly into SVG string
    return iconComponent.typeconComponent.props;
  };

  const getAchievementIconHtml = (iconName: string) => {
    const iconProps = { size: 28, color: "#9CA3AF" }; // Default color for HTML rendering

    switch (iconName) {
      case "target":
        return Target(iconProps);
      case "sparkles":
        return Sparkles(iconProps);
      case "star":
        return Star(iconProps);
      case "medal":
        return Medal(iconProps);
      case "trophy":
        return Trophy(iconProps);
      case "crown":
        return Crown(iconProps);
      case "droplets":
        return Droplets(iconProps);
      case "waves":
        return Waves(iconProps);
      case "droplet":
        return Droplets(iconProps);
      case "mountain-snow":
        return Mountain(iconProps);
      case "flame":
        return Flame(iconProps);
      case "calendar":
        return Calendar(iconProps);
      case "muscle":
        return DumbbellIcon(iconProps);
      case "sunrise":
        return Sunrise(iconProps);
      case "moon":
        return Moon(iconProps);
      case "bar-chart-3":
        return BarChart3(iconProps);
      case "apple":
        return Apple(iconProps);
      case "dumbbell":
        return Dumbbell(iconProps);
      case "scale":
        return Scale(iconProps);
      case "wheat":
        return Wheat(iconProps);
      case "gem":
        return Gem(iconProps);
      case "zap":
        return Zap(iconProps);
      case "award":
      default:
        return Award(iconProps);
    }
  };

  const getStatusIconSvg = (status: string) => {
    switch (status) {
      case "excellent":
        return CheckCircle({ size: 16, color: "#2ECC71" });
      case "good":
        return CheckCircle({ size: 16, color: "#F39C12" });
      case "warning":
        return AlertTriangle({ size: 16, color: "#E67E22" });
      case "danger":
        return AlertTriangle({ size: 16, color: "#E74C3C" });
      default:
        return CheckCircle({ size: 16, color: "#95A5A6" });
    }
  };

  const getTrendIconSvg = (trend: string) => {
    switch (trend) {
      case "up":
        return TrendingUp({ size: 14, color: "#2ECC71" });
      case "down":
        return TrendingDown({ size: 14, color: "#E74C3C" });
      default:
        return Target({ size: 14, color: "#95A5A6" });
    }
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
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{t("statistics.title")}</Text>
              <Text style={styles.subtitle}>{t("statistics.subtitle")}</Text>
            </View>
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: "#16A085" }]}
              onPress={downloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Download size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
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
        {!nutritionData?.data && !isLoading && !error && (
          <View style={styles.noDataContainer}>
            <BarChart3 size={64} color="#BDC3C7" />
            <Text style={styles.noDataText}>
              {t("statistics.noDataMessage")}
            </Text>
          </View>
        )}

        {/* Main Content */}
        {nutritionData?.data && (
          <>
            {/* Meal Completion Status */}
            {renderMealCompletionStatus()}

            {/* Charts Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.data_visualization")}
              </Text>

              {/* Weekly Progress Chart */}
              {weeklyData.length > 0 && (
                <WeeklyProgressChart data={weeklyData} />
              )}

              {/* Macronutrient Distribution Chart */}
              {categorizedMetrics.macros.length > 0 && (
                <MacronutrientChart metrics={categorizedMetrics.macros} />
              )}

              {/* Progress Bar Chart */}
              {metrics.length > 0 && <ProgressBarChart metrics={metrics} />}
            </View>

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
                    <Text
                      style={styles.gamificationStatLabel}
                      numberOfLines={2}
                    >
                      {t("statistics.daily_streak")}
                    </Text>
                  </View>
                  <View style={styles.gamificationStatItem}>
                    <Calendar size={20} color="#3498DB" />
                    <Text style={styles.gamificationStatValue}>
                      {gamificationStats.weeklyStreak}
                    </Text>
                    <Text
                      style={styles.gamificationStatLabel}
                      numberOfLines={2}
                    >
                      {t("statistics.weekly_streak")}
                    </Text>
                  </View>
                  <View style={styles.gamificationStatItem}>
                    <Star size={20} color="#F39C12" />
                    <Text style={styles.gamificationStatValue}>
                      {gamificationStats.perfectDays}
                    </Text>
                    <Text
                      style={styles.gamificationStatLabel}
                      numberOfLines={2}
                    >
                      {t("statistics.perfect_days")}
                    </Text>
                  </View>
                  <View style={styles.gamificationStatItem}>
                    <Trophy size={20} color="#16A085" />
                    <Text style={styles.gamificationStatValue}>
                      {gamificationStats.totalPoints.toLocaleString()}
                    </Text>
                    <Text
                      style={styles.gamificationStatLabel}
                      numberOfLines={2}
                    >
                      {t("statistics.total_points")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Enhanced Achievements Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Award size={24} color="#F39C12" strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>
                    {t("statistics.achievements")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAchievements(true)}
                >
                  <Text style={styles.viewAllText}>
                    {t("statistics.view_all_achievements")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Achievement Categories */}
              <View style={styles.achievementCategories}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryTabs}>
                    {[
                      "All",
                      "MILESTONE",
                      "GOAL",
                      "STREAK",
                      "LEVEL",
                      "SPECIAL",
                    ].map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryTab,
                          selectedCategory === category &&
                            styles.categoryTabActive,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text
                          style={[
                            styles.categoryTabText,
                            selectedCategory === category &&
                              styles.categoryTabTextActive,
                          ]}
                        >
                          {category === "All" ? t("statistics.all") : category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Achievement Stats Summary */}
              <View style={styles.achievementStats}>
                <View style={styles.achievementStatCard}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.achievementStatNumber}>
                    {achievements.filter((a) => a.unlocked).length || 0}
                  </Text>
                  <Text style={styles.achievementStatLabel}>
                    {t("statistics.unlocked")}
                  </Text>
                </View>
                <View style={styles.achievementStatCard}>
                  <Lock size={20} color="#6B7280" />
                  <Text style={styles.achievementStatNumber}>
                    {achievements.filter((a) => !a.unlocked).length || 0}
                  </Text>
                  <Text style={styles.achievementStatLabel}>
                    {t("statistics.locked")}
                  </Text>
                </View>
                <View style={styles.achievementStatCard}>
                  <Sparkles size={20} color="#F59E0B" />
                  <Text style={styles.achievementStatNumber}>
                    {achievements.reduce(
                      (sum, a) => sum + (a.unlocked ? a.xpReward || 0 : 0),
                      0
                    ) || 0}
                  </Text>
                  <Text style={styles.achievementStatLabel}>
                    {t("statistics.total_xp")}
                  </Text>
                </View>
              </View>

              {/* Enhanced Achievement Grid */}
              <View style={styles.achievementGrid}>
                {achievements.length > 0 ? (
                  (selectedCategory === "All"
                    ? achievements
                    : achievements.filter(
                        (a) => a.category === selectedCategory
                      )
                  )
                    .slice(0, 6)
                    .map((achievement) => (
                      <EnhancedAchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        onPress={() => handleAchievementPress(achievement)}
                        language={language}
                      />
                    ))
                ) : (
                  <View style={styles.emptyAchievements}>
                    <Trophy size={48} color="#BDC3C7" />
                    <Text style={styles.emptyText}>
                      {isAchievementsLoading
                        ? isRTL
                          ? "טוען הישגים..."
                          : "Loading achievements..."
                        : isRTL
                        ? "לא נמצאו הישגים"
                        : "No achievements found"}
                    </Text>
                    {achievementsError && (
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetchAchievements()}
                      >
                        <Text style={styles.retryButtonText}>
                          {isRTL ? "נסה שוב" : "Retry"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Show More Button */}
              {(selectedCategory === "All"
                ? achievements
                : achievements.filter((a) => a.category === selectedCategory)
              ).length > 6 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAchievements(true)}
                >
                  <Text style={styles.showMoreText}>
                    {t("statistics.view_all_achievements")}
                  </Text>
                  <TrendingUp size={16} color="#16A085" />
                </TouchableOpacity>
              )}
            </View>

            {/* Progress Overview with Real Data */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.progress_overview")}
              </Text>
              <View style={styles.progressOverviewContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.progressStatsGrid}>
                    <View style={styles.progressStatItem}>
                      <View style={styles.progressStatIcon}>
                        <CheckCircle size={20} color="#2ECC71" />
                      </View>
                      <Text style={styles.progressStatValue}>
                        {progressStats.successfulDays}/{progressStats.totalDays}
                      </Text>
                      <Text style={styles.progressStatLabel} numberOfLines={2}>
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
                      <Text style={styles.progressStatLabel} numberOfLines={2}>
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
                      <Text style={styles.progressStatLabel} numberOfLines={2}>
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
                      <Text style={styles.progressStatLabel} numberOfLines={2}>
                        {t("statistics.current_streak")}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Real nutrition averages */}
                <View style={styles.nutritionAverages}>
                  <Text style={styles.nutritionAveragesTitle}>
                    {language === "he"
                      ? "ממוצעים תזונתיים"
                      : "Nutrition Averages"}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                  </ScrollView>
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
                          <Text style={styles.alertTitle} numberOfLines={1}>
                            {alert.title}
                          </Text>
                          <Text style={styles.alertMessage} numberOfLines={2}>
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

        {/* All Achievements Modal */}
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
                <EnhancedAchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onPress={handleAchievementPress}
                  language={language}
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Achievement Detail Modal */}
        <Modal
          visible={showAchievementDetail}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowAchievementDetail(false)}
        >
          <View style={styles.achievementDetailOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              onPress={() => setShowAchievementDetail(false)}
              activeOpacity={1}
            />
            {selectedAchievement && (
              <View style={styles.achievementDetailModal}>
                <View
                  style={[
                    styles.achievementDetailContent,
                    {
                      borderTopColor: getRarityColor(
                        selectedAchievement.rarity
                      ),
                      borderTopWidth: 4,
                    },
                  ]}
                >
                  {/* Header */}
                  <View style={styles.achievementDetailHeader}>
                    <View style={styles.achievementDetailIconContainer}>
                      {getAchievementIcon(
                        selectedAchievement.icon,
                        40,
                        getRarityColor(selectedAchievement.rarity)
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowAchievementDetail(false)}
                      style={styles.achievementDetailClose}
                    >
                      <X size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Title and Status */}
                  <View style={styles.achievementDetailTitleSection}>
                    <Text style={styles.achievementDetailTitle}>
                      {typeof selectedAchievement.title === "object"
                        ? selectedAchievement.title[language] ||
                          selectedAchievement.title.en
                        : selectedAchievement.title}
                    </Text>
                    <View
                      style={[
                        styles.achievementDetailStatusBadge,
                        {
                          backgroundColor: selectedAchievement.unlocked
                            ? "#10B98120"
                            : "#6B728020",
                        },
                      ]}
                    >
                      {selectedAchievement.unlocked ? (
                        <CheckCircle size={16} color="#10B981" />
                      ) : (
                        <Lock size={16} color="#6B7280" />
                      )}
                      <Text
                        style={[
                          styles.achievementDetailStatusText,
                          {
                            color: selectedAchievement.unlocked
                              ? "#10B981"
                              : "#6B7280",
                          },
                        ]}
                      >
                        {selectedAchievement.unlocked
                          ? t("statistics.unlocked")
                          : t("statistics.locked")}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.achievementDetailDescription}>
                    {typeof selectedAchievement.description === "object"
                      ? selectedAchievement.description[language] ||
                        selectedAchievement.description.en
                      : selectedAchievement.description}
                  </Text>

                  {/* Stats */}
                  <View style={styles.achievementDetailStats}>
                    <View style={styles.achievementDetailStat}>
                      <Sparkles size={20} color="#F59E0B" />
                      <Text style={styles.achievementDetailStatValue}>
                        +{selectedAchievement.xpReward}
                      </Text>
                      <Text style={styles.achievementDetailStatLabel}>
                        {t("statistics.xp_reward")}
                      </Text>
                    </View>
                    <View style={styles.achievementDetailStat}>
                      <Target size={20} color="#3B82F6" />
                      <Text style={styles.achievementDetailStatValue}>
                        {Math.round(
                          (selectedAchievement.progress /
                            (selectedAchievement.maxProgress || 1)) *
                            100
                        )}
                        %
                      </Text>
                      <Text style={styles.achievementDetailStatLabel}>
                        {t("statistics.progress")}
                      </Text>
                    </View>
                    <View style={styles.achievementDetailStat}>
                      <Crown
                        size={20}
                        color={getRarityColor(selectedAchievement.rarity)}
                      />
                      <Text
                        style={[
                          styles.achievementDetailStatValue,
                          { color: getRarityColor(selectedAchievement.rarity) },
                        ]}
                      >
                        {selectedAchievement.rarity}
                      </Text>
                      <Text style={styles.achievementDetailStatLabel}>
                        {t("statistics.rarity")}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.achievementDetailProgressSection}>
                    <View style={styles.achievementDetailProgressHeader}>
                      <Text style={styles.achievementDetailProgressText}>
                        {t("statistics.progress")}:{" "}
                        {selectedAchievement.progress}/
                        {selectedAchievement.maxProgress || 1}
                      </Text>
                      <Text style={styles.achievementDetailProgressPercent}>
                        {Math.round(
                          (selectedAchievement.progress /
                            (selectedAchievement.maxProgress || 1)) *
                            100
                        )}
                        %
                      </Text>
                    </View>
                    <View style={styles.achievementDetailProgressBar}>
                      <View
                        style={[
                          styles.achievementDetailProgressFill,
                          {
                            width: `${Math.min(
                              (selectedAchievement.progress /
                                (selectedAchievement.maxProgress || 1)) *
                                100,
                              100
                            )}%`,
                            backgroundColor: getRarityColor(
                              selectedAchievement.rarity
                            ),
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Modal>

        {/* New Achievement Notification Modal */}
        <Modal
          visible={newAchievementModal.show}
          animationType="fade"
          transparent={true}
          onRequestClose={() =>
            setNewAchievementModal({ show: false, achievement: null })
          }
        >
          <View style={styles.newAchievementOverlay}>
            {newAchievementModal.achievement && (
              <Animated.View style={styles.newAchievementModal}>
                <LinearGradient
                  colors={[
                    getRarityColor(newAchievementModal.achievement.rarity) +
                      "20",
                    getRarityColor(newAchievementModal.achievement.rarity) +
                      "05",
                  ]}
                  style={styles.newAchievementContent}
                >
                  <View style={styles.newAchievementHeader}>
                    <Trophy size={32} color="#F59E0B" />
                    <Text style={styles.newAchievementTitle}>
                      {t("statistics.achievement_unlocked")}
                    </Text>
                  </View>

                  <View style={styles.newAchievementBody}>
                    <View
                      style={[
                        styles.newAchievementIcon,
                        {
                          backgroundColor:
                            getRarityColor(
                              newAchievementModal.achievement.rarity
                            ) + "20",
                        },
                      ]}
                    >
                      {getAchievementIcon(
                        newAchievementModal.achievement.icon,
                        48,
                        getRarityColor(newAchievementModal.achievement.rarity)
                      )}
                    </View>

                    <Text style={styles.newAchievementName}>
                      {typeof newAchievementModal.achievement.title === "object"
                        ? newAchievementModal.achievement.title[language] ||
                          newAchievementModal.achievement.title.en
                        : newAchievementModal.achievement.title}
                    </Text>

                    <Text style={styles.newAchievementDescription}>
                      {typeof newAchievementModal.achievement.description ===
                      "object"
                        ? newAchievementModal.achievement.description[
                            language
                          ] || newAchievementModal.achievement.description.en
                        : newAchievementModal.achievement.description}
                    </Text>

                    <View style={styles.newAchievementReward}>
                      <Sparkles size={20} color="#F59E0B" />
                      <Text style={styles.newAchievementRewardText}>
                        +{newAchievementModal.achievement.xpReward} XP
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.newAchievementCloseButton}
                    onPress={() =>
                      setNewAchievementModal({ show: false, achievement: null })
                    }
                  >
                    <Text style={styles.newAchievementCloseText}>
                      {t("statistics.awesome")}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Math.min(32, width * 0.08),
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
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 16,
  },
  mealCompletionIcon: {
    marginRight: 12,
  },
  mealCompletionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  mealCompletionContent: {
    alignItems: "center",
    gap: 16,
  },
  mealCompletionText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  mealCompletionSubtext: {
    fontSize: 14,
    color: "#64748B",
  },
  mealCompletionMessage: {
    fontSize: 14,
    color: "#64748B",
    fontStyle: "italic",
    textAlign: "center",
  },

  // Chart Styles
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    textAlign: "center",
  },
  chartXLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    marginTop: 8,
  },
  chartXLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },
  macroLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    gap: 12,
  },
  macroLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  macroLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  macroLegendText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  // Enhanced Section Styling
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: Math.min(24, width * 0.06),
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
    fontSize: Math.min(28, width * 0.07),
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
    paddingHorizontal: Math.max(8, width * 0.02),
    flex: 1,
  },
  gamificationStatValue: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 6,
  },
  gamificationStatLabel: {
    fontSize: Math.min(13, width * 0.03),
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  // Enhanced Achievements
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#E0F2F1",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Achievement Categories
  achievementCategories: {
    marginBottom: 20,
  },
  categoryTabs: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    minWidth: 80,
    alignItems: "center",
  },
  categoryTabActive: {
    backgroundColor: "#16A085",
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
  },

  // Achievement Stats Summary
  achievementStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  achievementStatCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
    marginBottom: 4,
  },
  achievementStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },

  // Enhanced Achievement Grid
  achievementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  enhancedAchievementCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  enhancedAchievementCardContent: {
    padding: 16,
    position: "relative",
  },
  achievementGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  enhancedAchievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  enhancedAchievementContent: {
    alignItems: "center",
  },
  enhancedAchievementTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 18,
  },
  enhancedAchievementDescription: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
    marginBottom: 12,
  },
  enhancedProgressSection: {
    width: "100%",
    gap: 8,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  xpBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  enhancedProgressBar: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  enhancedProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  rarityBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Show More Button
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#16A085",
    borderStyle: "dashed",
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A085",
  },

  // Achievement Detail Modal
  achievementDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  achievementDetailModal: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  achievementDetailContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  achievementDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  achievementDetailIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  achievementDetailClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  achievementDetailTitleSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  achievementDetailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },
  achievementDetailStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  achievementDetailStatusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  achievementDetailDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    textAlign: "center",
    marginBottom: 24,
  },
  achievementDetailStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  achievementDetailStat: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  achievementDetailStatValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
    marginBottom: 4,
  },
  achievementDetailStatLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  achievementDetailProgressSection: {
    gap: 8,
  },
  achievementDetailProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementDetailProgressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  achievementDetailProgressPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16A085",
  },
  achievementDetailProgressBar: {
    height: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 5,
    overflow: "hidden",
  },
  achievementDetailProgressFill: {
    height: "100%",
    borderRadius: 5,
  },

  // New Achievement Notification Modal
  newAchievementOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  newAchievementModal: {
    width: width - 40,
    maxWidth: 350,
  },
  newAchievementContent: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  newAchievementHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  newAchievementTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 12,
    textAlign: "center",
  },
  newAchievementBody: {
    alignItems: "center",
    marginBottom: 24,
  },
  newAchievementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  newAchievementName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  newAchievementDescription: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  newAchievementReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FEF3E2",
    borderRadius: 16,
  },
  newAchievementRewardText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F59E0B",
  },
  newAchievementCloseButton: {
    backgroundColor: "#16A085",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
  },
  newAchievementCloseText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  achievementsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  achievementCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    width: width * 0.8,
    minWidth: 300,
    maxWidth: 400,
  },
  achievementContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  achievementEmoji: {
    fontSize: 32,
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
  achievementPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
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
  achievementStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    gap: 20,
    marginBottom: 24,
  },
  progressStatItem: {
    alignItems: "center",
    paddingHorizontal: 12,
    minWidth: 100,
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
    fontSize: Math.min(20, width * 0.05),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: Math.min(13, width * 0.03),
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
    gap: 16,
  },
  nutritionAverage: {
    alignItems: "center",
    paddingHorizontal: 12,
    minWidth: 80,
  },
  nutritionAverageValue: {
    fontSize: Math.min(18, width * 0.045),
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
    fontSize: Math.min(18, width * 0.045),
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
    minWidth: 60,
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
    fontSize: Math.min(24, width * 0.06),
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
    minWidth: 80,
  },
  metricPercentageText: {
    fontSize: Math.min(28, width * 0.07),
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

  // Added styles for achievements loading and error states
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyAchievements: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 24,
  },

  // Styles for achievements section in the main screen
  achievementsScrollContainer: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
});

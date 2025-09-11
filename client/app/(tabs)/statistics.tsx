import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Gem,
  Activity,
  ChartPie as PieChart,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { api } from "@/src/services/api";
import LoadingScreen from "@/components/LoadingScreen";
import { StatisticsData } from "@/src/store/calendarSlice"; // This import seems redundant with the new definition. Keeping for now as per instructions.
import {
  UserQuestionnaire,
  NutritionMetric,
  ProgressData,
  Achievement, // This import also seems redundant with the new definition.
  TimeFilterOption,
} from "@/src/types/statistics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { getStatusColor } from "@/src/utils/statisticsHelper";

const { width, height } = Dimensions.get("window");
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 200;

// Chart Types
type ChartType = "weekly" | "macros" | "progress" | "hydration";

interface ChartNavigationProps {
  charts: { key: ChartType; title: string; available: boolean }[];
  activeChart: ChartType;
  onChartChange: (chart: ChartType) => void;
}

// Custom Chart Components
const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 12,
  color = "#16A085",
  backgroundColor = "#F1F5F9",
  children,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children: React.ReactNode;
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

const ChartNavigation = ({
  charts,
  activeChart,
  onChartChange,
}: ChartNavigationProps) => {
  return (
    <View style={styles.chartNavigation}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartNavButtons}>
          {charts.map((chart) => (
            <TouchableOpacity
              key={chart.key}
              style={[
                styles.chartNavButton,
                activeChart === chart.key && styles.chartNavButtonActive,
                !chart.available && styles.chartNavButtonDisabled,
              ]}
              onPress={() => chart.available && onChartChange(chart.key)}
              disabled={!chart.available}
            >
              <Text
                style={[
                  styles.chartNavButtonText,
                  activeChart === chart.key && styles.chartNavButtonTextActive,
                  !chart.available && styles.chartNavButtonTextDisabled,
                ]}
              >
                {chart.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const WeeklyProgressChart = ({
  data,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
}: {
  data: ProgressData[];
  width?: number;
  height?: number;
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height: 200 }]}>
        <View style={styles.noChartDataContainer}>
          <BarChart3 size={48} color="#BDC3C7" />
          <Text style={styles.noChartDataText}>No weekly data available</Text>
        </View>
      </View>
    );
  }

  const maxCalories = Math.max(...data.map((d) => d.calories || 0)) || 1;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const xStep = chartWidth / Math.max(data.length - 1, 1);

  const pathData = data
    .map((item, index) => {
      const x = padding + index * xStep;
      const y =
        padding +
        chartHeight -
        ((item.calories || 0) / maxCalories) * chartHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <View style={styles.chartContainer}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + chartHeight * ratio;
          return (
            <Line
              key={`grid-${index}`}
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
        {pathData && (
          <Path
            d={pathData}
            stroke="#16A085"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {data.map((item, index) => {
          const x = padding + index * xStep;
          const y =
            padding +
            chartHeight -
            ((item.calories || 0) / maxCalories) * chartHeight;
          return (
            <Circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r={4}
              fill="#16A085"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, index) => {
          const value = Math.round(maxCalories * (1 - ratio));
          const y = padding + chartHeight * ratio;
          return (
            <SvgText
              key={`y-label-${index}`}
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
        {data.map((item, index) => (
          <Text key={`x-label-${index}`} style={styles.chartXLabel}>
            {new Date(item.date).toLocaleDateString("en", {
              weekday: "short",
            })}
          </Text>
        ))}
      </View>
    </View>
  );
};

const MacronutrientChart = ({
  metrics,
  width = CHART_WIDTH,
}: {
  metrics: NutritionMetric[];
  width?: number;
}) => {
  const macros = metrics.filter((m) => m.category === "macros");

  if (macros.length === 0) {
    return (
      <View style={[styles.chartContainer, { height: 200 }]}>
        <View style={styles.noChartDataContainer}>
          <PieChart size={48} color="#BDC3C7" />
          <Text style={styles.noChartDataText}>
            No macronutrient data available
          </Text>
        </View>
      </View>
    );
  }

  const total = macros.reduce((sum, macro) => sum + (macro.value || 0), 0) || 1;
  let currentAngle = 0;
  const radius = 80;
  const centerX = width / 2;
  const centerY = 120;

  return (
    <View style={styles.chartContainer}>
      <Svg width={width} height={240}>
        {macros.map((macro, index) => {
          const percentage = ((macro.value || 0) / total) * 100;
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
              key={`macro-${index}`}
              d={pathData}
              fill={macro.color}
              opacity={0.8}
            />
          );
        })}
      </Svg>

      <View style={styles.macroLegend}>
        {macros.map((macro, index) => (
          <View key={`legend-${index}`} style={styles.macroLegendItem}>
            <View
              style={[
                styles.macroLegendColor,
                { backgroundColor: macro.color },
              ]}
            />
            <Text style={styles.macroLegendText}>
              {macro.nameEn}: {(macro.value || 0).toFixed(1)}g
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ProgressBarChart = ({
  metrics,
  width = CHART_WIDTH,
}: {
  metrics: NutritionMetric[];
  width?: number;
}) => {
  const displayMetrics = metrics.slice(0, 6);

  if (displayMetrics.length === 0) {
    return (
      <View style={[styles.chartContainer, { height: 200 }]}>
        <View style={styles.noChartDataContainer}>
          <BarChart3 size={48} color="#BDC3C7" />
          <Text style={styles.noChartDataText}>No progress data available</Text>
        </View>
      </View>
    );
  }

  const barHeight = 24;
  const barSpacing = 40;
  const chartHeight = displayMetrics.length * barSpacing + 40;

  return (
    <View style={styles.chartContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={Math.max(width, 300)} height={chartHeight}>
          {displayMetrics.map((metric, index) => {
            const y = 20 + index * barSpacing;
            const barWidth = Math.min(width - 120, 200);
            const fillWidth = ((metric.percentage || 0) / 100) * barWidth;

            return (
              <React.Fragment key={`progress-bar-${index}`}>
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
                  {(metric.nameEn || "").length > 8
                    ? (metric.nameEn || "").substring(0, 8) + "..."
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
                  {metric.percentage || 0}%
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

const HydrationChart = ({
  data,
  target,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
}: {
  data: ProgressData[];
  target: number;
  width?: number;
  height?: number;
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height: 200 }]}>
        <View style={styles.noChartDataContainer}>
          <Droplets size={48} color="#BDC3C7" />
          <Text style={styles.noChartDataText}>
            No hydration data available
          </Text>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(target, ...data.map((d) => d.water || 0)) || 1;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = (chartWidth / data.length) * 0.8;

  return (
    <View style={styles.chartContainer}>
      <Svg width={width} height={height}>
        {/* Target line */}
        <Line
          x1={padding}
          y1={padding + chartHeight - (target / maxValue) * chartHeight}
          x2={width - padding}
          y2={padding + chartHeight - (target / maxValue) * chartHeight}
          stroke="#E67E22"
          strokeWidth={2}
          strokeDasharray="5,5"
        />

        {/* Bars */}
        {data.map((item, index) => {
          const x =
            padding +
            (index * chartWidth) / data.length +
            (chartWidth / data.length - barWidth) / 2;
          const barHeightCalc = ((item.water || 0) / maxValue) * chartHeight;
          const y = padding + chartHeight - barHeightCalc;
          const isAboveTarget = (item.water || 0) >= target;

          return (
            <Rect
              key={`hydration-bar-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeightCalc}
              fill={isAboveTarget ? "#3498DB" : "#95A5A6"}
              rx={4}
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, index) => {
          const value = Math.round(maxValue * (1 - ratio));
          const y = padding + chartHeight * ratio;
          return (
            <SvgText
              key={`hydration-y-label-${index}`}
              x={padding - 10}
              y={y + 4}
              fontSize="12"
              fill="#64748B"
              textAnchor="end"
            >
              {value}ml
            </SvgText>
          );
        })}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.chartXLabels}>
        {data.map((item, index) => (
          <Text key={`hydration-x-label-${index}`} style={styles.chartXLabel}>
            {new Date(item.date).toLocaleDateString("en", {
              weekday: "short",
            })}
          </Text>
        ))}
      </View>
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
    case "mountain-snow":
      return <Mountain {...iconProps} />;
    case "flame":
      return <Flame {...iconProps} />;
    case "calendar":
      return <Calendar {...iconProps} />;
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
      return "#FFFBEB";
    case "EPIC":
      return "#F9F5FF";
    case "RARE":
      return "#F0F9FF";
    case "UNCOMMON":
      return "#FFF7ED";
    case "COMMON":
    default:
      return "#F0FDF4";
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

  // State management
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("week");
  const [activeChart, setActiveChart] = useState<ChartType>("weekly");
  const [showAchievements, setShowAchievements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(
    null
  );
  const [userQuestionnaire, setUserQuestionnaire] =
    useState<UserQuestionnaire | null>(null);
  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const { user } = useSelector((state: RootState) => state.auth);

  // Fetch achievements data separately
  const fetchAchievements = async () => {
    try {
      const response = await api.get("/statistics/achievements");
      if (response.data.success && response.data.data) {
        setAchievements(response.data.data.map((achievement: any) => ({
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
        })));
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    }
  };

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

      if (statisticsResponse.data.success && statisticsResponse.data.data) {
        setStatisticsData(statisticsResponse.data.data);
      } else {
        setError(
          statisticsResponse.data.message || "No statistics data available"
        );
      }

      if (
        questionnaireResponse.data.success &&
        questionnaireResponse.data.data
      ) {
        const qData = questionnaireResponse.data.data;
        let mealsPerDay = 3;
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
      return [];
    }

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
        name: t("statistics.total_calories") || "Total Calories",
        nameEn: "Total Calories",
        value: statisticsData.averageCalories || 0,
        target: userQuestionnaire.dailyCalories,
        unit: t("statistics.kcal") || "kcal",
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
        name: t("statistics.protein") || "Protein",
        nameEn: "Protein",
        value: statisticsData.averageProtein || 0,
        target: userQuestionnaire.dailyProtein,
        unit: t("statistics.g") || "g",
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
        name: t("statistics.carbohydrates") || "Carbohydrates",
        nameEn: "Carbohydrates",
        value: statisticsData.averageCarbs || 0,
        target: userQuestionnaire.dailyCarbs,
        unit: t("statistics.g") || "g",
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
        name: t("statistics.fats") || "Fats",
        nameEn: "Fats",
        value: statisticsData.averageFats || 0,
        target: userQuestionnaire.dailyFats,
        unit: t("statistics.g") || "g",
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
        name: t("statistics.fiber") || "Fiber",
        nameEn: "Fiber",
        value: statisticsData.averageFiber || 0,
        target: userQuestionnaire.dailyFiber,
        unit: t("statistics.g") || "g",
        icon: <Leaf size={20} color="#27AE60" />,
        color: "#27AE60",
        category: "micros" as const,
        description:
          language === "he"
            ? "סיבים תזונתיים לבריאות העיכול"
            : "Dietary fiber for digestive health",
        recommendation: t("statistics.increaseIntake") || "Increase intake",
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
        name: t("statistics.sugars") || "Sugars",
        nameEn: "Sugars",
        value: statisticsData.averageSugar || 0,
        target: 50,
        maxTarget: 50,
        unit: t("statistics.g") || "g",
        icon: <Apple size={20} color="#E67E22" />,
        color: "#E67E22",
        category: "micros" as const,
        description:
          language === "he"
            ? "סוכרים פשוטים - מומלץ להגביל"
            : "Simple sugars - recommended to limit",
        recommendation: t("statistics.decreaseIntake") || "Decrease intake",
        trend: calculateTrend(statisticsData.averageSugar || 0, 50),
        weeklyAverage: statisticsData.averageSugar || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageSugar || 0,
          statisticsData.averageSugar || 0
        ),
      },
      {
        id: "sodium",
        name: t("statistics.sodium") || "Sodium",
        nameEn: "Sodium",
        value: statisticsData.averageSodium || 0,
        target: 2300,
        maxTarget: 2300,
        unit: t("statistics.mg") || "mg",
        icon: <Shield size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "micros" as const,
        description:
          language === "he"
            ? "נתרן - חשוב להגביל למניעת יתר לחץ דם"
            : "Sodium - important to limit to prevent hypertension",
        recommendation: t("statistics.decreaseIntake") || "Decrease intake",
        trend: calculateTrend(statisticsData.averageSodium || 0, 2300),
        weeklyAverage: statisticsData.averageSodium || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData.averageSodium || 0,
          statisticsData.averageSodium || 0
        ),
      },
      {
        id: "hydration",
        name: t("statistics.hydration") || "Hydration",
        nameEn: "Hydration",
        value: statisticsData.averageFluids || 0,
        target: userQuestionnaire.dailyWater,
        unit: t("statistics.ml") || "ml",
        icon: <Droplets size={20} color="#3498DB" />,
        color: "#3498DB",
        category: "lifestyle" as const,
        description:
          language === "he" ? "רמת הידרציה יומית" : "Daily hydration level",
        recommendation: t("statistics.increaseIntake") || "Increase intake",
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

  // Generate weekly progress data
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

  // Generate achievements from real API data
  const generateAchievements = (): Achievement[] => {
    if (!statisticsData?.achievements && achievements.length === 0) {
      // Fetch achievements separately if not in stats data
      fetchAchievements();
      return [];
    }

    if (statisticsData?.achievements) {
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
    }

    return achievements;
  };

  // Update metrics when data changes
  useEffect(() => {
    if (statisticsData && userQuestionnaire) {
      setMetrics(generateNutritionMetrics());
      setWeeklyData(generateWeeklyData());
      setAchievements(generateAchievements());
    }
  }, [statisticsData, userQuestionnaire, t]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStatistics(selectedPeriod);
    } finally {
      setRefreshing(false);
    }
  };

  const timeFilters: TimeFilterOption[] = [
    { key: "today", label: t("statistics.today") || "Today" },
    { key: "week", label: t("statistics.week") || "Week" },
    { key: "month", label: t("statistics.month") || "Month" },
  ];

  // Helper functions for status and trends
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

  // Calculate gamification stats
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

    return {
      level,
      currentXP,
      nextLevelXP,
      totalPoints,
      dailyStreak: statisticsData.currentStreak || 0,
      weeklyStreak: statisticsData.weeklyStreak || 0,
      perfectDays: statisticsData.perfectDays || 0,
      xpToNext: nextLevelXP - currentXP,
      xpProgress: (currentXP / nextLevelXP) * 100,
    };
  };

  // Check if user has completed daily meals for warnings
  const shouldShowWarnings = (): boolean => {
    if (!userQuestionnaire) return false;
    const today = new Date().toISOString().split("T")[0];
    const todayData = weeklyData.find((day) => day.date === today);
    return todayData ? todayData.mealsCount >= todayData.requiredMeals : false;
  };

  const categorizedMetrics = {
    macros: metrics.filter((m) => m.category === "macros"),
    micros: metrics.filter((m) => m.category === "micros"),
    lifestyle: metrics.filter((m) => m.category === "lifestyle"),
  };

  const progressStats = calculateProgressStats();
  const gamificationStats = calculateGamificationStats();

  // Chart configuration
  const availableCharts = [
    {
      key: "weekly" as ChartType,
      title: "Weekly Progress",
      available: weeklyData.length > 0,
    },
    {
      key: "macros" as ChartType,
      title: "Macronutrients",
      available: categorizedMetrics.macros.length > 0,
    },
    {
      key: "progress" as ChartType,
      title: "Goal Progress",
      available: metrics.length > 0,
    },
    {
      key: "hydration" as ChartType,
      title: "Hydration",
      available: weeklyData.length > 0 && userQuestionnaire !== null,
    },
  ];

  // Render chart based on active selection
  const renderActiveChart = () => {
    switch (activeChart) {
      case "weekly":
        return <WeeklyProgressChart data={weeklyData} />;
      case "macros":
        return <MacronutrientChart metrics={categorizedMetrics.macros} />;
      case "progress":
        return <ProgressBarChart metrics={metrics} />;
      case "hydration":
        return (
          <HydrationChart
            data={weeklyData}
            target={userQuestionnaire?.dailyWater || 2500}
          />
        );
      default:
        return <WeeklyProgressChart data={weeklyData} />;
    }
  };

  // Render metric card
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
              {(metric.value || 0).toLocaleString()} {metric.unit}
            </Text>
            <Text style={styles.metricTargetText} numberOfLines={1}>
              {language === "he" ? "יעד" : "Target"}:{" "}
              {(metric.target || 0).toLocaleString()} {metric.unit}
            </Text>
          </View>
          <View style={styles.metricPercentage}>
            <Text
              style={[styles.metricPercentageText, { color: metric.color }]}
            >
              {metric.percentage || 0}%
            </Text>
          </View>
        </View>

        <View style={styles.metricProgress}>
          <View style={styles.metricProgressBg}>
            <View
              style={[
                styles.metricProgressFill,
                {
                  width: `${Math.min(metric.percentage || 0, 100)}%`,
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

  // Meal completion status component
  const renderMealCompletionStatus = () => {
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
            {t("statistics.meals_completed") || "Meals Completed"}
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
              {t("statistics.of") || "of"} {todayData.requiredMeals}
            </Text>
          </CircularProgress>

          {!isCompleted && (
            <Text style={styles.mealCompletionMessage}>
              {t("statistics.complete_meals_first") ||
                "Complete your meals first"}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // PDF generation function
  const generatePdf = async () => {
    if (!statisticsData) {
      Alert.alert("No Data", "There is no data to generate a PDF from.");
      return;
    }

    Alert.alert(
      "Generating PDF",
      "Please wait while we generate your report..."
    );

    const htmlContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Statistics Report</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            padding: 20px; 
            color: #333; 
            line-height: 1.4;
          }
          h1 { 
            color: #16A085; 
            text-align: center; 
            margin-bottom: 30px; 
          }
          h2 { 
            color: #0F172A; 
            border-bottom: 2px solid #EEE; 
            padding-bottom: 10px; 
            margin-top: 25px; 
            margin-bottom: 15px; 
            font-size: 20px; 
          }
          .section { 
            margin-bottom: 20px; 
            page-break-inside: avoid;
          }
          .metric-card { 
            background-color: #F8FAFC; 
            border-radius: 12px; 
            padding: 16px; 
            margin-bottom: 12px; 
            border: 1px solid #E5E7EB;
          }
          .progress-bar {
            height: 8px;
            background-color: #F1F5F9;
            border-radius: 4px;
            overflow: hidden;
            margin: 8px 0;
          }
          .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
          }
        </style>
      </head>
      <body>
        <h1>Statistics Report</h1>

        <div class="section">
          <h2>Progress Overview</h2>
          <p>Average Completion: ${progressStats?.averageCompletion || 0}%</p>
          <p>Best Streak: ${progressStats?.bestStreak || 0} days</p>
          <p>Current Streak: ${progressStats?.currentStreak || 0} days</p>
        </div>

        <div class="section">
          <h2>Nutrition Averages</h2>
          <p>Calories: ${progressStats?.averages?.calories || 0} kcal</p>
          <p>Protein: ${progressStats?.averages?.protein || 0} g</p>
          <p>Carbohydrates: ${progressStats?.averages?.carbs || 0} g</p>
          <p>Fats: ${progressStats?.averages?.fats || 0} g</p>
          <p>Water: ${progressStats?.averages?.water || 0} ml</p>
        </div>

        ${
          metrics
            ?.map(
              (metric, index) => `
          <div class="section">
            <h2>${metric.name || `Metric ${index + 1}`}</h2>
            <div class="metric-card">
              <p><strong>Value:</strong> ${(
                metric.value || 0
              ).toLocaleString()} ${metric.unit || ""}</p>
              <p><strong>Target:</strong> ${(
                metric.target || 0
              ).toLocaleString()} ${metric.unit || ""}</p>
              <p><strong>Status:</strong> ${metric.status || "N/A"}</p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(
                  metric.percentage || 0,
                  100
                )}%; background-color: ${metric.color || "#ccc"};"></div>
              </div>
              ${
                metric.recommendation
                  ? `<p><em>💡 ${metric.recommendation}</em></p>`
                  : ""
              }
            </div>
          </div>
        `
            )
            .join("") || ""
        }
      </body>
    </html>
    `;

    try {
      if (!Print || !Print.printToFileAsync) {
        throw new Error("Print module is not available");
      }

      const fileName = `Calo Stats ${user?.name || "User"}.pdf`;
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (uri) {
        if (!Sharing || !Sharing.shareAsync) {
          throw new Error("Sharing module is not available");
        }

        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share your statistics report",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF: " + error.message);
    }
  };

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
          <Text style={styles.errorText}>
            {t("statistics.error_message") || "An error occurred"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>
              {t("statistics.retry_button") || "Retry"}
            </Text>
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
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {t("statistics.title") || "Statistics"}
              </Text>
              <Text style={styles.subtitle}>
                {t("statistics.subtitle") || "Your nutrition insights"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: "#16A085" }]}
              onPress={generatePdf}
            >
              <Download size={24} color="#FFFFFF" />
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
        {!statisticsData && !isLoading && (
          <View style={styles.noDataContainer}>
            <BarChart3 size={64} color="#BDC3C7" />
            <Text style={styles.noDataText}>
              {t("statistics.noDataMessage") || "No data available"}
            </Text>
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
                {t("statistics.data_visualization") || "Data Visualization"}
              </Text>

              {/* Chart Navigation */}
              <ChartNavigation
                charts={availableCharts}
                activeChart={activeChart}
                onChartChange={setActiveChart}
              />

              {/* Active Chart */}
              {renderActiveChart()}
            </View>

            {/* Gamification Dashboard */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.gamification") || "Gamification"}
              </Text>
              <View style={styles.gamificationContainer}>
                <View style={styles.levelContainer}>
                  <View style={styles.levelInfo}>
                    <View style={styles.levelIcon}>
                      <Crown size={32} color="#F39C12" />
                    </View>
                    <View style={styles.levelDetails}>
                      <Text style={styles.levelText}>
                        {t("statistics.level") || "Level"}
                        {gamificationStats.level}
                      </Text>
                      <Text style={styles.xpText}>
                        {gamificationStats.currentXP} /{" "}
                        {gamificationStats.nextLevelXP}{" "}
                        {t("statistics.xp") || "XP"}
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
                      {gamificationStats.xpToNext}{" "}
                      {t("statistics.next_level") || "XP to next level"}
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
                      {t("statistics.daily_streak") || "Daily Streak"}
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
                      {t("statistics.weekly_streak") || "Weekly Streak"}
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
                      {t("statistics.perfect_days") || "Perfect Days"}
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
                      {t("statistics.total_points") || "Total Points"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Enhanced Achievements Section */}
            <View style={styles.section}>
              <View style={styles.achievementsHeader}>
                <Text style={styles.sectionTitle}>
                  {t("statistics.achievements") || "Achievements"}
                </Text>
                {achievements.length > 3 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => setShowAchievements(true)}
                  >
                    <Text style={styles.viewAllText}>
                      {t("statistics.view_all_achievements") || "View All"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {achievements.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                              achievement.unlocked
                                ? achievement.color
                                : "#9CA3AF"
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
                                numberOfLines={1}
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
                              numberOfLines={2}
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
                                                (achievement.maxProgress ||
                                                  1)) *
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
                              <CheckCircle
                                size={24}
                                color={achievement.color}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.noDataContainer}>
                  <Trophy size={64} color="#BDC3C7" />
                  <Text style={styles.noDataText}>
                    {t("statistics.no_achievements") || "No achievements yet"}
                  </Text>
                </View>
              )}
            </View>

            {/* Progress Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("statistics.progress_overview") || "Progress Overview"}
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
                        {t("statistics.successful_days") || "Successful Days"}
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
                        {t("statistics.average_completion") ||
                          "Average Completion"}
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
                        {t("statistics.best_streak") || "Best Streak"}
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
                        {t("statistics.current_streak") || "Current Streak"}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Nutrition averages */}
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
                          {t("statistics.kcal") || "kcal"}
                        </Text>
                      </View>
                      <View style={styles.nutritionAverage}>
                        <Zap size={16} color="#9B59B6" />
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.protein}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.g") || "g"}
                        </Text>
                      </View>
                      <View style={styles.nutritionAverage}>
                        <Wheat size={16} color="#F39C12" />
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.carbs}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.g") || "g"}
                        </Text>
                      </View>
                      <View style={styles.nutritionAverage}>
                        <Fish size={16} color="#16A085" />
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.fats}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.g") || "g"}
                        </Text>
                      </View>
                      <View style={styles.nutritionAverage}>
                        <Droplets size={16} color="#3498DB" />
                        <Text style={styles.nutritionAverageValue}>
                          {progressStats.averages.water}
                        </Text>
                        <Text style={styles.nutritionAverageLabel}>
                          {t("statistics.ml") || "ml"}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Macronutrients */}
            {categorizedMetrics.macros.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("statistics.macronutrients") || "Macronutrients"}
                </Text>
                <View style={styles.metricsGrid}>
                  {categorizedMetrics.macros.map(renderMetricCard)}
                </View>
              </View>
            )}

            {/* Micronutrients */}
            {categorizedMetrics.micros.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("statistics.micronutrients") || "Micronutrients"}
                </Text>
                <View style={styles.metricsGrid}>
                  {categorizedMetrics.micros.map(renderMetricCard)}
                </View>
              </View>
            )}

            {/* Lifestyle Metrics */}
            {categorizedMetrics.lifestyle.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("statistics.lifestyle") || "Lifestyle"}
                </Text>
                <View style={styles.metricsGrid}>
                  {categorizedMetrics.lifestyle.map(renderMetricCard)}
                </View>
              </View>
            )}
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
                {t("statistics.achievements") || "Achievements"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    { marginBottom: 16, width: "100%" },
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
                          numberOfLines={2}
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
                        numberOfLines={3}
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

  // Error & Loading States
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

  noChartDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noChartDataText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "500",
  },

  // Time Filter
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

  // Chart Navigation
  chartNavigation: {
    marginBottom: 20,
  },
  chartNavButtons: {
    flexDirection: "row",
    gap: 12,
  },
  chartNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    minWidth: 100,
  },
  chartNavButtonActive: {
    backgroundColor: "#16A085",
  },
  chartNavButtonDisabled: {
    opacity: 0.5,
  },
  chartNavButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  chartNavButtonTextActive: {
    color: "#FFFFFF",
  },
  chartNavButtonTextDisabled: {
    color: "#9CA3AF",
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

  // Section Styling
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

  // Gamification
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

  // Achievements
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

  // Progress Overview
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

  // Metrics
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

  // Modal
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
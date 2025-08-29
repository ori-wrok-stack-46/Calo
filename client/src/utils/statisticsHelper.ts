import { colors } from "../../constants/theme";
import {
  NutritionMetric,
  ProgressData,
  Achievement,
  TimePeriod,
} from "../types/statistics";

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "excellent":
      return colors.success[500];
    case "good":
      return colors.warning[500];
    case "warning":
      return colors.warning[600];
    case "danger":
      return colors.error[500];
    default:
      return colors.neutral[400];
  }
};

export const getRarityColor = (rarity: string): string => {
  switch (rarity.toUpperCase()) {
    case "LEGENDARY":
      return colors.warning[500];
    case "EPIC":
      return "#8B5CF6";
    case "RARE":
      return "#3B82F6";
    case "UNCOMMON":
      return colors.warning[600];
    case "COMMON":
    default:
      return colors.success[500];
  }
};

export const getAchievementBackgroundColor = (
  rarity: string,
  unlocked: boolean
): string => {
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

export const formatDateLabel = (date: string, period: TimePeriod): string => {
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

export const generateChartData = (
  data: ProgressData[],
  metric: keyof ProgressData,
  period: TimePeriod
) => {
  if (!data || data.length === 0) {
    return {
      labels: ["No Data"],
      datasets: [{ data: [0] }],
    };
  }

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
        color: (opacity = 1) => `rgba(26, 188, 156, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };
};

export const calculateTrend = (
  current: number,
  target: number
): "up" | "down" | "stable" => {
  const ratio = current / target;
  if (ratio > 1.1) return "up";
  if (ratio < 0.9) return "down";
  return "stable";
};

export const calculateWeeklyChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const calculateNutritionStatus = (
  value: number,
  target: number,
  maxTarget?: number
): "excellent" | "good" | "warning" | "danger" => {
  if (maxTarget) {
    if (value <= target * 0.8) return "excellent";
    else if (value <= target) return "good";
    else if (value <= target * 1.2) return "warning";
    else return "danger";
  } else {
    const percentage = (value / Math.max(target, 1)) * 100;
    if (percentage >= 100) return "excellent";
    else if (percentage >= 80) return "good";
    else if (percentage >= 60) return "warning";
    else return "danger";
  }
};

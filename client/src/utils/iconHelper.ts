import React from "react";
import {
  Target,
  Sparkles,
  Star,
  Medal,
  Trophy,
  Crown,
  Droplets,
  Waves,
  Mountain,
  Flame,
  Calendar,
  Dumbbell,
  Sunrise,
  Moon,
  BarChart3,
  Apple,
  Scale,
  Wheat,
  Gem,
  Zap,
  Award,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";

interface IconProps {
  size?: number;
  color?: string;
}

// Simple icon registry - much cleaner approach
const iconRegistry = {
  target: Target,
  sparkles: Sparkles,
  star: Star,
  medal: Medal,
  trophy: Trophy,
  crown: Crown,
  droplets: Droplets,
  waves: Waves,
  droplet: Droplets, // alias
  mountain: Mountain,
  "mountain-snow": Mountain, // alias
  flame: Flame,
  calendar: Calendar,
  dumbbell: Dumbbell,
  muscle: Dumbbell, // alias
  sunrise: Sunrise,
  moon: Moon,
  "bar-chart-3": BarChart3,
  chart: BarChart3, // alias
  apple: Apple,
  scale: Scale,
  wheat: Wheat,
  gem: Gem,
  zap: Zap,
  award: Award,
  "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
};

export const getAchievementIcon = (
  iconName: string,
  size: number = 20,
  color: string = "#16A085"
) => {
  const IconComponent =
    iconRegistry[iconName as keyof typeof iconRegistry] || Award;
  return React.createElement(IconComponent, { size, color });
};

export const getStatusIcon = (status: string, size: number = 16) => {
  const color = getStatusIconColor(status);

  const IconComponent =
    status === "excellent" || status === "good" ? CheckCircle : AlertTriangle;

  return React.createElement(IconComponent, { size, color });
};

export const getTrendIcon = (trend: string, size: number = 14) => {
  let IconComponent = Target;
  let color = "#64748B";

  if (trend === "up") {
    IconComponent = TrendingUp;
    color = "#10B981";
  } else if (trend === "down") {
    IconComponent = TrendingDown;
    color = "#EF4444";
  }

  return React.createElement(IconComponent, { size, color });
};

const getStatusIconColor = (status: string): string => {
  const colors = {
    excellent: "#10B981",
    good: "#F59E0B",
    warning: "#F97316",
    danger: "#EF4444",
  };

  return colors[status as keyof typeof colors] || "#64748B";
};

// Direct icon components export for JSX usage
export const AchievementIcons = {
  Target,
  Sparkles,
  Star,
  Medal,
  Trophy,
  Crown,
  Droplets,
  Waves,
  Mountain,
  Flame,
  Calendar,
  Dumbbell,
  Sunrise,
  Moon,
  BarChart3,
  Apple,
  Scale,
  Wheat,
  Gem,
  Zap,
  Award,
};

export const StatusIcons = {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
};

// Type-safe status colors
export const StatusColors = {
  excellent: "#10B981",
  good: "#F59E0B",
  warning: "#F97316",
  danger: "#EF4444",
  default: "#64748B",
} as const;

export type StatusType = keyof typeof StatusColors;

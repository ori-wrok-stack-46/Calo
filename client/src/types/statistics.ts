export interface NutritionMetric {
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

export interface ProgressData {
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

export interface Achievement {
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

export interface StatisticsData {
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

export interface UserQuestionnaire {
  mealsPerDay: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  dailyFiber: number;
  dailyWater: number;
}

export type TimePeriod = "today" | "week" | "month";
export type ChartType = "overview" | "macros" | "trends";
export interface TimeFilterOption {
  key: TimePeriod;
  label: string;
}

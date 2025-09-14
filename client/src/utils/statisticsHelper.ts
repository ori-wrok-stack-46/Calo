import { colors } from "../../constants/theme";
import {
  NutritionMetric,
  ProgressData,
  Achievement,
  TimePeriod,
} from "../types/statistics";

export interface NutritionStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface DailyStats extends NutritionStats {
  date: string;
  goalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  mealCount: number;
  waterIntake: number;
}

export interface WeeklyStats {
  totalCalories: number;
  averageCalories: number;
  totalProtein: number;
  averageProtein: number;
  totalCarbs: number;
  averageCarbs: number;
  totalFat: number;
  averageFat: number;
  totalFiber: number;
  averageFiber: number;
  totalSugar: number;
  averageSugar: number;
  totalSodium: number;
  averageSodium: number;
  totalMeals: number;
  averageMealsPerDay: number;
  daysWithData: number;
  dailyStats: DailyStats[];
  goalAchievementRate: number;
}

export class StatisticsHelper {
  static calculateDailyStats(
    meals: any[],
    dailyGoals: any | null,
    waterIntake: number = 0
  ): DailyStats {
    const stats = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein_g || meal.protein || 0),
        carbs: acc.carbs + (meal.carbs_g || meal.carbs || 0),
        fat: acc.fat + (meal.fats_g || meal.fat || meal.fats || 0),
        fiber: acc.fiber + (meal.fiber_g || meal.fiber || 0),
        sugar: acc.sugar + (meal.sugar_g || meal.sugar || 0),
        sodium: acc.sodium + (meal.sodium_mg || meal.sodium || 0),
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      }
    );

    // Use fallback values if daily goals are missing
    const fallbackGoals = {
      calories: 2000,
      protein_g: 120,
      carbs_g: 250,
      fats_g: 67,
    };

    return {
      ...stats,
      date: new Date().toISOString().split("T")[0],
      goalCalories: dailyGoals?.calories || fallbackGoals.calories,
      goalProtein: dailyGoals?.protein_g || fallbackGoals.protein_g,
      goalCarbs: dailyGoals?.carbs_g || fallbackGoals.carbs_g,
      goalFat: dailyGoals?.fats_g || fallbackGoals.fats_g,
      mealCount: meals.length,
      waterIntake,
    };
  }

  static calculateWeeklyStats(dailyStatsArray: DailyStats[]): WeeklyStats {
    const validDays = dailyStatsArray.filter((day) => day.mealCount > 0);
    const daysCount = Math.max(1, validDays.length);

    const totals = dailyStatsArray.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
        fiber: acc.fiber + day.fiber,
        sugar: acc.sugar + day.sugar,
        sodium: acc.sodium + day.sodium,
        meals: acc.meals + day.mealCount,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        meals: 0,
      }
    );

    // Calculate goal achievement rate
    const goalAchievements = validDays.map((day) => {
      const calorieAchievement = Math.min(day.calories / day.goalCalories, 1);
      const proteinAchievement = Math.min(day.protein / day.goalProtein, 1);
      const carbsAchievement = Math.min(day.carbs / day.goalCarbs, 1);
      const fatAchievement = Math.min(day.fat / day.goalFat, 1);

      return (
        (calorieAchievement +
          proteinAchievement +
          carbsAchievement +
          fatAchievement) /
        4
      );
    });

    const goalAchievementRate =
      goalAchievements.length > 0
        ? goalAchievements.reduce((sum, rate) => sum + rate, 0) /
          goalAchievements.length
        : 0;

    return {
      totalCalories: totals.calories,
      averageCalories: Math.round(totals.calories / daysCount),
      totalProtein: totals.protein,
      averageProtein: Math.round(totals.protein / daysCount),
      totalCarbs: totals.carbs,
      averageCarbs: Math.round(totals.carbs / daysCount),
      totalFat: totals.fat,
      averageFat: Math.round(totals.fat / daysCount),
      totalFiber: totals.fiber,
      averageFiber: Math.round(totals.fiber / daysCount),
      totalSugar: totals.sugar,
      averageSugar: Math.round(totals.sugar / daysCount),
      totalSodium: totals.sodium,
      averageSodium: Math.round(totals.sodium / daysCount),
      totalMeals: totals.meals,
      averageMealsPerDay: Math.round((totals.meals / daysCount) * 10) / 10,
      daysWithData: validDays.length,
      dailyStats: dailyStatsArray,
      goalAchievementRate: Math.round(goalAchievementRate * 100) / 100,
    };
  }

  static formatMacronutrientPercentage(
    protein: number,
    carbs: number,
    fat: number
  ): { protein: number; carbs: number; fat: number } {
    const proteinCals = protein * 4;
    const carbsCals = carbs * 4;
    const fatCals = fat * 9;
    const totalCals = proteinCals + carbsCals + fatCals;

    if (totalCals === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round((proteinCals / totalCals) * 100),
      carbs: Math.round((carbsCals / totalCals) * 100),
      fat: Math.round((fatCals / totalCals) * 100),
    };
  }

  static getProgressColor(current: number, goal: number): string {
    const percentage = (current / goal) * 100;
    if (percentage >= 100) return "#10b981"; // Green
    if (percentage >= 80) return "#f59e0b"; // Yellow
    if (percentage >= 50) return "#ef4444"; // Red
    return "#64748b"; // Gray
  }

  static calculateCaloriesBurned(
    bmr: number,
    activityMultiplier: number = 1.2
  ): number {
    return Math.round(bmr * activityMultiplier);
  }

  static calculateNetCalories(consumed: number, burned: number): number {
    return consumed - burned;
  }
}

export const getStatusColor = (status: string) => {
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

export interface NutritionGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  sodium_mg: number;
  sugar_g: number;
  water_ml: number;
}

export interface TimeframeData {
  period: "today" | "week" | "month";
  totalDays: number;
  goals: NutritionGoals;
  consumption: NutritionGoals;
  dailyBreakdown: DailyData[];
}

export interface DailyData {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  water_ml: number;
}

export const calculateTimeframeGoals = (
  dailyGoals: NutritionGoals,
  period: "today" | "week" | "month",
  totalDays: number
): NutritionGoals => {
  let multiplier = 1;

  switch (period) {
    case "today":
      multiplier = 1;
      break;
    case "week":
      multiplier = totalDays || 7;
      break;
    case "month":
      multiplier = totalDays || 30;
      break;
  }

  return {
    calories: dailyGoals.calories * multiplier,
    protein_g: dailyGoals.protein_g * multiplier,
    carbs_g: dailyGoals.carbs_g * multiplier,
    fats_g: dailyGoals.fats_g * multiplier,
    fiber_g: dailyGoals.fiber_g * multiplier,
    sodium_mg: dailyGoals.sodium_mg * multiplier,
    sugar_g: dailyGoals.sugar_g * multiplier,
    water_ml: dailyGoals.water_ml * multiplier,
  };
};

export const calculateAverages = (
  totalConsumption: NutritionGoals,
  totalDays: number
): NutritionGoals => {
  if (totalDays === 0) return totalConsumption;

  return {
    calories: Math.round(totalConsumption.calories / totalDays),
    protein_g: Math.round(totalConsumption.protein_g / totalDays),
    carbs_g: Math.round(totalConsumption.carbs_g / totalDays),
    fats_g: Math.round(totalConsumption.fats_g / totalDays),
    fiber_g: Math.round(totalConsumption.fiber_g / totalDays),
    sodium_mg: Math.round(totalConsumption.sodium_mg / totalDays),
    sugar_g: Math.round(totalConsumption.sugar_g / totalDays),
    water_ml: Math.round(totalConsumption.water_ml / totalDays),
  };
};

export const calculateProgressPercentages = (
  goals: NutritionGoals,
  consumption: NutritionGoals
): Record<keyof NutritionGoals, number> => {
  const percentages: Record<keyof NutritionGoals, number> = {} as any;

  (Object.keys(goals) as Array<keyof NutritionGoals>).forEach((key) => {
    if (goals[key] > 0) {
      percentages[key] = Math.round((consumption[key] / goals[key]) * 100);
    } else {
      percentages[key] = 0;
    }
  });

  return percentages;
};

export const getDetailedBreakdown = (
  dailyBreakdown: DailyData[],
  nutrient: keyof NutritionGoals
): Array<{ date: string; value: number; formatted: string }> => {
  return dailyBreakdown.map((day) => ({
    date: day.date,
    value: day[nutrient],
    formatted: formatNutrientValue(day[nutrient], nutrient),
  }));
};

export const formatNutrientValue = (
  value: number,
  nutrient: keyof NutritionGoals
): string => {
  const rounded = Math.round(value);

  switch (nutrient) {
    case "calories":
      return `${rounded.toLocaleString()} kcal`;
    case "protein_g":
    case "carbs_g":
    case "fats_g":
    case "fiber_g":
    case "sugar_g":
      return `${rounded}g`;
    case "sodium_mg":
      return `${rounded.toLocaleString()}mg`;
    case "water_ml":
      return `${rounded.toLocaleString()}ml`;
    default:
      return rounded.toString();
  }
};

export const getCompletionStatus = (
  percentage: number,
  nutrient: keyof NutritionGoals
): "excellent" | "good" | "warning" | "danger" => {
  // For nutrients we want to limit (sodium, sugar)
  const limitNutrients = ["sodium_mg", "sugar_g"];

  if (limitNutrients.includes(nutrient)) {
    if (percentage <= 80) return "excellent";
    if (percentage <= 100) return "good";
    if (percentage <= 120) return "warning";
    return "danger";
  }

  // For nutrients we want to meet/exceed (calories, protein, etc.)
  if (percentage >= 100) return "excellent";
  if (percentage >= 80) return "good";
  if (percentage >= 60) return "warning";
  return "danger";
};

export const generateInsights = (
  timeframeData: TimeframeData
): Array<{
  type: string;
  message: string;
  priority: "high" | "medium" | "low";
}> => {
  const insights: Array<{
    type: string;
    message: string;
    priority: "high" | "medium" | "low";
  }> = [];
  const percentages = calculateProgressPercentages(
    timeframeData.goals,
    timeframeData.consumption
  );
  const averages = calculateAverages(
    timeframeData.consumption,
    timeframeData.totalDays
  );

  // Calorie insights
  if (percentages.calories < 60) {
    insights.push({
      type: "calories_low",
      message: `Your calorie intake is very low (${percentages.calories}% of goal). Consider adding more nutritious foods.`,
      priority: "high",
    });
  } else if (percentages.calories > 120) {
    insights.push({
      type: "calories_high",
      message: `Your calorie intake is above your goal (${percentages.calories}% of goal). Consider portion control.`,
      priority: "medium",
    });
  }

  // Protein insights
  if (percentages.protein_g < 80) {
    insights.push({
      type: "protein_low",
      message: `Your protein intake could be higher (${percentages.protein_g}% of goal). Try adding lean meats, legumes, or protein powder.`,
      priority: "medium",
    });
  }

  // Fiber insights
  if (percentages.fiber_g < 70) {
    insights.push({
      type: "fiber_low",
      message: `Your fiber intake is low (${percentages.fiber_g}% of goal). Add more fruits, vegetables, and whole grains.`,
      priority: "medium",
    });
  }

  // Sodium insights
  if (percentages.sodium_mg > 110) {
    insights.push({
      type: "sodium_high",
      message: `Your sodium intake is high (${percentages.sodium_mg}% of limit). Try reducing processed foods and adding more fresh ingredients.`,
      priority: "high",
    });
  }

  // Water insights
  if (percentages.water_ml < 80) {
    insights.push({
      type: "water_low",
      message: `Your hydration could be better (${percentages.water_ml}% of goal). Try drinking more water throughout the day.`,
      priority: "medium",
    });
  }

  return insights;
};

export const formatPeriodLabel = (
  period: "today" | "week" | "month"
): string => {
  switch (period) {
    case "today":
      return "Today";
    case "week":
      return "This Week";
    case "month":
      return "This Month";
    default:
      return "Period";
  }
};

export const getDateRangeString = (dailyBreakdown: DailyData[]): string => {
  if (dailyBreakdown.length === 0) return "";

  const sortedDays = [...dailyBreakdown].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const startDate = new Date(sortedDays[0].date).toLocaleDateString();
  const endDate = new Date(
    sortedDays[sortedDays.length - 1].date
  ).toLocaleDateString();

  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} - ${endDate}`;
};

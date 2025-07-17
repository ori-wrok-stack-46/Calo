import { prisma } from "../lib/database";

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
}

export class StatisticsService {
  static async getNutritionStatistics(
    userId: string,
    period: "today" | "week" | "month" = "week"
  ): Promise<{ success: boolean; data: StatisticsData }> {
    try {
      console.log(
        `📊 Getting statistics for user: ${userId}, period: ${period}`
      );

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get user's meals for the period
      const meals = await prisma.meal.findMany({
        where: {
          user_id: userId,
          upload_time: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: {
          upload_time: "desc",
        },
      });

      // Get user's daily goals
      const dailyGoals = await prisma.dailyGoal.findMany({
        where: {
          user_id: userId,
          date: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      // Get water intake data
      const waterIntakes = await prisma.waterIntake.findMany({
        where: {
          user_id: userId,
          date: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      // Calculate daily breakdown
      const dailyBreakdown = await this.calculateDailyBreakdown(
        meals,
        dailyGoals,
        waterIntakes,
        startDate,
        now
      );

      // Calculate averages
      const averages = this.calculateAverages(meals);

      // Calculate streaks and achievements
      const streaks = await this.calculateStreaks(userId, dailyGoals);

      // Calculate user level and XP
      const levelData = await this.calculateUserLevel(userId);

      // Get achievements and badges
      const achievements = await this.getAchievements(userId);
      const badges = await this.getBadges(userId);

      // Calculate wellbeing metrics
      const wellbeingMetrics = await this.calculateWellbeingMetrics(
        userId,
        startDate,
        now
      );

      const statisticsData: StatisticsData = {
        level: levelData.level,
        currentXP: levelData.currentXP,
        totalPoints: levelData.totalPoints,
        currentStreak: streaks.currentStreak,
        weeklyStreak: streaks.weeklyStreak,
        perfectDays: streaks.perfectDays,
        dailyGoalDays: dailyGoals.length,
        totalDays: Math.ceil(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
        averageCalories: averages.calories,
        averageProtein: averages.protein,
        averageCarbs: averages.carbs,
        averageFats: averages.fats,
        averageFiber: averages.fiber,
        averageSugar: averages.sugar,
        averageSodium: averages.sodium,
        averageFluids: averages.fluids,
        achievements,
        badges,
        dailyBreakdown,
        successfulDays: streaks.successfulDays,
        averageCompletion: streaks.averageCompletion,
        bestStreak: streaks.bestStreak,
        happyDays: wellbeingMetrics.happyDays,
        highEnergyDays: wellbeingMetrics.highEnergyDays,
        satisfiedDays: wellbeingMetrics.satisfiedDays,
        averageMealQuality: wellbeingMetrics.averageMealQuality,
      };

      console.log(`✅ Statistics calculated successfully for user: ${userId}`);
      return { success: true, data: statisticsData };
    } catch (error) {
      console.error("❌ Error getting statistics:", error);
      throw error;
    }
  }

  private static async calculateDailyBreakdown(
    meals: any[],
    dailyGoals: any[],
    waterIntakes: any[],
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const dailyBreakdown: any[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayMeals = meals.filter(
        (meal) => meal.upload_time.toISOString().split("T")[0] === dateStr
      );

      const dayGoal = dailyGoals.find(
        (goal) => goal.date.toISOString().split("T")[0] === dateStr
      );

      const dayWater = waterIntakes.find(
        (water) => water.date.toISOString().split("T")[0] === dateStr
      );

      const dayTotals = dayMeals.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein_g: acc.protein_g + (meal.protein_g || 0),
          carbs_g: acc.carbs_g + (meal.carbs_g || 0),
          fats_g: acc.fats_g + (meal.fats_g || 0),
          fiber_g: acc.fiber_g + (meal.fiber_g || 0),
          sugar_g: acc.sugar_g + (meal.sugar_g || 0),
          sodium_mg: acc.sodium_mg + (meal.sodium_mg || 0),
          liquids_ml: acc.liquids_ml + (meal.liquids_ml || 0),
        }),
        {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fats_g: 0,
          fiber_g: 0,
          sugar_g: 0,
          sodium_mg: 0,
          liquids_ml: dayWater?.milliliters_consumed || 0,
        }
      );

      dailyBreakdown.push({
        date: dateStr,
        ...dayTotals,
        water_cups: dayWater?.cups_consumed || 0,
        mood: "neutral",
        energy: "medium",
        satiety: "satisfied",
        meal_quality: 3,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyBreakdown;
  }

  private static calculateAverages(meals: any[]): {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    sugar: number;
    sodium: number;
    fluids: number;
  } {
    if (meals.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        fluids: 0,
      };
    }

    // Group by date to get daily averages
    const dailyTotals = new Map<string, any>();
    meals.forEach((meal) => {
      const date = meal.upload_time.toISOString().split("T")[0];
      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          fluids: 0,
        });
      }
      const dayTotal = dailyTotals.get(date);
      dayTotal.calories += meal.calories || 0;
      dayTotal.protein += meal.protein_g || 0;
      dayTotal.carbs += meal.carbs_g || 0;
      dayTotal.fats += meal.fats_g || 0;
      dayTotal.fiber += meal.fiber_g || 0;
      dayTotal.sugar += meal.sugar_g || 0;
      dayTotal.sodium += meal.sodium_mg || 0;
      dayTotal.fluids += meal.liquids_ml || 0;
    });

    const numDays = dailyTotals.size || 1;
    const dailyValues = Array.from(dailyTotals.values());
    const averages = dailyValues.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fats: acc.fats + day.fats,
        fiber: acc.fiber + day.fiber,
        sugar: acc.sugar + day.sugar,
        sodium: acc.sodium + day.sodium,
        fluids: acc.fluids + day.fluids,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        fluids: 0,
      }
    );

    return {
      calories: Math.round(averages.calories / numDays),
      protein: Math.round(averages.protein / numDays),
      carbs: Math.round(averages.carbs / numDays),
      fats: Math.round(averages.fats / numDays),
      fiber: Math.round(averages.fiber / numDays),
      sugar: Math.round(averages.sugar / numDays),
      sodium: Math.round(averages.sodium / numDays),
      fluids: Math.round(averages.fluids / numDays),
    };
  }

  private static async calculateStreaks(
    userId: string,
    dailyGoals: any[]
  ): Promise<{
    currentStreak: number;
    weeklyStreak: number;
    perfectDays: number;
    successfulDays: number;
    averageCompletion: number;
    bestStreak: number;
  }> {
    try {
      // Get all water intake records for streak calculation
      const allWaterIntakes = await prisma.waterIntake.findMany({
        where: { user_id: userId },
        orderBy: { date: "desc" },
      });

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      let perfectDays = 0;
      let successfulDays = 0;
      let totalCompletion = 0;

      // Calculate streaks based on water intake (8+ cups = successful day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < allWaterIntakes.length; i++) {
        const waterRecord = allWaterIntakes[i];
        const waterDate = new Date(waterRecord.date);
        waterDate.setHours(0, 0, 0, 0);

        const cups = waterRecord.cups_consumed || 0;
        const completion = Math.min(100, (cups / 8) * 100);
        totalCompletion += completion;

        if (cups >= 8) {
          successfulDays++;
          if (cups >= 12) {
            perfectDays++;
          }

          tempStreak++;
          if (i === 0) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
          tempStreak = 0;
        }
      }

      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }

      const weeklyStreak = Math.floor(currentStreak / 7);
      const averageCompletion =
        allWaterIntakes.length > 0
          ? totalCompletion / allWaterIntakes.length
          : 0;

      return {
        currentStreak,
        weeklyStreak,
        perfectDays,
        successfulDays,
        averageCompletion: Math.round(averageCompletion),
        bestStreak,
      };
    } catch (error) {
      console.error("Error calculating streaks:", error);
      return {
        currentStreak: 0,
        weeklyStreak: 0,
        perfectDays: 0,
        successfulDays: 0,
        averageCompletion: 0,
        bestStreak: 0,
      };
    }
  }

  private static async calculateUserLevel(userId: string): Promise<{
    level: number;
    currentXP: number;
    totalPoints: number;
  }> {
    try {
      // Get user's current data
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          level: true,
          current_xp: true,
          total_points: true,
        },
      });

      if (!user) {
        return { level: 1, currentXP: 0, totalPoints: 0 };
      }

      const level = user.level || 1;
      const currentXP = user.current_xp || 0;
      const totalPoints = user.total_points || 0;

      return { level, currentXP, totalPoints };
    } catch (error) {
      console.error("Error calculating user level:", error);
      return { level: 1, currentXP: 0, totalPoints: 0 };
    }
  }

  private static async getAchievements(userId: string): Promise<any[]> {
    try {
      // First ensure some basic achievements exist
      await this.ensureBasicAchievements();

      // Get user's achievements from database
      const achievements = await prisma.userAchievement.findMany({
        where: { user_id: userId },
        include: {
          achievement: true,
        },
      });

      return achievements.map((userAchievement) => ({
        id: userAchievement.achievement.id,
        title: userAchievement.achievement.title,
        description: userAchievement.achievement.description,
        category: userAchievement.achievement.category,
        progress: userAchievement.progress,
        max_progress: userAchievement.achievement.max_progress,
        unlocked: userAchievement.unlocked,
        unlocked_at: userAchievement.unlocked_date,
      }));
    } catch (error) {
      console.error("Error getting achievements:", error);
      return [];
    }
  }

  private static async getBadges(userId: string): Promise<any[]> {
    try {
      // Get user's badges from database
      const badges = await prisma.userBadge.findMany({
        where: { user_id: userId },
        include: {
          badge: true,
        },
      });

      return badges.map((userBadge) => ({
        id: userBadge.badge.id,
        name: userBadge.badge.name,
        description: userBadge.badge.description,
        rarity: userBadge.badge.rarity,
        earned_date: userBadge.earned_date,
      }));
    } catch (error) {
      console.error("Error getting badges:", error);
      return [];
    }
  }

  private static async calculateWellbeingMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    happyDays: number;
    highEnergyDays: number;
    satisfiedDays: number;
    averageMealQuality: number;
  }> {
    try {
      // For now, return mock data since we don't have mood tracking yet
      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        happyDays: Math.floor(totalDays * 0.7),
        highEnergyDays: Math.floor(totalDays * 0.6),
        satisfiedDays: Math.floor(totalDays * 0.8),
        averageMealQuality: 3.5,
      };
    } catch (error) {
      console.error("Error calculating wellbeing metrics:", error);
      return {
        happyDays: 0,
        highEnergyDays: 0,
        satisfiedDays: 0,
        averageMealQuality: 3,
      };
    }
  }

  private static async ensureBasicAchievements(): Promise<void> {
    try {
      // Create basic achievements if they don't exist
      const basicAchievements = [
        {
          id: "first_scan",
          title: "First Scan",
          description: "Scan your first food item",
          category: "STREAK",
          max_progress: 1,
          points_awarded: 50,
        },
        {
          id: "water_warrior",
          title: "Water Warrior",
          description: "Drink 8 cups of water in a day",
          category: "GOAL",
          max_progress: 1,
          points_awarded: 100,
        },
        {
          id: "week_streak",
          title: "Week Streak",
          description: "Maintain a 7-day water intake streak",
          category: "STREAK",
          max_progress: 7,
          points_awarded: 200,
        },
      ];

      for (const achievement of basicAchievements) {
        await prisma.achievement.upsert({
          where: { id: achievement.id },
          update: {},
          create: achievement,
        });
      }
    } catch (error) {
      console.error("Error ensuring basic achievements:", error);
    }
  }

  static async generatePDFReport(userId: string): Promise<Buffer> {
    // This would generate a PDF report - placeholder for now
    return Buffer.from("PDF Report");
  }

  static async generateInsights(userId: string): Promise<any> {
    try {
      const statistics = await this.getNutritionStatistics(userId, "month");

      const insights = {
        mainInsights: [
          {
            type: "protein",
            message: `You're meeting protein goals ${Math.round(
              (statistics.data.averageProtein / 120) * 100
            )}% of days this month.`,
            category: "nutrition",
          },
          {
            type: "hydration",
            message: `Your water intake averaged ${statistics.data.averageFluids}ml daily.`,
            category: "lifestyle",
          },
          {
            type: "streak",
            message: `Current streak: ${statistics.data.currentStreak} days!`,
            category: "motivation",
          },
        ],
        recommendations: [
          {
            type: "fiber",
            message: "Consider adding more fiber-rich foods to your diet.",
            priority: "medium",
          },
          {
            type: "sodium",
            message: "Try to reduce sodium intake by limiting processed foods.",
            priority: "high",
          },
        ],
      };

      return { success: true, data: insights };
    } catch (error) {
      console.error("Error generating insights:", error);
      throw error;
    }
  }
}

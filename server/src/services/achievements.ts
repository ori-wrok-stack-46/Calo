import { prisma } from "../lib/database";

export interface UserStats {
  currentStreak: number;
  bestStreak: number;
  totalCompleteDays: number;
  level: number;
  totalWaterGoals: number;
  totalCalorieGoals: number;
  totalXP: number;
}

export class AchievementService {
  // Get all achievements from database
  private static async getAllAchievements() {
    return await prisma.achievement.findMany({
      orderBy: { points_awarded: "asc" },
    });
  }

  static async checkAndAwardAchievements(userId: string): Promise<{
    newAchievements: any[];
    xpGained: number;
    leveledUp: boolean;
    newLevel?: number;
  }> {
    try {
      // Get user stats
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          current_streak: true,
          best_streak: true,
          total_complete_days: true,
          level: true,
          current_xp: true,
          total_points: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get water intake count
      const waterIntakeCount = await prisma.waterIntake.count({
        where: {
          user_id: userId,
          cups_consumed: { gte: 8 },
        },
      });

      // Get calorie goal completions (approximate)
      const mealDays = await prisma.meal.groupBy({
        by: ["upload_time"],
        where: { user_id: userId },
        _sum: { calories: true },
        having: {
          calories: { _sum: { gte: 1800 } },
        },
      });

      const userStats: UserStats = {
        currentStreak: user.current_streak || 0,
        bestStreak: user.best_streak || 0,
        totalCompleteDays: user.total_complete_days || 0,
        level: user.level || 1,
        totalWaterGoals: waterIntakeCount,
        totalCalorieGoals: mealDays.length,
        totalXP: user.total_points || 0,
      };

      // Get existing achievements
      const existingAchievements = await prisma.userAchievement.findMany({
        where: { user_id: userId, unlocked: true },
        select: { achievement_id: true },
      });

      const existingIds = existingAchievements.map((a) => a.achievement_id);
      const newAchievements = [];
      let totalXPGained = 0;

      // Fetch all active achievements from the database
      const activeAchievements = await this.getAllAchievements();

      // Check each achievement
      for (const achievement of activeAchievements) {
        if (existingIds.includes(achievement.id)) continue;

        let shouldUnlock = false;

        // Check achievement conditions based on key
        switch (achievement.key) {
          // Milestone achievements
          case "first_scan":
            const scanCount = await prisma.user.findUnique({
              where: { user_id: userId },
              select: { ai_requests_count: true },
            });
            if ((scanCount?.ai_requests_count || 0) >= 1) shouldUnlock = true;
            break;

          case "first_complete_day":
            if (userStats.totalCompleteDays >= 1) shouldUnlock = true;
            break;

          case "total_5_days":
            if (userStats.totalCompleteDays >= 5) shouldUnlock = true;
            break;

          case "total_10_days":
            if (userStats.totalCompleteDays >= 10) shouldUnlock = true;
            break;

          case "total_25_days":
            if (userStats.totalCompleteDays >= 25) shouldUnlock = true;
            break;

          case "total_50_days":
            if (userStats.totalCompleteDays >= 50) shouldUnlock = true;
            break;

          case "total_100_days":
            if (userStats.totalCompleteDays >= 100) shouldUnlock = true;
            break;

          // Water achievements
          case "first_water_goal":
            if (userStats.totalWaterGoals >= 1) shouldUnlock = true;
            break;

          case "water_warrior":
            if (userStats.totalWaterGoals >= 10) shouldUnlock = true;
            break;

          case "hydration_habit":
            if (userStats.totalWaterGoals >= 7) shouldUnlock = true;
            break;

          case "aqua_master":
            if (userStats.totalWaterGoals >= 30) shouldUnlock = true;
            break;

          // Streak achievements
          case "streak_3_days":
            if (userStats.currentStreak >= 3) shouldUnlock = true;
            break;

          case "streak_7_days":
            if (userStats.currentStreak >= 7) shouldUnlock = true;
            break;

          case "streak_14_days":
            if (userStats.currentStreak >= 14) shouldUnlock = true;
            break;

          case "streak_30_days":
            if (userStats.currentStreak >= 30) shouldUnlock = true;
            break;

          case "streak_100_days":
            if (userStats.currentStreak >= 100) shouldUnlock = true;
            break;

          // Level achievements
          case "level_5":
            if (userStats.level >= 5) shouldUnlock = true;
            break;

          case "level_10":
            if (userStats.level >= 10) shouldUnlock = true;
            break;

          case "level_25":
            if (userStats.level >= 25) shouldUnlock = true;
            break;

          case "level_50":
            if (userStats.level >= 50) shouldUnlock = true;
            break;
        }

        if (shouldUnlock) {
          // Award achievement to user
          await prisma.userAchievement.upsert({
            where: {
              user_id_achievement_id: {
                user_id: userId,
                achievement_id: achievement.id,
              },
            },
            update: {
              unlocked: true,
              unlocked_date: new Date(),
              progress: achievement.max_progress,
            },
            create: {
              user_id: userId,
              achievement_id: achievement.id,
              progress: achievement.max_progress,
              unlocked: true,
              unlocked_date: new Date(),
            },
          });

          newAchievements.push({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            xpReward: achievement.points_awarded,
            icon: achievement.icon,
            rarity: "COMMON",
          });

          totalXPGained += achievement.points_awarded;
        }
      }

      // Update user XP and level
      let leveledUp = false;
      let newLevel = user.level || 1;

      if (totalXPGained > 0) {
        const newTotalPoints = (user.total_points || 0) + totalXPGained;
        const newCurrentXP = (user.current_xp || 0) + totalXPGained;

        // Calculate new level (100 XP per level)
        const calculatedLevel = Math.floor(newTotalPoints / 100) + 1;

        if (calculatedLevel > (user.level || 1)) {
          leveledUp = true;
          newLevel = calculatedLevel;
        }

        const finalCurrentXP = newCurrentXP % 100;

        await prisma.user.update({
          where: { user_id: userId },
          data: {
            total_points: newTotalPoints,
            current_xp: finalCurrentXP,
            level: newLevel,
          },
        });
      }

      return {
        newAchievements,
        xpGained: totalXPGained,
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
      };
    } catch (error) {
      console.error("Error checking achievements:", error);
      return {
        newAchievements: [],
        xpGained: 0,
        leveledUp: false,
      };
    }
  }

  static async updateUserProgress(
    userId: string,
    completeDay: boolean = false,
    waterGoalComplete: boolean = false,
    calorieGoalComplete: boolean = false,
    xpAwarded: number = 0
  ) {
    try {
      console.log("🏆 Checking achievements for user:", userId);

      // Get user's current data
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          level: true,
          current_xp: true,
          total_points: true,
          current_streak: true,
          best_streak: true,
          total_complete_days: true,
          ai_requests_count: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      let totalXpGained = xpAwarded;
      let leveledUp = false;
      let newLevel = user.level || 1;
      let newAchievements: any[] = [];
      let streakUpdate = null;

      // Update streak and total complete days if complete day
      let currentStreak = user.current_streak || 0;
      let totalCompleteDays = user.total_complete_days || 0;

      if (completeDay) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if yesterday was completed to continue streak
        const yesterdayComplete = await this.wasYesterDayComplete(
          userId,
          yesterday
        );

        currentStreak = yesterdayComplete ? currentStreak + 1 : 1;
        let newBestStreak = Math.max(currentStreak, user.best_streak || 0);
        totalCompleteDays = totalCompleteDays + 1;

        // Update user streak data
        await prisma.user.update({
          where: { user_id: userId },
          data: {
            current_streak: currentStreak,
            best_streak: newBestStreak,
            total_complete_days: totalCompleteDays,
          },
        });

        streakUpdate = {
          newStreak: currentStreak,
          newBestStreak,
          newTotalCompleteDays: totalCompleteDays,
        };
      }

      // Get all available achievements
      const allAchievements = await this.getAllAchievements();

      // Get user's existing achievements
      const userAchievements = await prisma.userAchievement.findMany({
        where: { user_id: userId },
        include: { achievement: true },
      });

      const unlockedKeys = new Set(
        userAchievements.map((ua) => ua.achievement.key)
      );

      // Check each achievement condition
      for (const achievement of allAchievements) {
        if (unlockedKeys.has(achievement.key)) continue;

        let shouldUnlock = false;

        // Check achievement conditions based on category and key
        switch (achievement.category) {
          case "MILESTONE":
            if (
              achievement.key === "first_scan" &&
              (user.ai_requests_count || 0) >= 1
            )
              shouldUnlock = true;
            if (achievement.key === "first_complete_day" && completeDay)
              shouldUnlock = true;
            if (achievement.key === "total_5_days" && totalCompleteDays >= 5)
              shouldUnlock = true;
            if (achievement.key === "total_10_days" && totalCompleteDays >= 10)
              shouldUnlock = true;
            if (achievement.key === "total_25_days" && totalCompleteDays >= 25)
              shouldUnlock = true;
            if (achievement.key === "total_50_days" && totalCompleteDays >= 50)
              shouldUnlock = true;
            if (
              achievement.key === "total_100_days" &&
              totalCompleteDays >= 100
            )
              shouldUnlock = true;
            break;

          case "GOAL":
            if (achievement.key === "first_water_goal" && waterGoalComplete)
              shouldUnlock = true;
            if (achievement.key === "water_warrior" && waterGoalComplete)
              shouldUnlock = true;
            break;

          case "STREAK":
            if (achievement.key === "streak_3_days" && currentStreak >= 3)
              shouldUnlock = true;
            if (achievement.key === "streak_7_days" && currentStreak >= 7)
              shouldUnlock = true;
            if (achievement.key === "streak_14_days" && currentStreak >= 14)
              shouldUnlock = true;
            if (achievement.key === "streak_30_days" && currentStreak >= 30)
              shouldUnlock = true;
            if (achievement.key === "streak_100_days" && currentStreak >= 100)
              shouldUnlock = true;
            break;

          case "LEVEL":
            if (achievement.key === "level_5" && (user.level || 1) >= 5)
              shouldUnlock = true;
            if (achievement.key === "level_10" && (user.level || 1) >= 10)
              shouldUnlock = true;
            if (achievement.key === "level_25" && (user.level || 1) >= 25)
              shouldUnlock = true;
            if (achievement.key === "level_50" && (user.level || 1) >= 50)
              shouldUnlock = true;
            break;
        }

        if (shouldUnlock) {
          // Create user achievement
          await prisma.userAchievement.create({
            data: {
              user_id: userId,
              achievement_id: achievement.id,
              progress: achievement.max_progress,
              unlocked: true,
              unlocked_date: new Date(),
            },
          });

          totalXpGained += achievement.points_awarded;
          newAchievements.push({
            key: achievement.key,
            title: achievement.title,
            description: achievement.description,
            points: achievement.points_awarded,
            icon: achievement.icon,
          });

          console.log(
            `🎉 Achievement unlocked: ${achievement.title} (+${achievement.points_awarded} XP)`
          );
        }
      }

      // Update user XP and level if XP gained
      if (totalXpGained > 0) {
        const newXP = (user.current_xp || 0) + totalXpGained;
        const newTotalPoints = (user.total_points || 0) + totalXpGained;

        // Calculate level (100 XP per level)
        const calculatedLevel = Math.floor(newTotalPoints / 100) + 1;

        if (calculatedLevel > (user.level || 1)) {
          leveledUp = true;
          newLevel = calculatedLevel;
        }

        await prisma.user.update({
          where: { user_id: userId },
          data: {
            current_xp: newXP % 100,
            total_points: newTotalPoints,
            level: newLevel,
          },
        });
      }

      console.log(
        `✅ Achievement update complete: +${totalXpGained} XP, ${newAchievements.length} new achievements`
      );

      import { prisma } from "../lib/database";

      export interface UserStats {
        currentStreak: number;
        bestStreak: number;
        totalCompleteDays: number;
        level: number;
        totalWaterGoals: number;
        totalCalorieGoals: number;
        totalXP: number;
      }

      export class AchievementService {
        // Get all achievements from database
        private static async getAllAchievements() {
          return await prisma.achievement.findMany({
            orderBy: { points_awarded: "asc" },
          });
        }

        static async checkAndAwardAchievements(userId: string): Promise<{
          newAchievements: any[];
          xpGained: number;
          leveledUp: boolean;
          newLevel?: number;
        }> {
          try {
            // Get user stats
            const user = await prisma.user.findUnique({
              where: { user_id: userId },
              select: {
                current_streak: true,
                best_streak: true,
                total_complete_days: true,
                level: true,
                current_xp: true,
                total_points: true,
              },
            });

            if (!user) {
              throw new Error("User not found");
            }

            // Get water intake count
            const waterIntakeCount = await prisma.waterIntake.count({
              where: {
                user_id: userId,
                cups_consumed: { gte: 8 },
              },
            });

            // Get calorie goal completions (approximate)
            const mealDays = await prisma.meal.groupBy({
              by: ["upload_time"],
              where: { user_id: userId },
              _sum: { calories: true },
              having: {
                calories: { _sum: { gte: 1800 } },
              },
            });

            const userStats: UserStats = {
              currentStreak: user.current_streak || 0,
              bestStreak: user.best_streak || 0,
              totalCompleteDays: user.total_complete_days || 0,
              level: user.level || 1,
              totalWaterGoals: waterIntakeCount,
              totalCalorieGoals: mealDays.length,
              totalXP: user.total_points || 0,
            };

            // Get existing achievements
            const existingAchievements = await prisma.userAchievement.findMany({
              where: { user_id: userId, unlocked: true },
              select: { achievement_id: true },
            });

            const existingIds = existingAchievements.map(
              (a) => a.achievement_id
            );
            const newAchievements = [];
            let totalXPGained = 0;

            // Fetch all active achievements from the database
            const activeAchievements = await this.getAllAchievements();

            // Check each achievement
            for (const achievement of activeAchievements) {
              if (existingIds.includes(achievement.id)) continue;

              let shouldUnlock = false;

              // Check achievement conditions based on key
              switch (achievement.key) {
                // Milestone achievements
                case "first_scan":
                  const scanCount = await prisma.user.findUnique({
                    where: { user_id: userId },
                    select: { ai_requests_count: true },
                  });
                  if ((scanCount?.ai_requests_count || 0) >= 1)
                    shouldUnlock = true;
                  break;

                case "first_complete_day":
                  if (userStats.totalCompleteDays >= 1) shouldUnlock = true;
                  break;

                case "total_5_days":
                  if (userStats.totalCompleteDays >= 5) shouldUnlock = true;
                  break;

                case "total_10_days":
                  if (userStats.totalCompleteDays >= 10) shouldUnlock = true;
                  break;

                case "total_25_days":
                  if (userStats.totalCompleteDays >= 25) shouldUnlock = true;
                  break;

                case "total_50_days":
                  if (userStats.totalCompleteDays >= 50) shouldUnlock = true;
                  break;

                case "total_100_days":
                  if (userStats.totalCompleteDays >= 100) shouldUnlock = true;
                  break;

                // Water achievements
                case "first_water_goal":
                  if (userStats.totalWaterGoals >= 1) shouldUnlock = true;
                  break;

                case "water_warrior":
                  if (userStats.totalWaterGoals >= 10) shouldUnlock = true;
                  break;

                case "hydration_habit":
                  if (userStats.totalWaterGoals >= 7) shouldUnlock = true;
                  break;

                case "aqua_master":
                  if (userStats.totalWaterGoals >= 30) shouldUnlock = true;
                  break;

                // Streak achievements
                case "streak_3_days":
                  if (userStats.currentStreak >= 3) shouldUnlock = true;
                  break;

                case "streak_7_days":
                  if (userStats.currentStreak >= 7) shouldUnlock = true;
                  break;

                case "streak_14_days":
                  if (userStats.currentStreak >= 14) shouldUnlock = true;
                  break;

                case "streak_30_days":
                  if (userStats.currentStreak >= 30) shouldUnlock = true;
                  break;

                case "streak_100_days":
                  if (userStats.currentStreak >= 100) shouldUnlock = true;
                  break;

                // Level achievements
                case "level_5":
                  if (userStats.level >= 5) shouldUnlock = true;
                  break;

                case "level_10":
                  if (userStats.level >= 10) shouldUnlock = true;
                  break;

                case "level_25":
                  if (userStats.level >= 25) shouldUnlock = true;
                  break;

                case "level_50":
                  if (userStats.level >= 50) shouldUnlock = true;
                  break;
              }

              if (shouldUnlock) {
                // Award achievement to user
                await prisma.userAchievement.upsert({
                  where: {
                    user_id_achievement_id: {
                      user_id: userId,
                      achievement_id: achievement.id,
                    },
                  },
                  update: {
                    unlocked: true,
                    unlocked_date: new Date(),
                    progress: achievement.max_progress,
                  },
                  create: {
                    user_id: userId,
                    achievement_id: achievement.id,
                    progress: achievement.max_progress,
                    unlocked: true,
                    unlocked_date: new Date(),
                  },
                });

                newAchievements.push({
                  id: achievement.id,
                  title: achievement.title,
                  description: achievement.description,
                  xpReward: achievement.points_awarded,
                  icon: achievement.icon,
                  rarity: "COMMON",
                });

                totalXPGained += achievement.points_awarded;
              }
            }

            // Update user XP and level
            let leveledUp = false;
            let newLevel = user.level || 1;

            if (totalXPGained > 0) {
              const newTotalPoints = (user.total_points || 0) + totalXPGained;
              const newCurrentXP = (user.current_xp || 0) + totalXPGained;

              // Calculate new level (100 XP per level)
              const calculatedLevel = Math.floor(newTotalPoints / 100) + 1;

              if (calculatedLevel > (user.level || 1)) {
                leveledUp = true;
                newLevel = calculatedLevel;
              }

              const finalCurrentXP = newCurrentXP % 100;

              await prisma.user.update({
                where: { user_id: userId },
                data: {
                  total_points: newTotalPoints,
                  current_xp: finalCurrentXP,
                  level: newLevel,
                },
              });
            }

            return {
              newAchievements,
              xpGained: totalXPGained,
              leveledUp,
              newLevel: leveledUp ? newLevel : undefined,
            };
          } catch (error) {
            console.error("Error checking achievements:", error);
            return {
              newAchievements: [],
              xpGained: 0,
              leveledUp: false,
            };
          }
        }

        static async updateUserProgress(
          userId: string,
          completeDay: boolean = false,
          waterGoalComplete: boolean = false,
          calorieGoalComplete: boolean = false,
          xpAwarded: number = 0
        ) {
          try {
            console.log("🏆 Checking achievements for user:", userId);

            // Get user's current data
            const user = await prisma.user.findUnique({
              where: { user_id: userId },
              select: {
                level: true,
                current_xp: true,
                total_points: true,
                current_streak: true,
                best_streak: true,
                total_complete_days: true,
                ai_requests_count: true,
              },
            });

            if (!user) {
              throw new Error("User not found");
            }

            let totalXpGained = xpAwarded;
            let leveledUp = false;
            let newLevel = user.level || 1;
            let newAchievements: any[] = [];
            let streakUpdate = null;

            // Update streak and total complete days if complete day
            let currentStreak = user.current_streak || 0;
            let totalCompleteDays = user.total_complete_days || 0;

            if (completeDay) {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);

              // Check if yesterday was completed to continue streak
              const yesterdayComplete = await this.wasYesterDayComplete(
                userId,
                yesterday
              );

              currentStreak = yesterdayComplete ? currentStreak + 1 : 1;
              let newBestStreak = Math.max(
                currentStreak,
                user.best_streak || 0
              );
              totalCompleteDays = totalCompleteDays + 1;

              // Update user streak data
              await prisma.user.update({
                where: { user_id: userId },
                data: {
                  current_streak: currentStreak,
                  best_streak: newBestStreak,
                  total_complete_days: totalCompleteDays,
                },
              });

              streakUpdate = {
                newStreak: currentStreak,
                newBestStreak,
                newTotalCompleteDays: totalCompleteDays,
              };
            }

            // Get all available achievements
            const allAchievements = await this.getAllAchievements();

            // Get user's existing achievements
            const userAchievements = await prisma.userAchievement.findMany({
              where: { user_id: userId },
              include: { achievement: true },
            });

            const unlockedKeys = new Set(
              userAchievements.map((ua) => ua.achievement.key)
            );

            // Check each achievement condition
            for (const achievement of allAchievements) {
              if (unlockedKeys.has(achievement.key)) continue;

              let shouldUnlock = false;

              // Check achievement conditions based on category and key
              switch (achievement.category) {
                case "MILESTONE":
                  if (
                    achievement.key === "first_scan" &&
                    (user.ai_requests_count || 0) >= 1
                  )
                    shouldUnlock = true;
                  if (achievement.key === "first_complete_day" && completeDay)
                    shouldUnlock = true;
                  if (
                    achievement.key === "total_5_days" &&
                    totalCompleteDays >= 5
                  )
                    shouldUnlock = true;
                  if (
                    achievement.key === "total_10_days" &&
                    totalCompleteDays >= 10
                  )
                    shouldUnlock = true;
                  if (
                    achievement.key === "total_25_days" &&
                    totalCompleteDays >= 25
                  )
                    shouldUnlock = true;
                  if (
                    achievement.key === "total_50_days" &&
                    totalCompleteDays >= 50
                  )
                    shouldUnlock = true;
                  if (
                    achievement.key === "total_100_days" &&
                    totalCompleteDays >= 100
                  )
                    shouldUnlock = true;
                  break;

                case "GOAL":
                  if (
                    achievement.key === "first_water_goal" &&
                    waterGoalComplete
                  )
                    shouldUnlock = true;
                  if (achievement.key === "water_warrior" && waterGoalComplete)
                    shouldUnlock = true;
                  break;

                case "STREAK":
                  if (achievement.key === "streak_3_days" && currentStreak >= 3)
                    shouldUnlock = true;
                  if (achievement.key === "streak_7_days" && currentStreak >= 7)
                    shouldUnlock = true;
                  if (
                    achievement.key === "streak_14_days" &&
                    currentStreak >= 14
                  )
                    shouldUnlock = true;
                  if (
                    achievement.key === "streak_30_days" &&
                    currentStreak >= 30
                  )
                    shouldUnlock = true;
                  if (
                    achievement.key === "streak_100_days" &&
                    currentStreak >= 100
                  )
                    shouldUnlock = true;
                  break;

                case "LEVEL":
                  if (achievement.key === "level_5" && (user.level || 1) >= 5)
                    shouldUnlock = true;
                  if (achievement.key === "level_10" && (user.level || 1) >= 10)
                    shouldUnlock = true;
                  if (achievement.key === "level_25" && (user.level || 1) >= 25)
                    shouldUnlock = true;
                  if (achievement.key === "level_50" && (user.level || 1) >= 50)
                    shouldUnlock = true;
                  break;
              }

              if (shouldUnlock) {
                // Create user achievement
                await prisma.userAchievement.create({
                  data: {
                    user_id: userId,
                    achievement_id: achievement.id,
                    progress: achievement.max_progress,
                    unlocked: true,
                    unlocked_date: new Date(),
                  },
                });

                totalXpGained += achievement.points_awarded;
                newAchievements.push({
                  key: achievement.key,
                  title: achievement.title,
                  description: achievement.description,
                  points: achievement.points_awarded,
                  icon: achievement.icon,
                });

                console.log(
                  `🎉 Achievement unlocked: ${achievement.title} (+${achievement.points_awarded} XP)`
                );
              }
            }

            // Update user XP and level if XP gained
            if (totalXpGained > 0) {
              const newXP = (user.current_xp || 0) + totalXpGained;
              const newTotalPoints = (user.total_points || 0) + totalXpGained;

              // Calculate level (100 XP per level)
              const calculatedLevel = Math.floor(newTotalPoints / 100) + 1;

              if (calculatedLevel > (user.level || 1)) {
                leveledUp = true;
                newLevel = calculatedLevel;
              }

              await prisma.user.update({
                where: { user_id: userId },
                data: {
                  current_xp: newXP % 100,
                  total_points: newTotalPoints,
                  level: newLevel,
                },
              });
            }

            console.log(
              `✅ Achievement update complete: +${totalXpGained} XP, ${newAchievements.length} new achievements`
            );

            return {
              xpGained: totalXpGained,
              leveledUp,
              newLevel: leveledUp ? newLevel : undefined,
              newAchievements,
              streakUpdate,
            };
          } catch (error) {
            console.error("💥 Error updating achievements:", error);
            return {
              xpGained: 0,
              leveledUp: false,
              newAchievements: [],
              streakUpdate: null,
            };
          }
        }

        static async getUserAchievements(userId: string): Promise<{
          unlockedAchievements: any[];
          lockedAchievements: any[];
          userStats: any;
        }> {
          try {
            const user = await prisma.user.findUnique({
              where: { user_id: userId },
              select: {
                level: true,
                current_xp: true,
                total_points: true,
                current_streak: true,
                best_streak: true,
                total_complete_days: true,
                ai_requests_count: true,
              },
            });

            // Get current user progress for achievements
            const waterIntakeCount = await prisma.waterIntake.count({
              where: {
                user_id: userId,
                cups_consumed: { gte: 8 },
              },
            });

            const userAchievements = await prisma.userAchievement.findMany({
              where: { user_id: userId },
              include: { achievement: true },
            });

            const unlockedIds = userAchievements
              .filter((ua) => ua.unlocked)
              .map((ua) => ua.achievement_id);

            // Fetch all active achievements from the database
            const allAchievements = await this.getAllAchievements();

            // Helper function to calculate current progress for locked achievements
            const calculateProgress = (achievement: any) => {
              const currentStreak = user?.current_streak || 0;
              const totalCompleteDays = user?.total_complete_days || 0;
              const userLevel = user?.level || 1;
              const aiRequestsCount = user?.ai_requests_count || 0;

              switch (achievement.key) {
                case "first_scan":
                  return Math.min(aiRequestsCount, 1);
                case "first_water_goal":
                  return Math.min(waterIntakeCount, 1);
                case "water_warrior":
                  return Math.min(waterIntakeCount, 10);
                case "hydration_habit":
                  return Math.min(waterIntakeCount, 7);
                case "aqua_master":
                  return Math.min(waterIntakeCount, 30);
                case "first_complete_day":
                  return Math.min(totalCompleteDays, 1);
                case "total_5_days":
                  return Math.min(totalCompleteDays, 5);
                case "total_10_days":
                  return Math.min(totalCompleteDays, 10);
                case "total_25_days":
                  return Math.min(totalCompleteDays, 25);
                case "total_50_days":
                  return Math.min(totalCompleteDays, 50);
                case "total_100_days":
                  return Math.min(totalCompleteDays, 100);
                case "streak_3_days":
                  return Math.min(currentStreak, 3);
                case "streak_7_days":
                  return Math.min(currentStreak, 7);
                case "streak_14_days":
                  return Math.min(currentStreak, 14);
                case "streak_30_days":
                  return Math.min(currentStreak, 30);
                case "streak_100_days":
                  return Math.min(currentStreak, 100);
                case "level_5":
                  return Math.min(userLevel, 5);
                case "level_10":
                  return Math.min(userLevel, 10);
                case "level_25":
                  return Math.min(userLevel, 25);
                case "level_50":
                  return Math.min(userLevel, 50);
                default:
                  return 0;
              }
            };

            const unlockedAchievements = allAchievements
              .filter((achievement) => unlockedIds.includes(achievement.id))
              .map((achievement) => {
                const userAchievement = userAchievements.find(
                  (ua) => ua.achievement_id === achievement.id
                );
                return {
                  id: achievement.id,
                  title: achievement.title,
                  description: achievement.description,
                  category: achievement.category,
                  xpReward: achievement.points_awarded,
                  icon: achievement.icon,
                  rarity: achievement.rarity || "COMMON",
                  unlockedDate: userAchievement?.unlocked_date,
                  progress: achievement.max_progress,
                  maxProgress: achievement.max_progress,
                  unlocked: true,
                };
              });

            const lockedAchievements = allAchievements
              .filter((achievement) => !unlockedIds.includes(achievement.id))
              .map((achievement) => {
                const currentProgress = calculateProgress(achievement);
                return {
                  id: achievement.id,
                  title: achievement.title,
                  description: achievement.description,
                  category: achievement.category,
                  xpReward: achievement.points_awarded,
                  icon: achievement.icon,
                  rarity: achievement.rarity || "COMMON",
                  progress: currentProgress,
                  maxProgress: achievement.max_progress,
                  unlocked: false,
                };
              });

            return {
              unlockedAchievements,
              lockedAchievements,
              userStats: {
                level: user?.level || 1,
                currentXP: user?.current_xp || 0,
                totalPoints: user?.total_points || 0,
                currentStreak: user?.current_streak || 0,
                bestStreak: user?.best_streak || 0,
                totalCompleteDays: user?.total_complete_days || 0,
                xpToNextLevel: 100 - (user?.current_xp || 0),
                xpProgress: ((user?.current_xp || 0) / 100) * 100,
              },
            };
          } catch (error) {
            console.error("Error getting user achievements:", error);
            return {
              unlockedAchievements: [],
              lockedAchievements: [],
              userStats: {
                level: 1,
                currentXP: 0,
                totalPoints: 0,
                currentStreak: 0,
                bestStreak: 0,
                totalCompleteDays: 0,
                xpToNextLevel: 100,
                xpProgress: 0,
              },
            };
          }
        }

        // Helper function to check if yesterday was a completed day
        private static async wasYesterDayComplete(
          userId: string,
          date: Date
        ): Promise<boolean> {
          const yesterday = new Date(date);
          yesterday.setHours(0, 0, 0, 0);

          const completedMeals = await prisma.meal.count({
            where: {
              user_id: userId,
              upload_time: {
                gte: yesterday,
                lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
              },
              calories: { gte: 1800 },
            },
          });

          const completedWaterIntake = await prisma.waterIntake.count({
            where: {
              user_id: userId,
              date: {
                gte: yesterday,
                lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
              },
              cups_consumed: { gte: 8 },
            },
          });

          return completedMeals > 0 && completedWaterIntake > 0;
        }
      }

      return {
        xpGained: totalXpGained,
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
        newAchievements,
        streakUpdate,
      };
    } catch (error) {
      console.error("💥 Error updating achievements:", error);
      return {
        xpGained: 0,
        leveledUp: false,
        newAchievements: [],
        streakUpdate: null,
      };
    }
  }

  static async getUserAchievements(userId: string): Promise<{
    unlockedAchievements: any[];
    lockedAchievements: any[];
    userStats: any;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          level: true,
          current_xp: true,
          total_points: true,
          current_streak: true,
          best_streak: true,
          total_complete_days: true,
        },
      });

      const userAchievements = await prisma.userAchievement.findMany({
        where: { user_id: userId },
        include: { achievement: true },
      });

      const unlockedIds = userAchievements
        .filter((ua) => ua.unlocked)
        .map((ua) => ua.achievement_id);

      // Fetch all active achievements from the database
      const allAchievements = await this.getAllAchievements();

      const unlockedAchievements = allAchievements
        .filter((achievement) => unlockedIds.includes(achievement.id))
        .map((achievement) => {
          const userAchievement = userAchievements.find(
            (ua) => ua.achievement_id === achievement.id
          );
          return {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            category: achievement.category,
            xpReward: achievement.points_awarded,
            icon: achievement.icon,
            rarity: "COMMON",
            unlockedDate: userAchievement?.unlocked_date,
            progress: userAchievement?.progress || 0,
          };
        });

      const lockedAchievements = allAchievements
        .filter((achievement) => !unlockedIds.includes(achievement.id))
        .map((achievement) => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          category: achievement.category,
          xpReward: achievement.points_awarded,
          icon: achievement.icon,
          rarity: "COMMON",
          progress: 0,
          unlocked: false,
        }));

      return {
        unlockedAchievements,
        lockedAchievements,
        userStats: {
          level: user?.level || 1,
          currentXP: user?.current_xp || 0,
          totalPoints: user?.total_points || 0,
          currentStreak: user?.current_streak || 0,
          bestStreak: user?.best_streak || 0,
          totalCompleteDays: user?.total_complete_days || 0,
          xpToNextLevel: 100 - (user?.current_xp || 0),
          xpProgress: ((user?.current_xp || 0) / 100) * 100,
        },
      };
    } catch (error) {
      console.error("Error getting user achievements:", error);
      return {
        unlockedAchievements: [],
        lockedAchievements: [],
        userStats: {
          level: 1,
          currentXP: 0,
          totalPoints: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalCompleteDays: 0,
          xpToNextLevel: 100,
          xpProgress: 0,
        },
      };
    }
  }

  // Helper function to check if yesterday was a completed day
  private static async wasYesterDayComplete(
    userId: string,
    date: Date
  ): Promise<boolean> {
    const yesterday = new Date(date);
    yesterday.setHours(0, 0, 0, 0);

    const completedMeals = await prisma.meal.count({
      where: {
        user_id: userId,
        upload_time: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
        },
        calories: { gte: 1800 },
      },
    });

    const completedWaterIntake = await prisma.waterIntake.count({
      where: {
        user_id: userId,
        date: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
        },
        cups_consumed: { gte: 8 },
      },
    });

    return completedMeals > 0 && completedWaterIntake > 0;
  }
}

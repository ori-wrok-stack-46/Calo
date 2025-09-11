import cron from "node-cron";
import { prisma } from "../lib/database";
import { AIRecommendationService } from "./aiRecommendations";

export class CronJobService {
  static initializeCronJobs() {
    // Reset water badges daily at midnight
    cron.schedule("0 0 * * *", async () => {
      console.log("🕛 Running daily reset job at midnight");
      await this.resetDailyBadges();
    });

    // Generate daily AI recommendations at 6:00 AM
    cron.schedule("0 6 * * *", async () => {
      console.log("🤖 Running daily AI recommendations job at 6:00 AM");
      await this.generateDailyRecommendationsForAllUsers();
    });

    // Create daily goals for new users at 1:00 AM
    cron.schedule("0 1 * * *", async () => {
      console.log("📊 Creating daily goals for all users");
      await this.createDailyGoalsForAllUsers();
    });

    console.log("📅 Cron jobs initialized");
  }

  private static async resetDailyBadges() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log("🧹 Cleaning up daily badges from:", yesterday.toISOString());

      // This doesn't delete badges, just ensures they're date-specific
      // The scuba diver badge logic already handles daily awards correctly

      console.log("✅ Daily badge reset completed");
    } catch (error) {
      console.error("❌ Error resetting daily badges:", error);
    }
  }

  static async createDailyGoalsForAllUsers(): Promise<void> {
    console.log("🧹 Initializing user cleanup jobs...");

    try {
      // Test database connection first
      await prisma.$connect();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all users who don't have today's daily goal
      const usersWithoutTodayGoal = await prisma.user.findMany({
        where: {
          dailyGoals: {
            none: {
              date: today,
            },
          },
        },
        include: {
          questionnaires: {
            orderBy: { date_completed: "desc" },
            take: 1,
          },
        },
      });

      console.log(
        `📊 Creating daily goals for ${usersWithoutTodayGoal.length} users`
      );

      for (const user of usersWithoutTodayGoal) {
        const questionnaire = user.questionnaires[0];
        const defaultCalories = this.calculateDailyCalories(
          questionnaire,
          user
        );

        await prisma.dailyGoal.create({
          data: {
            user_id: user.user_id,
            date: today,
            calories: defaultCalories,
            protein_g: (defaultCalories * 0.25) / 4,
            carbs_g: (defaultCalories * 0.45) / 4,
            fats_g: (defaultCalories * 0.3) / 9,
            fiber_g: 25,
            sodium_mg: 2300,
            sugar_g: 50,
            water_ml: 2500,
          },
        });
      }

      console.log("✅ Daily goals created for all users");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Can't reach database server")
      ) {
        console.error(
          "❌ Database connection error during cron job. Skipping daily goals creation."
        );
        return;
      }
      console.error("❌ Error creating daily goals:", error);
    }
  }

  private static async generateDailyRecommendationsForAllUsers(): Promise<void> {
    try {
      console.log("🤖 Starting daily AI recommendations generation...");

      // Get all active users who have logged meals in the last 7 days
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);

      const activeUsers = await prisma.user.findMany({
        where: {
          meals: {
            some: {
              created_at: {
                gte: recentDate,
              },
            },
          },
        },
        select: {
          user_id: true,
        },
      });

      console.log(
        `🎯 Generating recommendations for ${activeUsers.length} active users`
      );

      let successCount = 0;
      let errorCount = 0;

      // Process users in batches to avoid overwhelming the AI service
      const batchSize = 5;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const batch = activeUsers.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (user) => {
            try {
              await AIRecommendationService.generateDailyRecommendations(
                user.user_id
              );
              successCount++;
              console.log(
                `✅ Generated recommendations for user: ${user.user_id}`
              );
            } catch (error) {
              errorCount++;
              console.error(
                `❌ Failed to generate recommendations for user ${user.user_id}:`,
                error
              );
            }
          })
        );

        // Add delay between batches to be respectful to AI service
        if (i + batchSize < activeUsers.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
        }
      }

      console.log(
        `✅ Daily recommendations completed: ${successCount} success, ${errorCount} errors`
      );
    } catch (error) {
      console.error("💥 Error in daily recommendations generation:", error);
    }
  }

  private static calculateDailyCalories(questionnaire: any, user: any): number {
    if (!questionnaire) return 2000;

    const weight = questionnaire.weight_kg || 70;
    const height = questionnaire.height_cm || 170;
    const age = questionnaire.age || 30;
    const gender = questionnaire.gender || "male";

    let bmr;
    if (gender.toLowerCase() === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers = {
      NONE: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      HIGH: 1.725,
    };

    const activityLevel = questionnaire.physical_activity_level || "LIGHT";
    const multiplier = activityMultipliers[activityLevel] || 1.375;

    let tdee = bmr * multiplier;

    const mainGoal = questionnaire.main_goal;
    if (mainGoal === "WEIGHT_LOSS") {
      tdee -= 500;
    } else if (mainGoal === "WEIGHT_GAIN") {
      tdee += 500;
    }

    return Math.round(Math.max(1200, Math.min(4000, tdee)));
  }
}

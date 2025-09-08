import express, { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Mark meal as completed
router.post(
  "/complete",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const {
        plan_id,
        menu_id,
        meal_name,
        meal_type,
        day_number,
        calories,
        protein_g,
        carbs_g,
        fats_g,
        rating,
        notes,
        prep_time_actual,
      } = req.body;

      if (!meal_name || !meal_type) {
        return res.status(400).json({
          success: false,
          error: "Meal name and type are required",
        });
      }

      // Create meal completion record
      const completion = await prisma.mealCompletion.create({
        data: {
          user_id: userId,
          plan_id,
          menu_id,
          meal_name,
          meal_type,
          day_number: day_number || 1,
          completed_date: new Date(),
          calories,
          protein_g,
          carbs_g,
          fats_g,
          rating,
          notes,
          prep_time_actual,
        },
      });

      // Update plan progress if plan_id is provided
      if (plan_id) {
        const plan = await prisma.userMealPlan.findUnique({
          where: { plan_id },
        });

        if (plan) {
          const completedMeals = plan.meals_completed + 1;
          const progressPercentage =
            plan.total_meals > 0
              ? (completedMeals / plan.total_meals) * 100
              : 0;

          await prisma.userMealPlan.update({
            where: { plan_id },
            data: {
              meals_completed: completedMeals,
              progress_percentage: Math.min(progressPercentage, 100),
              status: progressPercentage >= 100 ? "completed" : "active",
              completed_at: progressPercentage >= 100 ? new Date() : null,
            },
          });
        }
      }

      // Award XP for meal completion
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (user) {
        const xpGained = 10; // Base XP for completing a meal
        const bonusXp = rating && rating >= 4 ? 5 : 0; // Bonus for high rating

        await prisma.user.update({
          where: { user_id: userId },
          data: {
            current_xp: (user.current_xp || 0) + xpGained + bonusXp,
            total_points: (user.total_points || 0) + xpGained + bonusXp,
          },
        });
      }

      res.json({
        success: true,
        data: completion,
        xp_gained: 10 + (rating && rating >= 4 ? 5 : 0),
        message: "Meal marked as completed successfully!",
      });
    } catch (error) {
      console.error("Error completing meal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete meal",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get meal completion history
router.get(
  "/history",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { limit = 50, offset = 0, plan_id, menu_id } = req.query;

      const where: any = { user_id: userId };
      if (plan_id) where.plan_id = plan_id;
      if (menu_id) where.menu_id = menu_id;

      const completions = await prisma.mealCompletion.findMany({
        where,
        orderBy: { completed_date: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });

      const totalCount = await prisma.mealCompletion.count({ where });

      res.json({
        success: true,
        data: completions,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore:
            totalCount > parseInt(offset as string) + parseInt(limit as string),
        },
      });
    } catch (error) {
      console.error("Error fetching meal completion history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch completion history",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get completion stats
router.get(
  "/stats",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { plan_id, menu_id, period = "week" } = req.query;

      let dateFilter = new Date();
      if (period === "week") {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (period === "month") {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      } else if (period === "year") {
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
      }

      const where: any = {
        user_id: userId,
        completed_date: { gte: dateFilter },
      };
      if (plan_id) where.plan_id = plan_id;
      if (menu_id) where.menu_id = menu_id;

      const [
        totalCompleted,
        avgRating,
        totalCalories,
        totalProtein,
        mealTypeBreakdown,
      ] = await Promise.all([
        prisma.mealCompletion.count({ where }),
        prisma.mealCompletion.aggregate({
          where: { ...where, rating: { not: null } },
          _avg: { rating: true },
        }),
        prisma.mealCompletion.aggregate({
          where: { ...where, calories: { not: null } },
          _sum: { calories: true },
        }),
        prisma.mealCompletion.aggregate({
          where: { ...where, protein_g: { not: null } },
          _sum: { protein_g: true },
        }),
        prisma.mealCompletion.groupBy({
          by: ["meal_type"],
          where,
          _count: true,
        }),
      ]);

      res.json({
        success: true,
        data: {
          period,
          total_completed: totalCompleted,
          average_rating: avgRating._avg.rating || 0,
          total_calories: totalCalories._sum.calories || 0,
          total_protein: totalProtein._sum.protein_g || 0,
          meal_type_breakdown: mealTypeBreakdown.map((item) => ({
            meal_type: item.meal_type,
            count: item._count,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching completion stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch completion stats",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;

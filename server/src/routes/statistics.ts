import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth"; // Import your AuthRequest type here
import { StatisticsService } from "../services/statistics";
import { z } from "zod";
import { AchievementService } from "../services/achievements";

const router = Router();

const periodSchema = z.enum(["today", "week", "month", "custom"]);

// Get nutrition statistics
router.get(
  "/statistics",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      console.error("❌ Statistics request without user ID");
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      console.log(
        `📊 Statistics request for user: ${userId}, period: ${
          req.query.period || "week"
        }`
      );

      const period = periodSchema.parse(req.query.period || "week");

      // Handle custom period case or filter out unsupported periods
      let statisticsPeriod: "today" | "week" | "month" | undefined;

      if (period === "custom") {
        // Handle custom period - you might need start_date and end_date from query params
        // For now, default to week or implement custom date range logic
        statisticsPeriod = "week";

        // Optional: Add custom date range handling
        // const startDate = req.query.start_date as string;
        // const endDate = req.query.end_date as string;
        // if (startDate && endDate) {
        //   const statistics = await StatisticsService.getNutritionStatisticsCustom(
        //     userId,
        //     new Date(startDate),
        //     new Date(endDate)
        //   );
        //   return res.json(statistics);
        // }
      } else {
        statisticsPeriod = period;
      }

      const statistics = await StatisticsService.getNutritionStatistics(
        userId,
        statisticsPeriod
      );

      console.log(`✅ Statistics fetched successfully for user: ${userId}`);
      res.json(statistics);
    } catch (error) {
      console.error("❌ Error fetching statistics:", error);

      // Return a more detailed error response
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid period parameter",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: "Failed to fetch statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get detailed achievements data
router.get(
  "/statistics/achievements",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      console.log(`🏆 Statistics achievements request for user: ${userId}`);

      const achievementData = await AchievementService.getUserAchievements(
        userId
      );

      console.log(
        `✅ Statistics achievements fetched successfully for user: ${userId}, unlocked: ${achievementData.unlockedAchievements.length}, locked: ${achievementData.lockedAchievements.length}`
      );

      // Flatten the data structure to match client expectations
      const allAchievements = [
        ...achievementData.unlockedAchievements,
        ...achievementData.lockedAchievements,
      ];

      res.json({
        success: true,
        data: allAchievements,
      });
    } catch (error) {
      console.error("❌ Error fetching statistics achievements:", error);
      res.status(500).json({
        error: "Failed to fetch achievements",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Check and award new achievements
router.post(
  "/achievements/check",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      console.log(`🔄 Checking achievements for user: ${userId}`);

      const result = await AchievementService.checkAndAwardAchievements(userId);

      console.log(`✅ Achievement check completed for user: ${userId}`);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ Error checking achievements:", error);
      res.status(500).json({
        error: "Failed to check achievements",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Export report as PDF
router.get(
  "/export-report",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const pdfBuffer = await StatisticsService.generatePDFReport(userId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=nutrition-report.pdf"
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  }
);

// Get insights and recommendations
router.get(
  "/insights",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const insights = await StatisticsService.generateInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  }
);

export default router;

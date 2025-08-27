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
        statisticsPeriod = "week";
      } else {
        statisticsPeriod = period;
      }

      // Set a timeout for the statistics request (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Statistics request timeout")),
          30000
        );
      });

      const statisticsPromise = StatisticsService.getNutritionStatistics(
        userId,
        statisticsPeriod
      );

      const statistics = await Promise.race([
        statisticsPromise,
        timeoutPromise,
      ]);

      console.log(`✅ Statistics fetched successfully for user: ${userId}`);

      // Add cache headers for better performance
      res.set({
        "Cache-Control": "public, max-age=300", // 5 minutes cache
        ETag: `"statistics-${userId}-${statisticsPeriod}-${Date.now()}"`,
      });

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

      if (error === "Statistics request timeout") {
        return res.status(408).json({
          error: "Request timeout",
          message: "Statistics calculation took too long. Please try again.",
        });
      }

      // Handle database connection/table issues
      if (error === "P2010") {
        return res.status(503).json({
          error: "Database schema issue",
          message:
            "The database schema is not properly synchronized. Please contact support.",
          code: error,
        });
      }

      res.status(500).json({
        error: "Failed to fetch statistics",
        message: error instanceof Error ? error.message : "Unknown error",
        code: error || "UNKNOWN_ERROR",
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

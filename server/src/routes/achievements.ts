
import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { AchievementService } from "../services/achievements";

const router = Router();

// Get user achievements
router.get(
  "/achievements",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const achievements = await AchievementService.getUserAchievements(userId);
      res.json({
        success: true,
        data: achievements
      });
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({
        error: "Failed to fetch achievements",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Manually check achievements (for testing or manual triggers)
router.post(
  "/achievements/check",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const result = await AchievementService.checkAndAwardAchievements(userId);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({
        error: "Failed to check achievements",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;

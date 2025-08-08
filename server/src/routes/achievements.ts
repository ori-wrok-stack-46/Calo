import express from "express";
import { AchievementService } from "../services/achievements";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
router.use(authenticateToken);
// Get user achievements
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    console.log("📊 Fetching achievements for user:", userId);
    const achievementData = await AchievementService.getUserAchievements(
      userId
    );

    res.json({
      success: true,
      data: achievementData,
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch achievements",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Check and award new achievements
router.post("/check", async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    console.log("🏆 Checking achievements for user:", userId);
    const result = await AchievementService.checkAndAwardAchievements(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check achievements",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update user progress (called when user completes actions)
router.post("/progress", async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const {
      completeDay = false,
      waterGoalComplete = false,
      calorieGoalComplete = false,
      xpAwarded = 0,
    } = req.body;

    console.log("📈 Updating progress for user:", userId, {
      completeDay,
      waterGoalComplete,
      calorieGoalComplete,
      xpAwarded,
    });

    const result = await AchievementService.updateUserProgress(
      userId,
      completeDay,
      waterGoalComplete,
      calorieGoalComplete,
      xpAwarded
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error updating user progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user progress",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

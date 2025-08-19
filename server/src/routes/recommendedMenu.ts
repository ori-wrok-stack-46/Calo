import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { RecommendedMenuService } from "../services/recommendedMenu";
import { prisma } from "../lib/database";
import { Response } from "express";
import { $Enums } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

const router = Router();

// Get user's recommended menus
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    console.log("📋 Getting recommended menus for user:", userId);

    const menus = await prisma.recommendedMenu.findMany({
      where: { user_id: userId },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
          orderBy: [{ day_number: "asc" }, { meal_type: "asc" }],
        },
      },
      orderBy: { created_at: "desc" },
    });

    console.log(`✅ Found ${menus.length} recommended menus`);

    res.json({
      success: true,
      data: menus,
    });
  } catch (error) {
    console.error("💥 Error getting recommended menus:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get recommended menus",
    });
  }
});

// Get specific menu details
router.get(
  "/:menuId",
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

      const { menuId } = req.params;
      console.log("📋 Getting menu details for:", menuId);

      const menu = await prisma.recommendedMenu.findFirst({
        where: {
          menu_id: menuId,
          user_id: userId, // Ensure user can only access their own menus
        },
        include: {
          meals: {
            include: {
              ingredients: true,
            },
            orderBy: [{ day_number: "asc" }, { meal_type: "asc" }],
          },
        },
      });

      if (!menu) {
        return res.status(404).json({
          success: false,
          error: "Menu not found",
        });
      }

      console.log(`✅ Found menu with ${menu.meals.length} meals`);

      res.json({
        success: true,
        data: menu,
      });
    } catch (error) {
      console.error("💥 Error getting menu details:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get menu details",
      });
    }
  }
);

// GET /api/recommended-menus/debug - Debug endpoint to check menu data
router.get("/debug", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    console.log("🐛 Debug: Checking menus for user:", userId);

    // Get raw menu count
    const menuCount = await prisma.recommendedMenu.count({
      where: { user_id: userId },
    });

    // Get detailed menu data
    const menus = await prisma.recommendedMenu.findMany({
      where: { user_id: userId },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const debugInfo = {
      user_id: userId,
      menu_count: menuCount,
      menus: menus.map(
        (menu: {
          menu_id: any;
          title: any;
          created_at: any;
          meals: any[];
        }) => ({
          menu_id: menu.menu_id,
          title: menu.title,
          created_at: menu.created_at,
          meals_count: menu.meals.length,
          total_ingredients: menu.meals.reduce(
            (total, meal) => total + meal.ingredients.length,
            0
          ),
          sample_meals: menu.meals.slice(0, 2).map((meal) => ({
            meal_id: meal.meal_id,
            name: meal.name,
            meal_type: meal.meal_type,
            ingredients_count: meal.ingredients.length,
          })),
        })
      ),
    };

    res.json({
      success: true,
      debug_info: debugInfo,
    });
  } catch (error) {
    console.error("💥 Debug error:", error);
    res.status(500).json({
      success: false,
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/recommended-menus/generate-custom - Generate custom menu based on user description
router.post(
  "/generate-custom",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      console.log("🎨 Generating custom menu for user:", userId);
      console.log("📋 Custom request:", req.body);

      const {
        days = 7,
        mealsPerDay = "3_main",
        customRequest,
        budget,
        mealChangeFrequency = "daily",
        includeLeftovers = false,
        sameMealTimes = true,
      } = req.body;

      // Validate input
      if (!customRequest || customRequest.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Custom request description is required",
        });
      }

      if (days < 1 || days > 30) {
        return res.status(400).json({
          success: false,
          error: "Days must be between 1 and 30",
        });
      }

      console.log("✅ Input validation passed, generating custom menu...");

      const menu = await RecommendedMenuService.generateCustomMenu({
        userId,
        days,
        mealsPerDay,
        customRequest: customRequest.trim(),
        budget,
        mealChangeFrequency,
        includeLeftovers,
        sameMealTimes,
      });

      if (!menu) {
        throw new Error("Custom menu generation returned null");
      }

      console.log("🎉 Custom menu generated successfully!");
      console.log("📊 Menu stats:", {
        menu_id: menu?.menu_id,
        title: menu?.title,
        meals_count: menu?.meals?.length || 0,
        total_calories: menu?.total_calories,
      });

      const responseData = {
        ...menu,
        menu_id: menu.menu_id,
        title: menu.title,
        description: menu.description,
        meals: menu.meals || [],
        days_count: menu.days_count,
        total_calories: menu.total_calories,
        estimated_cost: menu.estimated_cost,
      };

      console.log(
        "📤 Sending custom menu response with",
        responseData.meals.length,
        "meals"
      );

      res.json({
        success: true,
        message: "Custom menu generated successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("💥 Error generating custom menu:", error);

      let errorMessage = "Failed to generate custom menu";
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes("questionnaire not found")) {
          errorMessage =
            "Please complete your questionnaire first before generating a custom menu";
          statusCode = 400;
        } else {
          errorMessage = error.message;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/generate - Generate new menu with preferences
router.post("/generate", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    console.log("🎯 Generating menu for user:", userId);
    console.log("📋 Request body:", req.body);

    const {
      days = 7,
      mealsPerDay = "3_main", // "3_main", "3_plus_2_snacks", "2_plus_1_intermediate"
      mealChangeFrequency = "daily", // "daily", "every_3_days", "weekly", "automatic"
      includeLeftovers = false,
      sameMealTimes = true,
      targetCalories,
      dietaryPreferences,
      excludedIngredients,
      budget,
    } = req.body;

    // Validate input parameters
    if (days < 1 || days > 30) {
      return res.status(400).json({
        success: false,
        error: "Days must be between 1 and 30",
      });
    }

    if (
      !["3_main", "3_plus_2_snacks", "2_plus_1_intermediate"].includes(
        mealsPerDay
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid meals per day option",
      });
    }

    console.log("✅ Input validation passed, generating menu...");

    const menu = await RecommendedMenuService.generatePersonalizedMenu({
      userId,
      days,
      mealsPerDay,
      mealChangeFrequency,
      includeLeftovers,
      sameMealTimes,
      targetCalories,
      dietaryPreferences,
      excludedIngredients,
      budget,
    });

    if (!menu) {
      throw new Error("Menu generation returned null");
    }

    console.log("🎉 Menu generated successfully!");
    console.log("📊 Menu stats:", {
      menu_id: menu?.menu_id,
      title: menu?.title,
      meals_count: menu?.meals?.length || 0,
      total_calories: menu?.total_calories,
    });

    // Ensure the response has the expected structure
    const responseData = {
      ...menu,
      // Ensure we have at least these fields for the client
      menu_id: menu.menu_id,
      title: menu.title,
      description: menu.description,
      meals: menu.meals || [],
      days_count: menu.days_count,
      total_calories: menu.total_calories,
      estimated_cost: menu.estimated_cost,
    };

    console.log("📤 Sending response with", responseData.meals.length, "meals");

    res.json({
      success: true,
      message: "Menu generated successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("💥 Error generating menu:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to generate menu";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("questionnaire not found")) {
        errorMessage =
          "Please complete your questionnaire first before generating a menu";
        statusCode = 400;
      } else if (error.message.includes("budget")) {
        errorMessage = "Please set a daily food budget in your questionnaire";
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/recommended-menus/:menuId/replace-meal - Replace a specific meal
router.post(
  "/:menuId/replace-meal",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;
      const { mealId, preferences } = req.body;

      const updatedMeal = await RecommendedMenuService.replaceMeal(
        userId,
        menuId,
        mealId,
        preferences
      );

      res.json({
        success: true,
        data: updatedMeal,
      });
    } catch (error) {
      console.error("💥 Error replacing meal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to replace meal",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/:menuId/favorite-meal - Mark meal as favorite
router.post(
  "/:menuId/favorite-meal",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;
      const { mealId, isFavorite } = req.body;

      await RecommendedMenuService.markMealAsFavorite(
        userId,
        menuId,
        mealId,
        isFavorite
      );

      res.json({
        success: true,
        message: isFavorite
          ? "Meal marked as favorite"
          : "Meal removed from favorites",
      });
    } catch (error) {
      console.error("💥 Error updating meal favorite:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update meal favorite",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/:menuId/meal-feedback - Give feedback on meal
router.post(
  "/:menuId/meal-feedback",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;
      const { mealId, liked } = req.body;

      await RecommendedMenuService.giveMealFeedback(
        userId,
        menuId,
        mealId,
        liked
      );

      res.json({
        success: true,
        message: "Feedback recorded successfully",
      });
    } catch (error) {
      console.error("💥 Error recording meal feedback:", error);
      res.status(500).json({
        success: false,
        error: "Failed to record feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/recommended-menus/:menuId/shopping-list - Get shopping list for menu
router.get(
  "/:menuId/shopping-list",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;

      const shoppingList = await RecommendedMenuService.generateShoppingList(
        userId,
        menuId
      );

      res.json({
        success: true,
        data: shoppingList,
      });
    } catch (error) {
      console.error("💥 Error generating shopping list:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate shopping list",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/:menuId/start-today - Start a recommended menu as today's plan
router.post(
  "/:menuId/start-today",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;
      const feedback = req.body;

      console.log(
        "🚀 Starting recommended menu today:",
        menuId,
        "for user:",
        userId
      );

      // Get the recommended menu
      const menu = await prisma.recommendedMenu.findFirst({
        where: {
          menu_id: menuId,
          user_id: userId,
        },
        include: {
          meals: {
            include: {
              ingredients: true,
            },
          },
        },
      });

      if (!menu) {
        return res.status(404).json({
          success: false,
          error: "Menu not found",
        });
      }

      // Update user's active menu
      await prisma.user.update({
        where: { user_id: userId },
        data: {
          active_menu_id: menuId,
          active_meal_plan_id: null, // Clear any active meal plan
        },
      });

      console.log("✅ Menu started successfully");
      res.json({
        success: true,
        data: {
          plan_id: menuId,
          name: menu.title,
          start_date: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("💥 Error starting menu:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start menu",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/generate-comprehensive - Generate comprehensive menu with detailed parameters
router.post(
  "/generate-comprehensive",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      console.log("🎯 Generating comprehensive menu for user:", userId);
      console.log("📋 Request body:", req.body);

      const {
        name,
        days = 7,
        mealsPerDay = "3_main",
        targetCalories,
        proteinGoal,
        carbGoal,
        fatGoal,
        budget,
        specialRequests,
      } = req.body;

      // Validate input
      if (!name || name.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Menu name is required",
        });
      }

      if (days < 1 || days > 30) {
        return res.status(400).json({
          success: false,
          error: "Days must be between 1 and 30",
        });
      }

      console.log(
        "✅ Input validation passed, generating comprehensive menu..."
      );

      // Create comprehensive request
      const comprehensiveRequest = {
        userId,
        days,
        mealsPerDay,
        targetCalories,
        dietaryPreferences: [],
        excludedIngredients: [],
        budget,
        customRequest: `Create a comprehensive menu named "${name}". ${
          specialRequests || ""
        }. ${
          targetCalories ? `Target ${targetCalories} calories daily.` : ""
        } ${proteinGoal ? `${proteinGoal}g protein daily.` : ""} ${
          carbGoal ? `${carbGoal}g carbs daily.` : ""
        } ${fatGoal ? `${fatGoal}g fats daily.` : ""}`.trim(),
      };

      const menu = await RecommendedMenuService.generateCustomMenu(
        comprehensiveRequest
      );

      if (!menu) {
        throw new Error("Comprehensive menu generation returned null");
      }

      console.log("🎉 Comprehensive menu generated successfully!");
      console.log("📊 Menu stats:", {
        menu_id: menu?.menu_id,
        title: menu?.title,
        meals_count: menu?.meals?.length || 0,
        total_calories: menu?.total_calories,
      });

      const responseData = {
        ...menu,
        menu_id: menu.menu_id,
        title: menu.title,
        description: menu.description,
        meals: menu.meals || [],
        days_count: menu.days_count,
        total_calories: menu.total_calories,
        estimated_cost: menu.estimated_cost,
      };

      console.log(
        "📤 Sending comprehensive menu response with",
        responseData.meals.length,
        "meals"
      );

      res.json({
        success: true,
        message: "Comprehensive menu generated successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("💥 Error generating comprehensive menu:", error);

      let errorMessage = "Failed to generate comprehensive menu";
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes("questionnaire not found")) {
          errorMessage =
            "Please complete your questionnaire first before generating a comprehensive menu";
          statusCode = 400;
        } else {
          errorMessage = error.message;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/:menuId/start-today - Create meal plan from menu and activate it
router.post(
  "/:menuId/start-today",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;

      console.log("🚀 Starting menu:", menuId, "for user:", userId);

      // Get the recommended menu
      const menu = await prisma.recommendedMenu.findFirst({
        where: {
          menu_id: menuId,
          user_id: userId,
        },
        include: {
          meals: {
            include: {
              ingredients: true,
            },
            orderBy: [{ day_number: "asc" }, { meal_type: "asc" }],
          },
        },
      });

      if (!menu) {
        return res.status(404).json({
          success: false,
          error: "Menu not found",
        });
      }

      // Create a new meal plan from the recommended menu
      const planId = `plan_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const mealPlan = await prisma.userMealPlan.create({
        data: {
          plan_id: planId,
          user_id: userId,
          name: menu.title,
          plan_type: "WEEKLY",
          meals_per_day: 3,
          snacks_per_day: 0,
          rotation_frequency_days: menu.days_count,
          include_leftovers: false,
          fixed_meal_times: true,
          target_calories_daily: Math.round(
            menu.total_calories / menu.days_count
          ),
          target_protein_daily: Math.round(
            (menu.total_protein || 0) / menu.days_count
          ),
          target_carbs_daily: Math.round(
            (menu.total_carbs || 0) / menu.days_count
          ),
          target_fats_daily: Math.round(
            (menu.total_fat || 0) / menu.days_count
          ),
          start_date: new Date(),
          end_date: new Date(
            Date.now() + menu.days_count * 24 * 60 * 60 * 1000
          ),
          is_active: true,
        },
      });

      // Deactivate any other active meal plans
      await prisma.userMealPlan.updateMany({
        where: {
          user_id: userId,
          plan_id: { not: planId },
          is_active: true,
        },
        data: { is_active: false },
      });

      // Update user's active meal plan reference
      await prisma.user.update({
        where: { user_id: userId },
        data: {
          active_meal_plan_id: planId,
          active_menu_id: menuId,
        },
      });

      // Create meal templates and schedules from recommended menu meals
      console.log(
        "🔄 Converting recommended meals to meal templates and schedules..."
      );

      const createdTemplates: {
        name: string;
        created_at: Date;
        image_url: string | null;
        calories: number | null;
        protein_g: number | null;
        carbs_g: number | null;
        fats_g: number | null;
        fiber_g: number | null;
        sugar_g: number | null;
        sodium_mg: number | null;
        allergens_json: JsonValue | null;
        updated_at: Date;
        is_active: boolean;
        template_id: string;
        description: string | null;
        dietary_category: $Enums.DietaryCategory;
        prep_time_minutes: number | null;
        difficulty_level: number | null;
        meal_timing: $Enums.MealTiming;
        ingredients_json: JsonValue | null;
        instructions_json: JsonValue | null;
      }[] = [];
      const scheduleData = [];

      for (const meal of menu.meals) {
        try {
          // Create meal template for this meal
          const template = await prisma.mealTemplate.create({
            data: {
              name: meal.name,
              description:
                meal.instructions || `${meal.name} from recommended menu`,
              meal_timing: meal.meal_type,
              dietary_category: "BALANCED",
              prep_time_minutes: meal.prep_time_minutes || 30,
              difficulty_level: 2,
              calories: meal.calories,
              protein_g: meal.protein,
              carbs_g: meal.carbs,
              fats_g: meal.fat,
              fiber_g: meal.fiber || 0,
              sugar_g: 0,
              sodium_mg: 0,
              ingredients_json: meal.ingredients?.map((ing) => ing.name) || [],
              instructions_json:
                typeof meal.instructions === "string"
                  ? [meal.instructions]
                  : meal.instructions || [],
              allergens_json: [],
              image_url: null,
              is_active: true,
            },
          });

          createdTemplates.push(template);

          // Create schedule entry
          const dayOfWeek = (meal.day_number - 1) % 7; // Convert to 0-6 format
          scheduleData.push({
            plan_id: planId,
            template_id: template.template_id,
            day_of_week: dayOfWeek,
            meal_timing: meal.meal_type,
            meal_order: 1,
            portion_multiplier: 1.0,
            is_optional: false,
          });
        } catch (error) {
          console.error(
            "❌ Error creating template for meal:",
            meal.name,
            error
          );
        }
      }

      // Bulk create schedule entries
      if (scheduleData.length > 0) {
        await prisma.mealPlanSchedule.createMany({
          data: scheduleData,
        });
        console.log(`✅ Created ${scheduleData.length} meal schedule entries`);
      }

      // Convert meals to weekly plan structure for response
      const weeklyPlan: { [day: string]: { [timing: string]: any[] } } = {};
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      menu.meals.forEach((meal) => {
        const dayName = dayNames[(meal.day_number - 1) % 7];
        const timing = meal.meal_type;

        if (!weeklyPlan[dayName]) {
          weeklyPlan[dayName] = {};
        }
        if (!weeklyPlan[dayName][timing]) {
          weeklyPlan[dayName][timing] = [];
        }

        // Find the corresponding template
        const template = createdTemplates.find(
          (t) => t.name === meal.name && t.meal_timing === meal.meal_type
        );

        weeklyPlan[dayName][timing].push({
          template_id: template?.template_id || meal.meal_id,
          name: meal.name,
          description: meal.instructions || "",
          meal_timing: timing,
          dietary_category: "BALANCED",
          prep_time_minutes: meal.prep_time_minutes || 30,
          difficulty_level: 2,
          calories: meal.calories,
          protein_g: meal.protein,
          carbs_g: meal.carbs,
          fats_g: meal.fat,
          fiber_g: meal.fiber || 0,
          sugar_g: 0,
          sodium_mg: 0,
          ingredients: meal.ingredients?.map((ing) => ing.name) || [],
          instructions:
            typeof meal.instructions === "string"
              ? [meal.instructions]
              : meal.instructions || [],
          allergens: [],
          image_url: null,
          user_rating: 0,
          user_comments: "",
          is_favorite: false,
        });
      });

      console.log("✅ Menu converted to meal plan successfully");

      res.json({
        success: true,
        message: "Menu started successfully",
        data: {
          plan_id: planId,
          name: mealPlan.name,
          start_date: mealPlan.start_date,
          end_date: mealPlan.end_date,
          is_active: mealPlan.is_active,
          target_calories_daily: mealPlan.target_calories_daily,
          target_protein_daily: mealPlan.target_protein_daily,
          target_carbs_daily: mealPlan.target_carbs_daily,
          target_fats_daily: mealPlan.target_fats_daily,
          weekly_plan: weeklyPlan,
        },
      });
    } catch (error) {
      console.error("💥 Error starting menu:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start menu",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export { router as recommendedMenuRoutes };

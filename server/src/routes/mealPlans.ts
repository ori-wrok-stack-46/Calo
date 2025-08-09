import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { MealPlanService } from "../services/mealPlans";
import { prisma } from "../lib/database";
import { MealTiming } from "@prisma/client";

const router = Router();

// Get user's meal plans (for recommended menus tab)
router.get("/recommended", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;

    const userMealPlans = await prisma.userMealPlan.findMany({
      where: { user_id: userId },
      include: {
        schedules: {
          include: {
            template: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    // Transform to match expected format
    const formattedPlans = userMealPlans.map((plan) => ({
      menu_id: plan.plan_id,
      title: plan.name,
      description: `${plan.meals_per_day} meals per day plan`,
      total_calories: plan.target_calories_daily || 2000,
      total_protein: plan.target_protein_daily || 150,
      total_carbs: plan.target_carbs_daily || 200,
      total_fat: plan.target_fats_daily || 67,
      days_count: plan.rotation_frequency_days,
      dietary_category: "BALANCED",
      is_active: plan.is_active,
      created_at: plan.created_at,
      meals: plan.schedules.map((schedule) => ({
        meal_id: schedule.template.template_id,
        name: schedule.template.name,
        meal_type: schedule.meal_timing,
        day_number: schedule.day_of_week + 1,
        calories: schedule.template.calories || 0,
        protein: schedule.template.protein_g || 0,
        carbs: schedule.template.carbs_g || 0,
        fat: schedule.template.fats_g || 0,
        prep_time_minutes: schedule.template.prep_time_minutes,
        cooking_method: "Mixed",
        instructions: schedule.template.description,
        ingredients: [],
      })),
    }));

    res.json({
      success: true,
      data: formattedPlans,
      hasMenus: formattedPlans.length > 0,
    });
  } catch (error) {
    console.error("Get recommended menus error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recommended menus",
    });
  }
});

// Get specific recommended menu details
router.get(
  "/recommended/:menuId",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;

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

      res.json({
        success: true,
        data: menu,
      });
    } catch (error) {
      console.error("Get recommended menu details error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch menu details",
      });
    }
  }
);

// Generate new recommended menu
router.post(
  "/recommended/generate",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;

      // Get user's questionnaire and nutrition plan
      const [questionnaire, nutritionPlan] = await Promise.all([
        prisma.userQuestionnaire.findFirst({
          where: { user_id: userId },
          orderBy: { date_completed: "desc" },
        }),
        prisma.nutritionPlan.findFirst({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
        }),
      ]);

      if (!questionnaire) {
        return res.status(400).json({
          success: false,
          error:
            "User questionnaire not found. Please complete the questionnaire first.",
        });
      }

      // Function to calculate default calories based on questionnaire data
      const calculateDefaultCalories = (questionnaire: any) => {
        let bmr = 0;

        // Harris-Benedict equation for BMR calculation
        if (questionnaire.sex === "male") {
          bmr =
            88.362 +
            13.397 * questionnaire.current_weight_kg +
            4.799 * questionnaire.height_cm -
            5.677 * questionnaire.age_years;
        } else {
          bmr =
            447.593 +
            9.247 * questionnaire.current_weight_kg +
            3.098 * questionnaire.height_cm -
            4.33 * questionnaire.age_years;
        }

        // Adjust BMR based on activity level
        let activityFactor = 1.2; // Sedentary
        if (questionnaire.activity_level === "lightly_active") {
          activityFactor = 1.375;
        } else if (questionnaire.activity_level === "moderately_active") {
          activityFactor = 1.55;
        } else if (questionnaire.activity_level === "very_active") {
          activityFactor = 1.725;
        } else if (questionnaire.activity_level === "extra_active") {
          activityFactor = 1.9;
        }

        // Swap meal in plan
        router.put(
          "/:planId/swap-meal",
          authenticateToken,
          async (req, res) => {
            try {
              const { planId } = req.params;
              const { current_meal, day, meal_timing, preferences } = req.body;
              const user_id = req.user?.user_id;

              if (!user_id) {
                return res
                  .status(401)
                  .json({ success: false, error: "User not authenticated" });
              }

              console.log("🔄 Swapping meal in plan:", planId);

              const result = await MealPlanService.replaceMealInPlan(
                user_id,
                planId,
                getDayNumber(day),
                meal_timing,
                0, // meal_order
                preferences
              );

              res.json({
                success: true,
                data: result,
                message: "Meal swapped successfully",
              });
            } catch (error: any) {
              console.error("💥 Error swapping meal:", error);
              res.status(500).json({
                success: false,
                error: error.message || "Failed to swap meal",
              });
            }
          }
        );

        // Update meal interaction (rating, comments, favorite)
        router.put(
          "/:planId/meals/:templateId/interaction",
          authenticateToken,
          async (req, res) => {
            try {
              const { planId, templateId } = req.params;
              const { rating, comments, day, meal_timing } = req.body;
              const user_id = req.user?.user_id;

              if (!user_id) {
                return res
                  .status(401)
                  .json({ success: false, error: "User not authenticated" });
              }

              console.log("💝 Saving meal interaction:", {
                templateId,
                rating,
                comments,
              });

              await MealPlanService.saveMealPreference(
                user_id,
                templateId,
                "rating",
                rating,
                comments
              );

              res.json({
                success: true,
                message: "Meal interaction saved successfully",
              });
            } catch (error: any) {
              console.error("💥 Error saving meal interaction:", error);
              res.status(500).json({
                success: false,
                error: error.message || "Failed to save meal interaction",
              });
            }
          }
        );

        // Toggle meal favorite
        router.put(
          "/:planId/meals/:templateId/favorite",
          authenticateToken,
          async (req, res) => {
            try {
              const { planId, templateId } = req.params;
              const { is_favorite, day, meal_timing } = req.body;
              const user_id = req.user?.user_id;

              if (!user_id) {
                return res
                  .status(401)
                  .json({ success: false, error: "User not authenticated" });
              }

              console.log("❤️ Toggling meal favorite:", {
                templateId,
                is_favorite,
              });

              await MealPlanService.saveMealPreference(
                user_id,
                templateId,
                "favorite",
                undefined,
                undefined
              );

              res.json({
                success: true,
                message: "Meal favorite status updated successfully",
              });
            } catch (error: any) {
              console.error("💥 Error updating meal favorite:", error);
              res.status(500).json({
                success: false,
                error: error.message || "Failed to update meal favorite",
              });
            }
          }
        );

        // Helper function to convert day name to number
        function getDayNumber(dayName: string): number {
          const dayMap: { [key: string]: number } = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
          };
          return dayMap[dayName] || 0;
        }

        let maintenanceCalories = bmr * activityFactor;

        // Adjust calories based on the main goal
        if (questionnaire.main_goal === "lose_weight") {
          maintenanceCalories -= 500; // Create a deficit of 500 calories
        } else if (questionnaire.main_goal === "gain_muscle") {
          maintenanceCalories += 250; // Add a surplus of 250 calories
        }

        return Math.round(maintenanceCalories);
      };

      // Create default nutrition plan if none exists
      let userNutritionPlan = nutritionPlan;
      if (!userNutritionPlan) {
        console.log(
          "⚠️ No nutrition plan found, creating default based on questionnaire"
        );

        // Calculate basic nutrition needs from questionnaire
        const defaultCalories = calculateDefaultCalories(questionnaire);
        const defaultProtein = Math.round((defaultCalories * 0.3) / 4); // 30% of calories from protein
        const defaultCarbs = Math.round((defaultCalories * 0.4) / 4); // 40% from carbs
        const defaultFats = Math.round((defaultCalories * 0.3) / 9); // 30% from fats

        userNutritionPlan = await prisma.nutritionPlan.create({
          data: {
            user_id: userId,
            goal_calories: defaultCalories,
            goal_protein_g: defaultProtein,
            goal_carbs_g: defaultCarbs,
            goal_fats_g: defaultFats,
            target_weight_kg: questionnaire.target_weight_kg,
            duration_days: questionnaire.goal_timeframe_days || 90,
            notes: "Auto-generated based on questionnaire data",
          },
        });
      }

      // Create a new recommended menu
      const menu = await prisma.recommendedMenu.create({
        data: {
          user_id: userId,
          title: `Personalized Menu - ${new Date().toLocaleDateString()}`,
          description: `Based on your ${questionnaire.main_goal} goal`,
          total_calories: userNutritionPlan.goal_calories || 2000,
          total_protein: userNutritionPlan.goal_protein_g || 150,
          total_carbs: userNutritionPlan.goal_carbs_g || 200,
          total_fat: userNutritionPlan.goal_fats_g || 70,
          created_at: new Date(),
        },
      });

      // Generate sample meals based on user preferences
      const sampleMeals = [
        {
          menu_id: menu.menu_id,
          name: "Protein Breakfast",
          meal_type: MealTiming.BREAKFAST,
          calories: Math.round(
            (userNutritionPlan.goal_calories || 2000) * 0.25
          ),
          protein: Math.round((userNutritionPlan.goal_protein_g || 150) * 0.3),
          carbs: Math.round((userNutritionPlan.goal_carbs_g || 200) * 0.2),
          fat: Math.round((userNutritionPlan.goal_fats_g || 70) * 0.25),
        },
        {
          menu_id: menu.menu_id,
          name: "Balanced Lunch",
          meal_type: MealTiming.LUNCH,
          calories: Math.round(
            (userNutritionPlan.goal_calories || 2000) * 0.35
          ),
          protein: Math.round((userNutritionPlan.goal_protein_g || 150) * 0.4),
          carbs: Math.round((userNutritionPlan.goal_carbs_g || 200) * 0.4),
          fat: Math.round((userNutritionPlan.goal_fats_g || 70) * 0.35),
        },
        {
          menu_id: menu.menu_id,
          name: "Light Dinner",
          meal_type: MealTiming.DINNER,
          calories: Math.round((userNutritionPlan.goal_calories || 2000) * 0.3),
          protein: Math.round((userNutritionPlan.goal_protein_g || 150) * 0.25),
          carbs: Math.round((userNutritionPlan.goal_carbs_g || 200) * 0.3),
          fat: Math.round((userNutritionPlan.goal_fats_g || 70) * 0.3),
        },
      ];

      await prisma.recommendedMeal.createMany({
        data: sampleMeals,
      });

      // Fetch the complete menu with meals
      const completeMenu = await prisma.recommendedMenu.findUnique({
        where: { menu_id: menu.menu_id },
        include: {
          meals: {
            include: {
              ingredients: true,
            },
          },
        },
      });

      res.json({
        success: true,
        menu: completeMenu,
      });
    } catch (error) {
      console.error("Generate recommended menu error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate recommended menu",
      });
    }
  }
);

// Get current/active meal plan
router.get("/current", authenticateToken, async (req, res) => {
  try {
    console.log("📋 Getting current meal plan for user:", req.user?.user_id);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Get user's active plan/menu IDs
    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        active_meal_plan_id: true,
        active_menu_id: true,
      },
    });

    let weeklyPlan: any = {};
    let planId: string | null = null;
    let planName: string | null = null;
    let hasActivePlan = false;

    // Try active meal plan first
    if (user?.active_meal_plan_id) {
      console.log("🔍 Checking active meal plan:", user.active_meal_plan_id);
      try {
        // Check if meal plan exists and has schedules
        const mealPlan = await prisma.userMealPlan.findFirst({
          where: {
            plan_id: user.active_meal_plan_id,
            user_id: user_id,
          },
          include: {
            schedules: {
              include: {
                template: true,
              },
            },
          },
        });

        if (mealPlan && mealPlan.schedules.length > 0) {
          weeklyPlan = await MealPlanService.getUserMealPlan(
            user_id,
            user.active_meal_plan_id
          );

          planId = user.active_meal_plan_id;
          planName = mealPlan.name || "Active Plan";
          hasActivePlan = true;
          console.log("✅ Active meal plan found with schedules");
        } else if (mealPlan) {
          console.log(
            "⚠️ Meal plan exists but has no schedules, trying to regenerate"
          );
          // Plan exists but no schedules - this is the issue we're seeing
          // Try to use the recommended menu as fallback
        }
      } catch (error) {
        console.log("⚠️ Error checking active meal plan:", error);
      }
    }

    // If no meal plan data, try recommended menu
    if (!hasActivePlan && user?.active_menu_id) {
      console.log("🔍 Checking active recommended menu:", user.active_menu_id);
      try {
        const recommendedMenu = await prisma.recommendedMenu.findFirst({
          where: {
            menu_id: user.active_menu_id,
            user_id: user_id,
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

        if (recommendedMenu && recommendedMenu.meals.length > 0) {
          // Convert recommended menu to weekly plan format
          const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          weeklyPlan = {};

          recommendedMenu.meals.forEach((meal) => {
            const dayName = dayNames[(meal.day_number - 1) % 7];
            const timing = meal.meal_type;

            if (!weeklyPlan[dayName]) {
              weeklyPlan[dayName] = {};
            }
            if (!weeklyPlan[dayName][timing]) {
              weeklyPlan[dayName][timing] = [];
            }

            weeklyPlan[dayName][timing].push({
              template_id: meal.meal_id,
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

          planId = user.active_menu_id;
          planName = recommendedMenu.title;
          hasActivePlan = true;
          console.log(
            "✅ Active recommended menu found and converted to weekly plan"
          );
        }
      } catch (error) {
        console.log(
          "⚠️ Active recommended menu not found or has no data:",
          error
        );
      }
    }

    // If still no plan, try to find any recent plan for the user
    if (!hasActivePlan) {
      console.log("🔍 Trying to find any recent meal plan or menu");

      // Try latest meal plan
      const latestPlan = await prisma.userMealPlan.findFirst({
        where: { user_id },
        include: {
          schedules: {
            include: {
              template: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      if (latestPlan && latestPlan.schedules.length > 0) {
        weeklyPlan = await MealPlanService.getUserMealPlan(
          user_id,
          latestPlan.plan_id
        );
        planId = latestPlan.plan_id;
        planName = latestPlan.name;
        hasActivePlan = true;

        // Update user's active plan
        await prisma.user.update({
          where: { user_id },
          data: { active_meal_plan_id: latestPlan.plan_id },
        });

        console.log("✅ Found latest meal plan and set as active");
      } else {
        // Try latest recommended menu
        const latestMenu = await prisma.recommendedMenu.findFirst({
          where: { user_id },
          include: {
            meals: {
              include: {
                ingredients: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        });

        if (latestMenu && latestMenu.meals.length > 0) {
          // Convert to weekly plan format (same code as above)
          const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          weeklyPlan = {};

          latestMenu.meals.forEach((meal) => {
            const dayName = dayNames[(meal.day_number - 1) % 7];
            const timing = meal.meal_type;

            if (!weeklyPlan[dayName]) {
              weeklyPlan[dayName] = {};
            }
            if (!weeklyPlan[dayName][timing]) {
              weeklyPlan[dayName][timing] = [];
            }

            weeklyPlan[dayName][timing].push({
              template_id: meal.meal_id,
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

          planId = latestMenu.menu_id;
          planName = latestMenu.title;
          hasActivePlan = true;

          // Update user's active menu
          await prisma.user.update({
            where: { user_id },
            data: { active_menu_id: latestMenu.menu_id },
          });

          console.log("✅ Found latest recommended menu and set as active");
        }
      }
    }

    if (hasActivePlan && Object.keys(weeklyPlan).length > 0) {
      return res.json({
        success: true,
        data: weeklyPlan,
        planId: planId,
        planName: planName,
        hasActivePlan: true,
      });
    } else {
      // No active plan, return empty structure
      console.log("⚠️ No active meal plan found");
      return res.json({
        success: true,
        data: {},
        planId: null,
        planName: null,
        hasActivePlan: false,
        message: "No active meal plan found. Create one to get started!",
      });
    }
  } catch (error) {
    console.error("💥 Error getting current meal plan:", error);

    // Return empty structure on error to prevent frontend crashes
    return res.json({
      success: true,
      data: {},
      planId: null,
      planName: null,
      hasActivePlan: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Create comprehensive menu
router.post("/create-comprehensive", authenticateToken, async (req, res) => {
  try {
    console.log("🎨 Creating comprehensive menu for user:", req.user?.user_id);
    console.log("📝 Config:", req.body);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const {
      menuName,
      days,
      mealsPerDay,
      dietaryPreferences,
      excludedIngredients,
      includedIngredients,
      cuisineTypes,
      cookingMethods,
      budget,
      targetCalories,
      proteinGoal,
      carbGoal,
      fatGoal,
      specialRequests,
    } = req.body;

    // Validate required fields
    if (!menuName || !days || !mealsPerDay) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: menuName, days, mealsPerDay",
      });
    }

    // Create comprehensive menu using MealPlanService
    const config = {
      name: menuName,
      plan_type: "WEEKLY" as const,
      meals_per_day: parseInt(mealsPerDay) || 3,
      snacks_per_day: 0,
      rotation_frequency_days: parseInt(days) || 7,
      include_leftovers: false,
      fixed_meal_times: true,
      dietary_preferences: dietaryPreferences || [],
      excluded_ingredients: excludedIngredients || [],
    };

    const mealPlan = await MealPlanService.createUserMealPlan(user_id, config);

    // Update user's active meal plan
    await prisma.user.update({
      where: { user_id },
      data: {
        active_meal_plan_id: mealPlan.plan_id,
        active_menu_id: mealPlan.plan_id,
      },
    });

    console.log("✅ Comprehensive menu created successfully");
    res.json({
      success: true,
      data: mealPlan,
      message: "Comprehensive menu created successfully",
    });
  } catch (error) {
    console.error("💥 Error creating comprehensive menu:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create comprehensive menu",
    });
  }
});

// Activate a menu as the current active menu
router.post("/:planId/activate", authenticateToken, async (req, res) => {
  try {
    console.log("🔄 Activating menu:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;

    // Verify the plan exists and belongs to the user
    const mealPlan = await prisma.userMealPlan.findFirst({
      where: {
        plan_id: planId,
        user_id: user_id,
      },
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        error: "Meal plan not found",
      });
    }

    // Deactivate all other plans for this user
    await prisma.userMealPlan.updateMany({
      where: { user_id },
      data: { is_active: false },
    });

    // Activate the selected plan
    await prisma.userMealPlan.update({
      where: { plan_id: planId },
      data: { is_active: true },
    });

    // Update user's active meal plan reference
    await prisma.user.update({
      where: { user_id },
      data: {
        active_meal_plan_id: planId,
        active_menu_id: planId,
      },
    });

    console.log("✅ Menu activated successfully");
    res.json({
      success: true,
      message: "Menu activated successfully",
      planId,
    });
  } catch (error) {
    console.error("💥 Error activating menu:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to activate menu",
    });
  }
});

// Get user's active menu status
router.get("/active-status", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        active_meal_plan_id: true,
        active_menu_id: true,
      },
    });

    res.json({
      success: true,
      hasActiveMenu: !!(user?.active_meal_plan_id || user?.active_menu_id),
      activePlanId: user?.active_meal_plan_id,
      activeMenuId: user?.active_menu_id,
    });
  } catch (error) {
    console.error("💥 Error getting active menu status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get active menu status",
    });
  }
});

// Create new meal plan
router.post("/create", authenticateToken, async (req, res) => {
  try {
    console.log("🤖 Creating meal plan for user:", req.user?.user_id);
    console.log("📝 Config:", req.body);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const config = req.body;

    // Validate required fields
    if (!config.name || !config.plan_type || !config.meals_per_day) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, plan_type, meals_per_day",
      });
    }

    const mealPlan = await MealPlanService.createUserMealPlan(user_id, config);

    console.log("✅ Meal plan created successfully");
    res.json({
      success: true,
      data: mealPlan,
      message: "Meal plan created successfully",
    });
  } catch (error) {
    console.error("💥 Error creating meal plan:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create meal plan",
    });
  }
});
// Replace meal in plan
router.put("/:planId/replace", authenticateToken, async (req, res) => {
  try {
    console.log("🔄 Replacing meal in plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    const {
      day_of_week,
      meal_timing,
      meal_order = 0,
      preferences = {},
    } = req.body;

    // Validate required fields
    if (day_of_week === undefined || !meal_timing) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: day_of_week, meal_timing",
      });
    }

    const result = await MealPlanService.replaceMealInPlan(
      user_id,
      planId,
      day_of_week,
      meal_timing,
      meal_order,
      preferences
    );

    console.log("✅ Meal replaced successfully");
    res.json({
      success: true,
      data: result,
      message: "Meal replaced successfully",
    });
  } catch (error) {
    console.error("💥 Error replacing meal:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to replace meal",
    });
  }
});

// Generate shopping list
router.post("/:planId/shopping-list", authenticateToken, async (req, res) => {
  try {
    console.log("🛒 Generating shopping list for plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    const { week_start_date } = req.body;

    if (!week_start_date) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: week_start_date",
      });
    }

    const shoppingList = await MealPlanService.generateShoppingList(
      user_id,
      planId,
      week_start_date
    );

    console.log("✅ Shopping list generated successfully");
    res.json({
      success: true,
      data: shoppingList,
      message: "Shopping list generated successfully",
    });
  } catch (error) {
    console.error("💥 Error generating shopping list:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate shopping list",
    });
  }
});

// Save meal preference
router.post("/preferences", authenticateToken, async (req, res) => {
  try {
    console.log("💝 Saving meal preference");

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { template_id, preference_type, rating, notes } = req.body;

    if (!template_id || !preference_type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: template_id, preference_type",
      });
    }

    const preference = await MealPlanService.saveMealPreference(
      user_id,
      template_id,
      preference_type,
      rating,
      notes
    );

    console.log("✅ Meal preference saved successfully");
    res.json({
      success: true,
      data: preference,
      message: "Preference saved successfully",
    });
  } catch (error) {
    console.error("💥 Error saving meal preference:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save preference",
    });
  }
});

// Activate meal plan
router.post("/:planId/activate", authenticateToken, async (req, res) => {
  try {
    console.log("🚀 Activating meal plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    const { previousPlanFeedback } = req.body;

    // If there's feedback about a previous plan, store it
    if (previousPlanFeedback) {
      await MealPlanService.savePlanFeedback(
        user_id,
        previousPlanFeedback.planId,
        previousPlanFeedback.rating,
        previousPlanFeedback.liked,
        previousPlanFeedback.disliked,
        previousPlanFeedback.suggestions
      );
    }

    // Deactivate any currently active plans
    await MealPlanService.deactivateUserPlans(user_id);

    // Activate the new plan
    const activatedPlan = await MealPlanService.activatePlan(user_id, planId);

    console.log("✅ Meal plan activated successfully");
    res.json({
      success: true,
      data: activatedPlan,
      message: "Meal plan activated successfully",
    });
  } catch (error) {
    console.error("💥 Error activating meal plan:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to activate meal plan",
    });
  }
});

// Complete meal plan with feedback
router.post("/:planId/complete", authenticateToken, async (req, res) => {
  try {
    console.log("🏁 Completing meal plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    const { rating, liked, disliked, suggestions } = req.body;

    // Check if plan exists first
    const existingPlan = await prisma.userMealPlan.findFirst({
      where: {
        plan_id: planId,
        user_id: user_id,
      },
    });

    if (!existingPlan) {
      // Try to find by menu_id in case it's a recommended menu
      const recommendedMenu = await prisma.recommendedMenu.findFirst({
        where: {
          menu_id: planId,
          user_id: user_id,
        },
      });

      if (recommendedMenu) {
        // Create a completion record for the recommended menu
        await prisma.recommendedMenu.update({
          where: {
            menu_id: planId,
          },
          data: {
            completed_at: new Date(),
            rating: rating,
            feedback_liked: liked,
            feedback_disliked: disliked,
            feedback_suggestions: suggestions,
          },
        });

        console.log("✅ Recommended menu completed successfully");
        return res.json({
          success: true,
          message: "Menu completed and feedback saved",
        });
      }

      return res.status(404).json({
        success: false,
        error: "Plan or menu not found",
      });
    }

    // Save feedback and mark plan as completed
    await MealPlanService.completePlan(user_id, planId, {
      rating,
      liked,
      disliked,
      suggestions,
    });

    console.log("✅ Meal plan completed successfully");
    res.json({
      success: true,
      message: "Meal plan completed and feedback saved",
    });
  } catch (error) {
    console.error("💥 Error completing meal plan:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to complete meal plan",
    });
  }
});

// Get meal plan by ID
router.get("/:planId", authenticateToken, async (req, res) => {
  try {
    console.log("📋 Getting meal plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    const weeklyPlan = await MealPlanService.getUserMealPlan(user_id, planId);

    console.log("✅ Meal plan retrieved successfully");
    res.json({
      success: true,
      data: weeklyPlan,
      planId: planId,
    });
  } catch (error) {
    console.error("💥 Error getting meal plan:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get meal plan",
    });
  }
});

// Deactivate meal plan
router.post("/:planId/deactivate", authenticateToken, async (req, res) => {
  try {
    console.log("🔄 Deactivating meal plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    await MealPlanService.deactivateMealPlan(user_id, planId);

    console.log("✅ Meal plan deactivated successfully");
    res.json({
      success: true,
      message: "Meal plan deactivated successfully",
    });
  } catch (error) {
    console.error("💥 Error deactivating meal plan:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to deactivate meal plan",
    });
  }
});

export { router as mealPlansRoutes };

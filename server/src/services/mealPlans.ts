import { prisma } from "../lib/database";
import { UserMealPlanConfig, WeeklyMealPlan, MealPlanTemplate } from "../types/mealPlans";
import { OpenAIService } from "./openai";

export class MealPlanService {
  static async createUserMealPlan(
    userId: string,
    config: UserMealPlanConfig
  ) {
    try {
      console.log("🎯 Creating meal plan for user:", userId);
      console.log("📋 Config:", config);

      // Get user's questionnaire for personalization
      const questionnaire = await prisma.userQuestionnaire.findFirst({
        where: { user_id: userId },
        orderBy: { date_completed: "desc" },
      });

      if (!questionnaire) {
        throw new Error("User questionnaire not found. Please complete the questionnaire first.");
      }

      // Create the meal plan record
      const mealPlan = await prisma.userMealPlan.create({
        data: {
          user_id: userId,
          name: config.name,
          plan_type: config.plan_type,
          meals_per_day: config.meals_per_day,
          snacks_per_day: config.snacks_per_day,
          rotation_frequency_days: config.rotation_frequency_days,
          include_leftovers: config.include_leftovers,
          fixed_meal_times: config.fixed_meal_times,
          dietary_preferences: config.dietary_preferences.join(", "),
          excluded_ingredients: config.excluded_ingredients.join(", "),
          start_date: new Date(),
          is_active: false,
          total_meals: config.meals_per_day * config.rotation_frequency_days,
        },
      });

      // Generate meal templates and schedules
      await this.generateMealTemplatesAndSchedules(
        mealPlan.plan_id,
        config,
        questionnaire
      );

      console.log("✅ Meal plan created successfully");
      return mealPlan;
    } catch (error) {
      console.error("💥 Error creating meal plan:", error);
      throw error;
    }
  }

  private static async generateMealTemplatesAndSchedules(
    planId: string,
    config: UserMealPlanConfig,
    questionnaire: any
  ) {
    try {
      console.log("🍽️ Generating meal templates and schedules...");

      // Generate sample meals for each day and meal timing
      const mealTimings = ["BREAKFAST", "LUNCH", "DINNER"];
      if (config.snacks_per_day > 0) {
        mealTimings.push("SNACK");
      }

      const sampleMeals = [
        {
          name: "Protein Breakfast Bowl",
          meal_timing: "BREAKFAST",
          calories: 350,
          protein_g: 25,
          carbs_g: 30,
          fats_g: 15,
          ingredients: ["eggs", "oats", "berries", "nuts"],
          instructions: ["Cook oats", "Scramble eggs", "Add toppings"],
        },
        {
          name: "Balanced Lunch",
          meal_timing: "LUNCH",
          calories: 450,
          protein_g: 30,
          carbs_g: 40,
          fats_g: 18,
          ingredients: ["chicken", "rice", "vegetables", "olive oil"],
          instructions: ["Grill chicken", "Cook rice", "Steam vegetables"],
        },
        {
          name: "Light Dinner",
          meal_timing: "DINNER",
          calories: 400,
          protein_g: 25,
          carbs_g: 35,
          fats_g: 16,
          ingredients: ["fish", "quinoa", "salad", "avocado"],
          instructions: ["Bake fish", "Cook quinoa", "Prepare salad"],
        },
      ];

      // Create templates and schedules
      for (let day = 0; day < config.rotation_frequency_days; day++) {
        for (let mealIndex = 0; mealIndex < config.meals_per_day; mealIndex++) {
          const mealTiming = mealTimings[mealIndex % mealTimings.length];
          const sampleMeal = sampleMeals[mealIndex % sampleMeals.length];

          // Create meal template
          const template = await prisma.mealTemplate.create({
            data: {
              name: `${sampleMeal.name} - Day ${day + 1}`,
              description: `Personalized meal for day ${day + 1}`,
              meal_timing: mealTiming as any,
              dietary_category: "BALANCED",
              prep_time_minutes: 30,
              difficulty_level: 2,
              calories: sampleMeal.calories,
              protein_g: sampleMeal.protein_g,
              carbs_g: sampleMeal.carbs_g,
              fats_g: sampleMeal.fats_g,
              fiber_g: 5,
              sugar_g: 8,
              sodium_mg: 400,
              ingredients_json: sampleMeal.ingredients,
              instructions_json: sampleMeal.instructions,
              allergens_json: [],
              is_active: true,
            },
          });

          // Create schedule entry
          await prisma.mealPlanSchedule.create({
            data: {
              plan_id: planId,
              template_id: template.template_id,
              day_of_week: day,
              meal_timing: mealTiming as any,
              meal_order: 1,
              portion_multiplier: 1.0,
              is_optional: false,
            },
          });
        }
      }

      console.log("✅ Meal templates and schedules generated");
    } catch (error) {
      console.error("💥 Error generating templates and schedules:", error);
      throw error;
    }
  }

  static async replaceMealInPlan(
    userId: string,
    planId: string,
    dayOfWeek: number,
    mealTiming: string,
    mealOrder: number = 0,
    preferences: any = {}
  ) {
    try {
      console.log("🔄 Replacing meal in plan:", {
        planId,
        dayOfWeek,
        mealTiming,
        mealOrder,
      });

      // Find the existing schedule entry
      const existingSchedule = await prisma.mealPlanSchedule.findFirst({
        where: {
          plan_id: planId,
          day_of_week: dayOfWeek,
          meal_timing: mealTiming as any,
          meal_order: mealOrder,
        },
        include: {
          template: true,
          plan: {
            where: { user_id: userId },
          },
        },
      });

      if (!existingSchedule || !existingSchedule.plan) {
        throw new Error("Meal schedule not found or access denied");
      }

      // Generate a replacement meal template
      const replacementTemplate = await this.generateReplacementTemplate(
        existingSchedule.template,
        preferences,
        userId
      );

      // Update the schedule to use the new template
      const updatedSchedule = await prisma.mealPlanSchedule.update({
        where: { schedule_id: existingSchedule.schedule_id },
        data: { template_id: replacementTemplate.template_id },
        include: { template: true },
      });

      console.log("✅ Meal replaced successfully");
      return updatedSchedule;
    } catch (error) {
      console.error("💥 Error replacing meal:", error);
      throw error;
    }
  }

  private static async generateReplacementTemplate(
    originalTemplate: any,
    preferences: any,
    userId: string
  ) {
    try {
      // Create a variation of the original template
      const variations = [
        {
          name: `${originalTemplate.name} (Alternative)`,
          calories: originalTemplate.calories * 0.95,
          protein_g: originalTemplate.protein_g * 1.1,
          carbs_g: originalTemplate.carbs_g * 0.9,
          fats_g: originalTemplate.fats_g * 1.05,
        },
        {
          name: `Healthy ${originalTemplate.meal_timing} Option`,
          calories: originalTemplate.calories * 1.05,
          protein_g: originalTemplate.protein_g * 0.9,
          carbs_g: originalTemplate.carbs_g * 1.1,
          fats_g: originalTemplate.fats_g * 0.95,
        },
      ];

      const variation = variations[Math.floor(Math.random() * variations.length)];

      const newTemplate = await prisma.mealTemplate.create({
        data: {
          name: variation.name,
          description: `Alternative to ${originalTemplate.name}`,
          meal_timing: originalTemplate.meal_timing,
          dietary_category: originalTemplate.dietary_category,
          prep_time_minutes: originalTemplate.prep_time_minutes,
          difficulty_level: originalTemplate.difficulty_level,
          calories: variation.calories,
          protein_g: variation.protein_g,
          carbs_g: variation.carbs_g,
          fats_g: variation.fats_g,
          fiber_g: originalTemplate.fiber_g,
          sugar_g: originalTemplate.sugar_g,
          sodium_mg: originalTemplate.sodium_mg,
          ingredients_json: originalTemplate.ingredients_json,
          instructions_json: originalTemplate.instructions_json,
          allergens_json: originalTemplate.allergens_json,
          image_url: originalTemplate.image_url,
          is_active: true,
        },
      });

      return newTemplate;
    } catch (error) {
      console.error("💥 Error generating replacement template:", error);
      throw error;
    }
  }

  static async generateShoppingList(
    userId: string,
    planId: string,
    weekStartDate: string
  ) {
    try {
      console.log("🛒 Generating shopping list for plan:", planId);

      // Get meal plan with schedules and templates
      const mealPlan = await prisma.userMealPlan.findFirst({
        where: {
          plan_id: planId,
          user_id: userId,
        },
        include: {
          schedules: {
            include: {
              template: true,
            },
          },
        },
      });

      if (!mealPlan) {
        throw new Error("Meal plan not found");
      }

      // Aggregate ingredients from all meals
      const ingredientMap = new Map();

      mealPlan.schedules.forEach((schedule) => {
        const ingredients = schedule.template.ingredients_json as any[];
        if (Array.isArray(ingredients)) {
          ingredients.forEach((ingredient) => {
            const key = ingredient.toLowerCase();
            if (ingredientMap.has(key)) {
              ingredientMap.set(key, ingredientMap.get(key) + 1);
            } else {
              ingredientMap.set(key, 1);
            }
          });
        }
      });

      // Create shopping list items
      const shoppingItems = [];
      for (const [ingredient, quantity] of ingredientMap) {
        shoppingItems.push({
          user_id: userId,
          plan_id: planId,
          name: ingredient,
          quantity: quantity,
          unit: "portions",
          category: "Ingredients",
          added_from: "meal_plan",
          estimated_cost: 10,
        });
      }

      // Bulk create shopping list items
      await prisma.shoppingList.createMany({
        data: shoppingItems,
      });

      console.log("✅ Shopping list generated successfully");
      return {
        plan_id: planId,
        items: shoppingItems,
        total_items: shoppingItems.length,
        week_start_date: weekStartDate,
      };
    } catch (error) {
      console.error("💥 Error generating shopping list:", error);
      throw error;
    }
  }

  static async saveMealPreference(
    userId: string,
    templateId: string,
    preferenceType: string,
    rating?: number,
    notes?: string
  ) {
    try {
      const preference = await prisma.userMealPreference.upsert({
        where: {
          user_id_template_id_preference_type: {
            user_id: userId,
            template_id: templateId,
            preference_type: preferenceType,
          },
        },
        update: {
          rating,
          notes,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          template_id: templateId,
          preference_type: preferenceType,
          rating,
          notes,
        },
      });

      return preference;
    } catch (error) {
      console.error("💥 Error saving meal preference:", error);
      throw error;
    }
  }

  static async deactivateUserPlans(userId: string) {
    try {
      await prisma.userMealPlan.updateMany({
        where: { user_id: userId },
        data: { is_active: false },
      });

      // Clear user's active plan references
      await prisma.user.update({
        where: { user_id: userId },
        data: {
          active_meal_plan_id: null,
          active_menu_id: null,
        },
      });

      console.log("✅ User plans deactivated");
    } catch (error) {
      console.error("💥 Error deactivating user plans:", error);
      throw error;
    }
  }

  static async activatePlan(userId: string, planId: string) {
    try {
      // Deactivate other plans first
      await this.deactivateUserPlans(userId);

      // Activate the selected plan
      const activatedPlan = await prisma.userMealPlan.update({
        where: { plan_id: planId },
        data: { 
          is_active: true,
          status: "active",
          start_date: new Date(),
        },
      });

      // Update user's active plan reference
      await prisma.user.update({
        where: { user_id: userId },
        data: {
          active_meal_plan_id: planId,
          active_menu_id: planId,
        },
      });

      return activatedPlan;
    } catch (error) {
      console.error("💥 Error activating plan:", error);
      throw error;
    }
  }

  static async completePlan(
    userId: string,
    planId: string,
    feedback: {
      rating?: number;
      liked?: string;
      disliked?: string;
      suggestions?: string;
    }
  ) {
    try {
      await prisma.userMealPlan.update({
        where: { plan_id: planId },
        data: {
          is_active: false,
          status: "completed",
          completed_at: new Date(),
          rating: feedback.rating,
          feedback_liked: feedback.liked,
          feedback_disliked: feedback.disliked,
          feedback_suggestions: feedback.suggestions,
          progress_percentage: 100,
        },
      });

      return { message: "Meal plan completed successfully" };
    } catch (error) {
      console.error("💥 Error completing plan:", error);
      throw error;
    }
  }

  static async savePlanFeedback(
    userId: string,
    planId: string,
    rating?: number,
    liked?: string,
    disliked?: string,
    suggestions?: string
  ) {
    try {
      await prisma.userMealPlan.updateMany({
        where: {
          plan_id: planId,
          user_id: userId,
        },
        data: {
          rating,
          feedback_liked: liked,
          feedback_disliked: disliked,
          feedback_suggestions: suggestions,
        },
      });

      console.log("✅ Plan feedback saved");
    } catch (error) {
      console.error("💥 Error saving plan feedback:", error);
      throw error;
    }
  }

  static async deactivateMealPlan(userId: string, planId: string) {
    try {
      await prisma.userMealPlan.updateMany({
        where: {
          plan_id: planId,
          user_id: userId,
        },
        data: {
          is_active: false,
          status: "paused",
        },
      });

      // Clear user's active plan reference if this was the active plan
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { active_meal_plan_id: true },
      });

      if (user?.active_meal_plan_id === planId) {
        await prisma.user.update({
          where: { user_id: userId },
          data: {
            active_meal_plan_id: null,
            active_menu_id: null,
          },
        });
      }

      console.log("✅ Meal plan deactivated");
    } catch (error) {
      console.error("💥 Error deactivating meal plan:", error);
      throw error;
    }
  }
}
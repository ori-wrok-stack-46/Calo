import { prisma } from "../lib/database";
import { OpenAIService } from "./openai";

export interface GenerateMenuParams {
  userId: string;
  days?: number;
  mealsPerDay?: string;
  customRequest?: string;
  budget?: number;
  mealChangeFrequency?: string;
  includeLeftovers?: boolean;
  sameMealTimes?: boolean;
  targetCalories?: number;
  dietaryPreferences?: string[];
  excludedIngredients?: string[];
}

export class RecommendedMenuService {
  static async generatePersonalizedMenu(params: GenerateMenuParams) {
    try {
      console.log("🎯 Generating personalized menu for user:", params.userId);

      // Get user's questionnaire for personalization
      const questionnaire = await prisma.userQuestionnaire.findFirst({
        where: { user_id: params.userId },
        orderBy: { date_completed: "desc" },
      });

      if (!questionnaire) {
        throw new Error(
          "User questionnaire not found. Please complete the questionnaire first."
        );
      }

      // Get user's nutrition goals
      const nutritionPlan = await prisma.nutritionPlan.findFirst({
        where: { user_id: params.userId },
        orderBy: { created_at: "desc" },
      });

      // Generate menu using AI or fallback
      const menuData = await this.generateMenuWithAI(
        params,
        questionnaire,
        nutritionPlan
      );

      // Save to database
      const savedMenu = await this.saveMenuToDatabase(params.userId, menuData);

      console.log("✅ Personalized menu generated successfully");
      return savedMenu;
    } catch (error) {
      console.error("💥 Error generating personalized menu:", error);
      throw error;
    }
  }

  static async generateCustomMenu(params: GenerateMenuParams) {
    try {
      console.log("🎨 Generating custom menu for user:", params.userId);

      // Get user context
      const questionnaire = await prisma.userQuestionnaire.findFirst({
        where: { user_id: params.userId },
        orderBy: { date_completed: "desc" },
      });

      if (!questionnaire) {
        throw new Error(
          "User questionnaire not found. Please complete the questionnaire first."
        );
      }

      // Generate custom menu based on request
      const menuData = await this.generateCustomMenuWithAI(
        params,
        questionnaire
      );

      // Save to database
      const savedMenu = await this.saveMenuToDatabase(params.userId, menuData);

      console.log("✅ Custom menu generated successfully");
      return savedMenu;
    } catch (error) {
      console.error("💥 Error generating custom menu:", error);
      throw error;
    }
  }

  private static async generateMenuWithAI(
    params: GenerateMenuParams,
    questionnaire: any,
    nutritionPlan: any
  ) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI key, using fallback menu generation");
        return this.generateFallbackMenu(params, questionnaire);
      }

      const prompt = this.buildMenuGenerationPrompt(
        params,
        questionnaire,
        nutritionPlan
      );
      const aiResponse = await OpenAIService.generateText(prompt, 2000);

      // Parse AI response
      const menuData = this.parseAIMenuResponse(aiResponse);
      return menuData;
    } catch (error) {
      console.log("⚠️ AI menu generation failed, using fallback");
      return this.generateFallbackMenu(params, questionnaire);
    }
  }

  private static async generateCustomMenuWithAI(
    params: GenerateMenuParams,
    questionnaire: any
  ) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI key, using fallback custom menu");
        return this.generateFallbackCustomMenu(params, questionnaire);
      }

      const prompt = this.buildCustomMenuPrompt(params, questionnaire);
      const aiResponse = await OpenAIService.generateText(prompt, 2000);

      // Parse AI response
      const menuData = this.parseAIMenuResponse(aiResponse);
      return menuData;
    } catch (error) {
      console.log("⚠️ AI custom menu generation failed, using fallback");
      return this.generateFallbackCustomMenu(params, questionnaire);
    }
  }

  private static buildMenuGenerationPrompt(
    params: GenerateMenuParams,
    questionnaire: any,
    nutritionPlan: any
  ): string {
    return `Generate a ${params.days || 7}-day personalized meal plan.

User Profile:
- Age: ${questionnaire.age}
- Weight: ${questionnaire.weight_kg}kg
- Height: ${questionnaire.height_cm}cm
- Goal: ${questionnaire.main_goal}
- Activity Level: ${questionnaire.physical_activity_level}
- Dietary Style: ${questionnaire.dietary_style}
- Allergies: ${questionnaire.allergies?.join(", ") || "None"}
- Dislikes: ${questionnaire.disliked_foods?.join(", ") || "None"}
- Likes: ${questionnaire.liked_foods?.join(", ") || "None"}

Nutrition Targets:
- Daily Calories: ${nutritionPlan?.goal_calories || 2000}
- Daily Protein: ${nutritionPlan?.goal_protein_g || 150}g
- Daily Carbs: ${nutritionPlan?.goal_carbs_g || 250}g
- Daily Fats: ${nutritionPlan?.goal_fats_g || 67}g

Requirements:
- ${this.getMealsPerDayCount(params.mealsPerDay || "3_main")} meals per day
- Budget: ${params.budget ? `₪${params.budget} per day` : "Moderate budget"}
- Prep time: ${questionnaire.daily_cooking_time || "30 minutes"} per day
- Cooking methods: ${
      questionnaire.available_cooking_methods?.join(", ") || "All methods"
    }

Return JSON with this structure:
{
  "title": "Menu title",
  "description": "Menu description",
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "days_count": ${params.days || 7},
  "estimated_cost": number,
  "meals": [
    {
      "name": "Meal name",
      "meal_type": "BREAKFAST/LUNCH/DINNER/SNACK",
      "day_number": 1-7,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "prep_time_minutes": number,
      "cooking_method": "method",
      "instructions": "cooking instructions",
      "ingredients": [
        {
          "name": "ingredient",
          "quantity": number,
          "unit": "g/ml/piece",
          "category": "protein/vegetable/grain"
        }
      ]
    }
  ]
}`;
  }

  private static buildCustomMenuPrompt(
    params: GenerateMenuParams,
    questionnaire: any
  ): string {
    return `Create a custom meal plan based on this request: "${
      params.customRequest
    }"

User Context:
- Dietary Style: ${questionnaire.dietary_style}
- Allergies: ${questionnaire.allergies?.join(", ") || "None"}
- Cooking Preference: ${questionnaire.cooking_preference}
- Budget: ${params.budget ? `₪${params.budget} per day` : "Flexible"}

Plan Requirements:
- Duration: ${params.days || 7} days
- Meals per day: ${this.getMealsPerDayCount(params.mealsPerDay || "3_main")}
- Custom request: ${params.customRequest}

Return the same JSON structure as before with meals that specifically address the custom request.`;
  }

  private static parseAIMenuResponse(aiResponse: string) {
    try {
      // Clean the response
      let cleaned = aiResponse.trim();
      if (cleaned.includes("```json")) {
        cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      }

      // Find JSON boundaries
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(cleaned);

      // Validate structure
      if (!parsed.meals || !Array.isArray(parsed.meals)) {
        throw new Error("Invalid menu structure");
      }

      return parsed;
    } catch (error) {
      console.error("💥 Error parsing AI menu response:", error);
      throw new Error("Failed to parse AI menu response");
    }
  }

  private static generateFallbackMenu(
    params: GenerateMenuParams,
    questionnaire: any
  ) {
    const days = params.days || 7;
    const mealsPerDay = this.getMealsPerDayCount(
      params.mealsPerDay || "3_main"
    );

    const fallbackMeals = [
      {
        name: "Protein Scrambled Eggs",
        meal_type: "BREAKFAST",
        calories: 350,
        protein: 25,
        carbs: 15,
        fat: 20,
        fiber: 3,
        prep_time_minutes: 15,
        cooking_method: "Pan frying",
        instructions:
          "Scramble eggs with vegetables and serve with whole grain toast",
        ingredients: [
          { name: "eggs", quantity: 2, unit: "piece", category: "protein" },
          {
            name: "whole grain bread",
            quantity: 2,
            unit: "slice",
            category: "grain",
          },
          { name: "spinach", quantity: 50, unit: "g", category: "vegetable" },
        ],
      },
      {
        name: "Grilled Chicken Salad",
        meal_type: "LUNCH",
        calories: 450,
        protein: 35,
        carbs: 25,
        fat: 22,
        fiber: 8,
        prep_time_minutes: 25,
        cooking_method: "Grilling",
        instructions:
          "Grill chicken breast and serve over mixed greens with olive oil dressing",
        ingredients: [
          {
            name: "chicken breast",
            quantity: 150,
            unit: "g",
            category: "protein",
          },
          {
            name: "mixed greens",
            quantity: 100,
            unit: "g",
            category: "vegetable",
          },
          { name: "olive oil", quantity: 15, unit: "ml", category: "fat" },
        ],
      },
      {
        name: "Baked Salmon with Quinoa",
        meal_type: "DINNER",
        calories: 500,
        protein: 35,
        carbs: 45,
        fat: 18,
        fiber: 6,
        prep_time_minutes: 30,
        cooking_method: "Baking",
        instructions:
          "Bake salmon with herbs and serve with quinoa and steamed vegetables",
        ingredients: [
          {
            name: "salmon fillet",
            quantity: 150,
            unit: "g",
            category: "protein",
          },
          { name: "quinoa", quantity: 80, unit: "g", category: "grain" },
          { name: "broccoli", quantity: 100, unit: "g", category: "vegetable" },
        ],
      },
    ];

    const meals: any[] = [];

    for (let day = 1; day <= days; day++) {
      fallbackMeals.slice(0, mealsPerDay).forEach((meal, index) => {
        meals.push({
          ...meal,
          day_number: day,
          name: `${meal.name} - Day ${day}`,
        });
      });
    }

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
    const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);

    return {
      title: `Personalized ${days}-Day Menu`,
      description: `Customized meal plan based on your ${questionnaire.main_goal} goal`,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      days_count: days,
      estimated_cost: params.budget || 200,
      meals,
    };
  }

  private static generateFallbackCustomMenu(
    params: GenerateMenuParams,
    questionnaire: any
  ) {
    // Similar to fallback menu but customized based on the request
    const customizedMeals = this.customizeMealsBasedOnRequest(
      params.customRequest || "",
      questionnaire
    );

    return this.generateFallbackMenu(
      { ...params, customRequest: undefined },
      questionnaire
    );
  }

  private static customizeMealsBasedOnRequest(
    request: string,
    questionnaire: any
  ) {
    // Analyze the custom request and adjust meals accordingly
    const lowerRequest = request.toLowerCase();

    if (lowerRequest.includes("protein") || lowerRequest.includes("muscle")) {
      return "high_protein";
    }
    if (lowerRequest.includes("vegetarian") || lowerRequest.includes("plant")) {
      return "vegetarian";
    }
    if (lowerRequest.includes("quick") || lowerRequest.includes("fast")) {
      return "quick_prep";
    }

    return "balanced";
  }

  private static async saveMenuToDatabase(userId: string, menuData: any) {
    try {
      console.log("💾 Saving menu to database...");

      // Create the recommended menu
      const menu = await prisma.recommendedMenu.create({
        data: {
          user_id: userId,
          title: menuData.title,
          description: menuData.description,
          total_calories: menuData.total_calories,
          total_protein: menuData.total_protein,
          total_carbs: menuData.total_carbs,
          total_fat: menuData.total_fat,
          total_fiber: menuData.total_fiber || 0,
          days_count: menuData.days_count,
          dietary_category: menuData.dietary_category || "BALANCED",
          estimated_cost: menuData.estimated_cost,
          prep_time_minutes: menuData.prep_time_minutes || 30,
          difficulty_level: menuData.difficulty_level || 2,
          is_active: true,
        },
      });

      // Save meals
      const mealPromises = menuData.meals.map(async (meal: any) => {
        const savedMeal = await prisma.recommendedMeal.create({
          data: {
            menu_id: menu.menu_id,
            name: meal.name,
            meal_type: meal.meal_type,
            day_number: meal.day_number,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            fiber: meal.fiber || 0,
            prep_time_minutes: meal.prep_time_minutes || 30,
            cooking_method: meal.cooking_method,
            instructions: meal.instructions,
          },
        });

        // Save ingredients
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
          const ingredientPromises = meal.ingredients.map((ingredient: any) =>
            prisma.recommendedIngredient.create({
              data: {
                meal_id: savedMeal.meal_id,
                name: ingredient.name,
                quantity: ingredient.quantity || 1,
                unit: ingredient.unit || "piece",
                category: ingredient.category || "other",
                estimated_cost: ingredient.estimated_cost || 5,
              },
            })
          );

          await Promise.all(ingredientPromises);
        }

        return savedMeal;
      });

      await Promise.all(mealPromises);

      // Return complete menu with meals and ingredients
      const completeMenu = await prisma.recommendedMenu.findUnique({
        where: { menu_id: menu.menu_id },
        include: {
          meals: {
            include: {
              ingredients: true,
            },
            orderBy: [{ day_number: "asc" }, { meal_type: "asc" }],
          },
        },
      });

      console.log("✅ Menu saved to database successfully");
      return completeMenu;
    } catch (error) {
      console.error("💥 Error saving menu to database:", error);
      throw error;
    }
  }

  static async replaceMeal(
    userId: string,
    menuId: string,
    mealId: string,
    preferences: any
  ) {
    try {
      console.log("🔄 Replacing meal in menu:", { menuId, mealId });

      // Get the current meal
      const currentMeal = await prisma.recommendedMeal.findFirst({
        where: {
          meal_id: mealId,
          menu: {
            user_id: userId,
          },
        },
        include: {
          ingredients: true,
        },
      });

      if (!currentMeal) {
        throw new Error("Meal not found");
      }

      // Generate replacement meal
      const replacementMeal = await this.generateReplacementMeal(
        currentMeal,
        preferences,
        userId
      );

      // Update the meal
      const updatedMeal = await prisma.recommendedMeal.update({
        where: { meal_id: mealId },
        data: {
          name: replacementMeal.name,
          calories: replacementMeal.calories,
          protein: replacementMeal.protein,
          carbs: replacementMeal.carbs,
          fat: replacementMeal.fat,
          fiber: replacementMeal.fiber,
          prep_time_minutes: replacementMeal.prep_time_minutes,
          cooking_method: replacementMeal.cooking_method,
          instructions: replacementMeal.instructions,
        },
      });

      // Update ingredients
      await prisma.recommendedIngredient.deleteMany({
        where: { meal_id: mealId },
      });

      if (replacementMeal.ingredients) {
        await prisma.recommendedIngredient.createMany({
          data: replacementMeal.ingredients.map((ing: any) => ({
            meal_id: mealId,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
          })),
        });
      }

      console.log("✅ Meal replaced successfully");
      return updatedMeal;
    } catch (error) {
      console.error("💥 Error replacing meal:", error);
      throw error;
    }
  }

  private static async generateReplacementMeal(
    currentMeal: any,
    preferences: any,
    userId: string
  ) {
    // Get user preferences
    const questionnaire = await prisma.userQuestionnaire.findFirst({
      where: { user_id: userId },
    });

    // Generate alternative meal with similar nutrition profile
    const alternatives = [
      {
        name: "Protein Bowl Alternative",
        calories: currentMeal.calories,
        protein: currentMeal.protein,
        carbs: currentMeal.carbs * 0.9,
        fat: currentMeal.fat * 1.1,
        fiber: (currentMeal.fiber || 5) + 2,
        prep_time_minutes: (currentMeal.prep_time_minutes || 30) - 5,
        cooking_method: "Bowl assembly",
        instructions: "Combine protein, grains, and vegetables in a bowl",
        ingredients: [
          {
            name: "lean protein",
            quantity: 150,
            unit: "g",
            category: "protein",
          },
          { name: "quinoa", quantity: 80, unit: "g", category: "grain" },
          {
            name: "mixed vegetables",
            quantity: 100,
            unit: "g",
            category: "vegetable",
          },
        ],
      },
    ];

    return alternatives[0];
  }

  static async markMealAsFavorite(
    userId: string,
    menuId: string,
    mealId: string,
    isFavorite: boolean
  ) {
    try {
      // Save as user preference
      await prisma.userMealPreference.upsert({
        where: {
          user_id_template_id_preference_type: {
            user_id: userId,
            template_id: mealId,
            preference_type: "favorite",
          },
        },
        update: {
          rating: isFavorite ? 5 : 1,
          notes: isFavorite ? "Marked as favorite" : "Removed from favorites",
        },
        create: {
          user_id: userId,
          template_id: mealId,
          preference_type: "favorite",
          rating: isFavorite ? 5 : 1,
          notes: isFavorite ? "Marked as favorite" : "Removed from favorites",
        },
      });

      console.log("✅ Meal favorite status updated");
    } catch (error) {
      console.error("💥 Error updating meal favorite:", error);
      throw error;
    }
  }

  static async giveMealFeedback(
    userId: string,
    menuId: string,
    mealId: string,
    liked: boolean
  ) {
    try {
      await prisma.userMealPreference.upsert({
        where: {
          user_id_template_id_preference_type: {
            user_id: userId,
            template_id: mealId,
            preference_type: "feedback",
          },
        },
        update: {
          rating: liked ? 4 : 2,
          notes: liked ? "User liked this meal" : "User disliked this meal",
        },
        create: {
          user_id: userId,
          template_id: mealId,
          preference_type: "feedback",
          rating: liked ? 4 : 2,
          notes: liked ? "User liked this meal" : "User disliked this meal",
        },
      });

      console.log("✅ Meal feedback recorded");
    } catch (error) {
      console.error("💥 Error recording meal feedback:", error);
      throw error;
    }
  }

  static async generateShoppingList(userId: string, menuId: string) {
    try {
      console.log("🛒 Generating shopping list for menu:", menuId);

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
        throw new Error("Menu not found");
      }

      // Aggregate ingredients
      const ingredientMap = new Map();

      menu.meals.forEach((meal) => {
        meal.ingredients.forEach((ingredient) => {
          const key = ingredient.name.toLowerCase();
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key);
            existing.quantity += ingredient.quantity;
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              category: ingredient.category,
              estimated_cost: ingredient.estimated_cost || 5,
            });
          }
        });
      });

      const items = Array.from(ingredientMap.values());
      const totalCost = items.reduce(
        (sum, item) => sum + item.estimated_cost,
        0
      );

      return {
        menu_id: menuId,
        items,
        total_estimated_cost: totalCost,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("💥 Error generating shopping list:", error);
      throw error;
    }
  }

  private static getMealsPerDayCount(mealsPerDay: string): number {
    switch (mealsPerDay) {
      case "2_main":
        return 2;
      case "3_main":
        return 3;
      case "3_plus_2_snacks":
        return 5;
      case "2_plus_1_intermediate":
        return 3;
      default:
        return 3;
    }
  }
}

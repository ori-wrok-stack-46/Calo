import OpenAI from "openai";
import { MealAnalysisResult } from "../types/openai";
import { extractCleanJSON, parsePartialJSON } from "../utils/openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export class OpenAIService {
  static async analyzeMealImage(
    imageBase64: string,
    language: string = "english",
    updateText?: string,
    editedIngredients?: any[]
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🤖 Starting OpenAI meal analysis...");
      console.log("🌐 Language:", language);
      console.log("📝 Update text provided:", !!updateText);
      console.log("🥗 Edited ingredients:", editedIngredients?.length || 0);

      if (!openai || !process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI API key, using fallback analysis");
        return this.getFallbackAnalysis(language);
      }

      const isHebrew = language === "hebrew";
      const systemPrompt = this.createAnalysisSystemPrompt(isHebrew);
      const userPrompt = this.createUserPrompt(
        isHebrew,
        updateText,
        editedIngredients
      );

      console.log("🔄 Calling OpenAI API...");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("✅ OpenAI response received");
      console.log("📄 Response preview:", content.substring(0, 200) + "...");

      // Parse the response
      const cleanedJSON = extractCleanJSON(content);
      const analysis = parsePartialJSON(cleanedJSON);

      // Validate and normalize the response
      const normalizedAnalysis = this.normalizeAnalysisResponse(analysis);

      console.log("✅ Analysis completed successfully");
      return normalizedAnalysis;
    } catch (error) {
      console.error("💥 OpenAI analysis error:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          throw new Error("Analysis timeout - please try again with a clearer image");
        }
        if (error.message.includes("rate limit")) {
          throw new Error("Service temporarily busy - please try again in a moment");
        }
      }
      
      throw new Error("Failed to analyze meal image - please try again");
    }
  }

  static async updateMealAnalysis(
    originalMeal: any,
    updateText: string,
    language: string = "english"
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🔄 Updating meal analysis with AI...");

      if (!openai || !process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI API key, using fallback update");
        return this.getFallbackUpdate(originalMeal, updateText, language);
      }

      const isHebrew = language === "hebrew";
      const prompt = this.createUpdatePrompt(originalMeal, updateText, isHebrew);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: isHebrew
              ? "אתה מומחה תזונה המעדכן ניתוח ארוחות. החזר JSON מדויק עם הנתונים המעודכנים."
              : "You are a nutrition expert updating meal analysis. Return precise JSON with updated data.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const cleanedJSON = extractCleanJSON(content);
      const updatedAnalysis = parsePartialJSON(cleanedJSON);

      return this.normalizeAnalysisResponse(updatedAnalysis);
    } catch (error) {
      console.error("💥 Update analysis error:", error);
      return this.getFallbackUpdate(originalMeal, updateText, language);
    }
  }

  static async generateText(prompt: string, maxTokens: number = 1000): Promise<string> {
    try {
      if (!openai || !process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API not available");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("💥 OpenAI text generation error:", error);
      throw error;
    }
  }

  private static createAnalysisSystemPrompt(isHebrew: boolean): string {
    return isHebrew
      ? `אתה מומחה תזונה מקצועי המנתח תמונות של ארוחות. נתח את התמונה והחזר JSON מדויק עם המידע התזונתי.

חובה להחזיר JSON בפורמט הזה:
{
  "name": "שם הארוחה",
  "description": "תיאור קצר",
  "calories": מספר,
  "protein": מספר,
  "carbs": מספר,
  "fat": מספר,
  "fiber": מספר,
  "sugar": מספר,
  "sodium": מספר,
  "confidence": מספר בין 1-100,
  "ingredients": [
    {
      "name": "שם המרכיב",
      "calories": מספר,
      "protein_g": מספר,
      "carbs_g": מספר,
      "fats_g": מספר,
      "fiber_g": מספר,
      "sugar_g": מספר,
      "sodium_mg": מספר
    }
  ],
  "servingSize": "גודל מנה",
  "cookingMethod": "שיטת בישול",
  "healthNotes": "הערות בריאות",
  "recommendations": "המלצות"
}`
      : `You are a professional nutrition expert analyzing meal images. Analyze the image and return precise JSON with nutritional information.

You must return JSON in this exact format:
{
  "name": "Meal name",
  "description": "Brief description",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "confidence": number between 1-100,
  "ingredients": [
    {
      "name": "ingredient name",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fats_g": number,
      "fiber_g": number,
      "sugar_g": number,
      "sodium_mg": number
    }
  ],
  "servingSize": "serving size",
  "cookingMethod": "cooking method",
  "healthNotes": "health notes",
  "recommendations": "recommendations"
}`;
  }

  private static createUserPrompt(
    isHebrew: boolean,
    updateText?: string,
    editedIngredients?: any[]
  ): string {
    let prompt = isHebrew
      ? "נתח את תמונת הארוחה הזו ותן מידע תזונתי מדויק."
      : "Analyze this meal image and provide accurate nutritional information.";

    if (updateText) {
      prompt += isHebrew
        ? `\n\nעדכון מהמשתמש: ${updateText}`
        : `\n\nUser update: ${updateText}`;
    }

    if (editedIngredients && editedIngredients.length > 0) {
      prompt += isHebrew
        ? `\n\nמרכיבים ערוכים: ${JSON.stringify(editedIngredients)}`
        : `\n\nEdited ingredients: ${JSON.stringify(editedIngredients)}`;
    }

    return prompt;
  }

  private static createUpdatePrompt(
    originalMeal: any,
    updateText: string,
    isHebrew: boolean
  ): string {
    const mealData = JSON.stringify(originalMeal, null, 2);
    
    return isHebrew
      ? `עדכן את הניתוח של הארוחה הזו:

נתונים נוכחיים:
${mealData}

בקשת עדכון: ${updateText}

החזר JSON מעודכן עם אותו פורמט.`
      : `Update the analysis of this meal:

Current data:
${mealData}

Update request: ${updateText}

Return updated JSON with the same format.`;
  }

  private static normalizeAnalysisResponse(analysis: any): MealAnalysisResult {
    return {
      name: analysis.name || "Unknown Meal",
      description: analysis.description || "",
      calories: Number(analysis.calories) || 0,
      protein: Number(analysis.protein) || 0,
      carbs: Number(analysis.carbs) || 0,
      fat: Number(analysis.fat) || 0,
      fiber: Number(analysis.fiber) || 0,
      sugar: Number(analysis.sugar) || 0,
      sodium: Number(analysis.sodium) || 0,
      confidence: Number(analysis.confidence) || 75,
      ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients : [],
      servingSize: analysis.servingSize || "1 serving",
      cookingMethod: analysis.cookingMethod || "Unknown",
      healthNotes: analysis.healthNotes || "",
      recommendations: analysis.recommendations || "Meal analyzed successfully",
      
      // Additional fields for compatibility
      saturated_fats_g: Number(analysis.saturated_fats_g) || undefined,
      polyunsaturated_fats_g: Number(analysis.polyunsaturated_fats_g) || undefined,
      monounsaturated_fats_g: Number(analysis.monounsaturated_fats_g) || undefined,
      omega_3_g: Number(analysis.omega_3_g) || undefined,
      omega_6_g: Number(analysis.omega_6_g) || undefined,
      soluble_fiber_g: Number(analysis.soluble_fiber_g) || undefined,
      insoluble_fiber_g: Number(analysis.insoluble_fiber_g) || undefined,
      cholesterol_mg: Number(analysis.cholesterol_mg) || undefined,
      alcohol_g: Number(analysis.alcohol_g) || undefined,
      caffeine_mg: Number(analysis.caffeine_mg) || undefined,
      liquids_ml: Number(analysis.liquids_ml) || undefined,
      serving_size_g: Number(analysis.serving_size_g) || undefined,
      allergens_json: analysis.allergens_json || {},
      vitamins_json: analysis.vitamins_json || {},
      micronutrients_json: analysis.micronutrients_json || {},
      additives_json: analysis.additives_json || {},
      glycemic_index: Number(analysis.glycemic_index) || undefined,
      insulin_index: Number(analysis.insulin_index) || undefined,
      food_category: analysis.food_category || "",
      processing_level: analysis.processing_level || "",
      cooking_method: analysis.cooking_method || analysis.cookingMethod || "",
      health_risk_notes: analysis.health_risk_notes || analysis.healthNotes || "",
    };
  }

  private static getFallbackAnalysis(language: string): MealAnalysisResult {
    const isHebrew = language === "hebrew";
    
    return {
      name: isHebrew ? "ארוחה מנותחת" : "Analyzed Meal",
      description: isHebrew ? "ארוחה שנותחה ללא AI" : "Meal analyzed without AI",
      calories: 400,
      protein: 20,
      carbs: 45,
      fat: 15,
      fiber: 5,
      sugar: 10,
      sodium: 500,
      confidence: 50,
      ingredients: [
        {
          name: isHebrew ? "מרכיבים מעורבים" : "Mixed ingredients",
          calories: 400,
          protein_g: 20,
          carbs_g: 45,
          fats_g: 15,
          fiber_g: 5,
          sugar_g: 10,
          sodium_mg: 500,
          protein: 20,
          carbs: 45,
          fat: 15,
          cholesterol_mg: 0,
          saturated_fats_g: 0,
          polyunsaturated_fats_g: 0,
          monounsaturated_fats_g: 0,
          omega_3_g: 0,
          omega_6_g: 0,
          soluble_fiber_g: 0,
          insoluble_fiber_g: 0,
          alcohol_g: 0,
          caffeine_mg: 0,
          serving_size_g: 0,
          glycemic_index: null,
          insulin_index: null,
          vitamins_json: {},
          micronutrients_json: {},
          allergens_json: {},
        },
      ],
      servingSize: isHebrew ? "מנה אחת" : "1 serving",
      cookingMethod: isHebrew ? "לא ידוע" : "Unknown",
      healthNotes: isHebrew
        ? "ניתוח בסיסי ללא AI. הוסף מפתח OpenAI לניתוח מדויק יותר."
        : "Basic analysis without AI. Add OpenAI key for more accurate analysis.",
      recommendations: isHebrew
        ? "המלצות כלליות: שתה מים, אכל ירקות, שמור על איזון."
        : "General recommendations: drink water, eat vegetables, maintain balance.",
    };
  }

  private static getFallbackUpdate(
    originalMeal: any,
    updateText: string,
    language: string
  ): MealAnalysisResult {
    const isHebrew = language === "hebrew";
    
    return {
      ...originalMeal,
      name: originalMeal.name + (isHebrew ? " (מעודכן)" : " (Updated)"),
      healthNotes: isHebrew
        ? `עודכן: ${updateText}. ניתוח מלא זמין עם מפתח OpenAI.`
        : `Updated: ${updateText}. Full analysis available with OpenAI key.`,
      recommendations: isHebrew
        ? "עדכון בוצע בהצלחה"
        : "Update completed successfully",
    };
  }
}

export { openai };
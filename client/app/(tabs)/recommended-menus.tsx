import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { api } from "../../src/services/api";

const { width: screenWidth } = Dimensions.get("window");

interface MealType {
  id: string;
  name: string;
  nameHebrew: string;
  icon: string;
  description: string;
  descriptionHebrew: string;
  examples: string[];
  examplesHebrew: string[];
}

interface CustomMenuOptions {
  mealTypes: string[];
  dietaryStyle: string;
  cookingStyle: string;
  prepTime: string;
  servingSize: string;
  spiceLevel: string;
  ingredients: string[];
  avoidIngredients: string[];
  days: string;
  budget: string;
}

interface Meal {
  meal_id: string;
  name: string;
  name_english?: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  prep_time_minutes?: number;
  cooking_method?: string;
  instructions?: string[];
  instructions_english?: string[];
  ingredients?: any[];
  day_number?: number;
}

interface RecommendedMenu {
  menu_id: string;
  title: string;
  description?: string;
  total_calories: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  days_count: number;
  estimated_cost?: number;
  meals: Meal[];
  created_at: string;
}

const MEAL_TYPES: MealType[] = [
  {
    id: "mediterranean",
    name: "Mediterranean",
    nameHebrew: "ים תיכוני",
    icon: "fish-outline",
    description: "Fresh vegetables, olive oil, fish, and whole grains",
    descriptionHebrew: "ירקות טריים, שמן זית, דגים ודגנים מלאים",
    examples: ["Greek salad", "Grilled fish", "Hummus"],
    examplesHebrew: ["סלט יווני", "דג צלוי", "חומוס"],
  },
  {
    id: "high_protein",
    name: "High Protein",
    nameHebrew: "עשיר בחלבון",
    icon: "fitness-outline",
    description: "Lean meats, eggs, dairy, and legumes for muscle building",
    descriptionHebrew: "בשר רזה, ביצים, מוצרי חלב וקטניות לבניית שריר",
    examples: ["Chicken breast", "Protein shake", "Greek yogurt"],
    examplesHebrew: ["חזה עוף", "שייק חלבון", "יוגורט יווני"],
  },
  {
    id: "low_carb",
    name: "Low Carb",
    nameHebrew: "דל פחמימות",
    icon: "leaf-outline",
    description: "Minimal carbs, focus on proteins and healthy fats",
    descriptionHebrew: "מינימום פחמימות, דגש על חלבונים ושומנים בריאים",
    examples: ["Cauliflower rice", "Zucchini noodles", "Avocado salad"],
    examplesHebrew: ["אורז כרובית", "נודלס קישואים", "סלט אבוקדו"],
  },
  {
    id: "vegetarian",
    name: "Vegetarian",
    nameHebrew: "צמחוני",
    icon: "leaf",
    description: "Plant-based with dairy and eggs",
    descriptionHebrew: "מבוסס צמחים עם מוצרי חלב וביצים",
    examples: ["Veggie burger", "Pasta primavera", "Caprese salad"],
    examplesHebrew: ["המבורגר צמחוני", "פסטה פרימוורה", "סלט קפרזה"],
  },
  {
    id: "vegan",
    name: "Vegan",
    nameHebrew: "טבעוני",
    icon: "flower-outline",
    description: "100% plant-based, no animal products",
    descriptionHebrew: "100% צמחי, ללא מוצרים מן החי",
    examples: ["Buddha bowl", "Lentil curry", "Quinoa salad"],
    examplesHebrew: ["קערת בודהה", "קארי עדשים", "סלט קינואה"],
  },
  {
    id: "keto",
    name: "Ketogenic",
    nameHebrew: "קטוגני",
    icon: "nutrition-outline",
    description: "Very low carb, high fat for ketosis",
    descriptionHebrew: "מעט מאוד פחמימות, הרבה שומן לקטוזיס",
    examples: ["Bacon and eggs", "Avocado bomb", "Cheese crisps"],
    examplesHebrew: ["בייקון וביצים", "פצצת אבוקדו", "צ'יפס גבינה"],
  },
  {
    id: "asian_fusion",
    name: "Asian Fusion",
    nameHebrew: "אסייתי פיוז'ן",
    icon: "restaurant-outline",
    description: "Japanese, Chinese, Thai, and Korean inspired dishes",
    descriptionHebrew: "מנות בהשראה יפנית, סינית, תאילנדית וקוריאנית",
    examples: ["Sushi bowl", "Pad thai", "Korean BBQ"],
    examplesHebrew: ["קערת סושי", "פאד תאי", "בשר קוריאני"],
  },
  {
    id: "comfort_food",
    name: "Comfort Food",
    nameHebrew: "אוכל נחמה",
    icon: "heart-outline",
    description: "Hearty, satisfying meals for emotional eating",
    descriptionHebrew: "ארוחות מספקות ומחממות לאכילה רגשית",
    examples: ["Mac and cheese", "Chicken soup", "Meatloaf"],
    examplesHebrew: ["מקרוני וגבינה", "מרק עוף", "קציצת בשר"],
  },
  {
    id: "healthy_fast",
    name: "Healthy & Fast",
    nameHebrew: "בריא ומהיר",
    icon: "time-outline",
    description: "Nutritious meals ready in 15 minutes or less",
    descriptionHebrew: "ארוחות מזינות מוכנות תוך 15 דקות או פחות",
    examples: ["Smoothie bowl", "Quick salad", "Protein wrap"],
    examplesHebrew: ["קערת סמוצ'י", "סלט מהיר", "ראפ חלבון"],
  },
  {
    id: "budget_friendly",
    name: "Budget Friendly",
    nameHebrew: "חסכוני",
    icon: "card-outline",
    description: "Delicious meals on a tight budget",
    descriptionHebrew: "ארוחות טעימות בתקציב מוגבל",
    examples: ["Rice and beans", "Pasta with marinara", "Egg fried rice"],
    examplesHebrew: ["אורז ושעועית", "פסטה עם מרינרה", "אורז מטוגן עם ביצה"],
  },
];

const DIETARY_STYLES = [
  { id: "balanced", name: "Balanced", nameHebrew: "מאוזן" },
  { id: "weight_loss", name: "Weight Loss", nameHebrew: "הרזיה" },
  { id: "muscle_gain", name: "Muscle Gain", nameHebrew: "בניית שריר" },
  {
    id: "athletic",
    name: "Athletic Performance",
    nameHebrew: "ביצועים אתלטיים",
  },
  { id: "heart_healthy", name: "Heart Healthy", nameHebrew: "בריא ללב" },
  { id: "diabetic", name: "Diabetic Friendly", nameHebrew: "מתאים לסוכרתיים" },
];

const COOKING_STYLES = [
  { id: "quick", name: "Quick & Easy", nameHebrew: "מהיר וקל" },
  { id: "gourmet", name: "Gourmet", nameHebrew: "גורמה" },
  { id: "one_pot", name: "One Pot Meals", nameHebrew: "ארוחות בסיר אחד" },
  { id: "meal_prep", name: "Meal Prep", nameHebrew: "הכנה מראש" },
  { id: "no_cook", name: "No Cooking", nameHebrew: "ללא בישול" },
  { id: "grilled", name: "Grilled", nameHebrew: "על האש" },
];

const PREP_TIMES = [
  { id: "15", name: "15 minutes", nameHebrew: "15 דקות" },
  { id: "30", name: "30 minutes", nameHebrew: "30 דקות" },
  { id: "45", name: "45 minutes", nameHebrew: "45 דקות" },
  { id: "60", name: "1 hour", nameHebrew: "שעה" },
  { id: "any", name: "Any time", nameHebrew: "כל משך זמן" },
];

const SERVING_SIZES = [
  { id: "1", name: "1 person", nameHebrew: "אדם אחד" },
  { id: "2", name: "2 people", nameHebrew: "2 אנשים" },
  { id: "4", name: "4 people", nameHebrew: "4 אנשים" },
  { id: "family", name: "Family (6+)", nameHebrew: "משפחה (6+)" },
];

const SPICE_LEVELS = [
  { id: "mild", name: "Mild", nameHebrew: "עדין" },
  { id: "medium", name: "Medium", nameHebrew: "בינוני" },
  { id: "hot", name: "Hot", nameHebrew: "חריף" },
  { id: "very_hot", name: "Very Hot", nameHebrew: "חריף מאוד" },
];

const COMMON_INGREDIENTS = [
  { id: "chicken", name: "Chicken", nameHebrew: "עוף" },
  { id: "beef", name: "Beef", nameHebrew: "בקר" },
  { id: "fish", name: "Fish", nameHebrew: "דג" },
  { id: "salmon", name: "Salmon", nameHebrew: "סלמון" },
  { id: "eggs", name: "Eggs", nameHebrew: "ביצים" },
  { id: "rice", name: "Rice", nameHebrew: "אורז" },
  { id: "pasta", name: "Pasta", nameHebrew: "פסטה" },
  { id: "quinoa", name: "Quinoa", nameHebrew: "קינואה" },
  { id: "avocado", name: "Avocado", nameHebrew: "אבוקדו" },
  { id: "spinach", name: "Spinach", nameHebrew: "תרד" },
  { id: "tomatoes", name: "Tomatoes", nameHebrew: "עגבניות" },
  { id: "broccoli", name: "Broccoli", nameHebrew: "ברוקולי" },
  { id: "sweet_potato", name: "Sweet Potato", nameHebrew: "בטטה" },
  { id: "tofu", name: "Tofu", nameHebrew: "טופו" },
  { id: "lentils", name: "Lentils", nameHebrew: "עדשים" },
  { id: "chickpeas", name: "Chickpeas", nameHebrew: "חומוס גרגרי" },
  { id: "cheese", name: "Cheese", nameHebrew: "גבינה" },
  { id: "yogurt", name: "Yogurt", nameHebrew: "יוגורט" },
  { id: "nuts", name: "Nuts", nameHebrew: "אגוזים" },
  { id: "olive_oil", name: "Olive Oil", nameHebrew: "שמן זית" },
];

const CUISINES = [
  { id: "mediterranean", name: "Mediterranean", nameHebrew: "ים תיכוני" },
  { id: "middle_eastern", name: "Middle Eastern", nameHebrew: "מזרח תיכוני" },
  { id: "asian", name: "Asian", nameHebrew: "אסייתי" },
  { id: "italian", name: "Italian", nameHebrew: "איטלקי" },
  { id: "mexican", name: "Mexican", nameHebrew: "מקסיקני" },
  { id: "indian", name: "Indian", nameHebrew: "הודי" },
  { id: "french", name: "French", nameHebrew: "צרפתי" },
  { id: "american", name: "American", nameHebrew: "אמריקאי" },
  { id: "israeli", name: "Israeli", nameHebrew: "ישראלי" },
  { id: "fusion", name: "Fusion", nameHebrew: "פיוז'ן" },
];

const HEALTH_GOALS = [
  { id: "weight_loss", name: "Weight Loss", nameHebrew: "הרזיה" },
  { id: "muscle_gain", name: "Muscle Gain", nameHebrew: "בניית שריר" },
  { id: "maintenance", name: "Maintenance", nameHebrew: "שמירה" },
  { id: "energy_boost", name: "Energy Boost", nameHebrew: "חיזוק אנרגיה" },
  { id: "heart_health", name: "Heart Health", nameHebrew: "בריאות הלב" },
  {
    id: "digestive_health",
    name: "Digestive Health",
    nameHebrew: "בריאות העיכול",
  },
  { id: "immune_boost", name: "Immune Boost", nameHebrew: "חיזוק חיסוני" },
  { id: "balanced", name: "Balanced", nameHebrew: "מאוזן" },
];

const ALLERGIES = [
  { id: "gluten", name: "Gluten", nameHebrew: "גלוטן" },
  { id: "dairy", name: "Dairy", nameHebrew: "חלב" },
  { id: "nuts", name: "Nuts", nameHebrew: "אגוזים" },
  { id: "shellfish", name: "Shellfish", nameHebrew: "פירות ים" },
  { id: "eggs", name: "Eggs", nameHebrew: "ביצים" },
  { id: "soy", name: "Soy", nameHebrew: "סויה" },
  { id: "sesame", name: "Sesame", nameHebrew: "שומשום" },
  { id: "fish", name: "Fish", nameHebrew: "דגים" },
];

const SPECIAL_DIETS = [
  { id: "none", name: "None", nameHebrew: "רגיל" },
  { id: "keto", name: "Ketogenic", nameHebrew: "קטוגני" },
  { id: "paleo", name: "Paleo", nameHebrew: "פליאו" },
  { id: "vegan", name: "Vegan", nameHebrew: "טבעוני" },
  { id: "vegetarian", name: "Vegetarian", nameHebrew: "צמחוני" },
  { id: "low_carb", name: "Low Carb", nameHebrew: "דל פחמימות" },
  { id: "high_protein", name: "High Protein", nameHebrew: "עשיר חלבון" },
  {
    id: "intermittent_fasting",
    name: "Intermittent Fasting",
    nameHebrew: "צום לסירוגין",
  },
];

const COOKING_METHODS = [
  { id: "mixed", name: "Mixed Methods", nameHebrew: "שיטות מעורבות" },
  { id: "grilling", name: "Grilling", nameHebrew: "צלייה" },
  { id: "baking", name: "Baking", nameHebrew: "אפייה" },
  { id: "steaming", name: "Steaming", nameHebrew: "קיטור" },
  { id: "stir_fry", name: "Stir Fry", nameHebrew: "מוקפץ" },
  { id: "raw", name: "Raw/No Cooking", nameHebrew: "ללא בישול" },
  { id: "slow_cooking", name: "Slow Cooking", nameHebrew: "בישול איטי" },
  { id: "pressure_cooking", name: "Pressure Cooking", nameHebrew: "סיר לחץ" },
];

const NUTRITION_FOCUS = [
  { id: "balanced", name: "Balanced", nameHebrew: "מאוזן" },
  { id: "high_protein", name: "High Protein", nameHebrew: "עשיר חלבון" },
  { id: "low_carb", name: "Low Carb", nameHebrew: "דל פחמימות" },
  { id: "high_fiber", name: "High Fiber", nameHebrew: "עשיר סיבים" },
  {
    id: "antioxidant_rich",
    name: "Antioxidant Rich",
    nameHebrew: "עשיר נוגדי חמצון",
  },
  { id: "omega_3", name: "Omega-3 Rich", nameHebrew: "עשיר אומגה 3" },
  { id: "iron_rich", name: "Iron Rich", nameHebrew: "עשיר ברזל" },
  { id: "calcium_rich", name: "Calcium Rich", nameHebrew: "עשיר סידן" },
];

export default function RecommendedMenusScreen() {
  const [menus, setMenus] = useState<RecommendedMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customOptions, setCustomOptions] = useState<CustomMenuOptions>({
    mealTypes: [],
    dietaryStyle: "balanced",
    cookingStyle: "quick",
    prepTime: "30",
    servingSize: "2",
    spiceLevel: "mild",
    ingredients: [],
    avoidIngredients: [],
    days: "7",
    budget: "",
  });

  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedRequest, setAdvancedRequest] = useState({
    mealName: "",
    description: "",
    cuisine: "mediterranean",
    healthGoal: "balanced",
    allergyFree: [],
    specialDiet: "none",
    cookingMethod: "mixed",
    difficulty: "medium",
    prepTime: "30",
    servingSize: "2",
    budget: "200",
    includeSnacks: false,
    mealTiming: "standard",
    nutritionFocus: "balanced",
    ingredients: {
      mustInclude: [],
      preferInclude: [],
      mustAvoid: [],
      preferAvoid: [],
    },
    customNotes: "",
  });

  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "he";

  useEffect(() => {
    loadMenus();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadMenus = async () => {
    try {
      console.log("🔄 Loading recommended menus...");
      const response = await api.get("/recommended-menus");

      if (response.data.success && response.data.data) {
        setMenus(response.data.data);
      } else {
        setMenus([]);
      }
    } catch (error: any) {
      console.error("💥 Load menus error:", error);
      Alert.alert(
        isRTL ? "שגיאה" : "Error",
        isRTL ? "לא ניתן לטעון את התפריטים" : "Failed to load recommended menus"
      );
      setMenus([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadMenus();
  };

  const generateNewMenu = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post("/recommended-menus/generate", {
        days: 7,
        mealsPerDay: "3_main",
        mealChangeFrequency: "daily",
        includeLeftovers: false,
        sameMealTimes: true,
      });

      if (response.data.success) {
        await loadMenus();
        Alert.alert(
          isRTL ? "הצלחה" : "Success",
          isRTL ? "תפריט חדש נוצר בהצלחה!" : "New menu generated successfully!"
        );
      } else {
        throw new Error(response.data.error || "Failed to generate menu");
      }
    } catch (error: any) {
      console.error("💥 Generate menu error:", error);
      Alert.alert(
        isRTL ? "שגיאה" : "Error",
        error.response?.data?.error ||
          error.message ||
          (isRTL ? "לא ניתן ליצור תפריט" : "Failed to generate menu")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCustomMenu = async () => {
    if (customOptions.mealTypes.length === 0) {
      Alert.alert(
        isRTL ? "שגיאה" : "Error",
        isRTL
          ? "אנא בחר לפחות סוג ארוחה אחד"
          : "Please select at least one meal type"
      );
      return;
    }

    setIsGenerating(true);
    setShowCustomModal(false);

    try {
      const customRequest = buildCustomRequest();

      const response = await api.post("/recommended-menus/generate-custom", {
        days: parseInt(customOptions.days) || 7,
        mealsPerDay: "3_main",
        customRequest: customRequest,
        budget: customOptions.budget
          ? parseFloat(customOptions.budget)
          : undefined,
        mealChangeFrequency: "daily",
        includeLeftovers: false,
        sameMealTimes: true,
      });

      if (response.data.success) {
        await loadMenus();
        Alert.alert(
          isRTL ? "הצלחה" : "Success",
          isRTL
            ? "התפריט המותאם שלך נוצר!"
            : "Your custom menu has been generated!"
        );
        resetCustomOptions();
      } else {
        throw new Error(
          response.data.error || "Failed to generate custom menu"
        );
      }
    } catch (error: any) {
      console.error("💥 Generate custom menu error:", error);
      Alert.alert(
        isRTL ? "שגיאה" : "Error",
        error.response?.data?.error ||
          error.message ||
          (isRTL
            ? "לא ניתן ליצור תפריט מותאם"
            : "Failed to generate custom menu")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAdvancedMenu = async () => {
    if (!advancedRequest.mealName.trim()) {
      Alert.alert(
        isRTL ? "שגיאה" : "Error",
        isRTL ? "אנא הזן שם לארוחה" : "Please enter a meal name"
      );
      return;
    }

    setIsGenerating(true);
    setShowAdvancedModal(false);

    try {
      const advancedCustomRequest = buildAdvancedRequest();

      const response = await api.post("/recommended-menus/generate-custom", {
        days: 7,
        mealsPerDay: "3_main",
        customRequest: advancedCustomRequest,
        budget: parseFloat(advancedRequest.budget) || 200,
        mealChangeFrequency: "daily",
        includeLeftovers: false,
        sameMealTimes: true,
      });

      if (response.data.success) {
        await loadMenus();
        Alert.alert(
          isRTL ? "הצלחה" : "Success",
          isRTL
            ? "התפריט המתקדם שלך נוצר!"
            : "Your advanced menu has been generated!"
        );
        resetAdvancedRequest();
      } else {
        throw new Error(
          response.data.error || "Failed to generate advanced menu"
        );
      }
    } catch (error: any) {
      console.error("💥 Generate advanced menu error:", error);
      Alert.alert(
        isRTL ? "שגיאה" : "Error",
        error.response?.data?.error ||
          error.message ||
          (isRTL
            ? "לא ניתן ליצור תפריט מתקדם"
            : "Failed to generate advanced menu")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const buildCustomRequest = (): string => {
    const selectedMealTypes = customOptions.mealTypes
      .map((id) => {
        const mealType = MEAL_TYPES.find((mt) => mt.id === id);
        return isRTL ? mealType?.nameHebrew : mealType?.name;
      })
      .join(", ");

    const dietaryStyle = DIETARY_STYLES.find(
      (ds) => ds.id === customOptions.dietaryStyle
    );
    const cookingStyle = COOKING_STYLES.find(
      (cs) => cs.id === customOptions.cookingStyle
    );
    const prepTime = PREP_TIMES.find((pt) => pt.id === customOptions.prepTime);
    const servingSize = SERVING_SIZES.find(
      (ss) => ss.id === customOptions.servingSize
    );
    const spiceLevel = SPICE_LEVELS.find(
      (sl) => sl.id === customOptions.spiceLevel
    );

    const ingredients = customOptions.ingredients
      .map((id) => {
        const ingredient = COMMON_INGREDIENTS.find((ing) => ing.id === id);
        return isRTL ? ingredient?.nameHebrew : ingredient?.name;
      })
      .join(", ");

    const avoidIngredients = customOptions.avoidIngredients
      .map((id) => {
        const ingredient = COMMON_INGREDIENTS.find((ing) => ing.id === id);
        return isRTL ? ingredient?.nameHebrew : ingredient?.name;
      })
      .join(", ");

    let request = `Create ${selectedMealTypes} style meals with ${
      isRTL ? dietaryStyle?.nameHebrew : dietaryStyle?.name
    } approach. `;
    request += `Cooking style: ${
      isRTL ? cookingStyle?.nameHebrew : cookingStyle?.name
    }. `;
    request += `Prep time: maximum ${
      isRTL ? prepTime?.nameHebrew : prepTime?.name
    }. `;
    request += `Serving size: ${
      isRTL ? servingSize?.nameHebrew : servingSize?.name
    }. `;
    request += `Spice level: ${
      isRTL ? spiceLevel?.nameHebrew : spiceLevel?.name
    }. `;

    if (ingredients) {
      request += `Include these ingredients: ${ingredients}. `;
    }

    if (avoidIngredients) {
      request += `Avoid these ingredients: ${avoidIngredients}. `;
    }

    return request;
  };

  const buildAdvancedRequest = (): string => {
    const cuisine = CUISINES.find((c) => c.id === advancedRequest.cuisine);
    const healthGoal = HEALTH_GOALS.find(
      (hg) => hg.id === advancedRequest.healthGoal
    );
    const specialDiet = SPECIAL_DIETS.find(
      (sd) => sd.id === advancedRequest.specialDiet
    );
    const cookingMethod = COOKING_METHODS.find(
      (cm) => cm.id === advancedRequest.cookingMethod
    );
    const nutritionFocus = NUTRITION_FOCUS.find(
      (nf) => nf.id === advancedRequest.nutritionFocus
    );

    const allergyFreeList = advancedRequest.allergyFree
      .map((id) => {
        const allergy = ALLERGIES.find((a) => a.id === id);
        return isRTL ? allergy?.nameHebrew : allergy?.name;
      })
      .join(", ");

    const mustIncludeIngredients = advancedRequest.ingredients.mustInclude
      .map((id) => {
        const ingredient = COMMON_INGREDIENTS.find((ing) => ing.id === id);
        return isRTL ? ingredient?.nameHebrew : ingredient?.name;
      })
      .join(", ");

    const mustAvoidIngredients = advancedRequest.ingredients.mustAvoid
      .map((id) => {
        const ingredient = COMMON_INGREDIENTS.find((ing) => ing.id === id);
        return isRTL ? ingredient?.nameHebrew : ingredient?.name;
      })
      .join(", ");

    let request = `Create a ${
      advancedRequest.mealName
    } inspired meal plan with ${
      isRTL ? cuisine?.nameHebrew : cuisine?.name
    } cuisine style. `;
    request += `Health goal: ${
      isRTL ? healthGoal?.nameHebrew : healthGoal?.name
    }. `;

    if (advancedRequest.description) {
      request += `Description: ${advancedRequest.description}. `;
    }

    if (advancedRequest.specialDiet !== "none") {
      request += `Special diet: ${
        isRTL ? specialDiet?.nameHebrew : specialDiet?.name
      }. `;
    }

    request += `Cooking method preference: ${
      isRTL ? cookingMethod?.nameHebrew : cookingMethod?.name
    }. `;
    request += `Difficulty level: ${advancedRequest.difficulty}. `;
    request += `Prep time: maximum ${advancedRequest.prepTime} minutes. `;
    request += `Serving size: ${advancedRequest.servingSize} people. `;
    request += `Nutrition focus: ${
      isRTL ? nutritionFocus?.nameHebrew : nutritionFocus?.name
    }. `;

    if (allergyFreeList) {
      request += `Must be free from: ${allergyFreeList}. `;
    }

    if (mustIncludeIngredients) {
      request += `Must include these ingredients: ${mustIncludeIngredients}. `;
    }

    if (mustAvoidIngredients) {
      request += `Avoid these ingredients: ${mustAvoidIngredients}. `;
    }

    if (advancedRequest.includeSnacks) {
      request += `Include healthy snacks. `;
    }

    if (advancedRequest.customNotes) {
      request += `Additional notes: ${advancedRequest.customNotes}. `;
    }

    return request;
  };

  const resetCustomOptions = () => {
    setCustomOptions({
      mealTypes: [],
      dietaryStyle: "balanced",
      cookingStyle: "quick",
      prepTime: "30",
      servingSize: "2",
      spiceLevel: "mild",
      ingredients: [],
      avoidIngredients: [],
      days: "7",
      budget: "",
    });
  };

  const resetAdvancedRequest = () => {
    setAdvancedRequest({
      mealName: "",
      description: "",
      cuisine: "mediterranean",
      healthGoal: "balanced",
      allergyFree: [],
      specialDiet: "none",
      cookingMethod: "mixed",
      difficulty: "medium",
      prepTime: "30",
      servingSize: "2",
      budget: "200",
      includeSnacks: false,
      mealTiming: "standard",
      nutritionFocus: "balanced",
      ingredients: {
        mustInclude: [],
        preferInclude: [],
        mustAvoid: [],
        preferAvoid: [],
      },
      customNotes: "",
    });
  };

  const toggleMealType = (mealTypeId: string) => {
    setCustomOptions((prev) => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealTypeId)
        ? prev.mealTypes.filter((id) => id !== mealTypeId)
        : [...prev.mealTypes, mealTypeId],
    }));
  };

  const toggleIngredient = (ingredientId: string, isAvoid: boolean = false) => {
    const field = isAvoid ? "avoidIngredients" : "ingredients";
    setCustomOptions((prev) => ({
      ...prev,
      [field]: prev[field].includes(ingredientId)
        ? prev[field].filter((id) => id !== ingredientId)
        : [...prev[field], ingredientId],
    }));
  };

  const startMenu = async (menuId: string) => {
    try {
      const response = await api.post(
        `/recommended-menus/${menuId}/start-today`
      );

      if (response.data.success) {
        Alert.alert(
          isRTL ? "הצלחה" : "Success",
          isRTL ? "התפריט התחיל היום!" : "Menu started for today!"
        );
        await loadMenus();
      } else {
        throw new Error(response.data.error || "Failed to start menu");
      }
    } catch (error: any) {
      console.error("💥 Start menu error:", error);
      Alert.alert(
        isRTL ? "שגיאה" : "Error",
        error.response?.data?.error ||
          error.message ||
          (isRTL ? "לא ניתן להתחיל תפריט" : "Failed to start menu")
      );
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case "breakfast":
        return "sunny-outline";
      case "lunch":
        return "restaurant-outline";
      case "dinner":
        return "moon-outline";
      case "snack":
        return "cafe-outline";
      default:
        return "nutrition-outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderMealTypeSelector = () => (
    <View style={styles.selectorSection}>
      <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {isRTL ? "בחר סוגי ארוחות" : "Select Meal Types"}
      </Text>
      <View style={styles.mealTypesGrid}>
        {MEAL_TYPES.map((mealType) => (
          <TouchableOpacity
            key={mealType.id}
            style={[
              styles.mealTypeCard,
              customOptions.mealTypes.includes(mealType.id) &&
                styles.selectedMealType,
            ]}
            onPress={() => toggleMealType(mealType.id)}
          >
            <BlurView intensity={60} style={styles.mealTypeBlur}>
              <LinearGradient
                colors={
                  customOptions.mealTypes.includes(mealType.id)
                    ? ["#10b981", "#059669"]
                    : ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.5)"]
                }
                style={styles.mealTypeGradient}
              >
                <Ionicons
                  name={mealType.icon as any}
                  size={24}
                  color={
                    customOptions.mealTypes.includes(mealType.id)
                      ? "#ffffff"
                      : "#10b981"
                  }
                />
                <Text
                  style={[
                    styles.mealTypeName,
                    customOptions.mealTypes.includes(mealType.id) &&
                      styles.selectedMealTypeName,
                    isRTL && styles.rtlText,
                  ]}
                >
                  {isRTL ? mealType.nameHebrew : mealType.name}
                </Text>
                <Text
                  style={[
                    styles.mealTypeDescription,
                    customOptions.mealTypes.includes(mealType.id) &&
                      styles.selectedMealTypeDescription,
                    isRTL && styles.rtlText,
                  ]}
                >
                  {isRTL ? mealType.descriptionHebrew : mealType.description}
                </Text>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDropdownSelector = (
    title: string,
    options: any[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.dropdownSection}>
      <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.optionsScrollView}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionChip,
              selectedValue === option.id && styles.selectedOptionChip,
            ]}
            onPress={() => onSelect(option.id)}
          >
            <BlurView intensity={40} style={styles.optionChipBlur}>
              <LinearGradient
                colors={
                  selectedValue === option.id
                    ? ["#10b981", "#059669"]
                    : ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.5)"]
                }
                style={styles.optionChipGradient}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    selectedValue === option.id &&
                      styles.selectedOptionChipText,
                    isRTL && styles.rtlText,
                  ]}
                >
                  {isRTL ? option.nameHebrew : option.name}
                </Text>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderIngredientSelector = (
    title: string,
    isAvoid: boolean = false
  ) => (
    <View style={styles.selectorSection}>
      <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {title}
      </Text>
      <View style={styles.ingredientsGrid}>
        {COMMON_INGREDIENTS.map((ingredient) => {
          const isSelected = isAvoid
            ? customOptions.avoidIngredients.includes(ingredient.id)
            : customOptions.ingredients.includes(ingredient.id);

          return (
            <TouchableOpacity
              key={ingredient.id}
              style={[
                styles.ingredientChip,
                isSelected &&
                  (isAvoid
                    ? styles.avoidIngredientChip
                    : styles.selectedIngredientChip),
              ]}
              onPress={() => toggleIngredient(ingredient.id, isAvoid)}
            >
              <BlurView intensity={40} style={styles.ingredientChipBlur}>
                <LinearGradient
                  colors={
                    isSelected
                      ? isAvoid
                        ? ["#ef4444", "#dc2626"]
                        : ["#10b981", "#059669"]
                      : ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.5)"]
                  }
                  style={styles.ingredientChipGradient}
                >
                  <Text
                    style={[
                      styles.ingredientChipText,
                      isSelected && styles.selectedIngredientChipText,
                      isRTL && styles.rtlText,
                    ]}
                  >
                    {isRTL ? ingredient.nameHebrew : ingredient.name}
                  </Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <BlurView intensity={80} style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={[styles.loadingText, isRTL && styles.rtlText]}>
                {isRTL ? "טוען את התפריטים שלך..." : "Loading your menus..."}
              </Text>
            </BlurView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <BlurView intensity={100} style={styles.header}>
            <LinearGradient
              colors={["rgba(16, 185, 129, 0.15)", "rgba(5, 150, 105, 0.08)"]}
              style={styles.headerGradient}
            >
              <View style={[styles.headerContent, isRTL && styles.rtlRow]}>
                <View style={[styles.headerLeft, isRTL && styles.rtlRow]}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="restaurant" size={28} color="#10b981" />
                  </View>
                  <View style={isRTL ? styles.rtlHeaderText : undefined}>
                    <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
                      {isRTL ? "תפריטים מומלצים" : "Recommended Menus"}
                    </Text>
                    <Text
                      style={[styles.headerSubtitle, isRTL && styles.rtlText]}
                    >
                      {isRTL
                        ? `${menus.length} תפריטים זמינים`
                        : `${menus.length} menu${
                            menus.length !== 1 ? "s" : ""
                          } available`}
                    </Text>
                  </View>
                </View>

                <View style={[styles.headerButtons, isRTL && styles.rtlRow]}>
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={() => setShowAdvancedModal(true)}
                    disabled={isGenerating}
                  >
                    <BlurView intensity={60} style={styles.generateButtonBlur}>
                      <LinearGradient
                        colors={[
                          "rgba(16, 185, 129, 0.2)",
                          "rgba(5, 150, 105, 0.1)",
                        ]}
                        style={styles.generateButtonGradient}
                      >
                        <Ionicons name="options" size={20} color="#10b981" />
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={() => setShowCustomModal(true)}
                    disabled={isGenerating}
                  >
                    <BlurView intensity={60} style={styles.generateButtonBlur}>
                      <LinearGradient
                        colors={[
                          "rgba(16, 185, 129, 0.2)",
                          "rgba(5, 150, 105, 0.1)",
                        ]}
                        style={styles.generateButtonGradient}
                      >
                        <Ionicons name="create" size={20} color="#10b981" />
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={generateNewMenu}
                    disabled={isGenerating}
                  >
                    <BlurView intensity={60} style={styles.generateButtonBlur}>
                      <LinearGradient
                        colors={[
                          "rgba(16, 185, 129, 0.2)",
                          "rgba(5, 150, 105, 0.1)",
                        ]}
                        style={styles.generateButtonGradient}
                      >
                        {isGenerating ? (
                          <ActivityIndicator size="small" color="#10b981" />
                        ) : (
                          <Ionicons
                            name="add-circle"
                            size={20}
                            color="#10b981"
                          />
                        )}
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={["#10b981"]}
                tintColor="#10b981"
              />
            }
          >
            {menus.length === 0 ? (
              <View style={styles.emptyState}>
                <BlurView intensity={80} style={styles.emptyCard}>
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0.9)",
                      "rgba(255, 255, 255, 0.6)",
                    ]}
                    style={styles.emptyCardGradient}
                  >
                    <Ionicons
                      name="restaurant-outline"
                      size={64}
                      color="#94a3b8"
                    />
                    <Text style={[styles.emptyTitle, isRTL && styles.rtlText]}>
                      {isRTL ? "עדיין אין תפריטים" : "No Menus Yet"}
                    </Text>
                    <Text
                      style={[styles.emptyDescription, isRTL && styles.rtlText]}
                    >
                      {isRTL
                        ? "צור את התפריט המותאם הראשון שלך כדי להתחיל"
                        : "Generate your first personalized menu to get started"}
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={() => setShowCustomModal(true)}
                      disabled={isGenerating}
                    >
                      <BlurView intensity={60} style={styles.emptyButtonBlur}>
                        <LinearGradient
                          colors={["#10b981", "#059669"]}
                          style={styles.emptyButtonGradient}
                        >
                          <Text style={styles.emptyButtonText}>
                            {isRTL ? "צור תפריט מותאם" : "Create Custom Menu"}
                          </Text>
                        </LinearGradient>
                      </BlurView>
                    </TouchableOpacity>
                  </LinearGradient>
                </BlurView>
              </View>
            ) : (
              <View style={styles.menusList}>
                {menus.map((menu, index) => (
                  <Animated.View
                    key={menu.menu_id}
                    style={[
                      styles.menuCard,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 50],
                              outputRange: [0, 50 + index * 10],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <BlurView intensity={80} style={styles.menuCardBlur}>
                      <LinearGradient
                        colors={[
                          "rgba(255, 255, 255, 0.95)",
                          "rgba(255, 255, 255, 0.7)",
                        ]}
                        style={styles.menuCardGradient}
                      >
                        {/* Menu Header */}
                        <View
                          style={[styles.menuHeader, isRTL && styles.rtlRow]}
                        >
                          <View
                            style={[
                              styles.menuHeaderLeft,
                              isRTL && styles.rtlRow,
                            ]}
                          >
                            <View style={styles.menuIconContainer}>
                              <LinearGradient
                                colors={["#10b981", "#059669"]}
                                style={styles.menuIconGradient}
                              >
                                <Ionicons
                                  name="nutrition"
                                  size={24}
                                  color="#ffffff"
                                />
                              </LinearGradient>
                            </View>
                            <View
                              style={[
                                styles.menuHeaderText,
                                isRTL && styles.rtlHeaderText,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.menuTitle,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {menu.title}
                              </Text>
                              <Text
                                style={[
                                  styles.menuDate,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL
                                  ? `נוצר ${formatDate(menu.created_at)}`
                                  : `Created ${formatDate(menu.created_at)}`}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[styles.menuStats, isRTL && styles.rtlStats]}
                          >
                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>
                                {menu.days_count}
                              </Text>
                              <Text
                                style={[
                                  styles.statLabel,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL ? "ימים" : "Days"}
                              </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>
                                {menu.meals.length}
                              </Text>
                              <Text
                                style={[
                                  styles.statLabel,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL ? "ארוחות" : "Meals"}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Menu Description */}
                        {menu.description && (
                          <Text
                            style={[
                              styles.menuDescription,
                              isRTL && styles.rtlText,
                            ]}
                          >
                            {menu.description}
                          </Text>
                        )}

                        {/* Nutrition Summary */}
                        <View style={styles.nutritionSummary}>
                          <Text
                            style={[
                              styles.sectionTitle,
                              isRTL && styles.rtlText,
                            ]}
                          >
                            {isRTL ? "סיכום תזונתי" : "Nutrition Overview"}
                          </Text>
                          <BlurView intensity={40} style={styles.nutritionCard}>
                            <LinearGradient
                              colors={[
                                "rgba(16, 185, 129, 0.1)",
                                "rgba(5, 150, 105, 0.05)",
                              ]}
                              style={styles.nutritionCardGradient}
                            >
                              <View style={styles.nutritionGrid}>
                                <View style={styles.nutritionItem}>
                                  <View style={styles.nutritionIconContainer}>
                                    <Ionicons
                                      name="flame"
                                      size={18}
                                      color="#f59e0b"
                                    />
                                  </View>
                                  <Text style={styles.nutritionValue}>
                                    {menu.total_calories}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.nutritionLabel,
                                      isRTL && styles.rtlText,
                                    ]}
                                  >
                                    {isRTL ? "קלוריות" : "calories"}
                                  </Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <View style={styles.nutritionIconContainer}>
                                    <Ionicons
                                      name="fitness"
                                      size={18}
                                      color="#ef4444"
                                    />
                                  </View>
                                  <Text style={styles.nutritionValue}>
                                    {menu.total_protein || 0}g
                                  </Text>
                                  <Text
                                    style={[
                                      styles.nutritionLabel,
                                      isRTL && styles.rtlText,
                                    ]}
                                  >
                                    {isRTL ? "חלבון" : "protein"}
                                  </Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <View style={styles.nutritionIconContainer}>
                                    <Ionicons
                                      name="leaf"
                                      size={18}
                                      color="#22c55e"
                                    />
                                  </View>
                                  <Text style={styles.nutritionValue}>
                                    {menu.total_carbs || 0}g
                                  </Text>
                                  <Text
                                    style={[
                                      styles.nutritionLabel,
                                      isRTL && styles.rtlText,
                                    ]}
                                  >
                                    {isRTL ? "פחמימות" : "carbs"}
                                  </Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <View style={styles.nutritionIconContainer}>
                                    <Ionicons
                                      name="water"
                                      size={18}
                                      color="#3b82f6"
                                    />
                                  </View>
                                  <Text style={styles.nutritionValue}>
                                    {menu.total_fat || 0}g
                                  </Text>
                                  <Text
                                    style={[
                                      styles.nutritionLabel,
                                      isRTL && styles.rtlText,
                                    ]}
                                  >
                                    {isRTL ? "שומן" : "fat"}
                                  </Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </BlurView>
                        </View>

                        {/* Sample Meals Preview */}
                        <View style={styles.mealsPreview}>
                          <Text
                            style={[
                              styles.mealsPreviewTitle,
                              isRTL && styles.rtlText,
                            ]}
                          >
                            {isRTL ? "ארוחות לדוגמה" : "Sample Meals"}
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.mealsScrollView}
                            contentContainerStyle={
                              isRTL && styles.rtlScrollContent
                            }
                          >
                            {menu.meals.slice(0, 5).map((meal, mealIndex) => (
                              <View
                                key={meal.meal_id}
                                style={styles.mealPreviewCard}
                              >
                                <BlurView
                                  intensity={60}
                                  style={styles.mealPreviewBlur}
                                >
                                  <LinearGradient
                                    colors={[
                                      "rgba(255, 255, 255, 0.85)",
                                      "rgba(255, 255, 255, 0.6)",
                                    ]}
                                    style={styles.mealPreviewGradient}
                                  >
                                    <View style={styles.mealPreviewIcon}>
                                      <Ionicons
                                        name={getMealTypeIcon(meal.meal_type)}
                                        size={20}
                                        color="#10b981"
                                      />
                                    </View>
                                    <Text
                                      style={[
                                        styles.mealPreviewName,
                                        isRTL && styles.rtlText,
                                      ]}
                                    >
                                      {meal.name}
                                    </Text>
                                    <Text style={styles.mealPreviewCalories}>
                                      {meal.calories}{" "}
                                      {isRTL ? "קלוריות" : "cal"}
                                    </Text>
                                  </LinearGradient>
                                </BlurView>
                              </View>
                            ))}
                          </ScrollView>
                        </View>

                        {/* Cost Estimate */}
                        {menu.estimated_cost && (
                          <View style={styles.costContainer}>
                            <BlurView intensity={40} style={styles.costCard}>
                              <LinearGradient
                                colors={[
                                  "rgba(59, 130, 246, 0.1)",
                                  "rgba(29, 78, 216, 0.05)",
                                ]}
                                style={styles.costCardGradient}
                              >
                                <Ionicons
                                  name="card"
                                  size={16}
                                  color="#3b82f6"
                                />
                                <Text
                                  style={[
                                    styles.costText,
                                    isRTL && styles.rtlText,
                                  ]}
                                >
                                  {isRTL
                                    ? `עלות משוערת: ₪${menu.estimated_cost.toFixed(
                                        0
                                      )}`
                                    : `Estimated cost: ₪${menu.estimated_cost.toFixed(
                                        0
                                      )}`}
                                </Text>
                              </LinearGradient>
                            </BlurView>
                          </View>
                        )}

                        {/* Action Buttons */}
                        <View
                          style={[
                            styles.actionButtons,
                            isRTL && styles.rtlActionButtons,
                          ]}
                        >
                          <TouchableOpacity
                            style={[styles.actionButton, styles.viewButton]}
                            onPress={() => {
                              router.push(`/menu/${menu.menu_id}`);
                            }}
                          >
                            <BlurView
                              intensity={60}
                              style={styles.actionButtonBlur}
                            >
                              <LinearGradient
                                colors={[
                                  "rgba(71, 85, 105, 0.2)",
                                  "rgba(51, 65, 85, 0.1)",
                                ]}
                                style={styles.actionButtonGradient}
                              >
                                <Ionicons
                                  name="eye-outline"
                                  size={18}
                                  color="#475569"
                                />
                                <Text
                                  style={[
                                    styles.viewButtonText,
                                    isRTL && styles.rtlText,
                                  ]}
                                >
                                  {isRTL ? "הצג פרטים" : "View Details"}
                                </Text>
                              </LinearGradient>
                            </BlurView>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionButton, styles.startButton]}
                            onPress={() => startMenu(menu.menu_id)}
                          >
                            <BlurView
                              intensity={60}
                              style={styles.actionButtonBlur}
                            >
                              <LinearGradient
                                colors={["#10b981", "#059669"]}
                                style={styles.actionButtonGradient}
                              >
                                <Ionicons
                                  name="play"
                                  size={18}
                                  color="#ffffff"
                                />
                                <Text
                                  style={[
                                    styles.startButtonText,
                                    isRTL && styles.rtlText,
                                  ]}
                                >
                                  {isRTL ? "התחל היום" : "Start Today"}
                                </Text>
                              </LinearGradient>
                            </BlurView>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </BlurView>
                  </Animated.View>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Custom Menu Modal */}
        <Modal
          visible={showCustomModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCustomModal(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={100} style={styles.modalContent}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.98)",
                  "rgba(255, 255, 255, 0.9)",
                ]}
                style={styles.modalGradient}
              >
                <View style={[styles.modalHeader, isRTL && styles.rtlRow]}>
                  <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>
                    {isRTL ? "צור תפריט מותאם" : "Create Custom Menu"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCustomModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Meal Types Selector */}
                  {renderMealTypeSelector()}

                  {/* Dietary Style */}
                  {renderDropdownSelector(
                    isRTL ? "סגנון תזונה" : "Dietary Style",
                    DIETARY_STYLES,
                    customOptions.dietaryStyle,
                    (value) =>
                      setCustomOptions((prev) => ({
                        ...prev,
                        dietaryStyle: value,
                      }))
                  )}

                  {/* Cooking Style */}
                  {renderDropdownSelector(
                    isRTL ? "סגנון בישול" : "Cooking Style",
                    COOKING_STYLES,
                    customOptions.cookingStyle,
                    (value) =>
                      setCustomOptions((prev) => ({
                        ...prev,
                        cookingStyle: value,
                      }))
                  )}

                  {/* Prep Time */}
                  {renderDropdownSelector(
                    isRTL ? "זמן הכנה מקסימלי" : "Maximum Prep Time",
                    PREP_TIMES,
                    customOptions.prepTime,
                    (value) =>
                      setCustomOptions((prev) => ({ ...prev, prepTime: value }))
                  )}

                  {/* Serving Size */}
                  {renderDropdownSelector(
                    isRTL ? "גודל מנה" : "Serving Size",
                    SERVING_SIZES,
                    customOptions.servingSize,
                    (value) =>
                      setCustomOptions((prev) => ({
                        ...prev,
                        servingSize: value,
                      }))
                  )}

                  {/* Spice Level */}
                  {renderDropdownSelector(
                    isRTL ? "רמת חריפות" : "Spice Level",
                    SPICE_LEVELS,
                    customOptions.spiceLevel,
                    (value) =>
                      setCustomOptions((prev) => ({
                        ...prev,
                        spiceLevel: value,
                      }))
                  )}

                  {/* Preferred Ingredients */}
                  {renderIngredientSelector(
                    isRTL ? "מרכיבים מועדפים" : "Preferred Ingredients"
                  )}

                  {/* Ingredients to Avoid */}
                  {renderIngredientSelector(
                    isRTL ? "מרכיבים להימנע מהם" : "Ingredients to Avoid",
                    true
                  )}

                  {/* Days and Budget */}
                  <View style={[styles.inputRow, isRTL && styles.rtlRow]}>
                    <View style={styles.inputHalf}>
                      <Text
                        style={[styles.inputLabel, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "מספר ימים" : "Number of Days"}
                      </Text>
                      <View style={styles.daysContainer}>
                        {["3", "7", "14"].map((day) => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayChip,
                              customOptions.days === day &&
                                styles.selectedDayChip,
                            ]}
                            onPress={() =>
                              setCustomOptions((prev) => ({
                                ...prev,
                                days: day,
                              }))
                            }
                          >
                            <Text
                              style={[
                                styles.dayChipText,
                                customOptions.days === day &&
                                  styles.selectedDayChipText,
                                isRTL && styles.rtlText,
                              ]}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.inputHalf}>
                      <Text
                        style={[styles.inputLabel, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "תקציב יומי (₪)" : "Daily Budget (₪)"}
                      </Text>
                      <View style={styles.budgetContainer}>
                        {["150", "200", "300"].map((budget) => (
                          <TouchableOpacity
                            key={budget}
                            style={[
                              styles.budgetChip,
                              customOptions.budget === budget &&
                                styles.selectedBudgetChip,
                            ]}
                            onPress={() =>
                              setCustomOptions((prev) => ({ ...prev, budget }))
                            }
                          >
                            <Text
                              style={[
                                styles.budgetChipText,
                                customOptions.budget === budget &&
                                  styles.selectedBudgetChipText,
                                isRTL && styles.rtlText,
                              ]}
                            >
                              ₪{budget}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.generateCustomButton}
                    onPress={generateCustomMenu}
                    disabled={customOptions.mealTypes.length === 0}
                  >
                    <BlurView
                      intensity={60}
                      style={styles.generateCustomButtonBlur}
                    >
                      <LinearGradient
                        colors={
                          customOptions.mealTypes.length === 0
                            ? ["#94a3b8", "#64748b"]
                            : ["#10b981", "#059669"]
                        }
                        style={styles.generateCustomButtonGradient}
                      >
                        <Ionicons name="restaurant" size={20} color="#ffffff" />
                        <Text
                          style={[
                            styles.generateCustomButtonText,
                            isRTL && styles.rtlText,
                          ]}
                        >
                          {isRTL
                            ? "צור את התפריט המותאם שלי"
                            : "Generate My Custom Menu"}
                        </Text>
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </BlurView>
          </View>
        </Modal>

        {/* Advanced Custom Menu Modal */}
        <Modal
          visible={showAdvancedModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAdvancedModal(false)}
        >
          <View style={styles.advancedModalOverlay}>
            <Animated.View
              style={[
                styles.advancedModalContent,
                { transform: [{ translateY: 0 }] },
              ]}
            >
              <BlurView intensity={100} style={styles.advancedModalBlur}>
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.98)",
                    "rgba(240, 253, 244, 0.95)",
                  ]}
                  style={styles.advancedModalGradient}
                >
                  {/* Modal Header */}
                  <View
                    style={[styles.advancedModalHeader, isRTL && styles.rtlRow]}
                  >
                    <Text
                      style={[
                        styles.advancedModalTitle,
                        isRTL && styles.rtlText,
                      ]}
                    >
                      {isRTL
                        ? "תפריט מתקדם מותאם אישית"
                        : "Advanced Custom Menu"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAdvancedModal(false)}
                      style={styles.advancedCloseButton}
                    >
                      <Ionicons name="close" size={24} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.advancedModalBody}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Meal Name Input */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "שם הארוחה" : "Meal Name"}
                      </Text>
                      <View style={styles.advancedTextInput}>
                        <TextInput
                          style={[
                            styles.advancedTextInputField,
                            isRTL && styles.rtlText,
                          ]}
                          placeholder={
                            isRTL ? "הזן שם לארוחה..." : "Enter meal name..."
                          }
                          value={advancedRequest.mealName}
                          onChangeText={(text) =>
                            setAdvancedRequest((prev) => ({
                              ...prev,
                              mealName: text,
                            }))
                          }
                          placeholderTextColor="rgba(16, 185, 129, 0.5)"
                        />
                      </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "תיאור (אופציונלי)" : "Description (Optional)"}
                      </Text>
                      <View style={styles.advancedTextInput}>
                        <TextInput
                          style={[
                            styles.advancedTextInputField,
                            { height: 80 },
                            isRTL && styles.rtlText,
                          ]}
                          placeholder={
                            isRTL
                              ? "תאר את הארוחה הרצויה..."
                              : "Describe your desired meal..."
                          }
                          value={advancedRequest.description}
                          onChangeText={(text) =>
                            setAdvancedRequest((prev) => ({
                              ...prev,
                              description: text,
                            }))
                          }
                          multiline
                          textAlignVertical="top"
                          placeholderTextColor="rgba(16, 185, 129, 0.5)"
                        />
                      </View>
                    </View>

                    {/* Cuisine Selection */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "סגנון מטבח" : "Cuisine Style"}
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.advancedOptionsScrollView}
                      >
                        {CUISINES.map((cuisine) => (
                          <TouchableOpacity
                            key={cuisine.id}
                            style={[
                              styles.advancedOptionChip,
                              advancedRequest.cuisine === cuisine.id &&
                                styles.selectedAdvancedOptionChip,
                            ]}
                            onPress={() =>
                              setAdvancedRequest((prev) => ({
                                ...prev,
                                cuisine: cuisine.id,
                              }))
                            }
                          >
                            <BlurView
                              intensity={40}
                              style={styles.advancedOptionChipBlur}
                            >
                              <LinearGradient
                                colors={
                                  advancedRequest.cuisine === cuisine.id
                                    ? ["#10b981", "#059669"]
                                    : [
                                        "rgba(255, 255, 255, 0.9)",
                                        "rgba(255, 255, 255, 0.7)",
                                      ]
                                }
                                style={styles.advancedOptionChipGradient}
                              >
                                <Text
                                  style={[
                                    styles.advancedOptionChipText,
                                    advancedRequest.cuisine === cuisine.id &&
                                      styles.selectedAdvancedOptionChipText,
                                    isRTL && styles.rtlText,
                                  ]}
                                >
                                  {isRTL ? cuisine.nameHebrew : cuisine.name}
                                </Text>
                              </LinearGradient>
                            </BlurView>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Health Goal */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "מטרה בריאותית" : "Health Goal"}
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.advancedOptionsScrollView}
                      >
                        {HEALTH_GOALS.map((goal) => (
                          <TouchableOpacity
                            key={goal.id}
                            style={[
                              styles.advancedOptionChip,
                              advancedRequest.healthGoal === goal.id &&
                                styles.selectedAdvancedOptionChip,
                            ]}
                            onPress={() =>
                              setAdvancedRequest((prev) => ({
                                ...prev,
                                healthGoal: goal.id,
                              }))
                            }
                          >
                            <BlurView
                              intensity={40}
                              style={styles.advancedOptionChipBlur}
                            >
                              <LinearGradient
                                colors={
                                  advancedRequest.healthGoal === goal.id
                                    ? ["#10b981", "#059669"]
                                    : [
                                        "rgba(255, 255, 255, 0.9)",
                                        "rgba(255, 255, 255, 0.7)",
                                      ]
                                }
                                style={styles.advancedOptionChipGradient}
                              >
                                <Text
                                  style={[
                                    styles.advancedOptionChipText,
                                    advancedRequest.healthGoal === goal.id &&
                                      styles.selectedAdvancedOptionChipText,
                                    isRTL && styles.rtlText,
                                  ]}
                                >
                                  {isRTL ? goal.nameHebrew : goal.name}
                                </Text>
                              </LinearGradient>
                            </BlurView>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Allergy Free */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "ללא אלרגנים" : "Allergy Free"}
                      </Text>
                      <View style={styles.advancedIngredientsGrid}>
                        {ALLERGIES.map((allergy) => {
                          const isSelected =
                            advancedRequest.allergyFree.includes(allergy.id);
                          return (
                            <TouchableOpacity
                              key={allergy.id}
                              style={[
                                styles.advancedIngredientChip,
                                isSelected &&
                                  styles.selectedAdvancedIngredientChip,
                              ]}
                              onPress={() => {
                                setAdvancedRequest((prev) => ({
                                  ...prev,
                                  allergyFree: isSelected
                                    ? prev.allergyFree.filter(
                                        (id) => id !== allergy.id
                                      )
                                    : [...prev.allergyFree, allergy.id],
                                }));
                              }}
                            >
                              <BlurView
                                intensity={40}
                                style={styles.advancedIngredientChipBlur}
                              >
                                <LinearGradient
                                  colors={
                                    isSelected
                                      ? ["#ef4444", "#dc2626"]
                                      : [
                                          "rgba(255, 255, 255, 0.9)",
                                          "rgba(255, 255, 255, 0.7)",
                                        ]
                                  }
                                  style={styles.advancedIngredientChipGradient}
                                >
                                  <Text
                                    style={[
                                      styles.advancedIngredientChipText,
                                      isSelected &&
                                        styles.selectedAdvancedIngredientChipText,
                                      isRTL && styles.rtlText,
                                    ]}
                                  >
                                    {isRTL ? allergy.nameHebrew : allergy.name}
                                  </Text>
                                </LinearGradient>
                              </BlurView>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Special Diet */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "דיאטה מיוחדת" : "Special Diet"}
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.advancedOptionsScrollView}
                      >
                        {SPECIAL_DIETS.map((diet) => (
                          <TouchableOpacity
                            key={diet.id}
                            style={[
                              styles.advancedOptionChip,
                              advancedRequest.specialDiet === diet.id &&
                                styles.selectedAdvancedOptionChip,
                            ]}
                            onPress={() =>
                              setAdvancedRequest((prev) => ({
                                ...prev,
                                specialDiet: diet.id,
                              }))
                            }
                          >
                            <BlurView
                              intensity={40}
                              style={styles.advancedOptionChipBlur}
                            >
                              <LinearGradient
                                colors={
                                  advancedRequest.specialDiet === diet.id
                                    ? ["#10b981", "#059669"]
                                    : [
                                        "rgba(255, 255, 255, 0.9)",
                                        "rgba(255, 255, 255, 0.7)",
                                      ]
                                }
                                style={styles.advancedOptionChipGradient}
                              >
                                <Text
                                  style={[
                                    styles.advancedOptionChipText,
                                    advancedRequest.specialDiet === diet.id &&
                                      styles.selectedAdvancedOptionChipText,
                                    isRTL && styles.rtlText,
                                  ]}
                                >
                                  {isRTL ? diet.nameHebrew : diet.name}
                                </Text>
                              </LinearGradient>
                            </BlurView>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Must Include Ingredients */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "מרכיבים חובה" : "Must Include Ingredients"}
                      </Text>
                      <View style={styles.advancedIngredientsGrid}>
                        {COMMON_INGREDIENTS.map((ingredient) => {
                          const isSelected =
                            advancedRequest.ingredients.mustInclude.includes(
                              ingredient.id
                            );
                          return (
                            <TouchableOpacity
                              key={ingredient.id}
                              style={[
                                styles.advancedIngredientChip,
                                isSelected &&
                                  styles.selectedAdvancedIngredientChip,
                              ]}
                              onPress={() => {
                                setAdvancedRequest((prev) => ({
                                  ...prev,
                                  ingredients: {
                                    ...prev.ingredients,
                                    mustInclude: isSelected
                                      ? prev.ingredients.mustInclude.filter(
                                          (id) => id !== ingredient.id
                                        )
                                      : [
                                          ...prev.ingredients.mustInclude,
                                          ingredient.id,
                                        ],
                                  },
                                }));
                              }}
                            >
                              <BlurView
                                intensity={40}
                                style={styles.advancedIngredientChipBlur}
                              >
                                <LinearGradient
                                  colors={
                                    isSelected
                                      ? ["#10b981", "#059669"]
                                      : [
                                          "rgba(255, 255, 255, 0.9)",
                                          "rgba(255, 255, 255, 0.7)",
                                        ]
                                  }
                                  style={styles.advancedIngredientChipGradient}
                                >
                                  <Text
                                    style={[
                                      styles.advancedIngredientChipText,
                                      isSelected &&
                                        styles.selectedAdvancedIngredientChipText,
                                      isRTL && styles.rtlText,
                                    ]}
                                  >
                                    {isRTL
                                      ? ingredient.nameHebrew
                                      : ingredient.name}
                                  </Text>
                                </LinearGradient>
                              </BlurView>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Must Avoid Ingredients */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "מרכיבים לא רצויים" : "Must Avoid Ingredients"}
                      </Text>
                      <View style={styles.advancedIngredientsGrid}>
                        {COMMON_INGREDIENTS.map((ingredient) => {
                          const isSelected =
                            advancedRequest.ingredients.mustAvoid.includes(
                              ingredient.id
                            );
                          return (
                            <TouchableOpacity
                              key={ingredient.id}
                              style={[
                                styles.advancedIngredientChip,
                                isSelected &&
                                  styles.avoidAdvancedIngredientChip,
                              ]}
                              onPress={() => {
                                setAdvancedRequest((prev) => ({
                                  ...prev,
                                  ingredients: {
                                    ...prev.ingredients,
                                    mustAvoid: isSelected
                                      ? prev.ingredients.mustAvoid.filter(
                                          (id) => id !== ingredient.id
                                        )
                                      : [
                                          ...prev.ingredients.mustAvoid,
                                          ingredient.id,
                                        ],
                                  },
                                }));
                              }}
                            >
                              <BlurView
                                intensity={40}
                                style={styles.advancedIngredientChipBlur}
                              >
                                <LinearGradient
                                  colors={
                                    isSelected
                                      ? ["#ef4444", "#dc2626"]
                                      : [
                                          "rgba(255, 255, 255, 0.9)",
                                          "rgba(255, 255, 255, 0.7)",
                                        ]
                                  }
                                  style={styles.advancedIngredientChipGradient}
                                >
                                  <Text
                                    style={[
                                      styles.advancedIngredientChipText,
                                      isSelected &&
                                        styles.selectedAdvancedIngredientChipText,
                                      isRTL && styles.rtlText,
                                    ]}
                                  >
                                    {isRTL
                                      ? ingredient.nameHebrew
                                      : ingredient.name}
                                  </Text>
                                </LinearGradient>
                              </BlurView>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Settings Row */}
                    <View
                      style={[
                        styles.advancedSettingsRow,
                        isRTL && styles.rtlRow,
                      ]}
                    >
                      <View style={styles.advancedSettingItem}>
                        <Text
                          style={[
                            styles.advancedSettingLabel,
                            isRTL && styles.rtlText,
                          ]}
                        >
                          {isRTL ? "זמן הכנה (דק')" : "Prep Time (min)"}
                        </Text>
                        <View style={styles.advancedTimeSelector}>
                          {["15", "30", "45", "60"].map((time) => (
                            <TouchableOpacity
                              key={time}
                              style={[
                                styles.advancedTimeChip,
                                advancedRequest.prepTime === time &&
                                  styles.selectedAdvancedTimeChip,
                              ]}
                              onPress={() =>
                                setAdvancedRequest((prev) => ({
                                  ...prev,
                                  prepTime: time,
                                }))
                              }
                            >
                              <Text
                                style={[
                                  styles.advancedTimeChipText,
                                  advancedRequest.prepTime === time &&
                                    styles.selectedAdvancedTimeChipText,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.advancedSettingItem}>
                        <Text
                          style={[
                            styles.advancedSettingLabel,
                            isRTL && styles.rtlText,
                          ]}
                        >
                          {isRTL ? "מנות" : "Servings"}
                        </Text>
                        <View style={styles.advancedServingSelector}>
                          {["1", "2", "4", "6"].map((serving) => (
                            <TouchableOpacity
                              key={serving}
                              style={[
                                styles.advancedServingChip,
                                advancedRequest.servingSize === serving &&
                                  styles.selectedAdvancedServingChip,
                              ]}
                              onPress={() =>
                                setAdvancedRequest((prev) => ({
                                  ...prev,
                                  servingSize: serving,
                                }))
                              }
                            >
                              <Text
                                style={[
                                  styles.advancedServingChipText,
                                  advancedRequest.servingSize === serving &&
                                    styles.selectedAdvancedServingChipText,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {serving}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    {/* Budget Input */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "תקציב יומי (₪)" : "Daily Budget (₪)"}
                      </Text>
                      <View style={styles.advancedBudgetSelector}>
                        {["150", "200", "300", "500"].map((budget) => (
                          <TouchableOpacity
                            key={budget}
                            style={[
                              styles.advancedBudgetChip,
                              advancedRequest.budget === budget &&
                                styles.selectedAdvancedBudgetChip,
                            ]}
                            onPress={() =>
                              setAdvancedRequest((prev) => ({
                                ...prev,
                                budget,
                              }))
                            }
                          >
                            <Text
                              style={[
                                styles.advancedBudgetChipText,
                                advancedRequest.budget === budget &&
                                  styles.selectedAdvancedBudgetChipText,
                                isRTL && styles.rtlText,
                              ]}
                            >
                              ₪{budget}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Include Snacks Toggle */}
                    <View
                      style={[
                        styles.advancedToggleSection,
                        isRTL && styles.rtlRow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.advancedToggleLabel,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL
                          ? "כלול חטיפים בריאים"
                          : "Include Healthy Snacks"}
                      </Text>
                      <Switch
                        value={advancedRequest.includeSnacks}
                        onValueChange={(value) =>
                          setAdvancedRequest((prev) => ({
                            ...prev,
                            includeSnacks: value,
                          }))
                        }
                        trackColor={{ false: "#767577", true: "#10b981" }}
                        thumbColor={
                          advancedRequest.includeSnacks ? "#ffffff" : "#f4f3f4"
                        }
                      />
                    </View>

                    {/* Custom Notes */}
                    <View style={styles.advancedInputSection}>
                      <Text
                        style={[
                          styles.advancedSectionTitle,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? "הערות נוספות" : "Additional Notes"}
                      </Text>
                      <View style={styles.advancedTextInput}>
                        <TextInput
                          style={[
                            styles.advancedTextInputField,
                            { height: 100 },
                            isRTL && styles.rtlText,
                          ]}
                          placeholder={
                            isRTL
                              ? "הערות מיוחדות או העדפות נוספות..."
                              : "Special notes or additional preferences..."
                          }
                          value={advancedRequest.customNotes}
                          onChangeText={(text) =>
                            setAdvancedRequest((prev) => ({
                              ...prev,
                              customNotes: text,
                            }))
                          }
                          multiline
                          textAlignVertical="top"
                          placeholderTextColor="rgba(16, 185, 129, 0.5)"
                        />
                      </View>
                    </View>

                    {/* Generate Button */}
                    <TouchableOpacity
                      style={styles.advancedGenerateButton}
                      onPress={generateAdvancedMenu}
                      disabled={!advancedRequest.mealName.trim()}
                    >
                      <BlurView
                        intensity={60}
                        style={styles.advancedGenerateButtonBlur}
                      >
                        <LinearGradient
                          colors={
                            !advancedRequest.mealName.trim()
                              ? ["#94a3b8", "#64748b"]
                              : ["#10b981", "#059669"]
                          }
                          style={styles.advancedGenerateButtonGradient}
                        >
                          <Ionicons name="sparkles" size={20} color="#ffffff" />
                          <Text
                            style={[
                              styles.advancedGenerateButtonText,
                              isRTL && styles.rtlText,
                            ]}
                          >
                            {isRTL
                              ? "צור תפריט מתקדם"
                              : "Generate Advanced Menu"}
                          </Text>
                        </LinearGradient>
                      </BlurView>
                    </TouchableOpacity>
                  </ScrollView>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
  rtlHeaderText: {
    alignItems: "flex-end",
  },
  rtlStats: {
    flexDirection: "row-reverse",
  },
  rtlActionButtons: {
    flexDirection: "row-reverse",
  },
  rtlScrollContent: {
    flexDirection: "row-reverse",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.3)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: "#064e3b",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  header: {
    margin: 20,
    marginBottom: 20,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.25)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  headerGradient: {
    padding: 28,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 3,
    borderColor: "rgba(16, 185, 129, 0.4)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#064e3b",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#059669",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  generateButton: {
    borderRadius: 18,
    overflow: "hidden",
  },
  generateButtonBlur: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  generateButtonGradient: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  emptyCardGradient: {
    padding: 48,
    alignItems: "center",
    minWidth: screenWidth - 80,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#064e3b",
    marginTop: 24,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#059669",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 36,
    fontWeight: "500",
  },
  emptyButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  emptyButtonBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  emptyButtonGradient: {
    paddingHorizontal: 36,
    paddingVertical: 18,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  menusList: {
    paddingBottom: 32,
  },
  menuCard: {
    marginBottom: 28,
    borderRadius: 36,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 25,
    transform: [{ scale: 1 }],
  },
  menuCardBlur: {
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  menuCardGradient: {
    padding: 32,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  menuHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 20,
  },
  menuIconGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  menuHeaderText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#064e3b",
    marginBottom: 6,
  },
  menuDate: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  menuStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10b981",
  },
  statLabel: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(16, 185, 129, 0.3)",
    marginHorizontal: 8,
  },
  menuDescription: {
    fontSize: 16,
    color: "#065f46",
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: 16,
  },
  nutritionSummary: {
    marginBottom: 24,
  },
  nutritionCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.25)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  nutritionCardGradient: {
    padding: 28,
  },
  nutritionGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nutritionItem: {
    alignItems: "center",
    flex: 1,
  },
  nutritionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#064e3b",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
    textAlign: "center",
  },
  mealsPreview: {
    marginBottom: 24,
  },
  mealsPreviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: 16,
  },
  mealsScrollView: {
    flexDirection: "row",
  },
  mealPreviewCard: {
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  mealPreviewBlur: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  mealPreviewGradient: {
    padding: 16,
    alignItems: "center",
    minWidth: 120,
  },
  mealPreviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  mealPreviewName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#064e3b",
    textAlign: "center",
    marginBottom: 6,
  },
  mealPreviewCalories: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "600",
  },
  costContainer: {
    marginBottom: 24,
  },
  costCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  costCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  costText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonBlur: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 28,
    gap: 12,
  },
  viewButton: {},
  viewButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.3,
  },
  startButton: {},
  startButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "95%",
    maxHeight: "90%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  modalGradient: {
    flex: 1,
    padding: 28,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#064e3b",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
  },
  selectorSection: {
    marginBottom: 32,
  },
  mealTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mealTypeCard: {
    width: (screenWidth - 100) / 2,
    borderRadius: 20,
    overflow: "hidden",
  },
  selectedMealType: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mealTypeBlur: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  mealTypeGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
  },
  mealTypeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#064e3b",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  selectedMealTypeName: {
    color: "#ffffff",
  },
  mealTypeDescription: {
    fontSize: 11,
    color: "#059669",
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },
  selectedMealTypeDescription: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  dropdownSection: {
    marginBottom: 28,
  },
  optionsScrollView: {
    flexDirection: "row",
  },
  optionChip: {
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  selectedOptionChip: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  optionChipBlur: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  optionChipGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#064e3b",
  },
  selectedOptionChipText: {
    color: "#ffffff",
  },
  ingredientsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ingredientChip: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
  },
  selectedIngredientChip: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  avoidIngredientChip: {
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  ingredientChipBlur: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  ingredientChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ingredientChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#064e3b",
  },
  selectedIngredientChipText: {
    color: "#ffffff",
  },
  inputRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dayChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 12,
    alignItems: "center",
  },
  selectedDayChip: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#064e3b",
  },
  selectedDayChipText: {
    color: "#ffffff",
  },
  budgetContainer: {
    flexDirection: "row",
    gap: 8,
  },
  budgetChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 12,
    alignItems: "center",
  },
  selectedBudgetChip: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  budgetChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#064e3b",
  },
  selectedBudgetChipText: {
    color: "#ffffff",
  },
  generateCustomButton: {
    marginTop: 32,
    borderRadius: 20,
    overflow: "hidden",
  },
  generateCustomButtonBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  generateCustomButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 16,
  },
  generateCustomButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },

  // Advanced Modal Styles
  advancedModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  advancedModalContent: {
    height: "90%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  advancedModalBlur: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  advancedModalGradient: {
    flex: 1,
    padding: 24,
  },
  advancedModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16, 185, 129, 0.2)",
  },
  advancedModalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#064e3b",
  },
  advancedCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  advancedModalBody: {
    flex: 1,
  },
  advancedInputSection: {
    marginBottom: 24,
  },
  advancedSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: 12,
  },
  advancedTextInput: {
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    padding: 16,
  },
  advancedTextInputField: {
    fontSize: 16,
    color: "#064e3b",
    fontWeight: "500",
  },
  advancedOptionsScrollView: {
    flexDirection: "row",
  },
  advancedOptionChip: {
    marginRight: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  selectedAdvancedOptionChip: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  advancedOptionChipBlur: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  advancedOptionChipGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  advancedOptionChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#064e3b",
  },
  selectedAdvancedOptionChipText: {
    color: "#ffffff",
  },
  advancedIngredientsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  advancedIngredientChip: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 4,
  },
  selectedAdvancedIngredientChip: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avoidAdvancedIngredientChip: {
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  advancedIngredientChipBlur: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  advancedIngredientChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  advancedIngredientChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#064e3b",
  },
  selectedAdvancedIngredientChipText: {
    color: "#ffffff",
  },
  advancedSettingsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  advancedSettingItem: {
    flex: 1,
  },
  advancedSettingLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: 12,
  },
  advancedTimeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  advancedTimeChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 12,
    alignItems: "center",
  },
  selectedAdvancedTimeChip: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  advancedTimeChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#064e3b",
  },
  selectedAdvancedTimeChipText: {
    color: "#ffffff",
  },
  advancedServingSelector: {
    flexDirection: "row",
    gap: 8,
  },
  advancedServingChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 12,
    alignItems: "center",
  },
  selectedAdvancedServingChip: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  advancedServingChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#064e3b",
  },
  selectedAdvancedServingChipText: {
    color: "#ffffff",
  },
  advancedBudgetSelector: {
    flexDirection: "row",
    gap: 12,
  },
  advancedBudgetChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 12,
    alignItems: "center",
  },
  selectedAdvancedBudgetChip: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  advancedBudgetChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#064e3b",
  },
  selectedAdvancedBudgetChipText: {
    color: "#ffffff",
  },
  advancedToggleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  advancedToggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#064e3b",
    flex: 1,
  },
  advancedGenerateButton: {
    marginTop: 24,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  advancedGenerateButtonBlur: {
    borderRadius: 24,
    overflow: "hidden",
  },
  advancedGenerateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 16,
  },
  advancedGenerateButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
});

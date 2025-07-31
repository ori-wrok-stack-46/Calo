import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  Switch,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Sparkles,
  ChefHat,
  Clock,
  Users,
  Heart,
  Flame,
  Leaf,
  Star,
  Settings,
  X,
  Check,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  DollarSign,
  Utensils,
} from "lucide-react-native";
import { api } from "../../src/services/api";
import {
  RecommendedMenu,
  CustomMenuOptions,
  AdvancedMenuRequest,
} from "../../types/menu";
import MenuCard from "../../components/MenuCard";
import LoadingScreen from "@/components/LoadingScreen";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MealType {
  id: string;
  name: string;
  nameHebrew: string;
  icon: any;
  description: string;
  descriptionHebrew: string;
  examples: string[];
  examplesHebrew: string[];
  color: string;
  gradient: string[];
}

const MEAL_TYPES: MealType[] = [
  {
    id: "mediterranean",
    name: "Mediterranean",
    nameHebrew: "ים תיכוני",
    icon: Heart,
    description: "Fresh vegetables, olive oil, fish, and whole grains",
    descriptionHebrew: "ירקות טריים, שמן זית, דגים ודגנים מלאים",
    examples: ["Greek salad", "Grilled fish", "Hummus"],
    examplesHebrew: ["סלט יווני", "דג צלוי", "חומוס"],
    color: "#3B82F6",
    gradient: ["#3B82F6", "#1D4ED8"],
  },
  {
    id: "high_protein",
    name: "High Protein",
    nameHebrew: "עשיר בחלבון",
    icon: Flame,
    description: "Lean meats, eggs, dairy, and legumes for muscle building",
    descriptionHebrew: "בשר רזה, ביצים, מוצרי חלב וקטניות לבניית שריר",
    examples: ["Chicken breast", "Protein shake", "Greek yogurt"],
    examplesHebrew: ["חזה עוף", "שייק חלבון", "יוגורט יווני"],
    color: "#EF4444",
    gradient: ["#EF4444", "#DC2626"],
  },
  {
    id: "low_carb",
    name: "Low Carb",
    nameHebrew: "דל פחמימות",
    icon: Leaf,
    description: "Minimal carbs, focus on proteins and healthy fats",
    descriptionHebrew: "מינימום פחמימות, דגש על חלבונים ושומנים בריאים",
    examples: ["Cauliflower rice", "Zucchini noodles", "Avocado salad"],
    examplesHebrew: ["אורז כרובית", "נודלס קישואים", "סלט אבוקדו"],
    color: "#10B981",
    gradient: ["#10B981", "#059669"],
  },
  {
    id: "vegetarian",
    name: "Vegetarian",
    nameHebrew: "צמחוני",
    icon: Leaf,
    description: "Plant-based with dairy and eggs",
    descriptionHebrew: "מבוסס צמחים עם מוצרי חלב וביצים",
    examples: ["Veggie burger", "Pasta primavera", "Caprese salad"],
    examplesHebrew: ["המבורגר צמחוני", "פסטה פרימוורה", "סלט קפרזה"],
    color: "#22C55E",
    gradient: ["#22C55E", "#16A34A"],
  },
  {
    id: "vegan",
    name: "Vegan",
    nameHebrew: "טבעוני",
    icon: Leaf,
    description: "100% plant-based, no animal products",
    descriptionHebrew: "100% צמחי, ללא מוצרים מן החי",
    examples: ["Buddha bowl", "Lentil curry", "Quinoa salad"],
    examplesHebrew: ["קערת בודהה", "קארי עדשים", "סלט קינואה"],
    color: "#84CC16",
    gradient: ["#84CC16", "#65A30D"],
  },
  {
    id: "keto",
    name: "Ketogenic",
    nameHebrew: "קטוגני",
    icon: Flame,
    description: "Very low carb, high fat for ketosis",
    descriptionHebrew: "מעט מאוד פחמימות, הרבה שומן לקטוזיס",
    examples: ["Bacon and eggs", "Avocado bomb", "Cheese crisps"],
    examplesHebrew: ["בייקון וביצים", "פצצת אבוקדו", "צ'יפס גבינה"],
    color: "#F59E0B",
    gradient: ["#F59E0B", "#D97706"],
  },
];

const DIETARY_STYLES = [
  { id: "balanced", name: "Balanced", nameHebrew: "מאוזן", icon: Star },
  { id: "weight_loss", name: "Weight Loss", nameHebrew: "הרזיה", icon: Heart },
  {
    id: "muscle_gain",
    name: "Muscle Gain",
    nameHebrew: "בניית שריר",
    icon: Flame,
  },
  {
    id: "athletic",
    name: "Athletic Performance",
    nameHebrew: "ביצועים אתלטיים",
    icon: Star,
  },
  {
    id: "heart_healthy",
    name: "Heart Healthy",
    nameHebrew: "בריא ללב",
    icon: Heart,
  },
  {
    id: "diabetic",
    name: "Diabetic Friendly",
    nameHebrew: "מתאים לסוכרתיים",
    icon: Leaf,
  },
];

const COOKING_STYLES = [
  { id: "quick", name: "Quick & Easy", nameHebrew: "מהיר וקל", icon: Clock },
  { id: "gourmet", name: "Gourmet", nameHebrew: "גורמה", icon: ChefHat },
  {
    id: "one_pot",
    name: "One Pot Meals",
    nameHebrew: "ארוחות בסיר אחד",
    icon: Utensils,
  },
  {
    id: "meal_prep",
    name: "Meal Prep",
    nameHebrew: "הכנה מראש",
    icon: Calendar,
  },
  { id: "no_cook", name: "No Cooking", nameHebrew: "ללא בישול", icon: Leaf },
  { id: "grilled", name: "Grilled", nameHebrew: "על האש", icon: Flame },
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
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

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

  const [advancedRequest, setAdvancedRequest] = useState<AdvancedMenuRequest>({
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

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
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
      .map((id: string) => {
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
      .map((id: string) => {
        const ingredient = COMMON_INGREDIENTS.find((ing) => ing.id === id);
        return isRTL ? ingredient?.nameHebrew : ingredient?.name;
      })
      .join(", ");

    const avoidIngredients = customOptions.avoidIngredients
      .map((id: string) => {
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
      .map((id: string) => {
        const allergy = ALLERGIES.find((a) => a.id === id);
        return isRTL ? allergy?.nameHebrew : allergy?.name;
      })
      .join(", ");

    const mustIncludeIngredients = advancedRequest.ingredients.mustInclude
      .map((id: string) => {
        const ingredient = COMMON_INGREDIENTS.find((ing) => ing.id === id);
        return isRTL ? ingredient?.nameHebrew : ingredient?.name;
      })
      .join(", ");

    const mustAvoidIngredients = advancedRequest.ingredients.mustAvoid
      .map((id: string) => {
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
    setCustomOptions((prev: { mealTypes: string[] }) => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealTypeId)
        ? prev.mealTypes.filter((id: string) => id !== mealTypeId)
        : [...prev.mealTypes, mealTypeId],
    }));
  };

  const toggleIngredient = (ingredientId: string, isAvoid: boolean = false) => {
    const field = isAvoid ? "avoidIngredients" : "ingredients";
    setCustomOptions((prev: { [x: string]: any }) => ({
      ...prev,
      [field]: prev[field].includes(ingredientId)
        ? prev[field].filter((id: string) => id !== ingredientId)
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

  const QuickActionCard = ({
    title,
    subtitle,
    icon: Icon,
    onPress,
    color,
    gradient,
  }: any) => (
    <Pressable
      style={[styles.quickActionCard, { borderColor: color + "20" }]}
      onPress={onPress}
      android_ripple={{ color: color + "20" }}
    >
      <LinearGradient
        colors={[`${color}10`, `${color}05`]}
        style={styles.quickActionGradient}
      >
        <View
          style={[styles.quickActionIcon, { backgroundColor: color + "15" }]}
        >
          <Icon size={24} color={color} strokeWidth={2.5} />
        </View>
        <View style={styles.quickActionContent}>
          <Text style={[styles.quickActionTitle, isRTL && styles.rtlText]}>
            {title}
          </Text>
          <Text style={[styles.quickActionSubtitle, isRTL && styles.rtlText]}>
            {subtitle}
          </Text>
        </View>
        <ArrowRight size={18} color={color} />
      </LinearGradient>
    </Pressable>
  );

  const MealTypeCard = ({ mealType, isSelected, onPress }: any) => {
    const IconComponent = mealType.icon;
    return (
      <Pressable
        style={[
          styles.mealTypeCard,
          isSelected && [
            styles.mealTypeCardSelected,
            { borderColor: mealType.color },
          ],
        ]}
        onPress={onPress}
        android_ripple={{ color: mealType.color + "20" }}
      >
        <LinearGradient
          colors={isSelected ? mealType.gradient : ["#ffffff", "#fafafa"]}
          style={styles.mealTypeCardGradient}
        >
          <View
            style={[
              styles.mealTypeIcon,
              { backgroundColor: mealType.color + "15" },
            ]}
          >
            <IconComponent
              size={28}
              color={isSelected ? "#ffffff" : mealType.color}
              strokeWidth={2}
            />
          </View>
          <Text
            style={[
              styles.mealTypeTitle,
              isSelected && styles.mealTypeTitleSelected,
              isRTL && styles.rtlText,
            ]}
          >
            {isRTL ? mealType.nameHebrew : mealType.name}
          </Text>
          <Text
            style={[
              styles.mealTypeDescription,
              isSelected && styles.mealTypeDescriptionSelected,
              isRTL && styles.rtlText,
            ]}
          >
            {isRTL ? mealType.descriptionHebrew : mealType.description}
          </Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Check size={14} color="#ffffff" />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  };

  const OptionSelector = ({ options, selectedValue, onSelect, style }: any) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style}>
      <View style={styles.optionContainer}>
        {options.map((option: any) => (
          <Pressable
            key={option.id}
            style={[
              styles.optionChip,
              selectedValue === option.id && styles.optionChipSelected,
            ]}
            onPress={() => onSelect(option.id)}
            android_ripple={{ color: "#3B82F620" }}
          >
            <Text
              style={[
                styles.optionText,
                selectedValue === option.id && styles.optionTextSelected,
                isRTL && styles.rtlText,
              ]}
            >
              {isRTL ? option.nameHebrew : option.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  if (isLoading) {
    return (
      <LoadingScreen
        text={isRTL ? "טוען את התפריטים שלך..." : "Loading your menus..."}
      />
    );
  }

  return (
    <View style={styles.container}>
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
          {/* Modern Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={["#ffffff", "#fafafa"]}
              style={styles.headerGradient}
            >
              <View style={[styles.headerTop, isRTL && styles.rtlRow]}>
                <View style={styles.headerInfo}>
                  <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
                    {isRTL ? "תפריטים מותאמים" : "Smart Menus"}
                  </Text>
                  <Text
                    style={[styles.headerSubtitle, isRTL && styles.rtlText]}
                  >
                    {isRTL
                      ? `${menus.length} תפריטים זמינים`
                      : `${menus.length} personalized plans`}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <Pressable
                    style={styles.headerActionButton}
                    android_ripple={{ color: "#3B82F620" }}
                  >
                    <Search size={20} color="#64748b" />
                  </Pressable>
                  <Pressable
                    style={styles.headerActionButton}
                    android_ripple={{ color: "#3B82F620" }}
                  >
                    <Filter size={20} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <QuickActionCard
                  title={isRTL ? "תפריט מהיר" : "Quick Menu"}
                  subtitle={isRTL ? "יצירה מהירה" : "Fast generation"}
                  icon={Plus}
                  color="#3B82F6"
                  onPress={generateNewMenu}
                />
                <QuickActionCard
                  title={isRTL ? "תפריט מתקדם" : "Advanced Menu"}
                  subtitle={isRTL ? "כל האפשרויות" : "Full control"}
                  icon={Sparkles}
                  color="#8B5CF6"
                  onPress={() => setShowAdvancedModal(true)}
                />
              </View>
            </LinearGradient>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={["#3B82F6"]}
                tintColor="#3B82F6"
              />
            }
          >
            {menus.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyCard}>
                  <LinearGradient
                    colors={["#ffffff", "#f8fafc"]}
                    style={styles.emptyCardGradient}
                  >
                    <View style={styles.emptyIcon}>
                      <ChefHat size={64} color="#cbd5e1" strokeWidth={1.5} />
                    </View>
                    <Text style={[styles.emptyTitle, isRTL && styles.rtlText]}>
                      {isRTL ? "התחל ליצור תפריטים" : "Start Creating Menus"}
                    </Text>
                    <Text
                      style={[styles.emptyDescription, isRTL && styles.rtlText]}
                    >
                      {isRTL
                        ? "צור את התפריט המותאם הראשון שלך והתחל מסע תזונתי בריא"
                        : "Create your first personalized menu and start your healthy nutrition journey"}
                    </Text>
                    <Pressable
                      style={styles.emptyButton}
                      onPress={() => setShowCustomModal(true)}
                      android_ripple={{ color: "#3B82F620" }}
                    >
                      <LinearGradient
                        colors={["#3B82F6", "#2563EB"]}
                        style={styles.emptyButtonGradient}
                      >
                        <Plus size={20} color="#ffffff" />
                        <Text
                          style={[
                            styles.emptyButtonText,
                            isRTL && styles.rtlText,
                          ]}
                        >
                          {isRTL ? "צור תפריט חדש" : "Create New Menu"}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </LinearGradient>
                </View>
              </View>
            ) : (
              <View style={styles.menusList}>
                {menus.map((menu, index) => (
                  <MenuCard
                    key={`menu-${menu.menu_id}-${index}`}
                    menu={menu}
                    isRTL={isRTL}
                    onStart={startMenu}
                    fadeAnim={fadeAnim}
                    slideAnim={slideAnim}
                    index={index}
                  />
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
            <View style={styles.modalContainer}>
              <BlurView intensity={100} style={styles.modalContent}>
                <LinearGradient
                  colors={["#ffffff", "#f8fafc"]}
                  style={styles.modalGradient}
                >
                  {/* Modal Header */}
                  <View style={[styles.modalHeader, isRTL && styles.rtlRow]}>
                    <View style={styles.modalHeaderContent}>
                      <Text
                        style={[styles.modalTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "יצירת תפריט מותאם" : "Create Custom Menu"}
                      </Text>
                      <Text
                        style={[styles.modalSubtitle, isRTL && styles.rtlText]}
                      >
                        {isRTL
                          ? "התאם את התפריט לטעמך האישי"
                          : "Customize your perfect meal plan"}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.modalCloseButton}
                      onPress={() => setShowCustomModal(false)}
                      android_ripple={{ color: "#64748b20" }}
                    >
                      <X size={24} color="#64748b" />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Meal Types Selection */}
                    <View style={styles.section}>
                      <Text
                        style={[styles.sectionTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "בחר סוגי ארוחות" : "Select Meal Types"}
                      </Text>
                      <View style={styles.mealTypesGrid}>
                        {MEAL_TYPES.map((mealType) => (
                          <MealTypeCard
                            key={mealType.id}
                            mealType={mealType}
                            isSelected={customOptions.mealTypes.includes(
                              mealType.id
                            )}
                            onPress={() => toggleMealType(mealType.id)}
                          />
                        ))}
                      </View>
                    </View>

                    {/* Dietary Style */}
                    <View style={styles.section}>
                      <Text
                        style={[styles.sectionTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "סגנון תזונה" : "Dietary Style"}
                      </Text>
                      <OptionSelector
                        options={DIETARY_STYLES}
                        selectedValue={customOptions.dietaryStyle}
                        onSelect={(value: string) =>
                          setCustomOptions((prev: any) => ({
                            ...prev,
                            dietaryStyle: value,
                          }))
                        }
                      />
                    </View>

                    {/* Cooking Style */}
                    <View style={styles.section}>
                      <Text
                        style={[styles.sectionTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "סגנון בישול" : "Cooking Style"}
                      </Text>
                      <OptionSelector
                        options={COOKING_STYLES}
                        selectedValue={customOptions.cookingStyle}
                        onSelect={(value: string) =>
                          setCustomOptions((prev: any) => ({
                            ...prev,
                            cookingStyle: value,
                          }))
                        }
                      />
                    </View>

                    {/* Settings Grid */}
                    <View style={styles.settingsGrid}>
                      <View style={styles.settingCard}>
                        <Text
                          style={[styles.settingLabel, isRTL && styles.rtlText]}
                        >
                          {isRTL ? "זמן הכנה" : "Prep Time"}
                        </Text>
                        <OptionSelector
                          options={PREP_TIMES}
                          selectedValue={customOptions.prepTime}
                          onSelect={(value: string) =>
                            setCustomOptions((prev: any) => ({
                              ...prev,
                              prepTime: value,
                            }))
                          }
                          style={styles.compactSelector}
                        />
                      </View>

                      <View style={styles.settingCard}>
                        <Text
                          style={[styles.settingLabel, isRTL && styles.rtlText]}
                        >
                          {isRTL ? "גודל מנה" : "Serving Size"}
                        </Text>
                        <OptionSelector
                          options={SERVING_SIZES}
                          selectedValue={customOptions.servingSize}
                          onSelect={(value: string) =>
                            setCustomOptions((prev: any) => ({
                              ...prev,
                              servingSize: value,
                            }))
                          }
                          style={styles.compactSelector}
                        />
                      </View>
                    </View>

                    {/* Generate Button */}
                    <View style={styles.modalFooter}>
                      <Pressable
                        style={[
                          styles.generateButton,
                          customOptions.mealTypes.length === 0 &&
                            styles.generateButtonDisabled,
                        ]}
                        onPress={generateCustomMenu}
                        disabled={
                          customOptions.mealTypes.length === 0 || isGenerating
                        }
                        android_ripple={{ color: "#ffffff20" }}
                      >
                        <LinearGradient
                          colors={
                            customOptions.mealTypes.length === 0
                              ? ["#94a3b8", "#64748b"]
                              : ["#3B82F6", "#2563EB"]
                          }
                          style={styles.generateButtonGradient}
                        >
                          {isGenerating ? (
                            <LoadingScreen size="small" />
                          ) : (
                            <>
                              <ChefHat size={20} color="#ffffff" />
                              <Text
                                style={[
                                  styles.generateButtonText,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL
                                  ? "צור את התפריט שלי"
                                  : "Generate My Menu"}
                              </Text>
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </ScrollView>
                </LinearGradient>
              </BlurView>
            </View>
          </View>
        </Modal>

        {/* Advanced Modal */}
        <Modal
          visible={showAdvancedModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAdvancedModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.advancedModalContainer}>
              <BlurView intensity={100} style={styles.modalContent}>
                <LinearGradient
                  colors={["#ffffff", "#f8fafc"]}
                  style={styles.modalGradient}
                >
                  {/* Advanced Modal Header */}
                  <View style={[styles.modalHeader, isRTL && styles.rtlRow]}>
                    <View style={styles.modalHeaderContent}>
                      <Text
                        style={[styles.modalTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "תפריט מתקדם" : "Advanced Menu"}
                      </Text>
                      <Text
                        style={[styles.modalSubtitle, isRTL && styles.rtlText]}
                      >
                        {isRTL
                          ? "שליטה מלאה על כל הפרטים"
                          : "Complete control over every detail"}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.modalCloseButton}
                      onPress={() => setShowAdvancedModal(false)}
                      android_ripple={{ color: "#64748b20" }}
                    >
                      <X size={24} color="#64748b" />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Meal Name Input */}
                    <View style={styles.section}>
                      <Text
                        style={[styles.sectionTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "שם הארוחה" : "Meal Name"}
                      </Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[styles.textInput, isRTL && styles.rtlText]}
                          placeholder={
                            isRTL ? "הזן שם לתפריט..." : "Enter menu name..."
                          }
                          value={advancedRequest.mealName}
                          onChangeText={(text) =>
                            setAdvancedRequest((prev: any) => ({
                              ...prev,
                              mealName: text,
                            }))
                          }
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                      <Text
                        style={[styles.sectionTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "תיאור (אופציונלי)" : "Description (Optional)"}
                      </Text>
                      <View style={[styles.inputContainer, { height: 100 }]}>
                        <TextInput
                          style={[
                            styles.textInput,
                            { height: "100%", textAlignVertical: "top" },
                            isRTL && styles.rtlText,
                          ]}
                          placeholder={
                            isRTL
                              ? "תאר את התפריט הרצוי..."
                              : "Describe your desired menu..."
                          }
                          value={advancedRequest.description}
                          onChangeText={(text) =>
                            setAdvancedRequest((prev: any) => ({
                              ...prev,
                              description: text,
                            }))
                          }
                          multiline
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    </View>

                    {/* Advanced Options */}
                    <View style={styles.section}>
                      <Text
                        style={[styles.sectionTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "סגנון מטבח" : "Cuisine Style"}
                      </Text>
                      <OptionSelector
                        options={CUISINES}
                        selectedValue={advancedRequest.cuisine}
                        onSelect={(value: string) =>
                          setAdvancedRequest((prev: any) => ({
                            ...prev,
                            cuisine: value,
                          }))
                        }
                      />
                    </View>

                    <View style={styles.section}>
                      <Text
                        style={[styles.sectionTitle, isRTL && styles.rtlText]}
                      >
                        {isRTL ? "מטרה בריאותית" : "Health Goal"}
                      </Text>
                      <OptionSelector
                        options={HEALTH_GOALS}
                        selectedValue={advancedRequest.healthGoal}
                        onSelect={(value: string) =>
                          setAdvancedRequest((prev: any) => ({
                            ...prev,
                            healthGoal: value,
                          }))
                        }
                      />
                    </View>

                    {/* Include Snacks Toggle */}
                    <View
                      style={[styles.toggleContainer, isRTL && styles.rtlRow]}
                    >
                      <Text
                        style={[styles.toggleLabel, isRTL && styles.rtlText]}
                      >
                        {isRTL
                          ? "כלול חטיפים בריאים"
                          : "Include Healthy Snacks"}
                      </Text>
                      <Switch
                        value={advancedRequest.includeSnacks}
                        onValueChange={(value) =>
                          setAdvancedRequest((prev: any) => ({
                            ...prev,
                            includeSnacks: value,
                          }))
                        }
                        trackColor={{ false: "#e2e8f0", true: "#3B82F6" }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    {/* Generate Button */}
                    <View style={styles.modalFooter}>
                      <Pressable
                        style={[
                          styles.generateButton,
                          !advancedRequest.mealName.trim() &&
                            styles.generateButtonDisabled,
                        ]}
                        onPress={generateAdvancedMenu}
                        disabled={
                          !advancedRequest.mealName.trim() || isGenerating
                        }
                        android_ripple={{ color: "#ffffff20" }}
                      >
                        <LinearGradient
                          colors={
                            !advancedRequest.mealName.trim()
                              ? ["#94a3b8", "#64748b"]
                              : ["#8B5CF6", "#7C3AED"]
                          }
                          style={styles.generateButtonGradient}
                        >
                          {isGenerating ? (
                            <LoadingScreen size="small" />
                          ) : (
                            <>
                              <Sparkles size={20} color="#ffffff" />
                              <Text
                                style={[
                                  styles.generateButtonText,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL
                                  ? "צור תפריט מתקדם"
                                  : "Generate Advanced Menu"}
                              </Text>
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </ScrollView>
                </LinearGradient>
              </BlurView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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

  // Header Styles
  header: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    padding: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3EBB9E",
    justifyContent: "center",
    alignItems: "center",
  },

  // Quick Actions
  quickActions: {
    gap: 12,
  },
  quickActionCard: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },

  // Content
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyCard: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
  },
  emptyCardGradient: {
    padding: 40,
    alignItems: "center",
    minWidth: screenWidth - 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#3EBB9E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
    fontWeight: "500",
  },
  emptyButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  // Menus List
  menusList: {
    paddingBottom: 24,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "92%",
    maxHeight: "85%",
    borderRadius: 24,
    overflow: "hidden",
  },
  advancedModalContainer: {
    width: "95%",
    height: "90%",
    borderRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  modalGradient: {
    flex: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3EBB9E",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },

  // Meal Types Grid
  mealTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mealTypeCard: {
    width: (screenWidth - 88) / 2,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  mealTypeCardSelected: {
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  mealTypeCardGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
    position: "relative",
  },
  mealTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  mealTypeTitleSelected: {
    color: "#ffffff",
  },
  mealTypeDescription: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },
  mealTypeDescriptionSelected: {
    color: "#ffffff",
    opacity: 0.9,
  },
  selectedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Options
  optionContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  optionChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#3EBB9E",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionChipSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  optionTextSelected: {
    color: "#ffffff",
  },
  compactSelector: {
    marginTop: 8,
  },

  // Settings
  settingsGrid: {
    gap: 16,
    marginBottom: 28,
  },
  settingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },

  // Inputs
  inputContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },

  // Toggle
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 28,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },

  // Footer
  modalFooter: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  generateButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});

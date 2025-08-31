import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import {
  analyzeMeal,
  updateMeal,
  postMeal,
  clearPendingMeal,
  clearError,
  processImage,
} from "@/src/store/mealSlice";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  Send,
  CreditCard as Edit3,
  Trash2,
  Plus,
  RotateCcw,
  TriangleAlert as AlertTriangle,
  Info,
  X,
  Save,
  RefreshCw,
  Heart,
  Star,
  Clock,
  Flame,
  Zap,
  Droplets,
  Wheat,
  Apple,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronLeft,
  Search,
  ShoppingCart,
} from "lucide-react-native";
import { useMealDataRefresh } from "@/hooks/useMealDataRefresh";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "@/src/context/ThemeContext";

const { width: screenWidth } = Dimensions.get("window");

interface Ingredient {
  name: string;
  calories: number;
  protein_g?: number;
  protein?: number;
  carbs_g?: number;
  carbs?: number;
  fats_g?: number;
  fat?: number;
  fats?: number;
  fiber_g?: number;
  fiber?: number;
  sugar_g?: number;
  sugar?: number;
  sodium_mg?: number;
  sodium?: number;
  estimated_portion_g?: number;
}

interface AnalysisData {
  name?: string;
  meal_name?: string;
  description?: string;
  calories: number;
  protein_g?: number;
  protein?: number;
  carbs_g?: number;
  carbs?: number;
  fats_g?: number;
  fat?: number;
  fats?: number;
  fiber_g?: number;
  fiber?: number;
  sugar_g?: number;
  sugar?: number;
  sodium_mg?: number;
  sodium?: number;
  saturated_fats_g?: number;
  polyunsaturated_fats_g?: number;
  monounsaturated_fats_g?: number;
  omega_3_g?: number;
  omega_6_g?: number;
  cholesterol_mg?: number;
  serving_size_g?: number;
  ingredients?: Ingredient[];
  healthScore?: string;
  recommendations?: string;
  cookingMethod?: string;
  cooking_method?: string;
  food_category?: string;
  confidence?: number;
  servingSize?: string;
  healthNotes?: string;
}

export default function CameraScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { refreshAllMealData } = useMealDataRefresh();
  const colorScheme = useColorScheme();
  const { colors, isDark } = useTheme();

  const { pendingMeal, isAnalyzing, isPosting, isUpdating, error } =
    useSelector((state: RootState) => state.meal);

  // Local state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userComment, setUserComment] = useState("");
  const [editedIngredients, setEditedIngredients] = useState<Ingredient[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  );
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [hasBeenAnalyzed, setHasBeenAnalyzed] = useState(false);
  const [showNutritionDetails, setShowNutritionDetails] = useState(true);
  const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const nutritionCardAnim = useRef(new Animated.Value(0)).current;

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Request camera permission on mount
  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    requestCameraPermission();
  }, []);

  // Clear error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Update local state when pendingMeal changes
  useEffect(() => {
    if (pendingMeal?.analysis) {
      setAnalysisData(pendingMeal.analysis);
      const ingredients = pendingMeal.analysis.ingredients || [];
      setEditedIngredients(ingredients);
      setHasBeenAnalyzed(true);
      setShowResults(true);

      if (pendingMeal.image_base_64) {
        const imageUri = pendingMeal.image_base_64.startsWith("data:")
          ? pendingMeal.image_base_64
          : `data:image/jpeg;base64,${pendingMeal.image_base_64}`;
        setSelectedImage(imageUri);
      }

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(nutritionCardAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [pendingMeal, fadeAnim, slideAnim, nutritionCardAnim]);

  // Helper function to get nutrition value with fallbacks
  const getNutritionValue = (
    data: AnalysisData | Ingredient | undefined,
    field: string
  ): number => {
    if (!data) return 0;

    const variations = [
      field,
      field.replace("_g", ""),
      field.replace("_mg", ""),
      field.replace("g", ""),
      field.replace("mg", ""),
    ];

    for (const variation of variations) {
      const value = data[variation as keyof typeof data];
      if (typeof value === "number" && value > 0) {
        return Math.round(value);
      }
      if (typeof value === "string" && !isNaN(parseFloat(value))) {
        return Math.round(parseFloat(value));
      }
    }
    return 0;
  };

  const getNutritionValueForIngredient = (
    ingredient: Ingredient | undefined,
    field: string
  ): number => {
    if (!ingredient) return 0;

    const variations = [
      field,
      field.replace("_g", ""),
      field.replace("_mg", ""),
      field.replace("g", ""),
      field.replace("mg", ""),
    ];

    for (const variation of variations) {
      const value = ingredient[variation as keyof Ingredient];
      if (typeof value === "number" && value > 0) {
        return Math.round(value);
      }
      if (typeof value === "string" && !isNaN(parseFloat(value))) {
        return Math.round(parseFloat(value));
      }
    }
    return 0;
  };

  // Helper function to get meal name
  const getMealName = (data: AnalysisData): string => {
    return data?.name || data?.meal_name || "Analyzed Meal";
  };

  // Image selection handlers
  const handleTakePhoto = async () => {
    if (hasPermission === null) {
      Alert.alert(
        t("common.error"),
        "Camera permission is still being checked."
      );
      return;
    }
    if (!hasPermission) {
      Alert.alert(
        t("camera.permission"),
        "Camera permission is required to take photos. Please grant permission in settings."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        resetAnalysisState();
        setShowResults(false);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert(t("common.error"), "Failed to take photo");
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("camera.permission"),
          "Gallery permission is required to select photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        resetAnalysisState();
        setShowResults(false);
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert(t("common.error"), "Failed to select image");
    }
  };

  // Reset analysis state when new image is selected or analysis is discarded
  const resetAnalysisState = () => {
    setAnalysisData(null);
    setEditedIngredients([]);
    setUserComment("");
    setHasBeenAnalyzed(false);
    setShowNutritionDetails(true);
    setShowAdvancedNutrition(false);
    dispatch(clearPendingMeal());
    dispatch(clearError());

    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    nutritionCardAnim.setValue(0);
  };

  // Initial analysis
  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert(t("common.error"), "Please select an image first");
      return;
    }

    try {
      const base64Image = await processImage(selectedImage);
      if (!base64Image) {
        Alert.alert(t("common.error"), "Could not process image.");
        return;
      }

      const analysisParams = {
        imageBase64: base64Image,
        language: isRTL ? "hebrew" : "english",
        includeDetailedIngredients: true,
        includeNutritionBreakdown: true,
      };

      analysisParams.updateText =
        (userComment.trim()
          ? userComment.trim() +
            " " +
            "Please provide a comprehensive list of ALL ingredients with detailed nutritional information."
          : "Please identify ALL ingredients in this meal with complete nutritional information for each ingredient including calories, protein, carbs, fat, fiber, sugar, and sodium content.") ||
        "";

      const result = await dispatch(analyzeMeal(analysisParams));

      if (analyzeMeal.fulfilled.match(result)) {
        if (result.payload?.analysis?.ingredients) {
          console.log(
            "🥗 Ingredients found:",
            result.payload.analysis.ingredients.length
          );
        }
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        Alert.alert(
          t("camera.analysis_failed"),
          typeof result.payload === "string"
            ? result.payload
            : "Failed to analyze meal. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        t("camera.analysis_failed"),
        error instanceof Error ? error.message : "Analysis failed"
      );
    }
  };

  // Re-analysis after edits
  const handleReAnalyze = async () => {
    if (!selectedImage || !hasBeenAnalyzed) {
      Alert.alert(t("common.error") || "Error", "No meal to re-analyze");
      return;
    }

    try {
      const base64Image = await processImage(selectedImage);
      if (!base64Image) {
        Alert.alert(
          t("common.error") || "Error",
          "Could not process image for re-analysis."
        );
        return;
      }

      let updateText = userComment.trim();
      if (editedIngredients.length > 0) {
        const ingredientsList = editedIngredients
          .map((ing) => ing.name)
          .join(", ");
        updateText +=
          (updateText ? " " : "") +
          `Please re-analyze considering these ingredients: ${ingredientsList}. Provide updated nutritional information.`;
      }
      if (!updateText) {
        updateText =
          "Please re-analyze this meal with updated nutritional information.";
      }

      const reAnalysisParams = {
        imageBase64: base64Image,
        language: isRTL ? "hebrew" : "english",
        includeDetailedIngredients: true,
        includeNutritionBreakdown: true,
        updateText: updateText,
      };

      const result = await dispatch(analyzeMeal(reAnalysisParams));

      if (analyzeMeal.fulfilled.match(result)) {
        Alert.alert(
          t("common.success") || "Success",
          "Meal re-analyzed successfully with your edits!"
        );
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        Alert.alert(
          "Re-analysis Failed",
          typeof result.payload === "string"
            ? result.payload
            : "Failed to re-analyze meal. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Re-analysis Failed",
        error instanceof Error ? error.message : "Re-analysis failed"
      );
    }
  };

  // Save meal to database
  const handleSaveMeal = async () => {
    if (!analysisData) {
      Alert.alert(t("common.error"), "No analysis data to save");
      return;
    }

    try {
      const result = await dispatch(postMeal());

      if (postMeal.fulfilled.match(result)) {
        await refreshAllMealData();

        Alert.alert(t("camera.save_success"), "Meal saved successfully!", [
          {
            text: t("common.ok"),
            onPress: () => {
              resetAnalysisState();
              setSelectedImage(null);
              setShowResults(false);
            },
          },
        ]);
      } else {
        Alert.alert(
          t("camera.save_failed"),
          typeof result.payload === "string"
            ? result.payload
            : "Failed to save meal. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        t("camera.save_failed"),
        error instanceof Error ? error.message : "Save failed"
      );
    }
  };

  // Discard analysis
  const handleDeleteMeal = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMeal = () => {
    resetAnalysisState();
    setSelectedImage(null);
    setShowDeleteConfirm(false);
    setShowResults(false);
    Alert.alert(t("common.success"), "Meal analysis discarded successfully");
  };

  // Ingredient editing functions
  const handleEditIngredient = (ingredient: Ingredient, index: number) => {
    setEditingIngredient({ ...ingredient });
    setEditingIndex(index);
    setShowEditModal(true);
  };

  const handleAddIngredient = () => {
    const newIngredient: Ingredient = {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium_mg: 0,
    };
    setEditingIngredient(newIngredient);
    setEditingIndex(-1);
    setShowEditModal(true);
  };

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = editedIngredients.filter((_, i) => i !== index);
    setEditedIngredients(updatedIngredients);
  };

  const handleSaveIngredient = () => {
    if (!editingIngredient || !editingIngredient.name.trim()) {
      Alert.alert(t("common.error"), "Ingredient name is required");
      return;
    }

    const updatedIngredients = [...editedIngredients];

    if (editingIndex >= 0) {
      updatedIngredients[editingIndex] = editingIngredient;
    } else {
      updatedIngredients.push(editingIngredient);
    }

    setEditedIngredients(updatedIngredients);
    setShowEditModal(false);
    setEditingIngredient(null);
    setEditingIndex(-1);
  };

  // Calculate total nutrition from current data
  const calculateTotalNutrition = () => {
    const currentIngredients =
      editedIngredients.length > 0
        ? editedIngredients
        : analysisData?.ingredients || [];

    if (!analysisData && currentIngredients.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };
    }

    const totalCalories = analysisData?.calories || 0;
    const totalProtein = analysisData
      ? getNutritionValue(analysisData, "protein_g") ||
        getNutritionValue(analysisData, "protein") ||
        0
      : 0;
    const totalCarbs = analysisData
      ? getNutritionValue(analysisData, "carbs_g") ||
        getNutritionValue(analysisData, "carbs") ||
        0
      : 0;
    const totalFat = analysisData
      ? getNutritionValue(analysisData, "fats_g") ||
        getNutritionValue(analysisData, "fat") ||
        0
      : 0;
    const totalFiber = analysisData
      ? getNutritionValue(analysisData, "fiber_g") ||
        getNutritionValue(analysisData, "fiber") ||
        0
      : 0;
    const totalSugar = analysisData
      ? getNutritionValue(analysisData, "sugar_g") ||
        getNutritionValue(analysisData, "sugar") ||
        0
      : 0;
    const totalSodium = analysisData
      ? getNutritionValue(analysisData, "sodium_mg") ||
        getNutritionValue(analysisData, "sodium") ||
        0
      : 0;

    if (currentIngredients.length > 0) {
      let ingredientSumCalories = 0;
      let ingredientSumProtein = 0;
      let ingredientSumCarbs = 0;
      let ingredientSumFat = 0;
      let ingredientSumFiber = 0;
      let ingredientSumSugar = 0;
      let ingredientSumSodium = 0;

      currentIngredients.forEach((ingredient) => {
        ingredientSumCalories += getNutritionValueForIngredient(
          ingredient,
          "calories"
        );
        ingredientSumProtein +=
          getNutritionValueForIngredient(ingredient, "protein_g") ||
          getNutritionValueForIngredient(ingredient, "protein");
        ingredientSumCarbs +=
          getNutritionValueForIngredient(ingredient, "carbs_g") ||
          getNutritionValueForIngredient(ingredient, "carbs");
        ingredientSumFat +=
          getNutritionValueForIngredient(ingredient, "fats_g") ||
          getNutritionValueForIngredient(ingredient, "fat");
        ingredientSumFiber +=
          getNutritionValueForIngredient(ingredient, "fiber_g") ||
          getNutritionValueForIngredient(ingredient, "fiber");
        ingredientSumSugar +=
          getNutritionValueForIngredient(ingredient, "sugar_g") ||
          getNutritionValueForIngredient(ingredient, "sugar");
        ingredientSumSodium +=
          getNutritionValueForIngredient(ingredient, "sodium_mg") ||
          getNutritionValueForIngredient(ingredient, "sodium");
      });

      return {
        calories: ingredientSumCalories || totalCalories,
        protein: ingredientSumProtein || totalProtein,
        carbs: ingredientSumCarbs || totalCarbs,
        fat: ingredientSumFat || totalFat,
        fiber: ingredientSumFiber || totalFiber,
        sugar: ingredientSumSugar || totalSugar,
        sodium: ingredientSumSodium || totalSodium,
      };
    }

    return {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      fiber: totalFiber,
      sugar: totalSugar,
      sodium: totalSodium,
    };
  };

  // Render functions
  const renderImageSelection = () => (
    <View style={styles.imageSelectionContainer}>
      <View style={styles.cameraIconContainer}>
        <Camera size={48} color="#10B981" />
      </View>
      <Text style={styles.imageSelectionTitle}>Meal Scanner</Text>
      <Text style={styles.imageSelectionSubtitle}>
        Take a photo or select from gallery to analyze your meal
      </Text>

      <View style={styles.imageSelectionButtons}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={handleTakePhoto}
        >
          <Camera size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionButton}
          onPress={handleSelectFromGallery}
        >
          <ImageIcon size={20} color="#10B981" />
          <Text style={styles.secondaryActionText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAnalysisResults = () => {
    if (!analysisData) return null;

    const totalNutrition = calculateTotalNutrition();
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Generate chart data points for visualization
    const generateChartData = () => {
      const baseCalories = totalNutrition.calories;
      const points = [];

      for (let i = 0; i < 7; i++) {
        const variation = (Math.random() - 0.5) * 0.3;
        const value = Math.max(0, baseCalories * (1 + variation));
        points.push({
          calories: Math.round(value),
          protein: Math.round(totalNutrition.protein * (1 + variation * 0.5)),
          carbs: Math.round(totalNutrition.carbs * (1 + variation * 0.7)),
          fat: Math.round(totalNutrition.fat * (1 + variation * 0.4)),
        });
      }
      return points;
    };

    const chartData = generateChartData();

    return (
      <View style={styles.resultsContainer}>
        {/* Header */}
        <View style={styles.resultsHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.resultsTitle}>{getMealName(analysisData)}</Text>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
          </TouchableOpacity>
        </View>
        {/* Main Calorie Card */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieHeader}>
            <Text style={styles.calorieValue}>{totalNutrition.calories}</Text>
            <Text style={styles.calorieUnit}>kcal</Text>
          </View>

          <View style={styles.calorieMetadata}>
            <Text style={styles.calorieDate}>{formattedDate}</Text>
            <View style={styles.calorieStats}>
              <Text style={styles.calorieStatItem}>3 meals</Text>
              <Text style={styles.calorieStatItem}>49 kcal remaining</Text>
            </View>
          </View>

          {/* Chart Visualization */}
          <View style={styles.chartContainer}>
            <View style={styles.chartArea}>
              {/* Chart lines */}
              <View style={styles.chartLines}>
                <View style={[styles.chartLine, styles.caloriesLine]} />
                <View style={[styles.chartLine, styles.carbsLine]} />
                <View style={[styles.chartLine, styles.fatLine]} />
                <View style={[styles.chartLine, styles.proteinLine]} />
              </View>

              {/* Data points */}
              <View style={styles.chartPoints}>
                {chartData.map((point, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chartPoint,
                      { left: `${(index / 6) * 100}%` },
                    ]}
                  >
                    <View style={[styles.dataPoint, styles.caloriesPoint]} />
                    <View style={[styles.dataPoint, styles.carbsPoint]} />
                    <View style={[styles.dataPoint, styles.fatPoint]} />
                    <View style={[styles.dataPoint, styles.proteinPoint]} />
                  </View>
                ))}
              </View>
            </View>

            {/* Chart Legend */}
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#10B981" }]}
                />
                <Text style={styles.legendText}>Calory</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#F59E0B" }]}
                />
                <Text style={styles.legendText}>Carbs</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#EF4444" }]}
                />
                <Text style={styles.legendText}>Fat</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#8B5CF6" }]}
                />
                <Text style={styles.legendText}>Protein</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nutrition Stats */}
        <View style={styles.nutritionStatsContainer}>
          <View style={styles.nutritionStatCard}>
            <Text style={styles.nutritionStatValue}>
              {totalNutrition.calories}
            </Text>
            <Text style={styles.nutritionStatUnit}>kcal</Text>
            <Text style={styles.nutritionStatLabel}>Calory gained</Text>
            <Text style={styles.nutritionStatPercentage}>52%</Text>
          </View>

          <View style={styles.nutritionStatCard}>
            <Text style={styles.nutritionStatValue}>
              {totalNutrition.carbs}
            </Text>
            <Text style={styles.nutritionStatUnit}>g</Text>
            <Text style={styles.nutritionStatLabel}>Carbs</Text>
            <Text style={styles.nutritionStatPercentage}>17%</Text>
          </View>
        </View>

        {/* Detailed Nutrition Grid */}
        <View style={styles.detailedNutritionContainer}>
          <Text style={styles.detailedNutritionTitle}>Nutrition Breakdown</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionGridItem}>
              <View
                style={[styles.nutritionIcon, { backgroundColor: "#FEE2E2" }]}
              >
                <Flame size={20} color="#EF4444" />
              </View>
              <Text style={styles.nutritionGridValue}>
                {totalNutrition.calories}
              </Text>
              <Text style={styles.nutritionGridLabel}>Calories</Text>
            </View>

            <View style={styles.nutritionGridItem}>
              <View
                style={[styles.nutritionIcon, { backgroundColor: "#DBEAFE" }]}
              >
                <Zap size={20} color="#3B82F6" />
              </View>
              <Text style={styles.nutritionGridValue}>
                {totalNutrition.protein}g
              </Text>
              <Text style={styles.nutritionGridLabel}>Protein</Text>
            </View>

            <View style={styles.nutritionGridItem}>
              <View
                style={[styles.nutritionIcon, { backgroundColor: "#FEF3C7" }]}
              >
                <Wheat size={20} color="#F59E0B" />
              </View>
              <Text style={styles.nutritionGridValue}>
                {totalNutrition.carbs}g
              </Text>
              <Text style={styles.nutritionGridLabel}>Carbs</Text>
            </View>

            <View style={styles.nutritionGridItem}>
              <View
                style={[styles.nutritionIcon, { backgroundColor: "#ECFDF5" }]}
              >
                <Droplets size={20} color="#10B981" />
              </View>
              <Text style={styles.nutritionGridValue}>
                {totalNutrition.fat}g
              </Text>
              <Text style={styles.nutritionGridLabel}>Fat</Text>
            </View>
          </View>

          {/* Additional Nutrition Details */}
          {(totalNutrition.fiber > 0 ||
            totalNutrition.sugar > 0 ||
            totalNutrition.sodium > 0) && (
            <View style={styles.additionalNutrition}>
              {totalNutrition.fiber > 0 && (
                <View style={styles.nutritionDetailRow}>
                  <Text style={styles.nutritionDetailLabel}>Fiber</Text>
                  <Text style={styles.nutritionDetailValue}>
                    {totalNutrition.fiber}g
                  </Text>
                </View>
              )}
              {totalNutrition.sugar > 0 && (
                <View style={styles.nutritionDetailRow}>
                  <Text style={styles.nutritionDetailLabel}>Sugar</Text>
                  <Text style={styles.nutritionDetailValue}>
                    {totalNutrition.sugar}g
                  </Text>
                </View>
              )}
              {totalNutrition.sodium > 0 && (
                <View style={styles.nutritionDetailRow}>
                  <Text style={styles.nutritionDetailLabel}>Sodium</Text>
                  <Text style={styles.nutritionDetailValue}>
                    {totalNutrition.sodium}mg
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Add Food Button */}
        <TouchableOpacity
          style={styles.addFoodButton}
          onPress={handleSaveMeal}
          disabled={isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.addFoodText}>Add food manual</Text>
              <Plus size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Ingredients List */}
        {(editedIngredients.length > 0 ||
          (analysisData.ingredients &&
            analysisData.ingredients.length > 0)) && (
          <View style={styles.ingredientsContainer}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.ingredientsTitle}>Ingredients</Text>
              <TouchableOpacity
                style={styles.addIngredientBtn}
                onPress={handleAddIngredient}
              >
                <Plus size={16} color="#10B981" />
              </TouchableOpacity>
            </View>
            {(editedIngredients.length > 0
              ? editedIngredients
              : analysisData.ingredients || []
            ).map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>
                    {typeof ingredient === "string"
                      ? ingredient
                      : ingredient.name}
                  </Text>
                  {typeof ingredient !== "string" && (
                    <Text style={styles.ingredientNutrition}>
                      {getNutritionValueForIngredient(ingredient, "calories")}{" "}
                      cal •{" "}
                      {getNutritionValueForIngredient(ingredient, "protein")}g
                      protein
                    </Text>
                  )}
                </View>
                <View style={styles.ingredientActions}>
                  <TouchableOpacity
                    onPress={() =>
                      handleEditIngredient(
                        typeof ingredient === "string"
                          ? {
                              name: ingredient,
                              calories: 0,
                              protein: 0,
                              carbs: 0,
                              fat: 0,
                            }
                          : ingredient,
                        index
                      )
                    }
                  >
                    <Edit3 size={16} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveIngredient(index)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Health Recommendations */}
        {(analysisData.recommendations || analysisData.healthNotes) && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>Health Insights</Text>
            <View style={styles.recommendationCard}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.recommendationText}>
                {analysisData.recommendations || analysisData.healthNotes}
              </Text>
            </View>
          </View>
        )}

        {/* Shopping List */}
        {(editedIngredients.length > 0 ||
          (analysisData.ingredients &&
            analysisData.ingredients.length > 0)) && (
          <View style={styles.shoppingListContainer}>
            <View style={styles.shoppingListHeader}>
              <Text style={styles.shoppingListTitle}>Shopping List</Text>
              <TouchableOpacity style={styles.shoppingListButton}>
                <ShoppingCart size={16} color="#10B981" />
                <Text style={styles.shoppingListButtonText}>Add to List</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.shoppingItems}>
              {(editedIngredients.length > 0
                ? editedIngredients
                : analysisData.ingredients || []
              )
                .slice(0, 3)
                .map((ingredient, index) => (
                  <View key={index} style={styles.shoppingItem}>
                    <Text style={styles.shoppingItemText}>
                      {typeof ingredient === "string"
                        ? ingredient
                        : ingredient.name}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteMeal}
          >
            <Trash2 size={18} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reanalyzeButton,
              isUpdating && styles.buttonDisabled,
            ]}
            onPress={handleReAnalyze}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <RefreshCw size={18} color="#10B981" />
            )}
            <Text style={styles.reanalyzeButtonText}>
              {isUpdating ? "Updating..." : "Re-analyze"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSelectedImage = () => (
    <View style={styles.selectedImageContainer}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: selectedImage! }} style={styles.selectedImage} />

        <View style={styles.imageActions}>
          <TouchableOpacity
            style={styles.imageActionButton}
            onPress={() => {
              resetAnalysisState();
              setSelectedImage(null);
              setShowResults(false);
            }}
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imageActionButton}
            onPress={handleTakePhoto}
          >
            <RotateCcw size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {!hasBeenAnalyzed && (
        <View style={styles.analyzeSection}>
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>Add details (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Describe ingredients, cooking method, or any special details..."
              placeholderTextColor="#9CA3AF"
              value={userComment}
              onChangeText={setUserComment}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.analyzeButton, isAnalyzing && styles.buttonDisabled]}
            onPress={handleAnalyzeImage}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <View style={styles.analyzingContent}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                <Text style={styles.analyzeSubtext}>
                  This may take a few seconds
                </Text>
              </View>
            ) : (
              <View style={styles.analyzeContent}>
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.analyzeButtonText}>Analyze Meal</Text>
                <Text style={styles.analyzeSubtext}>
                  Get detailed nutrition info
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingIndex >= 0 ? "Edit" : "Add"} Ingredient
            </Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={editingIngredient?.name || ""}
                onChangeText={(text) =>
                  setEditingIngredient((prev) =>
                    prev ? { ...prev, name: text } : null
                  )
                }
                placeholder="Enter ingredient name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.calories?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, calories: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.protein?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, protein: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.carbs?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, carbs: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.fat?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, fat: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Fiber (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.fiber?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, fiber: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Sugar (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.sugar?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, sugar: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sodium (mg)</Text>
              <TextInput
                style={styles.modalInput}
                value={editingIngredient?.sodium_mg?.toString() || "0"}
                onChangeText={(text) =>
                  setEditingIngredient((prev) =>
                    prev ? { ...prev, sodium_mg: parseFloat(text) || 0 } : null
                  )
                }
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveIngredient}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderDeleteConfirmModal = () => (
    <Modal
      visible={showDeleteConfirm}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowDeleteConfirm(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.confirmTitle}>Delete Analysis</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to delete this meal analysis?
          </Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.confirmCancelButton}
              onPress={() => setShowDeleteConfirm(false)}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmDeleteButton}
              onPress={confirmDeleteMeal}
            >
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          renderImageSelection()
        ) : (
          <>
            {renderSelectedImage()}
            {showResults && renderAnalysisResults()}
          </>
        )}
      </ScrollView>

      {renderEditModal()}
      {renderDeleteConfirmModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Image Selection Styles
  imageSelectionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  cameraIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  imageSelectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  imageSelectionSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  imageSelectionButtons: {
    width: "100%",
    gap: 16,
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },

  // Selected Image Styles
  selectedImageContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  imageWrapper: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#F3F4F6",
  },
  imageActions: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  imageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Analyze Section
  analyzeSection: {
    gap: 20,
  },
  commentContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    minHeight: 80,
    textAlignVertical: "top",
  },
  analyzeButton: {
    backgroundColor: "#10B981",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  analyzeContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 8,
  },
  analyzingContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 8,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  analyzeSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Results Container
  resultsContainer: {
    paddingHorizontal: 24,
  },

  // Header Styles
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  // Search Styles
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Calorie Card Styles
  calorieCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  calorieHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 56,
  },
  calorieUnit: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: -8,
  },
  calorieMetadata: {
    alignItems: "center",
    marginBottom: 24,
  },
  calorieDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
  },
  calorieStats: {
    flexDirection: "row",
    gap: 16,
  },
  calorieStatItem: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Chart Styles
  chartContainer: {
    height: 120,
  },
  chartArea: {
    height: 80,
    position: "relative",
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    padding: 10,
  },
  chartLines: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
  },
  chartLine: {
    position: "absolute",
    height: 3,
    borderRadius: 1.5,
  },
  caloriesLine: {
    backgroundColor: "#10B981",
    top: "15%",
    left: "5%",
    right: "5%",
    transform: [{ rotate: "2deg" }],
  },
  carbsLine: {
    backgroundColor: "#F59E0B",
    top: "35%",
    left: "8%",
    right: "8%",
    transform: [{ rotate: "-1deg" }],
  },
  fatLine: {
    backgroundColor: "#EF4444",
    top: "55%",
    left: "6%",
    right: "6%",
    transform: [{ rotate: "3deg" }],
  },
  proteinLine: {
    backgroundColor: "#8B5CF6",
    top: "25%",
    left: "4%",
    right: "4%",
    transform: [{ rotate: "-2deg" }],
  },
  chartPoints: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
  },
  chartPoint: {
    position: "absolute",
    width: 8,
    height: 8,
  },
  dataPoint: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  caloriesPoint: {
    backgroundColor: "#10B981",
    top: "15%",
  },
  carbsPoint: {
    backgroundColor: "#F59E0B",
    top: "35%",
  },
  fatPoint: {
    backgroundColor: "#EF4444",
    top: "55%",
  },
  proteinPoint: {
    backgroundColor: "#8B5CF6",
    top: "25%",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Nutrition Stats Styles
  nutritionStatsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  nutritionStatCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  nutritionStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  nutritionStatUnit: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  nutritionStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  nutritionStatPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },

  // Detailed Nutrition Grid
  detailedNutritionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  detailedNutritionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  nutritionGridItem: {
    flex: 1,
    minWidth: (screenWidth - 88) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  nutritionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  nutritionGridValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  nutritionGridLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  additionalNutrition: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 8,
  },
  nutritionDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  nutritionDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  nutritionDetailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },

  // Add Food Button
  addFoodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#064E3B",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
    shadowColor: "#064E3B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFoodText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Ingredients Styles
  ingredientsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  addIngredientBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    marginBottom: 4,
  },
  ingredientNutrition: {
    fontSize: 14,
    color: "#6B7280",
  },
  ingredientActions: {
    flexDirection: "row",
    gap: 12,
  },

  // Recommendations
  recommendationsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },

  // Shopping List
  shoppingListContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  shoppingListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  shoppingListTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  shoppingListButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  shoppingListButtonText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  shoppingItems: {
    gap: 8,
  },
  shoppingItem: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  shoppingItemText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  reanalyzeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  reanalyzeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: screenWidth - 48,
    maxHeight: "80%",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Confirm Modal Styles
  confirmModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

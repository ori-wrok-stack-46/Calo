import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import {
  analyzeMeal,
  updateMeal,
  postMeal,
  clearPendingMeal,
  clearError,
} from "@/src/store/mealSlice";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import {
  Camera,
  Send,
  CreditCard as Edit3,
  Trash2,
  Plus,
  RotateCcw,
  TriangleAlert as AlertTriangle,
  X,
  ChevronLeft,
} from "lucide-react-native";
import { useMealDataRefresh } from "@/hooks/useMealDataRefresh";
import { useTheme } from "@/src/context/ThemeContext";
import {
  ImageSelector,
  SelectedImage,
  NutritionOverview,
  IngredientsList,
  ActionButtons,
  HealthInsights,
  ScanningAnimation,
} from "@/components/camera";

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
  const { refreshAllMealData, refreshMealData, immediateRefresh } =
    useMealDataRefresh();
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showScanAnimation, setShowScanAnimation] = useState(false);

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

    // Show scanning animation
    setShowScanAnimation(true);

    try {
      const base64Image = await processImage(selectedImage);
      if (!base64Image) {
        setShowScanAnimation(false);
        Alert.alert(t("common.error"), "Could not process image.");
        return;
      }

      const analysisParams = {
        imageBase64: base64Image,
        language: isRTL ? "hebrew" : "english",
        includeDetailedIngredients: true,
        includeNutritionBreakdown: true,
        updateText: "",
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
        // Animation will be hidden by onScanComplete
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        setShowScanAnimation(false);
        Alert.alert(
          t("camera.analysis_failed"),
          typeof result.payload === "string"
            ? result.payload
            : "Failed to analyze meal. Please try again."
        );
      }
    } catch (error) {
      setShowScanAnimation(false);
      Alert.alert(
        t("camera.analysis_failed"),
        error instanceof Error ? error.message : "Analysis failed"
      );
    }
  };

  // Handle scanning animation completion
  const handleScanComplete = () => {
    setShowScanAnimation(false);
  };

  // Re-analysis after edits
  const handleReAnalyze = async () => {
    if (!selectedImage || !hasBeenAnalyzed) {
      Alert.alert(t("common.error") || "Error", "No meal to re-analyze");
      return;
    }

    // Show scanning animation
    setShowScanAnimation(true);

    try {
      // Trigger immediate cache refresh first
      await immediateRefresh();

      const base64Image = await processImage(selectedImage);
      if (!base64Image) {
        setShowScanAnimation(false);
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

      console.log("🔄 Starting re-analysis...");
      const result = await dispatch(analyzeMeal(reAnalysisParams)).unwrap();

      console.log("Re-analysis completed:", result);

      // Update local state immediately
      setAnalysisData(result.analysis);
      setEditedIngredients(result.analysis?.ingredients || []);
      setHasBeenAnalyzed(true);

      // Force complete cache invalidation and refresh
      await refreshAllMealData();

      // Hide scanning animation after successful completion
      setShowScanAnimation(false);

      console.log("✅ Re-analysis and cache refresh completed");

      Alert.alert(
        t("common.success") || "Success",
        t("camera.reAnalysisSuccess") || "Meal re-analyzed successfully!"
      );
    } catch (error) {
      setShowScanAnimation(false);
      console.error("❌ Re-analysis error:", error);
      Alert.alert(
        t("common.error") || "Error",
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
        ingredientSumCalories += getNutritionValue(ingredient, "calories");
        ingredientSumProtein +=
          getNutritionValue(ingredient, "protein_g") ||
          getNutritionValue(ingredient, "protein");
        ingredientSumCarbs +=
          getNutritionValue(ingredient, "carbs_g") ||
          getNutritionValue(ingredient, "carbs");
        ingredientSumFat +=
          getNutritionValue(ingredient, "fats_g") ||
          getNutritionValue(ingredient, "fat");
        ingredientSumFiber +=
          getNutritionValue(ingredient, "fiber_g") ||
          getNutritionValue(ingredient, "fiber");
        ingredientSumSugar +=
          getNutritionValue(ingredient, "sugar_g") ||
          getNutritionValue(ingredient, "sugar");
        ingredientSumSodium +=
          getNutritionValue(ingredient, "sodium_mg") ||
          getNutritionValue(ingredient, "sodium");
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

  const renderAnalysisResults = () => {
    if (!analysisData) return null;

    const totalNutrition = calculateTotalNutrition();

    return (
      <View style={styles.resultsContainer}>
        {/* Header */}
        <View
          style={[styles.resultsHeader, { backgroundColor: colors.background }]}
        >
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>
            {getMealName(analysisData)}
          </Text>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.emerald500 }]}
          >
            <View
              style={[styles.menuDot, { backgroundColor: colors.background }]}
            />
            <View
              style={[styles.menuDot, { backgroundColor: colors.background }]}
            />
            <View
              style={[styles.menuDot, { backgroundColor: colors.background }]}
            />
          </TouchableOpacity>
        </View>

        {/* Nutrition Overview */}
        <NutritionOverview
          nutrition={totalNutrition}
          mealName={getMealName(analysisData)}
        />

        {/* Action Buttons */}
        <ActionButtons
          onDelete={handleDeleteMeal}
          onReAnalyze={handleReAnalyze}
          onSave={handleSaveMeal}
          isUpdating={isUpdating}
          isPosting={isPosting}
        />

        {/* Ingredients List */}
        <IngredientsList
          ingredients={
            editedIngredients.length > 0
              ? editedIngredients
              : analysisData.ingredients || []
          }
          onEditIngredient={handleEditIngredient}
          onRemoveIngredient={handleRemoveIngredient}
          onAddIngredient={handleAddIngredient}
        />

        {/* Health Insights */}
        <HealthInsights
          recommendations={analysisData.recommendations}
          healthNotes={analysisData.healthNotes}
        />
      </View>
    );
  };

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
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingIndex >= 0 ? "Edit" : "Add"} Ingredient
            </Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Name *
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={editingIngredient?.name || ""}
                onChangeText={(text) =>
                  setEditingIngredient((prev) =>
                    prev ? { ...prev, name: text } : null
                  )
                }
                placeholder="Enter ingredient name"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Calories
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editingIngredient?.calories?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, calories: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Protein (g)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editingIngredient?.protein?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, protein: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Carbs (g)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editingIngredient?.carbs?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, carbs: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Fat (g)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editingIngredient?.fat?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, fat: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Fiber (g)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editingIngredient?.fiber?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, fiber: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Sugar (g)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editingIngredient?.sugar?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev ? { ...prev, sugar: parseFloat(text) || 0 } : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Sodium (mg)
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={editingIngredient?.sodium_mg?.toString() || "0"}
                onChangeText={(text) =>
                  setEditingIngredient((prev) =>
                    prev ? { ...prev, sodium_mg: parseFloat(text) || 0 } : null
                  )
                }
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.icon}
              />
            </View>
          </ScrollView>

          <View
            style={[styles.modalActions, { borderTopColor: colors.border }]}
          >
            <TouchableOpacity
              style={[
                styles.modalCancelButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.icon }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                { backgroundColor: colors.emerald500 },
              ]}
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
        <View
          style={[styles.confirmModalContent, { backgroundColor: colors.card }]}
        >
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={[styles.confirmTitle, { color: colors.text }]}>
            Delete Analysis
          </Text>
          <Text style={[styles.confirmMessage, { color: colors.icon }]}>
            Are you sure you want to delete this meal analysis?
          </Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[
                styles.confirmCancelButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowDeleteConfirm(false)}
            >
              <Text style={[styles.confirmCancelText, { color: colors.icon }]}>
                Cancel
              </Text>
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <ImageSelector
            onTakePhoto={handleTakePhoto}
            onSelectFromGallery={handleSelectFromGallery}
          />
        ) : (
          <>
            <SelectedImage
              imageUri={selectedImage}
              userComment={userComment}
              isAnalyzing={isAnalyzing}
              hasBeenAnalyzed={hasBeenAnalyzed}
              onRemoveImage={() => {
                resetAnalysisState();
                setSelectedImage(null);
                setShowResults(false);
              }}
              onRetakePhoto={handleTakePhoto}
              onAnalyze={handleAnalyzeImage}
              onCommentChange={setUserComment}
            />
            {showResults && analysisData && renderAnalysisResults()}
          </>
        )}
      </ScrollView>

      {renderEditModal()}
      {renderDeleteConfirmModal()}

      {/* Scanning Animation */}
      <ScanningAnimation
        visible={showScanAnimation}
        onComplete={handleScanComplete}
      />
    </SafeAreaView>
  );
}

// Process image with optimization and validation
const processImage = async (imageUri: string): Promise<string | null> => {
  try {
    console.log("Processing native image:", imageUri);

    if (!imageUri || imageUri.trim() === "") {
      console.error("Invalid image URI provided");
      return null;
    }

    // Get file info first
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      console.error("Image file does not exist");
      return null;
    }

    console.log("Image file size:", fileInfo.size);

    // Check if file is too small or too large
    if (fileInfo.size && fileInfo.size < 1000) {
      console.error("Image file is too small");
      return null;
    }

    if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
      // 10MB limit
      console.error("Image file is too large");
      return null;
    }

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64 || base64.length < 100) {
      console.error("Failed to read image or image too small");
      return null;
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64)) {
      console.error("Invalid base64 format generated");
      return null;
    }

    console.log("Native image processed, base64 length:", base64.length);
    return base64;
  } catch (error) {
    console.error("Error processing image:", error);
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  resultsContainer: {
    paddingHorizontal: 24,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  confirmModalContent: {
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
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 16,
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

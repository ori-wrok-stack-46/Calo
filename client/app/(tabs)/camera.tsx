import React, { useState, useEffect, useRef } from "react";
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
  Edit3,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
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
  Award,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useMealDataRefresh } from "@/hooks/useMealDataRefresh";

const { width: screenWidth } = Dimensions.get("window");

interface Ingredient {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium_mg?: number;
}

interface AnalysisData {
  meal_name: string;
  description?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_g?: number;
  ingredients: Ingredient[];
  healthScore?: string;
  recommendations?: string;
  cooking_method?: string;
  food_category?: string;
}

interface MealRating {
  taste: number;
  satisfaction: number;
  energy: number;
  overall: number;
}

export default function CameraScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { refreshAllMealData } = useMealDataRefresh();

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [mealRating, setMealRating] = useState<MealRating>({
    taste: 0,
    satisfaction: 0,
    energy: 0,
    overall: 0,
  });
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const nutritionCardAnim = useRef(new Animated.Value(0)).current;

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Clear error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Update local state when pending meal changes
  useEffect(() => {
    if (pendingMeal?.analysis) {
      setAnalysisData(pendingMeal.analysis);
      setEditedIngredients(pendingMeal.analysis.ingredients || []);
      setHasBeenAnalyzed(true);

      // Convert base64 to display format if needed
      if (pendingMeal.image_base_64) {
        const imageUri = pendingMeal.image_base_64.startsWith("data:")
          ? pendingMeal.image_base_64
          : `data:image/jpeg;base64,${pendingMeal.image_base_64}`;
        setSelectedImage(imageUri);
      }

      // Animate nutrition card appearance
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
  }, [pendingMeal]);

  // Image selection handlers
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("camera.permission"),
          "Camera permission is required to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        resetAnalysisState();
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

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        resetAnalysisState();
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert(t("common.error"), "Failed to select image");
    }
  };

  // Reset analysis state when new image is selected
  const resetAnalysisState = () => {
    setAnalysisData(null);
    setEditedIngredients([]);
    setUserComment("");
    setHasBeenAnalyzed(false);
    setIsFavorite(false);
    setMealRating({ taste: 0, satisfaction: 0, energy: 0, overall: 0 });
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
      console.log("🔍 Starting initial meal analysis...");

      // Process image to get base64
      const base64Image = await processImage(selectedImage);

      const analysisParams = {
        imageBase64: base64Image,
        language: isRTL ? "hebrew" : "english",
      };

      if (userComment.trim()) {
        analysisParams.updateText = userComment.trim();
      }

      const result = await dispatch(analyzeMeal(analysisParams));

      if (analyzeMeal.fulfilled.match(result)) {
        console.log("✅ Initial analysis completed successfully");
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        console.error("❌ Analysis failed:", result.payload);
        Alert.alert(
          t("camera.analysis_failed"),
          typeof result.payload === "string"
            ? result.payload
            : "Failed to analyze meal. Please try again."
        );
      }
    } catch (error) {
      console.error("💥 Analysis error:", error);
      Alert.alert(
        t("camera.analysis_failed"),
        error instanceof Error ? error.message : "Analysis failed"
      );
    }
  };

  // Re-analysis after edits
  const handleReAnalyze = async () => {
    if (!selectedImage || !hasBeenAnalyzed) {
      Alert.alert(t("common.error"), "No meal to re-analyze");
      return;
    }

    try {
      console.log("🔄 Starting re-analysis with edits...");

      const base64Image = await processImage(selectedImage);

      const reAnalysisParams = {
        imageBase64: base64Image,
        language: isRTL ? "hebrew" : "english",
        updateText: userComment.trim() || "User edited ingredients",
        editedIngredients: editedIngredients,
      };

      const result = await dispatch(analyzeMeal(reAnalysisParams));

      if (analyzeMeal.fulfilled.match(result)) {
        console.log("✅ Re-analysis completed successfully");
        Alert.alert(
          t("common.success"),
          "Meal re-analyzed successfully with your edits!"
        );
      } else {
        console.error("❌ Re-analysis failed:", result.payload);
        Alert.alert(
          t("camera.re_analysis_failed"),
          typeof result.payload === "string"
            ? result.payload
            : "Failed to re-analyze meal. Please try again."
        );
      }
    } catch (error) {
      console.error("💥 Re-analysis error:", error);
      Alert.alert(
        t("camera.re_analysis_failed"),
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
      console.log("💾 Saving meal to database...");

      const result = await dispatch(postMeal());

      if (postMeal.fulfilled.match(result)) {
        console.log("✅ Meal saved successfully");

        // Refresh meal data
        await refreshAllMealData();

        Alert.alert(t("camera.save_success"), "Meal saved successfully!", [
          {
            text: t("common.ok"),
            onPress: () => {
              resetAnalysisState();
              setSelectedImage(null);
            },
          },
        ]);
      } else {
        console.error("❌ Save failed:", result.payload);
        Alert.alert(
          t("camera.save_failed"),
          typeof result.payload === "string"
            ? result.payload
            : "Failed to save meal. Please try again."
        );
      }
    } catch (error) {
      console.error("💥 Save error:", error);
      Alert.alert(
        t("camera.save_failed"),
        error instanceof Error ? error.message : "Save failed"
      );
    }
  };

  // Delete meal (discard analysis)
  const handleDeleteMeal = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMeal = () => {
    console.log("🗑️ Deleting meal analysis...");

    resetAnalysisState();
    setSelectedImage(null);
    setShowDeleteConfirm(false);

    Alert.alert(t("common.success"), "Meal analysis deleted successfully");
  };

  // Rating handlers
  const handleRatingChange = (type: keyof MealRating, value: number) => {
    setMealRating((prev) => ({
      ...prev,
      [type]: value,
      overall: type === "overall" ? value : prev.overall,
    }));
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
      // Update existing ingredient
      updatedIngredients[editingIndex] = editingIngredient;
    } else {
      // Add new ingredient
      updatedIngredients.push(editingIngredient);
    }

    setEditedIngredients(updatedIngredients);
    setShowEditModal(false);
    setEditingIngredient(null);
    setEditingIndex(-1);
  };

  // Calculate total nutrition from ingredients
  const calculateTotalNutrition = (ingredients: Ingredient[]) => {
    return ingredients.reduce(
      (totals, ingredient) => ({
        calories: totals.calories + (ingredient.calories || 0),
        protein: totals.protein + (ingredient.protein || 0),
        carbs: totals.carbs + (ingredient.carbs || 0),
        fat: totals.fat + (ingredient.fat || 0),
        fiber: totals.fiber + (ingredient.fiber || 0),
        sugar: totals.sugar + (ingredient.sugar || 0),
        sodium: totals.sodium + (ingredient.sodium_mg || 0),
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      }
    );
  };

  // Get nutrition quality score
  const getNutritionQuality = () => {
    if (!analysisData) return { score: 0, label: "Unknown", color: "#9ca3af" };

    const calories = analysisData.calories || 0;
    const protein = analysisData.protein_g || 0;
    const fiber = analysisData.fiber_g || 0;
    const sugar = analysisData.sugar_g || 0;

    let score = 50; // Base score

    // Protein bonus
    if (protein > 20) score += 20;
    else if (protein > 10) score += 10;

    // Fiber bonus
    if (fiber > 10) score += 15;
    else if (fiber > 5) score += 8;

    // Sugar penalty
    if (sugar > 25) score -= 15;
    else if (sugar > 15) score -= 8;

    // Calorie balance
    if (calories > 100 && calories < 600) score += 10;

    score = Math.max(0, Math.min(100, score));

    if (score >= 80) return { score, label: "Excellent", color: "#10b981" };
    if (score >= 60) return { score, label: "Good", color: "#f59e0b" };
    if (score >= 40) return { score, label: "Fair", color: "#f97316" };
    return { score, label: "Poor", color: "#ef4444" };
  };

  // Render functions
  const renderImageSelection = () => (
    <View style={styles.imageSelectionContainer}>
      <LinearGradient
        colors={["#f0fdf4", "#ecfdf5"]}
        style={styles.imageSelectionGradient}
      >
        <View style={styles.imageSelectionHeader}>
          <Camera size={48} color="#10b981" />
          <Text style={[styles.imageSelectionTitle, isRTL && styles.rtlText]}>
            {t("camera.smart_analysis")}
          </Text>
          <Text
            style={[styles.imageSelectionSubtitle, isRTL && styles.rtlText]}
          >
            {t("camera.analysis_subtitle")}
          </Text>
        </View>

        <View style={styles.imageSelectionButtons}>
          <TouchableOpacity
            style={styles.imageSelectionButton}
            onPress={handleTakePhoto}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.imageButtonGradient}
            >
              <Camera size={24} color="#ffffff" />
              <Text style={styles.imageButtonText}>
                {t("camera.take_picture")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imageSelectionButton}
            onPress={handleSelectFromGallery}
          >
            <LinearGradient
              colors={["#059669", "#047857"]}
              style={styles.imageButtonGradient}
            >
              <ImageIcon size={24} color="#ffffff" />
              <Text style={styles.imageButtonText}>
                {t("camera.choose_gallery")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.tipContainer}>
          <Info size={20} color="#10b981" />
          <View style={styles.tipTextContainer}>
            <Text style={[styles.tipTitle, isRTL && styles.rtlText]}>
              {t("camera.optimal_results")}
            </Text>
            <Text style={[styles.tipDescription, isRTL && styles.rtlText]}>
              {t("camera.tip_description")}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderMealHeader = () => {
    if (!analysisData) return null;

    return (
      <Animated.View
        style={[
          styles.mealHeaderContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["#ffffff", "#f8fafc"]}
          style={styles.mealHeaderGradient}
        >
          <View style={styles.mealHeaderContent}>
            <View style={styles.mealTitleRow}>
              <Text style={[styles.mealTitle, isRTL && styles.rtlText]}>
                {analysisData.meal_name}
              </Text>
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  isFavorite && styles.favoriteActive,
                ]}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Heart
                  size={24}
                  color={isFavorite ? "#ffffff" : "#ef4444"}
                  fill={isFavorite ? "#ef4444" : "transparent"}
                />
              </TouchableOpacity>
            </View>

            {analysisData.description && (
              <Text style={[styles.mealDescription, isRTL && styles.rtlText]}>
                {analysisData.description}
              </Text>
            )}

            <View style={styles.mealMetaRow}>
              <View style={styles.metaItem}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.metaText}>
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              {analysisData.cooking_method && (
                <View style={styles.metaItem}>
                  <Apple size={16} color="#6b7280" />
                  <Text style={styles.metaText}>
                    {analysisData.cooking_method}
                  </Text>
                </View>
              )}

              <View style={styles.metaItem}>
                <Eye size={16} color="#6b7280" />
                <Text style={styles.metaText}>
                  {Math.round(
                    analysisData.healthScore
                      ? parseFloat(analysisData.healthScore)
                      : 75
                  )}
                  % confidence
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderNutritionSummary = () => {
    if (!analysisData) return null;

    const totalNutrition = calculateTotalNutrition(editedIngredients);
    const quality = getNutritionQuality();

    return (
      <Animated.View
        style={[
          styles.nutritionContainer,
          {
            opacity: nutritionCardAnim,
            transform: [{ scale: nutritionCardAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["#ffffff", "#f8fafc"]}
          style={styles.nutritionGradient}
        >
          <TouchableOpacity
            style={styles.nutritionHeader}
            onPress={() => setShowNutritionDetails(!showNutritionDetails)}
          >
            <View style={styles.nutritionTitleRow}>
              <Text style={[styles.nutritionTitle, isRTL && styles.rtlText]}>
                {t("camera.nutritional_info")}
              </Text>
              <View
                style={[
                  styles.qualityBadge,
                  { backgroundColor: quality.color },
                ]}
              >
                <Text style={styles.qualityText}>{quality.label}</Text>
              </View>
            </View>
            <ChevronDown
              size={20}
              color="#6b7280"
              style={[
                styles.chevron,
                showNutritionDetails && styles.chevronRotated,
              ]}
            />
          </TouchableOpacity>

          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionCard}>
              <Flame size={20} color="#ef4444" />
              <Text style={styles.nutritionValue}>
                {Math.round(totalNutrition.calories)}
              </Text>
              <Text style={styles.nutritionLabel}>
                {t("meals.calories") || "Calories"}
              </Text>
            </View>

            <View style={styles.nutritionCard}>
              <Zap size={20} color="#3b82f6" />
              <Text style={styles.nutritionValue}>
                {Math.round(totalNutrition.protein)}g
              </Text>
              <Text style={styles.nutritionLabel}>
                {t("meals.protein") || "Protein"}
              </Text>
            </View>

            <View style={styles.nutritionCard}>
              <Wheat size={20} color="#f59e0b" />
              <Text style={styles.nutritionValue}>
                {Math.round(totalNutrition.carbs)}g
              </Text>
              <Text style={styles.nutritionLabel}>
                {t("meals.carbs") || "Carbs"}
              </Text>
            </View>

            <View style={styles.nutritionCard}>
              <Droplets size={20} color="#8b5cf6" />
              <Text style={styles.nutritionValue}>
                {Math.round(totalNutrition.fat)}g
              </Text>
              <Text style={styles.nutritionLabel}>
                {t("meals.fat") || "Fat"}
              </Text>
            </View>
          </View>

          {showNutritionDetails && (
            <Animated.View style={styles.detailedNutrition}>
              {totalNutrition.fiber > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fiber:</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(totalNutrition.fiber)}g
                  </Text>
                </View>
              )}
              {totalNutrition.sugar > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sugar:</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(totalNutrition.sugar)}g
                  </Text>
                </View>
              )}
              {totalNutrition.sodium > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sodium:</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(totalNutrition.sodium)}mg
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderRatingSection = () => {
    if (!hasBeenAnalyzed) return null;

    const renderStars = (rating: number, onPress: (value: number) => void) => (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
          >
            <Star
              size={20}
              color={star <= rating ? "#fbbf24" : "#d1d5db"}
              fill={star <= rating ? "#fbbf24" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );

    return (
      <View style={styles.ratingContainer}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          Rate this meal
        </Text>

        <View style={styles.ratingGrid}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Taste</Text>
            {renderStars(mealRating.taste, (value) =>
              handleRatingChange("taste", value)
            )}
          </View>

          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Satisfaction</Text>
            {renderStars(mealRating.satisfaction, (value) =>
              handleRatingChange("satisfaction", value)
            )}
          </View>

          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Energy</Text>
            {renderStars(mealRating.energy, (value) =>
              handleRatingChange("energy", value)
            )}
          </View>

          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Overall</Text>
            {renderStars(mealRating.overall, (value) =>
              handleRatingChange("overall", value)
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSelectedImage = () => (
    <View style={styles.selectedImageContainer}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: selectedImage! }} style={styles.selectedImage} />

        {/* Image overlay with quick actions */}
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={() => {
              resetAnalysisState();
              setSelectedImage(null);
            }}
          >
            <X size={20} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.overlayButton}
            onPress={handleTakePhoto}
          >
            <RotateCcw size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {!hasBeenAnalyzed && (
        <View style={styles.commentContainer}>
          <Text style={[styles.commentLabel, isRTL && styles.rtlText]}>
            {t("camera.additional_info")}
          </Text>
          <TextInput
            style={[styles.commentInput, isRTL && styles.rtlTextInput]}
            placeholder={t("camera.enter_correction")}
            placeholderTextColor="#9ca3af"
            value={userComment}
            onChangeText={setUserComment}
            multiline
            numberOfLines={3}
            textAlign={isRTL ? "right" : "left"}
          />
        </View>
      )}

      {!hasBeenAnalyzed && (
        <TouchableOpacity
          style={[styles.analyzeButton, isAnalyzing && styles.buttonDisabled]}
          onPress={handleAnalyzeImage}
          disabled={isAnalyzing}
        >
          <LinearGradient
            colors={
              isAnalyzing ? ["#9ca3af", "#6b7280"] : ["#10b981", "#059669"]
            }
            style={styles.analyzeButtonGradient}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={20} color="#ffffff" />
            )}
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing ? t("camera.analyzing") : t("camera.analyze_photo")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAnalysisResults = () => {
    if (!analysisData) return null;

    return (
      <View style={styles.analysisContainer}>
        {renderMealHeader()}
        {renderNutritionSummary()}
        {renderRatingSection()}

        {/* Ingredients Section */}
        <View style={styles.ingredientsSection}>
          <View style={styles.ingredientsHeader}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              {t("camera.identified_ingredients")}
            </Text>
            <TouchableOpacity
              style={styles.addIngredientButton}
              onPress={handleAddIngredient}
            >
              <Plus size={16} color="#10b981" />
              <Text style={styles.addIngredientText}>{t("common.add")}</Text>
            </TouchableOpacity>
          </View>

          {editedIngredients.length > 0 ? (
            editedIngredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientCard}>
                <View style={styles.ingredientInfo}>
                  <Text
                    style={[styles.ingredientName, isRTL && styles.rtlText]}
                  >
                    {ingredient.name || `Ingredient ${index + 1}`}
                  </Text>
                  <View style={styles.ingredientNutrition}>
                    <Text style={styles.ingredientNutritionText}>
                      {Math.round(ingredient.calories || 0)}{" "}
                      {t("meals.kcal") || "kcal"} •{" "}
                      {Math.round(ingredient.protein || 0)}g{" "}
                      {t("meals.protein") || "protein"}
                    </Text>
                    {(ingredient.carbs || 0) > 0 && (
                      <Text style={styles.ingredientNutritionText}>
                        • {Math.round(ingredient.carbs)}g{" "}
                        {t("meals.carbs") || "carbs"}
                      </Text>
                    )}
                    {(ingredient.fat || 0) > 0 && (
                      <Text style={styles.ingredientNutritionText}>
                        • {Math.round(ingredient.fat)}g{" "}
                        {t("meals.fat") || "fat"}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.ingredientActions}>
                  <TouchableOpacity
                    style={styles.ingredientActionButton}
                    onPress={() => handleEditIngredient(ingredient, index)}
                  >
                    <Edit3 size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ingredientActionButton}
                    onPress={() => handleRemoveIngredient(index)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noIngredientsText}>
              {t("camera.no_ingredients_found") || "No ingredients identified"}
            </Text>
          )}
        </View>

        {/* Recommendations Section */}
        {analysisData.recommendations && (
          <View style={styles.recommendationsSection}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              AI Recommendations
            </Text>
            <View style={styles.recommendationCard}>
              <TrendingUp size={20} color="#10b981" />
              <Text
                style={[styles.recommendationText, isRTL && styles.rtlText]}
              >
                {analysisData.recommendations}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDeleteMeal}
          >
            <Trash2 size={20} color="#ef4444" />
            <Text style={styles.secondaryButtonText}>
              {t("camera.delete_analysis")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              isUpdating && styles.buttonDisabled,
            ]}
            onPress={handleReAnalyze}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <RefreshCw size={20} color="#10b981" />
            )}
            <Text style={styles.secondaryButtonText}>
              {isUpdating
                ? t("camera.updating_analysis")
                : t("camera.re_analyze")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, isPosting && styles.buttonDisabled]}
            onPress={handleSaveMeal}
            disabled={isPosting}
          >
            <LinearGradient
              colors={
                isPosting ? ["#9ca3af", "#6b7280"] : ["#10b981", "#059669"]
              }
              style={styles.primaryButtonGradient}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Save size={20} color="#ffffff" />
              )}
              <Text style={styles.primaryButtonText}>
                {isPosting ? t("common.loading") : t("camera.save_meal")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingIndex >= 0 ? t("common.edit") : t("common.add")}{" "}
              Ingredient
            </Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
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
                textAlign={isRTL ? "right" : "left"}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.calories?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev
                        ? {
                            ...prev,
                            calories: parseFloat(text) || 0,
                          }
                        : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.protein?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev
                        ? {
                            ...prev,
                            protein: parseFloat(text) || 0,
                          }
                        : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.carbs?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev
                        ? {
                            ...prev,
                            carbs: parseFloat(text) || 0,
                          }
                        : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.fat?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev
                        ? {
                            ...prev,
                            fat: parseFloat(text) || 0,
                          }
                        : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fiber (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.fiber?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev
                        ? {
                            ...prev,
                            fiber: parseFloat(text) || 0,
                          }
                        : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sugar (g)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingIngredient?.sugar?.toString() || "0"}
                  onChangeText={(text) =>
                    setEditingIngredient((prev) =>
                      prev
                        ? {
                            ...prev,
                            sugar: parseFloat(text) || 0,
                          }
                        : null
                    )
                  }
                  keyboardType="numeric"
                  placeholder="0"
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
                    prev
                      ? {
                          ...prev,
                          sodium_mg: parseFloat(text) || 0,
                        }
                      : null
                  )
                }
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveIngredient}
            >
              <Text style={styles.modalSaveText}>{t("common.save")}</Text>
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
          <AlertTriangle size={48} color="#ef4444" />
          <Text style={styles.confirmTitle}>{t("camera.delete_analysis")}</Text>
          <Text style={styles.confirmMessage}>
            {t("camera.delete_confirmation")}
          </Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.confirmCancelButton}
              onPress={() => setShowDeleteConfirm(false)}
            >
              <Text style={styles.confirmCancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmDeleteButton}
              onPress={confirmDeleteMeal}
            >
              <Text style={styles.confirmDeleteText}>{t("common.delete")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Error display
  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={20} color="#ef4444" />
        <Text style={[styles.errorText, isRTL && styles.rtlText]}>{error}</Text>
        <TouchableOpacity
          style={styles.errorDismiss}
          onPress={() => dispatch(clearError())}
        >
          <X size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>
            {t("camera.title")}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
            {t("camera.description")}
          </Text>
        </View>

        {/* Error Display */}
        {renderError()}

        {/* Main Content */}
        {!selectedImage ? (
          renderImageSelection()
        ) : (
          <>
            {renderSelectedImage()}
            {renderAnalysisResults()}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      {renderEditModal()}
      {renderDeleteConfirmModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rtlTextInput: {
    textAlign: "right",
  },

  // Error styles
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#dc2626",
    marginLeft: 12,
  },
  errorDismiss: {
    padding: 4,
  },

  // Image selection styles
  imageSelectionContainer: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  imageSelectionGradient: {
    padding: 32,
  },
  imageSelectionHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  imageSelectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#065f46",
    marginTop: 16,
    marginBottom: 8,
  },
  imageSelectionSubtitle: {
    fontSize: 16,
    color: "#047857",
    textAlign: "center",
    lineHeight: 24,
  },
  imageSelectionButtons: {
    gap: 16,
    marginBottom: 24,
  },
  imageSelectionButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  imageButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    color: "#047857",
    lineHeight: 18,
  },

  // Selected image styles
  selectedImageContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  imageWrapper: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  selectedImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#f3f4f6",
  },
  imageOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  overlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  commentContainer: {
    marginTop: 16,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#374151",
    minHeight: 80,
    textAlignVertical: "top",
  },
  analyzeButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },

  // Analysis results styles
  analysisContainer: {
    marginHorizontal: 24,
    gap: 20,
  },

  // Meal header styles
  mealHeaderContainer: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  mealHeaderGradient: {
    padding: 24,
  },
  mealHeaderContent: {
    gap: 12,
  },
  mealTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mealTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
    marginRight: 12,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteActive: {
    backgroundColor: "#ef4444",
  },
  mealDescription: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 22,
  },
  mealMetaRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },

  // Nutrition summary styles
  nutritionContainer: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  nutritionGradient: {
    padding: 20,
  },
  nutritionHeader: {
    marginBottom: 16,
  },
  nutritionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  chevron: {
    alignSelf: "center",
  },
  chevronRotated: {
    transform: [{ rotate: "180deg" }],
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nutritionCard: {
    flex: 1,
    minWidth: (screenWidth - 96) / 2 - 6,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
    marginTop: 8,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  detailedNutrition: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },

  // Rating styles
  ratingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  ratingGrid: {
    gap: 16,
  },
  ratingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  starButton: {
    padding: 4,
  },

  // Ingredients styles
  ingredientsSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  addIngredientButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b981",
    gap: 4,
  },
  addIngredientText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  ingredientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  ingredientNutrition: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ingredientNutritionText: {
    fontSize: 13,
    color: "#6b7280",
  },
  ingredientActions: {
    flexDirection: "row",
    gap: 8,
  },
  ingredientActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  noIngredientsText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },

  // Recommendations styles
  recommendationsSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: "#047857",
    lineHeight: 20,
  },

  // Action buttons styles
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: screenWidth - 48,
    maxHeight: "80%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#374151",
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },

  // Confirm modal styles
  confirmModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

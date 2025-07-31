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
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import {
  Camera as CameraIcon,
  Image as ImageIcon,
  Zap,
  Check,
  X,
  Edit3,
  Plus,
  Minus,
  Save,
  RotateCcw,
  Sparkles,
  Target,
  Flame,
  Droplets,
  AlertTriangle,
  Sun,
  Moon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { RootState, AppDispatch } from "@/src/store";
import {
  analyzeMeal,
  postMeal,
  updateMeal,
  clearPendingMeal,
  setPendingMealForUpdate,
} from "@/src/store/mealSlice";
import { fetchMeals } from "@/src/store/mealSlice";
import LoadingScreen from "@/components/LoadingScreen";

const { width, height } = Dimensions.get("window");

interface Ingredient {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export default function CameraScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { pendingMeal, isAnalyzing, isPosting, isUpdating, error } =
    useSelector((state: RootState) => state.meal);

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  // Camera and image states
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Analysis states
  const [userComment, setUserComment] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [editableIngredients, setEditableIngredients] = useState<Ingredient[]>(
    []
  );
  const [showIngredientsEditor, setShowIngredientsEditor] = useState(false);
  const [customIngredientName, setCustomIngredientName] = useState("");
  const [isDark, setIsDark] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const colors = {
    background: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    surface: isDark ? "#334155" : "#f1f5f9",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#cbd5e1" : "#64748b",
    textLight: isDark ? "#94a3b8" : "#9ca3af",
    primary: "#3b82f6",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    border: isDark ? "#475569" : "#e2e8f0",
    gradient: ["#3b82f6", "#1d4ed8"],
    gradientLight: isDark ? ["#1e293b", "#334155"] : ["#ffffff", "#f8fafc"],
  };

  useEffect(() => {
    // Animate in
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
    ]).start();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setShowCamera(false);
        setShowCommentModal(true);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert(t("common.error"), "Failed to take picture");
    }
  };

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need camera roll permissions to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setShowCommentModal(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("common.error"), "Failed to pick image");
    }
  };

  const processImageWithAI = async () => {
    if (!capturedImage) return;

    try {
      console.log("🔄 Starting AI analysis with user comment:", userComment);

      // Process image to base64
      let base64Image: string;

      if (capturedImage.startsWith("data:")) {
        base64Image = capturedImage.split(",")[1];
      } else {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          capturedImage,
          [{ resize: { width: 1024 } }],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        base64Image = manipulatedImage.base64 || "";
      }

      if (!base64Image) {
        throw new Error("Failed to process image");
      }

      console.log("📸 Image processed, base64 length:", base64Image.length);
      console.log("💬 User comment:", userComment);

      // Dispatch analysis with comment
      const result = await dispatch(
        analyzeMeal({
          imageBase64: base64Image,
          updateText: userComment.trim() || undefined,
          language: isRTL ? "he" : "en",
        })
      ).unwrap();

      console.log("✅ AI analysis completed:", result);

      // Set editable ingredients from analysis
      if (result.analysis?.ingredients) {
        setEditableIngredients(result.analysis.ingredients);
      }

      setShowCommentModal(false);
    } catch (error: any) {
      console.error("💥 Analysis error:", error);
      Alert.alert(
        t("camera.analysis_failed"),
        error.message || "Failed to analyze image"
      );
    }
  };

  const reanalyzeWithIngredients = async () => {
    if (!pendingMeal?.image_base_64) return;

    try {
      console.log(
        "🔄 Re-analyzing with custom ingredients:",
        editableIngredients
      );

      // Create ingredient description for AI
      const ingredientDescription = editableIngredients
        .map(
          (ing) =>
            `${ing.name}: ${ing.calories} calories, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`
        )
        .join("; ");

      const updateText =
        `Custom ingredients: ${ingredientDescription}. ${userComment}`.trim();

      const result = await dispatch(
        analyzeMeal({
          imageBase64: pendingMeal.image_base_64,
          updateText,
          language: isRTL ? "he" : "en",
        })
      ).unwrap();

      console.log("✅ Re-analysis completed:", result);
      setShowIngredientsEditor(false);
    } catch (error: any) {
      console.error("💥 Re-analysis error:", error);
      Alert.alert(
        t("camera.re_analysis_failed"),
        error.message || "Failed to re-analyze"
      );
    }
  };

  const addCustomIngredient = () => {
    if (!customIngredientName.trim()) return;

    const newIngredient: Ingredient = {
      name: customIngredientName.trim(),
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 3,
      fiber: 2,
      sugar: 5,
    };

    setEditableIngredients([...editableIngredients, newIngredient]);
    setCustomIngredientName("");
  };

  const removeIngredient = (index: number) => {
    setEditableIngredients(editableIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...editableIngredients];
    if (field === "name") {
      updated[index][field] = value;
    } else {
      updated[index][field] = parseFloat(value) || 0;
    }
    setEditableIngredients(updated);
  };

  const saveMeal = async () => {
    try {
      console.log("💾 Saving meal to database...");
      await dispatch(postMeal()).unwrap();
      console.log("✅ Meal saved successfully");

      Alert.alert(t("camera.save_success"), t("camera.save_success"), [
        {
          text: t("common.ok"),
          onPress: () => {
            dispatch(clearPendingMeal());
            setCapturedImage(null);
            setUserComment("");
            setEditableIngredients([]);
            router.push("/(tabs)");
          },
        },
      ]);
    } catch (error: any) {
      console.error("💥 Save error:", error);
      Alert.alert(
        t("camera.save_failed"),
        error.message || "Failed to save meal"
      );
    }
  };

  const discardAnalysis = () => {
    Alert.alert(t("camera.delete_analysis"), t("camera.delete_confirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          dispatch(clearPendingMeal());
          setCapturedImage(null);
          setUserComment("");
          setEditableIngredients([]);
        },
      },
    ]);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setUserComment("");
    setEditableIngredients([]);
    dispatch(clearPendingMeal());
    setShowCamera(true);
  };

  if (!permission) {
    return (
      <LoadingScreen
        text={isRTL ? "בודק הרשאות..." : "Checking permissions..."}
      />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={[styles.permissionText, { color: colors.text }]}>
          {t("camera.permission")}
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show camera view
  if (showCamera) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.3)"]}
            style={styles.cameraOverlay}
          >
            {/* Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraHeaderButton}
                onPress={() => setShowCamera(false)}
              >
                <BlurView intensity={20} style={styles.blurButton}>
                  <X size={24} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cameraHeaderButton}
                onPress={() => setIsDark(!isDark)}
              >
                <BlurView intensity={20} style={styles.blurButton}>
                  {isDark ? (
                    <Sun size={24} color="#FFFFFF" />
                  ) : (
                    <Moon size={24} color="#FFFFFF" />
                  )}
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Center guide */}
            <View style={styles.cameraGuide}>
              <View style={styles.guideBorder} />
              <Text style={styles.guideText}>Position food within frame</Text>
            </View>

            {/* Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImage}
              >
                <BlurView intensity={20} style={styles.blurButton}>
                  <ImageIcon size={24} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <LinearGradient
                  colors={colors.gradient}
                  style={styles.captureButtonGradient}
                >
                  <View style={styles.captureButtonInner} />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.placeholderButton} />
            </View>
          </LinearGradient>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Modern Header */}
      <LinearGradient colors={colors.gradientLight} style={styles.modernHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <CameraIcon size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {t("camera.title")}
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("camera.description")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.headerActionButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={() => setIsDark(!isDark)}
            >
              {isDark ? (
                <Sun size={20} color={colors.primary} />
              ) : (
                <Moon size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* No image captured yet */}
        {!capturedImage && !pendingMeal && (
          <Animated.View
            style={[
              styles.emptyState,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <LinearGradient
              colors={colors.gradientLight}
              style={styles.emptyStateCard}
            >
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Sparkles size={48} color={colors.primary} />
              </View>

              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t("camera.smart_analysis")}
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                {t("camera.analysis_subtitle")}
              </Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setShowCamera(true)}
                >
                  <LinearGradient
                    colors={colors.gradient}
                    style={styles.buttonGradient}
                  >
                    <CameraIcon size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      {t("camera.take_picture")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={pickImage}
                >
                  <ImageIcon size={20} color={colors.primary} />
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    {t("camera.choose_gallery")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.tipContainer,
                  {
                    backgroundColor: colors.warning + "20",
                    borderColor: colors.warning + "30",
                  },
                ]}
              >
                <AlertTriangle size={16} color={colors.warning} />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  {t("camera.tip_description")}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Image captured, waiting for analysis */}
        {capturedImage && !pendingMeal && (
          <View style={styles.analysisContainer}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.capturedImage}
            />
            <Text style={[styles.analysisTitle, { color: colors.text }]}>
              {t("camera.analysis_results")}
            </Text>
            <Text
              style={[styles.analysisSubtitle, { color: colors.textSecondary }]}
            >
              {isAnalyzing
                ? t("camera.analyzing_subtitle")
                : "Ready to analyze"}
            </Text>
          </View>
        )}

        {/* Loading states */}
        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={colors.gradientLight}
              style={styles.loadingCard}
            >
              <View
                style={[
                  styles.loadingIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Sparkles size={48} color={colors.primary} />
              </View>
              <Text style={[styles.loadingTitle, { color: colors.text }]}>
                {t("camera.analyzing_title")}
              </Text>
              <Text
                style={[
                  styles.loadingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t("camera.analyzing_subtitle")}
              </Text>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.loader}
              />
            </LinearGradient>
          </View>
        )}

        {/* Analysis results */}
        {pendingMeal?.analysis && (
          <View style={styles.resultsContainer}>
            <LinearGradient
              colors={colors.gradientLight}
              style={styles.resultsCard}
            >
              {/* Success Header */}
              <View style={styles.successHeader}>
                <View
                  style={[
                    styles.successIcon,
                    { backgroundColor: colors.success + "20" },
                  ]}
                >
                  <Check size={24} color={colors.success} />
                </View>
                <View style={styles.successContent}>
                  <Text style={[styles.successTitle, { color: colors.text }]}>
                    Analysis Complete!
                  </Text>
                  <Text
                    style={[
                      styles.successSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {pendingMeal.analysis.meal_name || "Analyzed Meal"}
                  </Text>
                </View>
              </View>

              {/* Nutrition Grid */}
              <View style={styles.nutritionGrid}>
                <View
                  style={[
                    styles.nutritionCard,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Flame size={20} color="#ef4444" />
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {Math.round(pendingMeal.analysis.calories || 0)}
                  </Text>
                  <Text
                    style={[styles.nutritionLabel, { color: colors.textLight }]}
                  >
                    {t("meals.calories")}
                  </Text>
                </View>

                <View
                  style={[
                    styles.nutritionCard,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Zap size={20} color="#8b5cf6" />
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {Math.round(pendingMeal.analysis.protein_g || 0)}g
                  </Text>
                  <Text
                    style={[styles.nutritionLabel, { color: colors.textLight }]}
                  >
                    {t("meals.protein")}
                  </Text>
                </View>

                <View
                  style={[
                    styles.nutritionCard,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Target size={20} color="#f59e0b" />
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {Math.round(pendingMeal.analysis.carbs_g || 0)}g
                  </Text>
                  <Text
                    style={[styles.nutritionLabel, { color: colors.textLight }]}
                  >
                    {t("meals.carbs")}
                  </Text>
                </View>

                <View
                  style={[
                    styles.nutritionCard,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Droplets size={20} color="#06b6d4" />
                  <Text style={[styles.nutritionValue, { color: colors.text }]}>
                    {Math.round(pendingMeal.analysis.fats_g || 0)}g
                  </Text>
                  <Text
                    style={[styles.nutritionLabel, { color: colors.textLight }]}
                  >
                    {t("meals.fat")}
                  </Text>
                </View>
              </View>

              {/* Ingredients */}
              {pendingMeal.analysis.ingredients &&
                pendingMeal.analysis.ingredients.length > 0 && (
                  <View style={styles.ingredientsSection}>
                    <View style={styles.sectionHeader}>
                      <Text
                        style={[styles.sectionTitle, { color: colors.text }]}
                      >
                        {t("camera.identified_ingredients")}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.editButton,
                          { backgroundColor: colors.primary + "15" },
                        ]}
                        onPress={() => {
                          setEditableIngredients(
                            pendingMeal.analysis?.ingredients || []
                          );
                          setShowIngredientsEditor(true);
                        }}
                      >
                        <Edit3 size={16} color={colors.primary} />
                        <Text
                          style={[
                            styles.editButtonText,
                            { color: colors.primary },
                          ]}
                        >
                          {t("camera.edit_ingredients")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.ingredientsList}>
                      {pendingMeal.analysis.ingredients.map(
                        (ingredient: any, index: number) => (
                          <View
                            key={index}
                            style={[
                              styles.ingredientChip,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.ingredientName,
                                { color: colors.text },
                              ]}
                            >
                              {typeof ingredient === "string"
                                ? ingredient
                                : ingredient.name}
                            </Text>
                            {typeof ingredient !== "string" && (
                              <Text
                                style={[
                                  styles.ingredientNutrition,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {ingredient.calories || 0} cal •{" "}
                                {ingredient.protein_g ||
                                  ingredient.protein ||
                                  0}
                                g protein
                              </Text>
                            )}
                          </View>
                        )
                      )}
                    </View>
                  </View>
                )}

              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.discardButton,
                    {
                      backgroundColor: colors.error + "15",
                      borderColor: colors.error + "30",
                    },
                  ]}
                  onPress={discardAnalysis}
                >
                  <X size={16} color={colors.error} />
                  <Text
                    style={[styles.actionButtonText, { color: colors.error }]}
                  >
                    {t("camera.discard")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.retakeButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={retakePhoto}
                >
                  <RotateCcw size={16} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("camera.retake_photo")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.saveButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={saveMeal}
                  disabled={isPosting}
                >
                  {isPosting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={16} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>
                        {t("camera.save_meal")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}
      </Animated.ScrollView>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={styles.modalBlur}>
            <View
              style={[styles.commentModal, { backgroundColor: colors.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Add Details (Optional)
                </Text>
                <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}
              >
                Add any additional information about your meal to improve
                analysis accuracy
              </Text>

              {capturedImage && (
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: capturedImage }}
                    style={styles.modalImage}
                  />
                </View>
              )}

              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g., 'I also ate toast with butter' or 'Large portion'"
                placeholderTextColor={colors.textLight}
                value={userComment}
                onChangeText={setUserComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.skipButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setUserComment("");
                    processImageWithAI();
                  }}
                >
                  <Text
                    style={[
                      styles.skipButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Skip & Analyze
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.analyzeButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={processImageWithAI}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Sparkles size={16} color="#FFFFFF" />
                      <Text style={styles.analyzeButtonText}>
                        Analyze with AI
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Ingredients Editor Modal */}
      <Modal
        visible={showIngredientsEditor}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIngredientsEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={styles.modalBlur}>
            <View
              style={[
                styles.ingredientsModal,
                { backgroundColor: colors.card },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t("camera.edit_ingredients")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowIngredientsEditor(false)}
                >
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}
              >
                {t("camera.edit_ingredients_description")}
              </Text>

              <ScrollView style={styles.ingredientsEditor}>
                {editableIngredients.map((ingredient, index) => (
                  <View
                    key={index}
                    style={[
                      styles.editableIngredient,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.ingredientHeader}>
                      <TextInput
                        style={[
                          styles.ingredientNameInput,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={ingredient.name}
                        onChangeText={(text) =>
                          updateIngredient(index, "name", text)
                        }
                        placeholder="Ingredient name"
                        placeholderTextColor={colors.textLight}
                      />
                      <TouchableOpacity
                        style={[
                          styles.removeIngredientButton,
                          { backgroundColor: colors.error + "20" },
                        ]}
                        onPress={() => removeIngredient(index)}
                      >
                        <Minus size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.nutritionInputs}>
                      <View style={styles.nutritionInput}>
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Calories
                        </Text>
                        <TextInput
                          style={[
                            styles.numberInput,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          value={(ingredient.calories ?? 0).toString()}
                          onChangeText={(text) =>
                            updateIngredient(index, "calories", text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.nutritionInput}>
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Protein (g)
                        </Text>
                        <TextInput
                          style={[
                            styles.numberInput,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          value={(ingredient.protein ?? 0).toString()}
                          onChangeText={(text) =>
                            updateIngredient(index, "protein", text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.nutritionInput}>
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Carbs (g)
                        </Text>
                        <TextInput
                          style={[
                            styles.numberInput,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          value={(ingredient.carbs ?? 0).toString()}
                          onChangeText={(text) =>
                            updateIngredient(index, "carbs", text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.nutritionInput}>
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Fat (g)
                        </Text>
                        <TextInput
                          style={[
                            styles.numberInput,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          value={(ingredient.fat ?? 0).toString()}
                          onChangeText={(text) =>
                            updateIngredient(index, "fat", text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                ))}

                {/* Add new ingredient */}
                <View style={styles.addIngredientSection}>
                  <TextInput
                    style={[
                      styles.newIngredientInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Add new ingredient..."
                    placeholderTextColor={colors.textLight}
                    value={customIngredientName}
                    onChangeText={setCustomIngredientName}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addIngredientButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={addCustomIngredient}
                    disabled={!customIngredientName.trim()}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowIngredientsEditor(false)}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.reanalyzeButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={reanalyzeWithIngredients}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Sparkles size={16} color="#FFFFFF" />
                      <Text style={styles.reanalyzeButtonText}>Re-analyze</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Modern Header
  modernHeader: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // Empty State
  emptyState: {
    flex: 1,
    minHeight: height * 0.7,
  },
  emptyStateCard: {
    flex: 1,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.8,
  },

  // Action Buttons
  actionButtons: {
    width: "100%",
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Camera
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  cameraHeaderButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  blurButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraGuide: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  guideBorder: {
    width: width * 0.8,
    height: width * 0.6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 16,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  guideText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  cameraControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  galleryButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
  },
  captureButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  placeholderButton: {
    width: 48,
    height: 48,
  },

  // Analysis
  analysisContainer: {
    padding: 24,
    alignItems: "center",
  },
  capturedImage: {
    width: width - 48,
    height: (width - 48) * 0.75,
    borderRadius: 16,
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  analysisSubtitle: {
    fontSize: 16,
    textAlign: "center",
  },

  // Results
  resultsContainer: {
    marginBottom: 24,
  },
  resultsCard: {
    borderRadius: 24,
    padding: 24,
  },
  successHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },

  // Nutrition Grid
  nutritionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  nutritionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },

  // Ingredients Section
  ingredientsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientChip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  ingredientNutrition: {
    fontSize: 12,
  },

  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
  },
  discardButton: {},
  retakeButton: {},
  saveButton: {
    flex: 2,
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Loading
  loadingContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  loadingCard: {
    width: "100%",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.8,
  },
  loader: {
    marginTop: 16,
  },

  // Permission
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  commentModal: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    width: width - 40,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  modalImage: {
    width: "100%",
    height: 200,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  skipButton: {
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  analyzeButton: {},
  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Ingredients Editor Modal
  ingredientsModal: {
    margin: 20,
    borderRadius: 16,
    width: width - 40,
    maxHeight: height * 0.9,
  },
  ingredientsEditor: {
    maxHeight: height * 0.5,
    padding: 20,
  },
  editableIngredient: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  ingredientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  ingredientNameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  removeIngredientButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  nutritionInputs: {
    flexDirection: "row",
    gap: 8,
  },
  nutritionInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "500",
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: "center",
  },
  addIngredientSection: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  newIngredientInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addIngredientButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  reanalyzeButton: {},
  reanalyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

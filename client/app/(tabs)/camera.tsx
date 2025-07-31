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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, CameraView } from "expo-camera";
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

  // Camera and image states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
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

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
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

  if (hasPermission === null) {
    return (
      <LoadingScreen
        text={isRTL ? "בודק הרשאות..." : "Checking permissions..."}
      />
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>{t("camera.permission")}</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={getCameraPermissions}
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
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("camera.title")}</Text>
        <Text style={styles.subtitle}>{t("camera.description")}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* No image captured yet */}
        {!capturedImage && !pendingMeal && (
          <View style={styles.emptyState}>
            <View style={styles.iconContainer}>
              <CameraIcon size={64} color="#10b981" />
            </View>
            <Text style={styles.emptyTitle}>{t("camera.smart_analysis")}</Text>
            <Text style={styles.emptySubtitle}>
              {t("camera.analysis_subtitle")}
            </Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setShowCamera(true)}
              >
                <CameraIcon size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {t("camera.take_picture")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={pickImage}
              >
                <ImageIcon size={20} color="#10b981" />
                <Text style={styles.secondaryButtonText}>
                  {t("camera.choose_gallery")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipContainer}>
              <AlertTriangle size={16} color="#f59e0b" />
              <Text style={styles.tipText}>{t("camera.tip_description")}</Text>
            </View>
          </View>
        )}

        {/* Image captured, waiting for analysis */}
        {capturedImage && !pendingMeal && (
          <View style={styles.analysisContainer}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.capturedImage}
            />
            <Text style={styles.analysisTitle}>
              {t("camera.analysis_results")}
            </Text>
            <Text style={styles.analysisSubtitle}>
              {isAnalyzing
                ? t("camera.analyzing_subtitle")
                : "Ready to analyze"}
            </Text>
          </View>
        )}

        {/* Analysis results */}
        {pendingMeal?.analysis && (
          <View style={styles.resultsContainer}>
            <LinearGradient
              colors={["#ecfdf5", "#f0fdf4"]}
              style={styles.resultsGradient}
            >
              {/* Meal header */}
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>
                    {pendingMeal.analysis.meal_name || "Analyzed Meal"}
                  </Text>
                  <Text style={styles.mealDescription}>
                    {pendingMeal.analysis.description ||
                      t("camera.estimated_values")}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Check size={16} color="#10b981" />
                  <Text style={styles.statusText}>
                    {t("camera.meal_analyzed")}
                  </Text>
                </View>
              </View>

              {/* Nutrition summary */}
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionCard}>
                  <Flame size={20} color="#ef4444" />
                  <Text style={styles.nutritionValue}>
                    {Math.round(pendingMeal.analysis.calories || 0)}
                  </Text>
                  <Text style={styles.nutritionLabel}>
                    {t("meals.calories")}
                  </Text>
                </View>
                <View style={styles.nutritionCard}>
                  <Zap size={20} color="#8b5cf6" />
                  <Text style={styles.nutritionValue}>
                    {Math.round(pendingMeal.analysis.protein_g || 0)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>
                    {t("meals.protein")}
                  </Text>
                </View>
                <View style={styles.nutritionCard}>
                  <Target size={20} color="#f59e0b" />
                  <Text style={styles.nutritionValue}>
                    {Math.round(pendingMeal.analysis.carbs_g || 0)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>{t("meals.carbs")}</Text>
                </View>
                <View style={styles.nutritionCard}>
                  <Droplets size={20} color="#06b6d4" />
                  <Text style={styles.nutritionValue}>
                    {Math.round(pendingMeal.analysis.fats_g || 0)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>{t("meals.fat")}</Text>
                </View>
              </View>

              {/* Ingredients list */}
              {pendingMeal.analysis.ingredients &&
                pendingMeal.analysis.ingredients.length > 0 && (
                  <View style={styles.ingredientsSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        {t("camera.identified_ingredients")}
                      </Text>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          setEditableIngredients(
                            pendingMeal.analysis?.ingredients || []
                          );
                          setShowIngredientsEditor(true);
                        }}
                      >
                        <Edit3 size={16} color="#10b981" />
                        <Text style={styles.editButtonText}>
                          {t("camera.edit_ingredients")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.ingredientsList}>
                      {pendingMeal.analysis.ingredients.map(
                        (ingredient: any, index: number) => (
                          <View key={index} style={styles.ingredientItem}>
                            <Text style={styles.ingredientName}>
                              {typeof ingredient === "string"
                                ? ingredient
                                : ingredient.name}
                            </Text>
                            {typeof ingredient !== "string" && (
                              <Text style={styles.ingredientNutrition}>
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

              {/* Action buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={discardAnalysis}
                >
                  <X size={16} color="#ef4444" />
                  <Text style={styles.discardButtonText}>
                    {t("camera.discard")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={retakePhoto}
                >
                  <RotateCcw size={16} color="#6b7280" />
                  <Text style={styles.retakeButtonText}>
                    {t("camera.retake_photo")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
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

        {/* Loading states */}
        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <Sparkles size={48} color="#10b981" />
            <Text style={styles.loadingTitle}>
              {t("camera.analyzing_title")}
            </Text>
            <Text style={styles.loadingSubtitle}>
              {t("camera.analyzing_subtitle")}
            </Text>
            <ActivityIndicator
              size="large"
              color="#10b981"
              style={styles.loader}
            />
          </View>
        )}
      </ScrollView>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentModal}>
            <Text style={styles.modalTitle}>Add Details (Optional)</Text>
            <Text style={styles.modalSubtitle}>
              Add any additional information about your meal to improve analysis
              accuracy
            </Text>

            {capturedImage && (
              <Image
                source={{ uri: capturedImage }}
                style={styles.modalImage}
              />
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="e.g., 'I also ate toast with butter' or 'Large portion'"
              value={userComment}
              onChangeText={setUserComment}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  setUserComment("");
                  processImageWithAI();
                }}
              >
                <Text style={styles.skipButtonText}>Skip & Analyze</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.analyzeButton}
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
          <View style={styles.ingredientsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("camera.edit_ingredients")}
              </Text>
              <TouchableOpacity onPress={() => setShowIngredientsEditor(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {t("camera.edit_ingredients_description")}
            </Text>

            <ScrollView style={styles.ingredientsEditor}>
              {editableIngredients.map((ingredient, index) => (
                <View key={index} style={styles.editableIngredient}>
                  <View style={styles.ingredientHeader}>
                    <TextInput
                      style={styles.ingredientNameInput}
                      value={ingredient.name}
                      onChangeText={(text) =>
                        updateIngredient(index, "name", text)
                      }
                      placeholder="Ingredient name"
                    />
                    <TouchableOpacity
                      style={styles.removeIngredientButton}
                      onPress={() => removeIngredient(index)}
                    >
                      <Minus size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.nutritionInputs}>
                    <View style={styles.nutritionInput}>
                      <Text style={styles.inputLabel}>Calories</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={(ingredient.calories ?? 0).toString()}
                        onChangeText={(text) =>
                          updateIngredient(index, "calories", text)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.nutritionInput}>
                      <Text style={styles.inputLabel}>Protein (g)</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={(ingredient.protein ?? 0).toString()}
                        onChangeText={(text) =>
                          updateIngredient(index, "protein", text)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.nutritionInput}>
                      <Text style={styles.inputLabel}>Carbs (g)</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={(ingredient.carbs ?? 0).toString()}
                        onChangeText={(text) =>
                          updateIngredient(index, "carbs", text)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.nutritionInput}>
                      <Text style={styles.inputLabel}>Fat (g)</Text>
                      <TextInput
                        style={styles.numberInput}
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
                  style={styles.newIngredientInput}
                  placeholder="Add new ingredient..."
                  value={customIngredientName}
                  onChangeText={setCustomIngredientName}
                />
                <TouchableOpacity
                  style={styles.addIngredientButton}
                  onPress={addCustomIngredient}
                  disabled={!customIngredientName.trim()}
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowIngredientsEditor(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reanalyzeButton}
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    minHeight: height * 0.6,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButtons: {
    width: "100%",
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#10b981",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "600",
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraControls: {
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
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
    color: "#1f2937",
    marginBottom: 8,
  },
  analysisSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  resultsContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  resultsGradient: {
    padding: 24,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  mealInfo: {
    flex: 1,
    marginRight: 16,
  },
  mealName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065f46",
  },
  nutritionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  nutritionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
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
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#10b981",
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  ingredientNutrition: {
    fontSize: 12,
    color: "#6b7280",
  },
  discardButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  discardButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  retakeButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#065f46",
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
  permissionText: {
    fontSize: 18,
    color: "#374151",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#10b981",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  commentModal: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 24,
    borderRadius: 16,
    width: width - 40,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#374151",
    backgroundColor: "#f9fafb",
    marginBottom: 24,
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  analyzeButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  ingredientsModal: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    width: width - 40,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  ingredientsEditor: {
    maxHeight: height * 0.5,
    padding: 20,
  },
  editableIngredient: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  removeIngredientButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
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
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
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
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  addIngredientButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  reanalyzeButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  reanalyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

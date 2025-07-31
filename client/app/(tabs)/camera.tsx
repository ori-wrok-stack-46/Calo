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
  Platform,
  SafeAreaView,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import {
  analyzeMeal,
  postMeal,
  updateMeal,
  clearPendingMeal,
  clearError,
  loadPendingMeal,
} from "@/src/store/mealSlice";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/src/i18n";

export default function CameraScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { pendingMeal, isAnalyzing, isPosting, isUpdating, error } =
    useSelector((state: RootState) => state.meal);

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [postedMealId, setPostedMealId] = useState<string | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string>("");
  const cameraRef = useRef<CameraView>(null);

  // Edit analysis modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState("");
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);

  // Load pending meal on component mount
  useEffect(() => {
    dispatch(loadPendingMeal());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [
        { text: "OK", onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  // Request media library permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          console.log("Media library permission not granted");
        }
      }
    })();
  }, []);

  // Check if we have a persisted meal ID
  useEffect(() => {
    const checkPersistedMealId = async () => {
      try {
        const savedMealId = await AsyncStorage.getItem("postedMealId");
        if (savedMealId && pendingMeal) {
          setPostedMealId(savedMealId);
        }
      } catch (error) {
        console.error("Error loading persisted meal ID:", error);
      }
    };

    if (pendingMeal) {
      checkPersistedMealId();
      if (pendingMeal.image_base_64) {
        setOriginalImageBase64(pendingMeal.image_base_64);
      }
    }
  }, [pendingMeal]);

  const saveMealId = async (mealId: string) => {
    try {
      await AsyncStorage.setItem("postedMealId", mealId);
    } catch (error) {
      console.error("Error saving meal ID:", error);
    }
  };

  const clearMealId = async () => {
    try {
      await AsyncStorage.removeItem("postedMealId");
    } catch (error) {
      console.error("Error clearing meal ID:", error);
    }
  };

  const validateAndProcessImage = (base64Data: string): string | null => {
    try {
      if (!base64Data || base64Data.trim() === "") {
        return null;
      }

      let cleanBase64 = base64Data;
      if (base64Data.startsWith("data:image/")) {
        const commaIndex = base64Data.indexOf(",");
        if (commaIndex !== -1) {
          cleanBase64 = base64Data.substring(commaIndex + 1);
        }
      }

      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleanBase64)) {
        return null;
      }

      if (cleanBase64.length < 1000) {
        return null;
      }

      return cleanBase64;
    } catch (error) {
      console.error("Error validating image:", error);
      return null;
    }
  };

  const analyzeImage = async (base64Image: string) => {
    try {
      const currentLanguage = i18n.language || "en";
      const validatedBase64 = validateAndProcessImage(base64Image);

      if (!validatedBase64) {
        Alert.alert("Error", "Invalid image. Please try again.");
        return;
      }

      setOriginalImageBase64(validatedBase64);
      setPostedMealId(null);
      await clearMealId();

      const result = await dispatch(
        analyzeMeal({
          imageBase64: validatedBase64,
          language: currentLanguage,
        })
      );

      if (!analyzeMeal.fulfilled.match(result)) {
        Alert.alert("Error", "Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert("Error", "Analysis failed. Please try again.");
    }
  };

  const analyzeImageWithText = async (additionalText: string) => {
    try {
      setIsEditingAnalysis(true);
      const currentLanguage = i18n.language || "en";
      const imageToUse = originalImageBase64 || pendingMeal?.image_base_64;

      if (!imageToUse) {
        Alert.alert("Error", "No image available for re-analysis.");
        return;
      }

      const validatedBase64 = validateAndProcessImage(imageToUse);
      if (!validatedBase64) {
        Alert.alert("Error", "Invalid image data.");
        return;
      }

      const result = await dispatch(
        analyzeMeal({
          imageBase64: validatedBase64,
          updateText: additionalText,
          language: currentLanguage,
        })
      );

      if (!analyzeMeal.fulfilled.match(result)) {
        Alert.alert("Error", "Re-analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Re-analysis error:", error);
      Alert.alert("Error", "Re-analysis failed. Please try again.");
    } finally {
      setIsEditingAnalysis(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          await analyzeImage(asset.base64);
        } else {
          Alert.alert("Error", "No image data available.");
        }
      }
    } catch (error) {
      console.error("Error in pickImage:", error);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isAnalyzing) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo && photo.base64) {
          setShowCamera(false);
          await analyzeImage(photo.base64);
        } else {
          Alert.alert("Error", "Failed to capture image.");
        }
      } catch (error) {
        console.error("Camera error:", error);
        Alert.alert("Error", "Failed to capture image.");
      }
    }
  };

  const handlePost = async () => {
    if (pendingMeal && !isPosting) {
      const result = await dispatch(postMeal());

      if (postMeal.fulfilled.match(result)) {
        const mealId = result.payload?.meal_id?.toString();
        if (mealId) {
          setPostedMealId(mealId);
          await saveMealId(mealId);
          Alert.alert("Success", "Meal saved successfully!");
        }
      } else {
        Alert.alert("Error", "Failed to save meal.");
      }
    }
  };

  const handleUpdate = () => {
    if (!postedMealId) {
      Alert.alert("Error", "Please save the meal first before updating.");
      return;
    }
    setShowUpdateModal(true);
    setUpdateText("");
  };

  const handleUpdateSubmit = async () => {
    if (!postedMealId || !updateText.trim()) {
      Alert.alert("Error", "Please enter update text.");
      return;
    }

    try {
      const result = await dispatch(
        updateMeal({
          meal_id: postedMealId,
          updateText: updateText.trim(),
        })
      );

      if (updateMeal.fulfilled.match(result)) {
        Alert.alert("Success", "Meal updated successfully!");
        setShowUpdateModal(false);
        setUpdateText("");

        // Clear the current state and reload the updated meal
        dispatch(clearPendingMeal());
        setPostedMealId(null);
        setOriginalImageBase64("");
        await clearMealId();

        // Reload the updated meal if available in the result
        if (result.payload) {
          // The updated meal should be automatically loaded by the store
          dispatch(loadPendingMeal());
        }
      } else {
        Alert.alert("Error", "Failed to update meal.");
      }
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update meal.");
    }
  };

  const handleDiscard = async () => {
    Alert.alert("Confirm", "Are you sure you want to discard this analysis?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: async () => {
          dispatch(clearPendingMeal());
          setPostedMealId(null);
          setOriginalImageBase64("");
          await clearMealId();
        },
      },
    ]);
  };

  const handleEditAnalysis = () => {
    setEditText("");
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) {
      Alert.alert("Error", "Please enter correction text.");
      return;
    }

    try {
      setShowEditModal(false);
      await analyzeImageWithText(editText.trim());
      setEditText("");
    } catch (error) {
      console.error("Edit analysis error:", error);
      Alert.alert("Error", "Failed to re-analyze.");
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={80} color={styles.primary.color} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera permission to analyze your meals
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
          >
            <Text style={styles.primaryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Take Picture</Text>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() =>
                  setFacing((current) =>
                    current === "back" ? "front" : "back"
                  )
                }
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraCenter}>
              <View style={styles.focusFrame} />
              <Text style={styles.focusText}>
                Position your meal within the frame for best results
              </Text>
            </View>

            <View style={styles.cameraFooter}>
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  isAnalyzing && styles.captureButtonDisabled,
                ]}
                onPress={takePicture}
                disabled={isAnalyzing}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  if (pendingMeal) {
    const isPosted = !!postedMealId;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.analysisContainer}>
            {/* Image Display */}
            <View style={styles.imageCard}>
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${pendingMeal.image_base_64}`,
                }}
                style={styles.mealImage}
              />
              <View style={styles.statusBadge}>
                <Ionicons
                  name={isPosted ? "checkmark-circle" : "analytics"}
                  size={16}
                  color="white"
                />
                <Text style={styles.statusText}>
                  {isPosted ? "Meal Saved" : "Analyzed"}
                </Text>
              </View>
            </View>

            {/* Analysis Results */}
            <View style={styles.analysisCard}>
              <Text style={styles.mealName}>
                {pendingMeal.analysis?.meal_name ||
                  pendingMeal.analysis?.description ||
                  "Analyzed Meal"}
              </Text>

              {pendingMeal.analysis?.description && (
                <Text style={styles.mealDescription}>
                  {pendingMeal.analysis.description}
                </Text>
              )}

              {/* Nutrition Facts */}
              <View style={styles.nutritionSection}>
                <Text style={styles.sectionTitle}>Nutrition Facts</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Ionicons
                      name="flame"
                      size={20}
                      color={styles.primary.color}
                    />
                    <Text style={styles.nutritionValue}>
                      {Math.round(pendingMeal.analysis?.calories || 0)}
                    </Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Ionicons
                      name="fitness"
                      size={20}
                      color={styles.primary.color}
                    />
                    <Text style={styles.nutritionValue}>
                      {Math.round(pendingMeal.analysis?.protein_g || 0)}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Ionicons
                      name="leaf"
                      size={20}
                      color={styles.primary.color}
                    />
                    <Text style={styles.nutritionValue}>
                      {Math.round(pendingMeal.analysis?.carbs_g || 0)}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Ionicons
                      name="water"
                      size={20}
                      color={styles.primary.color}
                    />
                    <Text style={styles.nutritionValue}>
                      {Math.round(pendingMeal.analysis?.fats_g || 0)}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Fats</Text>
                  </View>
                </View>
              </View>

              {/* Ingredients */}
              {pendingMeal.analysis?.ingredients &&
                pendingMeal.analysis.ingredients.length > 0 && (
                  <View style={styles.ingredientsSection}>
                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    <View style={styles.ingredientsList}>
                      {pendingMeal.analysis.ingredients.map(
                        (ingredient, index) => (
                          <View key={index} style={styles.ingredientItem}>
                            <Text style={styles.ingredientName}>
                              {ingredient.name}
                            </Text>
                            <Text style={styles.ingredientCalories}>
                              {Math.round(ingredient.calories || 0)} cal
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                )}

              {/* Health Notes */}
              {pendingMeal.analysis?.health_risk_notes && (
                <View style={styles.healthSection}>
                  <Text style={styles.sectionTitle}>Health Insights</Text>
                  <Text style={styles.healthText}>
                    {pendingMeal.analysis.health_risk_notes}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.discardButton]}
                onPress={handleDiscard}
                disabled={isPosting || isUpdating || isEditingAnalysis}
              >
                <Ionicons name="trash" size={20} color="#dc2626" />
                <Text style={styles.discardButtonText}>
                  {isPosted ? "Clear" : "Discard"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEditAnalysis}
                disabled={isPosting || isUpdating || isEditingAnalysis}
              >
                {isEditingAnalysis ? (
                  <ActivityIndicator
                    color={styles.primary.color}
                    size="small"
                  />
                ) : (
                  <Ionicons
                    name="create"
                    size={20}
                    color={styles.primary.color}
                  />
                )}
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              {!isPosted ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handlePost}
                  disabled={isPosting || isUpdating || isEditingAnalysis}
                >
                  {isPosting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  )}
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleUpdate}
                  disabled={isPosting || isUpdating || isEditingAnalysis}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="refresh" size={20} color="white" />
                  )}
                  <Text style={styles.primaryButtonText}>Update</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Update Modal */}
          <Modal
            visible={showUpdateModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowUpdateModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Update Analysis</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowUpdateModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Add additional information to improve the analysis
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="Enter additional details..."
                  placeholderTextColor="#999"
                  value={updateText}
                  onChangeText={setUpdateText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus={true}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowUpdateModal(false)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleUpdateSubmit}
                    disabled={!updateText.trim() || isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Edit Analysis Modal */}
          <Modal
            visible={showEditModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Analysis</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Provide corrections or additional context
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="Enter corrections or context..."
                  placeholderTextColor="#999"
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus={true}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowEditModal(false)}
                    disabled={isEditingAnalysis}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleEditSubmit}
                    disabled={!editText.trim() || isEditingAnalysis}
                  >
                    {isEditingAnalysis ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Re-analyze</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Smart Food Analysis</Text>
          <Text style={styles.subtitle}>
            Discover nutrition insights with AI-powered food recognition
          </Text>
        </View>

        {(isAnalyzing || isEditingAnalysis) && (
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={styles.primary.color} />
            <Text style={styles.analyzingTitle}>
              {isEditingAnalysis ? "Updating Analysis" : "Analyzing Your Meal"}
            </Text>
            <Text style={styles.analyzingText}>
              Please wait while we process your image...
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.mainButton,
              styles.primaryButton,
              (isAnalyzing || isEditingAnalysis) && styles.buttonDisabled,
            ]}
            onPress={() => setShowCamera(true)}
            disabled={isAnalyzing || isEditingAnalysis}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Take Picture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mainButton,
              styles.secondaryButton,
              (isAnalyzing || isEditingAnalysis) && styles.buttonDisabled,
            ]}
            onPress={pickImage}
            disabled={isAnalyzing || isEditingAnalysis}
          >
            <Ionicons name="images" size={24} color={styles.primary.color} />
            <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color={styles.primary.color} />
            <Text style={styles.tipText}>
              For best results, ensure good lighting and capture the entire meal
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  primary: {
    color: "#065f46",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flex: 1,
  },
  homeContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#065f46",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: {
    color: "#065f46",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#065f46",
    lineHeight: 20,
  },
  analyzingCard: {
    backgroundColor: "#f9fafb",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  analyzingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#065f46",
    marginTop: 16,
    marginBottom: 8,
  },
  analyzingText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#065f46",
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  cameraTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  focusFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  focusText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    maxWidth: 280,
  },
  cameraFooter: {
    alignItems: "center",
    paddingBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#065f46",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  analysisContainer: {
    padding: 20,
  },
  imageCard: {
    position: "relative",
    marginBottom: 20,
  },
  mealImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#065f46",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  analysisCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  mealName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 8,
  },
  mealDescription: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 24,
  },
  nutritionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#065f46",
    marginTop: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "500",
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#065f46",
  },
  ingredientCalories: {
    fontSize: 12,
    color: "#6b7280",
  },
  healthSection: {
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  healthText: {
    fontSize: 14,
    color: "#065f46",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  discardButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  discardButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  editButtonText: {
    color: "#065f46",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
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
    color: "#065f46",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 20,
    textAlignVertical: "top",
    backgroundColor: "#f9fafb",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
});

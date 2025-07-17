import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Camera, CameraType, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import {
  QrCode,
  Camera as CameraIcon,
  Sparkles,
  Plus,
  Minus,
  Check,
  X,
  AlertTriangle,
  Shield,
  Heart,
  Leaf,
  Zap,
  Apple,
  Clock,
  BarChart3,
  Info,
  Star,
  Trash2,
  History,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { api } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface ProductData {
  barcode?: string;
  name: string;
  brand?: string;
  category: string;
  nutrition_per_100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  ingredients: string[];
  allergens: string[];
  labels: string[];
  health_score?: number;
  image_url?: string;
}

interface UserAnalysis {
  compatibility_score: number;
  daily_contribution: {
    calories_percent: number;
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  };
  alerts: string[];
  recommendations: string[];
  health_assessment: string;
}

interface ScanResult {
  product: ProductData;
  user_analysis: UserAnalysis;
}

export default function FoodScannerScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Camera and scanning states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "image">("barcode");
  const [isLoading, setIsLoading] = useState(false);

  // Product and analysis states
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
  const [showResults, setShowResults] = useState(false);

  // UI states
  const [barcodeInput, setBarcodeInput] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAddingToMeal, setIsAddingToMeal] = useState(false);
  const [showAddToMeal, setShowAddToMeal] = useState(false);
  const [mealRating, setMealRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [scannedFood, setScannedFood] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [scannedHistory, setScannedHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const texts = {
    title: language === "he" ? "סורק מזון חכם" : "Smart Food Scanner",
    subtitle:
      language === "he"
        ? "סרוק ברקוד או תמונה לניתוח תזונתי מיידי"
        : "Scan barcode or image for instant nutritional analysis",
    scanBarcode: language === "he" ? "סרוק ברקוד" : "Scan Barcode",
    scanImage: language === "he" ? "סרוק תמונה" : "Scan Image",
    manualEntry: language === "he" ? "הזנה ידנית" : "Manual Entry",
    enterBarcode: language === "he" ? "הכנס ברקוד" : "Enter Barcode",
    scan: language === "he" ? "סרוק" : "Scan",
    quantity: language === "he" ? "כמות (גרם)" : "Quantity (grams)",
    addToMeal: language === "he" ? "הוסף לארוחה" : "Add to Meal",
    nutritionPer100g:
      language === "he" ? "ערכים תזונתיים ל-100 גרם" : "Nutrition per 100g",
    compatibility:
      language === "he" ? "תאימות אישית" : "Personal Compatibility",
    dailyContribution: language === "he" ? "תרומה יומית" : "Daily Contribution",
    alerts: language === "he" ? "התראות" : "Alerts",
    recommendations: language === "he" ? "המלצות" : "Recommendations",
    healthAssessment: language === "he" ? "הערכה תזונתית" : "Health Assessment",
    calories: language === "he" ? "קלוריות" : "Calories",
    protein: language === "he" ? "חלבון" : "Protein",
    carbs: language === "he" ? "פחמימות" : "Carbs",
    fat: language === "he" ? "שומן" : "Fat",
    fiber: language === "he" ? "סיבים" : "Fiber",
    sugar: language === "he" ? "סוכר" : "Sugar",
    sodium: language === "he" ? "נתרן" : "Sodium",
    ingredients: language === "he" ? "רכיבים" : "Ingredients",
    allergens: language === "he" ? "אלרגנים" : "Allergens",
    labels: language === "he" ? "תוויות" : "Labels",
    healthScore: language === "he" ? "ניקוד בריאות" : "Health Score",
    scanning: language === "he" ? "סורק..." : "Scanning...",
    scanSuccess: language === "he" ? "סריקה הושלמה!" : "Scan Complete!",
    scanError: language === "he" ? "שגיאה בסריקה" : "Scan Error",
    noResults: language === "he" ? "לא נמצאו תוצאות" : "No Results Found",
    history: language === "he" ? "היסטוריה" : "History",
    recentScans: language === "he" ? "סריקות אחרונות" : "Recent Scans",
    clear: language === "he" ? "נקה" : "Clear",
    close: language === "he" ? "סגור" : "Close",
    added: language === "he" ? "נוסף!" : "Added!",
    addingToMeal: language === "he" ? "מוסיף לארוחה..." : "Adding to meal...",
    g: language === "he" ? "גר'" : "g",
    mg: language === "he" ? 'מ"ג' : "mg",
    kcal: language === "he" ? 'קק"ל' : "kcal",
    percent: "%",
  };

  useEffect(() => {
    getCameraPermissions();
    loadScanHistory();

    // Animate screen entrance
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const loadScanHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await api.get("/food-scanner/history");
      if (response.data.success) {
        setScanHistory(response.data.data);
        setScannedHistory(response.data.data);
      }
    } catch (error) {
      console.error("Error loading scan history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) {
      Alert.alert(
        texts.scanError,
        language === "he" ? "אנא הכנס ברקוד" : "Please enter a barcode"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/food-scanner/barcode", {
        barcode: barcodeInput.trim(),
      });

      if (response.data.success) {
        setScanResult(response.data.data);
        setProductData(response.data.data.product);
        setUserAnalysis(response.data.data.user_analysis);
        animateResultAppearance();
        setShowResults(true);
      } else {
        Alert.alert(texts.scanError, response.data.error || texts.noResults);
      }
    } catch (error) {
      console.error("Barcode scan error:", error);
      Alert.alert(texts.scanError, texts.noResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScan = async (scanningResult: any) => {
    if (isLoading) return;

    setIsLoading(true);
    setIsScanning(false);

    try {
      const response = await api.post("/food-scanner/barcode", {
        barcode: scanningResult.data,
      });

      if (response.data.success && response.data.data) {
        setScanResult(response.data.data);
        setProductData(response.data.data.product);
        setUserAnalysis(response.data.data.user_analysis);
        animateResultAppearance();
        setShowResults(true);
      } else {
        Alert.alert(
          texts.scanError,
          language === "he" ? "מוצר לא נמצא במאגר" : "Product not found"
        );
      }
    } catch (error) {
      console.error("Barcode scan error:", error);
      Alert.alert(texts.scanError, texts.noResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageScan = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsLoading(true);

        try {
          const response = await api.post("/food-scanner/image", {
            image: result.assets[0].base64,
          });

          if (response.data.success && response.data.data) {
            setScanResult(response.data.data);
            setProductData(response.data.data.product);
            setUserAnalysis(response.data.data.user_analysis);
            animateResultAppearance();
            setShowResults(true);
          } else {
            Alert.alert(
              texts.scanError,
              language === "he"
                ? "לא הצלחנו לזהות את המוצר בתמונה"
                : "Could not identify product in image"
            );
          }
        } catch (error) {
          console.error("Image scan error:", error);
          Alert.alert(
            texts.scanError,
            language === "he" ? "שגיאה בסריקת התמונה" : "Error scanning image"
          );
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert(
        texts.scanError,
        language === "he"
          ? "לא הצלחנו לפתוח את המצלמה"
          : "Could not open camera"
      );
    }
  };

  const animateResultAppearance = () => {
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddToMeal = async () => {
    if (!scanResult) return;

    setIsAddingToMeal(true);
    try {
      const response = await api.post("/food-scanner/add-to-meal", {
        productData: scanResult.product,
        quantity,
        mealTiming: "SNACK",
      });

      if (response.data.success) {
        Alert.alert(
          texts.added,
          language === "he"
            ? `${scanResult.product.name} נוסף בהצלחה לרישום הארוחות`
            : `${scanResult.product.name} added successfully to meal log`
        );
        setShowAddModal(false);
        setScanResult(null);
        setBarcodeInput("");
        setQuantity(100);
        setShowResults(false);
      } else {
        Alert.alert(texts.scanError, response.data.error);
      }
    } catch (error) {
      console.error("Add to meal error:", error);
      Alert.alert(texts.scanError, texts.scanError);
    } finally {
      setIsAddingToMeal(false);
    }
  };

  const addToMealLog = async (mealTiming: string) => {
    if (!productData) return;

    try {
      setIsLoading(true);

      const response = await api.post("/food-scanner/add-to-meal", {
        productData: productData,
        quantity: parseInt(quantity.toString()),
        mealTiming: mealTiming,
      });

      if (response.data.success) {
        Alert.alert("הצלחה", "המוצר נוסף ליומן הארוחות שלך");
        setShowAddToMeal(false);
        setShowResults(false);
      } else {
        Alert.alert(
          "שגיאה",
          response.data.error || "לא הצלחנו להוסיף את המוצר ליומן"
        );
      }
    } catch (error) {
      console.error("Add to meal error:", error);
      Alert.alert("שגיאה", "לא הצלחנו להוסיף את המוצר ליומן");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#FF9800";
    if (score >= 40) return "#FF5722";
    return "#F44336";
  };

  const getHealthDeviationColor = (rate: number) => {
    if (rate <= 10) return "#4CAF50"; // Green - Good
    if (rate <= 25) return "#FF9800"; // Orange - Moderate
    return "#F44336"; // Red - High deviation
  };

  const renderNutritionCard = (
    label: string,
    value: number,
    unit: string,
    icon: React.ReactNode,
    color: string
  ) => (
    <View style={[styles.nutritionCard, { borderLeftColor: color }]}>
      <View style={styles.nutritionHeader}>
        <View style={[styles.nutritionIcon, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        <Text style={styles.nutritionLabel}>{label}</Text>
      </View>
      <Text style={[styles.nutritionValue, { color }]}>
        {value.toFixed(1)} {unit}
      </Text>
    </View>
  );

  const renderCompatibilityScore = (score: number) => {
    const color = score >= 80 ? "#2ECC71" : score >= 60 ? "#F39C12" : "#E74C3C";
    const label = score >= 80 ? "מצוין" : score >= 60 ? "טוב" : "זהירות";

    return (
      <View style={styles.compatibilityContainer}>
        <LinearGradient
          colors={[`${color}15`, `${color}05`]}
          style={styles.compatibilityGradient}
        >
          <View style={styles.compatibilityHeader}>
            <Star size={24} color={color} />
            <Text style={styles.compatibilityTitle}>{texts.compatibility}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreValue, { color }]}>{score}/100</Text>
            <Text style={[styles.scoreLabel, { color }]}>
              {language === "he"
                ? label
                : score >= 80
                ? "Excellent"
                : score >= 60
                ? "Good"
                : "Caution"}
            </Text>
          </View>
          <View style={styles.scoreProgressBg}>
            <LinearGradient
              colors={[color, `${color}80`]}
              style={[styles.scoreProgress, { width: `${score}%` }]}
            />
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderNutritionInfo = () => {
    if (!productData) return null;

    const nutrition = productData.nutrition_per_100g;
    const qty = parseInt(quantity.toString()) / 100;

    return (
      <View style={styles.nutritionContainer}>
        <Text style={styles.sectionTitle}>ערכים תזונתיים ל-{quantity} גרם</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(nutrition.calories * qty)}
            </Text>
            <Text style={styles.nutritionLabel}>קלוריות</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(nutrition.protein * qty)}ג
            </Text>
            <Text style={styles.nutritionLabel}>חלבון</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(nutrition.carbs * qty)}ג
            </Text>
            <Text style={styles.nutritionLabel}>פחמימות</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(nutrition.fat * qty)}ג
            </Text>
            <Text style={styles.nutritionLabel}>שומן</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUserAnalysis = () => {
    if (!userAnalysis) return null;

    return (
      <View style={styles.analysisContainer}>
        <Text style={styles.sectionTitle}>ניתוח אישי</Text>

        <View style={styles.scoreContainer}>
          <View
            style={[
              styles.scoreCircle,
              { borderColor: getScoreColor(userAnalysis.compatibility_score) },
            ]}
          >
            <Text
              style={[
                styles.scoreText,
                { color: getScoreColor(userAnalysis.compatibility_score) },
              ]}
            >
              {userAnalysis.compatibility_score}
            </Text>
          </View>
          <Text style={styles.healthAssessment}>
            {userAnalysis.health_assessment}
          </Text>
        </View>

        {userAnalysis.alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <Text style={styles.alertsTitle}>התראות:</Text>
            {userAnalysis.alerts.map((alert, index) => (
              <Text key={index} style={styles.alertText}>
                {alert}
              </Text>
            ))}
          </View>
        )}

        {userAnalysis.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>המלצות:</Text>
            {userAnalysis.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationText}>
                {rec}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMealComponents = () => {
    if (!productData || !productData.ingredients) return null;

    return (
      <View style={styles.componentsContainer}>
        <Text style={styles.sectionTitle}>{texts.ingredients}</Text>
        <View style={styles.componentsGrid}>
          {productData.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.componentItem}>
              <Text style={styles.componentName}>{ingredient}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRatingSection = () => {
    if (hasRated) return null;

    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.sectionTitle}>דרג את המוצר</Text>
        <Text style={styles.ratingDescription}>
          איך היית מדרג את המוצר הזה?
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setMealRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= mealRating ? "star" : "star-outline"}
                size={32}
                color={star <= mealRating ? "#FFD700" : "#ddd"}
              />
            </TouchableOpacity>
          ))}
        </View>
        {mealRating > 0 && (
          <TouchableOpacity
            style={styles.submitRatingButton}
            onPress={() => {
              setHasRated(true);
              Alert.alert("Success", "Rating saved successfully!");
            }}
          >
            <Text style={styles.submitRatingText}>שמור דירוג</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A085" />
        <Text>מבקש הרשאות מצלמה...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.noPermissionContainer}>
        <Ionicons name="camera" size={48} color="#666" />
        <Text style={styles.noPermissionText}>
          נדרשת הרשאה למצלמה כדי לסרוק מוצרים
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={getCameraPermissions}
        >
          <Text style={styles.permissionButtonText}>הענק הרשאה</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnimation,
              transform: [
                {
                  translateY: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View>
            <Text style={styles.title}>{texts.title}</Text>
            <Text style={styles.subtitle}>{texts.subtitle}</Text>
          </View>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => {
              setShowHistoryModal(true);
              loadScanHistory();
            }}
          >
            <History size={24} color="#16A085" />
          </TouchableOpacity>
        </Animated.View>

        {/* Scan Options */}
        <Animated.View
          style={[
            styles.scanOptions,
            {
              opacity: fadeAnimation,
              transform: [{ scale: scaleAnimation }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(22, 160, 133, 0.1)", "rgba(22, 160, 133, 0.05)"]}
            style={styles.scanOptionsGradient}
          >
            {/* Mode Selector */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === "barcode" && styles.activeModeButton,
                ]}
                onPress={() => setScanMode("barcode")}
              >
                <QrCode
                  size={20}
                  color={scanMode === "barcode" ? "#fff" : "#666"}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    scanMode === "barcode" && styles.activeModeButtonText,
                  ]}
                >
                  ברקוד
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === "image" && styles.activeModeButton,
                ]}
                onPress={() => setScanMode("image")}
              >
                <CameraIcon
                  size={20}
                  color={scanMode === "image" ? "#fff" : "#666"}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    scanMode === "image" && styles.activeModeButtonText,
                  ]}
                >
                  תמונה
                </Text>
              </TouchableOpacity>
            </View>

            {scanMode === "barcode" ? (
              <>
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setIsScanning(true)}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#16A085", "#1ABC9C"]}
                    style={styles.scanButtonGradient}
                  >
                    <QrCode size={32} color="#FFFFFF" />
                    <Text style={styles.scanButtonText}>
                      {texts.scanBarcode}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.manualEntry}>
                  <View style={styles.inputContainer}>
                    <QrCode size={20} color="#7F8C8D" />
                    <TextInput
                      style={styles.barcodeInput}
                      placeholder={texts.enterBarcode}
                      placeholderTextColor="#7F8C8D"
                      value={barcodeInput}
                      onChangeText={setBarcodeInput}
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.scanButtonSmall}
                    onPress={handleBarcodeSearch}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.scanButtonSmallText}>
                        {texts.scan}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleImageScan}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#16A085", "#1ABC9C"]}
                  style={styles.scanButtonGradient}
                >
                  <CameraIcon size={32} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>{texts.scanImage}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Camera View for Barcode */}
        {isScanning && scanMode === "barcode" && (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarcodeScan}
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "upc_a", "code128", "code39"],
              }}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanInstructions}>
                  כוון את הברקוד למרכז המסגרת
                </Text>
              </View>
            </CameraView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsScanning(false)}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan Result */}
        {scanResult && (
          <Animated.View
            style={[
              styles.resultContainer,
              {
                opacity: fadeAnimation,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          >
            <BlurView intensity={20} style={styles.resultBlur}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.9)",
                  "rgba(255, 255, 255, 0.7)",
                ]}
                style={styles.resultGradient}
              >
                {/* Product Header */}
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {scanResult.product.name}
                    </Text>
                    {scanResult.product.brand && (
                      <Text style={styles.productBrand}>
                        {scanResult.product.brand}
                      </Text>
                    )}
                    <Text style={styles.productCategory}>
                      {scanResult.product.category}
                    </Text>
                  </View>
                  {scanResult.product.health_score && (
                    <View style={styles.healthScoreContainer}>
                      <Text style={styles.healthScoreLabel}>
                        {texts.healthScore}
                      </Text>
                      <Text style={styles.healthScoreValue}>
                        {scanResult.product.health_score}/100
                      </Text>
                    </View>
                  )}
                </View>

                {/* Compatibility Score */}
                {renderCompatibilityScore(
                  scanResult.user_analysis.compatibility_score
                )}

                {/* Nutrition Facts */}
                <View style={styles.nutritionSection}>
                  <Text style={styles.sectionTitle}>
                    {texts.nutritionPer100g}
                  </Text>
                  <View style={styles.nutritionGrid}>
                    {renderNutritionCard(
                      texts.calories,
                      scanResult.product.nutrition_per_100g.calories,
                      texts.kcal,
                      <Zap size={16} color="#E74C3C" />,
                      "#E74C3C"
                    )}
                    {renderNutritionCard(
                      texts.protein,
                      scanResult.product.nutrition_per_100g.protein,
                      texts.g,
                      <Heart size={16} color="#9B59B6" />,
                      "#9B59B6"
                    )}
                    {renderNutritionCard(
                      texts.carbs,
                      scanResult.product.nutrition_per_100g.carbs,
                      texts.g,
                      <Apple size={16} color="#F39C12" />,
                      "#F39C12"
                    )}
                    {renderNutritionCard(
                      texts.fat,
                      scanResult.product.nutrition_per_100g.fat,
                      texts.g,
                      <Leaf size={16} color="#16A085" />,
                      "#16A085"
                    )}
                  </View>
                </View>

                {/* Daily Contribution */}
                <View style={styles.contributionSection}>
                  <Text style={styles.sectionTitle}>
                    {texts.dailyContribution}
                  </Text>
                  <View style={styles.contributionGrid}>
                    {Object.entries(
                      scanResult.user_analysis.daily_contribution
                    ).map(([key, value]) => (
                      <View key={key} style={styles.contributionItem}>
                        <Text style={styles.contributionLabel}>
                          {key === "calories_percent"
                            ? texts.calories
                            : key === "protein_percent"
                            ? texts.protein
                            : key === "carbs_percent"
                            ? texts.carbs
                            : texts.fat}
                        </Text>
                        <Text style={styles.contributionValue}>
                          {value.toFixed(1)}
                          {texts.percent}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Alerts */}
                {scanResult.user_analysis.alerts.length > 0 && (
                  <View style={styles.alertsSection}>
                    <Text style={styles.sectionTitle}>{texts.alerts}</Text>
                    {scanResult.user_analysis.alerts.map((alert, index) => (
                      <View key={index} style={styles.alertItem}>
                        <AlertTriangle size={16} color="#E74C3C" />
                        <Text style={styles.alertText}>{alert}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recommendations */}
                {scanResult.user_analysis.recommendations.length > 0 && (
                  <View style={styles.recommendationsSection}>
                    <Text style={styles.sectionTitle}>
                      {texts.recommendations}
                    </Text>
                    {scanResult.user_analysis.recommendations.map(
                      (rec, index) => (
                        <View key={index} style={styles.recommendationItem}>
                          <Sparkles size={16} color="#16A085" />
                          <Text style={styles.recommendationText}>{rec}</Text>
                        </View>
                      )
                    )}
                  </View>
                )}

                {/* Health Assessment */}
                <View style={styles.assessmentSection}>
                  <Text style={styles.sectionTitle}>
                    {texts.healthAssessment}
                  </Text>
                  <View style={styles.assessmentContainer}>
                    <Shield size={20} color="#16A085" />
                    <Text style={styles.assessmentText}>
                      {scanResult.user_analysis.health_assessment}
                    </Text>
                  </View>
                </View>

                {/* Add to Meal Button */}
                <TouchableOpacity
                  style={styles.addToMealButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <LinearGradient
                    colors={["#16A085", "#1ABC9C"]}
                    style={styles.addToMealGradient}
                  >
                    <Plus size={20} color="#FFFFFF" />
                    <Text style={styles.addToMealText}>{texts.addToMeal}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A085" />
            <Text style={styles.loadingText}>מעבד את המוצר...</Text>
          </View>
        )}

        {/* Add to Meal Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{texts.addToMeal}</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.modalContent}>
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>{texts.quantity}</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 10))}
                  >
                    <Minus size={20} color="#16A085" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity.toString()}
                    onChangeText={(text) => setQuantity(parseInt(text) || 1)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(quantity + 10)}
                  >
                    <Plus size={20} color="#16A085" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddToMeal}
                disabled={isAddingToMeal}
              >
                <LinearGradient
                  colors={["#16A085", "#1ABC9C"]}
                  style={styles.confirmGradient}
                >
                  {isAddingToMeal ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={20} color="#FFFFFF" />
                      <Text style={styles.confirmText}>{texts.addToMeal}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* History Modal */}
        <Modal
          visible={showHistoryModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowHistoryModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{texts.recentScans}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.historyContent}>
              {isLoadingHistory ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#16A085" />
                </View>
              ) : scanHistory.length > 0 ? (
                scanHistory.map((item, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemName}>
                        {item.product_name || item.name}
                      </Text>
                      <Text style={styles.historyItemBrand}>{item.brand}</Text>
                      <Text style={styles.historyItemDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <BarChart3 size={64} color="#BDC3C7" />
                  <Text style={styles.emptyHistoryText}>
                    {language === "he"
                      ? "אין היסטוריית סריקות"
                      : "No scan history"}
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Results Modal - Original Design */}
        <Modal
          visible={showResults}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>תוצאות סריקה</Text>
              <TouchableOpacity onPress={() => setShowAddToMeal(true)}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.resultsContainer}>
              {productData && (
                <>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{productData.name}</Text>
                    {productData.brand && (
                      <Text style={styles.productBrand}>
                        {productData.brand}
                      </Text>
                    )}
                    <Text style={styles.productCategory}>
                      {productData.category}
                    </Text>
                  </View>

                  <View style={styles.quantitySelector}>
                    <Text style={styles.quantityLabel}>כמות (גרם):</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity.toString()}
                      onChangeText={(text) =>
                        setQuantity(parseInt(text) || 100)
                      }
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                  </View>

                  {renderNutritionInfo()}
                  {renderUserAnalysis()}
                  {renderMealComponents()}
                  {renderRatingSection()}

                  {productData.allergens.length > 0 && (
                    <View style={styles.allergensContainer}>
                      <Text style={styles.sectionTitle}>אלרגנים</Text>
                      <Text style={styles.allergensText}>
                        {productData.allergens.join(", ")}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Add to Meal Modal - Original Design */}
        <Modal
          visible={showAddToMeal}
          animationType="slide"
          presentationStyle="formSheet"
        >
          <SafeAreaView style={styles.addMealContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddToMeal(false)}>
                <Text style={styles.cancelText}>ביטול</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>הוסף ליומן ארוחות</Text>
              <View style={{ width: 50 }} />
            </View>

            <View style={styles.mealTimingsContainer}>
              <Text style={styles.mealTimingsTitle}>בחר זמן ארוחה:</Text>
              {["BREAKFAST", "LUNCH", "DINNER", "SNACK"].map((timing) => (
                <TouchableOpacity
                  key={timing}
                  style={styles.mealTimingButton}
                  onPress={() => addToMealLog(timing)}
                >
                  <Text style={styles.mealTimingText}>
                    {timing === "BREAKFAST"
                      ? "ארוחת בוקר"
                      : timing === "LUNCH"
                      ? "ארוחת צהריים"
                      : timing === "DINNER"
                      ? "ארוחת ערב"
                      : "חטיף"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 4,
  },
  historyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(22, 160, 133, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanOptions: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  scanOptionsGradient: {
    padding: 24,
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  activeModeButton: {
    backgroundColor: "#16A085",
  },
  modeButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  activeModeButtonText: {
    color: "#fff",
  },
  scanButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  manualEntry: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  barcodeInput: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
  },
  scanButtonSmall: {
    backgroundColor: "#16A085",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scanButtonSmallText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cameraContainer: {
    flex: 1,
    height: 400,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 8,
  },
  scanInstructions: {
    color: "#fff",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  cancelButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  resultContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  resultBlur: {
    borderRadius: 20,
  },
  resultGradient: {
    padding: 24,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 14,
    color: "#95A5A6",
  },
  healthScoreContainer: {
    alignItems: "center",
    backgroundColor: "rgba(22, 160, 133, 0.1)",
    borderRadius: 12,
    padding: 12,
  },
  healthScoreLabel: {
    fontSize: 12,
    color: "#16A085",
    marginBottom: 4,
  },
  healthScoreValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16A085",
  },
  compatibilityContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  compatibilityGradient: {
    padding: 16,
  },
  compatibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  compatibilityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  scoreProgressBg: {
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  scoreProgress: {
    height: "100%",
    borderRadius: 3,
  },
  nutritionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  nutritionGrid: {
    gap: 12,
  },
  nutritionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  nutritionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nutritionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  nutritionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2C3E50",
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  contributionSection: {
    marginBottom: 20,
  },
  contributionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contributionItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  contributionLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  contributionValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16A085",
  },
  alertsSection: {
    marginBottom: 20,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: "#E74C3C",
  },
  recommendationsSection: {
    marginBottom: 20,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22, 160, 133, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: "#16A085",
  },
  assessmentSection: {
    marginBottom: 20,
  },
  assessmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  assessmentText: {
    flex: 1,
    fontSize: 14,
    color: "#2C3E50",
    lineHeight: 20,
  },
  addToMealButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  addToMealGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  addToMealText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  quantitySection: {
    marginBottom: 30,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(22, 160, 133, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  historyContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  historyItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyItemContent: {
    gap: 4,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  historyItemBrand: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  historyItemDate: {
    fontSize: 12,
    color: "#95A5A6",
  },
  emptyHistory: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyHistoryText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noPermissionText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
  permissionButton: {
    backgroundColor: "#16A085",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  nutritionContainer: {
    padding: 16,
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  analysisContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  healthAssessment: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  alertsContainer: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
    textAlign: "right",
  },
  recommendationsContainer: {
    backgroundColor: "#d1ecf1",
    padding: 12,
    borderRadius: 8,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0c5460",
    marginBottom: 8,
    textAlign: "right",
  },
  componentsContainer: {
    marginVertical: 16,
    paddingHorizontal: 12,
  },
  componentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  componentItem: {
    backgroundColor: "#eee",
    borderRadius: 8,
    padding: 8,
    margin: 4,
  },
  componentName: {
    fontSize: 14,
  },
  ratingContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginVertical: 16,
    alignItems: "center",
  },
  ratingDescription: {
    fontSize: 14,
    color: "#666",
    marginVertical: 8,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  starButton: {
    marginHorizontal: 6,
  },
  submitRatingButton: {
    backgroundColor: "#16A085",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 8,
  },
  submitRatingText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  allergensContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#f8d7da",
  },
  allergensText: {
    fontSize: 14,
    color: "#721c24",
    lineHeight: 20,
    textAlign: "right",
  },
  addMealContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  cancelText: {
    color: "#16A085",
    fontSize: 16,
  },
  mealTimingsContainer: {
    padding: 16,
  },
  mealTimingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "right",
  },
  mealTimingButton: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  mealTimingText: {
    fontSize: 16,
    textAlign: "right",
    color: "#333",
  },
});

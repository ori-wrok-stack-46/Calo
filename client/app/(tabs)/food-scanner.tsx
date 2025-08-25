import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  Animated,
  Platform,
  Image,
  Switch,
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
  Wheat,
  Droplet,
  CircleDot,
  ShoppingCart,
  Scale,
  DollarSign,
  Package,
  Utensils,
  Eye,
  RotateCcw,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { api } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import LoadingScreen from "@/components/LoadingScreen";
import ElementLoader from '@/components/ElementLoader';
import ButtonLoader from '@/components/ButtonLoader';
import { ToastService } from '@/src/services/totastService';

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
    saturated_fat?: number;
    trans_fat?: number;
    cholesterol?: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
    vitamin_c?: number;
    vitamin_d?: number;
  };
  ingredients: string[];
  allergens: string[];
  labels: string[];
  health_score?: number;
  image_url?: string;
  serving_size?: string;
  servings_per_container?: number;
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

interface PriceEstimate {
  estimated_price: number;
  price_range: string;
  currency: string;
  confidence: string;
  market_context: string;
}

export default function FoodScannerScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === "he";

  // Camera and scanning states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "image">("barcode");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  // Product and analysis states
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Input states
  const [barcodeInput, setBarcodeInput] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [isBeverage, setIsBeverage] = useState(false);

  // UI states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const texts = {
    title: isRTL ? "סורק מזון חכם" : "Smart Food Scanner",
    subtitle: isRTL
      ? "סרוק ברקוד או תמונה לניתוח תזונתי מיידי"
      : "Scan barcode or image for instant nutritional analysis",
    scanBarcode: isRTL ? "סרוק ברקוד" : "Scan Barcode",
    scanImage: isRTL ? "סרוק תמונה" : "Scan Image",
    enterBarcode: isRTL ? "הכנס ברקוד" : "Enter Barcode",
    scan: isRTL ? "סרוק" : "Scan",
    quantity: isRTL ? "כמות" : "Quantity",
    isBeverage: isRTL ? "משקה?" : "Beverage?",
    addToShoppingList: isRTL ? "הוסף לרשימת קניות" : "Add to Shopping List",
    addToMealHistory: isRTL ? "הוסף ליומן ארוחות" : "Add to Meal History",
    rescan: isRTL ? "סרוק שוב" : "Rescan",
    scanning: isRTL ? "סורק..." : "Scanning...",
    analyzing: isRTL ? "מנתח..." : "Analyzing...",
    estimatingPrice: isRTL ? "מעריך מחיר..." : "Estimating Price...",
    scanSuccess: isRTL ? "סריקה הושלמה!" : "Scan Complete!",
    scanError: isRTL ? "שגיאה בסריקה" : "Scan Error",
    noResults: isRTL ? "לא נמצאו תוצאות" : "No Results Found",
    history: isRTL ? "היסטוריה" : "History",
    close: isRTL ? "סגור" : "Close",
    added: isRTL ? "נוסף!" : "Added!",
    g: isRTL ? "גר'" : "g",
    ml: isRTL ? "מ\"ל" : "ml",
    nis: isRTL ? "₪" : "₪",
    calories: isRTL ? "קלוריות" : "Calories",
    protein: isRTL ? "חלבון" : "Protein",
    carbs: isRTL ? "פחמימות" : "Carbs",
    fat: isRTL ? "שומן" : "Fat",
    fiber: isRTL ? "סיבים" : "Fiber",
    sugar: isRTL ? "סוכר" : "Sugar",
    sodium: isRTL ? "נתרן" : "Sodium",
    ingredients: isRTL ? "רכיבים" : "Ingredients",
    allergens: isRTL ? "אלרגנים" : "Allergens",
    healthScore: isRTL ? "ניקוד בריאות" : "Health Score",
    priceEstimate: isRTL ? "הערכת מחיר" : "Price Estimate",
    compatibility: isRTL ? "תאימות אישית" : "Personal Compatibility",
    productPreview: isRTL ? "תצוגה מקדימה" : "Product Preview",
    detailedAnalysis: isRTL ? "ניתוח מפורט" : "Detailed Analysis",
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
    if (status !== "granted") {
      ToastService.error('Permission Required', 'Camera permission is required to scan food items');
    }
  };

  const loadScanHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await api.get("/food-scanner/history");
      if (response.data.success) {
        setScanHistory(response.data.data);
      }
    } catch (error) {
      console.error("Error loading scan history:", error);
      ToastService.handleError(error, 'Load Scan History');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const estimatePrice = async (productData: ProductData): Promise<PriceEstimate | null> => {
    try {
      setLoadingText(texts.estimatingPrice);

      // Create a detailed product description for OpenAI
      const productDescription = `
        Product: ${productData.name}
        Brand: ${productData.brand || "Unknown"}
        Category: ${productData.category}
        Size/Weight: Approximately ${quantity}${isBeverage ? 'ml' : 'g'}
        Type: ${isBeverage ? 'Beverage' : 'Food product'}
        Ingredients: ${productData.ingredients.slice(0, 5).join(', ')}
        Health Score: ${productData.health_score || 'N/A'}
      `;

      // Use OpenAI to estimate price based on Israeli market
      const response = await api.post("/chat/message", {
        message: `Based on Israeli supermarket prices (2024), estimate the price for this product: ${productDescription}. 
        Respond in JSON format: {
          "estimated_price": number_in_shekels,
          "price_range": "X-Y ₪",
          "currency": "ILS",
          "confidence": "high/medium/low",
          "market_context": "brief explanation"
        }`,
        language: "english"
      });

      if (response.data.success) {
        try {
          const priceData = JSON.parse(response.data.data.response);
          return priceData;
        } catch (parseError) {
          console.warn("Failed to parse price estimation");
          ToastService.error('Price Estimation Error', 'Could not parse price data. Please try again.');
          return null;
        }
      }
    } catch (error) {
      console.error("Price estimation error:", error);
      ToastService.handleError(error, 'Price Estimation');
    }
    return null;
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) {
      ToastService.error(texts.scanError, isRTL ? "אנא הכנס ברקוד" : "Please enter a barcode");
      return;
    }

    setIsLoading(true);
    setLoadingText(texts.scanning);

    try {
      const response = await api.post("/food-scanner/barcode", {
        barcode: barcodeInput.trim(),
      });

      if (response.data.success) {
        setScanResult(response.data.data);

        // Estimate price
        const price = await estimatePrice(response.data.data.product);
        setPriceEstimate(price);

        animateResultAppearance();
        setShowResults(true);
        await loadScanHistory(); // Refresh history
      } else {
        ToastService.handleError(response.data.error || texts.noResults, 'Barcode Search');
      }
    } catch (error) {
      console.error("Barcode scan error:", error);
      ToastService.handleError(error, 'Barcode Search');
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  const handleBarcodeScan = async (scanningResult: any) => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingText(texts.analyzing);
    setIsScanning(false);

    try {
      const response = await api.post("/food-scanner/barcode", {
        barcode: scanningResult.data,
      });

      if (response.data.success && response.data.data) {
        setScanResult(response.data.data);

        // Estimate price
        const price = await estimatePrice(response.data.data.product);
        setPriceEstimate(price);

        animateResultAppearance();
        setShowResults(true);
        await loadScanHistory(); // Refresh history
      } else {
        ToastService.error(texts.scanError, isRTL ? "מוצר לא נמצא במאגר" : "Product not found");
      }
    } catch (error) {
      console.error("Barcode scan error:", error);
      ToastService.handleError(error, 'Barcode Scan');
    } finally {
      setIsLoading(false);
      setLoadingText("");
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
        setLoadingText(texts.analyzing);

        try {
          const response = await api.post("/food-scanner/image", {
            imageBase64: result.assets[0].base64,
          });

          if (response.data.success && response.data.data) {
            setScanResult(response.data.data);

            // Estimate price
            const price = await estimatePrice(response.data.data.product);
            setPriceEstimate(price);

            animateResultAppearance();
            setShowResults(true);
            await loadScanHistory(); // Refresh history
          } else {
            ToastService.error(texts.scanError, isRTL ? "לא הצלחנו לזהות את המוצר בתמונה" : "Could not identify product in image");
          }
        } catch (error) {
          console.error("Image scan error:", error);
          ToastService.handleError(error, 'Image Scan');
        } finally {
          setIsLoading(false);
          setLoadingText("");
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      ToastService.error(texts.scanError, isRTL ? "לא הצלחנו לפתוח את המצלמה" : "Could not open camera");
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

  const handleAddToShoppingList = async () => {
    if (!scanResult) return;

    setIsLoading(true);
    try {
      const response = await api.post("/shopping-lists", {
        name: scanResult.product.name,
        quantity: quantity,
        unit: isBeverage ? "ml" : "g",
        category: scanResult.product.category,
        added_from: "scanner",
        product_barcode: scanResult.product.barcode,
        estimated_price: priceEstimate?.estimated_price,
      });

      if (response.data.success) {
        ToastService.success('Shopping List Updated', `${scanResult.product.name} added to shopping list!`);
      } else {
        ToastService.handleError(response.data.error, 'Add to Shopping List');
      }
    } catch (error) {
      console.error("Add to shopping list error:", error);
      ToastService.handleError(error, 'Add to Shopping List');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToMealHistory = async () => {
    if (!scanResult) return;

    setIsLoading(true);
    try {
      const response = await api.post("/food-scanner/add-to-meal", {
        productData: scanResult.product,
        quantity,
        mealTiming: "SNACK",
      });

      if (response.data.success) {
        ToastService.mealAdded(scanResult.product.name);
      } else {
        ToastService.handleError(response.data.error, 'Log Meal');
      }
    } catch (error) {
      console.error("Add to meal history error:", error);
      ToastService.handleError(error, 'Log Meal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescan = () => {
    setScanResult(null);
    setPriceEstimate(null);
    setShowResults(false);
    setBarcodeInput("");
    setQuantity(100);
    setIsBeverage(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#FF9800";
    if (score >= 40) return "#FF5722";
    return "#F44336";
  };

  const renderProductPreview = () => {
    if (!scanResult) return null;

    return (
      <View style={styles.productPreviewContainer}>
        <Text style={styles.sectionTitle}>{texts.productPreview}</Text>
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{scanResult.product.name}</Text>
              {scanResult.product.brand && (
                <Text style={styles.productBrand}>{scanResult.product.brand}</Text>
              )}
              <Text style={styles.productCategory}>{scanResult.product.category}</Text>
              {scanResult.product.barcode && (
                <Text style={styles.productBarcode}>
                  {isRTL ? "ברקוד" : "Barcode"}: {scanResult.product.barcode}
                </Text>
              )}
            </View>
            <View style={styles.healthScoreBadge}>
              <Text style={styles.healthScoreText}>
                {scanResult.product.health_score || 50}/100
              </Text>
              <Text style={styles.healthScoreLabel}>{texts.healthScore}</Text>
            </View>
          </View>

          <View style={styles.quickNutrition}>
            <View style={styles.nutritionQuickItem}>
              <Zap size={16} color="#E74C3C" />
              <Text style={styles.nutritionQuickValue}>
                {Math.round((scanResult.product.nutrition_per_100g.calories * quantity) / 100)}
              </Text>
              <Text style={styles.nutritionQuickLabel}>{texts.calories}</Text>
            </View>
            <View style={styles.nutritionQuickItem}>
              <Heart size={16} color="#9B59B6" />
              <Text style={styles.nutritionQuickValue}>
                {Math.round((scanResult.product.nutrition_per_100g.protein * quantity) / 100)}{texts.g}
              </Text>
              <Text style={styles.nutritionQuickLabel}>{texts.protein}</Text>
            </View>
            <View style={styles.nutritionQuickItem}>
              <Wheat size={16} color="#F39C12" />
              <Text style={styles.nutritionQuickValue}>
                {Math.round((scanResult.product.nutrition_per_100g.carbs * quantity) / 100)}{texts.g}
              </Text>
              <Text style={styles.nutritionQuickLabel}>{texts.carbs}</Text>
            </View>
            <View style={styles.nutritionQuickItem}>
              <Droplet size={16} color="#3498DB" />
              <Text style={styles.nutritionQuickValue}>
                {Math.round((scanResult.product.nutrition_per_100g.fat * quantity) / 100)}{texts.g}
              </Text>
              <Text style={styles.nutritionQuickLabel}>{texts.fat}</Text>
            </View>
          </View>

          {priceEstimate && (
            <View style={styles.priceEstimateContainer}>
              <View style={styles.priceHeader}>
                <DollarSign size={16} color="#16A085" />
                <Text style={styles.priceTitle}>{texts.priceEstimate}</Text>
              </View>
              <Text style={styles.priceValue}>
                {priceEstimate.estimated_price} {texts.nis}
              </Text>
              <Text style={styles.priceRange}>{priceEstimate.price_range}</Text>
              <Text style={styles.priceConfidence}>
                {isRTL ? "דרגת ביטחון" : "Confidence"}: {priceEstimate.confidence}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDetailedAnalysis = () => {
    if (!scanResult) return null;

    return (
      <View style={styles.detailedAnalysisContainer}>
        <Text style={styles.sectionTitle}>{texts.detailedAnalysis}</Text>

        {/* Compatibility Score */}
        <View style={styles.compatibilityCard}>
          <View style={styles.compatibilityHeader}>
            <Star size={20} color={getScoreColor(scanResult.user_analysis.compatibility_score)} />
            <Text style={styles.compatibilityTitle}>{texts.compatibility}</Text>
          </View>
          <View style={styles.scoreDisplay}>
            <Text style={[styles.compatibilityScore, { color: getScoreColor(scanResult.user_analysis.compatibility_score) }]}>
              {scanResult.user_analysis.compatibility_score}/100
            </Text>
            <Text style={styles.healthAssessment}>
              {scanResult.user_analysis.health_assessment}
            </Text>
          </View>
        </View>

        {/* Detailed Nutrition */}
        <View style={styles.nutritionDetailsCard}>
          <Text style={styles.cardTitle}>
            {isRTL ? `ערכים תזונתיים ל-${quantity} ${isBeverage ? 'מל' : 'גרם'}` : `Nutrition per ${quantity} ${isBeverage ? 'ml' : 'g'}`}
          </Text>
          <View style={styles.nutritionGrid}>
            {Object.entries(scanResult.product.nutrition_per_100g).map(([key, value]) => {
              if (!value || value === 0) return null;
              const multiplier = quantity / 100;
              return (
                <View key={key} style={styles.nutritionDetailItem}>
                  <Text style={styles.nutritionDetailLabel}>
                    {key === 'calories' ? texts.calories :
                     key === 'protein' ? texts.protein :
                     key === 'carbs' ? texts.carbs :
                     key === 'fat' ? texts.fat :
                     key === 'fiber' ? texts.fiber :
                     key === 'sugar' ? texts.sugar :
                     key === 'sodium' ? texts.sodium :
                     key}
                  </Text>
                  <Text style={styles.nutritionDetailValue}>
                    {Math.round(value * multiplier)}
                    {key === 'calories' ? '' :
                     key === 'sodium' ? 'mg' :
                     key.includes('vitamin') ? 'mg' :
                     key.includes('calcium') || key.includes('iron') || key.includes('potassium') ? 'mg' :
                     'g'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Ingredients */}
        {scanResult.product.ingredients.length > 0 && (
          <View style={styles.ingredientsCard}>
            <Text style={styles.cardTitle}>{texts.ingredients}</Text>
            <View style={styles.ingredientsList}>
              {scanResult.product.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientTag}>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Allergens */}
        {scanResult.product.allergens.length > 0 && (
          <View style={styles.allergensCard}>
            <View style={styles.allergensHeader}>
              <AlertTriangle size={16} color="#E74C3C" />
              <Text style={styles.cardTitle}>{texts.allergens}</Text>
            </View>
            <View style={styles.allergensList}>
              {scanResult.product.allergens.map((allergen, index) => (
                <View key={index} style={styles.allergenTag}>
                  <Text style={styles.allergenText}>{allergen}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Alerts and Recommendations */}
        {scanResult.user_analysis.alerts.length > 0 && (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <AlertTriangle size={16} color="#E74C3C" />
              <Text style={styles.cardTitle}>
                {isRTL ? "התראות" : "Alerts"}
              </Text>
            </View>
            {scanResult.user_analysis.alerts.map((alert, index) => (
              <Text key={index} style={styles.alertText}>{alert}</Text>
            ))}
          </View>
        )}

        {scanResult.user_analysis.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationsHeader}>
              <Sparkles size={16} color="#16A085" />
              <Text style={styles.cardTitle}>
                {isRTL ? "המלצות" : "Recommendations"}
              </Text>
            </View>
            {scanResult.user_analysis.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationText}>{rec}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (hasPermission === null) {
    return <LoadingScreen text={isRTL ? "מבקש הרשאות מצלמה..." : "Requesting camera permissions..."} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.noPermissionContainer}>
        <Ionicons name="camera" size={48} color="#666" />
        <Text style={styles.noPermissionText}>
          {isRTL ? "נדרשת הרשאה למצלמה כדי לסרוק מוצרים" : "Camera permission required to scan products"}
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={getCameraPermissions}>
          <Text style={styles.permissionButtonText}>
            {isRTL ? "הענק הרשאה" : "Grant Permission"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {!showResults ? (
          <>
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
                    <QrCode size={20} color={scanMode === "barcode" ? "#fff" : "#666"} />
                    <Text
                      style={[
                        styles.modeButtonText,
                        scanMode === "barcode" && styles.activeModeButtonText,
                      ]}
                    >
                      {texts.scanBarcode}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      scanMode === "image" && styles.activeModeButton,
                    ]}
                    onPress={() => setScanMode("image")}
                  >
                    <CameraIcon size={20} color={scanMode === "image" ? "#fff" : "#666"} />
                    <Text
                      style={[
                        styles.modeButtonText,
                        scanMode === "image" && styles.activeModeButtonText,
                      ]}
                    >
                      {texts.scanImage}
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
                      <LinearGradient colors={["#16A085", "#1ABC9C"]} style={styles.scanButtonGradient}>
                        <QrCode size={32} color="#FFFFFF" />
                        <Text style={styles.scanButtonText}>{texts.scanBarcode}</Text>
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
                          <Text style={styles.scanButtonSmallText}>{texts.scan}</Text>
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
                    <LinearGradient colors={["#16A085", "#1ABC9C"]} style={styles.scanButtonGradient}>
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
                      {isRTL ? "כוון את הברקוד למרכז המסגרת" : "Align barcode in the center of the frame"}
                    </Text>
                  </View>
                </CameraView>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsScanning(false)}>
                  <Text style={styles.cancelButtonText}>{isRTL ? "ביטול" : "Cancel"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Results Section */}
            <View style={styles.resultsSection}>
              {renderProductPreview()}

              {/* Input Controls */}
              <View style={styles.inputControlsCard}>
                <View style={styles.quantityControl}>
                  <Scale size={16} color="#16A085" />
                  <Text style={styles.quantityLabel}>{texts.quantity}:</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity.toString()}
                    onChangeText={(text) => setQuantity(parseInt(text) || 1)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitLabel}>{isBeverage ? texts.ml : texts.g}</Text>
                </View>

                <View style={styles.beverageToggle}>
                  <Droplet size={16} color={isBeverage ? "#16A085" : "#7F8C8D"} />
                  <Text style={styles.beverageLabel}>{texts.isBeverage}</Text>
                  <Switch
                    value={isBeverage}
                    onValueChange={setIsBeverage}
                    trackColor={{ false: "#E9ECEF", true: "#16A085" }}
                    thumbColor={isBeverage ? "#FFFFFF" : "#FFFFFF"}
                  />
                </View>
              </View>

              {renderDetailedAnalysis()}

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <ButtonLoader
                  loading={isLoading}
                  onPress={handleAddToShoppingList}
                  title={texts.addToShoppingList}
                  style={[styles.actionButton, styles.shoppingButton]}
                  variant="primary"
                />

                <ButtonLoader
                  loading={isLoading}
                  onPress={handleAddToMealHistory}
                  title={texts.addToMealHistory}
                  style={[styles.actionButton, styles.mealButton]}
                  variant="secondary"
                />

                <ButtonLoader
                  loading={false} // Rescan button doesn't have a loading state
                  onPress={handleRescan}
                  title={texts.rescan}
                  style={[styles.actionButton, styles.rescanButton]}
                  variant="tertiary" // Assuming a tertiary variant for rescan
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingScreen text={loadingText || texts.scanning} />
      )}

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
            <Text style={styles.modalTitle}>{texts.history}</Text>
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
                  {isRTL ? "אין היסטוריית סריקות" : "No scan history"}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  resultsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productPreviewContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 14,
    color: "#95A5A6",
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 12,
    color: "#BDC3C7",
    fontFamily: "monospace",
  },
  healthScoreBadge: {
    backgroundColor: "#E8F8F5",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    minWidth: 80,
  },
  healthScoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16A085",
  },
  healthScoreLabel: {
    fontSize: 10,
    color: "#16A085",
    marginTop: 2,
  },
  quickNutrition: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  nutritionQuickItem: {
    alignItems: "center",
    gap: 4,
  },
  nutritionQuickValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  nutritionQuickLabel: {
    fontSize: 10,
    color: "#7F8C8D",
  },
  priceEstimateContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#16A085",
  },
  priceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  priceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16A085",
    marginBottom: 4,
  },
  priceRange: {
    fontSize: 12,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  priceConfidence: {
    fontSize: 10,
    color: "#95A5A6",
  },
  inputControlsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  quantityInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    minWidth: 80,
    textAlign: "center",
  },
  unitLabel: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  beverageToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  beverageLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    flex: 1,
  },
  detailedAnalysisContainer: {
    marginBottom: 20,
  },
  compatibilityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  compatibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  compatibilityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  scoreDisplay: {
    alignItems: "center",
  },
  compatibilityScore: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  healthAssessment: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
  },
  nutritionDetailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nutritionDetailItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    minWidth: "47%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nutritionDetailLabel: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  nutritionDetailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  ingredientsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  ingredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ingredientTag: {
    backgroundColor: "#E8F8F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ingredientText: {
    fontSize: 12,
    color: "#16A085",
  },
  allergensCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#E74C3C",
  },
  allergensHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  allergensList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  allergenTag: {
    backgroundColor: "#FDEDEC",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  allergenText: {
    fontSize: 12,
    color: "#E74C3C",
    fontWeight: "600",
  },
  alertsCard: {
    backgroundColor: "#FFF3CD",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F1C40F",
  },
  alertsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 14,
    color: "#856404",
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: "#D1ECF1",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#17A2B8",
  },
  recommendationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: "#0C5460",
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  shoppingButton: {},
  mealButton: {},
  rescanButton: {},
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
});
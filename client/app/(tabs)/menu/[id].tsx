import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { api } from "@/src/services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
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
  instructions?: string | string[];
  instructions_english?: string | string[];
  ingredients?: Ingredient[];
  day_number?: number;
}

interface MenuDetails {
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

export default function MenuDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "he";

  const [menu, setMenu] = useState<MenuDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [scrollY] = useState(new Animated.Value(0));

  useEffect(() => {
    if (id) {
      loadMenuDetails();
    }
  }, [id]);

  const loadMenuDetails = async () => {
    try {
      console.log("🔄 Loading menu details for ID:", id);
      const response = await api.get(`/recommended-menus/${id}`);

      if (response.data.success && response.data.data) {
        setMenu(response.data.data);
      } else {
        throw new Error("Menu not found");
      }
    } catch (error: any) {
      console.error("💥 Load menu details error:", error);
      Alert.alert(
        isRTL ? "שגיאה" : "Error",
        isRTL ? "לא ניתן לטעון את פרטי התפריט" : "Failed to load menu details"
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const getMealsByDay = (day: number) => {
    if (!menu) return [];
    return menu.meals.filter((meal) => meal.day_number === day);
  };

  const getDaysArray = () => {
    if (!menu) return [];
    const days = new Set(menu.meals.map((meal) => meal.day_number || 1));
    return Array.from(days).sort((a, b) => a - b);
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

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case "breakfast":
        return "#f59e0b";
      case "lunch":
        return "#ef4444";
      case "dinner":
        return "#8b5cf6";
      case "snack":
        return "#22c55e";
      default:
        return "#10b981";
    }
  };

  const formatInstructions = (instructions?: string | string[]) => {
    if (!instructions) return [];
    if (typeof instructions === "string") {
      return instructions.split(".").filter((step) => step.trim().length > 0);
    }
    return instructions;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <BlurView intensity={90} style={styles.loadingCard}>
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={[styles.loadingText, isRTL && styles.rtlText]}>
                  {isRTL ? "טוען פרטי תפריט..." : "Loading menu details..."}
                </Text>
              </View>
            </BlurView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!menu) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <BlurView intensity={80} style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={[styles.errorText, isRTL && styles.rtlText]}>
                {isRTL ? "תפריט לא נמצא" : "Menu not found"}
              </Text>
            </BlurView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView>
        <SafeAreaView style={styles.safeArea}>
          {/* Floating Header */}
          <Animated.View
            style={[styles.floatingHeader, { opacity: headerOpacity }]}
          >
            <BlurView intensity={100} style={styles.headerBlur}>
              <View style={[styles.headerContent, isRTL && styles.rtlRow]}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons
                    name={isRTL ? "chevron-forward" : "chevron-back"}
                    size={24}
                    color="#ffffff"
                  />
                </TouchableOpacity>

                <View
                  style={[styles.headerInfo, isRTL && styles.rtlHeaderInfo]}
                >
                  <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
                    {menu.title}
                  </Text>
                  <Text
                    style={[styles.headerSubtitle, isRTL && styles.rtlText]}
                  >
                    {isRTL
                      ? `נוצר ${formatDate(menu.created_at)}`
                      : `Created ${formatDate(menu.created_at)}`}
                  </Text>
                </View>

                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{menu.days_count}</Text>
                  <Text
                    style={[styles.headerBadgeLabel, isRTL && styles.rtlText]}
                  >
                    {isRTL ? "ימים" : "Days"}
                  </Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          <Animated.ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <BlurView intensity={80} style={styles.heroCard}>
                <View style={styles.heroContent}>
                  <View style={styles.heroHeader}>
                    <Text style={[styles.heroTitle, isRTL && styles.rtlText]}>
                      {menu.title}
                    </Text>
                    <Text
                      style={[styles.heroDescription, isRTL && styles.rtlText]}
                    >
                      {menu.description ||
                        (isRTL
                          ? "תפריט מותאם אישית"
                          : "Personalized meal plan")}
                    </Text>
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={[
                          "rgba(245, 158, 11, 0.2)",
                          "rgba(245, 158, 11, 0.05)",
                        ]}
                        style={styles.statCardGradient}
                      >
                        <Ionicons name="flame" size={24} color="#f59e0b" />
                        <Text style={styles.statValue}>
                          {menu.total_calories}
                        </Text>
                        <Text
                          style={[styles.statLabel, isRTL && styles.rtlText]}
                        >
                          {isRTL ? "קלוריות" : "Calories"}
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={[
                          "rgba(239, 68, 68, 0.2)",
                          "rgba(239, 68, 68, 0.05)",
                        ]}
                        style={styles.statCardGradient}
                      >
                        <Ionicons name="fitness" size={24} color="#ef4444" />
                        <Text style={styles.statValue}>
                          {menu.total_protein || 0}g
                        </Text>
                        <Text
                          style={[styles.statLabel, isRTL && styles.rtlText]}
                        >
                          {isRTL ? "חלבון" : "Protein"}
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={[
                          "rgba(34, 197, 94, 0.2)",
                          "rgba(34, 197, 94, 0.05)",
                        ]}
                        style={styles.statCardGradient}
                      >
                        <Ionicons name="leaf" size={24} color="#22c55e" />
                        <Text style={styles.statValue}>
                          {menu.total_carbs || 0}g
                        </Text>
                        <Text
                          style={[styles.statLabel, isRTL && styles.rtlText]}
                        >
                          {isRTL ? "פחמימות" : "Carbs"}
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={[
                          "rgba(59, 130, 246, 0.2)",
                          "rgba(59, 130, 246, 0.05)",
                        ]}
                        style={styles.statCardGradient}
                      >
                        <Ionicons name="water" size={24} color="#3b82f6" />
                        <Text style={styles.statValue}>
                          {menu.total_fat || 0}g
                        </Text>
                        <Text
                          style={[styles.statLabel, isRTL && styles.rtlText]}
                        >
                          {isRTL ? "שומן" : "Fat"}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>

                  {menu.estimated_cost && (
                    <View style={styles.costBadge}>
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.15)",
                          "rgba(139, 92, 246, 0.05)",
                        ]}
                        style={styles.costGradient}
                      >
                        <Ionicons
                          name="card-outline"
                          size={20}
                          color="#8b5cf6"
                        />
                        <Text
                          style={[styles.costText, isRTL && styles.rtlText]}
                        >
                          {isRTL
                            ? `עלות משוערת: ₪${menu.estimated_cost.toFixed(0)}`
                            : `Estimated cost: ₪${menu.estimated_cost.toFixed(
                                0
                              )}`}
                        </Text>
                      </LinearGradient>
                    </View>
                  )}
                </View>
              </BlurView>
            </View>

            {/* Day Selector */}
            <View style={styles.daySelectorContainer}>
              <BlurView intensity={80} style={styles.daySelector}>
                <Text
                  style={[styles.daySelectorTitle, isRTL && styles.rtlText]}
                >
                  {isRTL ? "בחר יום" : "Select Day"}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysContainer}
                >
                  {getDaysArray().map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayChip,
                        selectedDay === day && styles.selectedDayChip,
                      ]}
                      onPress={() => setSelectedDay(day)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          selectedDay === day
                            ? ["#667eea", "#764ba2"]
                            : [
                                "rgba(255, 255, 255, 0.8)",
                                "rgba(255, 255, 255, 0.6)",
                              ]
                        }
                        style={styles.dayChipGradient}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            selectedDay === day && styles.selectedDayChipText,
                            isRTL && styles.rtlText,
                          ]}
                        >
                          {isRTL ? `יום ${day}` : `Day ${day}`}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </BlurView>
            </View>

            {/* Meals List */}
            <View style={styles.mealsContainer}>
              {getMealsByDay(selectedDay).map((meal, index) => (
                <View key={meal.meal_id} style={styles.mealCardContainer}>
                  <BlurView intensity={90} style={styles.mealCard}>
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedMeal(
                          expandedMeal === meal.meal_id ? null : meal.meal_id
                        )
                      }
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(255, 255, 255, 0.9)",
                          "rgba(255, 255, 255, 0.7)",
                        ]}
                        style={styles.mealCardGradient}
                      >
                        {/* Meal Header */}
                        <View
                          style={[styles.mealHeader, isRTL && styles.rtlRow]}
                        >
                          <View
                            style={[
                              styles.mealHeaderLeft,
                              isRTL && styles.rtlRow,
                            ]}
                          >
                            <View
                              style={[
                                styles.mealIconContainer,
                                {
                                  backgroundColor: `${getMealTypeColor(
                                    meal.meal_type
                                  )}20`,
                                },
                              ]}
                            >
                              <Ionicons
                                name={getMealTypeIcon(meal.meal_type)}
                                size={28}
                                color={getMealTypeColor(meal.meal_type)}
                              />
                            </View>
                            <View
                              style={[
                                styles.mealInfo,
                                isRTL && styles.rtlMealInfo,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.mealName,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {meal.name}
                              </Text>
                              <View
                                style={[
                                  styles.mealMetaRow,
                                  isRTL && styles.rtlRow,
                                ]}
                              >
                                <View
                                  style={[
                                    styles.mealTypeBadge,
                                    {
                                      backgroundColor: `${getMealTypeColor(
                                        meal.meal_type
                                      )}15`,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.mealTypeText,
                                      {
                                        color: getMealTypeColor(meal.meal_type),
                                      },
                                      isRTL && styles.rtlText,
                                    ]}
                                  >
                                    {meal.meal_type}
                                  </Text>
                                </View>
                                {meal.prep_time_minutes && (
                                  <View style={styles.timeIndicator}>
                                    <Ionicons
                                      name="time-outline"
                                      size={14}
                                      color="#64748b"
                                    />
                                    <Text style={styles.timeText}>
                                      {meal.prep_time_minutes}
                                      {isRTL ? "ד" : "min"}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>

                          <View
                            style={[styles.mealStats, isRTL && styles.rtlRow]}
                          >
                            <View style={styles.caloriesBadge}>
                              <Text style={styles.caloriesValue}>
                                {meal.calories}
                              </Text>
                              <Text style={styles.caloriesLabel}>
                                {isRTL ? "קלוריות" : "cal"}
                              </Text>
                            </View>
                            <Ionicons
                              name={
                                expandedMeal === meal.meal_id
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={20}
                              color="#64748b"
                            />
                          </View>
                        </View>

                        {/* Quick Nutrition Preview */}
                        <View style={styles.quickNutrition}>
                          <View style={styles.nutritionPreviewRow}>
                            <View style={styles.nutritionPreviewItem}>
                              <Text style={styles.nutritionPreviewValue}>
                                {meal.protein}g
                              </Text>
                              <Text
                                style={[
                                  styles.nutritionPreviewLabel,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL ? "חלבון" : "Protein"}
                              </Text>
                            </View>
                            <View style={styles.nutritionPreviewItem}>
                              <Text style={styles.nutritionPreviewValue}>
                                {meal.carbs}g
                              </Text>
                              <Text
                                style={[
                                  styles.nutritionPreviewLabel,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL ? "פחמימות" : "Carbs"}
                              </Text>
                            </View>
                            <View style={styles.nutritionPreviewItem}>
                              <Text style={styles.nutritionPreviewValue}>
                                {meal.fat}g
                              </Text>
                              <Text
                                style={[
                                  styles.nutritionPreviewLabel,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL ? "שומן" : "Fat"}
                              </Text>
                            </View>
                            {meal.fiber && (
                              <View style={styles.nutritionPreviewItem}>
                                <Text style={styles.nutritionPreviewValue}>
                                  {meal.fiber}g
                                </Text>
                                <Text
                                  style={[
                                    styles.nutritionPreviewLabel,
                                    isRTL && styles.rtlText,
                                  ]}
                                >
                                  {isRTL ? "סיבים" : "Fiber"}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Expanded Details */}
                    {expandedMeal === meal.meal_id && (
                      <View style={styles.expandedDetails}>
                        <LinearGradient
                          colors={[
                            "rgba(255, 255, 255, 0.95)",
                            "rgba(248, 250, 252, 0.9)",
                          ]}
                          style={styles.expandedGradient}
                        >
                          {/* Ingredients */}
                          {meal.ingredients && meal.ingredients.length > 0 && (
                            <View style={styles.detailSection}>
                              <Text
                                style={[
                                  styles.detailSectionTitle,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL ? "רכיבים" : "Ingredients"}
                              </Text>
                              <View style={styles.ingredientsGrid}>
                                {meal.ingredients.map((ingredient, idx) => (
                                  <View key={idx} style={styles.ingredientChip}>
                                    <Text
                                      style={[
                                        styles.ingredientText,
                                        isRTL && styles.rtlText,
                                      ]}
                                    >
                                      {ingredient.quantity} {ingredient.unit}{" "}
                                      {ingredient.name}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}

                          {/* Instructions */}
                          {meal.instructions && (
                            <View style={styles.detailSection}>
                              <Text
                                style={[
                                  styles.detailSectionTitle,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {isRTL ? "הוראות הכנה" : "Instructions"}
                              </Text>
                              <View style={styles.instructionsList}>
                                {formatInstructions(meal.instructions).map(
                                  (instruction, idx) => (
                                    <View
                                      key={idx}
                                      style={[
                                        styles.instructionItem,
                                        isRTL && styles.rtlRow,
                                      ]}
                                    >
                                      <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>
                                          {idx + 1}
                                        </Text>
                                      </View>
                                      <Text
                                        style={[
                                          styles.instructionText,
                                          isRTL && styles.rtlText,
                                        ]}
                                      >
                                        {instruction.trim()}
                                      </Text>
                                    </View>
                                  )
                                )}
                              </View>
                            </View>
                          )}

                          {/* Cooking Method */}
                          {meal.cooking_method && (
                            <View style={styles.cookingMethodBadge}>
                              <Ionicons
                                name="restaurant"
                                size={16}
                                color="#8b5cf6"
                              />
                              <Text
                                style={[
                                  styles.cookingMethodText,
                                  isRTL && styles.rtlText,
                                ]}
                              >
                                {meal.cooking_method}
                              </Text>
                            </View>
                          )}
                        </LinearGradient>
                      </View>
                    )}
                  </BlurView>
                </View>
              ))}
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
  rtlHeaderInfo: {
    alignItems: "flex-end",
  },
  rtlMealInfo: {
    alignItems: "flex-end",
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 40,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  loadingIndicator: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 40,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
  },

  // Header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBlur: {
    margin: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  headerBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerBadgeLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroContent: {
    padding: 24,
  },
  heroHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 34,
  },
  heroDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - 80) / 2,
    borderRadius: 16,
    overflow: "hidden",
  },
  statCardGradient: {
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  costBadge: {
    borderRadius: 16,
    overflow: "hidden",
  },
  costGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  costText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
  },

  // Day Selector
  daySelectorContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  daySelector: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    padding: 20,
  },
  daySelectorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
  },
  daysScrollView: {
    flexDirection: "row",
  },
  dayChip: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  selectedDayChip: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#064e3b",
  },
  selectedDayChipText: {
    color: "#ffffff",
  },
  mealsContainer: {
    paddingBottom: 32,
  },
  mealCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  mealCardGradient: {
    overflow: "hidden",
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  mealHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  mealHeaderText: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#064e3b",
    marginBottom: 4,
  },
  mealType: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  mealStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
  },
  mealDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 185, 129, 0.1)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: 12,
    marginTop: 16,
  },
  mealNutrition: {},
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nutritionDetailItem: {
    alignItems: "center",
    flex: 1,
  },
  nutritionDetailValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10b981",
    marginBottom: 4,
  },
  nutritionDetailLabel: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  cookingInfo: {},
  cookingDetails: {
    flexDirection: "row",
    gap: 16,
  },
  cookingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 12,
    padding: 12,
    flex: 1,
  },
  cookingText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  ingredientsSection: {},
  ingredientsList: {},
  ingredientItem: {
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: "#065f46",
    lineHeight: 20,
    fontWeight: "500",
  },
  instructionsSection: {},
  instructionsList: {},
  instructionItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  instructionText: {
    fontSize: 14,
    color: "#065f46",
    lineHeight: 20,
    fontWeight: "500",
    flex: 1,
  },
});

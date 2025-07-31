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
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <BlurView intensity={20} style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={[styles.loadingText, isRTL && styles.rtlText]}>
                {isRTL ? "טוען פרטי תפריט..." : "Loading menu details..."}
              </Text>
            </BlurView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!menu) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <BlurView intensity={20} style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={48} color="#10b981" />
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
      <ScrollView>
        <SafeAreaView style={styles.safeArea}>
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
              <BlurView intensity={20} style={styles.heroCard}>
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
                      <Ionicons name="flame" size={24} color="#10b981" />
                      <Text style={styles.statValue}>
                        {menu.total_calories}
                      </Text>
                      <Text style={[styles.statLabel, isRTL && styles.rtlText]}>
                        {isRTL ? "קלוריות" : "Calories"}
                      </Text>
                    </View>

                    <View style={styles.statCard}>
                      <Ionicons name="fitness" size={24} color="#10b981" />
                      <Text style={styles.statValue}>
                        {menu.total_protein || 0}g
                      </Text>
                      <Text style={[styles.statLabel, isRTL && styles.rtlText]}>
                        {isRTL ? "חלבון" : "Protein"}
                      </Text>
                    </View>

                    <View style={styles.statCard}>
                      <Ionicons name="leaf" size={24} color="#10b981" />
                      <Text style={styles.statValue}>
                        {menu.total_carbs || 0}g
                      </Text>
                      <Text style={[styles.statLabel, isRTL && styles.rtlText]}>
                        {isRTL ? "פחמימות" : "Carbs"}
                      </Text>
                    </View>

                    <View style={styles.statCard}>
                      <Ionicons name="water" size={24} color="#10b981" />
                      <Text style={styles.statValue}>
                        {menu.total_fat || 0}g
                      </Text>
                      <Text style={[styles.statLabel, isRTL && styles.rtlText]}>
                        {isRTL ? "שומן" : "Fat"}
                      </Text>
                    </View>
                  </View>

                  {menu.estimated_cost && (
                    <View style={styles.costBadge}>
                      <Ionicons name="card-outline" size={20} color="#10b981" />
                      <Text style={[styles.costText, isRTL && styles.rtlText]}>
                        {isRTL
                          ? `עלות משוערת: ₪${menu.estimated_cost.toFixed(0)}`
                          : `Estimated cost: ₪${menu.estimated_cost.toFixed(
                              0
                            )}`}
                      </Text>
                    </View>
                  )}
                </View>
              </BlurView>
            </View>

            {/* Day Selector */}
            <View style={styles.daySelectorContainer}>
              <BlurView intensity={20} style={styles.daySelector}>
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
                      <Text
                        style={[
                          styles.dayChipText,
                          selectedDay === day && styles.selectedDayChipText,
                          isRTL && styles.rtlText,
                        ]}
                      >
                        {isRTL ? `יום ${day}` : `Day ${day}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </BlurView>
            </View>

            {/* Meals List */}
            <View style={styles.mealsContainer}>
              {getMealsByDay(selectedDay).map((meal, index) => (
                <View key={meal.meal_id} style={styles.mealCardContainer}>
                  <BlurView intensity={20} style={styles.mealCard}>
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedMeal(
                          expandedMeal === meal.meal_id ? null : meal.meal_id
                        )
                      }
                      activeOpacity={0.9}
                    >
                      {/* Meal Header */}
                      <View style={[styles.mealHeader, isRTL && styles.rtlRow]}>
                        <View
                          style={[
                            styles.mealHeaderLeft,
                            isRTL && styles.rtlRow,
                          ]}
                        >
                          <View style={styles.mealIconContainer}>
                            <Ionicons
                              name={getMealTypeIcon(meal.meal_type)}
                              size={24}
                              color="#10b981"
                            />
                          </View>
                          <View
                            style={[
                              styles.mealInfo,
                              isRTL && styles.rtlMealInfo,
                            ]}
                          >
                            <Text
                              style={[styles.mealName, isRTL && styles.rtlText]}
                            >
                              {meal.name}
                            </Text>
                            <View
                              style={[
                                styles.mealMetaRow,
                                isRTL && styles.rtlRow,
                              ]}
                            >
                              <View style={styles.mealTypeBadge}>
                                <Text
                                  style={[
                                    styles.mealTypeText,
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
                                    color="#6b7280"
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
                            color="#6b7280"
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
                    </TouchableOpacity>

                    {/* Expanded Details */}
                    {expandedMeal === meal.meal_id && (
                      <View style={styles.expandedDetails}>
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
                              color="#10b981"
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
    backgroundColor: "#f8fafc",
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
  quickNutrition: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  nutritionPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  nutritionPreviewItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    flex: 1,
  },
  expandedDetails: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 12,
  },

  detailSection: {
    marginBottom: 24,
  },

  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
    textTransform: "capitalize",
  },

  ingredientsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  ingredientChip: {
    backgroundColor: "#f1f3f4",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 6,
  },

  ingredientText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
    textAlign: "center",
  },

  instructionsList: {
    marginTop: 8,
  },

  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingRight: 8,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#10b981",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  stepNumberText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },

  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#495057",
    fontWeight: "400",
    textAlign: "left",
  },

  cookingMethodBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },

  cookingMethodText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#065f46",
    textTransform: "capitalize",
  },

  nutritionPreviewValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 4,
    textAlign: "center",
  },

  nutritionPreviewLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6c757d",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 32,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 32,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
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
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "400",
  },
  headerBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  headerBadgeLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    paddingTop: 90,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  heroContent: {
    padding: 20,
  },
  heroHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 6,
  },
  heroDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "400",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - 70) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  costText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },

  // Day Selector
  daySelectorContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  daySelector: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    padding: 16,
  },
  daySelectorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  daysContainer: {
    paddingRight: 10,
  },
  dayChip: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  selectedDayChip: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  selectedDayChipText: {
    color: "#ffffff",
  },

  // Meals
  mealsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  mealCardContainer: {
    marginBottom: 16,
  },
  mealCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  mealHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  mealMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealTypeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mealTypeText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  timeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  mealStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  caloriesBadge: {
    alignItems: "center",
  },
  caloriesValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  caloriesLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6c757d",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
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
  instructionsSection: {},
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
});

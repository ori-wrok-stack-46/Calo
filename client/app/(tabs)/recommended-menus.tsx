import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChefHat,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Eye,
  Play,
  X,
  Send,
  Utensils,
  Target,
  Activity,
  Filter,
  Search,
  CircleCheck as CheckCircle,
  ArrowRight,
  Flame,
  TrendingUp,
  Award,
  Heart,
  Zap,
} from "lucide-react-native";
import ShoppingList from "@/components/ShoppingList";
import { api } from "@/src/services/api";
import LoadingScreen from "@/components/LoadingScreen";
import { router, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { MenuCreator, MealDetailView, MealsListView } from "@/components/menu";
import { ToastService } from "@/src/services/totastService";

interface RecommendedMenu {
  menu_id: string;
  title: string;
  description?: string;
  total_calories: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  total_fiber?: number;
  days_count: number;
  dietary_category?: string;
  estimated_cost?: number;
  prep_time_minutes?: number;
  difficulty_level: number;
  is_active: boolean;
  created_at: string;
  meals: Array<{
    meal_id: string;
    name: string;
    meal_type: string;
    day_number: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    prep_time_minutes?: number;
    cooking_method?: string;
    instructions?: string;
    ingredients: Array<{
      ingredient_id: string;
      name: string;
      quantity: number;
      unit: string;
      category?: string;
      estimated_cost?: number;
    }>;
  }>;
}

// Filter Types
const FILTER_OPTIONS = [
  { key: "all", label: "All Menus", icon: ChefHat },
  { key: "recent", label: "Recent", icon: Clock },
  { key: "high_protein", label: "High Protein", icon: TrendingUp },
  { key: "low_calorie", label: "Low Calorie", icon: Target },
  { key: "quick_prep", label: "Quick Prep", icon: Zap },
  { key: "budget_friendly", label: "Budget Friendly", icon: DollarSign },
] as const;

// Enhanced Filter Modal
const FilterModal = ({
  visible,
  onClose,
  selectedFilter,
  onFilterSelect,
  colors,
  language,
}: any) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.filterModalOverlay}>
        <View
          style={[
            styles.filterModalContainer,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={styles.filterModalHeader}>
            <Text style={[styles.filterModalTitle, { color: colors.text }]}>
              {language === "he" ? "סנן תפריטים" : "Filter Menus"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.filterCloseButton}
            >
              <X size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterOptions}>
            {FILTER_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedFilter === option.key;

              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: isSelected
                        ? colors.emerald500
                        : colors.surface,
                    },
                  ]}
                  onPress={() => {
                    onFilterSelect(option.key);
                    onClose();
                  }}
                >
                  <IconComponent
                    size={20}
                    color={isSelected ? "#ffffff" : colors.icon}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: isSelected ? "#ffffff" : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && <CheckCircle size={16} color="#ffffff" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced Menu Card Component
const MenuCard = ({
  menu,
  colors,
  isDark,
  language,
  isRTL,
  onStart,
  onView,
}: any) => {
  const avgCaloriesPerDay = Math.round(
    menu.total_calories / (menu.days_count || 1)
  );
  const avgProteinPerDay = Math.round(
    (menu.total_protein || 0) / (menu.days_count || 1)
  );

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return "#10b981"; // Easy - Green
    if (level <= 3) return "#f59e0b"; // Medium - Amber
    return "#ef4444"; // Hard - Red
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 2) return language === "he" ? "קל" : "Easy";
    if (level <= 3) return language === "he" ? "בינוני" : "Medium";
    return language === "he" ? "קשה" : "Hard";
  };

  return (
    <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
      {/* Menu Image Header */}
      <View
        style={[styles.menuImageHeader, { backgroundColor: colors.surface }]}
      >
        <View style={styles.menuImageContent}>
          <ChefHat size={32} color={colors.emerald500} />
          <View style={styles.menuBadges}>
            <View
              style={[styles.badge, { backgroundColor: colors.emerald500 }]}
            >
              <Calendar size={12} color="#ffffff" />
              <Text style={styles.badgeText}>{menu.days_count}d</Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: getDifficultyColor(menu.difficulty_level) },
              ]}
            >
              <Star size={12} color="#ffffff" />
              <Text style={styles.badgeText}>
                {getDifficultyLabel(menu.difficulty_level)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Content */}
      <View style={styles.menuContent}>
        <View style={styles.menuHeader}>
          <Text
            style={[styles.menuTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {menu.title}
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.icon }]}>
            {menu.dietary_category || "Balanced Menu"}
          </Text>
        </View>

        {/* Enhanced Nutrition Grid */}
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <View
              style={[styles.nutritionIcon, { backgroundColor: "#fef3c7" }]}
            >
              <Flame size={16} color="#f59e0b" />
            </View>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>
              {avgCaloriesPerDay}
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
              {language === "he" ? "קלוריות" : "Calories"}
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <View
              style={[styles.nutritionIcon, { backgroundColor: "#dcfce7" }]}
            >
              <TrendingUp size={16} color="#10b981" />
            </View>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>
              {avgProteinPerDay}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
              {language === "he" ? "חלבון" : "Protein"}
            </Text>
          </View>

          <View style={styles.nutritionItem}>
            <View
              style={[styles.nutritionIcon, { backgroundColor: "#f3e8ff" }]}
            >
              <Clock size={16} color="#8b5cf6" />
            </View>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>
              {menu.prep_time_minutes || 30}m
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
              {language === "he" ? "הכנה" : "Prep"}
            </Text>
          </View>
        </View>

        {/* Cost and Rating */}
        <View style={styles.menuMeta}>
          {menu.estimated_cost && (
            <View
              style={[
                styles.costBadge,
                { backgroundColor: colors.success + "20" },
              ]}
            >
              <Text style={[styles.costText, { color: colors.success }]}>
                ₪{menu.estimated_cost.toFixed(0)}
              </Text>
            </View>
          )}

          <View style={styles.ratingBadge}>
            <Star size={14} color="#FFB800" fill="#FFB800" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {menu.difficulty_level}/5
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.menuActions}>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.surface }]}
            onPress={() => onView(menu.menu_id)}
          >
            <Eye size={16} color={colors.icon} />
            <Text style={[styles.viewButtonText, { color: colors.icon }]}>
              {language === "he" ? "צפה" : "View"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.emerald500 }]}
            onPress={() => onStart(menu.menu_id)}
          >
            <Play size={16} color="#ffffff" />
            <Text style={styles.startButtonText}>
              {language === "he" ? "התחל" : "Start"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Active Plan Card Component
const ActivePlanCard = ({ plan, colors, language, onContinue }: any) => {
  return (
    <View
      style={[styles.activePlanCard, { backgroundColor: colors.emerald500 }]}
    >
      <View style={styles.activePlanHeader}>
        <View style={styles.activePlanBadge}>
          <CheckCircle size={16} color="#ffffff" />
          <Text style={styles.activePlanBadgeText}>
            {language === "he" ? "פעיל" : "Active"}
          </Text>
        </View>
        <TouchableOpacity onPress={onContinue} style={styles.activePlanAction}>
          <ArrowRight size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.activePlanTitle}>
        {plan.name ||
          (language === "he" ? "התוכנית הפעילה שלך" : "Your Active Plan")}
      </Text>

      <Text style={styles.activePlanSubtitle}>
        {language === "he"
          ? "המשך לעקוב אחר התקדמותך"
          : "Continue tracking your progress"}
      </Text>

      <TouchableOpacity
        style={styles.activePlanContinueButton}
        onPress={onContinue}
      >
        <Text style={styles.activePlanContinueText}>
          {language === "he" ? "המשך התוכנית" : "Continue Plan"}
        </Text>
        <ArrowRight size={14} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

// Quick Stats Component
const QuickStats = ({ menus, colors, language }: any) => {
  const stats = useMemo(() => {
    if (!menus.length) return null;

    const totalCalories = menus.reduce(
      (sum: number, menu: any) => sum + (menu.total_calories || 0),
      0
    );
    const avgCalories = Math.round(totalCalories / menus.length);
    const totalMeals = menus.reduce(
      (sum: number, menu: any) => sum + menu.meals.length,
      0
    );
    const avgCost = Math.round(
      menus.reduce(
        (sum: number, menu: any) => sum + (menu.estimated_cost || 0),
        0
      ) / menus.length
    );

    return {
      totalMenus: menus.length,
      avgCalories,
      totalMeals,
      avgCost,
    };
  }, [menus]);

  if (!stats) return null;

  return (
    <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
      <View style={styles.statsHeader}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          {language === "he" ? "סיכום תפריטים" : "Menu Overview"}
        </Text>
        <Award size={20} color={colors.emerald500} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.emerald500 }]}>
            {stats.totalMenus}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {language === "he" ? "תפריטים" : "Menus"}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.emerald500 }]}>
            {stats.avgCalories}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {language === "he" ? 'ק"ק ממוצע' : "Avg Cal"}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.emerald500 }]}>
            {stats.totalMeals}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {language === "he" ? "ארוחות" : "Meals"}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.emerald500 }]}>
            ₪{stats.avgCost}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {language === "he" ? "עלות ממוצעת" : "Avg Cost"}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Category Pills Component
const CategoryPills = ({ colors, language }: any) => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { key: "all", label: language === "he" ? "הכל" : "All", icon: ChefHat },
    {
      key: "healthy",
      label: language === "he" ? "בריא" : "Healthy",
      icon: Heart,
    },
    { key: "keto", label: language === "he" ? "קטו" : "Keto", icon: Target },
    {
      key: "protein",
      label: language === "he" ? "חלבון" : "Protein",
      icon: Activity,
    },
    { key: "quick", label: language === "he" ? "מהיר" : "Quick", icon: Zap },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScrollContainer}
      contentContainerStyle={styles.categoryContainer}
    >
      {categories.map((category) => {
        const IconComponent = category.icon;
        const isActive = selectedCategory === category.key;

        return (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryPill,
              {
                backgroundColor: isActive ? colors.emerald500 : colors.surface,
              },
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <IconComponent
              size={16}
              color={isActive ? "#ffffff" : colors.icon}
            />
            <Text
              style={[
                styles.categoryText,
                { color: isActive ? "#ffffff" : colors.text },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default function RecommendedMenusScreen() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  // State
  const [menus, setMenus] = useState<RecommendedMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [activePlanData, setActivePlanData] = useState<any>(null);
  const [showEnhancedCreation, setShowEnhancedCreation] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMenuToStart, setSelectedMenuToStart] = useState<string | null>(
    null
  );
  const [currentActivePlan, setCurrentActivePlan] = useState<any>(null);

  // Enhanced creation form states
  const [menuName, setMenuName] = useState("");
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedDietaryPreference, setSelectedDietaryPreference] =
    useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [budget, setBudget] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Feedback form
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    liked: "",
    disliked: "",
    suggestions: "",
  });

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadRecommendedMenus();
    checkForActivePlan();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkForActivePlan();
    }, [])
  );

  const loadRecommendedMenus = async () => {
    try {
      const response = await api.get("/recommended-menus");
      if (response.data.success) {
        setMenus(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading menus:", error);
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForActivePlan = async () => {
    try {
      const response = await api.get("/meal-plans/current");
      if (
        response.data.success &&
        response.data.hasActivePlan &&
        response.data.data
      ) {
        const planData = {
          plan_id: response.data.planId,
          name: response.data.planName || "Active Plan",
          data: response.data.data,
        };
        setCurrentActivePlan(planData);
        setActivePlanData(planData);
        setHasActivePlan(true);
      } else {
        setCurrentActivePlan(null);
        setActivePlanData(null);
        setHasActivePlan(false);
      }
    } catch (error) {
      setCurrentActivePlan(null);
      setActivePlanData(null);
      setHasActivePlan(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecommendedMenus();
    await checkForActivePlan();
    setRefreshing(false);
  }, []);

  const handleStartMenu = async (menuId: string) => {
    try {
      setSelectedMenuToStart(menuId);
      if (currentActivePlan) {
        setShowFeedbackModal(true);
      } else {
        await activateMenuPlan(menuId);
      }
    } catch (error: any) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        error.message ||
          (language === "he" ? "נכשל בהפעלת התפריט" : "Failed to start menu")
      );
    }
  };

  const activateMenuPlan = async (
    menuId: string,
    previousPlanFeedback?: any
  ) => {
    try {
      if (previousPlanFeedback && currentActivePlan) {
        await api.post(
          `/meal-plans/${currentActivePlan.plan_id}/complete`,
          previousPlanFeedback
        );
      }

      const response = await api.post(
        `/recommended-menus/${menuId}/start-today`,
        previousPlanFeedback || {}
      );

      if (response.data.success && response.data.data) {
        const newPlan = response.data.data;
        setCurrentActivePlan(newPlan);
        setHasActivePlan(true);
        setShowFeedbackModal(false);
        setSelectedMenuToStart(null);

        Alert.alert(
          language === "he" ? "הצלחה!" : "Success!",
          language === "he"
            ? "התפריט הופעל בהצלחה!"
            : "Menu started successfully!",
          [
            {
              text: language === "he" ? "אישור" : "OK",
              onPress: () =>
                router.push(`/menu/activeMenu?planId=${newPlan.plan_id}`),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        error.message ||
          (language === "he" ? "נכשל בהפעלת התפריט" : "Failed to start menu")
      );
    }
  };

  const handleCreateEnhancedMenu = async () => {
    if (!menuName.trim()) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he" ? "אנא הכנס שם תפריט" : "Please enter a menu name"
      );
      return;
    }

    try {
      setIsGenerating(true);

      let userQuestionnaire = null;
      try {
        const questionnaireData = await AsyncStorage.getItem(
          "user_questionnaire"
        );
        if (questionnaireData) {
          userQuestionnaire = JSON.parse(questionnaireData);
        }
      } catch (error) {
        console.error("Error loading questionnaire:", error);
      }

      const payload = {
        name: menuName,
        days: selectedDays,
        mealsPerDay: "3",
        dietaryPreference: selectedDietaryPreference,
        targetCalories: targetCalories ? parseFloat(targetCalories) : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        specialRequests: specialRequests.trim(),
        userQuestionnaire: userQuestionnaire,
      };

      const response = await api.post(
        "/recommended-menus/generate-enhanced",
        payload
      );

      if (response.data.success) {
        setShowEnhancedCreation(false);
        resetEnhancedForm();

        Alert.alert(
          language === "he" ? "הצלחה!" : "Success!",
          language === "he"
            ? "תפריט מותאם נוצר בהצלחה!"
            : "Enhanced menu created successfully!",
          [
            {
              text: language === "he" ? "אישור" : "OK",
              onPress: loadRecommendedMenus,
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        error.message ||
          (language === "he" ? "נכשל ביצירת תפריט" : "Failed to create menu")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const resetEnhancedForm = () => {
    setMenuName("");
    setSelectedDietaryPreference("");
    setTargetCalories("");
    setBudget("");
    setSpecialRequests("");
  };

  const handleFeedbackSubmit = async () => {
    if (feedbackForm.rating === 0) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he" ? "אנא דרג את התוכנית" : "Please rate the plan"
      );
      return;
    }

    const previousPlanFeedback = {
      rating: feedbackForm.rating,
      liked: feedbackForm.liked,
      disliked: feedbackForm.disliked,
      suggestions: feedbackForm.suggestions,
    };

    await activateMenuPlan(selectedMenuToStart!, previousPlanFeedback);
  };

  // Filter menus to exclude active plan and apply filters
  const filteredMenus = useMemo(() => {
    let filtered = menus.filter((menu) => {
      // Exclude the currently active menu from recommendations
      if (
        hasActivePlan &&
        activePlanData &&
        menu.menu_id === activePlanData.plan_id
      ) {
        return false;
      }
      return true;
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (menu) =>
          menu.title.toLowerCase().includes(query) ||
          menu.description?.toLowerCase().includes(query) ||
          menu.dietary_category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((menu) => {
        switch (selectedFilter) {
          case "recent":
            if (menu.created_at) {
              const menuDate = new Date(menu.created_at);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return menuDate > weekAgo;
            }
            return false;

          case "high_protein":
            const proteinRatio =
              ((menu.total_protein || 0) / (menu.total_calories || 1)) * 4;
            return proteinRatio >= 0.25;

          case "low_calorie":
            const avgCaloriesPerDay =
              menu.total_calories / (menu.days_count || 1);
            return avgCaloriesPerDay <= 1800;

          case "quick_prep":
            return (menu.prep_time_minutes || 60) <= 30;

          case "budget_friendly":
            return (menu.estimated_cost || 1000) <= 200;

          default:
            return true;
        }
      });
    }

    return filtered;
  }, [menus, searchQuery, selectedFilter, hasActivePlan, activePlanData]);

  // Enhanced creation modal
  const renderEnhancedCreationModal = () => (
    <Modal
      visible={showEnhancedCreation}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEnhancedCreation(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.enhancedModalContainer,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowEnhancedCreation(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === "he" ? "יצירת תפריט מותאם" : "Create Custom Menu"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Menu Name */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "שם התפריט" : "Menu Name"} *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={menuName}
                onChangeText={setMenuName}
                placeholder={
                  language === "he" ? "הכנס שם לתפריט..." : "Enter menu name..."
                }
                placeholderTextColor={colors.icon}
              />
            </View>

            {/* Days Selection */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "מספר ימים" : "Number of Days"}
              </Text>
              <View style={styles.chipContainer}>
                {[3, 5, 7, 14].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedDays === days
                            ? colors.emerald500
                            : colors.surface,
                        borderColor:
                          selectedDays === days
                            ? colors.emerald500
                            : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedDays(days)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            selectedDays === days ? "#ffffff" : colors.text,
                        },
                      ]}
                    >
                      {days} {language === "he" ? "ימים" : "days"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dietary Preferences */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "העדפה תזונתית" : "Dietary Preference"}
              </Text>
              <View style={styles.chipContainer}>
                {[
                  { key: "balanced", label: "Balanced" },
                  { key: "vegetarian", label: "Vegetarian" },
                  { key: "vegan", label: "Vegan" },
                  { key: "keto", label: "Keto" },
                  { key: "low_carb", label: "Low Carb" },
                  { key: "high_protein", label: "High Protein" },
                ].map((pref) => (
                  <TouchableOpacity
                    key={pref.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedDietaryPreference === pref.key
                            ? colors.emerald500
                            : colors.surface,
                        borderColor:
                          selectedDietaryPreference === pref.key
                            ? colors.emerald500
                            : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedDietaryPreference(pref.key)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            selectedDietaryPreference === pref.key
                              ? "#ffffff"
                              : colors.text,
                        },
                      ]}
                    >
                      {pref.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Calories */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he"
                  ? "יעד קלוריות יומי"
                  : "Daily Calorie Target"}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={targetCalories}
                onChangeText={setTargetCalories}
                placeholder="2000"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>

            {/* Budget */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "תקציב (₪)" : "Budget (₪)"}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={budget}
                onChangeText={setBudget}
                placeholder="300"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>

            {/* Special Requests */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "בקשות מיוחדות" : "Special Requests"}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                placeholder={
                  language === "he"
                    ? "כל בקשה מיוחדת..."
                    : "Any special requests..."
                }
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: menuName.trim()
                    ? colors.emerald500
                    : colors.border,
                },
              ]}
              onPress={handleCreateEnhancedMenu}
              disabled={!menuName.trim() || isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <ChefHat size={18} color="#ffffff" />
              )}
              <Text style={styles.submitButtonText}>
                {language === "he" ? "צור תפריט מותאם" : "Create Custom Menu"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Feedback modal
  const renderFeedbackModal = () => (
    <Modal
      visible={showFeedbackModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFeedbackModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.enhancedModalContainer,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowFeedbackModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === "he"
                ? "דרג את התוכנית הקודמת"
                : "Rate Previous Plan"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Rating Section */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "דירוג כללי" : "Overall Rating"}
              </Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() =>
                      setFeedbackForm({ ...feedbackForm, rating: star })
                    }
                    style={styles.starButton}
                  >
                    <Text
                      style={[
                        styles.starText,
                        {
                          color:
                            feedbackForm.rating >= star
                              ? "#FFB800"
                              : colors.border,
                        },
                      ]}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Feedback Inputs */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "מה אהבת?" : "What did you like?"}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={feedbackForm.liked}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, liked: text })
                }
                placeholder={
                  language === "he"
                    ? "ספר לנו מה אהבת..."
                    : "Tell us what you enjoyed..."
                }
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "מה לא אהבת?" : "What didn't you like?"}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={feedbackForm.disliked}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, disliked: text })
                }
                placeholder={
                  language === "he" ? "מה היית משנה?" : "What would you change?"
                }
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor:
                    feedbackForm.rating > 0 ? colors.emerald500 : colors.border,
                },
              ]}
              onPress={handleFeedbackSubmit}
              disabled={feedbackForm.rating === 0}
            >
              <Send size={18} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {language === "he"
                  ? "שלח משוב והתחל"
                  : "Submit & Start New Plan"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <LoadingScreen text={isRTL ? "טוען תפריטים..." : "Loading menus..."} />
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Fixed Search Header */}
      <View
        style={[styles.searchHeader, { backgroundColor: colors.background }]}
      >
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Search size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={
                language === "he" ? "חיפוש תפריטים..." : "Search menus..."
              }
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.icon}
            />
          </View>

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={[styles.scrollContent, { opacity: fadeAnim }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.emerald500]}
            tintColor={colors.emerald500}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Page Title */}
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            {language === "he" ? "תפריטים מומלצים" : "Recommended Menus"}
          </Text>

          {/* Active Plan Card */}
          {hasActivePlan && activePlanData && (
            <ActivePlanCard
              plan={activePlanData}
              colors={colors}
              language={language}
              onContinue={() =>
                router.push(`/menu/activeMenu?planId=${activePlanData.plan_id}`)
              }
            />
          )}

          {/* Category Pills */}
          <CategoryPills colors={colors} language={language} />

          {/* Create New Menu Button */}
          <TouchableOpacity
            style={[
              styles.createMenuButton,
              { backgroundColor: colors.emerald500 },
            ]}
            onPress={() => setShowEnhancedCreation(true)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Plus size={20} color="#ffffff" />
            )}
            <Text style={styles.createMenuButtonText}>
              {language === "he" ? "צור תפריט חדש" : "Create New Menu"}
            </Text>
          </TouchableOpacity>

          {/* Quick Stats */}
          {filteredMenus.length > 0 && (
            <QuickStats
              menus={filteredMenus}
              colors={colors}
              language={language}
            />
          )}

          {/* Menus List */}
          {filteredMenus.length > 0 ? (
            <View style={styles.menusGrid}>
              {filteredMenus.map((menu) => (
                <MenuCard
                  key={menu.menu_id}
                  menu={menu}
                  colors={colors}
                  isDark={isDark}
                  language={language}
                  isRTL={isRTL}
                  onStart={handleStartMenu}
                  onView={(menuId: string) => router.push(`/menu/${menuId}`)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View
                style={[styles.emptyIcon, { backgroundColor: colors.surface }]}
              >
                <ChefHat size={48} color={colors.emerald500} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery.trim()
                  ? language === "he"
                    ? "לא נמצאו תוצאות"
                    : "No results found"
                  : language === "he"
                  ? "אין תפריטים זמינים"
                  : "No menus available"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                {searchQuery.trim()
                  ? language === "he"
                    ? "נסה מילות חיפוש אחרות"
                    : "Try different search terms"
                  : language === "he"
                  ? "צור תפריט מותאם אישית כדי להתחיל"
                  : "Create a personalized menu to get started"}
              </Text>

              {!searchQuery.trim() && (
                <TouchableOpacity
                  style={[
                    styles.emptyButton,
                    { backgroundColor: colors.emerald500 },
                  ]}
                  onPress={() => setShowEnhancedCreation(true)}
                >
                  <Plus size={18} color="#ffffff" />
                  <Text style={styles.emptyButtonText}>
                    {language === "he"
                      ? "צור תפריט ראשון"
                      : "Create First Menu"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Modals */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedFilter={selectedFilter}
        onFilterSelect={setSelectedFilter}
        colors={colors}
        language={language}
      />

      {renderFeedbackModal()}
      {renderEnhancedCreationModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Fixed Search Header
  searchHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },

  searchContainer: {
    flexDirection: "row",
    gap: 12,
  },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Scrollable Content
  scrollContent: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  // Active Plan Card
  activePlanCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
  },

  activePlanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  activePlanBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },

  activePlanBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  activePlanAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  activePlanTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },

  activePlanSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 16,
  },

  activePlanContinueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },

  activePlanContinueText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Category Scroll
  categoryScrollContainer: {
    marginBottom: 24,
  },

  categoryContainer: {
    paddingRight: 20,
    gap: 12,
  },

  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },

  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Create Menu Button
  createMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  createMenuButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Quick Stats Card
  statsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statItem: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },

  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Menus Grid
  menusGrid: {
    gap: 20,
  },

  // Enhanced Menu Cards
  menuCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  menuImageHeader: {
    height: 120,
    justifyContent: "space-between",
    padding: 16,
  },

  menuImageContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  menuBadges: {
    gap: 8,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },

  menuContent: {
    padding: 16,
  },

  menuHeader: {
    marginBottom: 16,
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },

  menuSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Enhanced Nutrition Grid
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  nutritionItem: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  nutritionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  nutritionValue: {
    fontSize: 16,
    fontWeight: "bold",
  },

  nutritionLabel: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Menu Meta
  menuMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },

  costText: {
    fontSize: 14,
    fontWeight: "600",
  },

  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Action Buttons
  menuActions: {
    flexDirection: "row",
    gap: 12,
  },

  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },

  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  startButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },

  startButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },

  emptyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  filterModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },

  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },

  filterModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  filterCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  filterOptions: {
    padding: 20,
  },

  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },

  filterOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  enhancedModalContainer: {
    maxHeight: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },

  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Form Inputs
  inputSection: {
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },

  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    height: 100,
  },

  // Chips
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Rating
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },

  starButton: {
    padding: 8,
  },

  starText: {
    fontSize: 28,
  },

  // Submit Button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },

  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

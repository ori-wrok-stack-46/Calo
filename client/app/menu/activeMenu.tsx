import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import {
  ChefHat,
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  Circle,
  MessageSquare,
  X,
  ArrowLeft,
  TrendingUp,
  Award,
  Target,
  Utensils,
  Edit3,
  Save,
} from "lucide-react-native";
import { api } from "@/src/services/api";
import LoadingScreen from "@/components/LoadingScreen";

const { width } = Dimensions.get("window");

interface ActivePlan {
  id: string;
  menu_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: "active" | "completed" | "cancelled";
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  days_count: number;
  meals: PlanMeal[];
  progress: {
    completed_meals: number;
    total_meals: number;
    completion_percentage: number;
  };
}

interface PlanMeal {
  meal_id: string;
  name: string;
  meal_type: string;
  day_number: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time_minutes?: number;
  cooking_method?: string;
  instructions?: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  tracking?: {
    completed: boolean;
    completion_date?: string;
    location?: string;
    notes?: string;
    heaviness_rating?: number;
    difficulty_rating?: number;
    satisfaction_rating?: number;
    taste_rating?: number;
    overall_rating?: number;
  };
}

interface EndPlanFeedback {
  reason: string;
  feedback_text: string;
  rating: number;
  improvements: string;
}

export default function ActivePlanScreen() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const router = useRouter();
  const { planId } = useLocalSearchParams();

  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<PlanMeal | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showEndPlanModal, setShowEndPlanModal] = useState(false);
  const [endPlanFeedback, setEndPlanFeedback] = useState<EndPlanFeedback>({
    reason: "",
    feedback_text: "",
    rating: 5,
    improvements: "",
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Meal tracking state
  const [mealLocation, setMealLocation] = useState("");
  const [mealNotes, setMealNotes] = useState("");
  const [ratings, setRatings] = useState({
    heaviness: 3,
    difficulty: 3,
    satisfaction: 3,
    taste: 3,
    overall: 3,
  });

  useEffect(() => {
    loadActivePlan();
  }, [planId]);

  const loadActivePlan = async () => {
    try {
      console.log("📋 Loading active plan:", planId);
      const response = await api.get(`/active-plans/${planId}`);

      if (response.data.success) {
        setActivePlan(response.data.data);
        console.log("✅ Active plan loaded successfully");
      } else {
        throw new Error(response.data.error || "Failed to load active plan");
      }
    } catch (error) {
      console.error("💥 Error loading active plan:", error);
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he"
          ? "לא ניתן לטעון את התוכנית הפעילה"
          : "Failed to load active plan"
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivePlan();
    setRefreshing(false);
  }, []);

  const handleMealPress = (meal: PlanMeal) => {
    setSelectedMeal(meal);
    setMealLocation(meal.tracking?.location || "");
    setMealNotes(meal.tracking?.notes || "");
    setRatings({
      heaviness: meal.tracking?.heaviness_rating || 3,
      difficulty: meal.tracking?.difficulty_rating || 3,
      satisfaction: meal.tracking?.satisfaction_rating || 3,
      taste: meal.tracking?.taste_rating || 3,
      overall: meal.tracking?.overall_rating || 3,
    });
    setShowMealModal(true);
  };

  const handleMealCheckIn = async () => {
    if (!selectedMeal || !activePlan) return;

    try {
      console.log("✅ Checking in meal:", selectedMeal.meal_id);

      const trackingData = {
        completed: true,
        completion_date: new Date().toISOString(),
        location: mealLocation.trim() || undefined,
        notes: mealNotes.trim() || undefined,
        heaviness_rating: ratings.heaviness,
        difficulty_rating: ratings.difficulty,
        satisfaction_rating: ratings.satisfaction,
        taste_rating: ratings.taste,
        overall_rating: ratings.overall,
      };

      const response = await api.put(
        `/active-plans/${activePlan.id}/meals/${selectedMeal.meal_id}`,
        trackingData
      );

      if (response.data.success) {
        // Update local state
        setActivePlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            meals: prev.meals.map((meal) =>
              meal.meal_id === selectedMeal.meal_id
                ? { ...meal, tracking: trackingData }
                : meal
            ),
            progress: {
              ...prev.progress,
              completed_meals: prev.progress.completed_meals + 1,
              completion_percentage:
                ((prev.progress.completed_meals + 1) /
                  prev.progress.total_meals) *
                100,
            },
          };
        });

        setShowMealModal(false);
        Alert.alert(
          language === "he" ? "הצלחה!" : "Success!",
          language === "he"
            ? "הארוחה נרשמה בהצלחה"
            : "Meal checked in successfully"
        );
      }
    } catch (error) {
      console.error("💥 Error checking in meal:", error);
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he"
          ? "נכשל ברישום הארוחה"
          : "Failed to check in meal"
      );
    }
  };

  const handleEndPlan = async () => {
    if (!endPlanFeedback.reason.trim()) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he"
          ? "אנא בחר סיבה לסיום התוכנית"
          : "Please select a reason for ending the plan"
      );
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      console.log("🔚 Ending plan with feedback:", endPlanFeedback);

      const response = await api.post(`/active-plans/${activePlan?.id}/end`, {
        reason_for_ending: endPlanFeedback.reason,
        feedback_text: endPlanFeedback.feedback_text,
        rating: endPlanFeedback.rating,
        improvements: endPlanFeedback.improvements,
      });

      if (response.data.success) {
        Alert.alert(
          language === "he" ? "תודה!" : "Thank you!",
          language === "he"
            ? "המשוב שלך נשמר בהצלחה"
            : "Your feedback has been saved successfully",
          [
            {
              text: language === "he" ? "אישור" : "OK",
              onPress: () => {
                router.replace("/(tabs)/recommended-menus");
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("💥 Error ending plan:", error);
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he" ? "נכשל בסיום התוכנית" : "Failed to end plan"
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const renderStarRating = (
    rating: number,
    onPress: (rating: number) => void,
    size: number = 20
  ) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
          >
            <Star
              size={size}
              color={star <= rating ? "#fbbf24" : "#d1d5db"}
              fill={star <= rating ? "#fbbf24" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMealCard = (meal: PlanMeal, index: number) => {
    const isCompleted = meal.tracking?.completed || false;
    const dayName = language === "he" ? `יום ${meal.day_number}` : `Day ${meal.day_number}`;

    return (
      <TouchableOpacity
        key={meal.meal_id}
        style={[
          styles.mealCard,
          isCompleted && styles.completedMealCard,
        ]}
        onPress={() => handleMealPress(meal)}
        activeOpacity={0.7}
      >
        <View style={styles.mealCardHeader}>
          <View style={styles.mealInfo}>
            <Text style={[styles.mealName, isRTL && styles.rtlText]}>
              {meal.name}
            </Text>
            <Text style={[styles.mealMeta, isRTL && styles.rtlText]}>
              {dayName} • {meal.meal_type}
            </Text>
          </View>
          <View style={styles.mealStatus}>
            {isCompleted ? (
              <CheckCircle size={24} color="#10b981" />
            ) : (
              <Circle size={24} color="#d1d5db" />
            )}
          </View>
        </View>

        <View style={styles.mealNutrition}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.calories}</Text>
            <Text style={styles.nutritionLabel}>
              {language === "he" ? "קלוריות" : "Cal"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.protein}g</Text>
            <Text style={styles.nutritionLabel}>
              {language === "he" ? "חלבון" : "Protein"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.carbs}g</Text>
            <Text style={styles.nutritionLabel}>
              {language === "he" ? "פחמימות" : "Carbs"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.fat}g</Text>
            <Text style={styles.nutritionLabel}>
              {language === "he" ? "שומן" : "Fat"}
            </Text>
          </View>
        </View>

        {meal.prep_time_minutes && (
          <View style={styles.mealFooter}>
            <Clock size={14} color="#6b7280" />
            <Text style={styles.prepTime}>
              {meal.prep_time_minutes} {language === "he" ? "דק'" : "min"}
            </Text>
          </View>
        )}

        {isCompleted && meal.tracking && (
          <View style={styles.completionInfo}>
            <Text style={styles.completionText}>
              {language === "he" ? "הושלם ב-" : "Completed on "}
              {new Date(meal.tracking.completion_date!).toLocaleDateString()}
            </Text>
            {meal.tracking.overall_rating && (
              <View style={styles.ratingDisplay}>
                <Star size={12} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.ratingText}>
                  {meal.tracking.overall_rating}/5
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMealModal = () => (
    <Modal
      visible={showMealModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMealModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>
              {selectedMeal?.name}
            </Text>
            <TouchableOpacity onPress={() => setShowMealModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Meal Details */}
            <View style={styles.mealDetailsSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {language === "he" ? "פרטי הארוחה" : "Meal Details"}
              </Text>
              
              {selectedMeal?.instructions && (
                <Text style={[styles.instructionsText, isRTL && styles.rtlText]}>
                  {selectedMeal.instructions}
                </Text>
              )}

              {selectedMeal?.ingredients && selectedMeal.ingredients.length > 0 && (
                <View style={styles.ingredientsContainer}>
                  <Text style={[styles.ingredientsTitle, isRTL && styles.rtlText]}>
                    {language === "he" ? "רכיבים:" : "Ingredients:"}
                  </Text>
                  {selectedMeal.ingredients.map((ingredient, index) => (
                    <Text key={index} style={[styles.ingredientText, isRTL && styles.rtlText]}>
                      • {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Location Input */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>
                {language === "he" ? "מיקום (אופציונלי)" : "Location (Optional)"}
              </Text>
              <View style={styles.inputContainer}>
                <MapPin size={16} color="#6b7280" />
                <TextInput
                  style={[styles.textInput, isRTL && styles.rtlTextInput]}
                  placeholder={
                    language === "he" ? "איפה אכלת?" : "Where did you eat?"
                  }
                  placeholderTextColor="#9ca3af"
                  value={mealLocation}
                  onChangeText={setMealLocation}
                  textAlign={isRTL ? "right" : "left"}
                />
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>
                {language === "he" ? "הערות (אופציונלי)" : "Notes (Optional)"}
              </Text>
              <View style={styles.inputContainer}>
                <MessageSquare size={16} color="#6b7280" />
                <TextInput
                  style={[styles.textInput, styles.notesInput, isRTL && styles.rtlTextInput]}
                  placeholder={
                    language === "he"
                      ? "איך הייתה הארוחה?"
                      : "How was the meal?"
                  }
                  placeholderTextColor="#9ca3af"
                  value={mealNotes}
                  onChangeText={setMealNotes}
                  multiline
                  numberOfLines={3}
                  textAlign={isRTL ? "right" : "left"}
                />
              </View>
            </View>

            {/* Rating System */}
            <View style={styles.ratingsSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {language === "he" ? "דרג את הארוחה" : "Rate the Meal"}
              </Text>

              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, isRTL && styles.rtlText]}>
                  {language === "he" ? "כבדות" : "Heaviness"}
                </Text>
                <Text style={[styles.ratingDescription, isRTL && styles.rtlText]}>
                  {language === "he" ? "קל → כבד" : "Light → Heavy"}
                </Text>
                {renderStarRating(ratings.heaviness, (rating) =>
                  setRatings((prev) => ({ ...prev, heaviness: rating }))
                )}
              </View>

              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, isRTL && styles.rtlText]}>
                  {language === "he" ? "קושי הכנה" : "Difficulty"}
                </Text>
                <Text style={[styles.ratingDescription, isRTL && styles.rtlText]}>
                  {language === "he" ? "קל → קשה" : "Easy → Hard"}
                </Text>
                {renderStarRating(ratings.difficulty, (rating) =>
                  setRatings((prev) => ({ ...prev, difficulty: rating }))
                )}
              </View>

              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, isRTL && styles.rtlText]}>
                  {language === "he" ? "שובע" : "Satisfaction"}
                </Text>
                <Text style={[styles.ratingDescription, isRTL && styles.rtlText]}>
                  {language === "he" ? "לא שבע → שבע מאוד" : "Not satisfied → Very satisfied"}
                </Text>
                {renderStarRating(ratings.satisfaction, (rating) =>
                  setRatings((prev) => ({ ...prev, satisfaction: rating }))
                )}
              </View>

              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, isRTL && styles.rtlText]}>
                  {language === "he" ? "טעם" : "Taste"}
                </Text>
                <Text style={[styles.ratingDescription, isRTL && styles.rtlText]}>
                  {language === "he" ? "גרוע → מעולה" : "Poor → Excellent"}
                </Text>
                {renderStarRating(ratings.taste, (rating) =>
                  setRatings((prev) => ({ ...prev, taste: rating }))
                )}
              </View>

              <View style={styles.ratingItem}>
                <Text style={[styles.ratingLabel, isRTL && styles.rtlText]}>
                  {language === "he" ? "חוויה כללית" : "Overall Experience"}
                </Text>
                <Text style={[styles.ratingDescription, isRTL && styles.rtlText]}>
                  {language === "he" ? "גרועה → מעולה" : "Poor → Excellent"}
                </Text>
                {renderStarRating(ratings.overall, (rating) =>
                  setRatings((prev) => ({ ...prev, overall: rating }))
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMealModal(false)}
            >
              <Text style={styles.cancelButtonText}>
                {language === "he" ? "ביטול" : "Cancel"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkInButton}
              onPress={handleMealCheckIn}
            >
              <CheckCircle size={16} color="#ffffff" />
              <Text style={styles.checkInButtonText}>
                {language === "he" ? "רשום ארוחה" : "Check In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEndPlanModal = () => (
    <Modal
      visible={showEndPlanModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEndPlanModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>
              {language === "he" ? "סיום התוכנית" : "End Plan"}
            </Text>
            <TouchableOpacity onPress={() => setShowEndPlanModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Reason Selection */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>
                {language === "he" ? "סיבת הסיום *" : "Reason for Ending *"}
              </Text>
              <View style={styles.reasonButtons}>
                {[
                  { key: "completed", label: language === "he" ? "השלמתי את התוכנית" : "Completed the plan" },
                  { key: "too_difficult", label: language === "he" ? "קשה מדי" : "Too difficult" },
                  { key: "not_tasty", label: language === "he" ? "לא טעים" : "Not tasty" },
                  { key: "no_time", label: language === "he" ? "אין זמן" : "No time" },
                  { key: "other", label: language === "he" ? "אחר" : "Other" },
                ].map((reason) => (
                  <TouchableOpacity
                    key={reason.key}
                    style={[
                      styles.reasonButton,
                      endPlanFeedback.reason === reason.key && styles.selectedReasonButton,
                    ]}
                    onPress={() =>
                      setEndPlanFeedback((prev) => ({ ...prev, reason: reason.key }))
                    }
                  >
                    <Text
                      style={[
                        styles.reasonButtonText,
                        endPlanFeedback.reason === reason.key && styles.selectedReasonButtonText,
                        isRTL && styles.rtlText,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Feedback Text */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>
                {language === "he" ? "משוב נוסף" : "Additional Feedback"}
              </Text>
              <TextInput
                style={[styles.textAreaInput, isRTL && styles.rtlTextInput]}
                placeholder={
                  language === "he"
                    ? "ספר לנו על החוויה שלך..."
                    : "Tell us about your experience..."
                }
                placeholderTextColor="#9ca3af"
                value={endPlanFeedback.feedback_text}
                onChangeText={(text) =>
                  setEndPlanFeedback((prev) => ({ ...prev, feedback_text: text }))
                }
                multiline
                numberOfLines={4}
                textAlign={isRTL ? "right" : "left"}
              />
            </View>

            {/* Overall Rating */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>
                {language === "he" ? "דירוג כללי" : "Overall Rating"}
              </Text>
              {renderStarRating(
                endPlanFeedback.rating,
                (rating) =>
                  setEndPlanFeedback((prev) => ({ ...prev, rating })),
                24
              )}
            </View>

            {/* Improvements */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>
                {language === "he" ? "הצעות לשיפור" : "Improvement Suggestions"}
              </Text>
              <TextInput
                style={[styles.textAreaInput, isRTL && styles.rtlTextInput]}
                placeholder={
                  language === "he"
                    ? "איך נוכל לשפר?"
                    : "How can we improve?"
                }
                placeholderTextColor="#9ca3af"
                value={endPlanFeedback.improvements}
                onChangeText={(text) =>
                  setEndPlanFeedback((prev) => ({ ...prev, improvements: text }))
                }
                multiline
                numberOfLines={3}
                textAlign={isRTL ? "right" : "left"}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEndPlanModal(false)}
            >
              <Text style={styles.cancelButtonText}>
                {language === "he" ? "ביטול" : "Cancel"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.endPlanButton, isSubmittingFeedback && styles.disabledButton]}
              onPress={handleEndPlan}
              disabled={isSubmittingFeedback}
            >
              {isSubmittingFeedback ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.endPlanButtonText}>
                  {language === "he" ? "סיים תוכנית" : "End Plan"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <LoadingScreen
        text={
          language === "he"
            ? "טוען תוכנית פעילה..."
            : "Loading active plan..."
        }
      />
    );
  }

  if (!activePlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <ChefHat size={64} color="#d1d5db" />
          <Text style={[styles.emptyTitle, isRTL && styles.rtlText]}>
            {language === "he" ? "אין תוכנית פעילה" : "No Active Plan"}
          </Text>
          <Text style={[styles.emptyText, isRTL && styles.rtlText]}>
            {language === "he"
              ? "בחר תוכנית מהתפריטים המומלצים"
              : "Select a plan from recommended menus"}
          </Text>
          <TouchableOpacity
            style={styles.goToMenusButton}
            onPress={() => router.push("/(tabs)/recommended-menus")}
          >
            <Text style={styles.goToMenusButtonText}>
              {language === "he" ? "עבור לתפריטים" : "Go to Menus"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)/recommended-menus")}
          >
            <ArrowLeft size={24} color="#10b981" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, isRTL && styles.rtlText]}>
              {language === "he" ? "התוכנית הפעילה" : "Active Plan"}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
              {activePlan.title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.endPlanButton}
            onPress={() => setShowEndPlanModal(true)}
          >
            <X size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Plan Overview */}
        <View style={styles.overviewCard}>
          <LinearGradient
            colors={["#10b981", "#059669"]}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewContent}>
              <View style={styles.overviewHeader}>
                <ChefHat size={24} color="#ffffff" />
                <Text style={[styles.planTitle, isRTL && styles.rtlText]}>
                  {activePlan.title}
                </Text>
              </View>

              {activePlan.description && (
                <Text style={[styles.planDescription, isRTL && styles.rtlText]}>
                  {activePlan.description}
                </Text>
              )}

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${activePlan.progress.completion_percentage}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, isRTL && styles.rtlText]}>
                  {activePlan.progress.completed_meals} / {activePlan.progress.total_meals}{" "}
                  {language === "he" ? "ארוחות הושלמו" : "meals completed"} (
                  {Math.round(activePlan.progress.completion_percentage)}%)
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{activePlan.days_count}</Text>
                  <Text style={styles.statLabel}>
                    {language === "he" ? "ימים" : "Days"}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{activePlan.total_calories}</Text>
                  <Text style={styles.statLabel}>
                    {language === "he" ? "קלוריות" : "Calories"}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{activePlan.total_protein}g</Text>
                  <Text style={styles.statLabel}>
                    {language === "he" ? "חלבון" : "Protein"}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Meals List */}
        <View style={styles.mealsSection}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
            {language === "he" ? "הארוחות שלך" : "Your Meals"}
          </Text>
          
          {activePlan.meals.map((meal, index) => renderMealCard(meal, index))}
        </View>
      </ScrollView>

      {renderMealModal()}
      {renderEndPlanModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  endPlanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  overviewCard: {
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewGradient: {
    padding: 24,
  },
  overviewContent: {
    alignItems: "center",
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  planDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  mealsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  completedMealCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#10b981",
  },
  mealCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  mealMeta: {
    fontSize: 12,
    color: "#6b7280",
  },
  mealStatus: {
    marginLeft: 12,
  },
  mealNutrition: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  nutritionLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  mealFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prepTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  completionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  completionText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  ratingDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  goToMenusButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goToMenusButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  mealDetailsSection: {
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 12,
  },
  ingredientsContainer: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  textAreaInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 80,
    textAlignVertical: "top",
  },
  ratingsSection: {
    marginBottom: 20,
  },
  ratingItem: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  ratingDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  starContainer: {
    flexDirection: "row",
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  reasonButtons: {
    gap: 8,
  },
  reasonButton: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
  },
  selectedReasonButton: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  reasonButtonText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  selectedReasonButtonText: {
    color: "#10b981",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  checkInButton: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  endPlanButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  disabledButton: {
    opacity: 0.6,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rtlTextInput: {
    textAlign: "right",
  },
});
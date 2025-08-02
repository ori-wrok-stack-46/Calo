import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { RootState, AppDispatch } from "@/src/store";
import {
  saveQuestionnaire,
  fetchQuestionnaire,
  clearError,
} from "@/src/store/questionnaireSlice";
import {
  ChevronLeft,
  CircleCheck as CheckCircle,
  User,
  Target,
  Activity,
  Heart,
  Utensils,
  Calendar,
  Settings,
  Sparkles,
} from "lucide-react-native";

import ProgressIndicator from "@/components/questionnaire/ProgressIndicator";
import PersonalDataStep from "@/components/questionnaire/PersonalDataStep";
import GoalsStep from "@/components/questionnaire/GoalsStep";
import ActivityStep from "@/components/questionnaire/ActivityStep";
import HealthStep from "@/components/questionnaire/HealthStep";
import MeansStep from "@/components/questionnaire/MeansStep";
import DietaryStep from "@/components/questionnaire/DietaryStep";
import LifestyleStep from "@/components/questionnaire/LifestyleStep";
import PreferencesStep, {
  COLORS,
} from "@/components/questionnaire/PreferencesStep";
import { QuestionnaireData } from "@/src/types/questionnaire";

const { width } = Dimensions.get("window");

const STEPS = [
  { id: 1, title: "נתונים אישיים", icon: User, color: COLORS.emerald[800] },
  { id: 2, title: "יעדים", icon: Target, color: COLORS.emerald[700] },
  { id: 3, title: "פעילות גופנית", icon: Activity, color: COLORS.emerald[600] },
  { id: 4, title: "בריאות", icon: Heart, color: COLORS.emerald[500] },
  { id: 5, title: "אמצעים ותנאים", icon: Utensils, color: COLORS.emerald[400] },
  {
    id: 6,
    title: "העדפות תזונתיות",
    icon: Utensils,
    color: COLORS.emerald[300],
  },
  { id: 7, title: "אורח חיים", icon: Calendar, color: COLORS.emerald[200] },
  { id: 8, title: "הגדרות נוספות", icon: Settings, color: COLORS.gray[600] },
];

export default function QuestionnaireScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { questionnaire, isLoading, isSaving, error } = useSelector(
    (state: RootState) => state.questionnaire
  );

  // Allow access to questionnaire regardless of completion status
  // This fixes the access issue
  const searchParams = useLocalSearchParams();

  const isEditMode = searchParams?.mode === "edit";
  const [currentStep, setCurrentStep] = useState(1);
  const [dataLoaded, setDataLoaded] = useState(false);

  const totalSteps = 8;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const [formData, setFormData] = useState<QuestionnaireData>({
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    target_weight_kg: null,
    body_fat_percentage: null,
    additional_personal_info: [],

    main_goal: "",
    main_goal_text: [],
    specific_goal: [],
    goal_timeframe_days: null,
    commitment_level: "",
    most_important_outcome: [],
    special_personal_goal: [],

    physical_activity_level: "",
    sport_frequency: "",
    sport_types: [],
    sport_duration_min: null,
    workout_times: [],
    uses_fitness_devices: false,
    fitness_device_type: [],
    additional_activity_info: [],

    medical_conditions: [],
    medical_conditions_text: [],
    medications: [],
    health_goals: [],
    functional_issues: [],
    food_related_medical_issues: [],

    meals_per_day: "3",
    snacks_between_meals: false,
    meal_times: [],
    cooking_preference: "",
    available_cooking_methods: [],
    daily_food_budget: null,
    shopping_method: [],
    daily_cooking_time: null,

    kosher: false,
    allergies: [],
    allergies_text: [],
    dietary_style: "",
    meal_texture_preference: [],
    disliked_foods: [],
    liked_foods: [],
    regular_drinks: [],
    intermittent_fasting: false,
    fasting_hours: null,

    past_diet_difficulties: [],

    program_duration: "MEDIUM_TERM",
    meal_timing_restrictions: "",
    dietary_restrictions: [],
    willingness_to_follow: true,
    upcoming_events: [],
    upload_frequency: "",
    notifications_preference: null,
    personalized_tips: true,
    health_metrics_integration: false,
    family_medical_history: [],
    smoking_status: null,
    sleep_hours_per_night: null,
  });

  // Load existing questionnaire data
  useEffect(() => {
    const shouldFetchData =
      isEditMode || (user?.is_questionnaire_completed && !dataLoaded);

    if (shouldFetchData && !isLoading) {
      dispatch(fetchQuestionnaire()).finally(() => {
        setDataLoaded(true);
      });
    } else if (!isEditMode && !user?.is_questionnaire_completed) {
      setDataLoaded(true);
    }
  }, [
    dispatch,
    isEditMode,
    user?.is_questionnaire_completed,
    dataLoaded,
    isLoading,
  ]);

  // Map questionnaire data to form
  useEffect(() => {
    if (questionnaire && dataLoaded) {
      const safeString = (value: any) => {
        if (value === null || value === undefined) return "";
        return value.toString();
      };

      const safeArray = (value: any) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          if (value.trim() === "" || value.toLowerCase() === "none") return [];
          try {
            return JSON.parse(value);
          } catch {
            return value
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item && item.toLowerCase() !== "none");
          }
        }
        return [];
      };

      const safeBoolean = (value: any) => Boolean(value);

      const parseMealTimes = (mealTimes: any) => {
        if (Array.isArray(mealTimes)) return mealTimes;
        if (typeof mealTimes === "string") {
          return mealTimes
            .split(",")
            .map((time) => time.trim())
            .filter((time) => time);
        }
        return [];
      };

      const mappedData: QuestionnaireData = {
        age: safeString(questionnaire.age),
        gender: safeString(questionnaire.gender),
        height_cm: safeString(questionnaire.height_cm),
        weight_kg: safeString(questionnaire.weight_kg),
        target_weight_kg: safeString(questionnaire.target_weight_kg),
        body_fat_percentage: safeString(questionnaire.body_fat_percentage),
        additional_personal_info: safeArray(
          questionnaire.additional_personal_info
        ),

        main_goal: safeString(questionnaire.main_goal),
        main_goal_text: safeArray(questionnaire.main_goal_text),
        specific_goal: safeArray(questionnaire.specific_goal),
        goal_timeframe_days: safeString(questionnaire.goal_timeframe_days),
        commitment_level: safeString(questionnaire.commitment_level),
        most_important_outcome: safeArray(questionnaire.most_important_outcome),
        special_personal_goal: safeArray(questionnaire.special_personal_goal),

        physical_activity_level: safeString(
          questionnaire.physical_activity_level
        ),
        sport_frequency: safeString(questionnaire.sport_frequency),
        sport_types: safeArray(questionnaire.sport_types),
        sport_duration_min: safeString(questionnaire.sport_duration_min),
        workout_times: safeArray(questionnaire.workout_times),
        uses_fitness_devices: safeBoolean(questionnaire.uses_fitness_devices),
        fitness_device_type: safeArray(questionnaire.fitness_device_type),
        additional_activity_info: safeArray(
          questionnaire.additional_activity_info
        ),

        medical_conditions: safeArray(questionnaire.medical_conditions),
        medical_conditions_text: safeArray(
          questionnaire.medical_conditions_text
        ),
        medications: safeArray(questionnaire.medications),
        health_goals: safeArray(questionnaire.health_goals),
        functional_issues: safeArray(questionnaire.functional_issues),
        food_related_medical_issues: safeArray(
          questionnaire.food_related_medical_issues
        ),

        meals_per_day: safeString(questionnaire.meals_per_day) || "3",
        snacks_between_meals: safeBoolean(questionnaire.snacks_between_meals),
        meal_times: parseMealTimes(questionnaire.meal_times),
        cooking_preference: safeString(questionnaire.cooking_preference),
        available_cooking_methods: safeArray(
          questionnaire.available_cooking_methods
        ),
        daily_food_budget: safeString(questionnaire.daily_food_budget),
        shopping_method: safeArray(questionnaire.shopping_method),
        daily_cooking_time: safeString(questionnaire.daily_cooking_time),

        kosher: safeBoolean(questionnaire.kosher),
        allergies: safeArray(questionnaire.allergies),
        allergies_text: safeArray(questionnaire.allergies_text),
        dietary_style: safeString(questionnaire.dietary_style),
        meal_texture_preference: safeArray(
          questionnaire.meal_texture_preference
        ),
        disliked_foods: safeArray(questionnaire.disliked_foods),
        liked_foods: safeArray(questionnaire.liked_foods),
        regular_drinks: safeArray(questionnaire.regular_drinks),
        intermittent_fasting: safeBoolean(questionnaire.intermittent_fasting),
        fasting_hours: safeString(questionnaire.fasting_hours),

        past_diet_difficulties: safeArray(questionnaire.past_diet_difficulties),

        program_duration: safeString(questionnaire.program_duration),
        meal_timing_restrictions: safeString(
          questionnaire.meal_timing_restrictions
        ),
        dietary_restrictions: safeArray(questionnaire.dietary_restrictions),
        willingness_to_follow:
          questionnaire.willingness_to_follow !== undefined
            ? safeBoolean(questionnaire.willingness_to_follow)
            : true,
        upcoming_events: safeArray(questionnaire.upcoming_events),
        upload_frequency: safeString(questionnaire.upload_frequency),
        notifications_preference: questionnaire.notifications_preference as
          | "DAILY"
          | "WEEKLY"
          | "NONE"
          | null,
        personalized_tips:
          questionnaire.personalized_tips !== undefined
            ? safeBoolean(questionnaire.personalized_tips)
            : true,
        health_metrics_integration: safeBoolean(
          questionnaire.health_metrics_integration
        ),
        family_medical_history: safeArray(questionnaire.family_medical_history),
        smoking_status: questionnaire.smoking_status as "YES" | "NO" | null,
        sleep_hours_per_night:
          questionnaire.sleep_hours_per_night as unknown as number | null,
      };

      setFormData(mappedData);
    }
  }, [
    questionnaire,
    dataLoaded,
    isEditMode,
    isLoading,
    user?.is_questionnaire_completed,
  ]);

  const handleSubmit = async () => {
    try {
      if (
        !formData.age ||
        !formData.gender ||
        !formData.height_cm ||
        !formData.weight_kg ||
        !formData.main_goal ||
        !formData.commitment_level ||
        !formData.physical_activity_level ||
        !formData.sport_frequency ||
        !formData.cooking_preference ||
        !formData.dietary_style
      ) {
        Alert.alert("שגיאה", "אנא מלא את כל השדות הנדרשים בכל השלבים");
        return;
      }

      const cleanFormData = { ...formData };

      // Convert empty strings to null for optional fields
      if (cleanFormData.target_weight_kg === "")
        cleanFormData.target_weight_kg = null;
      if (cleanFormData.body_fat_percentage === "")
        cleanFormData.body_fat_percentage = null;
      if (cleanFormData.goal_timeframe_days === "")
        cleanFormData.goal_timeframe_days = null;
      if (cleanFormData.sport_duration_min === "")
        cleanFormData.sport_duration_min = null;
      if (cleanFormData.daily_food_budget === "")
        cleanFormData.daily_food_budget = null;
      if (cleanFormData.daily_cooking_time === "")
        cleanFormData.daily_cooking_time = null;
      if (cleanFormData.fasting_hours === "")
        cleanFormData.fasting_hours = null;

      const dataToSubmit = {
        ...cleanFormData,
        isEditMode: isEditMode || user?.is_questionnaire_completed,
      };

      const result = await dispatch(saveQuestionnaire(dataToSubmit));

      if (saveQuestionnaire.fulfilled.match(result)) {
        if (isEditMode || user?.is_questionnaire_completed) {
          Alert.alert("הצלחה!", "הנתונים שלך עודכנו בהצלחה", [
            {
              text: "חזור לפרופיל",
              onPress: () => router.replace("/(tabs)/profile"),
            },
          ]);
        } else {
          Alert.alert(
            "הצלחה!",
            "השאלון נשמר בהצלחה. אנחנו כעת בונים עבורך תוכנית תזונה מותאמת אישית.",
            [
              {
                text: "המשך",
                onPress: () => router.replace("/(tabs)"),
              },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert("שגיאה", "אירעה שגיאה בשמירת השאלון");
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert("שגיאה", error);
      dispatch(clearError());
    }
  }, [error]);

  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      setFormData,
      onNext: () => setCurrentStep(currentStep + 1),
    };

    switch (currentStep) {
      case 1:
        return <PersonalDataStep {...stepProps} />;
      case 2:
        return <GoalsStep {...stepProps} />;
      case 3:
        return <ActivityStep {...stepProps} />;
      case 4:
        return <HealthStep {...stepProps} />;
      case 5:
        return <MeansStep {...stepProps} />;
      case 6:
        return <DietaryStep {...stepProps} />;
      case 7:
        return <LifestyleStep {...stepProps} />;
      case 8:
        return (
          <PreferencesStep
            {...stepProps}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
        );
      default:
        return <PersonalDataStep {...stepProps} />;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.age &&
          formData.gender &&
          formData.height_cm &&
          formData.weight_kg
        );
      case 2:
        return formData.main_goal && formData.commitment_level;
      case 3:
        return formData.physical_activity_level && formData.sport_frequency;
      case 4:
        return true;
      case 5:
        return (
          formData.cooking_preference &&
          formData.available_cooking_methods.length > 0
        );
      case 6:
        return formData.dietary_style;
      case 7:
        return true;
      case 8:
        return true;
      default:
        return true;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      if (isEditMode || user?.is_questionnaire_completed) {
        router.back();
      } else {
        router.replace("/payment-plan");
      }
    }
  };

  if (
    (isEditMode || user?.is_questionnaire_completed) &&
    isLoading &&
    !dataLoaded
  ) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <Sparkles size={48} color="white" />
            <Text style={styles.loadingTitle}>טוען נתונים</Text>
            <Text style={styles.loadingSubtitle}>אנא המתן...</Text>
            <ActivityIndicator
              size="large"
              color="white"
              style={styles.loadingSpinner}
            />
          </View>
        </LinearGradient>
      </View>
    );
  }

  const currentStepData = STEPS[currentStep - 1];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[currentStepData.color, currentStepData.color + "90"]}
        style={styles.header}
      >
        <BlurView intensity={20} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <currentStepData.icon size={24} color="white" />
              <Text style={styles.headerTitle}>
                {isEditMode ? "עריכת נתונים אישיים" : currentStepData.title}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.stepCounter}>
                {currentStep}/{totalSteps}
              </Text>
            </View>
          </View>
        </BlurView>
      </LinearGradient>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        steps={STEPS}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderCurrentStep()}
      </ScrollView>

      <BlurView intensity={95} style={styles.navigationContainer}>
        <View style={styles.navigation}>
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                { backgroundColor: currentStepData.color },
                !canProceed() && styles.nextButtonDisabled,
              ]}
              onPress={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              <Text style={styles.nextButtonText}>המשך</Text>
              <View style={styles.nextButtonIcon}>
                <ChevronLeft
                  size={20}
                  color="white"
                  style={{ transform: [{ rotate: "180deg" }] }}
                />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.finishButton,
                isSaving && styles.nextButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <CheckCircle size={20} color="white" />
                  <Text style={styles.finishButtonText}>
                    {isEditMode ? "שמור שינויים" : "צור תוכנית אישית"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    padding: 32,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 24,
  },
  loadingSpinner: {
    marginTop: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerBlur: {
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  headerRight: {
    width: 44,
    alignItems: "center",
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  navigationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  navigation: {
    padding: 20,
    paddingBottom: 34,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0.1,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  nextButtonIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 4,
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  finishButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

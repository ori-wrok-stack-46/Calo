import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router, useLocalSearchParams } from "expo-router";
import { RootState, AppDispatch } from "@/src/store";
import {
  saveQuestionnaire,
  fetchQuestionnaire,
  clearError,
} from "@/src/store/questionnaireSlice";
import {
  ChevronLeft,
  Target,
  Activity,
  Heart,
  Utensils,
  Leaf,
  Moon,
  Settings,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { LinearGradient } from "expo-linear-gradient";

// Components
import ProgressIndicator from "@/components/questionnaire/ProgressIndicator";
import StepContainer from "@/components/questionnaire/StepContainer";
import OptionGroup from "@/components/questionnaire/OptionGroup";
import CustomTextInput from "@/components/questionnaire/CustomTextInput";
import WeightScale from "@/components/questionnaire/WeightScale";
import DynamicListInput from "@/components/questionnaire/DynamicListInput";
import CheckboxGroup from "@/components/questionnaire/CheckBoxGroup";
import CustomSwitch from "@/components/questionnaire/CustomSwitch";
import LoadingScreen from "@/components/LoadingScreen";

const { width: screenWidth } = Dimensions.get("window");

interface QuestionnaireData {
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  target_weight_kg: string | null;
  additional_personal_info: string[];
  main_goal: string;
  goal_timeframe_days: string | null;
  commitment_level: string;
  physical_activity_level: string;
  sport_frequency: string;
  medical_conditions_text: string[];
  medications: string[];
  meals_per_day: string;
  cooking_preference: string;
  available_cooking_methods: string[];
  daily_food_budget: string | null;
  kosher: boolean;
  allergies: string[];
  dietary_style: string;
  sleep_hours_per_night: string | null;
  smoking_status: "YES" | "NO" | null;
  program_duration: string;
  upload_frequency: string;
  willingness_to_follow: boolean;
  personalized_tips: boolean;
  notifications_preference: "DAILY" | "WEEKLY" | "NONE" | null;
}

const QuestionnaireScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { questionnaire, isSaving, isLoading, error } = useSelector(
    (state: RootState) => state.questionnaire
  );
  const searchParams = useLocalSearchParams();
  const isEditMode = searchParams?.mode === "edit";

  const [currentStep, setCurrentStep] = useState(1);
  const [showTip, setShowTip] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const totalSteps = 8;

  const [formData, setFormData] = useState<QuestionnaireData>({
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    target_weight_kg: null,
    additional_personal_info: [],
    main_goal: "",
    goal_timeframe_days: null,
    commitment_level: "",
    physical_activity_level: "",
    sport_frequency: "",
    medical_conditions_text: [],
    medications: [],
    meals_per_day: "3",
    cooking_preference: "",
    available_cooking_methods: [],
    daily_food_budget: null,
    kosher: false,
    allergies: [],
    dietary_style: "",
    sleep_hours_per_night: null,
    smoking_status: null,
    program_duration: "",
    upload_frequency: "",
    willingness_to_follow: true,
    personalized_tips: true,
    notifications_preference: null,
  });

  // Load existing questionnaire data
  useEffect(() => {
    const shouldFetchData =
      isEditMode || (user?.is_questionnaire_completed && !dataLoaded);
    if (shouldFetchData && !isLoading) {
      dispatch(fetchQuestionnaire()).finally(() => setDataLoaded(true));
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
      const safeString = (value: any) => value?.toString() || "";
      const safeArray = (value: any) => (Array.isArray(value) ? value : []);
      const safeBoolean = (value: any) => Boolean(value);
      const mapGenderToKey = (hebrewGender: string) => {
        const genderMap: { [key: string]: string } = {
          זכר: "male",
          נקבה: "female",
          אחר: "other",
        };
        return genderMap[hebrewGender] || hebrewGender;
      };

      setFormData({
        age: safeString(questionnaire.age),
        gender: mapGenderToKey(safeString(questionnaire.gender)),
        height_cm: safeString(questionnaire.height_cm),
        weight_kg: safeString(questionnaire.weight_kg),
        target_weight_kg: safeString(questionnaire.target_weight_kg),
        additional_personal_info: safeArray(
          questionnaire.additional_personal_info
        ),
        main_goal: safeString(questionnaire.main_goal),
        goal_timeframe_days: safeString(questionnaire.goal_timeframe_days),
        commitment_level: safeString(questionnaire.commitment_level),
        physical_activity_level: safeString(
          questionnaire.physical_activity_level
        ),
        sport_frequency: safeString(questionnaire.sport_frequency),
        medical_conditions_text: safeArray(
          questionnaire.medical_conditions_text
        ),
        medications: safeArray(questionnaire.medications),
        meals_per_day: safeString(questionnaire.meals_per_day) || "3",
        cooking_preference: safeString(questionnaire.cooking_preference),
        available_cooking_methods: safeArray(
          questionnaire.available_cooking_methods
        ),
        daily_food_budget: safeString(questionnaire.daily_food_budget),
        kosher: safeBoolean(questionnaire.kosher),
        allergies: safeArray(questionnaire.allergies),
        dietary_style: safeString(questionnaire.dietary_style),
        sleep_hours_per_night: safeString(questionnaire.sleep_hours_per_night),
        smoking_status: questionnaire.smoking_status as "YES" | "NO" | null,
        program_duration: safeString(questionnaire.program_duration),
        upload_frequency: safeString(questionnaire.upload_frequency),
        willingness_to_follow:
          questionnaire.willingness_to_follow !== undefined
            ? safeBoolean(questionnaire.willingness_to_follow)
            : true,
        personalized_tips:
          questionnaire.personalized_tips !== undefined
            ? safeBoolean(questionnaire.personalized_tips)
            : true,
        notifications_preference: questionnaire.notifications_preference as
          | "DAILY"
          | "WEEKLY"
          | "NONE"
          | null,
      });
    }
  }, [questionnaire, dataLoaded]);

  const handleArrayToggle = (
    array: string[],
    item: string,
    key: keyof QuestionnaireData
  ) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
    setFormData({ ...formData, [key]: newArray });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
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
        Alert.alert(t("questionnaire.error"), t("validation.requiredFields"));
        return;
      }

      const cleanFormData = { ...formData };

      // Convert empty strings to null for optional fields
      if (cleanFormData.target_weight_kg === "")
        cleanFormData.target_weight_kg = null;
      if (cleanFormData.goal_timeframe_days === "")
        cleanFormData.goal_timeframe_days = null;
      if (cleanFormData.daily_food_budget === "")
        cleanFormData.daily_food_budget = null;
      if (cleanFormData.sleep_hours_per_night === "")
        cleanFormData.sleep_hours_per_night = null;

      const dataToSubmit = {
        ...cleanFormData,
        isEditMode: isEditMode || user?.is_questionnaire_completed,
      };

      const result = await dispatch(saveQuestionnaire(dataToSubmit));

      if (saveQuestionnaire.fulfilled.match(result)) {
        if (isEditMode || user?.is_questionnaire_completed) {
          Alert.alert(
            t("questionnaire.success"),
            t("questionnaire.dataUpdated"),
            [
              {
                text: t("questionnaire.backToProfile"),
                onPress: () => router.replace("/(tabs)/profile"),
              },
            ]
          );
        } else {
          Alert.alert(
            t("questionnaire.success"),
            t("questionnaire.planCreated"),
            [
              {
                text: t("questionnaire.continueToApp"),
                onPress: () => router.replace("/(tabs)"),
              },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert(t("questionnaire.error"), t("questionnaire.saveError"));
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert(t("questionnaire.error"), error);
      dispatch(clearError());
    }
  }, [error, t, dispatch]);

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

  const getStepIcon = (step: number) => {
    const iconProps = { size: 24, color: colors.primary };
    switch (step) {
      case 1:
        return <Target {...iconProps} />;
      case 2:
        return <Target {...iconProps} />;
      case 3:
        return <Activity {...iconProps} />;
      case 4:
        return <Heart {...iconProps} />;
      case 5:
        return <Utensils {...iconProps} />;
      case 6:
        return <Leaf {...iconProps} />;
      case 7:
        return <Moon {...iconProps} />;
      case 8:
        return <Settings {...iconProps} />;
      default:
        return <Target {...iconProps} />;
    }
  };

  const renderStep = () => {
    const mainGoalOptions = [
      {
        key: "WEIGHT_LOSS",
        label: t("questionnaire.loseWeight"),
        description: "Reduce body weight safely",
        icon: <Text style={styles.emoji}>🏃‍♀️</Text>,
      },
      {
        key: "WEIGHT_GAIN",
        label: t("questionnaire.gainWeight"),
        description: "Build healthy mass",
        icon: <Text style={styles.emoji}>💪</Text>,
      },
      {
        key: "WEIGHT_MAINTENANCE",
        label: t("questionnaire.maintainWeight"),
        description: "Keep current weight",
        icon: <Text style={styles.emoji}>⚖️</Text>,
      },
      {
        key: "MEDICAL_CONDITION",
        label: t("questionnaire.improveHealth"),
        description: "Address health concerns",
        icon: <Text style={styles.emoji}>🏥</Text>,
      },
      {
        key: "SPORTS_PERFORMANCE",
        label: t("questionnaire.buildMuscle"),
        description: "Enhance athletic performance",
        icon: <Text style={styles.emoji}>🏆</Text>,
      },
    ];

    const activityLevels = [
      {
        key: "NONE",
        label: t("questionnaire.sedentary"),
        description: "Desk job, minimal exercise",
        icon: <Text style={styles.emoji}>🪑</Text>,
      },
      {
        key: "LIGHT",
        label: t("questionnaire.lightlyActive"),
        description: "Light exercise 1-3 days/week",
        icon: <Text style={styles.emoji}>🚶‍♀️</Text>,
      },
      {
        key: "MODERATE",
        label: t("questionnaire.moderatelyActive"),
        description: "Moderate exercise 3-5 days/week",
        icon: <Text style={styles.emoji}>🏃‍♀️</Text>,
      },
      {
        key: "HIGH",
        label: t("questionnaire.veryActive"),
        description: "Heavy exercise 6-7 days/week",
        icon: <Text style={styles.emoji}>🏋️‍♀️</Text>,
      },
    ];

    const sportFrequencies = [
      {
        key: "NONE",
        label: t("questionnaire.sedentary"),
        icon: <Text style={styles.emoji}>😴</Text>,
      },
      {
        key: "ONCE_A_WEEK",
        label: "1x " + t("common.weekly"),
        icon: <Text style={styles.emoji}>🚶</Text>,
      },
      {
        key: "TWO_TO_THREE",
        label: "2-3x " + t("common.weekly"),
        icon: <Text style={styles.emoji}>🏃</Text>,
      },
      {
        key: "FOUR_TO_FIVE",
        label: "4-5x " + t("common.weekly"),
        icon: <Text style={styles.emoji}>💪</Text>,
      },
      {
        key: "MORE_THAN_FIVE",
        label: "5+x " + t("common.weekly"),
        icon: <Text style={styles.emoji}>🏆</Text>,
      },
    ];

    const cookingPrefs = [
      {
        key: "cooked",
        label: t("questionnaire.cooked"),
        description: "Fresh home-cooked meals",
        icon: <Text style={styles.emoji}>👨‍🍳</Text>,
      },
      {
        key: "easy_prep",
        label: t("questionnaire.easyPrep"),
        description: "Quick and simple preparation",
        icon: <Text style={styles.emoji}>⚡</Text>,
      },
      {
        key: "ready_made",
        label: t("questionnaire.readyMade"),
        description: "Pre-prepared healthy options",
        icon: <Text style={styles.emoji}>📦</Text>,
      },
      {
        key: "no_cooking",
        label: t("questionnaire.noCooking"),
        description: "No cooking required",
        icon: <Text style={styles.emoji}>🥗</Text>,
      },
    ];

    const cookingMethods = [
      t("questionnaire.microwave"),
      t("questionnaire.oven"),
      t("questionnaire.stove"),
      t("questionnaire.pressureCooker"),
      t("questionnaire.pan"),
      t("questionnaire.grill"),
    ];

    const allergens = [
      t("questionnaire.gluten"),
      t("questionnaire.dairy"),
      t("questionnaire.eggs"),
      t("questionnaire.nuts"),
      t("questionnaire.peanuts"),
      t("questionnaire.fish"),
      t("questionnaire.shellfish"),
      t("questionnaire.soy"),
    ];

    const dietaryStyles = [
      {
        key: "regular",
        label: t("questionnaire.omnivore"),
        description: "Balanced diet with all food groups",
        icon: <Text style={styles.emoji}>🍽️</Text>,
      },
      {
        key: "low_carb",
        label: t("questionnaire.lowCarb"),
        description: "Reduced carbohydrate intake",
        icon: <Text style={styles.emoji}>🥩</Text>,
      },
      {
        key: "keto",
        label: t("questionnaire.keto"),
        description: "High fat, very low carb",
        icon: <Text style={styles.emoji}>🥑</Text>,
      },
      {
        key: "vegetarian",
        label: t("questionnaire.vegetarian"),
        description: "Plant-based with dairy/eggs",
        icon: <Text style={styles.emoji}>🌱</Text>,
      },
      {
        key: "vegan",
        label: t("questionnaire.vegan"),
        description: "Completely plant-based",
        icon: <Text style={styles.emoji}>🌿</Text>,
      },
      {
        key: "mediterranean",
        label: t("questionnaire.mediterranean"),
        description: "Mediterranean-style eating",
        icon: <Text style={styles.emoji}>🫒</Text>,
      },
    ];

    const commitmentLevels = [
      {
        key: "easy",
        label: t("questionnaire.easy"),
        description: "Flexible approach",
        icon: <Text style={styles.emoji}>😌</Text>,
      },
      {
        key: "moderate",
        label: t("questionnaire.moderate"),
        description: "Balanced commitment",
        icon: <Text style={styles.emoji}>💪</Text>,
      },
      {
        key: "strict",
        label: t("questionnaire.strict"),
        description: "Dedicated approach",
        icon: <Text style={styles.emoji}>🎯</Text>,
      },
    ];

    const genderOptions = [
      {
        key: "male",
        label: t("questionnaire.male"),
        icon: <Text style={styles.emoji}>👨</Text>,
      },
      {
        key: "female",
        label: t("questionnaire.female"),
        icon: <Text style={styles.emoji}>👩</Text>,
      },
      {
        key: "other",
        label: t("questionnaire.other"),
        icon: <Text style={styles.emoji}>👤</Text>,
      },
    ];

    switch (currentStep) {
      case 1:
        return (
          <StepContainer
            title={t("questionnaire.steps.personal.title")}
            description={t("questionnaire.steps.personal.subtitle")}
          >
            <CustomTextInput
              label={t("questionnaire.age")}
              value={formData.age}
              onChangeText={(text: any) =>
                setFormData({ ...formData, age: text })
              }
              placeholder={t("questionnaire.enterAge")}
              keyboardType="numeric"
              required
            />

            <OptionGroup
              label={t("questionnaire.gender")}
              options={genderOptions}
              selectedValue={formData.gender}
              onSelect={(value) => setFormData({ ...formData, gender: value })}
              required
            />

            <WeightScale
              label={t("questionnaire.height")}
              value={parseInt(formData.height_cm) || 170}
              onValueChange={(value: { toString: () => any }) =>
                setFormData({ ...formData, height_cm: value.toString() })
              }
              min={120}
              max={220}
              unit="cm"
            />

            <WeightScale
              label={t("questionnaire.weight")}
              value={parseInt(formData.weight_kg) || 70}
              onValueChange={(value: { toString: () => any }) =>
                setFormData({ ...formData, weight_kg: value.toString() })
              }
              min={30}
              max={200}
              unit="kg"
            />

            <WeightScale
              label={t("questionnaire.targetWeight")}
              value={parseInt(formData.target_weight_kg || "70") || 70}
              onValueChange={(value: { toString: () => any }) =>
                setFormData({ ...formData, target_weight_kg: value.toString() })
              }
              min={30}
              max={200}
              unit="kg"
            />
          </StepContainer>
        );

      case 2:
        return (
          <StepContainer
            title={t("questionnaire.steps.goals.title")}
            description={t("questionnaire.steps.goals.subtitle")}
          >
            <OptionGroup
              label={t("questionnaire.mainGoal")}
              options={mainGoalOptions}
              selectedValue={formData.main_goal}
              onSelect={(value) =>
                setFormData({ ...formData, main_goal: value })
              }
              required
            />

            <CustomTextInput
              label={t("questionnaire.goalTimeframe")}
              value={formData.goal_timeframe_days || ""}
              onChangeText={(text: any) =>
                setFormData({ ...formData, goal_timeframe_days: text || null })
              }
              placeholder={t("questionnaire.example90Days")}
              keyboardType="numeric"
            />

            <OptionGroup
              label={t("questionnaire.commitmentLevel")}
              options={commitmentLevels}
              selectedValue={formData.commitment_level}
              onSelect={(value) =>
                setFormData({ ...formData, commitment_level: value })
              }
              required
            />
          </StepContainer>
        );

      case 3:
        return (
          <StepContainer
            title={t("questionnaire.steps.activity.title")}
            description={t("questionnaire.steps.activity.subtitle")}
          >
            <OptionGroup
              label={t("questionnaire.activityLevel")}
              options={activityLevels}
              selectedValue={formData.physical_activity_level}
              onSelect={(value) =>
                setFormData({ ...formData, physical_activity_level: value })
              }
              required
            />

            <OptionGroup
              label={t("questionnaire.sportFrequency")}
              options={sportFrequencies}
              selectedValue={formData.sport_frequency}
              onSelect={(value) =>
                setFormData({ ...formData, sport_frequency: value })
              }
              required
            />
          </StepContainer>
        );

      case 4:
        return (
          <StepContainer
            title={t("questionnaire.steps.health.title")}
            description={t("questionnaire.steps.health.subtitle")}
          >
            <DynamicListInput
              label={t("questionnaire.medicalConditions")}
              placeholder={t("questionnaire.addItem")}
              items={formData.medical_conditions_text}
              onItemsChange={(items) =>
                setFormData({ ...formData, medical_conditions_text: items })
              }
              maxItems={10}
            />

            <DynamicListInput
              label={t("questionnaire.medications")}
              placeholder={t("questionnaire.addItem")}
              items={formData.medications}
              onItemsChange={(items) =>
                setFormData({ ...formData, medications: items })
              }
              maxItems={10}
            />
          </StepContainer>
        );

      case 5:
        return (
          <StepContainer
            title={t("questionnaire.steps.means.title")}
            description={t("questionnaire.steps.means.subtitle")}
          >
            <OptionGroup
              label={t("questionnaire.cookingPreference")}
              options={cookingPrefs}
              selectedValue={formData.cooking_preference}
              onSelect={(value) =>
                setFormData({ ...formData, cooking_preference: value })
              }
              required
            />

            <CheckboxGroup
              label={t("questionnaire.availableCookingMethods")}
              options={cookingMethods}
              selectedValues={formData.available_cooking_methods}
              onToggle={(value: string) =>
                handleArrayToggle(
                  formData.available_cooking_methods,
                  value,
                  "available_cooking_methods"
                )
              }
            />

            <CustomTextInput
              label={t("questionnaire.dailyFoodBudget")}
              value={formData.daily_food_budget || ""}
              onChangeText={(text: any) =>
                setFormData({ ...formData, daily_food_budget: text || null })
              }
              placeholder={t("questionnaire.example50Budget")}
              keyboardType="numeric"
            />
          </StepContainer>
        );

      case 6:
        return (
          <StepContainer
            title={t("questionnaire.steps.dietary.title")}
            description={t("questionnaire.steps.dietary.subtitle")}
          >
            <CustomSwitch
              label={t("questionnaire.kosher")}
              description="Follow kosher dietary laws"
              value={formData.kosher}
              onValueChange={(value: any) =>
                setFormData({ ...formData, kosher: value })
              }
            />

            <CheckboxGroup
              label={t("questionnaire.allergies")}
              options={allergens}
              selectedValues={formData.allergies}
              onToggle={(value: string) =>
                handleArrayToggle(formData.allergies, value, "allergies")
              }
            />

            <OptionGroup
              label={t("questionnaire.dietaryStyle")}
              options={dietaryStyles}
              selectedValue={formData.dietary_style}
              onSelect={(value) =>
                setFormData({ ...formData, dietary_style: value })
              }
              required
            />
          </StepContainer>
        );

      case 7:
        return (
          <StepContainer
            title={t("questionnaire.steps.lifestyle.title")}
            description={t("questionnaire.steps.lifestyle.subtitle")}
          >
            <WeightScale
              label={t("questionnaire.sleepHours")}
              value={parseInt(formData.sleep_hours_per_night || "8") || 8}
              onValueChange={(value: { toString: () => any }) =>
                setFormData({
                  ...formData,
                  sleep_hours_per_night: value.toString(),
                })
              }
              min={4}
              max={12}
              unit="hours"
            />

            <OptionGroup
              label={t("questionnaire.smokingStatus")}
              options={[
                {
                  key: "NO",
                  label: t("questionnaire.nonSmoker"),
                  icon: <Text style={styles.emoji}>🚭</Text>,
                },
                {
                  key: "YES",
                  label: t("questionnaire.smoker"),
                  icon: <Text style={styles.emoji}>🚬</Text>,
                },
              ]}
              selectedValue={formData.smoking_status || ""}
              onSelect={(value) =>
                setFormData({
                  ...formData,
                  smoking_status: value as "YES" | "NO",
                })
              }
            />
          </StepContainer>
        );

      case 8:
        return (
          <StepContainer
            title={t("questionnaire.steps.preferences.title")}
            description={t("questionnaire.steps.preferences.subtitle")}
          >
            <OptionGroup
              label={t("questionnaire.uploadFrequency")}
              options={[
                { key: "every_meal", label: t("questionnaire.everyMeal") },
                { key: "daily", label: t("questionnaire.daily") },
                {
                  key: "several_weekly",
                  label: t("questionnaire.severalWeekly"),
                },
                { key: "weekly", label: t("questionnaire.weekly") },
              ]}
              selectedValue={formData.upload_frequency}
              onSelect={(value) =>
                setFormData({ ...formData, upload_frequency: value })
              }
            />

            <CustomSwitch
              label={t("questionnaire.willingnessToFollow")}
              description="Commit to following the nutrition plan"
              value={formData.willingness_to_follow}
              onValueChange={(value: any) =>
                setFormData({ ...formData, willingness_to_follow: value })
              }
            />

            <CustomSwitch
              label={t("questionnaire.personalizedTips")}
              description="Receive personalized nutrition tips"
              value={formData.personalized_tips}
              onValueChange={(value: any) =>
                setFormData({ ...formData, personalized_tips: value })
              }
            />

            <OptionGroup
              label={t("questionnaire.notificationsPreference")}
              options={[
                { key: "DAILY", label: t("questionnaire.daily") },
                { key: "WEEKLY", label: t("questionnaire.weekly") },
                { key: "NONE", label: t("common.no") },
              ]}
              selectedValue={formData.notifications_preference || ""}
              onSelect={(value) =>
                setFormData({
                  ...formData,
                  notifications_preference: value as
                    | "DAILY"
                    | "WEEKLY"
                    | "NONE",
                })
              }
            />
          </StepContainer>
        );

      default:
        return null;
    }
  };

  if (
    (isEditMode || user?.is_questionnaire_completed) &&
    isLoading &&
    !dataLoaded
  ) {
    return (
      <LoadingScreen text={isRTL ? "טוען שאלון" : "Loading Questionnaire"} />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View
            style={[
              styles.stepIcon,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            {getStepIcon(currentStep)}
          </View>
        </View>

        <TouchableOpacity style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderStep()}
        {/* Navigation */}
        <View style={[styles.navigation, { backgroundColor: "transperent" }]}>
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: canProceed()
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  canProceed()
                    ? [colors.primary, colors.primary + "CC"]
                    : [colors.border, colors.border]
                }
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>{t("common.next")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isSaving ? colors.border : colors.success,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isSaving
                    ? [colors.border, colors.border]
                    : [colors.success, colors.success + "CC"]
                }
                style={styles.buttonGradient}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isEditMode ? t("common.save") : t("questionnaire.finish")}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Tip Modal */}
      <Modal
        visible={!!showTip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTip("")}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text
              style={[
                styles.modalText,
                { color: colors.text },
                isRTL && styles.textRTL,
              ]}
            >
              {showTip}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowTip("")}
            >
              <Text style={styles.modalButtonText}>{t("common.ok")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  navigation: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    maxWidth: 320,
    width: "100%",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emoji: {
    fontSize: 24,
  },
  textRTL: {
    textAlign: "right",
  },
});

export default QuestionnaireScreen;

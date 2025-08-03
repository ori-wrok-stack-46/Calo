import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
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
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

const { width: screenWidth } = Dimensions.get("window");
interface ThemeContextType {
  isDark: boolean;
  colors: typeof lightColors | typeof darkColors;
  toggleTheme: () => void;
}

const lightColors = {
  background: "#ffffff",
  surface: "#f8f9fa",
  card: "#ffffff",
  text: "#1a1a1a",
  textSecondary: "#6b7280",
  primary: "#3b82f6",
  primaryLight: "#dbeafe",
  success: "#10b981",
  error: "#ef4444",
  border: "#e5e7eb",
  shadow: "rgba(0, 0, 0, 0.1)",
  gradient: ["#3b82f6", "#1d4ed8"],
};

const darkColors = {
  background: "#0f172a",
  surface: "#1e293b",
  card: "#334155",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  primary: "#60a5fa",
  primaryLight: "#1e3a8a",
  success: "#34d399",
  error: "#f87171",
  border: "#475569",
  shadow: "rgba(0, 0, 0, 0.3)",
  gradient: ["#60a5fa", "#3b82f6"],
};

// Language Context
interface LanguageContextType {
  currentLanguage: string;
  isRTL: boolean;
  changeLanguage: (lang: string) => void;
}

// Components
const ProgressIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
}> = ({ currentStep, totalSteps }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.progressText,
          { color: colors.textSecondary },
          isRTL && styles.textRTL,
        ]}
      >
        {t("questionnaire.step")} {currentStep} {t("common.of")} {totalSteps} (
        {Math.round(progressPercentage)}%)
      </Text>
    </View>
  );
};

const StepContainer: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text
          style={[
            styles.stepTitle,
            { color: colors.text },
            isRTL && styles.textRTL,
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.stepDescription,
            { color: colors.textSecondary },
            isRTL && styles.textRTL,
          ]}
        >
          {description}
        </Text>
      </View>
      {children}
    </View>
  );
};

const CustomTextInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  required?: boolean;
}> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  required = false,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  return (
    <View style={styles.inputGroup}>
      <Text
        style={[
          styles.inputLabel,
          { color: colors.text },
          isRTL && styles.textRTL,
        ]}
      >
        {label} {required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.card,
            },
            isRTL && styles.textInputRTL,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
};

const OptionGroup: React.FC<{
  label: string;
  options: { key: string; label: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  required?: boolean;
}> = ({ label, options, selectedValue, onSelect, required = false }) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  return (
    <View style={styles.inputGroup}>
      <Text
        style={[
          styles.inputLabel,
          { color: colors.text },
          isRTL && styles.textRTL,
        ]}
      >
        {label} {required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
      <View style={styles.optionGroup}>
        {options.map((option) => {
          const isSelected = selectedValue === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionButton,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={() => onSelect(option.key)}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? "#ffffff" : colors.text,
                  },
                  isRTL && styles.textRTL,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const CheckboxGroup: React.FC<{
  label: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}> = ({ label, options, selectedValues, onToggle }) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  return (
    <View style={styles.inputGroup}>
      <Text
        style={[
          styles.inputLabel,
          { color: colors.text },
          isRTL && styles.textRTL,
        ]}
      >
        {label}
      </Text>
      <View style={styles.checkboxGroup}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.checkboxItem,
                { backgroundColor: colors.surface },
                isRTL && styles.checkboxItemRTL,
              ]}
              onPress={() => onToggle(option)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : colors.card,
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text
                style={[
                  styles.checkboxLabel,
                  { color: colors.text },
                  isRTL && styles.textRTL,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const CustomSwitch: React.FC<{
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}> = ({ label, value, onValueChange }) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  return (
    <View style={styles.inputGroup}>
      <View
        style={[
          styles.switchRow,
          { backgroundColor: colors.surface },
          isRTL && styles.switchRowRTL,
        ]}
      >
        <Text
          style={[
            styles.switchLabel,
            { color: colors.text },
            isRTL && styles.textRTL,
          ]}
        >
          {label}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value ? "#ffffff" : colors.textSecondary}
        />
      </View>
    </View>
  );
};

const DynamicListInput: React.FC<{
  label: string;
  placeholder: string;
  items: string[];
  onItemsChange: (items: string[]) => void;
  maxItems?: number;
}> = ({ label, placeholder, items, onItemsChange, maxItems = 10 }) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";
  const [inputValue, setInputValue] = useState("");

  const addItem = () => {
    if (inputValue.trim() && items.length < maxItems) {
      onItemsChange([...items, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.inputGroup}>
      <Text
        style={[
          styles.inputLabel,
          { color: colors.text },
          isRTL && styles.textRTL,
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.dynamicInputContainer,
          isRTL && styles.dynamicInputContainerRTL,
        ]}
      >
        <TextInput
          style={[
            styles.dynamicTextInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
            isRTL && styles.textInputRTL,
          ]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: colors.primary,
              opacity: !inputValue.trim() || items.length >= maxItems ? 0.5 : 1,
            },
          ]}
          onPress={addItem}
          disabled={!inputValue.trim() || items.length >= maxItems}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {items.map((item, index) => (
        <View
          key={index}
          style={[
            styles.dynamicItem,
            { backgroundColor: colors.surface },
            isRTL && styles.dynamicItemRTL,
          ]}
        >
          <Text
            style={[
              styles.dynamicItemText,
              { color: colors.text },
              isRTL && styles.textRTL,
            ]}
          >
            {item}
          </Text>
          <TouchableOpacity onPress={() => removeItem(index)}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

// Interface
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

// Main Component
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
  const renderStep = () => {
    const mainGoalOptions = [
      { key: "WEIGHT_LOSS", label: t("questionnaire.loseWeight") },
      { key: "WEIGHT_GAIN", label: t("questionnaire.gainWeight") },
      { key: "WEIGHT_MAINTENANCE", label: t("questionnaire.maintainWeight") },
      { key: "MEDICAL_CONDITION", label: t("questionnaire.improveHealth") },
      { key: "ALERTNESS", label: t("questionnaire.improveHealth") },
      { key: "ENERGY", label: t("questionnaire.improveHealth") },
      { key: "SLEEP_QUALITY", label: t("questionnaire.improveHealth") },
      { key: "SPORTS_PERFORMANCE", label: t("questionnaire.buildMuscle") },
      { key: "OTHER", label: t("questionnaire.other") },
    ];

    const activityLevels = [
      { key: "NONE", label: t("questionnaire.sedentary") },
      { key: "LIGHT", label: t("questionnaire.lightlyActive") },
      { key: "MODERATE", label: t("questionnaire.moderatelyActive") },
      { key: "HIGH", label: t("questionnaire.veryActive") },
    ];

    const sportFrequencies = [
      { key: "NONE", label: t("questionnaire.sedentary") },
      { key: "ONCE_A_WEEK", label: "1x " + t("common.weekly") },
      { key: "TWO_TO_THREE", label: "2-3x " + t("common.weekly") },
      { key: "FOUR_TO_FIVE", label: "4-5x " + t("common.weekly") },
      { key: "MORE_THAN_FIVE", label: "5+x " + t("common.weekly") },
    ];

    const cookingPrefs = [
      { key: "cooked", label: t("questionnaire.cooked") },
      { key: "easy_prep", label: t("questionnaire.easyPrep") },
      { key: "ready_made", label: t("questionnaire.readyMade") },
      { key: "no_cooking", label: t("questionnaire.noCooking") },
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
      { key: "regular", label: t("questionnaire.omnivore") },
      { key: "low_carb", label: t("questionnaire.lowCarb") },
      { key: "keto", label: t("questionnaire.keto") },
      { key: "vegetarian", label: t("questionnaire.vegetarian") },
      { key: "vegan", label: t("questionnaire.vegan") },
      { key: "mediterranean", label: t("questionnaire.mediterranean") },
      { key: "low_fat", label: t("questionnaire.lowFat") },
      { key: "low_sodium", label: t("questionnaire.lowSodium") },
    ];

    const commitmentLevels = [
      { key: "easy", label: t("questionnaire.easy") },
      { key: "moderate", label: t("questionnaire.moderate") },
      { key: "strict", label: t("questionnaire.strict") },
    ];

    const genderOptions = [
      { key: "male", label: t("questionnaire.male") },
      { key: "female", label: t("questionnaire.female") },
      { key: "other", label: t("questionnaire.other") },
    ];

    const mealCounts = [
      { key: "2", label: "2" },
      { key: "3", label: "3" },
      { key: "4", label: "4" },
      { key: "5", label: "5" },
      { key: "6", label: "6" },
    ];

    const smokingStatuses = [
      { key: "NO", label: t("questionnaire.nonSmoker") },
      { key: "YES", label: t("questionnaire.smoker") },
    ];

    const programDurations = [
      { key: "month", label: t("questionnaire.month") },
      { key: "three_months", label: t("questionnaire.threeMonths") },
      { key: "six_months", label: t("questionnaire.sixMonths") },
      { key: "year", label: t("questionnaire.year") },
      { key: "unlimited", label: t("questionnaire.unlimited") },
    ];

    const uploadFreqs = [
      { key: "every_meal", label: t("questionnaire.everyMeal") },
      { key: "daily", label: t("questionnaire.daily") },
      { key: "several_weekly", label: t("questionnaire.severalWeekly") },
      { key: "weekly", label: t("questionnaire.weekly") },
    ];

    const notificationPrefs = [
      { key: "DAILY", label: t("questionnaire.daily") },
      { key: "WEEKLY", label: t("questionnaire.weekly") },
      { key: "NONE", label: t("common.no") },
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
              onChangeText={(text) => setFormData({ ...formData, age: text })}
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
            <CustomTextInput
              label={t("questionnaire.height")}
              value={formData.height_cm}
              onChangeText={(text) =>
                setFormData({ ...formData, height_cm: text })
              }
              placeholder={t("questionnaire.enterHeight")}
              keyboardType="numeric"
              required
            />
            <CustomTextInput
              label={t("questionnaire.weight")}
              value={formData.weight_kg}
              onChangeText={(text) =>
                setFormData({ ...formData, weight_kg: text })
              }
              placeholder={t("questionnaire.enterWeight")}
              keyboardType="numeric"
              required
            />
            <CustomTextInput
              label={t("questionnaire.targetWeight")}
              value={formData.target_weight_kg || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, target_weight_kg: text || null })
              }
              placeholder={t("questionnaire.enterTargetWeight")}
              keyboardType="numeric"
            />
            <DynamicListInput
              label={t("questionnaire.additionalPersonalInfo")}
              placeholder={t("questionnaire.addItem")}
              items={formData.additional_personal_info}
              onItemsChange={(items) =>
                setFormData({ ...formData, additional_personal_info: items })
              }
              maxItems={5}
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
              onChangeText={(text) =>
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
              label={t("questionnaire.mealsPerDay")}
              options={mealCounts}
              selectedValue={formData.meals_per_day}
              onSelect={(value) =>
                setFormData({ ...formData, meals_per_day: value })
              }
            />
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
              onToggle={(value) =>
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
              onChangeText={(text) =>
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
              value={formData.kosher}
              onValueChange={(value) =>
                setFormData({ ...formData, kosher: value })
              }
            />
            <CheckboxGroup
              label={t("questionnaire.allergies")}
              options={allergens}
              selectedValues={formData.allergies}
              onToggle={(value) =>
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
            <CustomTextInput
              label={t("questionnaire.sleepHours")}
              value={formData.sleep_hours_per_night || ""}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  sleep_hours_per_night: text || null,
                })
              }
              placeholder={t("questionnaire.example7Hours")}
              keyboardType="numeric"
            />
            <OptionGroup
              label={t("questionnaire.smokingStatus")}
              options={smokingStatuses}
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
              label={t("questionnaire.programDuration")}
              options={programDurations}
              selectedValue={formData.program_duration}
              onSelect={(value) =>
                setFormData({ ...formData, program_duration: value })
              }
            />
            <OptionGroup
              label={t("questionnaire.uploadFrequency")}
              options={uploadFreqs}
              selectedValue={formData.upload_frequency}
              onSelect={(value) =>
                setFormData({ ...formData, upload_frequency: value })
              }
            />
            <CustomSwitch
              label={t("questionnaire.willingnessToFollow")}
              value={formData.willingness_to_follow}
              onValueChange={(value) =>
                setFormData({ ...formData, willingness_to_follow: value })
              }
            />
            <CustomSwitch
              label={t("questionnaire.personalizedTips")}
              value={formData.personalized_tips}
              onValueChange={(value) =>
                setFormData({ ...formData, personalized_tips: value })
              }
            />
            <OptionGroup
              label={t("questionnaire.notificationsPreference")}
              options={notificationPrefs}
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
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t("questionnaire.loading")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
            isRTL && styles.textRTL,
          ]}
        >
          {t("questionnaire.title")}
        </Text>
      </View>

      <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderStep()}

        <View
          style={[
            styles.tipContainer,
            {
              backgroundColor: colors.primaryLight,
              borderLeftColor: colors.primary,
            },
          ]}
        >
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text
            style={[
              styles.tipText,
              { color: colors.primary },
              isRTL && styles.textRTL,
            ]}
          >
            {t("questionnaire.tip")}
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.navigation,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.nextButton,
              {
                backgroundColor: canProceed() ? colors.primary : colors.border,
                opacity: canProceed() ? 1 : 0.6,
              },
            ]}
            onPress={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
          >
            <Text style={[styles.buttonText, isRTL && styles.textRTL]}>
              {t("common.next")}
            </Text>
            <Ionicons
              name={isRTL ? "arrow-back" : "arrow-forward"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.finishButton,
              {
                backgroundColor: isSaving ? colors.border : colors.success,
                opacity: isSaving ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={[styles.buttonText, isRTL && styles.textRTL]}>
                  {isEditMode ? t("common.save") : t("questionnaire.finish")}
                </Text>
                <Ionicons name="checkmark" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

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
              <Text style={[styles.modalButtonText, isRTL && styles.textRTL]}>
                {t("common.ok")}
              </Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    elevation: 3,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stepHeader: {
    marginBottom: 32,
    alignItems: "center",
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.8,
  },
  inputGroup: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  inputWrapper: {
    borderRadius: 12,
    elevation: 1,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 52,
  },
  textInputRTL: {
    textAlign: "right",
  },
  textRTL: {
    textAlign: "right",
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minWidth: 80,
    alignItems: "center",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  checkboxGroup: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkboxItemRTL: {
    flexDirection: "row-reverse",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  switchRowRTL: {
    flexDirection: "row-reverse",
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  dynamicInputContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dynamicInputContainerRTL: {
    flexDirection: "row-reverse",
  },
  dynamicTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 48,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dynamicItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dynamicItemRTL: {
    flexDirection: "row-reverse",
  },
  dynamicItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  tipContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    flex: 1,
  },
  navigation: {
    padding: 20,
    borderTopWidth: 1,
    elevation: 3,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: "rgba(0,0,0,0.15)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    minHeight: 56,
  },
  nextButton: {},
  finishButton: {},
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    maxWidth: 320,
    width: "100%",
    elevation: 8,
    shadowColor: "rgba(0,0,0,0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

const createThemedStyles = (colors: any, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    backButton: {
      padding: 8,
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      textAlign: isRTL ? "right" : "left",
    },
    textRTL: {
      textAlign: "right",
    },
    progressContainer: {
      backgroundColor: colors.card,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    progressText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    progressStepText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    content: {
      flex: 1,
    },
    stepContent: {
      flex: 1,
      padding: 20,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
      textAlign: isRTL ? "right" : "left",
    },
    stepSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
      lineHeight: 24,
      textAlign: isRTL ? "right" : "left",
    },
    navigation: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 20,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    navButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 100,
      alignItems: "center",
    },
    navButtonPrimary: {
      backgroundColor: colors.primary,
    },
    navButtonSecondary: {
      backgroundColor: colors.border,
    },
    navButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    navButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    navButtonTextPrimary: {
      color: colors.background,
    },
    navButtonTextSecondary: {
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      margin: 20,
      maxWidth: 300,
      width: "100%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    modalText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 24,
      textAlign: "center",
      lineHeight: 24,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    modalButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: 80,
      alignItems: "center",
    },
    modalButtonPrimary: {
      backgroundColor: colors.primary,
    },
    modalButtonSecondary: {
      backgroundColor: colors.border,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    modalButtonTextPrimary: {
      color: colors.background,
    },
    modalButtonTextSecondary: {
      color: colors.text,
    },
  });

export default QuestionnaireScreen;

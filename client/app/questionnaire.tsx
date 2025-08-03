import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  ChevronLeft,
  CheckCircle,
  User,
  Target,
  Activity,
  Heart,
  Utensils,
  Calendar,
  Settings,
  Sparkles,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const COLORS = {
  emerald: {
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
  },
  gray: {
    600: "#4b5563",
  },
};

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

interface FormData {
  // Personal Data
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  target_weight_kg: string;

  // Goals
  main_goal: string;
  commitment_level: string;
  goal_timeframe: string;

  // Activity
  physical_activity_level: string;
  sport_frequency: string;
  sport_types: string[];

  // Health
  medical_conditions: string[];
  medications: string[];

  // Means
  cooking_preference: string;
  daily_food_budget: string;

  // Dietary
  dietary_style: string;
  allergies: string[];
  kosher: boolean;

  // Lifestyle
  meals_per_day: string;
  intermittent_fasting: boolean;

  // Preferences
  notifications_preference: string;
  personalized_tips: boolean;
}

const ProgressIndicator = ({ currentStep, totalSteps, steps }: any) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          { width: `${(currentStep / totalSteps) * 100}%` },
        ]}
      />
    </View>
    <Text style={styles.progressText}>
      שלב {currentStep} מתוך {totalSteps}
    </Text>
  </View>
);

const StepContainer = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.stepTitle}>{title}</Text>
    {children}
  </View>
);

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor="#9ca3af"
    />
  </View>
);

const SelectButton = ({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.selectButton, selected && styles.selectButtonSelected]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.selectButtonText,
        selected && styles.selectButtonTextSelected,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function Questionnaire() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    target_weight_kg: "",
    main_goal: "",
    commitment_level: "",
    goal_timeframe: "",
    physical_activity_level: "",
    sport_frequency: "",
    sport_types: [],
    medical_conditions: [],
    medications: [],
    cooking_preference: "",
    daily_food_budget: "",
    dietary_style: "",
    allergies: [],
    kosher: false,
    meals_per_day: "3",
    intermittent_fasting: false,
    notifications_preference: "",
    personalized_tips: true,
  });

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: keyof FormData, value: string) => {
    const currentArray = formData[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFormData(key, newArray);
  };

  const renderPersonalDataStep = () => (
    <StepContainer title="ספר לנו קצת על עצמך">
      <InputField
        label="גיל"
        value={formData.age}
        onChangeText={(text: string) => updateFormData("age", text)}
        placeholder="הכנס את הגיל שלך"
        keyboardType="numeric"
      />

      <Text style={styles.inputLabel}>מין</Text>
      <View style={styles.buttonRow}>
        <SelectButton
          title="זכר"
          selected={formData.gender === "male"}
          onPress={() => updateFormData("gender", "male")}
        />
        <SelectButton
          title="נקבה"
          selected={formData.gender === "female"}
          onPress={() => updateFormData("gender", "female")}
        />
      </View>

      <InputField
        label="גובה (ס״מ)"
        value={formData.height_cm}
        onChangeText={(text: string) => updateFormData("height_cm", text)}
        placeholder="170"
        keyboardType="numeric"
      />

      <InputField
        label="משקל נוכחי (ק״ג)"
        value={formData.weight_kg}
        onChangeText={(text: string) => updateFormData("weight_kg", text)}
        placeholder="70"
        keyboardType="numeric"
      />

      <InputField
        label="משקל יעד (ק״ג) - אופציונלי"
        value={formData.target_weight_kg}
        onChangeText={(text: string) =>
          updateFormData("target_weight_kg", text)
        }
        placeholder="65"
        keyboardType="numeric"
      />
    </StepContainer>
  );

  const renderGoalsStep = () => (
    <StepContainer title="מה המטרה שלך?">
      <Text style={styles.inputLabel}>מטרה עיקרית</Text>
      <View style={styles.buttonColumn}>
        {[
          "ירידה במשקל",
          "עלייה במשקל",
          "שמירה על משקל",
          "בניית שריר",
          "שיפור בריאות",
        ].map((goal) => (
          <SelectButton
            key={goal}
            title={goal}
            selected={formData.main_goal === goal}
            onPress={() => updateFormData("main_goal", goal)}
          />
        ))}
      </View>

      <Text style={styles.inputLabel}>רמת מחויבות</Text>
      <View style={styles.buttonColumn}>
        {["נמוכה", "בינונית", "גבוהה", "מקסימלית"].map((level) => (
          <SelectButton
            key={level}
            title={level}
            selected={formData.commitment_level === level}
            onPress={() => updateFormData("commitment_level", level)}
          />
        ))}
      </View>

      <Text style={styles.inputLabel}>זמן להשגת המטרה</Text>
      <View style={styles.buttonColumn}>
        {["חודש", "3 חודשים", "6 חודשים", "שנה", "ללא מגבלת זמן"].map(
          (timeframe) => (
            <SelectButton
              key={timeframe}
              title={timeframe}
              selected={formData.goal_timeframe === timeframe}
              onPress={() => updateFormData("goal_timeframe", timeframe)}
            />
          )
        )}
      </View>
    </StepContainer>
  );

  const renderActivityStep = () => (
    <StepContainer title="ספר לנו על הפעילות הגופנית שלך">
      <Text style={styles.inputLabel}>רמת פעילות גופנית</Text>
      <View style={styles.buttonColumn}>
        {[
          "אין פעילות",
          "פעילות קלה",
          "פעילות בינונית",
          "פעילות גבוהה",
          "פעילות מאוד גבוהה",
        ].map((level) => (
          <SelectButton
            key={level}
            title={level}
            selected={formData.physical_activity_level === level}
            onPress={() => updateFormData("physical_activity_level", level)}
          />
        ))}
      </View>

      <Text style={styles.inputLabel}>תדירות אימונים</Text>
      <View style={styles.buttonColumn}>
        {[
          "לא מתאמן",
          "1-2 פעמים בשבוע",
          "3-4 פעמים בשבוע",
          "5-6 פעמים בשבוע",
          "כל יום",
        ].map((freq) => (
          <SelectButton
            key={freq}
            title={freq}
            selected={formData.sport_frequency === freq}
            onPress={() => updateFormData("sport_frequency", freq)}
          />
        ))}
      </View>

      <Text style={styles.inputLabel}>סוגי פעילות (ניתן לבחור כמה)</Text>
      <View style={styles.buttonColumn}>
        {[
          "כושר בחדר כושר",
          "ריצה",
          "שחייה",
          "יוגה",
          "רכיבה על אופניים",
          "הליכה",
        ].map((sport) => (
          <SelectButton
            key={sport}
            title={sport}
            selected={formData.sport_types.includes(sport)}
            onPress={() => toggleArrayValue("sport_types", sport)}
          />
        ))}
      </View>
    </StepContainer>
  );

  const renderHealthStep = () => (
    <StepContainer title="מידע בריאותי">
      <Text style={styles.inputLabel}>מצבים רפואיים (ניתן לבחור כמה)</Text>
      <View style={styles.buttonColumn}>
        {["אין", "סוכרת", "לחץ דם גבוה", "בעיות לב", "בעיות עיכול", "אחר"].map(
          (condition) => (
            <SelectButton
              key={condition}
              title={condition}
              selected={formData.medical_conditions.includes(condition)}
              onPress={() => toggleArrayValue("medical_conditions", condition)}
            />
          )
        )}
      </View>

      <Text style={styles.inputLabel}>תרופות קבועות (ניתן לבחור כמה)</Text>
      <View style={styles.buttonColumn}>
        {["אין", "ויטמינים", "תרופות ללחץ דם", "תרופות לסוכרת", "אחר"].map(
          (med) => (
            <SelectButton
              key={med}
              title={med}
              selected={formData.medications.includes(med)}
              onPress={() => toggleArrayValue("medications", med)}
            />
          )
        )}
      </View>
    </StepContainer>
  );

  const renderMeansStep = () => (
    <StepContainer title="אמצעים ותנאים">
      <Text style={styles.inputLabel}>העדפת בישול</Text>
      <View style={styles.buttonColumn}>
        {["אוהב לבשל", "בישול בסיסי", "לא אוהב לבשל", "אין זמן לבשל"].map(
          (pref) => (
            <SelectButton
              key={pref}
              title={pref}
              selected={formData.cooking_preference === pref}
              onPress={() => updateFormData("cooking_preference", pref)}
            />
          )
        )}
      </View>

      <InputField
        label="תקציב יומי לאוכל (ש״ח)"
        value={formData.daily_food_budget}
        onChangeText={(text: string) =>
          updateFormData("daily_food_budget", text)
        }
        placeholder="100"
        keyboardType="numeric"
      />
    </StepContainer>
  );

  const renderDietaryStep = () => (
    <StepContainer title="העדפות תזונתיות">
      <Text style={styles.inputLabel}>סגנון תזונה</Text>
      <View style={styles.buttonColumn}>
        {["רגיל", "צמחוני", "טבעוני", "כשר", "ללא גלוטן", "קטוגני"].map(
          (style) => (
            <SelectButton
              key={style}
              title={style}
              selected={formData.dietary_style === style}
              onPress={() => updateFormData("dietary_style", style)}
            />
          )
        )}
      </View>

      <Text style={styles.inputLabel}>אלרגיות (ניתן לבחור כמה)</Text>
      <View style={styles.buttonColumn}>
        {["אין", "אגוזים", "חלב", "ביצים", "דגים", "גלוטן", "סויה"].map(
          (allergy) => (
            <SelectButton
              key={allergy}
              title={allergy}
              selected={formData.allergies.includes(allergy)}
              onPress={() => toggleArrayValue("allergies", allergy)}
            />
          )
        )}
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.inputLabel}>כשרות</Text>
        <TouchableOpacity
          style={[styles.switch, formData.kosher && styles.switchActive]}
          onPress={() => updateFormData("kosher", !formData.kosher)}
        >
          <View
            style={[
              styles.switchThumb,
              formData.kosher && styles.switchThumbActive,
            ]}
          />
        </TouchableOpacity>
      </View>
    </StepContainer>
  );

  const renderLifestyleStep = () => (
    <StepContainer title="אורח חיים">
      <Text style={styles.inputLabel}>מספר ארוחות ביום</Text>
      <View style={styles.buttonRow}>
        {["2", "3", "4", "5", "6"].map((meals) => (
          <SelectButton
            key={meals}
            title={meals}
            selected={formData.meals_per_day === meals}
            onPress={() => updateFormData("meals_per_day", meals)}
          />
        ))}
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.inputLabel}>צום לסירוגין</Text>
        <TouchableOpacity
          style={[
            styles.switch,
            formData.intermittent_fasting && styles.switchActive,
          ]}
          onPress={() =>
            updateFormData(
              "intermittent_fasting",
              !formData.intermittent_fasting
            )
          }
        >
          <View
            style={[
              styles.switchThumb,
              formData.intermittent_fasting && styles.switchThumbActive,
            ]}
          />
        </TouchableOpacity>
      </View>
    </StepContainer>
  );

  const renderPreferencesStep = () => (
    <StepContainer title="הגדרות נוספות">
      <Text style={styles.inputLabel}>תדירות התראות</Text>
      <View style={styles.buttonColumn}>
        {["יומית", "שבועית", "ללא התראות"].map((pref) => (
          <SelectButton
            key={pref}
            title={pref}
            selected={formData.notifications_preference === pref}
            onPress={() => updateFormData("notifications_preference", pref)}
          />
        ))}
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.inputLabel}>טיפים מותאמים אישית</Text>
        <TouchableOpacity
          style={[
            styles.switch,
            formData.personalized_tips && styles.switchActive,
          ]}
          onPress={() =>
            updateFormData("personalized_tips", !formData.personalized_tips)
          }
        >
          <View
            style={[
              styles.switchThumb,
              formData.personalized_tips && styles.switchThumbActive,
            ]}
          />
        </TouchableOpacity>
      </View>
    </StepContainer>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalDataStep();
      case 2:
        return renderGoalsStep();
      case 3:
        return renderActivityStep();
      case 4:
        return renderHealthStep();
      case 5:
        return renderMeansStep();
      case 6:
        return renderDietaryStep();
      case 7:
        return renderLifestyleStep();
      case 8:
        return renderPreferencesStep();
      default:
        return renderPersonalDataStep();
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
        return true; // Health step is optional
      case 5:
        return formData.cooking_preference;
      case 6:
        return formData.dietary_style;
      case 7:
        return true; // Lifestyle step is optional
      case 8:
        return true; // Preferences step is optional
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert(
        "הצלחה!",
        "השאלון נשמר בהצלחה. אנחנו כעת בונים עבורך תוכנית תזונה מותאמת אישית.",
        [
          {
            text: "המשך",
            onPress: () => router.replace("/"),
          },
        ]
      );
    }, 2000);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

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
              <Text style={styles.headerTitle}>{currentStepData.title}</Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.stepCounter}>
                {currentStep}/{STEPS.length}
              </Text>
            </View>
          </View>
        </BlurView>
      </LinearGradient>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={STEPS.length}
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
          {currentStep < STEPS.length ? (
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
                  <Text style={styles.finishButtonText}>צור תוכנית אישית</Text>
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  progressText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  buttonColumn: {
    gap: 12,
    marginBottom: 20,
  },
  selectButton: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    flex: 1,
  },
  selectButtonSelected: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  selectButtonText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6b7280",
  },
  selectButtonTextSelected: {
    color: "#10b981",
    fontWeight: "600",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: "#10b981",
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
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

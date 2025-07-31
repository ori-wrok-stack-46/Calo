import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { StepProps } from "../../src/types/questionnaire";
import StepContainer from "./StepContainer";
import OptionGroup from "./OptionGroup";
import ModernSwitch from "./ModernSwitch";
import DynamicListInput from "./DynamicListInput";
import { Sparkles, CircleCheck as CheckCircle } from "lucide-react-native";
export const COLORS = {
  // Primary Emerald Colors
  emerald: {
    50: "#ecfdf5", // Very light mint
    100: "#d1fae5", // Light mint
    200: "#a7f3d0", // Soft mint
    300: "#6ee7b7", // Medium mint
    400: "#34d399", // Bright emerald
    500: "#10b981", // Main emerald
    600: "#059669", // Deep emerald
    700: "#047857", // Darker emerald
    800: "#065f46", // Very dark emerald
    900: "#064e3b", // Darkest emerald
  },
  // Neutral grays that complement emerald
  gray: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  // Accent colors
  white: "#ffffff",
  error: "#ef4444",
  warning: "#f59e0b",
};

const PROGRAM_DURATION = [
  { key: "חודש", label: "חודש - נסיון ראשוני", color: COLORS.emerald[400] },
  {
    key: "3 חודשים",
    label: "3 חודשים - יצירת הרגלים",
    color: COLORS.emerald[500],
  },
  {
    key: "6 חודשים",
    label: "6 חודשים - שינוי משמעותי",
    color: COLORS.emerald[600],
  },
  { key: "שנה", label: "שנה - שינוי אורח חיים", color: COLORS.emerald[700] },
  {
    key: "ללא הגבלה",
    label: "ללא הגבלה - אורח חיים חדש",
    color: COLORS.emerald[800],
  },
];

const UPLOAD_FREQUENCY = [
  {
    key: "כל ארוחה",
    label: "כל ארוחה - מעקב מדויק",
    color: COLORS.emerald[600],
  },
  {
    key: "פעם ביום",
    label: "פעם ביום - איזון טוב",
    color: COLORS.emerald[500],
  },
  {
    key: "כמה פעמים בשבוע",
    label: "כמה פעמים בשבוע - גמיש",
    color: COLORS.emerald[400],
  },
  {
    key: "פעם בשבוע",
    label: "פעם בשבוע - מינימלי",
    color: COLORS.emerald[300],
  },
];

const NOTIFICATION_PREFERENCES = [
  { key: "DAILY", label: "יומי - תזכורות והעצות", color: COLORS.emerald[600] },
  { key: "WEEKLY", label: "שבועי - סיכום וטיפים", color: COLORS.emerald[500] },
  { key: "NONE", label: "ללא - אני אכנס בעצמי", color: COLORS.emerald[400] },
];

interface PreferencesStepProps extends StepProps {
  onSubmit?: () => void;
  isSaving?: boolean;
}

export default function PreferencesStep({
  formData,
  setFormData,
  onSubmit,
  isSaving = false,
}: PreferencesStepProps) {
  return (
    <StepContainer
      title="סיימנו! בואו נסיים בסטייל"
      subtitle="הגדרות אחרונות לתוכנית המותאמת אישית שלך"
      icon="🎉"
    >
      <OptionGroup
        label="משך התוכנית המועדף"
        options={PROGRAM_DURATION}
        selectedValue={formData.program_duration || ""}
        onSelect={(value) =>
          setFormData({ ...formData, program_duration: value })
        }
      />

      <OptionGroup
        label="כמה פעמים תרצה לשתף ארוחות?"
        options={UPLOAD_FREQUENCY}
        selectedValue={formData.upload_frequency || ""}
        onSelect={(value) =>
          setFormData({ ...formData, upload_frequency: value })
        }
      />

      <OptionGroup
        label="התראות והתעדכנויות"
        options={NOTIFICATION_PREFERENCES}
        selectedValue={formData.notifications_preference || ""}
        onSelect={(value) =>
          setFormData({
            ...formData,
            notifications_preference: value as "DAILY" | "WEEKLY" | "NONE",
          })
        }
      />

      <ModernSwitch
        label="האם אתה מתחייב למלא אחר התוכנית?"
        value={formData.willingness_to_follow || false}
        onValueChange={(value) =>
          setFormData({ ...formData, willingness_to_follow: value })
        }
        description="התחייבות תעזור לנו לתת לך תוכנית יעילה יותר"
      />

      <ModernSwitch
        label="טיפים מותאמים אישית"
        value={formData.personalized_tips || false}
        onValueChange={(value) =>
          setFormData({ ...formData, personalized_tips: value })
        }
        description="קבל טיפים והמלצות מותאמות לפרופיל שלך"
      />

      <ModernSwitch
        label="חיבור מכשירי בריאות"
        value={formData.health_metrics_integration || false}
        onValueChange={(value) =>
          setFormData({ ...formData, health_metrics_integration: value })
        }
        description="חבר שעון חכם או אפליקציות בריאות"
      />

      <DynamicListInput
        label="הגבלות תזונתיות נוספות"
        placeholder="הוסף הגבלה תזונתית נוספת..."
        initialItems={formData.dietary_restrictions || []}
        onItemsChange={(value) =>
          setFormData({ ...formData, dietary_restrictions: value })
        }
        maxItems={10}
      />

      <DynamicListInput
        label="אירועים קרובים חשובים"
        placeholder="לדוגמה: חתונה, חופשה, אירוע חשוב"
        initialItems={formData.upcoming_events || []}
        onItemsChange={(value) =>
          setFormData({ ...formData, upcoming_events: value })
        }
        maxItems={8}
      />

      <View style={styles.finishSection}>
        <View style={styles.celebrationContainer}>
          <Sparkles size={32} color={COLORS.emerald[500]} />
          <Text style={styles.celebrationText}>מעולה! סיימת את כל השלבים</Text>
          <Text style={styles.celebrationSubtext}>
            אנחנו מוכנים לבנות עבורך תוכנית תזונה מותאמת אישית לפי כל הפרטים
            שספקת
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.finishButton, isSaving && styles.finishButtonDisabled]}
          onPress={onSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} size={20} />
          ) : (
            <>
              <CheckCircle size={20} color={COLORS.white} />
              <Text style={styles.finishButtonText}>צור תוכנית אישית</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  finishSection: {
    marginTop: 32,
    gap: 24,
  },
  celebrationContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.emerald[50],
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.emerald[200],
  },
  celebrationText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.emerald[700],
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  celebrationSubtext: {
    fontSize: 14,
    color: COLORS.emerald[600],
    textAlign: "center",
    lineHeight: 20,
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.emerald[500],
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: COLORS.emerald[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  finishButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0.1,
  },
  finishButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});

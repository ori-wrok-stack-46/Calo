import React from "react";
import { View } from "react-native";
import { StepProps } from "../../src/types/questionnaire";
import StepContainer from "./StepContainer";
import OptionGroup from "./OptionGroup";
import ModernTextInput from "./ModernTextInput";
import DynamicListInput from "./DynamicListInput";
import ModernSwitch from "./ModernSwitch";
import CheckboxGroup from "./CheckboxGroup";

const MEALS_OPTIONS = [
  { key: "2", label: "2 ארוחות", color: "#64748b" },
  { key: "3", label: "3 ארוחות", color: "#10b981" },
  { key: "4", label: "4 ארוחות", color: "#f59e0b" },
  { key: "5", label: "5 ארוחות", color: "#ef4444" },
  { key: "6", label: "6 ארוחות", color: "#8b5cf6" },
];

const COOKING_PREFERENCES = [
  { key: "מבושל", label: "מבושל - אוהב לבשל ארוחות מלאות", color: "#ef4444" },
  { key: "קל הכנה", label: "קל הכנה - מתכונים פשוטים", color: "#f59e0b" },
  { key: "מוכן מראש", label: "מוכן מראש - הכנה מראש לשבוע", color: "#10b981" },
  { key: "ללא בישול", label: "ללא בישול - מזון מוכן", color: "#64748b" },
];

const COOKING_METHODS = [
  "מיקרוגל",
  "תנור",
  "כיריים",
  "סיר לחץ",
  "מחבת",
  "גריל",
  "אין אפשרויות בישול",
];

export default function MeansStep({ formData, setFormData }: StepProps) {
  return (
    <StepContainer
      title="איך נבנה את התפריט?"
      subtitle="מידע על האמצעים והזמן הזמינים לך יעזור לבניית תפריט מעשי ומותאם"
      icon="🍽️"
    >
      <OptionGroup
        label="כמה ארוחות ביום אתה מעדיף?"
        options={MEALS_OPTIONS}
        selectedValue={formData.meals_per_day}
        onSelect={(value) => setFormData({ ...formData, meals_per_day: value })}
        required
      />

      <ModernSwitch
        label="האם אתה אוכל חטיפים בין הארוחות?"
        value={formData.snacks_between_meals}
        onValueChange={(value) =>
          setFormData({ ...formData, snacks_between_meals: value })
        }
      />

      <OptionGroup
        label="איך אתה מעדיף להכין אוכל?"
        options={COOKING_PREFERENCES}
        selectedValue={formData.cooking_preference}
        onSelect={(value) =>
          setFormData({ ...formData, cooking_preference: value })
        }
        required
      />

      <CheckboxGroup
        label="אמצעי בישול זמינים לך"
        options={COOKING_METHODS}
        selectedValues={formData.available_cooking_methods}
        onSelectionChange={(values) =>
          setFormData({ ...formData, available_cooking_methods: values })
        }
        required
      />

      <ModernTextInput
        label="תקציב יומי לאוכל (₪)"
        value={formData.daily_food_budget || ""}
        onChangeText={(text) =>
          setFormData({ ...formData, daily_food_budget: text || null })
        }
        keyboardType="numeric"
        placeholder="לדוגמה: 50 שקל ליום"
      />

      <ModernTextInput
        label="כמה זמן יש לך להכנת אוכל ביום? (דקות)"
        value={formData.daily_cooking_time || ""}
        onChangeText={(text) =>
          setFormData({ ...formData, daily_cooking_time: text || null })
        }
        keyboardType="numeric"
        placeholder="לדוגמה: 30 דקות"
      />

      <DynamicListInput
        label="זמני ארוחות מועדפים"
        placeholder="לדוגמה: 8:00, 13:00, 18:00"
        initialItems={formData.meal_times}
        onItemsChange={(value) =>
          setFormData({ ...formData, meal_times: value })
        }
        maxItems={6}
      />

      <DynamicListInput
        label="איך אתה קונה אוכל?"
        placeholder="לדוגמה: סופרמרקט, שוק, קניות אונליין"
        initialItems={formData.shopping_method}
        onItemsChange={(value) =>
          setFormData({ ...formData, shopping_method: value })
        }
        maxItems={5}
      />
    </StepContainer>
  );
}

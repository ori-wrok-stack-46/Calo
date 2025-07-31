import React from 'react';
import { View } from 'react-native';
import { StepProps } from '../../src/types/questionnaire';
import StepContainer from './StepContainer';
import DynamicListInput from './DynamicListInput';

export default function HealthStep({ formData, setFormData }: StepProps) {
  return (
    <StepContainer
      title="בואו נדבר על בריאות"
      subtitle="מידע רפואי יעזור לנו להתאים את התזונה לצרכים המיוחדים שלך"
      icon="❤️"
    >
      <DynamicListInput
        label="בעיות רפואיות (אם יש)"
        placeholder="לדוגמה: סכרת, לחץ דם גבוה, כולסטרול"
        initialItems={formData.medical_conditions_text}
        onItemsChange={(value) => setFormData({ ...formData, medical_conditions_text: value })}
        maxItems={10}
      />

      <DynamicListInput
        label="תרופות קבועות (אם יש)"
        placeholder="רשום את שמות התרופות שאתה נוטל"
        initialItems={formData.medications}
        onItemsChange={(value) => setFormData({ ...formData, medications: value })}
        maxItems={10}
      />

      <DynamicListInput
        label="יעדים בריאותיים"
        placeholder="לדוגמה: הורדת כולסטרול, שיפור לחץ דם"
        initialItems={formData.health_goals}
        onItemsChange={(value) => setFormData({ ...formData, health_goals: value })}
        maxItems={8}
      />

      <DynamicListInput
        label="בעיות תפקודיות שאתה חווה"
        placeholder="לדוגמה: עייפות כרונית, חוסר ריכוז, בעיות שינה"
        initialItems={formData.functional_issues}
        onItemsChange={(value) => setFormData({ ...formData, functional_issues: value })}
        maxItems={8}
      />

      <DynamicListInput
        label="בעיות תזונתיות קיימות"
        placeholder="לדוגמה: קושי בעיכול, רגישות למזונים מסוימים"
        initialItems={formData.food_related_medical_issues}
        onItemsChange={(value) => setFormData({ ...formData, food_related_medical_issues: value })}
        maxItems={8}
      />
    </StepContainer>
  );
}
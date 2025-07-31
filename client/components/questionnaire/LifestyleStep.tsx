import React from 'react';
import { View } from 'react-native';
import { StepProps } from '../../src/types/questionnaire';
import StepContainer from './StepContainer';
import OptionGroup from './OptionGroup';
import ModernTextInput from './ModernTextInput';
import DynamicListInput from './DynamicListInput';

const SMOKING_STATUS = [
  { key: 'NO', label: 'לא מעשן', color: '#10b981' },
  { key: 'YES', label: 'מעשן', color: '#ef4444' },
];

export default function LifestyleStep({ formData, setFormData }: StepProps) {
  return (
    <StepContainer
      title="ספר לנו על השגרה שלך"
      subtitle="מידע על אורח החיים שלך יעזור לבניית תוכנית מעשית ומותאמת לשגרה"
      icon="🌅"
    >
      <ModernTextInput
        label="כמה שעות שינה בלילה?"
        value={formData.sleep_hours_per_night?.toString() || ''}
        onChangeText={(text) => {
          const parsed = parseFloat(text);
          setFormData({ 
            ...formData, 
            sleep_hours_per_night: isNaN(parsed) ? null : parsed 
          });
        }}
        keyboardType="numeric"
        placeholder="לדוגמה: 7-8 שעות"
      />

      <OptionGroup
        label="סטטוס עישון"
        options={SMOKING_STATUS}
        selectedValue={formData.smoking_status || ''}
        onSelect={(value) => setFormData({ ...formData, smoking_status: value as 'YES' | 'NO' })}
      />

      <DynamicListInput
        label="היסטוריה רפואית משפחתית"
        placeholder="לדוגמה: סכרת, לחץ דם, מחלות לב"
        initialItems={formData.family_medical_history || []}
        onItemsChange={(value) => setFormData({ ...formData, family_medical_history: value })}
        maxItems={10}
      />

      <ModernTextInput
        label="הגבלות זמן ארוחות"
        value={formData.meal_timing_restrictions || ''}
        onChangeText={(text) => setFormData({ ...formData, meal_timing_restrictions: text })}
        placeholder="לדוגמה: לא יכול לאכול לפני 9:00 בבוקר"
        multiline
      />

      <DynamicListInput
        label="קשיים שחווית בדיאטות בעבר"
        placeholder="לדוגמה: רעב מתמיד, חוסר זמן להכנה, משקל יוצב"
        initialItems={formData.past_diet_difficulties}
        onItemsChange={(value) => setFormData({ ...formData, past_diet_difficulties: value })}
        maxItems={10}
      />
    </StepContainer>
  );
}
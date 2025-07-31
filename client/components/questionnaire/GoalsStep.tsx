import React from 'react';
import { View } from 'react-native';
import { StepProps } from '../../src/types/questionnaire';
import StepContainer from './StepContainer';
import OptionGroup from './OptionGroup';
import ModernTextInput from './ModernTextInput';
import DynamicListInput from './DynamicListInput';

const MAIN_GOALS = [
  { key: 'WEIGHT_LOSS', label: 'ירידה במשקל', color: '#ef4444' },
  { key: 'WEIGHT_GAIN', label: 'עלייה במסת שריר', color: '#10b981' },
  { key: 'WEIGHT_MAINTENANCE', label: 'שמירה על משקל', color: '#6366f1' },
  { key: 'MEDICAL_CONDITION', label: 'מטרה רפואית', color: '#f59e0b' },
  { key: 'ALERTNESS', label: 'שיפור ערנות', color: '#06b6d4' },
  { key: 'ENERGY', label: 'הגדלת אנרגיה', color: '#84cc16' },
  { key: 'SLEEP_QUALITY', label: 'איכות שינה', color: '#8b5cf6' },
  { key: 'SPORTS_PERFORMANCE', label: 'ביצועי ספורט', color: '#f97316' },
  { key: 'OTHER', label: 'אחר', color: '#64748b' },
];

const COMMITMENT_LEVELS = [
  { key: 'קל', label: 'קל - גמישות מקסימלית', color: '#10b981' },
  { key: 'ממוצע', label: 'ממוצע - איזון בין גמישות לתוצאות', color: '#f59e0b' },
  { key: 'קפדני', label: 'קפדני - התמקדות בתוצאות', color: '#ef4444' },
];

export default function GoalsStep({ formData, setFormData }: StepProps) {
  return (
    <StepContainer
      title="מה המטרה שלך?"
      subtitle="הגדרת יעדים ברורים תעזור לבניית תוכנית מותאמת אישית ומדויקת"
      icon="🎯"
    >
      <OptionGroup
        label="מה המטרה העיקרית שלך?"
        options={MAIN_GOALS}
        selectedValue={formData.main_goal}
        onSelect={(value) => setFormData({ ...formData, main_goal: value })}
        required
      />

      {formData.main_goal === 'OTHER' && (
        <DynamicListInput
          label="פרט את המטרה שלך"
          placeholder="תאר את המטרה המיוחדת שלך..."
          initialItems={formData.main_goal_text}
          onItemsChange={(value) => setFormData({ ...formData, main_goal_text: value })}
          maxItems={3}
        />
      )}

      <DynamicListInput
        label="מטרות ספציפיות"
        placeholder="לדוגמה: לרדת 5 ק״ג לקראת החתונה"
        initialItems={formData.specific_goal}
        onItemsChange={(value) => setFormData({ ...formData, specific_goal: value })}
        maxItems={5}
      />

      <ModernTextInput
        label="תוך כמה זמן תרצה להגיע ליעד? (ימים)"
        value={formData.goal_timeframe_days || ''}
        onChangeText={(text) => setFormData({ ...formData, goal_timeframe_days: text || null })}
        keyboardType="numeric"
        placeholder="לדוגמה: 90 ימים"
      />

      <OptionGroup
        label="באיזו רמת מחויבות תרצה לפעול?"
        options={COMMITMENT_LEVELS}
        selectedValue={formData.commitment_level}
        onSelect={(value) => setFormData({ ...formData, commitment_level: value })}
        required
      />

      <DynamicListInput
        label="מה הכי חשוב לך להשיג?"
        placeholder="לדוגמה: ביטחון עצמי, בריאות טובה יותר"
        initialItems={formData.most_important_outcome}
        onItemsChange={(value) => setFormData({ ...formData, most_important_outcome: value })}
        maxItems={5}
      />
    </StepContainer>
  );
}
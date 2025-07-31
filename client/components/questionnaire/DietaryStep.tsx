import React from 'react';
import { View } from 'react-native';
import { StepProps } from '../../src/types/questionnaire';
import StepContainer from './StepContainer';
import OptionGroup from './OptionGroup';
import ModernSwitch from './ModernSwitch';
import DynamicListInput from './DynamicListInput';
import CheckboxGroup from './CheckboxGroup';

const DIETARY_STYLES = [
  { key: 'רגיל', label: 'רגיל - ללא הגבלות מיוחדות', color: '#64748b' },
  { key: 'דל פחמימה', label: 'דל פחמימה', color: '#f59e0b' },
  { key: 'קטוגני', label: 'קטוגני - שומנים גבוהים', color: '#ef4444' },
  { key: 'צמחוני', label: 'צמחוני', color: '#10b981' },
  { key: 'טבעוני', label: 'טבעוני', color: '#059669' },
  { key: 'ים תיכוני', label: 'ים תיכוני', color: '#06b6d4' },
  { key: 'דל שומן', label: 'דל שומן', color: '#8b5cf6' },
  { key: 'דל נתרן', label: 'דל נתרן', color: '#84cc16' },
  { key: 'אחר', label: 'אחר', color: '#64748b' },
];

const ALLERGENS = [
  'גלוטן',
  'חלב',
  'ביצים',
  'אגוזים',
  'בוטנים',
  'דגים',
  'רכיכות',
  'סויה',
  'אחר',
];

const REGULAR_DRINKS = [
  'מים',
  'קפה',
  'תה',
  'משקאות מתוקים',
  'אלכוהול',
  'משקאות ספורט',
  'משקאות דיאט',
];

export default function DietaryStep({ formData, setFormData }: StepProps) {
  return (
    <StepContainer
      title="בואו נדבר על האוכל שלך"
      subtitle="מידע על העדפותיך יעזור לבניית תפריט שתאהב לאכול ותרצה לעקוב אחריו"
      icon="🥗"
    >
      <ModernSwitch
        label="האם אתה שומר כשרות?"
        value={formData.kosher}
        onValueChange={(value) => setFormData({ ...formData, kosher: value })}
        description="נתאים את המתכונים בהתאם"
      />

      <OptionGroup
        label="סגנון תזונה מועדף"
        options={DIETARY_STYLES}
        selectedValue={formData.dietary_style}
        onSelect={(value) => setFormData({ ...formData, dietary_style: value })}
        required
      />

      <CheckboxGroup
        label="אלרגיות או רגישויות מזון"
        options={ALLERGENS}
        selectedValues={formData.allergies}
        onSelectionChange={(values) => setFormData({ ...formData, allergies: values })}
      />

      <DynamicListInput
        label="אלרגיות או רגישויות נוספות"
        placeholder="פרט אלרגיות נוספות שלא מופיעות ברשימה"
        initialItems={formData.allergies_text}
        onItemsChange={(value) => setFormData({ ...formData, allergies_text: value })}
        maxItems={10}
      />

      <DynamicListInput
        label="מזונות שאינך אוהב"
        placeholder="לדוגמה: דגים, ירקות ירוקים, בצל"
        initialItems={formData.disliked_foods}
        onItemsChange={(value) => setFormData({ ...formData, disliked_foods: value })}
        maxItems={15}
      />

      <DynamicListInput
        label="מזונות שאתה אוהב במיוחד"
        placeholder="לדוגמה: עוף, קינואה, אבוקדו, שקדים"
        initialItems={formData.liked_foods}
        onItemsChange={(value) => setFormData({ ...formData, liked_foods: value })}
        maxItems={15}
      />

      <CheckboxGroup
        label="משקאות שאתה שותה בקביעות"
        options={REGULAR_DRINKS}
        selectedValues={formData.regular_drinks}
        onSelectionChange={(values) => setFormData({ ...formData, regular_drinks: values })}
      />

      <ModernSwitch
        label="האם אתה עושה צום לסירוגין?"
        value={formData.intermittent_fasting}
        onValueChange={(value) => setFormData({ ...formData, intermittent_fasting: value })}
        description="נתאים את זמני הארוחות בהתאם"
      />

      {formData.intermittent_fasting && (
        <DynamicListInput
          label="שעות הצום"
          placeholder="לדוגמה: 16:8, 14:10, 18:6"
          initialItems={formData.fasting_hours ? [formData.fasting_hours] : []}
          onItemsChange={(value) => setFormData({ ...formData, fasting_hours: value[0] || null })}
          maxItems={1}
        />
      )}

      <DynamicListInput
        label="העדפות מרקם"
        placeholder="לדוגמה: רך, פריך, קרמי, חלק"
        initialItems={formData.meal_texture_preference}
        onItemsChange={(value) => setFormData({ ...formData, meal_texture_preference: value })}
        maxItems={5}
      />
    </StepContainer>
  );
}
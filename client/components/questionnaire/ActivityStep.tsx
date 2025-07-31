import React from 'react';
import { View } from 'react-native';
import { StepProps } from '../../src/types/questionnaire';
import StepContainer from './StepContainer';
import OptionGroup from './OptionGroup';
import ModernTextInput from './ModernTextInput';
import DynamicListInput from './DynamicListInput';
import ModernSwitch from './ModernSwitch';

const PHYSICAL_ACTIVITY_LEVELS = [
  { key: 'NONE', label: 'ללא פעילות', color: '#64748b' },
  { key: 'LIGHT', label: 'קלה (1-2 פעמים בשבוע)', color: '#10b981' },
  { key: 'MODERATE', label: 'בינונית (3-4 פעמים בשבוע)', color: '#f59e0b' },
  { key: 'HIGH', label: 'גבוהה (5+ פעמים בשבוע)', color: '#ef4444' },
];

const SPORT_FREQUENCIES = [
  { key: 'NONE', label: 'ללא', color: '#64748b' },
  { key: 'ONCE_A_WEEK', label: 'פעם בשבוע', color: '#10b981' },
  { key: 'TWO_TO_THREE', label: '2-3 פעמים בשבוע', color: '#f59e0b' },
  { key: 'FOUR_TO_FIVE', label: '4-5 פעמים בשבוע', color: '#ef4444' },
  { key: 'MORE_THAN_FIVE', label: 'יותר מ-5 פעמים בשבוע', color: '#8b5cf6' },
];

export default function ActivityStep({ formData, setFormData }: StepProps) {
  const showSportDetails = formData.sport_frequency !== 'NONE';

  return (
    <StepContainer
      title="בואו נדבר על פעילות"
      subtitle="מידע על הפעילות הגופנית שלך יעזור לחישוב מדויק של הצרכים הקלוריים"
      icon="🏃‍♂️"
    >
      <OptionGroup
        label="רמת הפעילות הגופנית שלך"
        options={PHYSICAL_ACTIVITY_LEVELS}
        selectedValue={formData.physical_activity_level}
        onSelect={(value) => setFormData({ ...formData, physical_activity_level: value })}
        required
      />

      <OptionGroup
        label="תדירות ספורט"
        options={SPORT_FREQUENCIES}
        selectedValue={formData.sport_frequency}
        onSelect={(value) => setFormData({ ...formData, sport_frequency: value })}
        required
      />

      {showSportDetails && (
        <>
          <ModernTextInput
            label="משך ממוצע של כל פעילות (דקות)"
            value={formData.sport_duration_min || ''}
            onChangeText={(text) => setFormData({ ...formData, sport_duration_min: text || null })}
            keyboardType="numeric"
            placeholder="לדוגמה: 45 דקות"
          />

          <DynamicListInput
            label="סוגי פעילות שאתה עושה"
            placeholder="לדוגמה: ריצה, כושר, יוגה, שחייה"
            initialItems={formData.sport_types}
            onItemsChange={(value) => setFormData({ ...formData, sport_types: value })}
            maxItems={10}
          />

          <DynamicListInput
            label="זמני אימונים מועדפים"
            placeholder="לדוגמה: בוקר מוקדם, אחר הצהריים, ערב"
            initialItems={formData.workout_times}
            onItemsChange={(value) => setFormData({ ...formData, workout_times: value })}
            maxItems={5}
          />

          <ModernSwitch
            label="האם אתה משתמש במכשירי כושר חכמים?"
            value={formData.uses_fitness_devices}
            onValueChange={(value) => setFormData({ ...formData, uses_fitness_devices: value })}
          />

          {formData.uses_fitness_devices && (
            <DynamicListInput
              label="מכשירי כושר שאתה משתמש בהם"
              placeholder="לדוגמה: שעון חכם, צמיד כושר, אפליקציית ספורט"
              initialItems={formData.fitness_device_type}
              onItemsChange={(value) => setFormData({ ...formData, fitness_device_type: value })}
              maxItems={5}
            />
          )}

          <DynamicListInput
            label="מידע נוסף על הפעילות שלך"
            placeholder="לדוגמה: פציעות, הגבלות, יעדי ביצועים"
            initialItems={formData.additional_activity_info}
            onItemsChange={(value) => setFormData({ ...formData, additional_activity_info: value })}
            maxItems={5}
          />
        </>
      )}
    </StepContainer>
  );
}
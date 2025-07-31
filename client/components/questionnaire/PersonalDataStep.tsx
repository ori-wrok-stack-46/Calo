import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepProps } from '../../src/types/questionnaire';
import StepContainer from './StepContainer';
import ModernTextInput from './ModernTextInput';
import OptionGroup from './OptionGroup';
import DynamicListInput from './DynamicListInput';

export default function PersonalDataStep({ formData, setFormData }: StepProps) {
  return (
    <StepContainer
      title="בואו נכיר"
      subtitle="נתונים אישיים בסיסיים שיעזרו לנו לחשב את הצרכים הקלוריים שלך"
      icon="👤"
    >
      <ModernTextInput
        label="גיל"
        value={formData.age}
        onChangeText={(text) => setFormData({ ...formData, age: text })}
        keyboardType="numeric"
        placeholder="כמה אתה בן/בת?"
        required
      />

      <OptionGroup
        label="מגדר"
        options={[
          { key: 'זכר', label: 'זכר' },
          { key: 'נקבה', label: 'נקבה' },
          { key: 'אחר', label: 'אחר' },
        ]}
        selectedValue={formData.gender}
        onSelect={(value) => setFormData({ ...formData, gender: value })}
        required
      />

      <View style={styles.row}>
        <ModernTextInput
          label="גובה (ס״מ)"
          value={formData.height_cm}
          onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
          keyboardType="numeric"
          placeholder="170"
          style={styles.halfWidth}
          required
        />

        <ModernTextInput
          label="משקל נוכחי (ק״ג)"
          value={formData.weight_kg}
          onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
          keyboardType="numeric"
          placeholder="70"
          style={styles.halfWidth}
          required
        />
      </View>

      <ModernTextInput
        label="משקל יעד (ק״ג)"
        value={formData.target_weight_kg || ''}
        onChangeText={(text) => setFormData({ ...formData, target_weight_kg: text || null })}
        keyboardType="numeric"
        placeholder="משקל שאתה שואף אליו (אופציונלי)"
      />

      <ModernTextInput
        label="אחוז שומן בגוף"
        value={formData.body_fat_percentage || ''}
        onChangeText={(text) => setFormData({ ...formData, body_fat_percentage: text || null })}
        keyboardType="numeric"
        placeholder="אם ידוע (אופציונלי)"
      />

      <DynamicListInput
        label="פרטים נוספים"
        placeholder="ספר לנו עוד משהו חשוב עליך..."
        initialItems={formData.additional_personal_info}
        onItemsChange={(value) => setFormData({ ...formData, additional_personal_info: value })}
        maxItems={5}
      />
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
});
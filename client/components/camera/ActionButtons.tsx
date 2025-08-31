
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trash2, RefreshCw, Save } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ActionButtonsProps {
  onDelete: () => void;
  onReAnalyze: () => void;
  onSave: () => void;
  isUpdating: boolean;
  isPosting: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDelete,
  onReAnalyze,
  onSave,
  isUpdating,
  isPosting,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Save Meal Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.emerald500 }]}
        onPress={onSave}
        disabled={isPosting}
      >
        {isPosting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {t('camera.saveMeal') || 'Save Meal'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Action Buttons Row */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.background, borderColor: '#EF4444' }]}
          onPress={onDelete}
        >
          <Trash2 size={18} color="#EF4444" />
          <Text style={styles.deleteButtonText}>
            {t('common.delete') || 'Delete'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reanalyzeButton,
            { backgroundColor: colors.background, borderColor: colors.emerald500 },
            isUpdating && styles.buttonDisabled,
          ]}
          onPress={onReAnalyze}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={colors.emerald500} />
          ) : (
            <RefreshCw size={18} color={colors.emerald500} />
          )}
          <Text style={[styles.reanalyzeButtonText, { color: colors.emerald500 }]}>
            {isUpdating ? t('common.updating') || 'Updating...' : t('camera.reanalyze') || 'Re-analyze'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  reanalyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  reanalyzeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

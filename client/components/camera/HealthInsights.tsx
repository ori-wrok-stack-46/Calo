
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface HealthInsightsProps {
  recommendations?: string;
  healthNotes?: string;
}

export const HealthInsights: React.FC<HealthInsightsProps> = ({
  recommendations,
  healthNotes,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!recommendations && !healthNotes) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('health.insights') || 'Health Insights'}
      </Text>
      <View style={[styles.insightCard, { backgroundColor: colors.emerald500 + '10' }]}>
        <TrendingUp size={20} color={colors.emerald500} />
        <Text style={[styles.insightText, { color: colors.text }]}>
          {recommendations || healthNotes}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { PieChart } from './PieChart';
import { Flame, Dumbbell, Wheat, Droplets, TreePine, Candy, Beaker } from 'lucide-react-native';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface NutritionOverviewProps {
  nutrition: NutritionData;
  mealName: string;
}

export const NutritionOverview: React.FC<NutritionOverviewProps> = ({
  nutrition,
  mealName,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const nutritionIcons = {
    calories: { icon: Flame, color: colors.emerald500 },
    protein: { icon: Dumbbell, color: '#3B82F6' },
    carbs: { icon: Wheat, color: '#F59E0B' },
    fat: { icon: Droplets, color: '#EF4444' },
    fiber: { icon: TreePine, color: '#8B5CF6' },
    sugar: { icon: Candy, color: '#F97316' },
    sodium: { icon: Beaker, color: '#6B7280' },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('nutrition.overview') || 'Nutrition Overview'}
        </Text>
        <Text style={[styles.date, { color: colors.icon }]}>
          {formattedDate}
        </Text>
      </View>

      <View style={styles.mainContent}>
        {/* Calorie Display */}
        <View style={styles.calorieDisplay}>
          <Text style={[styles.calorieValue, { color: colors.text }]}>
            {nutrition.calories}
          </Text>
          <Text style={[styles.calorieUnit, { color: colors.icon }]}>
            {t('nutrition.calories') || 'kcal'}
          </Text>
        </View>

        {/* Pie Chart */}
        <PieChart
          protein={nutrition.protein}
          carbs={nutrition.carbs}
          fat={nutrition.fat}
          size={120}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: nutritionIcons.protein.color + '15' }]}>
            <Dumbbell size={16} color={nutritionIcons.protein.color} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {nutrition.protein}g
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {t('nutrition.protein') || 'Protein'}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: nutritionIcons.carbs.color + '15' }]}>
            <Wheat size={16} color={nutritionIcons.carbs.color} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {nutrition.carbs}g
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {t('nutrition.carbs') || 'Carbs'}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: nutritionIcons.fat.color + '15' }]}>
            <Droplets size={16} color={nutritionIcons.fat.color} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {nutrition.fat}g
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {t('nutrition.fat') || 'Fat'}
          </Text>
        </View>
      </View>

      {/* Detailed Nutrition Grid */}
      <View style={styles.nutritionGrid}>
        {Object.entries(nutritionIcons).map(([key, config]) => {
          const IconComponent = config.icon;
          const value = nutrition[key as keyof NutritionData];
          const unit = key === 'calories' ? '' : key === 'sodium' ? 'mg' : 'g';
          
          if (value <= 0 && key !== 'calories') return null;
          
          return (
            <View key={key} style={[styles.nutritionItem, { backgroundColor: colors.surface }]}>
              <View style={[styles.nutritionIcon, { backgroundColor: config.color + '15' }]}>
                <IconComponent size={20} color={config.color} />
              </View>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {value}{unit}
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
                {t(`nutrition.${key}`) || key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  calorieDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  calorieValue: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
  },
  calorieUnit: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: -4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  nutritionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});

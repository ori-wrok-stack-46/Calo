
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Plus, Edit3, Trash2, ShoppingCart } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { nutritionAPI } from '@/src/services/api';

interface Ingredient {
  name: string;
  calories: number;
  protein_g?: number;
  protein?: number;
  carbs_g?: number;
  carbs?: number;
  fats_g?: number;
  fat?: number;
  fats?: number;
  fiber_g?: number;
  fiber?: number;
  sugar_g?: number;
  sugar?: number;
  sodium_mg?: number;
  sodium?: number;
  estimated_portion_g?: number;
}

interface IngredientsListProps {
  ingredients: Ingredient[];
  onEditIngredient: (ingredient: Ingredient, index: number) => void;
  onRemoveIngredient: (index: number) => void;
  onAddIngredient: () => void;
}

export const IngredientsList: React.FC<IngredientsListProps> = ({
  ingredients,
  onEditIngredient,
  onRemoveIngredient,
  onAddIngredient,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getNutritionValue = (ingredient: Ingredient, field: string): number => {
    const variations = [
      field,
      field.replace('_g', ''),
      field.replace('_mg', ''),
      field.replace('g', ''),
      field.replace('mg', ''),
    ];

    for (const variation of variations) {
      const value = ingredient[variation as keyof Ingredient];
      if (typeof value === 'number' && value > 0) {
        return Math.round(value);
      }
      if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        return Math.round(parseFloat(value));
      }
    }
    return 0;
  };

  const handleAddSingleIngredientToShopping = (ingredient: string) => {
    Alert.alert(
      t('shoppingList.addSingle.title') || 'Add to Shopping List',
      t('shoppingList.addSingle.message') || `Add "${ingredient}" to your shopping list?`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.add') || 'Add',
          onPress: async () => {
            try {
              const response = await nutritionAPI.addShoppingItem(ingredient);
              if (response.status === 200) {
                Alert.alert(
                  t('common.success') || 'Success',
                  t('shoppingList.addSingle.success') || `${ingredient} added to shopping list!`
                );
              } else {
                Alert.alert(
                  t('common.error') || 'Error',
                  t('shoppingList.addSingle.error') || 'Failed to add item to shopping list.'
                );
              }
            } catch (error) {
              console.error('Failed to add ingredient to shopping list:', error);
              Alert.alert(
                t('common.error') || 'Error',
                t('common.tryAgain') || 'An error occurred. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleAddIngredientsToShopping = async () => {
    Alert.alert(
      t('shoppingList.addAll.title') || 'Add to Shopping List',
      t('shoppingList.addAll.message') || 'Add all ingredients to your shopping list?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('shoppingList.addAll.action') || 'Add All',
          onPress: async () => {
            try {
              const itemsToAdd = ingredients
                .map((ing) => typeof ing === 'string' ? ing : ing.name)
                .filter(Boolean);

              const response = await fetch('/api/shopping_lists/add_items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToAdd }),
              });

              if (response.ok) {
                Alert.alert(
                  t('common.success') || 'Success',
                  t('shoppingList.addAll.success') || 'All ingredients added to shopping list!'
                );
              } else {
                Alert.alert(
                  t('common.error') || 'Error',
                  t('shoppingList.addAll.error') || 'Failed to add items to shopping list.'
                );
              }
            } catch (error) {
              console.error('Failed to add ingredients to shopping list:', error);
              Alert.alert(
                t('common.error') || 'Error',
                t('common.tryAgain') || 'An error occurred. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  if (ingredients.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('ingredients.title') || 'Ingredients'} ({ingredients.length})
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addAllButton, { backgroundColor: colors.emerald500 + '15' }]}
            onPress={handleAddIngredientsToShopping}
          >
            <ShoppingCart size={16} color={colors.emerald500} />
            <Text style={[styles.addAllText, { color: colors.emerald500 }]}>
              {t('ingredients.addAllToShopping') || 'Add All'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.emerald500 + '15' }]}
            onPress={onAddIngredient}
          >
            <Plus size={16} color={colors.emerald500} />
          </TouchableOpacity>
        </View>
      </View>

      {ingredients.map((ingredient, index) => (
        <View key={index} style={[styles.ingredientRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.ingredientInfo}
            onPress={() => handleAddSingleIngredientToShopping(
              typeof ingredient === 'string' ? ingredient : ingredient.name
            )}
          >
            <Text style={[styles.ingredientName, { color: colors.text }]}>
              {typeof ingredient === 'string' ? ingredient : ingredient.name}
            </Text>
            {typeof ingredient !== 'string' && (
              <Text style={[styles.ingredientNutrition, { color: colors.icon }]}>
                {getNutritionValue(ingredient, 'calories')} {t('nutrition.calories') || 'cal'} • {' '}
                {getNutritionValue(ingredient, 'protein')}g {t('nutrition.protein') || 'protein'}
              </Text>
            )}
            <Text style={[styles.ingredientHint, { color: colors.emerald500 }]}>
              {t('ingredients.tapToAdd') || 'Tap to add to shopping list'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.ingredientActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                onEditIngredient(
                  typeof ingredient === 'string'
                    ? { name: ingredient, calories: 0, protein: 0, carbs: 0, fat: 0 }
                    : ingredient,
                  index
                )
              }
            >
              <Edit3 size={16} color={colors.emerald500} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onRemoveIngredient(index)}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  ingredientNutrition: {
    fontSize: 14,
    marginBottom: 2,
  },
  ingredientHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  ingredientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});

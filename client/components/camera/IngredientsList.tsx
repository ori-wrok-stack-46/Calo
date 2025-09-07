import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Plus, Edit3, Trash2, ShoppingCart } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { nutritionAPI } from "@/src/services/api";
import { useShoppingList } from "@/hooks/useShoppingList";

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
  const { addItem, bulkAddItems, isAddingItem, isBulkAdding } =
    useShoppingList();
  const [addingToShoppingList, setAddingToShoppingList] = useState<
    string | null
  >(null);

  const getNutritionValue = (ingredient: Ingredient, field: string): number => {
    const variations = [
      field,
      field.replace("_g", ""),
      field.replace("_mg", ""),
      field.replace("g", ""),
      field.replace("mg", ""),
    ];

    for (const variation of variations) {
      const value = ingredient[variation as keyof Ingredient];
      if (typeof value === "number" && value > 0) {
        return Math.round(value);
      }
      if (typeof value === "string" && !isNaN(parseFloat(value))) {
        return Math.round(parseFloat(value));
      }
    }
    return 0;
  };

  const handleAddToShoppingList = async (
    ingredient: Ingredient,
    index: number
  ) => {
    setAddingToShoppingList(`${index}`);

    try {
      addItem({
        name: ingredient.name,
        quantity: ingredient.estimated_portion_g
          ? Math.round(ingredient.estimated_portion_g)
          : 1,
        unit: ingredient.estimated_portion_g ? "grams" : "pieces",
        category: "From Meal Analysis",
        added_from: "meal",
        is_purchased: undefined
      });

      Alert.alert("Success", `${ingredient.name} added to shopping list!`);
    } catch (error) {
      Alert.alert("Error", "Failed to add item to shopping list");
    } finally {
      setAddingToShoppingList(null);
    }
  };

  const handleAddAllToShoppingList = async () => {
    setAddingToShoppingList("all");

    try {
      const itemsToAdd = ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.estimated_portion_g
          ? Math.round(ingredient.estimated_portion_g)
          : 1,
        unit: ingredient.estimated_portion_g ? "grams" : "pieces",
        category: "From Meal Analysis",
        added_from: "meal",
      }));

      bulkAddItems(itemsToAdd);
      Alert.alert(
        "Success",
        `${ingredients.length} ingredients added to shopping list!`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add ingredients to shopping list");
    } finally {
      setAddingToShoppingList(null);
    }
  };

  if (ingredients.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("ingredients.title") || "Ingredients"} ({ingredients.length})
        </Text>
        <View style={styles.headerButtons}>
          {ingredients.length > 0 && (
            <TouchableOpacity
              style={[
                styles.shoppingListButton,
                { backgroundColor: colors.emerald500 },
                (isBulkAdding || addingToShoppingList === "all") &&
                  styles.buttonDisabled,
              ]}
              onPress={handleAddAllToShoppingList}
              disabled={isBulkAdding || addingToShoppingList === "all"}
            >
              <ShoppingCart size={16} color="#FFFFFF" />
              <Text style={styles.shoppingListButtonText}>Add All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.emerald500 }]}
            onPress={onAddIngredient}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {ingredients.map((ingredient, index) => (
        <View
          key={index}
          style={[styles.ingredientRow, { borderBottomColor: colors.border }]}
        >
          <TouchableOpacity
            style={styles.ingredientInfo}
            onPress={() => handleAddToShoppingList(ingredient, index)}
          >
            <Text style={[styles.ingredientName, { color: colors.text }]}>
              {typeof ingredient === "string" ? ingredient : ingredient.name}
            </Text>
            {typeof ingredient !== "string" && (
              <Text
                style={[styles.ingredientNutrition, { color: colors.icon }]}
              >
                {getNutritionValue(ingredient, "calories")}{" "}
                {t("nutrition.calories") || "cal"} •{" "}
                {getNutritionValue(ingredient, "protein")}g{" "}
                {t("nutrition.protein") || "protein"}
              </Text>
            )}
            <Text style={[styles.ingredientHint, { color: colors.emerald500 }]}>
              {t("ingredients.tapToAdd") || "Tap to add to shopping list"}
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.emerald500 },
                (isAddingItem || addingToShoppingList === `${index}`) &&
                  styles.buttonDisabled,
              ]}
              onPress={() => handleAddToShoppingList(ingredient, index)}
              disabled={isAddingItem || addingToShoppingList === `${index}`}
            >
              <ShoppingCart size={14} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.emerald500 },
              ]}
              onPress={() => onEditIngredient(ingredient, index)}
            >
              <Edit3 size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
              onPress={() => onRemoveIngredient(index)}
            >
              <Trash2 size={16} color="#FFFFFF" />
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  addAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addAllText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shoppingListButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shoppingListButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  ingredientNutrition: {
    fontSize: 14,
    marginBottom: 2,
  },
  ingredientHint: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});

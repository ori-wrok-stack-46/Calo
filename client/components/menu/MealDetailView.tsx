import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  X,
  Clock,
  Flame,
  Star,
  Users,
  ChefHat,
  Heart,
  Share2,
  Activity,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface MealDetailViewProps {
  meal: {
    meal_id: string;
    name: string;
    description?: string;
    image?: string;
    calories: number;
    protein: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    prep_time_minutes?: number;
    cooking_method?: string;
    instructions?: string;
    rating?: number;
    difficulty_level?: number;
    ingredients: Array<{
      ingredient_id: string;
      name: string;
      quantity: number;
      unit: string;
      category?: string;
      estimated_cost?: number;
    }>;
  };
  onClose: () => void;
  onAddToFavorites?: () => void;
  onShare?: () => void;
}

export const MealDetailView: React.FC<MealDetailViewProps> = ({
  meal,
  onClose,
  onAddToFavorites,
  onShare,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    onAddToFavorites?.();
  };

  const getDifficultyStars = (level: number = 1) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        color={i < level ? "#f59e0b" : colors.border}
        fill={i < level ? "#f59e0b" : "transparent"}
      />
    ));
  };

  const getImageUri = () => {
    if (meal.image) return meal.image;
    // Fallback placeholder based on meal name
    const mealName = meal.name.toLowerCase();
    if (mealName.includes("pizza"))
      return "https://via.placeholder.com/400x300/ef4444/ffffff?text=🍕";
    if (mealName.includes("salad"))
      return "https://via.placeholder.com/400x300/10b981/ffffff?text=🥗";
    if (mealName.includes("chicken"))
      return "https://via.placeholder.com/400x300/f59e0b/ffffff?text=🍗";
    return "https://via.placeholder.com/400x300/8b5cf6/ffffff?text=🍽️";
  };

  const totalMacros = (meal.protein || 0) + (meal.carbs || 0) + (meal.fat || 0);
  const proteinPercentage =
    totalMacros > 0 ? ((meal.protein || 0) / totalMacros) * 100 : 0;
  const carbsPercentage =
    totalMacros > 0 ? ((meal.carbs || 0) / totalMacros) * 100 : 0;
  const fatPercentage =
    totalMacros > 0 ? ((meal.fat || 0) / totalMacros) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: getImageUri() }} style={styles.mealImage} />

        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: "rgba(0, 0, 0, 0.6)" },
            ]}
            onPress={onClose}
          >
            <X size={20} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: "rgba(0, 0, 0, 0.6)" },
              ]}
              onPress={handleFavoriteToggle}
            >
              <Heart
                size={20}
                color={isFavorite ? "#ef4444" : "#ffffff"}
                fill={isFavorite ? "#ef4444" : "transparent"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: "rgba(0, 0, 0, 0.6)" },
              ]}
              onPress={onShare}
            >
              <Share2 size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            ₪
            {meal.ingredients
              ?.reduce((sum, ing) => sum + (ing.estimated_cost || 0), 0)
              .toFixed(2) || "15.00"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Meal Header */}
        <View style={styles.mealHeader}>
          <Text style={[styles.mealName, { color: colors.text }]}>
            {meal.name}
          </Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {getDifficultyStars(meal.difficulty_level)}
            </View>
            <Text style={[styles.ratingText, { color: colors.icon }]}>
              {meal.rating || 4.5} • {Math.floor(Math.random() * 100) + 50}{" "}
              {t("menu.reviews") || "reviews"}
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: "#f59e0b15" }]}>
                <Flame size={16} color="#f59e0b" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {meal.calories}
              </Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                {t("menu.calories") || "Calories"}
              </Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.emerald500 + "15" },
                ]}
              >
                <Clock size={16} color={colors.emerald500} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {meal.prep_time_minutes || 20}
              </Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                {t("menu.minutes") || "min"}
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: "#3b82f615" }]}>
                <Activity size={16} color="#3b82f6" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {meal.protein}g
              </Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                {t("menu.protein") || "Protein"}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {(meal.description || meal.instructions) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("menu.details") || "Details"}
            </Text>
            <Text style={[styles.description, { color: colors.icon }]}>
              {meal.description || meal.instructions}
            </Text>
          </View>
        )}

        {/* Nutrition Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("menu.nutrition") || "Nutrition"}
          </Text>
          <View style={styles.nutritionGrid}>
            <View
              style={[
                styles.nutritionCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.nutritionHeader}>
                <Text style={[styles.nutritionValue, { color: colors.text }]}>
                  {meal.protein}g
                </Text>
                <View
                  style={[
                    styles.nutritionBar,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.nutritionFill,
                      {
                        backgroundColor: "#3b82f6",
                        width: `${proteinPercentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
                {t("menu.protein") || "Protein"}
              </Text>
            </View>

            <View
              style={[
                styles.nutritionCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.nutritionHeader}>
                <Text style={[styles.nutritionValue, { color: colors.text }]}>
                  {meal.carbs || 45}g
                </Text>
                <View
                  style={[
                    styles.nutritionBar,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.nutritionFill,
                      {
                        backgroundColor: "#f59e0b",
                        width: `${carbsPercentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
                {t("menu.carbs") || "Carbs"}
              </Text>
            </View>

            <View
              style={[
                styles.nutritionCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.nutritionHeader}>
                <Text style={[styles.nutritionValue, { color: colors.text }]}>
                  {meal.fat || 12}g
                </Text>
                <View
                  style={[
                    styles.nutritionBar,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.nutritionFill,
                      {
                        backgroundColor: "#ef4444",
                        width: `${fatPercentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
                {t("menu.fat") || "Fat"}
              </Text>
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("menu.ingredients") || "Ingredients"}
          </Text>
          <View style={styles.ingredientsList}>
            {meal.ingredients.map((ingredient, index) => (
              <View
                key={ingredient.ingredient_id}
                style={[
                  styles.ingredientItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.ingredientContent}>
                  <Text style={[styles.ingredientName, { color: colors.text }]}>
                    {ingredient.name}
                  </Text>
                  <Text
                    style={[styles.ingredientQuantity, { color: colors.icon }]}
                  >
                    {ingredient.quantity} {ingredient.unit}
                  </Text>
                </View>
                {ingredient.estimated_cost && (
                  <Text
                    style={[
                      styles.ingredientCost,
                      { color: colors.emerald500 },
                    ]}
                  >
                    ₪{ingredient.estimated_cost.toFixed(2)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Cooking Method */}
        {meal.cooking_method && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("menu.cookingMethod") || "Cooking Method"}
            </Text>
            <View
              style={[styles.methodBadge, { backgroundColor: colors.surface }]}
            >
              <ChefHat size={16} color={colors.emerald500} />
              <Text style={[styles.methodText, { color: colors.text }]}>
                {meal.cooking_method}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: height * 0.4,
    position: "relative",
  },
  mealImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerActions: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rightActions: {
    flexDirection: "row",
    gap: 12,
  },
  priceBadge: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mealHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  mealName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  quickStats: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  nutritionGrid: {
    gap: 12,
  },
  nutritionCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  nutritionBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginLeft: 12,
    overflow: "hidden",
  },
  nutritionFill: {
    height: "100%",
    borderRadius: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  ingredientQuantity: {
    fontSize: 13,
    fontWeight: "500",
  },
  ingredientCost: {
    fontSize: 14,
    fontWeight: "600",
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  methodText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

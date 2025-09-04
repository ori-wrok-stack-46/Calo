import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  FlatList,
} from "react-native";
import {
  Coffee,
  Utensils,
  Cookie,
  Flame,
  Star,
  Plus,
  ChefHat,
  Clock,
  Heart,
  TrendingUp,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2;

interface MenuCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  gradient: string[];
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  image: string;
  calories: number;
  protein: number;
  prepTime: number;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
  rating?: number;
}

interface MenuCreatorProps {
  onCreateMenu: (
    selectedItems: MenuItem[],
    selectedDays?: any,
    menuSections?: any
  ) => void;
  onClose: () => void;
}

export const MenuCreator: React.FC<MenuCreatorProps> = ({
  onCreateMenu,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // For future enhancements: multi-day planning and sections
  const [selectedDays] = useState<string[]>([]); // Placeholder
  const [menuSections] = useState<any>({}); // Placeholder

  // Helper function to get total selected items, used for button disabled state
  const getTotalSelectedItems = () => {
    // In a more complex scenario, this would count items across days/sections
    return selectedItems.length;
  };

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  // Sample data - replace with actual data from your API
  const categories: MenuCategory[] = [
    {
      id: "breakfast",
      name: t("menu.categories.breakfast") || "Breakfast",
      icon: Coffee,
      color: "#f59e0b",
      gradient: ["#f59e0b", "#d97706"],
      items: [
        {
          id: "1",
          name: "Avocado Toast",
          description: "Whole grain bread with fresh avocado",
          image: "https://via.placeholder.com/150/10b981/ffffff?text=Avocado",
          calories: 320,
          protein: 12,
          prepTime: 5,
          category: "breakfast",
          isPopular: true,
          rating: 4.8,
        },
        {
          id: "2",
          name: "Greek Yogurt Bowl",
          description: "Creamy yogurt with berries and granola",
          image: "https://via.placeholder.com/150/3b82f6/ffffff?text=Yogurt",
          calories: 280,
          protein: 20,
          prepTime: 3,
          category: "breakfast",
          isNew: true,
          rating: 4.9,
        },
      ],
    },
    {
      id: "lunch",
      name: t("menu.categories.lunch") || "Lunch",
      icon: Utensils,
      color: "#10b981",
      gradient: ["#10b981", "#059669"],
      items: [
        {
          id: "3",
          name: "Quinoa Salad",
          description: "Fresh quinoa with vegetables",
          image: "https://via.placeholder.com/150/10b981/ffffff?text=Quinoa",
          calories: 420,
          protein: 15,
          prepTime: 15,
          category: "lunch",
          isPopular: true,
          rating: 4.7,
        },
        {
          id: "4",
          name: "Chicken Wrap",
          description: "Grilled chicken with fresh vegetables",
          image: "https://via.placeholder.com/150/ef4444/ffffff?text=Wrap",
          calories: 380,
          protein: 28,
          prepTime: 10,
          category: "lunch",
          rating: 4.6,
        },
      ],
    },
    {
      id: "snacks",
      name: t("menu.categories.snacks") || "Snacks",
      icon: Cookie,
      color: "#8b5cf6",
      gradient: ["#8b5cf6", "#7c3aed"],
      items: [
        {
          id: "5",
          name: "Mixed Nuts",
          description: "Healthy mix of almonds and walnuts",
          image: "https://via.placeholder.com/150/8b5cf6/ffffff?text=Nuts",
          calories: 180,
          protein: 6,
          prepTime: 1,
          category: "snacks",
          isPopular: true,
          rating: 4.5,
        },
        {
          id: "6",
          name: "Fruit Smoothie",
          description: "Refreshing blend of seasonal fruits",
          image: "https://via.placeholder.com/150/f97316/ffffff?text=Smoothie",
          calories: 150,
          protein: 4,
          prepTime: 5,
          category: "snacks",
          isNew: true,
          rating: 4.8,
        },
      ],
    },
  ];

  const allItems = categories.flatMap((cat) => cat.items);
  const popularItems = allItems.filter((item) => item.isPopular);
  const newItems = allItems.filter((item) => item.isNew);

  const filteredItems =
    activeCategory === "all"
      ? allItems
      : activeCategory === "popular"
      ? popularItems
      : activeCategory === "new"
      ? newItems
      : categories.find((cat) => cat.id === activeCategory)?.items || [];

  const toggleItemSelection = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.find((selected) => selected.id === item.id);
      if (isSelected) {
        return prev.filter((selected) => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const isItemSelected = (itemId: string) => {
    return selectedItems.some((item) => item.id === itemId);
  };

  const renderCategoryCard = (category: MenuCategory, index: number) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        {
          backgroundColor:
            activeCategory === category.id
              ? category.color + "20"
              : colors.surface,
          borderColor:
            activeCategory === category.id ? category.color : colors.border,
        },
      ]}
      onPress={() => setActiveCategory(category.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          activeCategory === category.id
            ? category.gradient
            : [colors.surface, colors.surface]
        }
        style={styles.categoryIconContainer}
      >
        <category.icon
          size={24}
          color={activeCategory === category.id ? "#ffffff" : category.color}
        />
      </LinearGradient>
      <Text
        style={[
          styles.categoryName,
          {
            color:
              activeCategory === category.id ? category.color : colors.text,
            fontWeight: activeCategory === category.id ? "700" : "600",
          },
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSpecialSection = (
    title: string,
    icon: any,
    items: MenuItem[],
    sectionId: string
  ) => (
    <TouchableOpacity
      style={[
        styles.specialSection,
        {
          backgroundColor:
            activeCategory === sectionId
              ? colors.emerald500 + "20"
              : colors.surface,
          borderColor:
            activeCategory === sectionId ? colors.emerald500 : colors.border,
        },
      ]}
      onPress={() => setActiveCategory(sectionId)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          activeCategory === sectionId
            ? [colors.emerald500, "#059669"]
            : [colors.surface, colors.surface]
        }
        style={styles.specialIconContainer}
      >
        {React.createElement(icon, {
          size: 20,
          color: activeCategory === sectionId ? "#ffffff" : colors.emerald500,
        })}
      </LinearGradient>
      <Text
        style={[
          styles.specialTitle,
          {
            color:
              activeCategory === sectionId ? colors.emerald500 : colors.text,
            fontWeight: activeCategory === sectionId ? "700" : "600",
          },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.specialCount, { color: colors.icon }]}>
        {items.length} {t("menu.items") || "items"}
      </Text>
    </TouchableOpacity>
  );

  const renderMenuItem = ({
    item,
    index,
  }: {
    item: MenuItem;
    index: number;
  }) => {
    const isSelected = isItemSelected(item.id);

    return (
      <Animated.View
        style={[
          styles.menuItem,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.emerald500 : colors.border,
            borderWidth: isSelected ? 2 : 1,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => toggleItemSelection(item)}
          activeOpacity={0.8}
          style={styles.menuItemContent}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />

            {/* Badges */}
            <View style={styles.badgeContainer}>
              {item.isPopular && (
                <View style={[styles.badge, { backgroundColor: "#f59e0b" }]}>
                  <Star size={10} color="#ffffff" />
                </View>
              )}
              {item.isNew && (
                <View
                  style={[styles.badge, { backgroundColor: colors.emerald500 }]}
                >
                  <TrendingUp size={10} color="#ffffff" />
                </View>
              )}
            </View>

            {/* Selection indicator */}
            {isSelected && (
              <View style={styles.selectionOverlay}>
                <View
                  style={[
                    styles.selectionIndicator,
                    { backgroundColor: colors.emerald500 },
                  ]}
                >
                  <Plus
                    size={16}
                    color="#ffffff"
                    style={{ transform: [{ rotate: "45deg" }] }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.itemContent}>
            <Text
              style={[styles.itemName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.itemDescription, { color: colors.icon }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>

            {/* Stats */}
            <View style={styles.itemStats}>
              <View style={styles.statItem}>
                <Flame size={12} color="#f59e0b" />
                <Text style={[styles.statText, { color: colors.icon }]}>
                  {item.calories}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Clock size={12} color={colors.emerald500} />
                <Text style={[styles.statText, { color: colors.icon }]}>
                  {item.prepTime}m
                </Text>
              </View>
              {item.rating && (
                <View style={styles.statItem}>
                  <Star size={12} color="#f59e0b" />
                  <Text style={[styles.statText, { color: colors.icon }]}>
                    {item.rating}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Plus
              size={24}
              color={colors.icon}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("menu.createMenu") || "Create Menu"}
          </Text>
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor:
                  getTotalSelectedItems() > 0
                    ? colors.emerald500
                    : colors.border,
                opacity: getTotalSelectedItems() > 0 ? 1 : 0.5,
              },
            ]}
            onPress={() =>
              onCreateMenu(selectedItems, selectedDays, menuSections)
            }
            disabled={getTotalSelectedItems() === 0}
          >
            <ChefHat size={16} color="#ffffff" />
            <Text style={styles.createButtonText}>
              {t("menu.create") || "Create"} ({getTotalSelectedItems()})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("menu.categories.title") || "Categories"}
          </Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) =>
              renderCategoryCard(category, index)
            )}
          </View>
        </View>

        {/* Special Sections */}
        <View style={styles.section}>
          <View style={styles.specialSections}>
            {renderSpecialSection(
              t("menu.popular") || "Popular",
              Star,
              popularItems,
              "popular"
            )}
            {renderSpecialSection(
              t("menu.whatsNew") || "What's New?",
              TrendingUp,
              newItems,
              "new"
            )}
          </View>
        </View>

        {/* Items Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {activeCategory === "all"
              ? t("menu.allItems") || "All Items"
              : activeCategory === "popular"
              ? t("menu.popular") || "Popular"
              : activeCategory === "new"
              ? t("menu.whatsNew") || "What's New?"
              : categories.find((cat) => cat.id === activeCategory)?.name ||
                "Items"}
          </Text>
          <FlatList
            data={filteredItems}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.itemsGrid}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  specialSections: {
    flexDirection: "row",
    gap: 12,
  },
  specialSection: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  specialTitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  specialCount: {
    fontSize: 12,
    textAlign: "center",
  },
  itemsGrid: {
    gap: 12,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  menuItem: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemContent: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    height: 120,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badgeContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(16, 185, 129, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  itemDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  itemStats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: "500",
  },
});

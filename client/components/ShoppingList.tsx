import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  X,
  Edit3,
  Save,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { api, nutritionAPI } from "@/src/services/api";
import { useShoppingList } from "@/hooks/useShoppingList"; // Assuming this hook exists

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  is_purchased: boolean;
  added_from?: string; // 'menu', 'scanner', 'manual'
  estimated_cost?: number; // Added for price integration
}

interface ShoppingListProps {
  visible: boolean;
  onClose: () => void;
  initialItems?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
  }>;
}

export default function ShoppingList({
  visible,
  onClose,
  initialItems = [],
}: ShoppingListProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Ensure modal can be closed properly
  const handleModalClose = useCallback(() => {
    console.log("ShoppingList modal closing");
    onClose();
  }, [onClose]);

  const {
    shoppingList,
    isLoading,
    addItem,
    bulkAddItems,
    updateItem,
    deleteItem,
    togglePurchased,
    forceRefresh,
    isAddingItem,
    isBulkAdding,
    isUpdating,
    isDeleting,
    isToggling,
  } = useShoppingList();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "pieces",
    category: "Manual",
    estimated_cost: 0, // Initialize estimated_cost
  });
  const [refreshing, setRefreshing] = useState(false);

  // Add initial items when component mounts (for meal ingredients)
  useEffect(() => {
    if (visible && initialItems.length > 0) {
      const itemsToAdd = initialItems.map((item) => ({
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || "pieces",
        category: item.category || "From Meal",
        added_from: "meal",
        estimated_cost: 0, // Initialize estimated_cost for initial items
      }));

      if (itemsToAdd.length === 1) {
        addItem(itemsToAdd[0]);
      } else {
        bulkAddItems(itemsToAdd);
      }
    }
  }, [visible, initialItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await forceRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    addItem({
      ...newItem,
      name: newItem.name.trim(),
      added_from: "manual",
      is_purchased: undefined,
    });

    setNewItem({
      name: "",
      quantity: 1,
      unit: "pieces",
      category: "Manual",
      estimated_cost: 0, // Reset estimated_cost
    });
    setShowAddModal(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !editingItem.name.trim()) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    updateItem({
      id: editingItem.id,
      name: editingItem.name.trim(),
      quantity: editingItem.quantity,
      unit: editingItem.unit,
      category: editingItem.category,
      estimated_cost: editingItem.estimated_cost || 0, // Ensure estimated_cost is passed
    });

    setEditingItem(null);
  };

  const handleTogglePurchased = (id: string) => {
    togglePurchased(id);
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteItem(id),
      },
    ]);
  };

  const renderItem = (item: ShoppingListItem) => (
    <View
      key={item.id}
      style={[
        styles.listItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: item.is_purchased ? 0.6 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: item.is_purchased ? colors.emerald500 : colors.border,
            backgroundColor: item.is_purchased
              ? colors.emerald500
              : "transparent",
          },
        ]}
        onPress={() => handleTogglePurchased(item.id)}
      >
        {item.is_purchased && <Check size={16} color="#ffffff" />}
      </TouchableOpacity>

      <View style={styles.itemContent}>
        {editingItem?.id === item.id ? (
          <View style={styles.editForm}>
            <TextInput
              style={[
                styles.editInput,
                { color: colors.text, borderColor: colors.border },
              ]}
              value={editingItem.name}
              onChangeText={(text) =>
                setEditingItem({ ...editingItem, name: text })
              }
              placeholder="Item name"
              placeholderTextColor={colors.icon}
            />
            <View style={styles.quantityRow}>
              <TextInput
                style={[
                  styles.quantityInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                value={String(editingItem.quantity)}
                onChangeText={(text) =>
                  setEditingItem({
                    ...editingItem,
                    quantity: parseFloat(text) || 1,
                  })
                }
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={colors.icon}
              />
              <TextInput
                style={[
                  styles.unitInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                value={editingItem.unit}
                onChangeText={(text) =>
                  setEditingItem({ ...editingItem, unit: text })
                }
                placeholder="unit"
                placeholderTextColor={colors.icon}
              />
            </View>
            <TextInput
              style={[
                styles.editInput,
                { color: colors.text, borderColor: colors.border },
              ]}
              value={String(editingItem.estimated_cost)}
              onChangeText={(text) =>
                setEditingItem({
                  ...editingItem,
                  estimated_cost: parseFloat(text) || 0,
                })
              }
              keyboardType="numeric"
              placeholder="Estimated Cost"
              placeholderTextColor={colors.icon}
            />
          </View>
        ) : (
          <View>
            <Text
              style={[
                styles.itemName,
                {
                  color: colors.text,
                  textDecorationLine: item.is_purchased
                    ? "line-through"
                    : "none",
                },
              ]}
            >
              {item.name}
            </Text>
            <Text style={[styles.itemDetails, { color: colors.icon }]}>
              {item.quantity} {item.unit}
              {item.category && ` • ${item.category}`}
              {item.added_from && ` • from ${item.added_from}`}
              {item.estimated_cost !== undefined &&
                item.estimated_cost > 0 &&
                ` • $${item.estimated_cost.toFixed(2)}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        {editingItem?.id === item.id ? (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.emerald500 },
              ]}
              onPress={handleUpdateItem}
            >
              <Save size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => setEditingItem(null)}
            >
              <X size={16} color={colors.text} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => setEditingItem(item)}
            >
              <Edit3 size={16} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
              onPress={() => handleDeleteItem(item.id)}
            >
              <Trash2 size={16} color="#ffffff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const handleClearPurchased = () => {
    Alert.alert(
      "Clear Purchased",
      "Remove all purchased items from the list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            const purchasedIds = shoppingList
              .filter((item: { is_purchased: any }) => item.is_purchased)
              .map((item: { id: any }) => item.id);
            purchasedIds.forEach((id: any) => deleteItem(id));
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleModalClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <ShoppingCart size={24} color={colors.emerald500} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Shopping List (
                {
                  shoppingList.filter(
                    (item: { is_purchased: any }) => !item.is_purchased
                  ).length
                }{" "}
                items)
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleModalClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <X size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.emerald500]}
                tintColor={colors.emerald500}
              />
            }
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.emerald500} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Loading shopping list...
                </Text>
              </View>
            ) : shoppingList.length === 0 ? (
              <View style={styles.emptyState}>
                <ShoppingCart size={64} color={colors.icon} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Your shopping list is empty
                </Text>
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  Add ingredients from menus or manually
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {shoppingList.map(renderItem)}
              </View>
            )}

            {/* Add Item Form */}
            {showAddModal && (
              <View
                style={[
                  styles.addForm,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.addFormTitle, { color: colors.text }]}>
                  Add New Item
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  value={newItem.name}
                  onChangeText={(text) =>
                    setNewItem({ ...newItem, name: text })
                  }
                  placeholder="Item name"
                  placeholderTextColor={colors.icon}
                />
                <View style={styles.quantityRow}>
                  <TextInput
                    style={[
                      styles.quantityInput,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={String(newItem.quantity)}
                    onChangeText={(text) =>
                      setNewItem({
                        ...newItem,
                        quantity: parseFloat(text) || 1,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={colors.icon}
                  />
                  <TextInput
                    style={[
                      styles.unitInput,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={newItem.unit}
                    onChangeText={(text) =>
                      setNewItem({ ...newItem, unit: text })
                    }
                    placeholder="pieces"
                    placeholderTextColor={colors.icon}
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  value={String(newItem.estimated_cost)}
                  onChangeText={(text) =>
                    setNewItem({
                      ...newItem,
                      estimated_cost: parseFloat(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="Estimated Cost"
                  placeholderTextColor={colors.icon}
                />
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[
                      styles.formButton,
                      { backgroundColor: colors.emerald500 },
                    ]}
                    onPress={handleAddItem}
                    disabled={isAddingItem}
                  >
                    {isAddingItem ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Plus size={16} color="#ffffff" />
                    )}
                    <Text style={styles.formButtonText}>Add Item</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.formButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => setShowAddModal(false)}
                  >
                    <Text
                      style={[styles.formButtonText, { color: colors.text }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: colors.surface }]}
              onPress={() => setShowAddModal(!showAddModal)}
            >
              <Plus size={20} color={colors.text} />
              <Text style={[styles.footerButtonText, { color: colors.text }]}>
                Add Item
              </Text>
            </TouchableOpacity>

            {shoppingList.some(
              (item: { is_purchased: any }) => item.is_purchased
            ) && (
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: "#ef4444" }]}
                onPress={handleClearPurchased}
              >
                <Trash2 size={20} color="#ffffff" />
                <Text style={[styles.footerButtonText, { color: "#ffffff" }]}>
                  Clear Purchased
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  itemsList: {
    gap: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  editForm: {
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  quantityRow: {
    flexDirection: "row",
    gap: 8,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  unitInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addForm: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    gap: 12,
  },
  addFormTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  formButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

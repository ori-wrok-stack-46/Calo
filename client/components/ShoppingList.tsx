import React, { useState, useEffect } from "react";
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

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  is_purchased: boolean;
  added_from?: string; // 'menu', 'scanner', 'manual'
}

interface ShoppingListProps {
  visible: boolean;
  onClose: () => void;
  initialItems?: Partial<ShoppingListItem>[];
}

export default function ShoppingList({
  visible,
  onClose,
  initialItems = [],
}: ShoppingListProps) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name: "",
    quantity: "",
    unit: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "1",
    unit: "pieces",
  });

  useEffect(() => {
    if (visible) {
      loadShoppingList();
      if (initialItems.length > 0) {
        addItemsToList(initialItems);
      }
    }
  }, [visible]);

  const loadShoppingList = async () => {
    try {
      setLoading(true);
      console.log("📦 Loading shopping list...");
      const response = await api.get("/shopping-lists");
      console.log("📦 Shopping list response:", response.data);
      if (response.data.success) {
        setItems(response.data.data || []);
        console.log(
          "✅ Shopping list loaded successfully:",
          response.data.data?.length || 0,
          "items"
        );
      } else {
        console.error("❌ Shopping list API returned success: false");
        Alert.alert(
          "Error",
          response.data.error || "Failed to load shopping list"
        );
      }
    } catch (error) {
      console.error("❌ Failed to load shopping list:", error);
      Alert.alert("Error", "Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  };

  const addItemsToList = async (itemsToAdd: Partial<ShoppingListItem>[]) => {
    try {
      console.log("📦 Adding bulk items to shopping list:", itemsToAdd);
      const response = await api.post("/shopping-lists/bulk-add", {
        items: itemsToAdd.map((item) => ({
          name: item.name || "",
          quantity: item.quantity || 1,
          unit: item.unit || "pieces",
          category: item.category || "Other",
          added_from: item.added_from || "manual",
        })),
      });

      console.log("📦 Bulk add response:", response.data);
      if (response.data.success) {
        // Reload only for bulk add since it's more complex
        await loadShoppingList();
        Alert.alert(
          "Success",
          `${itemsToAdd.length} items added to shopping list!`
        );
      } else {
        console.error("❌ Bulk add failed:", response.data.error);
        Alert.alert(
          "Error",
          response.data.error || "Failed to add items to shopping list"
        );
      }
    } catch (error) {
      console.error("❌ Failed to add items:", error);
      Alert.alert("Error", "Failed to add items to shopping list");
    }
  };

  const addNewItem = async () => {
    if (!newItem.name.trim()) {
      Alert.alert("Error", "Please enter item name");
      return;
    }

    try {
      console.log("📦 Adding new item:", newItem);
      const response = await api.post("/shopping-lists", {
        name: newItem.name.trim(),
        quantity: parseFloat(newItem.quantity) || 1,
        unit: newItem.unit,
        category: "Manual",
        added_from: "manual",
      });

      if (response.data.success) {
        // Add the new item directly to state instead of reloading
        setItems((prevItems) => [...prevItems, response.data.data]);
        setNewItem({ name: "", quantity: "1", unit: "pieces" });
        setShowAddForm(false);
        console.log("✅ Item added successfully");
      } else {
        console.error("❌ Add item failed:", response.data.error);
        Alert.alert("Error", response.data.error || "Failed to add item");
      }
    } catch (error) {
      console.error("❌ Failed to add item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  const togglePurchased = async (itemId: string) => {
    try {
      console.log("📦 Toggling item:", itemId);
      const response = await api.put(`/shopping-lists/${itemId}/toggle`);
      console.log("📦 Toggle response:", response.data);
      if (response.data.success) {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId
              ? { ...item, is_purchased: !item.is_purchased }
              : item
          )
        );
        console.log("✅ Item toggled successfully");
      } else {
        console.error("❌ Toggle failed:", response.data.error);
        Alert.alert("Error", response.data.error || "Failed to update item");
      }
    } catch (error) {
      console.error("❌ Failed to toggle item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("📦 Deleting item:", itemId);
            const response = await api.delete(`/shopping-lists/${itemId}`);
            console.log("📦 Delete response:", response.data);
            if (response.data.success) {
              setItems((prevItems) =>
                prevItems.filter((item) => item.id !== itemId)
              );
              console.log("✅ Item deleted successfully");
            } else {
              console.error("❌ Delete failed:", response.data.error);
              Alert.alert(
                "Error",
                response.data.error || "Failed to delete item"
              );
            }
          } catch (error) {
            console.error("❌ Failed to delete item:", error);
            Alert.alert("Error", "Failed to delete item");
          }
        },
      },
    ]);
  };

  const startEditing = (item: ShoppingListItem) => {
    setEditingItem(item.id);
    setEditValues({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
    });
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    try {
      console.log("📦 Updating item:", editingItem, editValues);
      const response = await api.put(`/shopping-lists/${editingItem}`, {
        name: editValues.name.trim(),
        quantity: parseFloat(editValues.quantity) || 1,
        unit: editValues.unit,
      });

      console.log("📦 Update response:", response.data);
      if (response.data.success) {
        // Update the item directly in state instead of reloading
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === editingItem ? { ...item, ...response.data.data } : item
          )
        );
        setEditingItem(null);
        console.log("✅ Item updated successfully");
      } else {
        console.error("❌ Update failed:", response.data.error);
        Alert.alert("Error", response.data.error || "Failed to update item");
      }
    } catch (error) {
      console.error("❌ Failed to update item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const clearPurchased = async () => {
    Alert.alert(
      "Clear Purchased",
      "Remove all purchased items from the list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            try {
              console.log("📦 Clearing purchased items");
              const response = await api.delete("/shopping-lists/purchased");
              console.log("📦 Clear response:", response.data);
              if (response.data.success) {
                // Remove purchased items from local state instead of reloading
                setItems((prevItems) =>
                  prevItems.filter((item) => !item.is_purchased)
                );
                console.log("✅ Purchased items cleared successfully");
              } else {
                console.error("❌ Clear failed:", response.data.error);
                Alert.alert(
                  "Error",
                  response.data.error || "Failed to clear purchased items"
                );
              }
            } catch (error) {
              console.error("❌ Failed to clear purchased items:", error);
              Alert.alert("Error", "Failed to clear purchased items");
            }
          },
        },
      ]
    );
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
        onPress={() => togglePurchased(item.id)}
      >
        {item.is_purchased && <Check size={16} color="#ffffff" />}
      </TouchableOpacity>

      <View style={styles.itemContent}>
        {editingItem === item.id ? (
          <View style={styles.editForm}>
            <TextInput
              style={[
                styles.editInput,
                { color: colors.text, borderColor: colors.border },
              ]}
              value={editValues.name}
              onChangeText={(text) =>
                setEditValues({ ...editValues, name: text })
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
                value={editValues.quantity}
                onChangeText={(text) =>
                  setEditValues({ ...editValues, quantity: text })
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
                value={editValues.unit}
                onChangeText={(text) =>
                  setEditValues({ ...editValues, unit: text })
                }
                placeholder="unit"
                placeholderTextColor={colors.icon}
              />
            </View>
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
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        {editingItem === item.id ? (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.emerald500 },
              ]}
              onPress={saveEdit}
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
              onPress={() => startEditing(item)}
            >
              <Edit3 size={16} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
              onPress={() => deleteItem(item.id)}
            >
              <Trash2 size={16} color="#ffffff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
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
                {items.filter((item) => !item.is_purchased).length} items)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.emerald500} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Loading shopping list...
                </Text>
              </View>
            ) : items.length === 0 ? (
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
              <View style={styles.itemsList}>{items.map(renderItem)}</View>
            )}

            {/* Add Item Form */}
            {showAddForm && (
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
                    value={newItem.quantity}
                    onChangeText={(text) =>
                      setNewItem({ ...newItem, quantity: text })
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
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[
                      styles.formButton,
                      { backgroundColor: colors.emerald500 },
                    ]}
                    onPress={addNewItem}
                  >
                    <Plus size={16} color="#ffffff" />
                    <Text style={styles.formButtonText}>Add Item</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.formButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => setShowAddForm(false)}
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
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={20} color={colors.text} />
              <Text style={[styles.footerButtonText, { color: colors.text }]}>
                Add Item
              </Text>
            </TouchableOpacity>

            {items.some((item) => item.is_purchased) && (
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: "#ef4444" }]}
                onPress={clearPurchased}
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

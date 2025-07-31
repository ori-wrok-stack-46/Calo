import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Plus, X } from "lucide-react-native";
import ModernTextInput from "./ModernTextInput";
import { COLORS } from "./PreferencesStep";

interface DynamicListInputProps {
  label: string;
  placeholder: string;
  initialItems: string[];
  onItemsChange: (items: string[]) => void;
  maxItems?: number;
}

export default function DynamicListInput({
  label,
  placeholder,
  initialItems,
  onItemsChange,
  maxItems = 10,
}: DynamicListInputProps) {
  const [items, setItems] = useState<string[]>(initialItems || []);
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;

    if (items.length >= maxItems) {
      Alert.alert("הגבלה", `ניתן להוסיף עד ${maxItems} פריטים`);
      return;
    }

    const updatedItems = [...items, newItem.trim()];
    setItems(updatedItems);
    onItemsChange(updatedItems);
    setNewItem("");
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onItemsChange(updatedItems);
  };

  return (
    <View style={dynamicListStyles.container}>
      <Text style={dynamicListStyles.label}>{label}</Text>

      <View style={dynamicListStyles.inputRow}>
        <ModernTextInput
          label=""
          value={newItem}
          onChangeText={setNewItem}
          placeholder={placeholder}
          style={dynamicListStyles.input}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[
            dynamicListStyles.addButton,
            !newItem.trim() && dynamicListStyles.addButtonDisabled,
          ]}
          onPress={addItem}
          disabled={!newItem.trim()}
        >
          <Plus size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {items.length > 0 && (
        <View style={dynamicListStyles.itemsList}>
          {items.map((item, index) => (
            <View key={index} style={dynamicListStyles.item}>
              <Text style={dynamicListStyles.itemText}>{item}</Text>
              <TouchableOpacity
                style={dynamicListStyles.removeButton}
                onPress={() => removeItem(index)}
              >
                <X size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={dynamicListStyles.counter}>
        {items.length}/{maxItems} פריטים
      </Text>
    </View>
  );
}

const dynamicListStyles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[800],
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.emerald[500],
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.emerald[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0.1,
  },
  itemsList: {
    marginTop: 16,
    gap: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.emerald[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.emerald[200],
  },
  itemText: {
    fontSize: 14,
    color: COLORS.gray[800],
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  counter: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: "right",
    marginTop: 8,
  },
});

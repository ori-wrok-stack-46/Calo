import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { COLORS } from "./PreferencesStep";

interface Option {
  key: string;
  label: string;
  color?: string;
}

interface OptionGroupProps {
  label: string;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
  required?: boolean;
  multiSelect?: boolean;
  selectedValues?: string[];
}

export default function OptionGroup({
  label,
  options,
  selectedValue,
  onSelect,
  required = false,
  multiSelect = false,
  selectedValues = [],
}: OptionGroupProps) {
  const handleSelect = (value: string) => {
    if (multiSelect) {
      // Handle multi-select logic if needed
      return;
    }
    onSelect(value);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && " *"}
      </Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = multiSelect
            ? selectedValues.includes(option.key)
            : selectedValue === option.key;

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                isSelected &&
                  option.color && {
                    borderColor: option.color,
                    backgroundColor: option.color + "10",
                  },
              ]}
              onPress={() => handleSelect(option.key)}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                  isSelected && option.color && { color: option.color },
                ]}
              >
                {option.label}
              </Text>

              {isSelected && (
                <View
                  style={[
                    styles.checkContainer,
                    option.color && { backgroundColor: option.color },
                  ]}
                >
                  <Check size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.emerald[700],
    backgroundColor: "white",
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionSelected: {
    borderColor: COLORS.emerald[700],
    backgroundColor: "#f8faff",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.emerald[700],
    fontWeight: "600",
  },
  checkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.emerald[700],
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

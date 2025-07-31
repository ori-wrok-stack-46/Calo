import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { COLORS } from "./PreferencesStep";

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  required?: boolean;
}

export default function CheckboxGroup({
  label,
  options,
  selectedValues,
  onSelectionChange,
  required = false,
}: CheckboxGroupProps) {
  const toggleSelection = (option: string) => {
    const newSelection = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option];

    onSelectionChange(newSelection);
  };

  return (
    <View style={checkboxStyles.container}>
      <Text style={checkboxStyles.label}>
        {label}
        {required && " *"}
      </Text>

      <View style={checkboxStyles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option);

          return (
            <TouchableOpacity
              key={option}
              style={checkboxStyles.option}
              onPress={() => toggleSelection(option)}
            >
              <View
                style={[
                  checkboxStyles.checkbox,
                  isSelected && checkboxStyles.checkboxSelected,
                ]}
              >
                {isSelected && <Check size={16} color={COLORS.white} />}
              </View>
              <Text
                style={[
                  checkboxStyles.optionText,
                  isSelected && checkboxStyles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const checkboxStyles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[800],
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.emerald[200],
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  checkboxSelected: {
    backgroundColor: COLORS.emerald[500],
    borderColor: COLORS.emerald[500],
  },
  optionText: {
    fontSize: 14,
    color: COLORS.gray[600],
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.gray[800],
    fontWeight: "500",
  },
});

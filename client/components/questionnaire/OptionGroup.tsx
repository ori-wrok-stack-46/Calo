import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import OptionCard from "./OptionCard";

interface OptionGroupProps {
  label: string;
  options: {
    key: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
  }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  required?: boolean;
  multiSelect?: boolean;
  selectedValues?: string[];
}

const OptionGroup: React.FC<OptionGroupProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  required = false,
  multiSelect = false,
  selectedValues = [],
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  return (
    <View style={styles.container}>
      <Text
        style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}
      >
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = multiSelect
            ? selectedValues.includes(option.key)
            : selectedValue === option.key;

          return (
            <OptionCard
              key={option.key}
              label={option.label}
              description={option.description}
              icon={option.icon}
              isSelected={isSelected}
              onPress={() => onSelect(option.key)}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 8,
  },
  textRTL: {
    textAlign: "right",
  },
});

export default OptionGroup;

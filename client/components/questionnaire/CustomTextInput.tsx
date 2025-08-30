import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface CustomTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  required?: boolean;
  multiline?: boolean;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  required = false,
  multiline = false,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";

  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(colors.border);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: borderColor.value,
      transform: [{ scale: scale.value }],
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(colors.primary);
    scale.value = withTiming(1.02);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(colors.border);
    scale.value = withTiming(1);
  };

  return (
    <View style={styles.container}>
      <Text
        style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}
      >
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>

      <Animated.View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
          },
          animatedStyle,
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            {
              color: colors.text,
              textAlign: isRTL ? "right" : "left",
            },
            multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    padding: 18,
    fontSize: 16,
    fontWeight: "500",
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  textRTL: {
    textAlign: "right",
  },
});

export default CustomTextInput;

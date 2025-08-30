import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Plus, X } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface DynamicListInputProps {
  label: string;
  placeholder: string;
  items: string[];
  onItemsChange: (items: string[]) => void;
  maxItems?: number;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const DynamicListInput: React.FC<DynamicListInputProps> = ({
  label,
  placeholder,
  items,
  onItemsChange,
  maxItems = 10,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const addItem = () => {
    if (inputValue.trim() && items.length < maxItems) {
      onItemsChange([...items, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const canAdd = inputValue.trim() && items.length < maxItems;

  return (
    <View style={styles.container}>
      <Text
        style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}
      >
        {label}
      </Text>

      <View style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.card,
              borderColor: isFocused ? colors.primary : colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: canAdd ? colors.primary : colors.border,
            },
          ]}
          onPress={addItem}
          disabled={!canAdd}
          activeOpacity={0.8}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {items.map((item, index) => (
          <Animated.View
            key={`${item}-${index}`}
            entering={FadeIn.springify()}
            exiting={FadeOut.springify()}
          >
            <View
              style={[
                styles.itemCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
                isRTL && styles.itemCardRTL,
              ]}
            >
              <Text
                style={[
                  styles.itemText,
                  { color: colors.text },
                  isRTL && styles.textRTL,
                ]}
              >
                {item}
              </Text>
              <TouchableOpacity
                style={[
                  styles.removeButton,
                  { backgroundColor: colors.error + "15" },
                ]}
                onPress={() => removeItem(index)}
                activeOpacity={0.7}
              >
                <X size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
      </View>

      {items.length >= maxItems && (
        <Text style={[styles.maxItemsText, { color: colors.textSecondary }]}>
          Maximum {maxItems} items allowed
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  inputContainerRTL: {
    flexDirection: "row-reverse",
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardRTL: {
    flexDirection: "row-reverse",
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  maxItemsText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  textRTL: {
    textAlign: "right",
  },
});

export default DynamicListInput;

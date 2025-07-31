import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "./PreferencesStep";

interface ModernTextInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
  error?: string;
}

export default function ModernTextInput({
  label,
  required = false,
  style,
  error,
  value,
  ...props
}: ModernTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  const borderColor = useSharedValue(COLORS.emerald[300]);
  const labelScale = useSharedValue(hasValue || isFocused ? 0.85 : 1);
  const labelY = useSharedValue(hasValue || isFocused ? -10 : 8);

  React.useEffect(() => {
    setHasValue(!!value);
    labelScale.value = withTiming(!!value || isFocused ? 0.85 : 1, {
      duration: 200,
    });
    labelY.value = withTiming(!!value || isFocused ? -10 : 8, {
      duration: 200,
    });
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(COLORS.emerald[300], { duration: 200 });
    labelScale.value = withTiming(0.85, { duration: 200 });
    labelY.value = withTiming(-10, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(error ? "#ef4444" : COLORS.emerald[300], {
      duration: 200,
    });
    if (!hasValue) {
      labelScale.value = withTiming(1, { duration: 200 });
      labelY.value = withTiming(8, { duration: 200 });
    }
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: labelScale.value }, { translateY: labelY.value }],
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Animated.View style={[styles.input, animatedBorderStyle]}>
          <TextInput
            style={styles.textInput}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={(text) => {
              setHasValue(!!text);
              props.onChangeText?.(text);
            }}
            {...props}
          />
          <Animated.Text
            style={[
              styles.label,
              animatedLabelStyle,
              {
                color: isFocused
                  ? COLORS.emerald[300]
                  : error
                  ? "#ef4444"
                  : "#64748b",
              },
            ]}
          >
            {label}
            {required && " *"}
          </Animated.Text>
        </Animated.View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    fontSize: 16,
    color: COLORS.emerald[800],
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 24,
    minHeight: 56,
  },
  label: {
    position: "absolute",
    left: 16,
    top: 16,
    fontSize: 16,
    fontWeight: "500",
    backgroundColor: "white",
    paddingHorizontal: 4,
    transformOrigin: "left center",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginTop: 4,
    marginLeft: 16,
  },
});

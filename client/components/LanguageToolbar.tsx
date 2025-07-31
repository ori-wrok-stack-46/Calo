import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../src/i18n/context/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HelpContent {
  title: string;
  description: string;
}

interface LanguageToolbarProps {
  helpContent?: HelpContent;
}

const LanguageToolbar: React.FC<LanguageToolbarProps> = ({ helpContent }) => {
  const { language, changeLanguage, isRTL } = useLanguage();
  const [showHelp, setShowHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandAnimation] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const handleLanguageToggle = () => {
    const newLanguage = language === "he" ? "en" : "he";
    changeLanguage(newLanguage);
  };

  const handleHelpPress = () => {
    setShowHelp(true);
  };

  const handleCloseHelp = () => {
    setShowHelp(false);
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.spring(expandAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const expandedWidth = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, helpContent ? 140 : 100],
  });

  const translateX = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [isRTL ? -20 : 20, 0],
  });

  const gearRotation = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const buttonOpacity = expandAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const buttonScale = expandAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.7, 0.7, 1],
  });

  return (
    <>
      <View
        style={[
          styles.container,
          {
            top: insets.top + 50,
            [isRTL ? "left" : "right"]: 0,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.toolbar,
            isRTL && styles.toolbarRTL,
            {
              width: expandedWidth,
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.gearButton}
            onPress={toggleExpanded}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ rotate: gearRotation }] }}>
              <Ionicons name="settings-outline" size={18} color="#333" />
            </Animated.View>
          </TouchableOpacity>

          <View
            style={[styles.expandedButtons, isRTL && styles.expandedButtonsRTL]}
          >
            <Animated.View
              style={{
                opacity: buttonOpacity,
                transform: [{ scale: buttonScale }],
                marginHorizontal: 4,
              }}
            >
              <TouchableOpacity
                style={styles.languageButton}
                onPress={handleLanguageToggle}
                accessibilityLabel="Change Language"
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <Text style={styles.languageText}>
                  {language === "he" ? "EN" : "עב"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {helpContent && (
              <Animated.View
                style={{
                  opacity: buttonOpacity,
                  transform: [{ scale: buttonScale }],
                  marginHorizontal: 4,
                }}
              >
                <TouchableOpacity
                  style={styles.helpButton}
                  onPress={handleHelpPress}
                  accessibilityLabel="Help"
                  accessibilityRole="button"
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle-outline" size={16} color="#333" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={showHelp && !!helpContent}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseHelp}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {helpContent?.title || "Help"}
              </Text>
              <TouchableOpacity
                onPress={handleCloseHelp}
                style={styles.closeButton}
                accessibilityLabel="Close"
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                {helpContent?.description || "No help content available."}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
    elevation: 10,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    height: 40,
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  toolbarRTL: {
    flexDirection: "row-reverse",
  },
  gearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  expandedButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  expandedButtonsRTL: {
    flexDirection: "row-reverse",
    marginLeft: 0,
    marginRight: 8,
  },
  languageButton: {
    backgroundColor: "#333",
    width: 32,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  languageText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  helpButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    borderWidth: 0.5,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
  },
});

export default LanguageToolbar;

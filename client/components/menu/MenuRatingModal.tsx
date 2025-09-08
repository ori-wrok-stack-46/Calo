import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import {
  Star,
  X,
  Award,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react-native";

interface MenuRatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: MenuRating) => void;
  menuName: string;
  isSubmitting?: boolean;
}

interface MenuRating {
  rating: number;
  liked: string;
  disliked: string;
  suggestions: string;
  wouldRecommend: boolean;
}

export const MenuRatingModal: React.FC<MenuRatingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  menuName,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he" ? "אנא דרג את התפריט" : "Please rate the menu"
      );
      return;
    }

    onSubmit({
      rating,
      liked,
      disliked,
      suggestions,
      wouldRecommend,
    });
  };

  const resetForm = () => {
    setRating(0);
    setLiked("");
    setDisliked("");
    setSuggestions("");
    setWouldRecommend(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStarRating = (
    currentRating: number,
    onPress: (rating: number) => void
  ) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
          >
            <Star
              size={32}
              color={star <= currentRating ? "#fbbf24" : colors.border}
              fill={star <= currentRating ? "#fbbf24" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalTitle,
                { color: colors.text },
                isRTL && styles.rtlText,
              ]}
            >
              {language === "he" ? "דירוג התפריט" : "Rate Menu"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                styles.menuName,
                { color: colors.text },
                isRTL && styles.rtlText,
              ]}
            >
              {menuName}
            </Text>

            {/* Overall Rating */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                  isRTL && styles.rtlText,
                ]}
              >
                {language === "he" ? "דירוג כללי" : "Overall Rating"} *
              </Text>
              {renderStarRating(rating, setRating)}
            </View>

            {/* What did you like */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
                <ThumbsUp size={18} color={colors.emerald500} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text },
                    isRTL && styles.rtlText,
                  ]}
                >
                  {language === "he" ? "מה אהבת?" : "What did you like?"}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  isRTL && styles.rtlTextInput,
                ]}
                placeholder={
                  language === "he"
                    ? "תאר מה אהבת בתפריט..."
                    : "Describe what you liked about the menu..."
                }
                placeholderTextColor={colors.icon}
                value={liked}
                onChangeText={setLiked}
                multiline
                numberOfLines={3}
                textAlign={isRTL ? "right" : "left"}
              />
            </View>

            {/* What didn't you like */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
                <ThumbsDown size={18} color={colors.icon} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text },
                    isRTL && styles.rtlText,
                  ]}
                >
                  {language === "he" ? "מה לא אהבת?" : "What didn't you like?"}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  isRTL && styles.rtlTextInput,
                ]}
                placeholder={
                  language === "he"
                    ? "תאר מה לא אהבת..."
                    : "Describe what you didn't like..."
                }
                placeholderTextColor={colors.icon}
                value={disliked}
                onChangeText={setDisliked}
                multiline
                numberOfLines={3}
                textAlign={isRTL ? "right" : "left"}
              />
            </View>

            {/* Suggestions */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
                <MessageSquare size={18} color={colors.icon} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text },
                    isRTL && styles.rtlText,
                  ]}
                >
                  {language === "he"
                    ? "הצעות לשיפור"
                    : "Suggestions for improvement"}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  isRTL && styles.rtlTextInput,
                ]}
                placeholder={
                  language === "he"
                    ? "איך נוכל לשפר את התפריט?"
                    : "How can we improve this menu?"
                }
                placeholderTextColor={colors.icon}
                value={suggestions}
                onChangeText={setSuggestions}
                multiline
                numberOfLines={3}
                textAlign={isRTL ? "right" : "left"}
              />
            </View>

            {/* Would recommend */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  {
                    backgroundColor: wouldRecommend
                      ? colors.emerald500
                      : colors.surface,
                    borderColor: wouldRecommend
                      ? colors.emerald500
                      : colors.border,
                  },
                ]}
                onPress={() => setWouldRecommend(!wouldRecommend)}
              >
                <Award
                  size={20}
                  color={wouldRecommend ? "#ffffff" : colors.icon}
                  fill={wouldRecommend ? "#ffffff" : "transparent"}
                />
                <Text
                  style={[
                    styles.recommendText,
                    {
                      color: wouldRecommend ? "#ffffff" : colors.text,
                    },
                    isRTL && styles.rtlText,
                  ]}
                >
                  {language === "he"
                    ? "הייתי ממליץ על התפריט לחברים"
                    : "I would recommend this menu to friends"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View
            style={[styles.modalActions, { borderTopColor: colors.border }]}
          >
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                {language === "he" ? "ביטול" : "Cancel"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor:
                    rating > 0 ? colors.emerald500 : colors.border,
                  opacity: rating > 0 ? 1 : 0.5,
                },
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              <Award size={16} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {language === "he" ? "שלח דירוג" : "Submit Rating"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  menuName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 16,
  },
  starButton: {
    padding: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  recommendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  recommendText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rtlTextInput: {
    textAlign: "right",
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
});

export default MenuRatingModal;

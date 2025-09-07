import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";

interface Subsection {
  title: string;
  content: string;
  items?: string[];
}

const PrivacyPolicyScreen = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const isRTL = i18n.language === "he";

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const openExternalLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const renderSection = (sectionKey: string, hasSubsections = false) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <View key={sectionKey} style={styles.sectionContainer}>
        <TouchableOpacity
          style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t(`privacy.sections.${sectionKey}.title`)}
            </Text>
            <View
              style={[
                styles.iconContainer,
                isExpanded && styles.iconContainerExpanded,
              ]}
            >
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.icon}
                style={[isRTL && { transform: [{ scaleX: -1 }] }]}
              />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.contentWrapper}>
              <Text style={[styles.sectionText, isRTL && styles.textRTL]}>
                {t(`privacy.sections.${sectionKey}.content`)}
              </Text>

              {hasSubsections && (
                <View style={styles.subsectionsContainer}>
                  {(
                    t(`privacy.sections.${sectionKey}.subsections`, {
                      returnObjects: true,
                    }) as Subsection[]
                  ).map((subsection: Subsection, index: number) => (
                    <View key={index} style={styles.subsection}>
                      <Text
                        style={[
                          styles.subsectionTitle,
                          isRTL && styles.textRTL,
                        ]}
                      >
                        {subsection.title}
                      </Text>
                      <Text
                        style={[styles.subsectionText, isRTL && styles.textRTL]}
                      >
                        {subsection.content}
                      </Text>
                      {subsection.items && (
                        <View style={styles.itemsList}>
                          {subsection.items.map(
                            (item: string, itemIndex: number) => (
                              <View
                                key={itemIndex}
                                style={styles.listItemContainer}
                              >
                                <View style={styles.bulletPoint} />
                                <Text
                                  style={[
                                    styles.listItem,
                                    isRTL && styles.textRTL,
                                  ]}
                                >
                                  {item}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const sections = [
    "regulatory_scope",
    "sensitive_data",
    "liability_limitation",
    "cookies_analytics",
    "data_storage",
    "user_rights",
    "contact_info",
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    containerRTL: {
      direction: "rtl",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? "#000" : "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    headerRTL: {
      flexDirection: "row-reverse",
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 22,
      backgroundColor: colors.card,
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },
    languageButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 44,
      alignItems: "center",
    },
    languageButtonText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: "600",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    introSection: {
      backgroundColor: colors.surface,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    introHeader: {
      alignItems: "center",
      marginBottom: 20,
    },
    privacyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    introTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },
    introText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: "center",
    },
    lastUpdatedContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    lastUpdated: {
      fontSize: 14,
      color: colors.muted,
      fontWeight: "500",
      marginLeft: 6,
    },
    sectionsContainer: {
      marginHorizontal: 16,
    },
    sectionContainer: {
      backgroundColor: colors.surface,
      marginBottom: 8,
      borderRadius: 16,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.06,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    sectionHeader: {
      padding: 20,
    },
    sectionHeaderRTL: {
      flexDirection: "row-reverse",
    },
    sectionHeaderContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      letterSpacing: -0.3,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    iconContainerExpanded: {
      backgroundColor: colors.outline,
    },
    sectionContent: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    contentWrapper: {
      padding: 20,
    },
    sectionText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    subsectionsContainer: {
      marginTop: 12,
    },
    subsection: {
      marginBottom: 24,
      paddingLeft: 20,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      backgroundColor: isDark ? colors.card : colors.emerald50,
      paddingVertical: 16,
      borderRadius: 8,
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      letterSpacing: -0.2,
    },
    subsectionText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    itemsList: {
      marginTop: 8,
    },
    listItemContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    bulletPoint: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.muted,
      marginTop: 7,
      marginRight: 12,
    },
    listItem: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      flex: 1,
    },
    footerSection: {
      backgroundColor: colors.surface,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    footerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    footerSubtitle: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: 20,
    },
    linksContainer: {
      gap: 4,
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 8,
    },
    linkContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    linkText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: "500",
      marginLeft: 12,
      flex: 1,
    },
    textRTL: {
      textAlign: "right",
      writingDirection: "rtl",
    },
  });

  return (
    <SafeAreaView style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Enhanced Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.6}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
            {t("privacy.title")}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Intro Section */}
        <View style={styles.introSection}>
          <View style={styles.introHeader}>
            <View style={styles.privacyIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={32}
                color={colors.text}
              />
            </View>
            <Text style={[styles.introTitle, isRTL && styles.textRTL]}>
              Privacy & Security
            </Text>
          </View>
          <Text style={[styles.introText, isRTL && styles.textRTL]}>
            {t("privacy.intro")}
          </Text>
          <View style={styles.lastUpdatedContainer}>
            <Ionicons name="time-outline" size={16} color={colors.muted} />
            <Text style={[styles.lastUpdated, isRTL && styles.textRTL]}>
              {t("privacy.lastUpdated")}: {t("privacy.updateDate")}
            </Text>
          </View>
        </View>

        {/* Enhanced Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map((sectionKey) =>
            renderSection(
              sectionKey,
              ["regulatory_scope", "sensitive_data", "user_rights"].includes(
                sectionKey
              )
            )
          )}
        </View>

        {/* Enhanced Footer */}
        <View style={styles.footerSection}>
          <Text style={[styles.footerTitle, isRTL && styles.textRTL]}>
            {t("privacy.footer.title")}
          </Text>
          <Text style={[styles.footerSubtitle, isRTL && styles.textRTL]}>
            Learn more about our partners' privacy policies
          </Text>

          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openExternalLink("https://openai.com/privacy")}
              activeOpacity={0.7}
            >
              <View style={styles.linkContent}>
                <Ionicons name="link-outline" size={20} color={colors.text} />
                <Text style={[styles.linkText, isRTL && styles.textRTL]}>
                  {t("privacy.footer.openai_link")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openExternalLink("https://policies.google.com/privacy")
              }
              activeOpacity={0.7}
            >
              <View style={styles.linkContent}>
                <Ionicons name="link-outline" size={20} color={colors.text} />
                <Text style={[styles.linkText, isRTL && styles.textRTL]}>
                  {t("privacy.footer.google_analytics_link")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

// PrivacyPolicyScreen.js
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

const PrivacyPolicyScreen = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({});
  const isRTL = i18n.language === "he";

  const toggleSection = (sectionId: string | number) => {
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

  const renderSection = (
    sectionKey: React.Key | null | undefined,
    hasSubsections = false
  ) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <View key={sectionKey} style={styles.sectionContainer}>
        <TouchableOpacity
          style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}
          onPress={() => toggleSection(sectionKey)}
        >
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t(`privacy.sections.${sectionKey}.title`)}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#666"
            style={[isRTL && { transform: [{ scaleX: -1 }] }]}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionText, isRTL && styles.textRTL]}>
              {t(`privacy.sections.${sectionKey}.content`)}
            </Text>

            {hasSubsections && (
              <View style={styles.subsectionsContainer}>
                {t(`privacy.sections.${sectionKey}.subsections`, {
                  returnObjects: true,
                }).map(
                  (
                    subsection: {
                      title:
                        | string
                        | number
                        | bigint
                        | boolean
                        | React.ReactElement<
                            unknown,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | React.ReactPortal
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactPortal
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                      content:
                        | string
                        | number
                        | bigint
                        | boolean
                        | React.ReactElement<
                            unknown,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | React.ReactPortal
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactPortal
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                      items: any[];
                    },
                    index: React.Key | null | undefined
                  ) => (
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
                            (
                              item:
                                | string
                                | number
                                | bigint
                                | boolean
                                | React.ReactElement<
                                    unknown,
                                    string | React.JSXElementConstructor<any>
                                  >
                                | Iterable<React.ReactNode>
                                | React.ReactPortal
                                | Promise<
                                    | string
                                    | number
                                    | bigint
                                    | boolean
                                    | React.ReactPortal
                                    | React.ReactElement<
                                        unknown,
                                        | string
                                        | React.JSXElementConstructor<any>
                                      >
                                    | Iterable<React.ReactNode>
                                    | null
                                    | undefined
                                  >
                                | null
                                | undefined,
                              itemIndex: React.Key | null | undefined
                            ) => (
                              <Text
                                key={itemIndex}
                                style={[
                                  styles.listItem,
                                  isRTL && styles.textRTL,
                                ]}
                              >
                                • {item}
                              </Text>
                            )
                          )}
                        </View>
                      )}
                    </View>
                  )
                )}
              </View>
            )}
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

  return (
    <SafeAreaView style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={28}
            color="#007AFF"
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
          {t("privacy.title")}
        </Text>
        <TouchableOpacity
          onPress={() =>
            i18n.changeLanguage(i18n.language === "en" ? "he" : "en")
          }
          style={styles.languageButton}
        >
          <Text style={styles.languageButtonText}>
            {i18n.language === "en" ? "עב" : "EN"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text style={[styles.introText, isRTL && styles.textRTL]}>
            {t("privacy.intro")}
          </Text>
          <Text style={[styles.lastUpdated, isRTL && styles.textRTL]}>
            {t("privacy.lastUpdated")}: {t("privacy.updateDate")}
          </Text>
        </View>

        {sections.map((sectionKey) =>
          renderSection(
            sectionKey,
            ["regulatory_scope", "sensitive_data", "user_rights"].includes(
              sectionKey
            )
          )
        )}

        <View style={styles.footerSection}>
          <Text style={[styles.footerTitle, isRTL && styles.textRTL]}>
            {t("privacy.footer.title")}
          </Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openExternalLink("https://openai.com/privacy")}
          >
            <Text style={[styles.linkText, isRTL && styles.textRTL]}>
              {t("privacy.footer.openai_link")}
            </Text>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              openExternalLink("https://policies.google.com/privacy")
            }
          >
            <Text style={[styles.linkText, isRTL && styles.textRTL]}>
              {t("privacy.footer.google_analytics_link")}
            </Text>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
    textAlign: "center",
  },
  languageButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  introSection: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4a4a4a",
    marginBottom: 16,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#8e8e93",
    fontStyle: "italic",
  },
  sectionContainer: {
    backgroundColor: "#ffffff",
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionHeaderRTL: {
    flexDirection: "row-reverse",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  sectionContent: {
    padding: 20,
    paddingTop: 0,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4a4a4a",
    marginBottom: 16,
  },
  subsectionsContainer: {
    marginTop: 8,
  },
  subsection: {
    marginBottom: 20,
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subsectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4a4a4a",
    marginBottom: 8,
  },
  itemsList: {
    marginTop: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4a4a4a",
    marginBottom: 4,
    paddingLeft: 8,
  },
  footerSection: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginTop: 16,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  linkText: {
    fontSize: 15,
    color: "#007AFF",
    flex: 1,
    marginRight: 8,
  },
  textRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

export default PrivacyPolicyScreen;

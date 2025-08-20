import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import {
  deviceAPI,
  ConnectedDevice,
  DailyBalance,
} from "../../src/services/deviceAPI";
import { HealthData } from "../../src/services/healthKit";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useGoogleFitAuth } from "@/hooks/useGoogleFitAuth";
import axios from "axios";

const getApiBaseUrl = () => {
  if (__DEV__) {
    return "http://127.0.0.1:3000/api";
  }
  return "https://your-production-api.com/api";
};

type DeviceType =
  | "APPLE_HEALTH"
  | "GOOGLE_FIT"
  | "FITBIT"
  | "GARMIN"
  | "WHOOP"
  | "POLAR"
  | "SAMSUNG_HEALTH";

interface SupportedDevice {
  type: DeviceType;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  available: boolean;
  description: string;
}

const SUPPORTED_DEVICES: SupportedDevice[] = [
  {
    type: "APPLE_HEALTH",
    name: "Apple Health",
    icon: "logo-apple",
    color: "#000000",
    available: Platform.OS === "ios",
    description: "Sync steps, calories, heart rate, and more from Apple Health",
  },
  {
    type: "GOOGLE_FIT",
    name: "Google Fit",
    icon: "fitness",
    color: "#4285F4",
    available: true, // Available on all platforms via OAuth
    description:
      "Connect your Google Fit data for comprehensive activity tracking",
  },
  {
    type: "FITBIT",
    name: "Fitbit",
    icon: "watch" as const,
    color: "#00B0B9",
    available: true,
    description: "Sync your Fitbit device data including sleep and activity",
  },
  {
    type: "GARMIN",
    name: "Garmin",
    icon: "watch" as const,
    color: "#007CC3",
    available: true,
    description: "Connect Garmin devices for detailed fitness metrics",
  },
  {
    type: "WHOOP",
    name: "Whoop",
    icon: "fitness" as const,
    color: "#FF6B35",
    available: true,
    description: "Track recovery, strain, and sleep with Whoop integration",
  },
  {
    type: "POLAR",
    name: "Polar",
    icon: "heart" as const,
    color: "#0066CC",
    available: true,
    description: "Sync Polar heart rate and training data",
  },
  {
    type: "SAMSUNG_HEALTH",
    name: "Samsung Health",
    icon: "heart" as const,
    color: "#1428A0",
    available: Platform.OS === "android",
    description: "Connect Samsung Health for comprehensive health tracking",
  },
];

export default function DevicesScreen() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>(
    []
  );
  const [dailyBalance, setDailyBalance] = useState<DailyBalance | null>(null);
  const [activityData, setActivityData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingDevices, setSyncingDevices] = useState<Set<string>>(new Set());
  const [connectingDevices, setConnectingDevices] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeviceData();
  }, []);

  const loadDeviceData = async () => {
    try {
      console.log("📱 Loading device data...");
      setIsLoading(true);
      setError(null);

      // Get connected devices
      const devices = await deviceAPI.getConnectedDevices();
      setConnectedDevices(devices);

      // Only load activity data and balance if we have connected devices
      if (devices.length > 0) {
        const today = new Date().toISOString().split("T")[0];

        // Get activity data and balance in parallel
        const [activity, balance] = await Promise.all([
          deviceAPI.getActivityData(today),
          deviceAPI.getDailyBalance(today),
        ]);

        setActivityData(activity);
        setDailyBalance(balance);
      } else {
        setActivityData(null);
        setDailyBalance(null);
      }
    } catch (error) {
      console.error("💥 Failed to load device data:", error);
      setError("Failed to load device data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeviceData();
    setRefreshing(false);
  };
  const handleConnectDevice = async (deviceType: string) => {
    console.log("🔍 handleConnectDevice called with:", deviceType);

    const deviceInfo = SUPPORTED_DEVICES.find((d) => d.type === deviceType);
    console.log("📱 Device info found:", deviceInfo);

    if (!deviceInfo) {
      console.log("❌ Device info not found for type:", deviceType);
      Alert.alert("Error", "Device type not found");
      return;
    }

    if (!deviceInfo.available) {
      console.log("❌ Device not available:", deviceInfo.name);
      Alert.alert(
        "Not Available",
        `${deviceInfo.name} integration is not available on this platform.`
      );
      return;
    }

    // Special handling for Google Fit
    if (deviceType === "GOOGLE_FIT") {
      const clientSecret = process.env.EXPO_PUBLIC_GOOGLE_FIT_CLIENT_SECRET;
      if (!clientSecret) {
        Alert.alert(
          "Configuration Required",
          "Google Fit client secret is not configured. Please add EXPO_PUBLIC_GOOGLE_FIT_CLIENT_SECRET to your environment variables and restart the app.",
          [{ text: "OK" }]
        );
        return;
      }

      Alert.alert(
        "Connect Device",
        `Connect to ${deviceInfo.name}?\n\n${deviceInfo.description}\n\nThis will request permission to access your health data.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Connect",
            onPress: async () => {
              console.log("🔄 User pressed Connect for Google Fit");
              setConnectingDevices((prev) => new Set(prev).add(deviceType));
              setError(null);

              try {
                const { deviceConnectionService } = await import(
                  "../../src/services/deviceConnections"
                );
                const result = await deviceConnectionService.connectDevice(
                  deviceType
                );

                if (result.success) {
                  // Register with your server
                  try {
                    const deviceAxios = axios.create({
                      baseURL: getApiBaseUrl(),
                      timeout: 30000,
                    });

                    await deviceAxios.post("/devices/connect", {
                      deviceType: "GOOGLE_FIT",
                      deviceName: "Google Fit",
                      accessToken: result.accessToken,
                      refreshToken: result.refreshToken,
                    });
                  } catch (serverError) {
                    console.warn(
                      "⚠️ Failed to register with server:",
                      serverError
                    );
                  }

                  Alert.alert(
                    "Success",
                    `${deviceInfo.name} connected successfully! You can now sync your health data.`
                  );
                  await loadDeviceData();
                } else {
                  Alert.alert(
                    "Connection Failed",
                    `Failed to connect to ${deviceInfo.name}. ${result.error}`
                  );
                }
              } catch (error) {
                console.error("💥 Connection error:", error);
                setError(
                  `Failed to connect to ${deviceInfo.name}. Please try again.`
                );
              } finally {
                setConnectingDevices((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(deviceType);
                  return newSet;
                });
              }
            },
          },
        ]
      );
      return;
    }

    // For other device types, use the existing logic
    Alert.alert(
      "Connect Device",
      `Connect to ${deviceInfo.name}?\n\n${deviceInfo.description}\n\nThis will request permission to access your health data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: async () => {
            console.log("🔄 User pressed Connect for:", deviceType);
            setConnectingDevices((prev) => new Set(prev).add(deviceType));
            setError(null);

            try {
              console.log(
                "📡 Calling deviceAPI.connectDevice with:",
                deviceType
              );
              const success = await deviceAPI.connectDevice(deviceType);
              console.log("📡 deviceAPI.connectDevice result:", success);

              if (success) {
                Alert.alert(
                  "Success",
                  `${deviceInfo.name} connected successfully! You can now sync your health data.`
                );
                await loadDeviceData();
              } else {
                Alert.alert(
                  "Connection Failed",
                  `Failed to connect to ${deviceInfo.name}. This could be due to:\n\n• Cancelled authorization\n• Network issues\n• Configuration problems\n\nPlease try again or check your settings.`
                );
              }
            } catch (error) {
              console.error("💥 Connection error:", error);
              setError(
                `Failed to connect to ${deviceInfo.name}. Please try again.`
              );
            } finally {
              setConnectingDevices((prev) => {
                const newSet = new Set(prev);
                newSet.delete(deviceType);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleDisconnectDevice = async (deviceId: string) => {
    const device = connectedDevices.find((d) => d.id === deviceId);
    if (!device) return;

    Alert.alert(
      "Disconnect Device",
      `Are you sure you want to disconnect ${device.name}? This will stop syncing data from this device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deviceAPI.disconnectDevice(deviceId);

              if (success) {
                Alert.alert("Success", "Device disconnected successfully");
                await loadDeviceData(); // Refresh data
              } else {
                Alert.alert("Error", "Failed to disconnect device");
              }
            } catch (error) {
              console.error("💥 Disconnect error:", error);
              Alert.alert("Error", "Failed to disconnect device");
            }
          },
        },
      ]
    );
  };

  const handleSyncDevice = async (deviceId: string) => {
    setSyncingDevices((prev) => new Set(prev).add(deviceId));

    try {
      const success = await deviceAPI.syncDevice(deviceId);

      if (success) {
        Alert.alert("Success", "Device synced successfully!");
        await loadDeviceData(); // Refresh data
      } else {
        Alert.alert(
          "Error",
          "Failed to sync device. Please check your connection and try again."
        );
      }
    } catch (error) {
      console.error("💥 Sync error:", error);
      Alert.alert("Error", "Failed to sync device");
    } finally {
      setSyncingDevices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };

  const handleSyncAllDevices = async () => {
    if (connectedDevices.length === 0) {
      Alert.alert("No Devices", "No connected devices to sync");
      return;
    }

    try {
      const result = await deviceAPI.syncAllDevices();

      if (result.success > 0) {
        Alert.alert(
          "Sync Complete",
          `Successfully synced ${result.success} device(s)${
            result.failed > 0 ? `, ${result.failed} failed` : ""
          }`
        );
        await loadDeviceData(); // Refresh data
      } else {
        Alert.alert(
          "Sync Failed",
          "Failed to sync any devices. Please check your connections."
        );
      }
    } catch (error) {
      console.error("💥 Sync all error:", error);
      Alert.alert("Error", "Failed to sync devices");
    }
  };

  const getBalanceColor = (status: string) => {
    switch (status) {
      case "balanced":
        return "#4CAF50";
      case "slight_imbalance":
        return "#FF9800";
      case "significant_imbalance":
        return "#F44336";
      default:
        return "#666";
    }
  };

  const getBalanceMessage = (balance: number, status: string) => {
    if (status === "balanced") {
      return "🎯 Great balance! You're on track.";
    } else if (balance > 0) {
      return `⚠️ You consumed ${balance} more calories than you burned. Consider being more active.`;
    } else {
      return `⚠️ You burned ${Math.abs(
        balance
      )} more calories than you consumed. Make sure you're eating enough.`;
    }
  };

  const renderDeviceCard = (device: ConnectedDevice) => {
    const deviceInfo = SUPPORTED_DEVICES.find((d) => d.type === device.type);
    const isSyncing = syncingDevices.has(device.id);

    return (
      <View
        key={device.id}
        style={[styles.deviceCard, { backgroundColor: colors.card }]}
      >
        <View style={styles.deviceHeader}>
          <View style={styles.deviceInfo}>
            <Ionicons
              name={deviceInfo?.icon || "watch"}
              size={24}
              color={deviceInfo?.color || "#666"}
            />
            <View style={styles.deviceDetails}>
              <Text style={[styles.deviceName, { color: colors.text }]}>
                {device.name}
              </Text>
              <Text style={[styles.deviceStatus, { color: colors.subtext }]}>
                {device.status === "CONNECTED"
                  ? t("connected")
                  : t("disconnected")}
                {device.isPrimary && ` • ${t("primary")}`}
              </Text>
              {deviceInfo?.description && (
                <Text
                  style={[styles.deviceDescription, { color: colors.muted }]}
                >
                  {t(deviceInfo.description)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.deviceActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.syncButton]}
              onPress={() => handleSyncDevice(device.id)}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons name="refresh" size={16} color="#007AFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.disconnectButton]}
              onPress={() => handleDisconnectDevice(device.id)}
            >
              <Ionicons name="close" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>

        {device.lastSync && (
          <Text style={[styles.lastSync, { color: colors.muted }]}>
            {t("last_sync")}:{" "}
            {new Date(device.lastSync).toLocaleString(language)}
          </Text>
        )}
      </View>
    );
  };

  const renderAvailableDevices = () => {
    const connectedTypes = new Set(connectedDevices.map((d) => d.type));
    const availableDevices = SUPPORTED_DEVICES.filter(
      (d) => !connectedTypes.has(d.type)
    );

    if (availableDevices.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("available_devices")}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          {t("connect_devices_subtitle")}
        </Text>
        {availableDevices.map((device) => {
          const isConnecting = connectingDevices.has(device.type);

          return (
            <TouchableOpacity
              key={device.type}
              style={[
                styles.availableDeviceCard,
                !device.available && styles.unavailableDevice,
                { backgroundColor: colors.card },
              ]}
              onPress={() => {
                console.log(
                  "🎯 TouchableOpacity pressed for device:",
                  device.type
                );
                console.log("🎯 Device available:", device.available);
                console.log(
                  "🎯 Is connecting:",
                  connectingDevices.has(device.type)
                );
                handleConnectDevice(device.type);
              }}
              disabled={!device.available || isConnecting}
            >
              <Ionicons
                name={device.icon}
                size={24}
                color={device.available ? device.color : "#ccc"}
              />
              <View style={styles.availableDeviceInfo}>
                <Text
                  style={[
                    styles.availableDeviceName,
                    !device.available && styles.unavailableDeviceText,
                    { color: colors.text },
                  ]}
                >
                  {t(device.name)}
                </Text>
                <Text
                  style={[
                    styles.availableDeviceDescription,
                    !device.available && styles.unavailableDeviceText,
                    { color: colors.muted },
                  ]}
                >
                  {t(device.description)}
                </Text>
                {!device.available && (
                  <Text style={styles.comingSoonText}>
                    {t("not_available_on_platform")}
                  </Text>
                )}
              </View>
              {device.available &&
                (isConnecting ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Ionicons name="add-circle" size={24} color="#007AFF" />
                ))}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return <LoadingScreen text={t("loading_smart_devices")} />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            loadDeviceData();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <ErrorBoundary>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* No Devices Connected State */}
        {connectedDevices.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="watch-outline" size={64} color={colors.muted} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              {t("no_devices_connected")}
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.muted }]}>
              {t("connect_devices_description")}
            </Text>
          </View>
        )}

        {/* Daily Balance Section */}
        {dailyBalance && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("todays_calorie_balance")}
            </Text>
            <View
              style={[
                styles.balanceCard,
                {
                  borderLeftColor: getBalanceColor(dailyBalance.balanceStatus),
                  backgroundColor: colors.card,
                },
              ]}
            >
              <View style={styles.balanceStats}>
                <View style={styles.balanceStat}>
                  <Text style={[styles.balanceValue, { color: colors.text }]}>
                    {dailyBalance.caloriesIn}
                  </Text>
                  <Text style={[styles.balanceLabel, { color: colors.muted }]}>
                    {t("calories_in")}
                  </Text>
                </View>
                <View style={styles.balanceStat}>
                  <Text style={[styles.balanceValue, { color: colors.text }]}>
                    {dailyBalance.caloriesOut}
                  </Text>
                  <Text style={[styles.balanceLabel, { color: colors.muted }]}>
                    {t("calories_out")}
                  </Text>
                </View>
                <View style={styles.balanceStat}>
                  <Text
                    style={[
                      styles.balanceValue,
                      { color: getBalanceColor(dailyBalance.balanceStatus) },
                    ]}
                  >
                    {dailyBalance.balance > 0 ? "+" : ""}
                    {dailyBalance.balance}
                  </Text>
                  <Text style={[styles.balanceLabel, { color: colors.muted }]}>
                    {t("net_balance")}
                  </Text>
                </View>
              </View>
              <Text style={[styles.balanceMessage, { color: colors.muted }]}>
                {getBalanceMessage(
                  dailyBalance.balance,
                  dailyBalance.balanceStatus
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Activity Data Section */}
        {activityData && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("todays_activity")}
            </Text>
            <View style={styles.activityGrid}>
              <View
                style={[styles.activityCard, { backgroundColor: colors.card }]}
              >
                <Ionicons name="walk" size={24} color="#4CAF50" />
                <Text style={[styles.activityValue, { color: colors.text }]}>
                  {activityData.steps.toLocaleString(language)}
                </Text>
                <Text style={[styles.activityLabel, { color: colors.muted }]}>
                  {t("steps")}
                </Text>
              </View>
              <View
                style={[styles.activityCard, { backgroundColor: colors.card }]}
              >
                <Ionicons name="flame" size={24} color="#FF5722" />
                <Text style={[styles.activityValue, { color: colors.text }]}>
                  {activityData.caloriesBurned}
                </Text>
                <Text style={[styles.activityLabel, { color: colors.muted }]}>
                  {t("calories_burned")}
                </Text>
              </View>
              <View
                style={[styles.activityCard, { backgroundColor: colors.card }]}
              >
                <Ionicons name="time" size={24} color="#2196F3" />
                <Text style={[styles.activityValue, { color: colors.text }]}>
                  {activityData.activeMinutes}
                </Text>
                <Text style={[styles.activityLabel, { color: colors.muted }]}>
                  {t("active_minutes")}
                </Text>
              </View>
              {activityData.heartRate && (
                <View
                  style={[
                    styles.activityCard,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Ionicons name="heart" size={24} color="#E91E63" />
                  <Text style={[styles.activityValue, { color: colors.text }]}>
                    {activityData.heartRate}
                  </Text>
                  <Text style={[styles.activityLabel, { color: colors.muted }]}>
                    {t("avg_heart_rate")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Connected Devices Section */}
        {connectedDevices.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("connected_devices")}
            </Text>
            {connectedDevices.map(renderDeviceCard)}

            {/* Sync All Button */}
            <TouchableOpacity
              style={styles.syncAllButton}
              onPress={handleSyncAllDevices}
            >
              <Ionicons name="refresh-circle" size={24} color="white" />
              <Text style={styles.syncAllButtonText}>
                {t("sync_all_devices")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Available Devices Section */}
        {renderAvailableDevices()}

        {/* Help Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about_device_integration")}
          </Text>
          <Text style={[styles.helpText, { color: colors.muted }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              {t("apple_health")}:
            </Text>{" "}
            {t("apple_health_desc")}
          </Text>
          <Text style={[styles.helpText, { color: colors.muted }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              {t("google_fit")}:
            </Text>{" "}
            {t("google_fit_desc")}
          </Text>
          <Text style={[styles.helpText, { color: colors.muted }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              {t("fitbit")}:
            </Text>{" "}
            {t("fitbit_desc")}
          </Text>
          <Text style={[styles.helpText, { color: colors.muted }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              {t("garmin")}:
            </Text>{" "}
            {t("garmin_desc")}
          </Text>
          <Text style={[styles.helpText, { color: colors.muted }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              {t("whoop")}:
            </Text>{" "}
            {t("whoop_desc")}
          </Text>
          <Text style={[styles.helpText, { color: colors.muted }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              {t("polar")}:
            </Text>{" "}
            {t("polar_desc")}
          </Text>
          <Text style={[styles.helpText, { color: colors.muted }]}>
            • {t("secure_data_processing")}
          </Text>
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Error handling styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Empty state styles
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },

  // Section styles
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },

  // Daily Balance styles
  balanceCard: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 16,
    borderRadius: 8,
  },
  balanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  balanceStat: {
    alignItems: "center",
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  balanceMessage: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
  },

  // Activity data styles
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  activityCard: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Connected device styles
  deviceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  deviceInfo: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
  },
  deviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  deviceStatus: {
    fontSize: 14,
    marginBottom: 4,
  },
  deviceDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  deviceActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  syncButton: {
    backgroundColor: "#E3F2FD",
  },
  disconnectButton: {
    backgroundColor: "#FFEBEE",
  },
  lastSync: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },

  // Available device styles
  availableDeviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  availableDeviceInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  availableDeviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  availableDeviceDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  unavailableDevice: {
    opacity: 0.6,
  },
  unavailableDeviceText: {
    opacity: 0.7,
  },
  comingSoonText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "500",
    marginTop: 4,
  },

  // Sync all button
  syncAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  syncAllButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Help section styles
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: "600",
  },
});

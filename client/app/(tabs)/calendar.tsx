import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import {
  fetchCalendarData,
  getStatistics,
  addEvent,
  deleteEvent,
  clearError,
} from "@/src/store/calendarSlice";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import {
  Calendar as CalendarIcon,
  Plus,
  TrendingUp,
  Award,
  Target,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
  Trash2,
  Save,
  Info,
} from "lucide-react-native";
import LoadingScreen from "@/components/LoadingScreen";

const { width: screenWidth } = Dimensions.get("window");

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  created_at: string;
  description?: string;
}

interface DayData {
  date: string;
  calories_goal: number;
  calories_actual: number;
  protein_goal: number;
  protein_actual: number;
  carbs_goal: number;
  carbs_actual: number;
  fat_goal: number;
  fat_actual: number;
  meal_count: number;
  quality_score: number;
  water_intake_ml: number;
  events: CalendarEvent[];
}

const EVENT_TYPES = [
  { key: "general", label: "General", color: "#6b7280" },
  { key: "workout", label: "Workout", color: "#ef4444" },
  { key: "social", label: "Social", color: "#8b5cf6" },
  { key: "health", label: "Health", color: "#10b981" },
  { key: "travel", label: "Travel", color: "#f59e0b" },
  { key: "work", label: "Work", color: "#3b82f6" },
];

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { calendarData, statistics, isLoading, error } = useSelector(
    (state: RootState) => state.calendar
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [editingEvent, setEditingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState("general");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [modalAnimation] = useState(new Animated.Value(0));

  const monthNames = t("calendar.monthNames");
  const dayNames = t("calendar.dayNames");

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  useEffect(() => {
    if (error) {
      Alert.alert(t("calendar.errors.generic"), error);
      dispatch(clearError());
    }
  }, [error]);

  const loadCalendarData = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    try {
      await Promise.all([
        dispatch(fetchCalendarData({ year, month })),
        dispatch(getStatistics({ year, month })),
      ]);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    }
  }, [currentDate, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCalendarData();
    setRefreshing(false);
  }, [loadCalendarData]);

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr);
    const dayData = calendarData[dateStr];
    setSelectedDayData(dayData);

    if (dayData?.events && dayData.events.length > 0) {
      // If there are events, show the first event details
      setSelectedEvent(dayData.events[0]);
      showEventModal();
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    showEventModal();
  };

  const showEventModal = () => {
    setShowEventDetailsModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideEventModal = () => {
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowEventDetailsModal(false);
      setSelectedEvent(null);
      setEditingEvent(false);
    });
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) {
      Alert.alert(
        t("calendar.events.error"),
        t("calendar.events.titleRequired")
      );
      return;
    }

    try {
      await dispatch(
        addEvent({
          date: selectedDate,
          title: newEventTitle.trim(),
          type: newEventType,
          description: newEventDescription.trim() || undefined,
        })
      ).unwrap();

      setShowAddEventModal(false);
      setNewEventTitle("");
      setNewEventType("general");
      setNewEventDescription("");

      Alert.alert(t("common.success"), t("calendar.events.success"));
      await loadCalendarData();
    } catch (error) {
      Alert.alert(t("calendar.events.error"), t("calendar.events.error"));
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !selectedDate) return;

    Alert.alert(
      t("calendar.events.deleteTitle"),
      t("calendar.events.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("calendar.events.deleteButton"),
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(
                deleteEvent({
                  eventId: selectedEvent.id,
                  date: selectedDate,
                })
              ).unwrap();

              hideEventModal();
              Alert.alert(
                t("common.success"),
                t("calendar.events.deleteSuccess")
              );
              await loadCalendarData();
            } catch (error) {
              Alert.alert(
                t("calendar.events.error"),
                t("calendar.events.deleteError")
              );
            }
          },
        },
      ]
    );
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      setNewEventTitle(selectedEvent.title);
      setNewEventType(selectedEvent.type);
      setNewEventDescription(selectedEvent.description || "");
      setEditingEvent(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!newEventTitle.trim() || !selectedEvent) return;

    try {
      // Delete old event and create new one (simple approach)
      await dispatch(
        deleteEvent({
          eventId: selectedEvent.id,
          date: selectedDate!,
        })
      ).unwrap();

      await dispatch(
        addEvent({
          date: selectedDate!,
          title: newEventTitle.trim(),
          type: newEventType,
          description: newEventDescription.trim() || undefined,
        })
      ).unwrap();

      hideEventModal();
      Alert.alert(t("common.success"), "Event updated successfully");
      await loadCalendarData();
    } catch (error) {
      Alert.alert(t("calendar.events.error"), "Failed to update event");
    }
  };

  const getDaysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      days.push({
        day,
        dateStr,
        data: calendarData[dateStr],
      });
    }

    return days;
  }, [currentDate, calendarData]);

  const getProgressColor = (actual: number, goal: number) => {
    const percentage = goal > 0 ? (actual / goal) * 100 : 0;
    if (percentage >= 90) return "#10b981";
    if (percentage >= 70) return "#f59e0b";
    if (percentage >= 50) return "#ef4444";
    return "#6b7280";
  };

  const renderCalendarDay = (dayInfo: any, index: number) => {
    if (!dayInfo) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const { day, dateStr, data } = dayInfo;
    const isToday = dateStr === new Date().toISOString().split("T")[0];
    const isSelected = selectedDate === dateStr;
    const hasEvents = data?.events && data.events.length > 0;
    const progressColor = data
      ? getProgressColor(data.calories_actual, data.calories_goal)
      : "#6b7280";

    return (
      <TouchableOpacity
        key={dateStr}
        style={[
          styles.dayCell,
          isToday && styles.todayCell,
          isSelected && styles.selectedCell,
        ]}
        onPress={() => handleDayPress(dateStr)}
      >
        <Text
          style={[
            styles.dayNumber,
            isToday && styles.todayText,
            isSelected && styles.selectedText,
          ]}
        >
          {day}
        </Text>

        {data && (
          <View style={styles.dayProgress}>
            <View
              style={[styles.progressDot, { backgroundColor: progressColor }]}
            />
            <Text style={styles.caloriesText}>
              {Math.round(data.calories_actual)}
            </Text>
          </View>
        )}

        {hasEvents && (
          <View style={styles.eventIndicator}>
            <View style={styles.eventDot} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEventDetailsModal = () => (
    <Modal
      visible={showEventDetailsModal}
      transparent
      animationType="none"
      onRequestClose={hideEventModal}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.eventModal,
            {
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingEvent ? "Edit Event" : "Event Details"}
            </Text>
            <TouchableOpacity onPress={hideEventModal}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedEvent && (
              <>
                {editingEvent ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Event Title</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={newEventTitle}
                        onChangeText={setNewEventTitle}
                        placeholder="Enter event title"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Event Type</Text>
                      <View style={styles.typeSelector}>
                        {EVENT_TYPES.map((type) => (
                          <TouchableOpacity
                            key={type.key}
                            style={[
                              styles.typeOption,
                              newEventType === type.key && styles.selectedType,
                              { borderColor: type.color },
                            ]}
                            onPress={() => setNewEventType(type.key)}
                          >
                            <Text
                              style={[
                                styles.typeText,
                                newEventType === type.key && {
                                  color: type.color,
                                },
                              ]}
                            >
                              {type.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Description (Optional)
                      </Text>
                      <TextInput
                        style={[styles.modalInput, styles.textArea]}
                        value={newEventDescription}
                        onChangeText={setNewEventDescription}
                        placeholder="Enter event description"
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.eventDetail}>
                      <Text style={styles.eventTitle}>
                        {selectedEvent.title}
                      </Text>
                      <View style={styles.eventMeta}>
                        <View
                          style={[
                            styles.eventTypeBadge,
                            {
                              backgroundColor:
                                EVENT_TYPES.find(
                                  (t) => t.key === selectedEvent.type
                                )?.color + "20" || "#6b728020",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.eventTypeText,
                              {
                                color:
                                  EVENT_TYPES.find(
                                    (t) => t.key === selectedEvent.type
                                  )?.color || "#6b7280",
                              },
                            ]}
                          >
                            {EVENT_TYPES.find(
                              (t) => t.key === selectedEvent.type
                            )?.label || selectedEvent.type}
                          </Text>
                        </View>
                        <Text style={styles.eventDate}>
                          {new Date(
                            selectedEvent.created_at
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      {selectedEvent.description && (
                        <Text style={styles.eventDescription}>
                          {selectedEvent.description}
                        </Text>
                      )}
                    </View>

                    {selectedDayData && (
                      <View style={styles.dayStatsSection}>
                        <Text style={styles.sectionTitle}>Day Overview</Text>
                        <View style={styles.statsGrid}>
                          <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                              {Math.round(selectedDayData.calories_actual)}
                            </Text>
                            <Text style={styles.statLabel}>Calories</Text>
                            <Text style={styles.statGoal}>
                              Goal: {Math.round(selectedDayData.calories_goal)}
                            </Text>
                          </View>
                          <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                              {Math.round(selectedDayData.protein_actual)}g
                            </Text>
                            <Text style={styles.statLabel}>Protein</Text>
                            <Text style={styles.statGoal}>
                              Goal: {Math.round(selectedDayData.protein_goal)}g
                            </Text>
                          </View>
                          <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                              {selectedDayData.meal_count}
                            </Text>
                            <Text style={styles.statLabel}>Meals</Text>
                          </View>
                          <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                              {selectedDayData.quality_score}/10
                            </Text>
                            <Text style={styles.statLabel}>Quality</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {selectedDayData?.events &&
                      selectedDayData.events.length > 1 && (
                        <View style={styles.otherEventsSection}>
                          <Text style={styles.sectionTitle}>
                            Other Events Today
                          </Text>
                          {selectedDayData.events
                            .filter((e) => e.id !== selectedEvent.id)
                            .map((event) => (
                              <TouchableOpacity
                                key={event.id}
                                style={styles.otherEventItem}
                                onPress={() => setSelectedEvent(event)}
                              >
                                <Text style={styles.otherEventTitle}>
                                  {event.title}
                                </Text>
                                <Text style={styles.otherEventType}>
                                  {event.type}
                                </Text>
                              </TouchableOpacity>
                            ))}
                        </View>
                      )}
                  </>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            {editingEvent ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditingEvent(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Save size={16} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditEvent}
                >
                  <Edit3 size={16} color="#10b981" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteEvent}
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderAddEventModal = () => (
    <Modal
      visible={showAddEventModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddEventModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.addEventModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Event</Text>
            <TouchableOpacity onPress={() => setShowAddEventModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Title *</Text>
              <TextInput
                style={styles.modalInput}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="e.g., Gym workout, Doctor appointment"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Type</Text>
              <View style={styles.typeSelector}>
                {EVENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      newEventType === type.key && styles.selectedType,
                      { borderColor: type.color },
                    ]}
                    onPress={() => setNewEventType(type.key)}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        newEventType === type.key && { color: type.color },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={newEventDescription}
                onChangeText={setNewEventDescription}
                placeholder="Add any additional details..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddEventModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !Object.keys(calendarData).length) {
    return <LoadingScreen text={t("calendar.loading")} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>{t("calendar.title")}</Text>
              <Text style={styles.subtitle}>{t("calendar.subtitle")}</Text>
            </View>
            <TouchableOpacity
              style={styles.addEventButton}
              onPress={() => {
                if (!selectedDate) {
                  Alert.alert("Select Date", "Please select a date first");
                  return;
                }
                setShowAddEventModal(true);
              }}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth("prev")}
            >
              <ChevronLeft size={20} color="#10b981" />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth("next")}
            >
              <ChevronRight size={20} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {dayNames.map((dayName: string, index: number) => (
              <Text key={index} style={styles.dayHeader}>
                {dayName}
              </Text>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.calendarGrid}>
            {getDaysInMonth.map((dayInfo, index) =>
              renderCalendarDay(dayInfo, index)
            )}
          </View>
        </View>

        {/* Statistics */}
        {statistics && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Monthly Statistics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Award size={24} color="#10b981" />
                <Text style={styles.statNumber}>
                  {statistics.totalGoalDays}
                </Text>
                <Text style={styles.statText}>Goal Days</Text>
              </View>
              <View style={styles.statItem}>
                <Target size={24} color="#f59e0b" />
                <Text style={styles.statNumber}>
                  {statistics.monthlyProgress}%
                </Text>
                <Text style={styles.statText}>Progress</Text>
              </View>
              <View style={styles.statItem}>
                <TrendingUp size={24} color="#ef4444" />
                <Text style={styles.statNumber}>{statistics.streakDays}</Text>
                <Text style={styles.statText}>Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Selected Day Details */}
        {selectedDayData && (
          <View style={styles.dayDetailsSection}>
            <Text style={styles.sectionTitle}>
              {new Date(selectedDate!).toLocaleDateString()} Details
            </Text>
            <View style={styles.dayDetailsCard}>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(selectedDayData.calories_actual)}
                  </Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                  <Text style={styles.nutritionGoal}>
                    / {Math.round(selectedDayData.calories_goal)}
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(selectedDayData.protein_actual)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <Text style={styles.nutritionGoal}>
                    / {Math.round(selectedDayData.protein_goal)}g
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {selectedDayData.meal_count}
                  </Text>
                  <Text style={styles.nutritionLabel}>Meals</Text>
                </View>
              </View>

              {selectedDayData.events.length > 0 && (
                <View style={styles.eventsSection}>
                  <Text style={styles.eventsTitle}>Events</Text>
                  {selectedDayData.events.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventItem}
                      onPress={() => handleEventPress(event)}
                    >
                      <View
                        style={[
                          styles.eventColorDot,
                          {
                            backgroundColor:
                              EVENT_TYPES.find((t) => t.key === event.type)
                                ?.color || "#6b7280",
                          },
                        ]}
                      />
                      <Text style={styles.eventItemTitle}>{event.title}</Text>
                      <Text style={styles.eventItemType}>{event.type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {renderAddEventModal()}
      {renderEventDetailsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  addEventButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  calendarContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: (screenWidth - 64) / 7,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 4,
    position: "relative",
  },
  emptyDay: {
    width: (screenWidth - 64) / 7,
    height: 60,
  },
  todayCell: {
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
    borderColor: "#10b981",
  },
  selectedCell: {
    backgroundColor: "#10b981",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  todayText: {
    color: "#10b981",
    fontWeight: "700",
  },
  selectedText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  dayProgress: {
    position: "absolute",
    bottom: 4,
    alignItems: "center",
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  caloriesText: {
    fontSize: 8,
    color: "#6b7280",
    fontWeight: "500",
  },
  eventIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3b82f6",
  },
  statsSection: {
    margin: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  dayDetailsSection: {
    margin: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dayDetailsCard: {
    gap: 16,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  nutritionGoal: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  eventsSection: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 16,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
  },
  eventColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  eventItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  eventItemType: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  eventModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
  },
  addEventModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  selectedType: {
    backgroundColor: "#f0fdf4",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  eventDetail: {
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  eventTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  eventDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  eventDescription: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 24,
  },
  dayStatsSection: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  statGoal: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  otherEventsSection: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 20,
  },
  otherEventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
  },
  otherEventTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    flex: 1,
  },
  otherEventType: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

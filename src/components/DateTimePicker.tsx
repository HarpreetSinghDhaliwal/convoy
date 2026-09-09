import React, { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/theme";

export interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  minDate?: Date;
  mode?: "datetime" | "date" | "time";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const TIME_PRESETS = [
  { label: "06:00 AM", hours: 6, minutes: 0, tag: "Early" },
  { label: "08:30 AM", hours: 8, minutes: 30, tag: "Morning" },
  { label: "11:00 AM", hours: 11, minutes: 0, tag: "Midday" },
  { label: "02:30 PM", hours: 14, minutes: 30, tag: "Afternoon" },
  { label: "05:30 PM", hours: 17, minutes: 30, tag: "Sunset" },
  { label: "08:00 PM", hours: 20, minutes: 0, tag: "Evening" },
];

export function DateTimePicker({
  value,
  onChange,
  label,
  minDate = new Date(),
  mode = "datetime",
}: DateTimePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date(value));
  const [tempDate, setTempDate] = useState(() => new Date(value));

  // Sync temp date when modal opens
  function handleOpen() {
    setTempDate(new Date(value));
    setViewDate(new Date(value));
    setModalVisible(true);
  }

  function handleClose() {
    setModalVisible(false);
  }

  function handleSave() {
    onChange(new Date(tempDate));
    setModalVisible(false);
  }

  // Quick Preset Handlers
  function applyDatePreset(daysFromNow: number) {
    const next = new Date(tempDate);
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    next.setFullYear(target.getFullYear(), target.getMonth(), target.getDate());
    setTempDate(next);
    setViewDate(new Date(next));
  }

  function applyWeekendPreset() {
    const next = new Date(tempDate);
    const now = new Date();
    const day = now.getDay();
    const daysUntilSaturday = day === 6 ? 7 : (6 - day);
    now.setDate(now.getDate() + daysUntilSaturday);
    next.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    setTempDate(next);
    setViewDate(new Date(next));
  }

  function applyTimePreset(hours: number, minutes: number) {
    const next = new Date(tempDate);
    next.setHours(hours, minutes, 0, 0);
    setTempDate(next);
  }

  function adjustHour(delta: number) {
    const next = new Date(tempDate);
    const currHour = next.getHours();
    const nextHour = (currHour + delta + 24) % 24;
    next.setHours(nextHour);
    setTempDate(next);
  }

  function adjustMinute(delta: number) {
    const next = new Date(tempDate);
    const currMin = next.getMinutes();
    const nextMin = (Math.round((currMin + delta) / 5) * 5 + 60) % 60;
    next.setMinutes(nextMin);
    setTempDate(next);
  }

  // Calendar calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function selectDay(dayNumber: number) {
    const next = new Date(tempDate);
    next.setFullYear(year, month, dayNumber);
    setTempDate(next);
  }

  const isToday = (dayNum: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayNum;
  };

  const isSelected = (dayNum: number) => {
    return tempDate.getFullYear() === year && tempDate.getMonth() === month && tempDate.getDate() === dayNum;
  };

  const isPast = (dayNum: number) => {
    const check = new Date(year, month, dayNum, 23, 59, 59);
    return check < minDate;
  };

  // Formatted labels
  const formattedDisplay = value.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const hours12 = tempDate.getHours() % 12 === 0 ? 12 : tempDate.getHours() % 12;
  const isPM = tempDate.getHours() >= 12;
  const minutesStr = String(tempDate.getMinutes()).padStart(2, "0");

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Main Trigger Button */}
      <Pressable onPress={handleOpen} style={styles.triggerButton}>
        <View style={styles.triggerLeft}>
          <Text style={styles.calendarIcon}>📅</Text>
          <View>
            <Text style={styles.triggerText}>{formattedDisplay}</Text>
            <Text style={styles.triggerSub}>Tap to change departure date & time</Text>
          </View>
        </View>
        <View style={styles.triggerBadge}>
          <Text style={styles.triggerBadgeText}>Edit</Text>
        </View>
      </Pressable>

      {/* Modal Dialog for Date & Time Selection */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            {/* Header */}
            <View style={styles.dialogHeader}>
              <View>
                <Text style={styles.dialogTitle}>Select Departure</Text>
                <Text style={styles.dialogSubtitle}>Pick convenient date & time for passengers</Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Quick Date Presets */}
            <View style={styles.presetSection}>
              <Text style={styles.sectionHeader}>QUICK DATES</Text>
              <View style={styles.presetRow}>
                <Pressable onPress={() => applyDatePreset(0)} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>Today</Text>
                </Pressable>
                <Pressable onPress={() => applyDatePreset(1)} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>Tomorrow</Text>
                </Pressable>
                <Pressable onPress={applyWeekendPreset} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>This Weekend</Text>
                </Pressable>
                <Pressable onPress={() => applyDatePreset(7)} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>+1 Week</Text>
                </Pressable>
              </View>
            </View>

            {/* Calendar Month Navigation */}
            <View style={styles.calendarHeader}>
              <Pressable onPress={prevMonth} style={styles.navBtn}>
                <Text style={styles.navBtnText}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <Pressable onPress={nextMonth} style={styles.navBtn}>
                <Text style={styles.navBtnText}>›</Text>
              </Pressable>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekdaysRow}>
              {DAYS_SHORT.map((d) => (
                <Text key={d} style={styles.weekdayText}>{d}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCellEmpty} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const disabled = isPast(dayNum);
                const selected = isSelected(dayNum);
                const today = isToday(dayNum);

                return (
                  <Pressable
                    key={`day-${dayNum}`}
                    disabled={disabled}
                    onPress={() => selectDay(dayNum)}
                    style={[
                      styles.dayCell,
                      today && styles.dayCellToday,
                      selected && styles.dayCellSelected,
                      disabled && styles.dayCellDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        today && styles.dayCellTextToday,
                        selected && styles.dayCellTextSelected,
                        disabled && styles.dayCellTextDisabled,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Time Selector */}
            {mode === "datetime" && (
              <View style={styles.timeSection}>
                <Text style={styles.sectionHeader}>DEPARTURE TIME</Text>

                {/* Custom Time Stepper Display */}
                <View style={styles.timeDisplayCard}>
                  <View style={styles.timeStepperCol}>
                    <Pressable onPress={() => adjustHour(1)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>▲</Text>
                    </Pressable>
                    <Text style={styles.timeDigits}>{String(hours12).padStart(2, "0")}</Text>
                    <Pressable onPress={() => adjustHour(-1)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>▼</Text>
                    </Pressable>
                    <Text style={styles.timeUnitLabel}>HR</Text>
                  </View>

                  <Text style={styles.timeColon}>:</Text>

                  <View style={styles.timeStepperCol}>
                    <Pressable onPress={() => adjustMinute(15)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>▲</Text>
                    </Pressable>
                    <Text style={styles.timeDigits}>{minutesStr}</Text>
                    <Pressable onPress={() => adjustMinute(-15)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>▼</Text>
                    </Pressable>
                    <Text style={styles.timeUnitLabel}>MIN</Text>
                  </View>

                  <View style={styles.ampmToggle}>
                    <Pressable
                      onPress={() => {
                        const h = tempDate.getHours();
                        if (h >= 12) {
                          const next = new Date(tempDate);
                          next.setHours(h - 12);
                          setTempDate(next);
                        }
                      }}
                      style={[styles.ampmBtn, !isPM && styles.ampmBtnActive]}
                    >
                      <Text style={[styles.ampmText, !isPM && styles.ampmTextActive]}>AM</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const h = tempDate.getHours();
                        if (h < 12) {
                          const next = new Date(tempDate);
                          next.setHours(h + 12);
                          setTempDate(next);
                        }
                      }}
                      style={[styles.ampmBtn, isPM && styles.ampmBtnActive]}
                    >
                      <Text style={[styles.ampmText, isPM && styles.ampmTextActive]}>PM</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Time Presets Chips */}
                <View style={styles.timePresetRow}>
                  {TIME_PRESETS.map((p) => (
                    <Pressable
                      key={p.label}
                      onPress={() => applyTimePreset(p.hours, p.minutes)}
                      style={styles.timePresetChip}
                    >
                      <Text style={styles.timePresetText}>{p.label}</Text>
                      <Text style={styles.timePresetTag}>{p.tag}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.dialogActions}>
              <Pressable onPress={handleClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Confirm Date & Time</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  label: {
    ...typography.captionBold,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.lineLight,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  calendarIcon: {
    fontSize: 22,
  },
  triggerText: {
    ...typography.bodyMedium,
    color: colors.ink,
    fontWeight: "700",
  },
  triggerSub: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
    fontSize: 11,
  },
  triggerBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  triggerBadgeText: {
    ...typography.captionBold,
    color: colors.accent,
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  dialogCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 440,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  dialogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  dialogTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  dialogSubtitle: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.inkMuted,
    fontWeight: "600",
  },
  presetSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    ...typography.overline,
    color: colors.inkSubtle,
    marginBottom: spacing.xs,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  presetChip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  presetChipText: {
    ...typography.captionBold,
    color: colors.inkSoft,
    fontSize: 11,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  navBtn: {
    padding: spacing.xs,
    width: 32,
    alignItems: "center",
  },
  navBtnText: {
    fontSize: 22,
    color: colors.ink,
    fontWeight: "700",
  },
  monthTitle: {
    ...typography.bodyMedium,
    color: colors.ink,
    fontWeight: "700",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: spacing.xs,
  },
  weekdayText: {
    ...typography.captionBold,
    color: colors.inkSubtle,
    width: 36,
    textAlign: "center",
    fontSize: 11,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCellEmpty: {
    width: "14.28%",
    height: 36,
  },
  dayCell: {
    width: "14.28%",
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    marginVertical: 2,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  dayCellSelected: {
    backgroundColor: colors.accent,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayCellText: {
    ...typography.body,
    fontSize: 13,
    color: colors.ink,
  },
  dayCellTextToday: {
    color: colors.accent,
    fontWeight: "700",
  },
  dayCellTextSelected: {
    color: colors.paper,
    fontWeight: "700",
  },
  dayCellTextDisabled: {
    color: colors.inkSubtle,
  },
  timeSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
  },
  timeDisplayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    gap: spacing.md,
  },
  timeStepperCol: {
    alignItems: "center",
  },
  stepBtn: {
    padding: 4,
  },
  stepBtnText: {
    fontSize: 11,
    color: colors.inkMuted,
  },
  timeDigits: {
    ...typography.display,
    fontSize: 28,
    color: colors.ink,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "center",
  },
  timeUnitLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.inkSubtle,
    fontWeight: "700",
  },
  timeColon: {
    ...typography.display,
    fontSize: 24,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  ampmToggle: {
    flexDirection: "column",
    gap: 4,
    marginLeft: spacing.sm,
  },
  ampmBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    alignItems: "center",
  },
  ampmBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ampmText: {
    ...typography.captionBold,
    color: colors.inkSoft,
    fontSize: 11,
  },
  ampmTextActive: {
    color: colors.paper,
  },
  timePresetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  timePresetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  timePresetText: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 11,
  },
  timePresetTag: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 9,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    justifyContent: "center",
  },
  cancelBtnText: {
    ...typography.bodyMedium,
    color: colors.inkSoft,
  },
  confirmBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    justifyContent: "center",
    ...shadows.sm,
  },
  confirmBtnText: {
    ...typography.bodyMedium,
    color: colors.paper,
    fontWeight: "700",
  },
});

import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";

export interface TripCancellationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (category: string, note: string) => Promise<void>;
  isLead: boolean;
}

const REASON_CATEGORIES = [
  { key: "emergency", label: "🚨 Personal / Medical Emergency" },
  { key: "vehicle", label: "🚗 Vehicle Breakdown / Technical Issue" },
  { key: "schedule", label: "⏰ Schedule / Timing Conflict" },
  { key: "weather", label: "🌧️ Weather / Road Blockage" },
  { key: "other", label: "💬 Other Reason" },
];

export function TripCancellationModal({
  visible,
  onClose,
  onConfirm,
  isLead,
}: TripCancellationModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("emergency");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!note.trim()) {
      setError("Please write a brief note explaining the cancellation for your co-travelers.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(selectedCategory, note.trim());
      onClose();
    } catch (e: any) {
      setError(e?.message || "Could not process cancellation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.emoji}>🛑</Text>
            <Text style={styles.title}>
              {isLead ? "Cancel Roadtrip Journey" : "Cancel & Leave Seat"}
            </Text>
            <Text style={styles.subtitle}>
              {isLead
                ? "This will cancel the entire trip for all confirmed travelers and notify everyone."
                : "This will release your booked seat back to other travelers."}
            </Text>
          </View>

          <Text style={styles.label}>Select Primary Reason</Text>
          <View style={styles.categoriesList}>
            {REASON_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={[styles.catChip, active && styles.catChipActive]}
                >
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Cancellation Note & Explanation *</Text>
          <TextInput
            style={styles.input}
            placeholder="Explain briefly what happened so fellow travelers and moderation team understand..."
            placeholderTextColor={colors.inkSubtle}
            value={note}
            onChangeText={(t) => {
              setNote(t);
              if (error) setError(null);
            }}
            multiline
            numberOfLines={3}
          />

          <View style={styles.noticeBox}>
            <Text style={styles.noticeEmoji}>⚖️</Text>
            <Text style={styles.noticeText}>
              Cancellations are logged with the community review team to maintain reliability and prevent ghosting.
            </Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actions}>
            <Button
              label="Keep My Journey"
              onPress={onClose}
              variant="secondary"
              size="md"
              style={styles.actionBtn}
            />
            <Button
              label={isLead ? "Confirm Trip Cancellation" : "Confirm Leaving Seat"}
              onPress={handleConfirm}
              loading={submitting}
              variant="danger"
              size="md"
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 480,
    ...shadows.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.ink,
    textAlign: "center",
  },
  subtitle: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  label: {
    ...typography.captionBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  categoriesList: {
    gap: spacing.xs,
  },
  catChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.line,
  },
  catChipActive: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    borderColor: colors.statusFlagged,
  },
  catChipText: {
    ...typography.body,
    fontSize: 13,
    color: colors.ink,
  },
  catChipTextActive: {
    color: colors.statusFlagged,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    ...typography.body,
    fontSize: 13,
    color: colors.ink,
    textAlignVertical: "top",
    minHeight: 72,
  },
  noticeBox: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.md,
    gap: spacing.xs,
    alignItems: "center",
  },
  noticeEmoji: {
    fontSize: 14,
  },
  noticeText: {
    ...typography.overline,
    color: colors.inkSubtle,
    flex: 1,
    lineHeight: 14,
    textTransform: "none",
  },
  errorText: {
    ...typography.caption,
    color: colors.statusFlagged,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
});

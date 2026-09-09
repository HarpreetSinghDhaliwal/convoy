import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Button } from "@/components";
import { useAuthSession } from "@/modules/auth";
import { fileReport } from "../services/safetyService";
import { REPORT_REASONS, type ReportReason } from "../types";

interface ReportDialogProps {
  visible: boolean;
  onClose: () => void;
  reportedId: string;
  tripId?: string;
}

// Report/block needs to be reachable from any profile or message, not
// buried in a settings menu (blueprint §03) — this dialog is built to be
// dropped into any screen that renders another user or their content.
export function ReportDialog({ visible, onClose, reportedId, tripId }: ReportDialogProps) {
  const { session } = useAuthSession();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!reason || !session?.user.id) {
      setError("Choose a reason first");
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await fileReport({
        reporterId: session.user.id,
        reportedId,
        reason,
        detail: detail.trim() || undefined,
        tripId,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t submit — try again");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setReason(null);
    setDetail("");
    setSubmitted(false);
    setError(undefined);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {submitted ? (
            <>
              <Text style={styles.title}>Report submitted</Text>
              <Text style={styles.body}>
                This goes to review. You won’t see updates on it here, but it’s not ignored —
                every report gets looked at.
              </Text>
              <Button label="Done" onPress={handleClose} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Report this</Text>
              <ScrollView style={styles.reasonList}>
                {REPORT_REASONS.map((option) => (
                  <Pressable
                    key={option}
                    style={[styles.reasonRow, reason === option && styles.reasonRowSelected]}
                    onPress={() => setReason(option)}
                  >
                    <Text style={styles.reasonLabel}>{option}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                style={styles.detailInput}
                placeholder="Anything else that would help (optional)"
                placeholderTextColor={colors.inkSoft}
                value={detail}
                onChangeText={setDetail}
                multiline
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button label="Submit report" onPress={handleSubmit} loading={submitting} />
              <Button label="Cancel" onPress={handleClose} variant="secondary" />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    maxHeight: "80%",
  },
  title: { ...typography.h1, color: colors.ink, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.inkSoft, marginBottom: spacing.xl },
  reasonList: { maxHeight: 260, marginBottom: spacing.md },
  reasonRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
  },
  reasonRowSelected: { borderColor: colors.accent, backgroundColor: colors.paper },
  reasonLabel: { ...typography.body, color: colors.ink },
  detailInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 70,
    textAlignVertical: "top",
    color: colors.ink,
    marginBottom: spacing.md,
  },
  error: { ...typography.caption, color: colors.statusFlagged, marginBottom: spacing.sm },
});

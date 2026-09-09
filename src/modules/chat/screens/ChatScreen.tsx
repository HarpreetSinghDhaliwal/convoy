import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Screen, EmptyState } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { SosButton } from "@/modules/safety";
import { useTripChat } from "../hooks/useTripChat";
import type { Message } from "../types";

export function ChatScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthSession();
  const { messages, loading, sending, send, looksLikeContactOrPaymentInfo } = useTripChat(tripId);
  const [draft, setDraft] = useState("");
  const [blockedNotice, setBlockedNotice] = useState(false);

  const draftLooksFlagged = draft.length > 0 && looksLikeContactOrPaymentInfo(draft);

  async function handleSend() {
    if (!draft.trim()) return;
    setBlockedNotice(false);
    const result = await send(draft);
    if (result.blocked) {
      setBlockedNotice(true);
      return;
    }
    setDraft("");
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.senderId === session?.user.id;
    const timeString = new Date(item.sentAt).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextOther}>{item.body}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={isMine ? styles.timeTextMine : styles.timeTextOther}>{timeString}</Text>
          </View>
          {item.flagged && (
            <View style={styles.flaggedContainer}>
              <Text style={isMine ? styles.flaggedNoteMine : styles.flaggedNoteOther}>
                ⚠️ Flagged for review — contains contact/payment patterns
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <Screen
      showBack
      title="Trip Coordination Chat"
      rightAction={<SosButton tripId={tripId} />}
    >
      {/* Chat Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        refreshing={loading}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="💬"
              title="No messages yet"
              description="Coordinate pickup location, timing, and travel vibes with fellow riders."
            />
          ) : null
        }
      />

      {/* Safety Notice Warning */}
      {(draftLooksFlagged || blockedNotice) && (
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>🛡️</Text>
          <Text style={styles.warningText}>
            For community safety against scams, phone numbers, emails, and external payment links are not permitted in chat.
          </Text>
        </View>
      )}

      {/* Message Composer */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message to group..."
            placeholderTextColor={colors.inkSubtle}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Button
            label="Send"
            onPress={handleSend}
            loading={sending}
            disabled={!draft.trim() || draftLooksFlagged}
            variant="primary"
            size="md"
            style={styles.sendBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  messageRow: {
    marginVertical: 3,
    flexDirection: "row",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    ...shadows.sm,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: radius.xs,
  },
  bubbleOther: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderBottomLeftRadius: radius.xs,
  },
  bubbleTextMine: {
    ...typography.body,
    color: colors.inkLight,
    lineHeight: 20,
  },
  bubbleTextOther: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 20,
  },
  bubbleMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  timeTextMine: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.75)",
  },
  timeTextOther: {
    fontSize: 10,
    color: colors.inkSubtle,
  },
  flaggedContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  flaggedNoteOther: {
    ...typography.caption,
    color: colors.statusFlagged,
    fontSize: 11,
  },
  flaggedNoteMine: {
    ...typography.caption,
    color: colors.inkLight,
    opacity: 0.9,
    fontStyle: "italic",
    fontSize: 11,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: colors.statusPendingLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.25)",
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  warningIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    color: colors.statusPending,
    flex: 1,
    fontSize: 11.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxHeight: 100,
    outlineStyle: "none",
  } as any,
  sendBtn: {
    minHeight: 40,
    paddingVertical: 0,
    paddingHorizontal: spacing.lg,
  },
});

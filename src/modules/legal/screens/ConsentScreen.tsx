import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button } from "@/components";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { recordConsent } from "../services/legalService";
import { useConsentStatus } from "../hooks/useConsentStatus";
import type { ConsentType } from "../types";

const ITEMS: { type: ConsentType; title: string; body: string }[] = [
  {
    type: "kyc",
    title: "Identity verification data",
    body: "Your government ID (via DigiLocker) and verification status, used to confirm you're a real, accountable person before you can host or join a trip.",
  },
  {
    type: "location",
    title: "Location data",
    body: "Used for trip pickup points, route/ETA, and — only if you trigger it — live location shared with your emergency contacts during an SOS.",
  },
  {
    type: "chat",
    title: "Trip chat messages",
    body: "Stored while a trip is active, hidden from the app 2 weeks after the trip ends, and kept in a restricted, access-controlled store for 90 days total in case a safety report needs it — then deleted for good.",
  },
];

// Three separate consents, three separate checkboxes — not one "I agree to
// everything" tap. Each one writes its own timestamp (legalService).
export function ConsentScreen() {
  const { session } = useAuthSession();
  const { refresh } = useConsentStatus();
  const [checked, setChecked] = useState<Record<ConsentType, boolean>>({
    kyc: false,
    location: false,
    chat: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const allChecked = ITEMS.every((item) => checked[item.type]);

  async function handleContinue() {
    if (!session?.user.id || !allChecked) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await Promise.all(ITEMS.map((item) => recordConsent(session.user.id, item.type)));
      refresh();
    } catch (err) {
      // Was silently swallowed before — the button would just stop loading
      // with no visible outcome, which is exactly the "clicked and nothing
      // happens" symptom. Surfacing it here so a real cause (an RLS policy,
      // a not-yet-applied migration, a network error) is actually visible.
      setError(err instanceof Error ? err.message : "Couldn't save your consent — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Before you continue</Text>
        <Text style={styles.subtitle}>
          Here&rsquo;s exactly what we collect and why — agree to each separately, not all at once.
        </Text>

        {ITEMS.map((item) => (
          <Pressable
            key={item.type}
            style={styles.item}
            onPress={() => setChecked((prev) => ({ ...prev, [item.type]: !prev[item.type] }))}
          >
            <View style={[styles.checkbox, checked[item.type] && styles.checkboxChecked]} />
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
            </View>
          </Pressable>
        ))}

        <Pressable onPress={() => router.push("/legal/terms")}>
          <Text style={styles.link}>Read the full Terms of Service</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/legal/privacy")}>
          <Text style={styles.link}>Read the full Privacy Policy</Text>
        </Pressable>

        <View style={{ height: spacing.xl }} />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          label="Agree and continue"
          onPress={handleContinue}
          disabled={!allChecked}
          loading={submitting}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.inkSoft, marginBottom: spacing.xl },
  item: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg, alignItems: "flex-start" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.line,
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  itemText: { flex: 1 },
  itemTitle: { ...typography.bodyMedium, color: colors.ink, marginBottom: spacing.xs },
  itemBody: { ...typography.caption, color: colors.inkSoft },
  link: { ...typography.body, color: colors.trust, marginBottom: spacing.sm, textDecorationLine: "underline" },
  error: { ...typography.caption, color: colors.statusFlagged, marginBottom: spacing.md },
});

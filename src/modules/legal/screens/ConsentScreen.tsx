import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button, Card, Badge } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { recordConsents } from "../services/legalService";
import { useConsentStatus } from "../hooks/useConsentStatus";
import type { ConsentType } from "../types";

const ITEMS: { type: ConsentType; icon: string; title: string; body: string }[] = [
  {
    type: "kyc",
    icon: "🪪",
    title: "Identity Verification & Trust",
    body: "Government ID verification status confirms you are a real, accountable traveler before hosting or joining journeys.",
  },
  {
    type: "location",
    icon: "📍",
    title: "Pickup Points & Safety Location",
    body: "Used for trip pickup coordination, driving route calculations, and live emergency location sharing during SOS.",
  },
  {
    type: "chat",
    icon: "💬",
    title: "Trip Coordination Chat",
    body: "Coordination messages stored during active trips, strictly purged 90 days after trip completion.",
  },
];

export function ConsentScreen() {
  const { session } = useAuthSession();
  const { refresh } = useConsentStatus();
  const [checked, setChecked] = useState<Record<ConsentType, boolean>>({
    kyc: true,
    location: true,
    chat: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const allChecked = ITEMS.every((item) => checked[item.type]);

  function toggleAll() {
    const nextState = !allChecked;
    setChecked({
      kyc: nextState,
      location: nextState,
      chat: nextState,
    });
  }

  async function handleContinue() {
    if (!session?.user.id) return;
    if (!allChecked) {
      setError("Please review and agree to all 3 safety & privacy consents to proceed");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await recordConsents(session.user.id, ["kyc", "location", "chat"]);
      await refresh();
      router.replace("/phone");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your consent — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Badge label="Step 1 of 2 • Privacy & Safety" variant="neutral" />
          </View>
          <Text style={styles.title}>Privacy & Community Safety</Text>
          <Text style={styles.subtitle}>
            In compliance with India&rsquo;s Digital Personal Data Protection (DPDP) Act, please review and authorize data handling for your journeys:
          </Text>
        </View>

        <View style={styles.selectAllRow}>
          <Pressable onPress={toggleAll} style={styles.selectAllBtn}>
            <Text style={styles.selectAllText}>
              {allChecked ? "✓ All Selected" : "Select All"}
            </Text>
          </Pressable>
        </View>

        {ITEMS.map((item) => {
          const isSelected = checked[item.type];
          return (
            <Card
              key={item.type}
              onPress={() => setChecked((prev) => ({ ...prev, [item.type]: !prev[item.type] }))}
              style={[styles.itemCard, isSelected && styles.itemCardSelected]}
            >
              <View style={styles.itemRow}>
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.itemTextCol}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.itemBody}>{item.body}</Text>
                </View>
              </View>
            </Card>
          );
        })}

        <Card style={styles.legalLinksCard}>
          <Pressable onPress={() => router.push("/legal/terms")} style={styles.linkRow}>
            <Text style={styles.linkText}>📄 Read full Terms of Service</Text>
            <Text style={styles.linkArrow}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={() => router.push("/legal/privacy")} style={styles.linkRow}>
            <Text style={styles.linkText}>🔒 Read full Privacy Policy</Text>
            <Text style={styles.linkArrow}>›</Text>
          </Pressable>
        </Card>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          label="Agree & Continue →"
          onPress={handleContinue}
          disabled={!allChecked}
          loading={submitting}
          size="lg"
          style={styles.continueBtn}
        />
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  selectAllRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: spacing.sm,
  },
  selectAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  selectAllText: {
    ...typography.captionBold,
    color: colors.ink,
  },
  itemCard: {
    padding: spacing.lg,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.lineLight,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  itemCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.paperRaised,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: "bold",
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemIcon: {
    fontSize: 16,
    marginRight: spacing.xs + 2,
  },
  itemTitle: {
    ...typography.bodyMedium,
    color: colors.ink,
    fontWeight: "700",
  },
  itemBody: {
    ...typography.caption,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  legalLinksCard: {
    padding: 0,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  linkText: {
    ...typography.captionBold,
    color: colors.trust,
  },
  linkArrow: {
    ...typography.h2,
    color: colors.inkSubtle,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineLight,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  errorIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  errorText: {
    ...typography.captionBold,
    color: colors.statusFlagged,
    flex: 1,
  },
  continueBtn: {
    marginTop: spacing.xs,
  },
});


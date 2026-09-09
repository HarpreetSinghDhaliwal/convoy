import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { Screen, Button } from "@/components";
import { colors, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { useEmergencyContact } from "@/modules/profile";
import { useKycStatus } from "../hooks/useKycStatus";
import { startVerification } from "../services/kycService";
import { VerifiedBadge } from "../components/VerifiedBadge";

const COPY: Record<string, string> = {
  unverified:
    "Hosting or joining a trip needs ID verification first — this confirms you're a real, accountable person before anyone shares a car with you. We verify through DigiLocker, so nothing but a government-issued document ever leaves your control.",
  pending:
    "Your verification is in manual review right now while DigiLocker integration is being finished — this isn't the long-term process, just how it works until then. You'll be notified the moment it's done.",
  verified: "You're verified — you can host or join any trip.",
  rejected:
    "Verification didn't go through. Common causes: a mismatch between your account and document details, or an expired document. Try again, or contact support if this keeps happening.",
};

export function KycStatusScreen() {
  const { session } = useAuthSession();
  const { status, loading, refresh } = useKycStatus();
  const { isSet: hasEmergencyContact, loading: contactLoading } = useEmergencyContact();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleStart() {
    if (!session?.user.id) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await startVerification(session.user.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start verification — try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || contactLoading) return null;

  if (!hasEmergencyContact) {
    return (
      <Screen>
        <Text style={styles.title}>Identity verification</Text>
        <Text style={styles.body}>
          An emergency contact is required before verification starts — it’s who gets your
          location if you ever trigger SOS during a trip.
        </Text>
        <Button label="Add emergency contact" onPress={() => router.push("/emergency-contact")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Identity verification</Text>
      <VerifiedBadge status={status} />
      <Text style={styles.body}>{COPY[status]}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status === "unverified" || status === "rejected" ? (
        <Button
          label="Start verification"
          onPress={handleStart}
          loading={submitting}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.ink, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.inkSoft, marginVertical: spacing.lg },
  error: { ...typography.caption, color: colors.statusFlagged, marginBottom: spacing.md },
});

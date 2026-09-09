import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button, Card, TextField } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { isValidEmail, requestOtp } from "../services/authService";

export function EmailEntryScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await requestOtp(email);
      router.push({ pathname: "/(auth)/verify", params: { email: email.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t send the code — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* Onboarding Brand Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🚗</Text>
          </View>
          <Text style={styles.brandTitle}>Welcome to Convoy</Text>
          <Text style={styles.brandTagline}>
            Verified carpooling & road-trip sharing across India.
          </Text>
        </View>

        {/* Auth Card */}
        <Card style={styles.authCard}>
          <Text style={styles.cardHeader}>Sign in or Create Account</Text>
          <Text style={styles.cardDesc}>
            Enter your email to receive a passwordless sign-in code.
          </Text>

          <TextField
            label="Email Address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            error={error}
            leftIcon={<Text style={styles.inputIcon}>✉️</Text>}
            autoFocus
          />

          <Button
            label="Continue with Email"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            variant="primary"
            style={styles.continueBtn}
          />
        </Card>

        {/* Security / Trust Footer */}
        <View style={styles.trustFooter}>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🛡️</Text>
            <Text style={styles.trustText}>Govt ID Verified Community</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🔒</Text>
            <Text style={styles.trustText}>End-to-End Secure Platform</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  logoEmoji: {
    fontSize: 32,
  },
  brandTitle: {
    ...typography.hero,
    color: colors.ink,
    textAlign: "center",
  },
  brandTagline: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  authCard: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.md,
  },
  cardHeader: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: 4,
  },
  cardDesc: {
    ...typography.caption,
    color: colors.inkSoft,
    marginBottom: spacing.lg,
  },
  inputIcon: {
    fontSize: 16,
    color: colors.inkSubtle,
  },
  continueBtn: {
    marginTop: spacing.sm,
    ...shadows.glow,
  },
  trustFooter: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.xxl,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  trustIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  trustText: {
    ...typography.captionBold,
    color: colors.inkSoft,
    fontSize: 11.5,
  },
});

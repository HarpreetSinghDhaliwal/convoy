import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen, Button, Card, TextField } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { requestOtp, verifyOtp } from "../services/authService";
import { useOtpCooldown } from "../hooks/useOtpCooldown";

export function OtpVerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const cooldown = useOtpCooldown();

  async function handleVerify() {
    if (code.trim().length < 6) {
      setError("Please enter the full code sent to your email");
      return;
    }
    setError(undefined);
    setVerifying(true);
    try {
      await verifyOtp(email, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn’t work — please check and try again");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await requestOtp(email);
      cooldown.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t resend code — try again shortly");
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen showBack title="Verification">
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.keyEmoji}>🔑</Text>
        </View>

        <Text style={styles.title}>Enter verification code</Text>
        <Text style={styles.subtitle}>
          We sent a temporary sign-in code to{"\n"}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        <Card style={styles.card}>
          <TextField
            label="Security Code"
            placeholder="e.g. 76422397"
            keyboardType="number-pad"
            maxLength={10}
            value={code}
            onChangeText={setCode}
            error={error}
            leftIcon={<Text style={styles.inputIcon}>🔢</Text>}
            style={styles.codeInput}
            autoFocus
          />

          <Button
            label="Verify & Continue"
            onPress={handleVerify}
            loading={verifying}
            size="lg"
            variant="primary"
            style={styles.verifyBtn}
          />

          <View style={styles.resendWrap}>
            <Button
              label={cooldown.canResend ? "Resend Code" : `Resend available in ${cooldown.secondsLeft}s`}
              onPress={handleResend}
              variant="ghost"
              size="sm"
              loading={resending}
              disabled={!cooldown.canResend}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  keyEmoji: {
    fontSize: 28,
  },
  title: {
    ...typography.hero,
    color: colors.ink,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  emailHighlight: {
    ...typography.bodyMedium,
    color: colors.ink,
    fontWeight: "700",
  },
  card: {
    width: "100%",
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.md,
  },
  inputIcon: {
    fontSize: 16,
  },
  codeInput: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
  verifyBtn: {
    marginTop: spacing.sm,
    ...shadows.glow,
  },
  resendWrap: {
    marginTop: spacing.md,
    alignItems: "center",
  },
});

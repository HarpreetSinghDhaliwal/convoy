import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthSession } from "@/modules/auth";
import { useConsentStatus } from "@/modules/legal";
import { usePhone } from "@/modules/profile";
import { initializeAds } from "@/modules/ads";
import { colors } from "@/theme";

// The one place routing decisions get made based on auth + consent + phone
// state — every other screen just assumes it's fully in one of these
// states and doesn't re-check any of them itself.
export default function RootLayout() {
  const { session, loading: authLoading } = useAuthSession();
  const consent = useConsentStatus();
  const phone = usePhone();

  useEffect(() => {
    initializeAds();
  }, []);

  // Consent/phone status only matter once there's a session to attach them
  // to — don't block the whole app on queries that have no user to run for
  // yet.
  const loading =
    authLoading || (!!session && (consent.loading || phone.loading));

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  const hasSession = !!session;
  const hasConsented = consent.status.complete;
  const hasPhone = phone.hasPhone;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={hasSession && hasConsented && hasPhone}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={hasSession && hasConsented && !hasPhone}>
          <Stack.Screen name="phone" />
        </Stack.Protected>
        <Stack.Protected guard={hasSession && !hasConsented}>
          <Stack.Screen name="consent" />
        </Stack.Protected>
        <Stack.Protected guard={!hasSession}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* Always reachable regardless of auth/consent state — App Store /
            Play Store review and the consent screen itself both need these
            reachable without being logged in or having consented yet. */}
        <Stack.Screen name="legal/terms" options={{ headerShown: true, title: "Terms of Service" }} />
        <Stack.Screen name="legal/privacy" options={{ headerShown: true, title: "Privacy Policy" }} />
        <Stack.Screen name="legal/grievance" options={{ headerShown: true, title: "Grievance Officer" }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = {
  loading: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: colors.paper },
};

import { useState } from "react";
import { Alert, Linking, Share, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { Button } from "@/components";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { useEmergencyContact } from "@/modules/profile";
import { logSosEvent } from "../services/sosService";

// "Live" continuous location tracking to a viewable page needs either a
// paid SMS/tracking service or a custom hosted web viewer — neither is
// free or buildable right now (same category of gap as the DigiLocker
// Partner Org registration). This is the real, working, zero-cost version
// instead: capture location, log it (blueprint's audit trail requirement),
// and hand off to the phone's own native share sheet with a plain Google
// Maps link — works over WhatsApp/SMS the user already has, reaches anyone
// regardless of whether they use Convoy, and needs no delivery
// infrastructure of our own. One-shot, not continuously updating — flagged
// honestly, not silently implied as more than it is.
export function SosButton({ tripId }: { tripId?: string }) {
  const { session } = useAuthSession();
  const { contact } = useEmergencyContact();
  const [triggering, setTriggering] = useState(false);

  async function handleTrigger() {
    if (!session?.user.id) return;
    if (!contact) {
      Alert.alert(
        "No emergency contact set",
        "Add one from Account before SOS can share your location with anyone.",
      );
      return;
    }

    setTriggering(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Location permission needed", "SOS can't share where you are without it.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      await logSosEvent(session.user.id, latitude, longitude, tripId);

      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      await Share.share({
        message: `I need help — this is my current location: ${mapsLink}`,
      });
    } catch (err) {
      Alert.alert("SOS didn't go through", err instanceof Error ? err.message : "Try again");
    } finally {
      setTriggering(false);
    }
  }

  function handleCall112() {
    Linking.openURL("tel:112");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Emergency</Text>
      <Button
        label={triggering ? "Sharing your location…" : "Hold to trigger SOS"}
        onPress={handleTrigger}
        loading={triggering}
      />
      <Button label="Call 112" onPress={handleCall112} variant="secondary" />
      <Text style={styles.note}>
        SOS logs your location and opens your phone&rsquo;s own share sheet to send it to your
        emergency contact — it doesn&rsquo;t send anything automatically on its own.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.statusFlagged,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.statusFlagged,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  note: { ...typography.caption, color: colors.inkSoft, marginTop: spacing.sm },
});

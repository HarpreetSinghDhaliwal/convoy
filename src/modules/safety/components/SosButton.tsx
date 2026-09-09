import { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { Button } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { useEmergencyContact } from "@/modules/profile";
import { logSosEvent } from "../services/sosService";

export function SosButton({ tripId }: { tripId?: string }) {
  const { session } = useAuthSession();
  const { contact } = useEmergencyContact();
  const [modalVisible, setModalVisible] = useState(false);
  const [triggering, setTriggering] = useState(false);

  async function handleTrigger() {
    if (!session?.user.id) return;
    if (!contact) {
      Alert.alert(
        "No emergency contact set",
        "Please add an emergency contact in your Account settings so SOS can send your coordinates.",
      );
      return;
    }

    setTriggering(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Location permission needed", "SOS needs GPS permission to capture your current location.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      await logSosEvent(session.user.id, latitude, longitude, tripId);

      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      await Share.share({
        message: `🚨 Convoy Emergency SOS: I need help — this is my current live location: ${mapsLink}`,
      });
      setModalVisible(false);
    } catch (err) {
      Alert.alert("SOS error", err instanceof Error ? err.message : "Please try again or call 112 directly.");
    } finally {
      setTriggering(false);
    }
  }

  function handleCall112() {
    Linking.openURL("tel:112");
  }

  return (
    <>
      {/* Sleek Compact Header Pill */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [styles.sosPill, pressed && styles.sosPillPressed]}
      >
        <Text style={styles.sosPillIcon}>🚨</Text>
        <Text style={styles.sosPillText}>SOS</Text>
      </Pressable>

      {/* Emergency Action Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>🚨</Text>
              </View>
              <Text style={styles.modalTitle}>Emergency Assistance</Text>
              <Text style={styles.modalSubtitle}>
                Instant safety tools during your roadtrip
              </Text>
            </View>

            <View style={styles.actionGroup}>
              <Button
                label={triggering ? "Capturing Location…" : "📍 Share Location with Emergency Contact"}
                onPress={handleTrigger}
                loading={triggering}
                variant="danger"
                size="md"
              />

              <Button
                label="📞 Call National Emergency (112)"
                onPress={handleCall112}
                variant="secondary"
                size="md"
              />
            </View>

            <Text style={styles.modalNote}>
              SOS logs your exact GPS coordinates and opens your phone&rsquo;s native share sheet to notify your saved emergency contact.
            </Text>

            <Button
              label="Close"
              onPress={() => setModalVisible(false)}
              variant="ghost"
              size="sm"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sosPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.35)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    gap: 4,
  },
  sosPillPressed: {
    backgroundColor: "rgba(220, 38, 38, 0.25)",
    transform: [{ scale: 0.96 }],
  },
  sosPillIcon: {
    fontSize: 12,
  },
  sosPillText: {
    ...typography.captionBold,
    color: colors.statusFlagged,
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
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
    maxWidth: 400,
    ...shadows.lg,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  iconEmoji: {
    fontSize: 24,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.ink,
    textAlign: "center",
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: 2,
  },
  actionGroup: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalNote: {
    ...typography.caption,
    color: colors.inkSubtle,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
  },
});

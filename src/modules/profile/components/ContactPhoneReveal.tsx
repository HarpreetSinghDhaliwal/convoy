import { Linking, StyleSheet, Text } from "react-native";
import { colors, typography } from "@/theme";
import { useTripContactPhone } from "../hooks/useTripContactPhone";

interface ContactPhoneRevealProps {
  tripId: string;
  targetUserId: string;
}

// Drop into IncomingRequestsScreen (Lead sees a requester's number at any
// status) and TripDetailScreen/ChatScreen (approved members see the Lead's
// and each other's). Renders nothing if the RPC says no — that's the
// access rule enforcing itself, not this component's job to second-guess.
export function ContactPhoneReveal({ tripId, targetUserId }: ContactPhoneRevealProps) {
  const { phone, loading } = useTripContactPhone(tripId, targetUserId);

  if (loading || !phone) return null;

  return (
    <Text style={styles.phone} onPress={() => Linking.openURL(`tel:${phone}`)}>
      📞 {phone}
    </Text>
  );
}

const styles = StyleSheet.create({
  phone: { ...typography.caption, color: colors.trust, textDecorationLine: "underline" },
});

import { ScrollView, StyleSheet, Text } from "react-native";
import { Screen } from "@/components";
import { colors, spacing, typography } from "@/theme";

// DRAFT reflecting blueprint §04’s data lifecycle decisions. NOT a
// substitute for review by an actual lawyer before this ships.
export function PrivacyPolicyScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.draftNotice}>
          Draft — pending legal review before launch. Written to be
          consistent with India’s Digital Personal Data Protection Act, 2023.
        </Text>

        <Text style={styles.h2}>What we collect, and why</Text>
        <Text style={styles.body}>
          • Email address — account identity, via OTP.{"\n"}
          • Government ID data, via DigiLocker — confirms you’re a real, accountable person
          before you can host or join a trip. We receive verification status, not a copy of the
          document itself, retained for your account’s lifetime.{"\n"}
          • Location — trip pickup points, route/ETA, and (only if you trigger it) live location
          shared with your emergency contacts during SOS.{"\n"}
          • Trip chat messages — coordination between confirmed trip members.{"\n"}
          • Ratings and reviews you give or receive.
        </Text>

        <Text style={styles.h2}>What’s kept, and for how long</Text>
        <Text style={styles.body}>
          Profile, verification status, ratings, and reviews are kept for as long as your account
          exists — this is what makes the reputation system meaningful, since it can’t reset
          between trips.{"\n\n"}
          Trip chat is different: hidden from the app 2 weeks after a trip ends, then kept in a
          restricted, access-controlled store for 90 days total (90 days from the trip, not from
          when it was hidden), after which it’s permanently deleted. That 90-day window exists
          specifically so a safety report filed after the 2-week mark can still be investigated —
          a genuine, common pattern, not a hypothetical.
        </Text>

        <Text style={styles.h2}>Who we share it with</Text>
        <Text style={styles.body}>
          DigiLocker, for identity verification you initiate. We do not sell your data, and we do
          not share it with other users beyond what’s visibly part of your profile (name, photo,
          Verified badge, rating).
        </Text>

        <Text style={styles.h2}>Your rights</Text>
        <Text style={styles.body}>
          Under the DPDP Act, you can request access to your data, request correction of
          inaccurate data, and request erasure of your account. Erasing your account anonymizes
          ratings/reviews you’re linked to rather than deleting them outright, since a rating
          attributed to no one would break the record for the person on the other side of it.
        </Text>

        <Text style={styles.h2}>Consent</Text>
        <Text style={styles.body}>
          We ask for consent to identity-verification data, location data, and chat data
          separately, not as one bundled agreement — you can see exactly what each covers before
          agreeing to it.
        </Text>

        <Text style={styles.h2}>Contact</Text>
        <Text style={styles.body}>
          See the Grievance Officer page for how to reach us about this policy or your data.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.ink, marginBottom: spacing.sm },
  draftNotice: { ...typography.caption, color: colors.statusPending, marginBottom: spacing.xl },
  h2: { ...typography.h2, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.inkSoft },
});

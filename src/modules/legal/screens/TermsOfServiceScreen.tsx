import { ScrollView, StyleSheet, Text } from "react-native";
import { Screen } from "@/components";
import { colors, spacing, typography } from "@/theme";

// DRAFT reflecting the blueprint’s decisions (§05) — platform-as-coordinator
// framing, Motor Vehicles Act cost-sharing language. NOT a substitute for
// review by an actual lawyer before this ships to real users.
export function TermsOfServiceScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.draftNotice}>
          Draft — pending legal review before launch.
        </Text>

        <Text style={styles.h2}>What Convoy is</Text>
        <Text style={styles.body}>
          Convoy is a coordination platform that connects independent travelers planning trips to
          the same destination. Convoy is not a transportation provider, is not a party to any
          arrangement made between a trip’s Lead and its members, and does not employ or contract
          drivers. When you use Convoy, you’re arranging travel directly with other independent
          travelers — Convoy makes that easier to find and coordinate, nothing more.
        </Text>

        <Text style={styles.h2}>Cost, not fare</Text>
        <Text style={styles.body}>
          Amounts shown on a trip listing are a fixed contribution toward the actual cost of that
          trip — fuel or charging, tolls — set by the Lead, not a commercial fare. Payment happens
          directly between the Lead and trip members, outside the app. Convoy does not process,
          hold, or take a cut of this payment.
        </Text>

        <Text style={styles.h2}>Who can use Convoy</Text>
        <Text style={styles.body}>
          You must be at least 18 years old. Hosting or joining a trip requires identity
          verification — Convoy does not permit anonymous participation in any trip.
        </Text>

        <Text style={styles.h2}>Conduct</Text>
        <Text style={styles.body}>
          You agree not to: harass, threaten, or discriminate against another user; solicit or
          share payment or contact details through trip chat before a request is confirmed;
          post content that is false, misleading, or unrelated to the trip; or attempt to
          circumvent identity verification, reporting, or blocking features.
        </Text>

        <Text style={styles.h2}>Enforcement</Text>
        <Text style={styles.body}>
          Convoy may suspend or remove any account, listing, or message that violates these
          terms. A ban is tied to your verified identity document, not just your account —
          creating a new account does not restore access after a ban.
        </Text>

        <Text style={styles.h2}>Reports and grievances</Text>
        <Text style={styles.body}>
          Every report is reviewed. See the Grievance Officer page for how to escalate a
          complaint about content or platform functionality, and the response timeline we commit
          to.
        </Text>

        <Text style={styles.h2}>Liability</Text>
        <Text style={styles.body}>
          Convoy is not liable for the conduct of any user, the condition of any vehicle, or
          anything that happens during a trip arranged through the app — trips happen between
          independent travelers, at their own arrangement and risk. This does not limit any
          liability that cannot be limited under Indian law.
        </Text>

        <Text style={styles.h2}>Governing law</Text>
        <Text style={styles.body}>These terms are governed by the laws of India.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.ink, marginBottom: spacing.sm },
  draftNotice: {
    ...typography.caption,
    color: colors.statusPending,
    marginBottom: spacing.xl,
  },
  h2: { ...typography.h2, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.inkSoft },
});

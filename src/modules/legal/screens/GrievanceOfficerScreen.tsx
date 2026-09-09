import { ScrollView, StyleSheet, Text } from "react-native";
import { Screen } from "@/components";
import { colors, spacing, typography } from "@/theme";
import { env } from "@/lib/config/env";

// Required in-app under the IT Rules 2021: name/contact published, 24-hour
// acknowledgment and 15-day resolution committed to. Name/phone come from
// env (EXPO_PUBLIC_GRIEVANCE_OFFICER_NAME/PHONE) — currently a stated
// temporary placeholder, swappable there without touching this file. Email
// and address are still genuinely unassigned.
export function GrievanceOfficerScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Grievance Officer</Text>
        <Text style={styles.body}>
          If you have a complaint about content on Convoy or how the platform works, you can
          reach our Grievance Officer directly.
        </Text>

        <Text style={styles.h2}>Contact</Text>
        <Text style={styles.body}>
          Name: {env.grievanceOfficerName ?? "[to be assigned before launch]"}
          {"\n"}
          Phone: {env.grievanceOfficerPhone ?? "[to be assigned before launch]"}
          {"\n"}
          Email: [to be assigned before launch]{"\n"}
          Address: [to be assigned before launch]
        </Text>

        <Text style={styles.h2}>What to expect</Text>
        <Text style={styles.body}>
          Every complaint is acknowledged within 24 hours and resolved within 15 days, per the
          Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules,
          2021.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.ink, marginBottom: spacing.lg },
  h2: { ...typography.h2, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.inkSoft },
});

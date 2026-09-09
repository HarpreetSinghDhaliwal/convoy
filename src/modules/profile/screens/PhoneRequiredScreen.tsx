import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen, Button, TextField, Card, Badge } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { usePhone } from "../hooks/usePhone";

const AVATAR_OPTIONS = [
  { id: "🚗", label: "Roadtripper", desc: "Highway explorer" },
  { id: "⛰️", label: "Mountain Trekker", desc: "High altitude seeker" },
  { id: "🧭", label: "Wayfarer", desc: "Curious traveler" },
  { id: "⛺", label: "Camper", desc: "Nature & starry nights" },
  { id: "🏙️", label: "Urban Commuter", desc: "City carpooler" },
  { id: "🌊", label: "Coastal Nomad", desc: "Coastlines & beaches" },
];

const RELATIONSHIPS = [
  { id: "Parent", label: "👨‍👩‍👧 Parent" },
  { id: "Spouse", label: "💍 Spouse/Partner" },
  { id: "Sibling", label: "🤝 Sibling" },
  { id: "Friend", label: "🫂 Close Friend" },
];

export function PhoneRequiredScreen() {
  const { save, profile } = usePhone();

  // Form State
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.photoUrl ?? "🚗");
  const [emergencyName, setEmergencyName] = useState(profile?.emergencyContact?.name ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyContact?.phone ?? "");
  const [relationship, setRelationship] = useState(profile?.emergencyContact?.relationship ?? "Parent");
  const [pledgeAgreed, setPledgeAgreed] = useState(true);

  // Errors & Loading
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function handleCompleteRegistration() {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError("Please enter your full legal name (at least 2 characters)");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    const emPhoneDigits = emergencyPhone.replace(/\D/g, "");
    if (!emergencyName.trim()) {
      setError("Please provide an Emergency Contact name for trip safety");
      return;
    }
    if (emPhoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit emergency contact phone number");
      return;
    }

    if (!pledgeAgreed) {
      setError("Please agree to the Convoy Safety & Community Pledge to continue");
      return;
    }

    setError(undefined);
    setSaving(true);
    try {
      await save({
        name: trimmedName,
        phone: phoneDigits,
        photoUrl: selectedAvatar,
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emPhoneDigits,
          relationship,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Step Header */}
        <View style={styles.header}>
          <View style={styles.stepBadgeWrap}>
            <Badge label="Step 2 of 2 • Registration" variant="verified" />
          </View>
          <Text style={styles.title}>Create Your Traveler Profile</Text>
          <Text style={styles.subtitle}>
            Convoy connects trusted roadtrippers across India. Set up your verified identity and emergency safety details before hitting the road.
          </Text>
        </View>

        {/* 1. Choose Avatar Persona */}
        <Card style={styles.card}>
          <Text style={styles.cardHeader}>1. CHOOSE TRAVELER PERSONA</Text>
          <Text style={styles.cardSub}>Select an avatar that represents your travel style:</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((opt) => {
              const isSelected = selectedAvatar === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                  onPress={() => setSelectedAvatar(opt.id)}
                >
                  <Text style={styles.avatarEmoji}>{opt.id}</Text>
                  <Text style={[styles.avatarLabel, isSelected && styles.avatarLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.avatarDesc}>{opt.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* 2. Personal & Contact Info */}
        <Card style={styles.card}>
          <Text style={styles.cardHeader}>2. PERSONAL & MOBILE CONTACT</Text>
          <TextField
            label="Full Legal Name"
            placeholder="e.g. Harpreet Singh"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextField
            label="Mobile Number (India +91)"
            placeholder="98765 43210"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
          <View style={styles.privacyNote}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              Your phone number is strictly encrypted and only shared with approved travelers on your confirmed trips.
            </Text>
          </View>
        </Card>

        {/* 3. Emergency Contact (Vital Safety) */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>3. EMERGENCY SAFETY CONTACT</Text>
            <Badge label="Mandatory Safety" variant="pending" />
          </View>
          <Text style={styles.cardSub}>
            Receives your live GPS location and trip info if you ever trigger an SOS.
          </Text>

          <TextField
            label="Emergency Contact Full Name"
            placeholder="e.g. Gurpreet Kaur"
            value={emergencyName}
            onChangeText={setEmergencyName}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Relationship to you</Text>
          <View style={styles.relationshipPills}>
            {RELATIONSHIPS.map((rel) => {
              const isSelected = relationship === rel.id;
              return (
                <Pressable
                  key={rel.id}
                  style={[styles.relPill, isSelected && styles.relPillSelected]}
                  onPress={() => setRelationship(rel.id)}
                >
                  <Text style={[styles.relPillText, isSelected && styles.relPillTextSelected]}>
                    {rel.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextField
            label="Emergency Contact Phone"
            placeholder="98765 43210"
            keyboardType="phone-pad"
            maxLength={10}
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
          />
        </Card>

        {/* 4. Safety Pledge */}
        <Card style={styles.card}>
          <Pressable
            style={styles.pledgeRow}
            onPress={() => setPledgeAgreed(!pledgeAgreed)}
          >
            <View style={[styles.checkbox, pledgeAgreed && styles.checkboxChecked]}>
              {pledgeAgreed && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <View style={styles.pledgeTextWrap}>
              <Text style={styles.pledgeTitle}>Convoy Community & Safety Pledge</Text>
              <Text style={styles.pledgeDesc}>
                I commit to treating fellow roadtrippers with dignity, respecting verified identity rules, and upholding zero harassment tolerance on all journeys.
              </Text>
            </View>
          </Pressable>
        </Card>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit CTA */}
        <Button
          label="Complete Registration & Enter Convoy →"
          onPress={handleCompleteRegistration}
          loading={saving}
          size="lg"
          style={styles.submitBtn}
        />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  stepBadgeWrap: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  card: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cardHeader: {
    ...typography.overline,
    color: colors.inkSubtle,
    marginBottom: spacing.xs,
  },
  cardSub: {
    ...typography.caption,
    color: colors.inkSoft,
    marginBottom: spacing.md,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  avatarOption: {
    width: "31%",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.lineLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  avatarOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  avatarEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  avatarLabel: {
    ...typography.captionBold,
    color: colors.ink,
    textAlign: "center",
    fontSize: 11,
  },
  avatarLabelSelected: {
    color: colors.accent,
  },
  avatarDesc: {
    fontSize: 9,
    color: colors.inkSubtle,
    textAlign: "center",
    marginTop: 2,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  privacyText: {
    ...typography.caption,
    color: colors.inkSoft,
    flex: 1,
    lineHeight: 18,
  },
  fieldLabel: {
    ...typography.captionBold,
    color: colors.ink,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  relationshipPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  relPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  relPillSelected: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  relPillText: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  relPillTextSelected: {
    color: colors.accent,
    fontWeight: "700",
  },
  pledgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxCheckmark: {
    color: colors.paper,
    fontWeight: "bold",
    fontSize: 14,
  },
  pledgeTextWrap: {
    flex: 1,
  },
  pledgeTitle: {
    ...typography.bodyMedium,
    color: colors.ink,
    marginBottom: 2,
  },
  pledgeDesc: {
    ...typography.caption,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  errorIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  errorText: {
    ...typography.captionBold,
    color: colors.statusFlagged,
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});


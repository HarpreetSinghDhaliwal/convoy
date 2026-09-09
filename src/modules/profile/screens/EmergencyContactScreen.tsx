import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button, TextField, Card, Badge } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useEmergencyContact } from "../hooks/useEmergencyContact";

const RELATIONSHIPS = [
  { id: "Parent", label: "👨‍👩‍👧 Parent" },
  { id: "Spouse", label: "💍 Spouse/Partner" },
  { id: "Sibling", label: "🤝 Sibling" },
  { id: "Friend", label: "🫂 Close Friend" },
];

export function EmergencyContactScreen() {
  const { contact, loading, save } = useEmergencyContact();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    function sync() {
      if (contact) {
        setName(contact.name);
        setPhone(contact.phone);
        if (contact.relationship) setRelationship(contact.relationship);
      }
    }
    sync();
  }, [contact]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Please enter your emergency contact's name");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await save({
        name: name.trim(),
        phone: digits,
        relationship,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save emergency contact");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <Screen showBack title="Emergency Contact">
      <Card style={styles.card}>
        <View style={styles.badgeRow}>
          <Badge label="Active Safety Protocol" variant="verified" />
        </View>
        <Text style={styles.title}>Emergency SOS Contact</Text>
        <Text style={styles.body}>
          Required before hosting or joining trips. If you ever trigger an emergency SOS, Convoy instantly shares your live GPS location, route, and co-traveler contact with this person.
        </Text>

        <TextField
          label="Contact Full Name"
          placeholder="e.g. Gurpreet Kaur"
          value={name}
          onChangeText={setName}
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
          label="Mobile Phone (+91)"
          placeholder="98765 43210"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />

        <View style={styles.noticeBox}>
          <Text style={styles.noticeIcon}>🛡️</Text>
          <Text style={styles.noticeText}>
            Never shown to other travelers on regular trips. Strictly reserved for emergency safety dispatches.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Save Emergency Contact"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={styles.saveBtn}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.sm,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.inkSoft,
    marginBottom: spacing.xl,
    lineHeight: 22,
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
  noticeBox: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  noticeText: {
    ...typography.caption,
    color: colors.inkSoft,
    flex: 1,
    lineHeight: 18,
  },
  error: {
    ...typography.captionBold,
    color: colors.statusFlagged,
    marginBottom: spacing.md,
  },
  saveBtn: {
    marginTop: spacing.xs,
  },
});


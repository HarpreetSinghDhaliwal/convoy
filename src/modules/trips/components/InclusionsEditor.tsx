import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import type { TripInclusions } from "../types";

// Common starting suggestions, not an enum — a Lead can add anything as
// free text. Split by section so tapping one is unambiguous (no cycling
// through included/excluded/neither on a single chip).
const INCLUDED_SUGGESTIONS = ["Hotel stay", "Breakfast", "Lunch", "Dinner", "Travel guide", "Fuel & tolls"];
const EXCLUDED_SUGGESTIONS = ["Entry tickets", "Permits", "Personal expenses", "Alcohol", "Adventure activities"];

interface InclusionsEditorProps {
  value: TripInclusions;
  onChange: (next: TripInclusions) => void;
}

export function InclusionsEditor({ value, onChange }: InclusionsEditorProps) {
  const included = value.included ?? [];
  const excluded = value.excluded ?? [];

  function addIncluded(item: string) {
    if (!item.trim() || included.includes(item.trim())) return;
    onChange({ ...value, included: [...included, item.trim()] });
  }
  function addExcluded(item: string) {
    if (!item.trim() || excluded.includes(item.trim())) return;
    onChange({ ...value, excluded: [...excluded, item.trim()] });
  }
  function removeIncluded(item: string) {
    onChange({ ...value, included: included.filter((i) => i !== item) });
  }
  function removeExcluded(item: string) {
    onChange({ ...value, excluded: excluded.filter((i) => i !== item) });
  }

  return (
    <View>
      <TagSection
        title="What's included"
        chosen={included}
        suggestions={INCLUDED_SUGGESTIONS}
        onAdd={addIncluded}
        onRemove={removeIncluded}
        chipColor={colors.statusVerified}
      />
      <TagSection
        title="What's not included"
        chosen={excluded}
        suggestions={EXCLUDED_SUGGESTIONS}
        onAdd={addExcluded}
        onRemove={removeExcluded}
        chipColor={colors.statusFlagged}
      />
    </View>
  );
}

function TagSection({
  title,
  chosen,
  suggestions,
  onAdd,
  onRemove,
  chipColor,
}: {
  title: string;
  chosen: string[];
  suggestions: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  chipColor: string;
}) {
  const [custom, setCustom] = useState("");
  const unchosenSuggestions = suggestions.filter((s) => !chosen.includes(s));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {chosen.length > 0 && (
        <View style={styles.chipRow}>
          {chosen.map((item) => (
            <Pressable key={item} style={[styles.chip, { borderColor: chipColor }]} onPress={() => onRemove(item)}>
              <Text style={[styles.chipText, { color: chipColor }]}>{item} ✕</Text>
            </Pressable>
          ))}
        </View>
      )}

      {unchosenSuggestions.length > 0 && (
        <View style={styles.chipRow}>
          {unchosenSuggestions.map((item) => (
            <Pressable key={item} style={styles.suggestionChip} onPress={() => onAdd(item)}>
              <Text style={styles.suggestionText}>+ {item}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.customRow}>
        <TextInput
          style={styles.customInput}
          placeholder="Add your own..."
          placeholderTextColor={colors.inkSoft}
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={() => {
            onAdd(custom);
            setCustom("");
          }}
        />
        <Pressable
          style={styles.addButton}
          onPress={() => {
            onAdd(custom);
            setCustom("");
          }}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyMedium, color: colors.ink, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  chipText: { ...typography.caption },
  suggestionChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.paperRaised,
  },
  suggestionText: { ...typography.caption, color: colors.inkSoft },
  customRow: { flexDirection: "row", gap: spacing.xs },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.ink,
    backgroundColor: colors.paperRaised,
  },
  addButton: {
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  addButtonText: { ...typography.caption, color: colors.paperRaised },
});

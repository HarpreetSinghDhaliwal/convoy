import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function Stepper({ value, min = 1, max = 8, onChange, label, style }: StepperProps) {
  const canDec = value > min;
  const canInc = value < max;

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.controlRow}>
        <Pressable
          onPress={() => canDec && onChange(value - 1)}
          disabled={!canDec}
          style={({ pressed }) => [
            styles.btn,
            !canDec && styles.btnDisabled,
            pressed && canDec && styles.btnPressed,
          ]}
        >
          <Text style={[styles.btnText, !canDec && styles.btnTextDisabled]}>−</Text>
        </Pressable>

        <View style={styles.valBox}>
          <Text style={styles.valText}>{value}</Text>
        </View>

        <Pressable
          onPress={() => canInc && onChange(value + 1)}
          disabled={!canInc}
          style={({ pressed }) => [
            styles.btn,
            !canInc && styles.btnDisabled,
            pressed && canInc && styles.btnPressed,
          ]}
        >
          <Text style={[styles.btnText, !canInc && styles.btnTextDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  label: {
    ...typography.captionBold,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 3,
    alignSelf: "flex-start",
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  btnDisabled: {
    opacity: 0.4,
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  btnPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  btnText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 22,
  },
  btnTextDisabled: {
    color: colors.inkSubtle,
  },
  valBox: {
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  valText: {
    ...typography.h3,
    color: colors.ink,
    fontWeight: "700",
  },
});

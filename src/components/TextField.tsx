import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          isFocused && styles.inputWrapFocused,
          error ? styles.inputWrapError : null,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.inkSubtle}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.captionBold,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    transitionProperty: "border-color, box-shadow",
  },
  inputWrapFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.paper,
  },
  inputWrapError: {
    borderColor: colors.statusFlagged,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.ink,
    paddingVertical: spacing.sm,
    outlineStyle: "none",
  } as any,
  errorText: {
    ...typography.caption,
    color: colors.statusFlagged,
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    color: colors.inkSubtle,
    marginTop: spacing.xs,
  },
});

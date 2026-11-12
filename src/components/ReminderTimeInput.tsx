import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { THEME } from '../constants/theme';

export function ReminderTimeInput({ label, value, onChange, disabled }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <TextInput
      accessibilityLabel={label}
      style={styles.input}
      value={value}
      onChangeText={onChange}
      editable={!disabled}
      placeholder="HH:MM"
      placeholderTextColor={THEME.colors.textSecondary}
      autoCorrect={false}
      autoCapitalize="none"
      maxLength={5}
      selectTextOnFocus
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minWidth: 70,
    minHeight: 44,
    paddingHorizontal: 8,
    color: THEME.colors.textPrimary,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.cardBackground,
  },
});

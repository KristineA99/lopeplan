// Små byggeklosser som brukes på flere skjermer.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from './theme';

export function Button({
  title, onPress, variant = 'primary', disabled,
}: { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.secondary,
        (pressed || disabled) && { opacity: 0.6 },
      ]}>
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && { color: colors.text },
          variant === 'danger' && { color: '#C0392B' },
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Rad med valg-knapper ("chips"). */
export function Chips<T extends string | number>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <View style={{ marginTop: 20, marginBottom: 8 }}>
      <Text style={styles.label}>{children}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 15, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  hint: { fontSize: 13, color: colors.muted, marginTop: 2 },
});

// Små byggeklosser som brukes på flere skjermer.

import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from './theme';

export function Button({
  title, onPress, variant = 'primary', disabled, flex,
}: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean;
  /** Fyll tilgjengelig bredde i en rad (f.eks. i BottomBar). */
  flex?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        flex !== undefined && { flex },
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

/** Spør "Er du sikker?" – virker både på telefon og i nettleser. */
export function confirm(title: string, message: string, okText: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Avbryt', style: 'cancel' },
    { text: okText, style: 'destructive', onPress: onOk },
  ]);
}

/** Viser en melding – virker både på telefon og i nettleser. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(`${title}\n\n${message}`);
  else Alert.alert(title, message);
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

/** Som Chips, men flere kan velges samtidig (avkrysning). */
export function MultiChips<T extends string | number>({
  options, values, onToggle, locked = [],
}: { options: { label: string; value: T }[]; values: T[]; onToggle: (v: T) => void; locked?: T[] }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = values.includes(o.value);
        const isLocked = locked.includes(o.value);
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => !isLocked && onToggle(o.value)}
            style={[styles.chip, active && styles.chipActive, isLocked && { opacity: 0.7 }]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {active ? '✓ ' : ''}
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Knapper som alltid ligger nederst på skjermen. */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: Math.max(12, insets.bottom) }]}>{children}</View>;
}

/** Bryter med to eller flere valg, f.eks. Kalender | Alle økter. */
export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segment, o.value === value && styles.segmentActive]}>
          <Text style={[styles.segmentText, o.value === value && styles.segmentTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
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
  button: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 12, alignItems: 'center', marginTop: 10 },
  bottomBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 2,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
  },
  segmented: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 12, padding: 3 },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  segmentTextActive: { color: colors.text, fontWeight: '600' },
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

// Skjema der brukeren legger inn målet sitt (F1–F6).
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';

import { MonthCalendar } from '@/components/MonthCalendar';
import { colors, prettyDate } from '@/components/theme';
import { Button, Chips, Label } from '@/components/ui';
import { addDays, todayIso } from '@/plan/dates';
import type { Level } from '@/plan/types';
import { usePlan } from '@/state/PlanContext';

const DISTANCES = [
  { label: '5 km', value: '5' },
  { label: '10 km', value: '10' },
  { label: 'Halvmaraton', value: '21.1' },
  { label: 'Maraton', value: '42.2' },
  { label: 'Egen', value: 'egen' },
];

const LEVELS: { label: string; value: Level }[] = [
  { label: 'Nybegynner', value: 'nybegynner' },
  { label: 'Litt trent', value: 'litt_trent' },
  { label: 'Godt trent', value: 'godt_trent' },
];

const SESSIONS = [
  { label: 'Foreslå for meg', value: 0 },
  ...[2, 3, 4, 5, 6].map((n) => ({ label: String(n), value: n })),
];

/** Tolker tall med komma eller punktum: "7,5" → 7.5 */
const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Tolker tid som "55", "55:30" eller "1:45:00" → minutter. */
function parseTime(s: string): number | undefined {
  const parts = s.trim().split(':').map(Number);
  if (!s.trim() || parts.some((p) => !Number.isFinite(p))) return undefined;
  if (parts.length === 1) return parts[0] || undefined;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  return undefined;
}

export default function GoalScreen() {
  const { makeDraft } = usePlan();
  const today = todayIso();
  const defaultDate = addDays(today, 7 * 10);

  const [distance, setDistance] = useState('10');
  const [customKm, setCustomKm] = useState('');
  const [goalDate, setGoalDate] = useState(defaultDate);
  const [ym, setYm] = useState({ year: Number(defaultDate.slice(0, 4)), month: Number(defaultDate.slice(5, 7)) - 1 });
  const [level, setLevel] = useState<Level>('nybegynner');
  const [sessions, setSessions] = useState(0);
  const [goalTime, setGoalTime] = useState('');
  const [longest, setLongest] = useState('');

  function submit() {
    const distanceKm = distance === 'egen' ? num(customKm) : Number(distance);
    if (!distanceKm) return Alert.alert('Mangler distanse', 'Skriv inn hvor mange km du vil løpe.');
    if (goalTime.trim() && !parseTime(goalTime)) {
      return Alert.alert('Ugyldig tid', 'Skriv tiden som minutter (55) eller t:mm:ss (1:55:00).');
    }

    const error = makeDraft({
      distanceKm,
      goalDate,
      level,
      sessionsPerWeek: sessions || undefined,
      goalTimeMin: parseTime(goalTime),
      currentLongestKm: num(longest),
    });
    if (error) return Alert.alert('Kunne ikke lage plan', error);
    router.push('/forslag');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Label>Hvor langt vil du løpe?</Label>
        <Chips options={DISTANCES} value={distance} onChange={setDistance} />
        {distance === 'egen' && (
          <TextInput
            style={styles.input}
            placeholder="Antall km, f.eks. 7,5"
            keyboardType="decimal-pad"
            value={customKm}
            onChangeText={setCustomKm}
          />
        )}

        <Label hint={`Valgt: ${prettyDate(goalDate)}`}>Når vil du klare det?</Label>
        <MonthCalendar
          year={ym.year}
          month={ym.month}
          onChangeMonth={(year, month) => setYm({ year, month })}
          onPressDay={setGoalDate}
          selected={goalDate}
          today={today}
          minDate={addDays(today, 1)}
        />

        <Label hint="Vær ærlig – planen blir bedre da.">Hvor godt trent er du?</Label>
        <Chips options={LEVELS} value={level} onChange={setLevel} />

        <Label>Hvor mange økter i uka?</Label>
        <Chips options={SESSIONS} value={sessions} onChange={setSessions} />

        <Label hint="Valgfritt. F.eks. 55 (minutter) eller 1:55:00.">Ønsket sluttid</Label>
        <TextInput
          style={styles.input}
          placeholder="Vet ikke"
          keyboardType="numbers-and-punctuation"
          value={goalTime}
          onChangeText={setGoalTime}
        />

        <Label hint="Valgfritt. Hvor langt klarer du å løpe sammenhengende i dag?">Lengste tur nå (km)</Label>
        <TextInput
          style={styles.input}
          placeholder="Vet ikke"
          keyboardType="decimal-pad"
          value={longest}
          onChangeText={setLongest}
        />

        <Button title="Lag treningsplan" onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
  },
});

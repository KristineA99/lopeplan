// Skjema der brukeren legger inn målet sitt (F1–F6, F16, F17).
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { MonthCalendar } from '@/components/MonthCalendar';
import { colors, prettyDate } from '@/components/theme';
import { BottomBar, Button, Chips, Label, MultiChips, notify } from '@/components/ui';
import { addDays, todayIso } from '@/plan/dates';
import type { ChoosableType, Level, Weekday } from '@/plan/types';
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

const WEEKDAYS: { label: string; value: Weekday }[] = [
  { label: 'Man', value: 0 },
  { label: 'Tir', value: 1 },
  { label: 'Ons', value: 2 },
  { label: 'Tor', value: 3 },
  { label: 'Fre', value: 4 },
  { label: 'Lør', value: 5 },
  { label: 'Søn', value: 6 },
];

const TYPES: { label: string; value: ChoosableType }[] = [
  { label: 'Rolig tur', value: 'rolig' },
  { label: 'Langtur', value: 'langtur' },
  { label: 'Bakker', value: 'bakke' },
  { label: 'Tempo', value: 'tempo' },
  { label: 'Intervall', value: 'intervall' },
];

/** Forslag til dager ut fra nivå (kan endres av brukeren). */
const SUGGESTED_DAYS: Record<Level, Weekday[]> = {
  nybegynner: [1, 3, 6],
  litt_trent: [1, 3, 6],
  godt_trent: [1, 3, 4, 6],
};

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

function formatTime(min?: number): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  const s = Math.round((min * 60) % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : s ? `${m}:${pad(s)}` : String(m);
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function GoalScreen() {
  const { makeDraft, plan } = usePlan();
  const today = todayIso();
  // Har brukeren en plan fra før, fyller vi inn det gamle målet.
  const old = plan?.goal;
  const defaultDate = old && old.goalDate > today ? old.goalDate : addDays(today, 7 * 10);
  const standard = ['5', '10', '21.1', '42.2'];

  const [distance, setDistance] = useState(
    old ? (standard.includes(String(old.distanceKm)) ? String(old.distanceKm) : 'egen') : '10',
  );
  const [customKm, setCustomKm] = useState(old && !standard.includes(String(old.distanceKm)) ? String(old.distanceKm) : '');
  const [goalDate, setGoalDate] = useState(defaultDate);
  const [ym, setYm] = useState({ year: Number(defaultDate.slice(0, 4)), month: Number(defaultDate.slice(5, 7)) - 1 });
  const [level, setLevel] = useState<Level>(old?.level ?? 'nybegynner');
  const [days, setDays] = useState<Weekday[]>(old?.trainingDays ?? SUGGESTED_DAYS[old?.level ?? 'nybegynner']);
  const [daysTouched, setDaysTouched] = useState(!!old?.trainingDays);
  const [types, setTypes] = useState<ChoosableType[]>(old?.sessionTypes ?? TYPES.map((t) => t.value));
  const [goalTime, setGoalTime] = useState(formatTime(old?.goalTimeMin));
  const [longest, setLongest] = useState(old?.currentLongestKm ? String(old.currentLongestKm) : '');

  function chooseLevel(l: Level) {
    setLevel(l);
    // Bytt forslag til dager bare hvis brukeren ikke har valgt dager selv.
    if (!daysTouched) setDays(SUGGESTED_DAYS[l]);
  }

  function submit() {
    const distanceKm = distance === 'egen' ? num(customKm) : Number(distance);
    if (!distanceKm) return notify('Mangler distanse', 'Skriv inn hvor mange km du vil løpe.');
    if (days.length < 2) return notify('Velg flere dager', 'Velg minst 2 treningsdager i uka.');
    if (days.length > 6) return notify('Husk hvile', 'Velg maks 6 dager – kroppen trenger minst én hviledag.');
    if (goalTime.trim() && !parseTime(goalTime)) {
      return notify('Ugyldig tid', 'Skriv tiden som minutter (55) eller t:mm:ss (1:55:00).');
    }

    const error = makeDraft({
      distanceKm,
      goalDate,
      level,
      trainingDays: [...days].sort((a, b) => a - b),
      sessionTypes: types,
      goalTimeMin: parseTime(goalTime),
      currentLongestKm: num(longest),
    });
    if (error) return notify('Kunne ikke lage plan', error);
    router.push('/forslag');
  }

  const hardChosen = types.some((t) => t === 'bakke' || t === 'tempo' || t === 'intervall');

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
        <Chips options={LEVELS} value={level} onChange={chooseLevel} />

        <Label hint={`${days.length} økter i uka. Langturen legges helst i helga.`}>
          Hvilke dager vil du trene?
        </Label>
        <MultiChips
          options={WEEKDAYS}
          values={days}
          onToggle={(d) => {
            setDays(toggle(days, d));
            setDaysTouched(true);
          }}
        />

        <Label hint="Rolige turer er grunnmuren i all løpetrening, så de er alltid med.">
          Hvilke økter vil du ha?
        </Label>
        <MultiChips
          options={TYPES}
          values={types}
          locked={['rolig']}
          onToggle={(t) => setTypes(toggle(types, t))}
        />
        {!hardChosen && (
          <Text style={styles.note}>Uten bakker, tempo eller intervall blir alle økter rolige. Det er helt greit!</Text>
        )}

        <Label hint="Valgfritt. F.eks. 55 (minutter) eller 1:55:00.">Ønsket sluttid</Label>
        <TextInput
          style={styles.input}
          placeholder="Vet ikke"
          keyboardType="numbers-and-punctuation"
          value={goalTime}
          onChangeText={setGoalTime}
        />

        <Label hint="Valgfritt. Hvor langt har du løpt sammenhengende den siste tiden?">
          Lengste tur nå (km)
        </Label>
        <TextInput
          style={styles.input}
          placeholder="Vet ikke"
          keyboardType="decimal-pad"
          value={longest}
          onChangeText={setLongest}
        />
      </ScrollView>
      <BottomBar>
        <Button title="Lag treningsplan" onPress={submit} flex={1} />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32 },
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
  note: { fontSize: 13, color: colors.muted, marginTop: 8 },
});

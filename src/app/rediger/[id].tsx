// Endre en enkelt økt: type, mengde og dato, eller slette den (F14, F18).
// Virker både på forslaget (kilde=draft) og på den godkjente planen (kilde=plan).
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MonthCalendar } from '@/components/MonthCalendar';
import { colors, prettyDate, typeColors } from '@/components/theme';
import { BottomBar, Button, Chips, confirm, Label, notify } from '@/components/ui';
import { contentFor } from '@/plan/workouts';
import type { SessionType } from '@/plan/types';
import { usePlan, type PlanSource } from '@/state/PlanContext';

const TYPES: { label: string; value: SessionType }[] = [
  { label: 'Gå/jogg', value: 'gaa_jogg' },
  { label: 'Rolig', value: 'rolig' },
  { label: 'Langtur', value: 'langtur' },
  { label: 'Bakker', value: 'bakke' },
  { label: 'Tempo', value: 'tempo' },
  { label: 'Intervall', value: 'intervall' },
];

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export default function EditSessionScreen() {
  const { id, kilde } = useLocalSearchParams<{ id: string; kilde: PlanSource }>();
  const source: PlanSource = kilde === 'draft' ? 'draft' : 'plan';
  const { draft, plan, updateSession, deleteSession } = usePlan();
  const target = source === 'draft' ? draft : plan;
  const session = target?.sessions.find((s) => s.id === id);

  const [type, setType] = useState<SessionType>(session?.type ?? 'rolig');
  const [amount, setAmount] = useState(
    String(session?.type === 'gaa_jogg' ? session.durationMin ?? 35 : session?.distanceKm ?? 5).replace('.', ','),
  );
  const [date, setDate] = useState(session?.date ?? '');
  const [ym, setYm] = useState({
    year: Number((session?.date ?? '2000-01').slice(0, 4)),
    month: Number((session?.date ?? '2000-01').slice(5, 7)) - 1,
  });

  if (!target || !session) {
    return <Text style={{ padding: 16, color: colors.muted }}>Fant ikke økta.</Text>;
  }

  if (session.type === 'konkurranse') {
    return (
      <View style={{ padding: 16 }}>
        <Text style={styles.body}>
          Dette er måldagen din. Vil du endre den, gå tilbake og velg «Endre mål».
        </Text>
      </View>
    );
  }

  const isMinutes = type === 'gaa_jogg';

  function save() {
    const value = num(amount);
    if (!value) return notify('Mangler mengde', isMinutes ? 'Skriv inn antall minutter.' : 'Skriv inn antall km.');
    const racePace = target!.goal.goalTimeMin ? target!.goal.goalTimeMin / target!.goal.distanceKm : undefined;
    const content = contentFor(type, isMinutes ? { minutes: value } : { km: value }, target!.goal.distanceKm, racePace);
    const error = updateSession(source, session!.id, { ...content, date });
    if (error) return notify('Kunne ikke lagre', error);
    router.back();
  }

  function remove() {
    confirm('Slette økta?', 'Dagen blir en hviledag.', 'Slett', () => {
      deleteSession(source, session!.id);
      router.back();
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: typeColors[type] }]}>
          <Text style={styles.heroTitle}>{TYPES.find((t) => t.value === type)?.label}</Text>
          <Text style={styles.heroSub}>{prettyDate(date)}</Text>
        </View>

        <Label>Type økt</Label>
        <Chips options={TYPES} value={type} onChange={setType} />

        <Label hint={isMinutes ? 'Hele økta, inkludert oppvarming.' : 'Hele økta, inkludert oppvarming og nedjogg.'}>
          {isMinutes ? 'Varighet (minutter)' : 'Distanse (km)'}
        </Label>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Label hint="Trykk på en ny dag for å flytte økta.">Dato</Label>
        <MonthCalendar
          year={ym.year}
          month={ym.month}
          onChangeMonth={(year, month) => setYm({ year, month })}
          onPressDay={setDate}
          selected={date}
          minDate={target.goal.startDate}
        />

        <Button title="Slett økta" variant="danger" onPress={remove} />
      </ScrollView>
      <BottomBar>
        <Button title="Avbryt" variant="secondary" onPress={() => router.back()} flex={1} />
        <Button title="Lagre" onPress={save} flex={1.4} />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32 },
  hero: { borderRadius: 20, padding: 20 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 15, color: '#fff', marginTop: 4 },
  body: { fontSize: 16, color: colors.text, lineHeight: 22 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text,
  },
});

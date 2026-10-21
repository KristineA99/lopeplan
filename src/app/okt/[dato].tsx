// Detaljer for én økt, og registrering av hvordan den gikk (F12, F13, F19).
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, prettyDate, prettyMinutes, typeColors } from '@/components/theme';
import { Button, Card, Chips } from '@/components/ui';
import type { Session, SessionLog } from '@/plan/types';
import { usePlan } from '@/state/PlanContext';

const FEELINGS: { label: string; value: NonNullable<SessionLog['feeling']> }[] = [
  { label: '😌 Lett', value: 'lett' },
  { label: '🙂 Passe', value: 'passe' },
  { label: '😮‍💨 Tung', value: 'tung' },
];

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export default function SessionScreen() {
  const { dato } = useLocalSearchParams<{ dato: string }>();
  const { plan } = usePlan();
  const session = plan?.sessions.find((s) => s.date === dato);

  if (!session) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.muted }}>Ingen økt denne dagen – hviledag! 😌</Text>
      </View>
    );
  }
  return <SessionDetails session={session} />;
}

function SessionDetails({ session }: { session: Session }) {
  const { logSession } = usePlan();
  const [registering, setRegistering] = useState(false);

  const color = typeColors[session.type];
  const amount = session.distanceKm
    ? `${session.distanceKm} km`
    : session.durationMin
      ? prettyMinutes(session.durationMin)
      : '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Stack.Screen
          options={{
            title: prettyDate(session.date),
            headerRight:
              session.type === 'konkurranse'
                ? undefined
                : () => (
                    <Text
                      style={styles.headerButton}
                      onPress={() => router.push({ pathname: '/rediger/[id]', params: { id: session.id, kilde: 'plan' } })}>
                      Rediger
                    </Text>
                  ),
          }}
        />

        <View style={[styles.hero, { backgroundColor: color }]}>
          <Text style={styles.heroTitle}>{session.title}</Text>
          <Text style={styles.heroSub}>
            {amount}
            {session.pace ? ` · ${session.pace} min/km` : ''}
          </Text>
          <Text style={styles.heroWeek}>
            Uke {session.week}
            {session.edited ? ' · endret av deg' : ''}
          </Text>
        </View>

        {/* ---------- Registrering ---------- */}
        {session.log ? (
          <LogSummary session={session} onEdit={() => setRegistering(true)} onUndo={() => logSession(session.id, undefined)} />
        ) : !registering ? (
          <Card>
            <Text style={styles.label}>Hvordan gikk det?</Text>
            <Button title="✓ Gjennomført som planlagt" onPress={() => logSession(session.id, { status: 'som_planlagt' })} />
            <Button title="✏️ Gjennomført, men med endringer" variant="secondary" onPress={() => setRegistering(true)} />
            <Button title="✕ Hoppet over" variant="secondary" onPress={() => logSession(session.id, { status: 'hoppet_over' })} />
          </Card>
        ) : null}

        {registering && (
          <ChangesForm
            session={session}
            onCancel={() => setRegistering(false)}
            onSave={(log) => {
              logSession(session.id, log);
              setRegistering(false);
            }}
          />
        )}

        {/* ---------- Beskrivelse ---------- */}
        <Card>
          <Text style={styles.label}>Hvor hardt?</Text>
          <Text style={styles.body}>{session.effort}</Text>
        </Card>

        <Card>
          <Step n={1} title="Oppvarming" text={session.warmup} />
          <Step n={2} title="Hoveddel" text={session.main} />
          <Step n={3} title="Nedjogg" text={session.cooldown} last />
        </Card>

        <Card style={{ backgroundColor: '#FFF8EC' }}>
          <Text style={styles.label}>💡 Tips</Text>
          <Text style={styles.body}>{session.tip}</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LogSummary({ session, onEdit, onUndo }: { session: Session; onEdit: () => void; onUndo: () => void }) {
  const log = session.log!;
  const title =
    log.status === 'som_planlagt' ? '✓ Gjennomført som planlagt'
    : log.status === 'endret' ? '✓ Gjennomført med endringer'
    : '✕ Hoppet over';
  const details = [
    log.distanceKm && `${log.distanceKm} km`,
    log.durationMin && prettyMinutes(log.durationMin),
    log.feeling && FEELINGS.find((f) => f.value === log.feeling)?.label,
  ].filter(Boolean);

  return (
    <Card style={{ backgroundColor: log.status === 'hoppet_over' ? '#F3F4F6' : '#EAF7EF' }}>
      <Text style={[styles.logTitle, log.status === 'hoppet_over' && { color: colors.muted }]}>{title}</Text>
      {details.length > 0 && <Text style={styles.body}>{details.join(' · ')}</Text>}
      {log.note && <Text style={[styles.body, { marginTop: 4, fontStyle: 'italic' }]}>«{log.note}»</Text>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Endre" variant="secondary" onPress={onEdit} flex={1} />
        <Button title="Angre" variant="secondary" onPress={onUndo} flex={1} />
      </View>
    </Card>
  );
}

function ChangesForm({
  session, onCancel, onSave,
}: { session: Session; onCancel: () => void; onSave: (log: SessionLog) => void }) {
  const prev = session.log;
  const [km, setKm] = useState(String(prev?.distanceKm ?? session.distanceKm ?? '').replace('.', ','));
  const [min, setMin] = useState(String(prev?.durationMin ?? session.durationMin ?? ''));
  const [feeling, setFeeling] = useState<SessionLog['feeling']>(prev?.feeling);
  const [note, setNote] = useState(prev?.note ?? '');

  return (
    <Card>
      <Text style={styles.label}>Hva ble annerledes?</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.small}>Distanse (km)</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={km} onChangeText={setKm} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.small}>Tid (min)</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={min} onChangeText={setMin} placeholder="Valgfritt" />
        </View>
      </View>

      <Text style={[styles.small, { marginTop: 12 }]}>Hvordan føltes det?</Text>
      <Chips options={FEELINGS} value={feeling} onChange={setFeeling} />

      <Text style={[styles.small, { marginTop: 12 }]}>Notat</Text>
      <TextInput
        style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
        multiline
        placeholder="F.eks. kortet ned pga. vondt i leggen"
        value={note}
        onChangeText={setNote}
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Avbryt" variant="secondary" onPress={onCancel} flex={1} />
        <Button
          title="Lagre"
          flex={1.4}
          onPress={() =>
            onSave({
              status: 'endret',
              distanceKm: num(km),
              durationMin: num(min),
              feeling,
              note: note.trim() || undefined,
            })
          }
        />
      </View>
    </Card>
  );
}

function Step({ n, title, text, last }: { n: number; title: string; text: string; last?: boolean }) {
  return (
    <View style={[styles.step, !last && styles.stepBorder]}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.body}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 48 },
  headerButton: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  hero: { borderRadius: 20, padding: 20 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 17, color: '#fff', marginTop: 4, fontWeight: '500' },
  heroWeek: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 2 },
  small: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  body: { fontSize: 16, color: colors.text, lineHeight: 22 },
  logTitle: { fontSize: 17, fontWeight: '700', color: colors.success, marginBottom: 4 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text,
  },
  step: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepNumText: { fontSize: 13, fontWeight: '700', color: colors.text },
});

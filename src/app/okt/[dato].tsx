// Detaljer for én økt (F12, F13).
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, prettyDate, prettyMinutes, typeColors } from '@/components/theme';
import { Button, Card } from '@/components/ui';
import { usePlan } from '@/state/PlanContext';

export default function SessionScreen() {
  const { dato } = useLocalSearchParams<{ dato: string }>();
  const { plan, toggleCompleted } = usePlan();
  const session = plan?.sessions.find((s) => s.date === dato);

  if (!session) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.muted }}>Ingen økt denne dagen – hviledag! 😌</Text>
      </View>
    );
  }

  const color = typeColors[session.type];
  const amount = session.distanceKm
    ? `${session.distanceKm} km`
    : session.durationMin
      ? prettyMinutes(session.durationMin)
      : '';

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: prettyDate(session.date) }} />

      <View style={[styles.hero, { backgroundColor: color }]}>
        <Text style={styles.heroTitle}>{session.title}</Text>
        <Text style={styles.heroSub}>
          {amount}
          {session.pace ? ` · ${session.pace} min/km` : ''}
        </Text>
        <Text style={styles.heroWeek}>Uke {session.week}</Text>
      </View>

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

      <Button
        title={session.completed ? '✓ Fullført – trykk for å angre' : 'Marker som fullført'}
        variant={session.completed ? 'secondary' : 'primary'}
        onPress={() => toggleCompleted(session.id)}
      />
    </ScrollView>
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
  hero: { borderRadius: 20, padding: 20 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 17, color: '#fff', marginTop: 4, fontWeight: '500' },
  heroWeek: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 2 },
  body: { fontSize: 16, color: colors.text, lineHeight: 22 },
  step: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepNumText: { fontSize: 13, fontWeight: '700', color: colors.text },
});

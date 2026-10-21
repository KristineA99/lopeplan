// Viser forslaget før brukeren godkjenner (F7, F8, F9).
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, prettyDate, prettyMinutes, typeColors } from '@/components/theme';
import { Button, Card } from '@/components/ui';
import type { Session } from '@/plan/types';
import { usePlan } from '@/state/PlanContext';

export default function ProposalScreen() {
  const { draft, makeDraft, approveDraft } = usePlan();

  if (!draft) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={styles.muted}>Ingen plan å vise.</Text>
        <Button title="Lag ny plan" onPress={() => router.replace('/mal')} />
      </View>
    );
  }

  const { goal, feasibility } = draft;
  const weeks = new Map<number, Session[]>();
  for (const s of draft.sessions) weeks.set(s.week, [...(weeks.get(s.week) ?? []), s]);
  const totalKm = draft.sessions.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);

  const approve = () => {
    approveDraft();
    router.dismissAll();
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Card>
        <Text style={styles.h2}>
          {goal.distanceKm} km · {prettyDate(goal.goalDate)}
        </Text>
        <Text style={styles.summary}>
          {weeks.size} uker · {draft.sessionsPerWeek} økter i uka · ca. {Math.round(totalKm)} km totalt
        </Text>
        {goal.goalTimeMin && (
          <Text style={styles.summary}>Måltid: {prettyMinutes(goal.goalTimeMin)}</Text>
        )}
      </Card>

      {!feasibility.realistic && (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>⚠️ Litt ambisiøst</Text>
          <Text style={styles.warningText}>{feasibility.message}</Text>
          {feasibility.suggestedDate && (
            <Button
              title={`Flytt til ${prettyDate(feasibility.suggestedDate)}`}
              variant="secondary"
              onPress={() => makeDraft({ ...goal, goalDate: feasibility.suggestedDate! })}
            />
          )}
          {feasibility.suggestedDistanceKm && (
            <Button
              title={`Sikt på ${feasibility.suggestedDistanceKm} km i stedet`}
              variant="secondary"
              onPress={() => makeDraft({ ...goal, distanceKm: feasibility.suggestedDistanceKm! })}
            />
          )}
        </View>
      )}

      {[...weeks.entries()].map(([week, sessions]) => (
        <View key={week}>
          <Text style={styles.weekTitle}>Uke {week}</Text>
          <Card style={{ paddingVertical: 6 }}>
            {sessions.map((s) => (
              <View key={s.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: typeColors[s.type] }]} />
                <Text style={styles.rowDate}>{prettyDate(s.date).split(' ').slice(0, 2).join(' ')}</Text>
                <Text style={styles.rowTitle}>{s.title}</Text>
                <Text style={styles.rowAmount}>
                  {s.distanceKm ? `${s.distanceKm} km` : `${s.durationMin} min`}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ))}

      <Button title="Godkjenn og legg i kalenderen" onPress={approve} />
      <Button title="Endre målet" variant="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 8, paddingBottom: 48 },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  summary: { fontSize: 15, color: colors.muted, marginTop: 4 },
  muted: { color: colors.muted },
  warning: { backgroundColor: colors.warningBg, borderRadius: 16, padding: 16 },
  warningTitle: { fontSize: 16, fontWeight: '700', color: colors.warningText },
  warningText: { fontSize: 15, color: colors.warningText, marginTop: 4, lineHeight: 21 },
  weekTitle: { fontSize: 14, fontWeight: '600', color: colors.muted, marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowDate: { width: 92, fontSize: 14, color: colors.muted },
  rowTitle: { flex: 1, fontSize: 15, color: colors.text },
  rowAmount: { fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
});

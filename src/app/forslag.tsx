// Viser forslaget før brukeren godkjenner (F7, F8, F9, F18).
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, prettyDate, prettyMinutes } from '@/components/theme';
import { BottomBar, Button, Card } from '@/components/ui';
import { WeekList } from '@/components/WeekList';
import { usePlan } from '@/state/PlanContext';

export default function ProposalScreen() {
  const { draft, plan, makeDraft, approveDraft } = usePlan();

  if (!draft) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={styles.muted}>Ingen plan å vise.</Text>
        <Button title="Lag ny plan" onPress={() => router.replace('/mal')} />
      </View>
    );
  }

  const { goal, feasibility } = draft;
  const weeks = new Set(draft.sessions.map((s) => s.week)).size;
  const totalKm = draft.sessions.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);

  const approve = () => {
    approveDraft();
    router.dismissAll();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.page}>
        <Card>
          <Text style={styles.h2}>
            {String(goal.distanceKm).replace('.', ',')} km · {prettyDate(goal.goalDate)}
          </Text>
          <Text style={styles.summary}>
            {weeks} uker · {draft.sessionsPerWeek} økter i uka · ca. {Math.round(totalKm)} km totalt
          </Text>
          {goal.goalTimeMin && <Text style={styles.summary}>Måltid: {prettyMinutes(goal.goalTimeMin)}</Text>}
        </Card>

        {plan && (
          <Text style={styles.note}>
            Når du godkjenner, erstatter denne planen den du har nå.
          </Text>
        )}

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
                title={`Sikt på ${String(feasibility.suggestedDistanceKm).replace('.', ',')} km i stedet`}
                variant="secondary"
                onPress={() => makeDraft({ ...goal, distanceKm: feasibility.suggestedDistanceKm! })}
              />
            )}
          </View>
        )}

        <Text style={styles.hint}>✏️ Trykk på en økt for å endre, flytte eller slette den.</Text>

        <WeekList
          sessions={draft.sessions}
          onPressSession={(s) =>
            router.push({ pathname: '/rediger/[id]', params: { id: s.id, kilde: 'draft' } })
          }
        />
      </ScrollView>

      <BottomBar>
        <Button title="Endre mål" variant="secondary" onPress={() => router.back()} flex={1} />
        <Button title="Godkjenn plan" onPress={approve} flex={1.4} />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 8, paddingBottom: 24 },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  summary: { fontSize: 15, color: colors.muted, marginTop: 4 },
  muted: { color: colors.muted },
  note: { fontSize: 13, color: colors.muted },
  hint: { fontSize: 14, color: colors.muted, marginTop: 8 },
  warning: { backgroundColor: colors.warningBg, borderRadius: 16, padding: 16 },
  warningTitle: { fontSize: 16, fontWeight: '700', color: colors.warningText },
  warningText: { fontSize: 15, color: colors.warningText, marginTop: 4, lineHeight: 21 },
});

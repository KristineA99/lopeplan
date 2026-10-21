// Innstillinger: endre mål eller slette planen (F15). Ligger litt bortgjemt med vilje.
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, prettyDate, prettyMinutes } from '@/components/theme';
import { Button, Card, confirm } from '@/components/ui';
import { usePlan } from '@/state/PlanContext';

const LEVEL_NAMES = { nybegynner: 'Nybegynner', litt_trent: 'Litt trent', godt_trent: 'Godt trent' };
const DAY_NAMES = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];

export default function SettingsScreen() {
  const { plan, loading, deletePlan } = usePlan();

  if (loading) return null;
  if (!plan) return <Text style={{ padding: 16, color: colors.muted }}>Du har ingen plan ennå.</Text>;
  const g = plan.goal;

  const confirmDelete = () =>
    confirm('Slette planen?', 'Alle økter og registreringer blir borte. Dette kan ikke angres.', 'Slett', () => {
      deletePlan();
      router.dismissAll();
    });

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.section}>Ditt mål</Text>
      <Card>
        <Row label="Distanse" value={`${String(g.distanceKm).replace('.', ',')} km`} />
        <Row label="Måldato" value={prettyDate(g.goalDate)} />
        <Row label="Nivå" value={LEVEL_NAMES[g.level]} />
        {g.trainingDays && <Row label="Dager" value={g.trainingDays.map((d) => DAY_NAMES[d]).join(', ')} />}
        {g.goalTimeMin && <Row label="Måltid" value={prettyMinutes(g.goalTimeMin)} last />}
      </Card>
      <Button title="Endre mål og lag ny plan" variant="secondary" onPress={() => router.push('/mal')} />
      <Text style={styles.note}>
        Du får se det nye forslaget før det erstatter planen du har nå.
      </Text>

      <View style={{ height: 48 }} />

      <Text style={styles.section}>Faresone</Text>
      <Button title="Slett planen" variant="danger" onPress={confirmDelete} />
    </ScrollView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48 },
  section: { fontSize: 13, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  note: { fontSize: 13, color: colors.muted, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 15, color: colors.muted },
  rowValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
});

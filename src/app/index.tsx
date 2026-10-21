// Startsiden: velkomst hvis ingen plan finnes, ellers kalenderen (F10, F11, F15).
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MonthCalendar } from '@/components/MonthCalendar';
import { colors, prettyDate, typeColors, typeNames } from '@/components/theme';
import { Button, Card } from '@/components/ui';
import { todayIso } from '@/plan/dates';
import type { SessionType } from '@/plan/types';
import { usePlan } from '@/state/PlanContext';

export default function Home() {
  const { plan, loading, deletePlan } = usePlan();
  const today = todayIso();
  const [ym, setYm] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />;
  }

  // ---------- Ingen plan ennå ----------
  if (!plan) {
    return (
      <View style={styles.welcome}>
        <Text style={styles.emoji}>🏃‍♀️</Text>
        <Text style={styles.h1}>Nå løpemålet ditt</Text>
        <Text style={styles.lead}>
          Fortell hva du vil klare og innen når, så lager appen en treningsplan og legger øktene i
          kalenderen din.
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Button title="Lag ny plan" onPress={() => router.push('/mal')} />
        </View>
        <Text style={styles.disclaimer}>
          Appen gir generelle treningsforslag og erstatter ikke råd fra lege eller trener.
        </Text>
      </View>
    );
  }

  // ---------- Kalender ----------
  const markers: Record<string, { color: string; done?: boolean }> = {};
  for (const s of plan.sessions) markers[s.date] = { color: typeColors[s.type], done: s.completed };

  const next = plan.sessions.find((s) => s.date >= today && !s.completed);
  const done = plan.sessions.filter((s) => s.completed).length;
  const usedTypes = [...new Set(plan.sessions.map((s) => s.type))] as SessionType[];

  const confirmDelete = () =>
    Alert.alert('Slette planen?', 'Alle økter og fremgang blir borte.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Slett', style: 'destructive', onPress: deletePlan },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.goal}>
        Mål: {plan.goal.distanceKm} km · {prettyDate(plan.goal.goalDate)}
      </Text>
      <Text style={styles.progress}>
        {done} av {plan.sessions.length} økter fullført
      </Text>

      {next && (
        <Pressable onPress={() => router.push(`/okt/${next.date}`)}>
          <Card style={{ ...styles.nextCard, borderLeftColor: typeColors[next.type] }}>
            <Text style={styles.nextLabel}>
              {next.date === today ? 'I dag' : 'Neste økt'} · {prettyDate(next.date)}
            </Text>
            <Text style={styles.nextTitle}>{next.title}</Text>
            <Text style={styles.nextMain}>{next.main}</Text>
          </Card>
        </Pressable>
      )}

      <MonthCalendar
        year={ym.year}
        month={ym.month}
        onChangeMonth={(year, month) => setYm({ year, month })}
        markers={markers}
        today={today}
        onPressDay={(iso) => {
          if (markers[iso]) router.push(`/okt/${iso}`);
        }}
      />

      <View style={styles.legend}>
        {usedTypes.map((t) => (
          <View key={t} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: typeColors[t] }]} />
            <Text style={styles.legendText}>{typeNames[t]}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.help}>Trykk på en farget dag for å se økta.</Text>

      <Button title="Slett plan og start på nytt" variant="danger" onPress={confirmDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 64, marginBottom: 12 },
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
  lead: { fontSize: 16, color: colors.muted, textAlign: 'center', marginVertical: 16, lineHeight: 22 },
  disclaimer: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 24 },
  page: { padding: 16, gap: 12, paddingBottom: 40 },
  goal: { fontSize: 18, fontWeight: '600', color: colors.text },
  progress: { fontSize: 14, color: colors.muted, marginTop: -6 },
  nextCard: { borderLeftWidth: 5 },
  nextLabel: { fontSize: 13, color: colors.muted },
  nextTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  nextMain: { fontSize: 15, color: colors.text, marginTop: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13, color: colors.text },
  help: { fontSize: 13, color: colors.muted },
});

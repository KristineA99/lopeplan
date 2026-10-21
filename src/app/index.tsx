// Startsiden: velkomst hvis ingen plan finnes, ellers kalender eller liste (F10, F11).
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MonthCalendar, type Marker } from '@/components/MonthCalendar';
import { colors, prettyDate, typeColors, typeNames } from '@/components/theme';
import { Button, Card, Segmented } from '@/components/ui';
import { WeekList } from '@/components/WeekList';
import { todayIso } from '@/plan/dates';
import type { SessionType } from '@/plan/types';
import { usePlan } from '@/state/PlanContext';

type View_ = 'kalender' | 'liste';

export default function Home() {
  const { plan, loading } = usePlan();
  const today = todayIso();
  const [ym, setYm] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
  const [view, setView] = useState<View_>('kalender');

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

  // ---------- Plan ----------
  const markers: Record<string, Marker> = {};
  for (const s of plan.sessions) {
    markers[s.date] = {
      color: typeColors[s.type],
      status: s.log?.status === 'hoppet_over' ? 'skipped' : s.completed ? 'done' : undefined,
    };
  }

  const next = plan.sessions.find((s) => s.date >= today && !s.log);
  const done = plan.sessions.filter((s) => s.completed).length;
  const doneKm = plan.sessions.reduce((sum, s) => sum + (s.completed ? (s.log?.distanceKm ?? s.distanceKm ?? 0) : 0), 0);
  const usedTypes = [...new Set(plan.sessions.map((s) => s.type))] as SessionType[];
  const openSession = (date: string) => router.push({ pathname: '/okt/[dato]', params: { dato: date } });

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/innstillinger')} hitSlop={12}>
              <Text style={styles.headerButton}>Innstillinger</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.goal}>
          Mål: {String(plan.goal.distanceKm).replace('.', ',')} km · {prettyDate(plan.goal.goalDate)}
        </Text>
        <Text style={styles.progress}>
          {done} av {plan.sessions.length} økter gjennomført · {Math.round(doneKm)} km løpt
        </Text>

        {next && (
          <Pressable onPress={() => openSession(next.date)}>
            <Card style={{ ...styles.nextCard, borderLeftColor: typeColors[next.type] }}>
              <Text style={styles.nextLabel}>
                {next.date === today ? 'I dag' : 'Neste økt'} · {prettyDate(next.date)}
              </Text>
              <Text style={styles.nextTitle}>{next.title}</Text>
              <Text style={styles.nextMain}>{next.main}</Text>
            </Card>
          </Pressable>
        )}

        <Segmented
          options={[
            { label: 'Kalender', value: 'kalender' },
            { label: 'Alle økter', value: 'liste' },
          ]}
          value={view}
          onChange={setView}
        />

        {view === 'kalender' ? (
          <>
            <MonthCalendar
              year={ym.year}
              month={ym.month}
              onChangeMonth={(year, month) => setYm({ year, month })}
              markers={markers}
              today={today}
              onPressDay={(iso) => markers[iso] && openSession(iso)}
            />
            <View style={styles.legend}>
              {usedTypes.map((t) => (
                <View key={t} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: typeColors[t] }]} />
                  <Text style={styles.legendText}>{typeNames[t]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.help}>Trykk på en farget dag for å se og registrere økta.</Text>
          </>
        ) : (
          <>
            <Text style={styles.help}>✓ gjennomført · ✓* med endringer · ✕ hoppet over · ✏️ endret av deg</Text>
            <WeekList sessions={plan.sessions} showStatus today={today} onPressSession={(s) => openSession(s.date)} />
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 64, marginBottom: 12 },
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
  lead: { fontSize: 16, color: colors.muted, textAlign: 'center', marginVertical: 16, lineHeight: 22 },
  disclaimer: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 24 },
  headerButton: { fontSize: 16, color: colors.primary, fontWeight: '500' },
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

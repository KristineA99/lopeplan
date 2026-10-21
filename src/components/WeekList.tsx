// Liste over alle økter, gruppert per uke. Brukes i forslaget og i "Alle økter".
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Session } from '@/plan/types';
import { colors, prettyDate, typeColors } from './theme';
import { Card } from './ui';

function statusIcon(s: Session): string {
  if (s.log?.status === 'hoppet_over') return '✕';
  if (s.log?.status === 'endret') return '✓*';
  if (s.completed) return '✓';
  return '';
}

export function WeekList({
  sessions, onPressSession, showStatus, today,
}: {
  sessions: Session[];
  onPressSession: (s: Session) => void;
  showStatus?: boolean;
  today?: string;
}) {
  const weeks = new Map<number, Session[]>();
  for (const s of sessions) weeks.set(s.week, [...(weeks.get(s.week) ?? []), s]);

  return (
    <View style={{ gap: 4 }}>
      {[...weeks.entries()].map(([week, list]) => {
        const km = list.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);
        return (
          <View key={week}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Uke {week}</Text>
              {km > 0 && <Text style={styles.weekKm}>{Math.round(km)} km</Text>}
            </View>
            <Card style={{ paddingVertical: 4 }}>
              {list.map((s, i) => (
                <Pressable
                  key={s.id}
                  onPress={() => onPressSession(s)}
                  style={({ pressed }) => [
                    styles.row,
                    i < list.length - 1 && styles.rowBorder,
                    pressed && { opacity: 0.5 },
                  ]}>
                  <View style={[styles.dot, { backgroundColor: typeColors[s.type] }]} />
                  <Text style={[styles.rowDate, s.date === today && styles.today]}>
                    {prettyDate(s.date).split(' ').slice(0, 2).join(' ')}
                  </Text>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {s.title}
                    {s.edited ? ' ✏️' : ''}
                  </Text>
                  <Text style={styles.rowAmount}>
                    {s.distanceKm ? `${s.distanceKm} km` : `${s.durationMin} min`}
                  </Text>
                  {showStatus && <Text style={styles.status}>{statusIcon(s)}</Text>}
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </Card>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 6 },
  weekTitle: { fontSize: 14, fontWeight: '600', color: colors.muted },
  weekKm: { fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowDate: { width: 92, fontSize: 14, color: colors.muted },
  today: { color: colors.primary, fontWeight: '600' },
  rowTitle: { flex: 1, fontSize: 15, color: colors.text },
  rowAmount: { fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  status: { width: 22, textAlign: 'center', fontSize: 14, color: colors.success, fontWeight: '700' },
  chevron: { fontSize: 20, color: '#C4C7CC', marginLeft: -2 },
});

// En enkel månedskalender uten eksterne pakker.
// Brukes både til å velge måldato og til å vise treningsplanen.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, mondayOf } from '@/plan/dates';
import { colors, MONTHS, WEEKDAYS_SHORT } from './theme';

interface Props {
  year: number;
  /** 0 = januar */
  month: number;
  onChangeMonth: (year: number, month: number) => void;
  onPressDay?: (iso: string) => void;
  /** Farge som skal markeres på en dato, f.eks. { '2027-01-05': '#4C9AFF' } */
  markers?: Record<string, Marker>;
  selected?: string;
  today?: string;
  /** Datoer før denne kan ikke trykkes på. */
  minDate?: string;
}

export interface Marker {
  color: string;
  status?: 'done' | 'skipped';
}

const pad = (n: number) => String(n).padStart(2, '0');

export function MonthCalendar({
  year, month, onChangeMonth, onPressDay, markers = {}, selected, today, minDate,
}: Props) {
  const first = `${year}-${pad(month + 1)}-01`;
  const gridStart = mondayOf(first);
  // 6 uker × 7 dager dekker alle måneder.
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const inMonth = (iso: string) => Number(iso.slice(5, 7)) === month + 1;
  const visibleWeeks = weeks.filter((w) => w.some(inMonth));

  const go = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1));
    onChangeMonth(d.getUTCFullYear(), d.getUTCMonth());
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={() => go(-1)} hitSlop={12} style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>
          {MONTHS[month][0].toUpperCase() + MONTHS[month].slice(1)} {year}
        </Text>
        <Pressable onPress={() => go(1)} hitSlop={12} style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS_SHORT.map((d) => (
          <Text key={d} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      {visibleWeeks.map((week) => (
        <View key={week[0]} style={styles.row}>
          {week.map((iso) => {
            const marker = markers[iso];
            const disabled = !!minDate && iso < minDate;
            const isSelected = iso === selected;
            const isToday = iso === today;
            return (
              <Pressable
                key={iso}
                style={styles.cell}
                disabled={disabled || !onPressDay}
                onPress={() => onPressDay?.(iso)}>
                <View
                  style={[
                    styles.dayCircle,
                    marker && { backgroundColor: marker.color },
                    marker?.status && styles.done,
                    isSelected && styles.selected,
                    isToday && !marker && !isSelected && styles.today,
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      !inMonth(iso) && styles.otherMonth,
                      disabled && styles.disabled,
                      (marker || isSelected) && styles.dayTextOnColor,
                    ]}>
                    {Number(iso.slice(8))}
                  </Text>
                </View>
                {marker?.status === 'done' && <Text style={styles.check}>✓</Text>}
                {marker?.status === 'skipped' && <Text style={[styles.check, { color: '#9CA3AF' }]}>✕</Text>}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.card, borderRadius: 16, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  arrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 28, color: colors.text },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.muted, marginBottom: 4 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15, color: colors.text },
  dayTextOnColor: { color: '#fff', fontWeight: '600' },
  otherMonth: { color: '#C4C7CC' },
  disabled: { color: '#D5D7DB' },
  selected: { backgroundColor: colors.primary },
  today: { borderWidth: 1.5, borderColor: colors.primary },
  done: { opacity: 0.45 },
  check: { position: 'absolute', right: 2, top: 0, fontSize: 11, color: colors.success, fontWeight: '700' },
});

// Farger og tekster som brukes i hele appen.
import type { SessionType } from '@/plan/types';

export const colors = {
  bg: '#F6F7F9',
  card: '#FFFFFF',
  text: '#16181D',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#E8572A', // løpeoransje
  primaryText: '#FFFFFF',
  warningBg: '#FFF4E5',
  warningText: '#8A4B00',
  success: '#1F9D55',
};

/** Én farge per økttype – brukes i kalenderen og på detaljsiden (F11). */
export const typeColors: Record<SessionType, string> = {
  gaa_jogg: '#5FB3A5',
  rolig: '#4C9AFF',
  langtur: '#2D5BD8',
  tempo: '#F2A93B',
  intervall: '#E8572A',
  bakke: '#9B59D0',
  konkurranse: '#D7263D',
};

export const typeNames: Record<SessionType, string> = {
  gaa_jogg: 'Gå/jogg',
  rolig: 'Rolig',
  langtur: 'Langtur',
  tempo: 'Tempo',
  intervall: 'Intervall',
  bakke: 'Bakker',
  konkurranse: 'Måldag',
};

export const MONTHS = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
];
export const WEEKDAYS_SHORT = ['ma', 'ti', 'on', 'to', 'fr', 'lø', 'sø'];
const WEEKDAYS_LONG = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'];

/** '2027-02-28' → 'søndag 28. februar' */
export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return `${WEEKDAYS_LONG[weekday]} ${d}. ${MONTHS[m - 1]}`;
}

/** 55 → '55 min', 125 → '2 t 5 min' */
export function prettyMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h} t ${m} min` : `${m} min`;
}

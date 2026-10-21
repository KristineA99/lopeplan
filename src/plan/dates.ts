// Enkle datofunksjoner uten eksterne biblioteker.
// Vi regner i UTC for å unngå trøbbel med sommertid.

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseDate(toIso).getTime() - parseDate(fromIso).getTime()) / 86_400_000);
}

/** Mandag i samme uke som datoen. */
export function mondayOf(iso: string): string {
  const weekday = (parseDate(iso).getUTCDay() + 6) % 7; // 0 = mandag
  return addDays(iso, -weekday);
}

export function todayIso(): string {
  const now = new Date();
  return formatDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

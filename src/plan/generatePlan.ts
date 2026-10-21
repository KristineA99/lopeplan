// Regelbasert generator for løpeplaner. Ingen AI, ingen nett – bare regler.
// Se README → "Logikken bak treningsplanen".
//
// Planen regnes ut på ulike måter avhengig av nivå:
//  • Nybegynnere starter med gå/jogg målt i MINUTTER, og går over til km etter hvert.
//  • Litt trente og godt trente planlegges etter KM per uke, med et tak som
//    passer for distansen og nivået. Har du allerede løpt langt, starter du
//    nærmere taket – men du blir aldri bedt om å løpe mer enn taket.

import { addDays, daysBetween, mondayOf, todayIso } from './dates';
import type { ChoosableType, Feasibility, Goal, Level, Session, TrainingPlan, Weekday } from './types';
import * as W from './workouts';

// ---------- Regler (justér her) ----------

const STANDARD_DISTANCES = [5, 10, 21.1, 42.2];

/** Lengste langtur planen bygger opp til, per nivå, for 5 / 10 / 21,1 / 42,2 km. */
const PEAK_LONG_KM: Record<Level, number[]> = {
  nybegynner: [5, 10, 18, 30],
  litt_trent: [8, 13, 19, 30],
  godt_trent: [12, 16, 22, 32],
};

/** Høyeste ukevolum (km) planen bygger opp til. */
const PEAK_WEEKLY_KM: Record<Level, number[]> = {
  nybegynner: [15, 22, 32, 45],
  litt_trent: [22, 30, 40, 55],
  godt_trent: [32, 45, 55, 70],
};

/** Antatt lengste tur og ukevolum i dag hvis brukeren ikke har oppgitt noe. */
const DEFAULT_LONGEST_KM: Record<Level, number> = { nybegynner: 2, litt_trent: 5, godt_trent: 10 };
const DEFAULT_WEEKLY_KM: Record<Level, number> = { nybegynner: 8, litt_trent: 15, godt_trent: 28 };

/** Ingen enkeltøkt (utenom langtur) skal være lengre enn dette. */
const MAX_EASY_KM = 14;
const MAX_HARD_KM = 12;
const MAX_LONG_KM = 35;

/** Foreslåtte treningsdager (0 = mandag) når brukeren ikke har valgt selv. */
const DEFAULT_DAYS: Record<number, Weekday[]> = {
  2: [2, 6],
  3: [1, 3, 6],
  4: [1, 3, 4, 6],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 3, 4, 6],
};
const DEFAULT_SESSIONS: Record<Level, number> = { nybegynner: 3, litt_trent: 3, godt_trent: 4 };

/** Veiledende minimum antall uker (brukes når vi ikke vet hvor langt brukeren løper i dag). */
const MIN_WEEKS: Record<Level, (number | null)[]> = {
  nybegynner: [8, 12, 20, null],
  litt_trent: [4, 8, 12, 20],
  godt_trent: [2, 4, 8, 14],
};

const GROWTH = 0.1; // 10 % økning per uke
const MIN_GROWTH_KM = 0.5; // minste økning for de som starter lavt
const DELOAD_EVERY = 4; // hver 4. uke er lettere
const DELOAD_FACTOR = 0.75;

// ---------- Hjelpefunksjoner ----------

/** Slår opp i en tabell for 5/10/21,1/42,2 km og regner ut verdier imellom. */
function lookup(table: number[], distanceKm: number): number {
  const d = STANDARD_DISTANCES;
  if (distanceKm <= d[0]) return Math.max(2, (table[0] * distanceKm) / d[0]);
  for (let i = 1; i < d.length; i++) {
    if (distanceKm <= d[i]) {
      const t = (distanceKm - d[i - 1]) / (d[i] - d[i - 1]);
      return table[i - 1] + t * (table[i] - table[i - 1]);
    }
  }
  return (table[3] * distanceKm) / d[3];
}

export function peakLongRunKm(distanceKm: number, level: Level = 'litt_trent'): number {
  return Math.min(MAX_LONG_KM, lookup(PEAK_LONG_KM[level], distanceKm));
}

function taperWeeks(distanceKm: number): number {
  return distanceKm >= 21 ? 2 : 1;
}

function tableMinWeeks(distanceKm: number, level: Level): number | null {
  const i = STANDARD_DISTANCES.findIndex((d) => distanceKm <= d);
  return MIN_WEEKS[level][i === -1 ? 3 : i];
}

/** Verdier for hver oppbyggingsuke: øker med 10 %, hver 4. uke er lettere. */
function progression(start: number, peak: number, weeks: number): number[] {
  const result: number[] = [];
  let current = Math.min(start, peak);
  for (let w = 1; w <= weeks; w++) {
    if (w % DELOAD_EVERY === 0) {
      result.push(current * DELOAD_FACTOR);
    } else {
      if (w > 1) current = Math.min(peak, current + Math.max(MIN_GROWTH_KM, current * GROWTH));
      result.push(current);
    }
  }
  return result;
}

function startLongKm(goal: Goal): number {
  return goal.currentLongestKm ?? DEFAULT_LONGEST_KM[goal.level];
}

function weeksNeeded(goal: Goal): number | null {
  const table = tableMinWeeks(goal.distanceKm, goal.level);
  if (table === null && goal.currentLongestKm === undefined) return null;

  const peak = peakLongRunKm(goal.distanceKm, goal.level);
  const start = startLongKm(goal);
  let weeks = 1;
  while (weeks < 200 && progression(start, peak, weeks).at(-1)! < peak - 0.01) weeks++;
  const computed = weeks + taperWeeks(goal.distanceKm);

  // Vet vi hvor langt brukeren løper i dag, stoler vi på utregningen.
  // Ellers bruker vi den veiledende tabellen som et minimum.
  if (goal.currentLongestKm !== undefined) return computed;
  return Math.max(computed, table ?? computed);
}

const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
const prettyKm = (n: number) => String(n).replace('.', ',');
const prettyDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${MONTHS[m - 1]} ${y}`;
};

function checkFeasibility(goal: Goal, start: string, weeksAvailable: number): Feasibility {
  const needed = weeksNeeded(goal);
  if (needed === null) {
    return {
      realistic: false,
      weeksAvailable,
      weeksNeeded: Infinity,
      suggestedDistanceKm: 21.1,
      message: 'Maraton anbefales ikke som første mål for nybegynnere. Vil du sikte på halvmaraton først?',
    };
  }
  if (needed <= weeksAvailable) return { realistic: true, weeksAvailable, weeksNeeded: needed };

  const suggestedDate = addDays(mondayOf(start), (needed - 1) * 7 + 6);
  const suggestedDistanceKm = [...STANDARD_DISTANCES]
    .reverse()
    .find((d) => d < goal.distanceKm && (weeksNeeded({ ...goal, distanceKm: d }) ?? Infinity) <= weeksAvailable);

  let message = `Det er litt kort tid til å nå ${prettyKm(goal.distanceKm)} km trygt. Vil du flytte datoen til ${prettyDate(suggestedDate)}`;
  message += suggestedDistanceKm ? `, eller sikte på ${prettyKm(suggestedDistanceKm)} km først?` : '?';

  return { realistic: false, weeksAvailable, weeksNeeded: needed, suggestedDate, suggestedDistanceKm, message };
}

/** Avstand mellom to ukedager, regnet "rundt" uka (søndag og mandag er naboer). */
const dayGap = (a: number, b: number) => Math.min(Math.abs(a - b), 7 - Math.abs(a - b));

/**
 * Bestemmer hvilken dag som er langtur og hvilke som er harde økter.
 * Langtur legges helst i helga. Harde økter legges aldri på dager rett etter hverandre,
 * og helst ikke rett før eller etter langturen.
 */
export function assignDays(days: Weekday[], hardCount: number, withLong: boolean) {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const longDay = withLong ? (sorted.includes(6) ? 6 : sorted.includes(5) ? 5 : sorted.at(-1)!) : undefined;
  const candidates = sorted
    .filter((d) => d !== longDay)
    .sort((a, b) => (longDay === undefined ? 0 : dayGap(b, longDay) - dayGap(a, longDay)));

  const hard: Weekday[] = [];
  for (const strict of [true, false]) {
    for (const d of candidates) {
      if (hard.length >= hardCount) break;
      if (hard.includes(d)) continue;
      if (hard.some((h) => dayGap(h, d) < 2)) continue;
      if (strict && longDay !== undefined && dayGap(d, longDay) < 2) continue;
      hard.push(d);
    }
  }
  return { days: sorted, longDay, hardDays: hard.sort((a, b) => a - b) };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ---------- Hovedfunksjonen ----------

export function generatePlan(goal: Goal): TrainingPlan {
  const start = goal.startDate ?? todayIso();
  if (daysBetween(start, goal.goalDate) < 1) throw new Error('Måldatoen må være etter startdatoen.');
  if (goal.distanceKm <= 0) throw new Error('Distansen må være større enn 0.');

  // --- Hvilke dager og økttyper ---
  const wanted = goal.sessionsPerWeek ?? DEFAULT_SESSIONS[goal.level];
  const days: Weekday[] =
    goal.trainingDays && goal.trainingDays.length >= 1
      ? goal.trainingDays
      : DEFAULT_DAYS[clamp(wanted, 2, 6)];
  if (days.length > 6) throw new Error('Velg maks 6 treningsdager – kroppen trenger minst én hviledag.');

  const types = new Set<ChoosableType>(goal.sessionTypes ?? ['rolig', 'langtur', 'bakke', 'tempo', 'intervall']);
  const hardTypes = (['bakke', 'tempo', 'intervall'] as const).filter((t) => types.has(t));
  const withLong = types.has('langtur') && days.length >= 2;
  const maxHard = days.length >= 5 && goal.level !== 'nybegynner' ? 2 : 1;
  const hardCount = hardTypes.length > 0 && days.length >= 2 ? maxHard : 0;
  const { days: pattern, longDay, hardDays } = assignDays(days, hardCount, withLong);
  const sessionsPerWeek = pattern.length;
  const racePace = goal.goalTimeMin ? goal.goalTimeMin / goal.distanceKm : undefined;

  // --- Uker ---
  const firstMonday = mondayOf(start);
  const totalWeeks = daysBetween(firstMonday, mondayOf(goal.goalDate)) / 7 + 1;
  const taper = Math.min(taperWeeks(goal.distanceKm), totalWeeks - 1);
  const buildWeeks = totalWeeks - taper;

  // --- Mengde: start og tak avhenger av nivå og distanse ---
  const peakLong = peakLongRunKm(goal.distanceKm, goal.level);
  // Taket for ukevolum skaleres ned hvis brukeren trener få dager.
  const peakWeekly = Math.min(
    lookup(PEAK_WEEKLY_KM[goal.level], goal.distanceKm),
    peakLong + (sessionsPerWeek - 1) * MAX_EASY_KM,
  );
  // Selv godt trente starter litt under toppen, så planen har en oppbygging
  // (men ikke under det de faktisk har løpt, hvis det er lavere).
  const startLong = Math.min(peakLong * 0.75, startLongKm(goal));
  const startWeekly = Math.min(
    peakWeekly * 0.8,
    goal.currentLongestKm !== undefined
      ? Math.max(DEFAULT_WEEKLY_KM[goal.level] * 0.6, goal.currentLongestKm * 2.2)
      : DEFAULT_WEEKLY_KM[goal.level],
  );
  const longRuns = progression(startLong, peakLong, buildWeeks);
  const weeklyRuns = progression(startWeekly, peakWeekly, buildWeeks);

  // Nybegynnere som ikke kan løpe 3 km sammenhengende starter med gå/jogg.
  const needsWalkJog = goal.level === 'nybegynner' && startLong < 3;
  const beginnerWeeks = needsWalkJog ? Math.ceil(buildWeeks * 0.4) : 0;
  const minEasy = goal.level === 'nybegynner' ? 2 : 3;

  const planId = `plan-${Date.now().toString(36)}`;
  const sessions: Session[] = [];
  const push = (date: string, week: number, content: W.WorkoutContent) => {
    if (daysBetween(start, date) < 0 || daysBetween(date, goal.goalDate) < 0) return;
    sessions.push({ id: `${planId}-${date}`, date, week, completed: false, ...content });
  };

  for (let week = 1; week <= totalWeeks; week++) {
    const monday = addDays(firstMonday, (week - 1) * 7);

    // Måluka: et par korte, rolige turer og så måldagen.
    if (week === totalWeeks) {
      let easyRuns = 0;
      for (const day of pattern) {
        const date = addDays(monday, day);
        if (daysBetween(date, goal.goalDate) < 2 || easyRuns >= 2) continue;
        push(date, week, W.rolig(clamp(peakLong * 0.25, 2, 8), racePace));
        easyRuns++;
      }
      push(goal.goalDate, week, W.konkurranse(goal.distanceKm, racePace));
      continue;
    }

    // Nybegynnerfase: bare gå/jogg, målt i minutter.
    if (week <= beginnerWeeks) {
      const progress = beginnerWeeks > 1 ? (week - 1) / (beginnerWeeks - 1) : 1;
      for (const day of pattern) push(addDays(monday, day), week, W.gaaJogg(progress));
      continue;
    }

    const isTaper = week > buildWeeks;
    const longKm = withLong ? (isTaper ? peakLong * 0.7 : longRuns[week - 1]) : 0;
    const weeklyKm = isTaper ? peakWeekly * 0.65 : weeklyRuns[week - 1];

    const nHard = hardDays.length;
    const hardKm = clamp(weeklyKm * 0.18, 4, MAX_HARD_KM);
    const easyCount = pattern.length - nHard - (withLong ? 1 : 0);
    const easyCap = withLong ? Math.min(MAX_EASY_KM, Math.max(minEasy, longKm * 0.65)) : MAX_EASY_KM;
    const easyKm = clamp((weeklyKm - longKm - hardKm * nHard) / Math.max(1, easyCount), minEasy, easyCap);

    const earlyPhase = week <= beginnerWeeks + Math.max(2, Math.ceil((buildWeeks - beginnerWeeks) / 3));

    for (const day of pattern) {
      const date = addDays(monday, day);
      if (day === longDay) {
        push(date, week, W.langtur(Math.max(longKm, easyKm), racePace));
      } else if (hardDays.includes(day as Weekday)) {
        // Tidlig: bakker hvis valgt. Senere: veksle mellom de valgte harde øktene.
        const later = hardTypes.filter((t) => t !== 'bakke');
        const pool = earlyPhase && hardTypes.includes('bakke') ? ['bakke' as const] : later.length ? later : hardTypes;
        const type = pool[(week + hardDays.indexOf(day as Weekday)) % pool.length];
        const km = Math.min(hardKm, withLong ? Math.max(3, longKm * 0.8) : MAX_HARD_KM);
        push(date, week, type === 'bakke' ? W.bakke(km) : type === 'tempo' ? W.tempo(km, racePace) : W.intervall(km, goal.distanceKm, racePace));
      } else {
        push(date, week, W.rolig(easyKm, racePace));
      }
    }
  }

  return {
    id: planId,
    goal,
    sessionsPerWeek,
    createdDate: todayIso(),
    approved: false,
    feasibility: checkFeasibility(goal, start, totalWeeks),
    sessions,
  };
}

// Regelbasert generator for løpeplaner. Ingen AI, ingen nett – bare regler.
// Se README → "Logikken bak treningsplanen".

import { addDays, daysBetween, mondayOf, todayIso } from './dates';
import type { Feasibility, Goal, Level, Session, TrainingPlan } from './types';
import * as W from './workouts';

// ---------- Regler (justér her) ----------

/** Antatt lengste tur i dag hvis brukeren ikke har oppgitt det. */
const DEFAULT_LONGEST_KM: Record<Level, number> = { nybegynner: 2, litt_trent: 5, godt_trent: 10 };

/** Foreslått antall økter per uke. */
const DEFAULT_SESSIONS: Record<Level, number> = { nybegynner: 3, litt_trent: 3, godt_trent: 4 };

/** Veiledende minimum antall uker per distanse (5 / 10 / 21,1 / 42,2 km). null = ikke anbefalt. */
const STANDARD_DISTANCES = [5, 10, 21.1, 42.2];
const MIN_WEEKS: Record<Level, (number | null)[]> = {
  nybegynner: [8, 12, 20, null],
  litt_trent: [4, 8, 12, 20],
  godt_trent: [2, 4, 8, 14],
};

/** Hvor stor andel av ukevolumet langturen er, etter antall økter. */
const LONG_SHARE: Record<number, number> = { 2: 0.5, 3: 0.4, 4: 0.33, 5: 0.28, 6: 0.25 };

/** Hvilke ukedager det trenes (0 = mandag). Langtur er alltid siste dag. */
const WEEK_PATTERN: Record<number, number[]> = {
  2: [1, 5],
  3: [1, 3, 6],
  4: [1, 2, 4, 6],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 3, 4, 6],
};

/** Hvilke plasser i WEEK_PATTERN som kan være harde økter (aldri to dager på rad). */
const HARD_SLOTS: Record<number, number[]> = {
  2: [0],
  3: [0],
  4: [0],
  5: [1, 2],
  6: [1, 3],
};

const GROWTH = 0.1; // 10 % økning per uke
const MIN_GROWTH_KM = 0.5; // minste økning for de som starter lavt
const DELOAD_EVERY = 4; // hver 4. uke er lettere
const DELOAD_FACTOR = 0.75;

// ---------- Hjelpefunksjoner ----------

/** Hvor lang den lengste treningsturen bør bli før måldagen. */
export function peakLongRunKm(distanceKm: number): number {
  return distanceKm <= 10 ? distanceKm : Math.min(32, distanceKm * 0.85);
}

function taperWeeks(distanceKm: number): number {
  return distanceKm >= 21 ? 2 : 1;
}

function tableMinWeeks(distanceKm: number, level: Level): number | null {
  const i = STANDARD_DISTANCES.findIndex((d) => distanceKm <= d);
  return MIN_WEEKS[level][i === -1 ? 3 : i];
}

/** Lengste tur for hver oppbyggingsuke, med 10 %-regelen og lette uker. */
function longRunProgression(startKm: number, peakKm: number, weeks: number): number[] {
  const result: number[] = [];
  let current = startKm;
  for (let w = 1; w <= weeks; w++) {
    if (w % DELOAD_EVERY === 0) {
      result.push(current * DELOAD_FACTOR);
    } else {
      if (w > 1) current = Math.min(peakKm, current + Math.max(MIN_GROWTH_KM, current * GROWTH));
      result.push(current);
    }
  }
  return result;
}

/** Hvor mange uker som trengs for å bygge seg opp fra start til topp (inkl. nedtrapping). */
function weeksNeeded(goal: Goal): number | null {
  const start = goal.currentLongestKm ?? DEFAULT_LONGEST_KM[goal.level];
  const peak = peakLongRunKm(goal.distanceKm);
  let weeks = 1;
  while (weeks < 200 && longRunProgression(start, peak, weeks).at(-1)! < peak - 0.01) weeks++;
  const computed = weeks + taperWeeks(goal.distanceKm);
  const table = tableMinWeeks(goal.distanceKm, goal.level);
  if (table === null) return null;
  return Math.max(computed, table);
}

function checkFeasibility(goal: Goal, start: string, weeksAvailable: number): Feasibility {
  const needed = weeksNeeded(goal);
  if (needed === null) {
    return {
      realistic: false,
      weeksAvailable,
      weeksNeeded: Infinity,
      suggestedDistanceKm: 21.1,
      message:
        'Maraton anbefales ikke som første mål for nybegynnere. Vil du sikte på halvmaraton først?',
    };
  }
  if (needed <= weeksAvailable) return { realistic: true, weeksAvailable, weeksNeeded: needed };

  const suggestedDate = addDays(mondayOf(start), (needed - 1) * 7 + 6);
  const suggestedDistanceKm = [...STANDARD_DISTANCES]
    .reverse()
    .find((d) => d < goal.distanceKm && (weeksNeeded({ ...goal, distanceKm: d }) ?? Infinity) <= weeksAvailable);

  let message = `Det er litt kort tid til å nå ${goal.distanceKm} km trygt. Vil du flytte datoen til ${suggestedDate}`;
  message += suggestedDistanceKm ? `, eller sikte på ${suggestedDistanceKm} km først?` : '?';

  return { realistic: false, weeksAvailable, weeksNeeded: needed, suggestedDate, suggestedDistanceKm, message };
}

// ---------- Hovedfunksjonen ----------

export function generatePlan(goal: Goal): TrainingPlan {
  const start = goal.startDate ?? todayIso();
  if (daysBetween(start, goal.goalDate) < 1) throw new Error('Måldatoen må være etter startdatoen.');
  if (goal.distanceKm <= 0) throw new Error('Distansen må være større enn 0.');

  const sessionsPerWeek = Math.min(6, Math.max(2, goal.sessionsPerWeek ?? DEFAULT_SESSIONS[goal.level]));
  const pattern = WEEK_PATTERN[sessionsPerWeek];
  const longSlot = pattern.length - 1;
  const hardCount = sessionsPerWeek >= 5 && goal.level !== 'nybegynner' ? 2 : 1;
  const hardSlots = HARD_SLOTS[sessionsPerWeek].slice(0, hardCount);
  const racePace = goal.goalTimeMin ? goal.goalTimeMin / goal.distanceKm : undefined;

  const firstMonday = mondayOf(start);
  const totalWeeks = daysBetween(firstMonday, mondayOf(goal.goalDate)) / 7 + 1;
  const taper = Math.min(taperWeeks(goal.distanceKm), totalWeeks - 1);
  const buildWeeks = totalWeeks - taper;

  const startLong = goal.currentLongestKm ?? DEFAULT_LONGEST_KM[goal.level];
  const peakLong = Math.max(startLong, peakLongRunKm(goal.distanceKm));
  const longRuns = longRunProgression(startLong, peakLong, buildWeeks);
  const beginnerWeeks = goal.level === 'nybegynner' ? Math.ceil(buildWeeks * 0.4) : 0;

  const planId = `plan-${Date.now().toString(36)}`;
  const sessions: Session[] = [];
  const push = (date: string, week: number, content: W.WorkoutContent) => {
    if (daysBetween(start, date) < 0 || daysBetween(date, goal.goalDate) < 0) return;
    sessions.push({ id: `${planId}-${date}`, date, week, completed: false, ...content });
  };

  for (let week = 1; week <= totalWeeks; week++) {
    const monday = addDays(firstMonday, (week - 1) * 7);
    const isRaceWeek = week === totalWeeks;
    const isTaper = week > buildWeeks;

    // Måluka: et par korte, rolige turer og så måldagen.
    if (isRaceWeek) {
      let easyRuns = 0;
      for (const day of pattern) {
        const date = addDays(monday, day);
        if (daysBetween(date, goal.goalDate) < 2 || easyRuns >= 2) continue;
        push(date, week, W.rolig(Math.max(2, peakLong * 0.25), racePace));
        easyRuns++;
      }
      push(goal.goalDate, week, W.konkurranse(goal.distanceKm, racePace));
      continue;
    }

    const longKm = isTaper ? peakLong * 0.75 : longRuns[week - 1];
    const weeklyKm = longKm / LONG_SHARE[sessionsPerWeek];

    // Nybegynnerfase: bare gå/jogg.
    if (week <= beginnerWeeks) {
      const progress = beginnerWeeks > 1 ? (week - 1) / (beginnerWeeks - 1) : 1;
      for (const day of pattern) push(addDays(monday, day), week, W.gaaJogg(progress));
      continue;
    }

    const activeHard = hardSlots;
    // Harde økter: ca. 20 % av uka, men aldri lengre enn langturen.
    const hardKm = Math.min(longKm * 0.8, Math.max(4, weeklyKm * 0.2));
    const easyCount = pattern.length - 1 - activeHard.length;
    // Rolige turer skal alltid være kortere enn langturen.
    const easyKm =
      easyCount > 0
        ? Math.min(longKm * 0.7, Math.max(2, (weeklyKm - longKm - hardKm * activeHard.length) / easyCount))
        : 0;

    pattern.forEach((day, slot) => {
      const date = addDays(monday, day);
      if (slot === longSlot) return push(date, week, W.langtur(longKm, racePace));
      if (activeHard.includes(slot)) {
        // Tidlig: bakker for styrke. Senere: veksle mellom intervall og tempo.
        const earlyPhase = week <= Math.max(beginnerWeeks + 2, Math.ceil(buildWeeks / 3));
        const workout = earlyPhase
          ? W.bakke(hardKm)
          : week % 2 === 0
            ? W.intervall(hardKm, goal.distanceKm, racePace)
            : W.tempo(hardKm, racePace);
        return push(date, week, workout);
      }
      push(date, week, W.rolig(easyKm, racePace));
    });
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

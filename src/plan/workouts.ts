// Lager innholdet i hver økt: tittel, beskrivelse, tempo og tips.

import type { Session, SessionType } from './types';

export type WorkoutContent = Omit<Session, 'id' | 'date' | 'week' | 'completed'>;

/** Tillegg i min/km i forhold til konkurransetempo. */
const PACE_OFFSET: Record<SessionType, number> = {
  gaa_jogg: 2.0,
  rolig: 1.25,
  langtur: 1.5,
  tempo: 0.25,
  intervall: -0.15,
  bakke: 0,
  konkurranse: 0,
};

const EFFORT: Record<SessionType, string> = {
  gaa_jogg: 'Veldig lett – du skal kunne prate hele tiden',
  rolig: 'Lett – du klarer å prate i hele setninger',
  langtur: 'Lett – rolig og jevnt hele veien',
  tempo: 'Komfortabelt hardt – du klarer bare korte setninger',
  intervall: 'Hardt – du klarer bare noen få ord',
  bakke: 'Hardt oppover, helt rolig ned',
  konkurranse: 'Gi det du har – men start kontrollert',
};

export function formatPace(minPerKm: number): string {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return sec === 60 ? `${min + 1}:00` : `${min}:${String(sec).padStart(2, '0')}`;
}

function paceFor(type: SessionType, racePace?: number): string | undefined {
  if (racePace === undefined || type === 'bakke' || type === 'gaa_jogg') return undefined;
  return formatPace(racePace + PACE_OFFSET[type]);
}

const round05 = (km: number) => Math.max(0.5, Math.round(km * 2) / 2);

export function gaaJogg(progress: number, totalMin?: number): WorkoutContent {
  // progress 0 → 1 gjennom nybegynnerfasen
  const jog = Math.round(1 + progress * 4); // 1 → 5 min jogg
  const walk = progress < 0.5 ? 2 : 1; // 2 → 1 min gange
  const mainMin = totalMin ? Math.max(10, totalMin - 10) : 24;
  const rounds = Math.max(3, Math.round(mainMin / (jog + walk)));
  return {
    type: 'gaa_jogg',
    title: 'Gå/jogg',
    durationMin: 10 + rounds * (jog + walk),
    effort: EFFORT.gaa_jogg,
    warmup: '5 min rask gange',
    main: `${rounds} × (${jog} min rolig jogg + ${walk} min gange)`,
    cooldown: '5 min rolig gange',
    tip: 'Det er helt riktig å gå. Pausene gjør at kroppen tåler mer over tid.',
  };
}

export function rolig(km: number, racePace?: number): WorkoutContent {
  return {
    type: 'rolig',
    title: 'Rolig tur',
    distanceKm: round05(km),
    pace: paceFor('rolig', racePace),
    effort: EFFORT.rolig,
    warmup: 'Start ekstra rolig de første 5 minuttene',
    main: `${round05(km)} km i rolig tempo`,
    cooldown: '5 min gange og litt tøying',
    tip: 'Hvis du ikke klarer å prate, løper du for fort. Rolig er rolig!',
  };
}

export function langtur(km: number, racePace?: number): WorkoutContent {
  return {
    type: 'langtur',
    title: 'Langtur',
    distanceKm: round05(km),
    pace: paceFor('langtur', racePace),
    effort: EFFORT.langtur,
    warmup: 'Start rolig – de første 2 km skal føles nesten for lette',
    main: `${round05(km)} km i jevnt, rolig tempo`,
    cooldown: '5 min gange, drikk og spis noe innen en time',
    tip: 'Ukas viktigste økt. Det er distansen som teller, ikke farten.',
  };
}

export function intervall(km: number, goalKm: number, racePace?: number): WorkoutContent {
  const repM = goalKm >= 21 ? 1000 : 400;
  const reps = Math.min(10, Math.max(4, Math.round(((km - 3) * 1000) / (repM * 1.5))));
  const rest = repM === 1000 ? '2 min' : '90 sek';
  return {
    type: 'intervall',
    title: 'Intervall',
    distanceKm: round05(km),
    pace: paceFor('intervall', racePace),
    effort: EFFORT.intervall,
    warmup: '15 min rolig jogg + 3 korte stigningsløp',
    main: `${reps} × ${repM} m raskt, ${rest} rolig jogg/gange mellom`,
    cooldown: '10 min rolig jogg',
    tip: 'Hold samme fart på alle dragene – det siste skal være like raskt som det første.',
  };
}

export function tempo(km: number, racePace?: number): WorkoutContent {
  const minutes = Math.min(40, Math.max(10, Math.round((km - 3) * 5)));
  return {
    type: 'tempo',
    title: 'Tempoløp',
    distanceKm: round05(km),
    pace: paceFor('tempo', racePace),
    effort: EFFORT.tempo,
    warmup: '15 min rolig jogg',
    main: `${minutes} min sammenhengende i tempo`,
    cooldown: '10 min rolig jogg',
    tip: 'Det skal føles anstrengende, men kontrollert. Du skal kunne holde farten hele veien.',
  };
}

export function bakke(km: number): WorkoutContent {
  const reps = Math.min(12, Math.max(6, Math.round(km)));
  return {
    type: 'bakke',
    title: 'Bakkeintervall',
    distanceKm: round05(km),
    effort: EFFORT.bakke,
    warmup: '15 min rolig jogg til en bakke',
    main: `${reps} × 45 sek raskt opp bakken, gå/jogg rolig ned`,
    cooldown: '10 min rolig jogg',
    tip: 'Korte steg, høy frekvens og bruk armene. Bakker bygger styrke uten å slite på kroppen.',
  };
}

export function konkurranse(goalKm: number, racePace?: number): WorkoutContent {
  return {
    type: 'konkurranse',
    title: `Måldag – ${goalKm} km!`,
    distanceKm: goalKm,
    pace: racePace ? formatPace(racePace) : undefined,
    effort: EFFORT.konkurranse,
    warmup: '10 min rolig jogg og noen korte stigningsløp',
    main: `${goalKm} km – ditt mål`,
    cooldown: 'Gå rolig, drikk og nyt det',
    tip: 'Ikke prøv noe nytt i dag – samme sko, klær og frokost som på trening.',
  };
}

/**
 * Lager innholdet til en økt ut fra type og mengde.
 * Brukes når brukeren endrer en økt selv.
 */
export function contentFor(
  type: SessionType,
  amount: { km?: number; minutes?: number },
  goalKm: number,
  racePace?: number,
): WorkoutContent {
  const km = amount.km ?? 5;
  switch (type) {
    case 'gaa_jogg':
      return gaaJogg(0.5, amount.minutes ?? 35);
    case 'rolig':
      return rolig(km, racePace);
    case 'langtur':
      return langtur(km, racePace);
    case 'intervall':
      return intervall(km, goalKm, racePace);
    case 'tempo':
      return tempo(km, racePace);
    case 'bakke':
      return bakke(km);
    case 'konkurranse':
      return konkurranse(goalKm, racePace);
  }
}

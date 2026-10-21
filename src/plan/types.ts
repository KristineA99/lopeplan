// Datatyper for treningsplanen. Se README → Datamodell.

export type Level = 'nybegynner' | 'litt_trent' | 'godt_trent';

export type SessionType =
  | 'gaa_jogg'
  | 'rolig'
  | 'langtur'
  | 'intervall'
  | 'tempo'
  | 'bakke'
  | 'konkurranse';

/** Økttyper brukeren kan velge bort eller til i skjemaet. */
export type ChoosableType = 'rolig' | 'langtur' | 'bakke' | 'tempo' | 'intervall';
export const CHOOSABLE_TYPES: ChoosableType[] = ['rolig', 'langtur', 'bakke', 'tempo', 'intervall'];

/** Ukedager: 0 = mandag … 6 = søndag. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Det brukeren legger inn. Datoer er strenger på formen 'YYYY-MM-DD'. */
export interface Goal {
  distanceKm: number;
  goalDate: string;
  level: Level;
  /** Ønsket sluttid i minutter (valgfritt). */
  goalTimeMin?: number;
  /** Økter per uke, 2–6 (valgfritt – brukes bare hvis trainingDays mangler). */
  sessionsPerWeek?: number;
  /** Hvilke ukedager brukeren vil trene (valgfritt – appen foreslår). */
  trainingDays?: Weekday[];
  /** Hvilke økttyper som skal være med (valgfritt – standard er alle). */
  sessionTypes?: ChoosableType[];
  /** Hvor langt brukeren klarer å løpe i dag (valgfritt). */
  currentLongestKm?: number;
  /** Første dag i planen. Standard: i dag. */
  startDate?: string;
}

/** Det brukeren registrerer etter en økt. */
export interface SessionLog {
  status: 'som_planlagt' | 'endret' | 'hoppet_over';
  distanceKm?: number;
  durationMin?: number;
  feeling?: 'lett' | 'passe' | 'tung';
  note?: string;
}

export interface Session {
  id: string;
  date: string;
  week: number;
  type: SessionType;
  title: string;
  distanceKm?: number;
  durationMin?: number;
  /** Tempo i min/km, f.eks. "6:15". Bare satt når brukeren har oppgitt måltid. */
  pace?: string;
  /** Anstrengelse i vanlig språk. Alltid satt. */
  effort: string;
  warmup: string;
  main: string;
  cooldown: string;
  tip: string;
  /** true når økta er gjennomført (som planlagt eller med endringer). */
  completed: boolean;
  log?: SessionLog;
  /** true hvis brukeren har endret økta selv. */
  edited?: boolean;
}

export interface Feasibility {
  realistic: boolean;
  weeksAvailable: number;
  weeksNeeded: number;
  /** Forslag til ny måldato hvis planen er for kort. */
  suggestedDate?: string;
  /** Lengste standarddistanse som er realistisk innen måldatoen. */
  suggestedDistanceKm?: number;
  message?: string;
}

export interface TrainingPlan {
  id: string;
  goal: Goal;
  sessionsPerWeek: number;
  createdDate: string;
  approved: boolean;
  feasibility: Feasibility;
  sessions: Session[];
}

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

/** Det brukeren legger inn. Datoer er strenger på formen 'YYYY-MM-DD'. */
export interface Goal {
  distanceKm: number;
  goalDate: string;
  level: Level;
  /** Ønsket sluttid i minutter (valgfritt). */
  goalTimeMin?: number;
  /** Økter per uke, 2–6 (valgfritt – appen foreslår). */
  sessionsPerWeek?: number;
  /** Hvor langt brukeren klarer å løpe i dag (valgfritt). */
  currentLongestKm?: number;
  /** Første dag i planen. Standard: i dag. */
  startDate?: string;
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
  completed: boolean;
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

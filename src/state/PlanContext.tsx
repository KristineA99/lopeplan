// Holder på treningsplanen og lagrer den på telefonen (N1: virker uten nett).
//
// Tenk på dette som appens "hukommelse": alle skjermene kan spørre her
// hvilken plan som gjelder, og endringer lagres automatisk.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { daysBetween, mondayOf } from '@/plan/dates';
import { generatePlan } from '@/plan/generatePlan';
import type { Goal, Session, SessionLog, TrainingPlan } from '@/plan/types';

const STORAGE_KEY = 'lopeplan:plan';

/** Hvilken plan en endring gjelder: forslaget eller den godkjente planen. */
export type PlanSource = 'draft' | 'plan';

interface PlanState {
  /** Planen brukeren har godkjent (vises i kalenderen). */
  plan: TrainingPlan | null;
  /** Forslag som ikke er godkjent ennå. */
  draft: TrainingPlan | null;
  loading: boolean;
  /** Lager et nytt forslag fra et mål. Returnerer feilmelding hvis noe er galt. */
  makeDraft: (goal: Goal) => string | null;
  approveDraft: () => void;
  /** Endrer en økt. Returnerer feilmelding hvis noe er galt. */
  updateSession: (source: PlanSource, id: string, changes: Partial<Session>) => string | null;
  deleteSession: (source: PlanSource, id: string) => void;
  /** Registrerer hvordan økta gikk. undefined = angre registreringen. */
  logSession: (id: string, log: SessionLog | undefined) => void;
  deletePlan: () => void;
}

const PlanContext = createContext<PlanState | null>(null);

/** Sorterer øktene etter dato og regner ut ukenummer på nytt (etter flytting). */
function tidy(plan: TrainingPlan): TrainingPlan {
  const sessions = [...plan.sessions].sort((a, b) => a.date.localeCompare(b.date));
  const firstMonday = mondayOf(plan.goal.startDate ?? plan.createdDate);
  return {
    ...plan,
    sessions: sessions.map((s) => ({
      ...s,
      week: Math.max(1, Math.floor(daysBetween(firstMonday, s.date) / 7) + 1),
    })),
  };
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [draft, setDraft] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Hent lagret plan når appen starter.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setPlan(JSON.parse(json));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function save(next: TrainingPlan | null) {
    setPlan(next);
    if (next) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    else AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }

  function change(source: PlanSource, fn: (p: TrainingPlan) => TrainingPlan) {
    if (source === 'draft' && draft) setDraft(fn(draft));
    if (source === 'plan' && plan) save(fn(plan));
  }

  function makeDraft(goal: Goal): string | null {
    try {
      setDraft(generatePlan(goal));
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Noe gikk galt.';
    }
  }

  function approveDraft() {
    if (!draft) return;
    save({ ...draft, approved: true });
    setDraft(null);
  }

  function updateSession(source: PlanSource, id: string, changes: Partial<Session>): string | null {
    const target = source === 'draft' ? draft : plan;
    if (!target) return 'Fant ikke planen.';
    if (changes.date) {
      const taken = target.sessions.some((s) => s.date === changes.date && s.id !== id);
      if (taken) return 'Det er allerede en økt den dagen. Flytt eller slett den først.';
      if (changes.date > target.goal.goalDate) return 'Økta kan ikke ligge etter måldagen.';
    }
    change(source, (p) =>
      tidy({ ...p, sessions: p.sessions.map((s) => (s.id === id ? { ...s, ...changes, edited: true } : s)) }),
    );
    return null;
  }

  function deleteSession(source: PlanSource, id: string) {
    change(source, (p) => ({ ...p, sessions: p.sessions.filter((s) => s.id !== id) }));
  }

  function logSession(id: string, log: SessionLog | undefined) {
    change('plan', (p) => ({
      ...p,
      sessions: p.sessions.map((s) =>
        s.id === id ? { ...s, log, completed: !!log && log.status !== 'hoppet_over' } : s,
      ),
    }));
  }

  function deletePlan() {
    save(null);
  }

  return (
    <PlanContext.Provider
      value={{
        plan, draft, loading, makeDraft, approveDraft,
        updateSession, deleteSession, logSession, deletePlan,
      }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanState {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan må brukes inni <PlanProvider>');
  return ctx;
}

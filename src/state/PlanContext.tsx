// Holder på treningsplanen og lagrer den på telefonen (N1: virker uten nett).
//
// Tenk på dette som appens "hukommelse": alle skjermene kan spørre her
// hvilken plan som gjelder, og endringer lagres automatisk.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { generatePlan } from '@/plan/generatePlan';
import type { Goal, TrainingPlan } from '@/plan/types';

const STORAGE_KEY = 'lopeplan:plan';

interface PlanState {
  /** Planen brukeren har godkjent (vises i kalenderen). */
  plan: TrainingPlan | null;
  /** Forslag som ikke er godkjent ennå. */
  draft: TrainingPlan | null;
  loading: boolean;
  /** Lager et nytt forslag fra et mål. Returnerer feilmelding hvis noe er galt. */
  makeDraft: (goal: Goal) => string | null;
  approveDraft: () => void;
  toggleCompleted: (sessionId: string) => void;
  deletePlan: () => void;
}

const PlanContext = createContext<PlanState | null>(null);

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

  function toggleCompleted(sessionId: string) {
    if (!plan) return;
    save({
      ...plan,
      sessions: plan.sessions.map((s) => (s.id === sessionId ? { ...s, completed: !s.completed } : s)),
    });
  }

  function deletePlan() {
    save(null);
  }

  return (
    <PlanContext.Provider
      value={{ plan, draft, loading, makeDraft, approveDraft, toggleCompleted, deletePlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanState {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan må brukes inni <PlanProvider>');
  return ctx;
}

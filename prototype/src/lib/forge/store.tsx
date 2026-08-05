import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { planDays, todaysWorkout, type PlanExercise } from "./data";
import {
  evaluatePersonalRecord,
  getExerciseRecords,
  mergeSetIntoRecords,
  type PersonalRecordHit,
} from "./records";
import {
  applyXpEvents,
  getLevelFromTotalXp,
  getLevelProgress,
  XP_RULES,
  type XpCandidate,
  type XpEvent,
} from "./xp";

export type Phase = "signin" | "onboarding" | "app";
export type TodayVariant = "scheduled" | "rest" | "no-plan" | "completed";
export type SyncStatus = "synced" | "pending" | "syncing" | "failed" | "offline-stored";
export type Theme = "dark" | "light";
export type SessionStatus = "active" | "paused" | "completed" | "cancelled";
export type SessionOutcome = "completed" | "partial" | "cancelled";

export type LoggedSet = {
  exerciseId: string;
  exerciseName: string;
  setIndex: number;
  weight: number;
  reps: number;
  skipped: boolean;
  at: number;
  synced: boolean;
};

/** Context preserved while the rest screen is visible. */
export type RestContext = {
  log: LoggedSet;
  endsAt: number;
  total: number;
  next: { exerciseIndex: number; setIndex: number } | null;
};

export type Session = {
  startedAt: number;
  status: SessionStatus;
  exerciseIndex: number;
  setIndex: number;
  logs: LoggedSet[];
  skippedExercises: string[];
  rest: RestContext | null;
  /** Accumulated active milliseconds, excluding paused time. */
  activeMs: number;
  /** Timestamp of the last resume, null while paused/finished. */
  resumedAt: number | null;
  finishedAt: number | null;
  outcome: SessionOutcome | null;
  records: PersonalRecordHit[];
};

export type ForgeState = {
  hydrated: boolean;
  phase: Phase;
  theme: Theme;
  todayVariant: TodayVariant;
  offline: boolean;
  syncStatus: SyncStatus;
  sound: boolean;
  vibration: boolean;
  units: "metric" | "imperial";
  profileName: string;
  email: string;
  timezone: string;
  goal: string;
  xp: number;
  xpEvents: XpEvent[];
  session: Session | null;
  lastSession: Session | null;
  lastSessionXp: number;
  recovery: { sleep: number; hydration: number; movement: boolean; habits: string[] } | null;
};

const STORAGE_KEY = "forge.prototype.v2";

const initialState: ForgeState = {
  hydrated: false,
  phase: "signin",
  theme: "dark",
  todayVariant: "scheduled",
  offline: false,
  syncStatus: "synced",
  sound: true,
  vibration: true,
  units: "metric",
  profileName: "João Victor",
  email: "joao@forge.app",
  timezone: "America/Sao_Paulo",
  goal: "Ganhar força",
  xp: 4310,
  xpEvents: [],
  session: null,
  lastSession: null,
  lastSessionXp: 0,
  recovery: null,
};

export const workoutExercises: PlanExercise[] = (todaysWorkout?.exercises ?? []) as PlanExercise[];

export const exAt = (i: number): PlanExercise =>
  workoutExercises[Math.min(Math.max(i, 0), workoutExercises.length - 1)] as PlanExercise;
export const totalPlannedSets = workoutExercises.reduce((n, e) => n + e.sets, 0);

type Ctx = {
  state: ForgeState;
  level: number;
  progress: ReturnType<typeof getLevelProgress>;
  set: (patch: Partial<ForgeState>) => void;
  toggleTheme: () => void;
  signIn: () => void;
  finishOnboarding: () => void;
  signOut: () => void;
  startWorkout: () => void;
  completeSet: (weight: number, reps: number) => void;
  skipSet: () => void;
  skipExercise: () => void;
  continueRest: () => void;
  addRest: (seconds: number) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: (outcome: SessionOutcome) => void;
  awardXp: (candidates: XpCandidate[]) => void;
  syncNow: () => void;
  failSync: () => void;
  resetPrototype: () => void;
};

const ForgeContext = createContext<Ctx | null>(null);

function positionAfter(exerciseIndex: number, setIndex: number) {
  const ex = exAt(exerciseIndex);
  if (setIndex + 1 < ex.sets) return { exerciseIndex, setIndex: setIndex + 1 };
  if (exerciseIndex + 1 < workoutExercises.length)
    return { exerciseIndex: exerciseIndex + 1, setIndex: 0 };
  return null;
}

/** Records for one exercise, historical data folded with this session's sets. */
function recordsFor(exerciseId: string, logs: LoggedSet[]) {
  let records = getExerciseRecords(exerciseId);
  for (const log of logs) {
    if (log.skipped || log.exerciseId !== exerciseId) continue;
    records = mergeSetIntoRecords(records, log.weight, log.reps);
  }
  return records;
}

/** Active seconds of a session, ignoring paused time. */
export function sessionActiveSeconds(session: Session | null, now = Date.now()) {
  if (!session) return 0;
  const running = session.status === "active" && session.resumedAt ? now - session.resumedAt : 0;
  return Math.max(0, Math.floor((session.activeMs + running) / 1000));
}

function completedExerciseCount(session: Session) {
  return workoutExercises.filter((ex) => {
    const valid = session.logs.filter((l) => l.exerciseId === ex.id && !l.skipped).length;
    return valid >= ex.sets;
  }).length;
}

export function sessionXpBreakdown(session: Session) {
  const outcome = session.outcome ?? "cancelled";
  const validSets = session.logs.filter((l) => !l.skipped).length;
  const awardedSets = Math.min(validSets, XP_RULES.awardedSetLimit);
  const exercises = completedExerciseCount(session);
  const lines: { label: string; detail?: string; amount: number }[] = [];

  if (outcome === "completed") {
    lines.push({ label: "Treino concluído", amount: XP_RULES.workoutCompleted });
  } else if (outcome === "partial") {
    lines.push({ label: "Treino parcial", amount: XP_RULES.workoutPartial });
  } else {
    lines.push({ label: "Treino cancelado", detail: "Sem XP de conclusão", amount: 0 });
  }

  if (exercises > 0) {
    lines.push({
      label: `${exercises} ${exercises === 1 ? "exercício concluído" : "exercícios concluídos"}`,
      detail: `${XP_RULES.exerciseCompleted} XP por exercício`,
      amount: exercises * XP_RULES.exerciseCompleted,
    });
  }

  if (awardedSets > 0) {
    lines.push({
      label: `${awardedSets} ${awardedSets === 1 ? "série válida" : "séries válidas"}`,
      detail:
        validSets > awardedSets
          ? `${XP_RULES.validSet} XP por série · limite de ${XP_RULES.awardedSetLimit} séries`
          : `${XP_RULES.validSet} XP por série`,
      amount: awardedSets * XP_RULES.validSet,
    });
  }

  for (const record of session.records) {
    lines.push({
      label: "Novo recorde pessoal",
      detail: `${record.exerciseName} · ${record.result}`,
      amount: XP_RULES.personalRecord,
    });
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, total, validSets, awardedSets, exercises };
}

function sessionXpCandidates(session: Session): XpCandidate[] {
  const key = `session-${session.startedAt}`;
  const outcome = session.outcome ?? "cancelled";
  const validSets = session.logs.filter((l) => !l.skipped).length;
  const awardedSets = Math.min(validSets, XP_RULES.awardedSetLimit);
  const exercises = completedExerciseCount(session);
  const candidates: XpCandidate[] = [];

  if (outcome === "completed") {
    candidates.push({
      id: `${key}-completed`,
      type: "workout_completed",
      source: "Treino concluído",
      amount: XP_RULES.workoutCompleted,
    });
  } else if (outcome === "partial") {
    candidates.push({
      id: `${key}-partial`,
      type: "workout_partial",
      source: "Treino parcial",
      amount: XP_RULES.workoutPartial,
    });
  }

  if (exercises > 0) {
    candidates.push({
      id: `${key}-exercises`,
      type: "exercise_completed",
      source: `${exercises} exercícios concluídos`,
      amount: exercises * XP_RULES.exerciseCompleted,
    });
  }

  if (awardedSets > 0) {
    candidates.push({
      id: `${key}-sets`,
      type: "valid_set",
      source: `${awardedSets} séries válidas`,
      amount: awardedSets * XP_RULES.validSet,
    });
  }

  session.records.forEach((record, i) => {
    candidates.push({
      id: `${key}-record-${record.exerciseId}-${i}`,
      type: "personal_record",
      source: `${record.exerciseName} · ${record.result}`,
      amount: XP_RULES.personalRecord,
    });
  });

  return candidates;
}

export function ForgeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ForgeState>(initialState);
  const lock = useRef(0);

  useEffect(() => {
    let loaded: Partial<ForgeState> = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw) as Partial<ForgeState>;
    } catch {
      loaded = {};
    }
    setState((prev) => ({ ...prev, ...loaded, hydrated: true }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _h, ...persist } = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch {
      /* prototype only */
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", state.theme === "light");
    root.classList.toggle("dark", state.theme === "dark");
    root.style.colorScheme = state.theme;
  }, [state.theme]);

  const set = useCallback((patch: Partial<ForgeState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const patchSession = (fn: (s: Session, prev: ForgeState) => Partial<ForgeState>) =>
      setState((prev) => (prev.session ? { ...prev, ...fn(prev.session, prev) } : prev));

    const grant = (prev: ForgeState, candidates: XpCandidate[]) => {
      const result = applyXpEvents(prev.xpEvents, candidates);
      return { xp: prev.xp + result.gained, xpEvents: result.events, gained: result.gained };
    };

    return {
      state,
      level: getLevelFromTotalXp(state.xp),
      progress: getLevelProgress(state.xp),
      set,
      toggleTheme: () => set({ theme: state.theme === "dark" ? "light" : "dark" }),
      signIn: () => set({ phase: "onboarding" }),
      finishOnboarding: () => set({ phase: "app" }),
      signOut: () => set({ phase: "signin" }),
      startWorkout: () =>
        set({
          todayVariant: "scheduled",
          session: {
            startedAt: Date.now(),
            status: "active",
            exerciseIndex: 0,
            setIndex: 0,
            logs: [],
            skippedExercises: [],
            rest: null,
            activeMs: 0,
            resumedAt: Date.now(),
            finishedAt: null,
            outcome: null,
            records: [],
          },
        }),
      completeSet: (weight, reps) => {
        const now = Date.now();
        if (now - lock.current < 700) return;
        lock.current = now;
        patchSession((s, prev) => {
          if (s.rest) return {};
          const ex = exAt(s.exerciseIndex);
          const log: LoggedSet = {
            exerciseId: ex.id,
            exerciseName: ex.name,
            setIndex: s.setIndex,
            weight,
            reps,
            skipped: false,
            at: now,
            synced: !prev.offline,
          };
          const record = evaluatePersonalRecord(
            ex.id,
            ex.name,
            weight,
            reps,
            recordsFor(ex.id, s.logs),
          );
          const next = positionAfter(s.exerciseIndex, s.setIndex);
          return {
            syncStatus: prev.offline ? "offline-stored" : "synced",
            session: {
              ...s,
              logs: [...s.logs, log],
              records: record ? [...s.records, record] : s.records,
              rest: next ? { log, endsAt: now + ex.restSeconds * 1000, total: ex.restSeconds, next } : null,
              finishedAt: next ? null : now,
            },
          };
        });
      },
      skipSet: () =>
        patchSession((s, prev) => {
          const ex = exAt(s.exerciseIndex);
          const next = positionAfter(s.exerciseIndex, s.setIndex);
          return {
            session: {
              ...s,
              logs: [
                ...s.logs,
                {
                  exerciseId: ex.id,
                  exerciseName: ex.name,
                  setIndex: s.setIndex,
                  weight: 0,
                  reps: 0,
                  skipped: true,
                  at: Date.now(),
                  synced: !prev.offline,
                },
              ],
              rest: null,
              exerciseIndex: next ? next.exerciseIndex : s.exerciseIndex,
              setIndex: next ? next.setIndex : s.setIndex,
              finishedAt: next ? null : Date.now(),
            },
          };
        }),
      skipExercise: () =>
        patchSession((s) => {
          const ex = exAt(s.exerciseIndex);
          const hasNext = s.exerciseIndex + 1 < workoutExercises.length;
          return {
            session: {
              ...s,
              skippedExercises: [...s.skippedExercises, ex.id],
              rest: null,
              exerciseIndex: hasNext ? s.exerciseIndex + 1 : s.exerciseIndex,
              setIndex: 0,
              finishedAt: hasNext ? null : Date.now(),
            },
          };
        }),
      continueRest: () =>
        patchSession((s) => {
          if (!s.rest) return {};
          const next = s.rest.next;
          return {
            session: {
              ...s,
              rest: null,
              exerciseIndex: next ? next.exerciseIndex : s.exerciseIndex,
              setIndex: next ? next.setIndex : s.setIndex,
            },
          };
        }),
      addRest: (seconds) =>
        patchSession((s) =>
          s.rest
            ? {
                session: {
                  ...s,
                  rest: {
                    ...s.rest,
                    endsAt: Math.max(s.rest.endsAt, Date.now()) + seconds * 1000,
                    total: s.rest.total + seconds,
                  },
                },
              }
            : {},
        ),
      pauseWorkout: () =>
        patchSession((s) => {
          if (s.status !== "active") return {};
          const now = Date.now();
          return {
            session: {
              ...s,
              status: "paused",
              activeMs: s.activeMs + (s.resumedAt ? now - s.resumedAt : 0),
              resumedAt: null,
            },
          };
        }),
      resumeWorkout: () =>
        patchSession((s) =>
          s.status === "paused"
            ? { session: { ...s, status: "active", resumedAt: Date.now() } }
            : {},
        ),
      finishWorkout: (outcome) =>
        setState((prev) => {
          if (!prev.session) return prev;
          const now = Date.now();
          const active = prev.session;
          const finished: Session = {
            ...active,
            status: outcome === "cancelled" ? "cancelled" : "completed",
            rest: null,
            activeMs: active.activeMs + (active.resumedAt ? now - active.resumedAt : 0),
            resumedAt: null,
            finishedAt: active.finishedAt ?? now,
            outcome,
          };
          const { xp, xpEvents, gained } = grant(prev, sessionXpCandidates(finished));
          return {
            ...prev,
            session: null,
            lastSession: finished,
            lastSessionXp: gained,
            xp,
            xpEvents,
            todayVariant: outcome === "cancelled" ? "scheduled" : "completed",
            syncStatus: prev.offline ? "offline-stored" : "synced",
          };
        }),
      awardXp: (candidates) =>
        setState((prev) => {
          const { xp, xpEvents } = grant(prev, candidates);
          return { ...prev, xp, xpEvents };
        }),
      syncNow: () => {
        set({ syncStatus: "syncing" });
        window.setTimeout(() => {
          setState((prev) =>
            prev.offline
              ? { ...prev, syncStatus: "failed" }
              : {
                  ...prev,
                  syncStatus: "synced",
                  session: prev.session
                    ? {
                        ...prev.session,
                        logs: prev.session.logs.map((l) => ({ ...l, synced: true })),
                      }
                    : prev.session,
                  lastSession: prev.lastSession
                    ? {
                        ...prev.lastSession,
                        logs: prev.lastSession.logs.map((l) => ({ ...l, synced: true })),
                      }
                    : prev.lastSession,
                },
          );
        }, 1400);
      },
      failSync: () => set({ syncStatus: "failed" }),
      resetPrototype: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* noop */
        }
        setState({ ...initialState, hydrated: true, theme: state.theme });
      },
    };
  }, [state, set]);

  return <ForgeContext.Provider value={value}>{children}</ForgeContext.Provider>;
}

export function useForge() {
  const ctx = useContext(ForgeContext);
  if (!ctx) throw new Error("useForge must be used inside ForgeProvider");
  return ctx;
}

export function useCountdown(endsAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [endsAt]);
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** Active elapsed seconds, excluding paused time. */
export function useActiveElapsed(session: Session | null) {
  const [now, setNow] = useState(() => Date.now());
  const running = session?.status === "active";
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return sessionActiveSeconds(session, now);
}

export function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const restDayNames = planDays.filter((d) => d.kind === "rest").map((d) => d.weekday);

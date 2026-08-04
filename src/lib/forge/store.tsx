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

export type Phase = "signin" | "onboarding" | "app";
export type TodayVariant = "scheduled" | "rest" | "no-plan" | "completed";
export type SyncStatus = "synced" | "pending" | "syncing" | "failed" | "offline-stored";
export type Theme = "dark" | "light";

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

export type Session = {
  startedAt: number;
  exerciseIndex: number;
  setIndex: number;
  logs: LoggedSet[];
  skippedExercises: string[];
  restEndsAt: number | null;
  restTotal: number;
  finishedAt: number | null;
  outcome: "completed" | "cancelled" | null;
  prHit: boolean;
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
  goal: string;
  level: number;
  xp: number;
  session: Session | null;
  lastSession: Session | null;
  recovery: { sleep: number; hydration: number; movement: boolean; habits: string[] } | null;
};

const STORAGE_KEY = "forge.prototype.v1";

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
  profileName: "Alex Moreau",
  goal: "Build strength",
  level: 7,
  xp: 4310,
  session: null,
  lastSession: null,
  recovery: null,
};

export const XP_PER_LEVEL = 800;

export const workoutExercises: PlanExercise[] = todaysWorkout.exercises;
export const totalPlannedSets = workoutExercises.reduce((n, e) => n + e.sets, 0);

type Ctx = {
  state: ForgeState;
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
  finishWorkout: (outcome: "completed" | "cancelled") => void;
  syncNow: () => void;
  failSync: () => void;
  resetPrototype: () => void;
};

const ForgeContext = createContext<Ctx | null>(null);

function nextPosition(state: ForgeState) {
  const s = state.session;
  if (!s) return null;
  const ex = workoutExercises[s.exerciseIndex];
  if (!ex) return null;
  if (s.setIndex + 1 < ex.sets) {
    return { exerciseIndex: s.exerciseIndex, setIndex: s.setIndex + 1 };
  }
  if (s.exerciseIndex + 1 < workoutExercises.length) {
    return { exerciseIndex: s.exerciseIndex + 1, setIndex: 0 };
  }
  return null;
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

    return {
      state,
      set,
      toggleTheme: () => set({ theme: state.theme === "dark" ? "light" : "dark" }),
      signIn: () => set({ phase: "onboarding" }),
      finishOnboarding: () => set({ phase: "app" }),
      signOut: () => set({ phase: "signin", session: null }),
      startWorkout: () =>
        set({
          todayVariant: "scheduled",
          session: {
            startedAt: Date.now(),
            exerciseIndex: 0,
            setIndex: 0,
            logs: [],
            skippedExercises: [],
            restEndsAt: null,
            restTotal: 0,
            finishedAt: null,
            outcome: null,
            prHit: false,
          },
        }),
      completeSet: (weight, reps) => {
        const now = Date.now();
        if (now - lock.current < 700) return;
        lock.current = now;
        patchSession((s, prev) => {
          const ex = workoutExercises[s.exerciseIndex];
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
          const pos = nextPosition(prev);
          const pr = reps > ex.repHigh || weight > ex.suggestedWeight;
          return {
            syncStatus: prev.offline ? "offline-stored" : "synced",
            session: {
              ...s,
              logs: [...s.logs, log],
              prHit: s.prHit || pr,
              restEndsAt: pos ? now + ex.restSeconds * 1000 : null,
              restTotal: ex.restSeconds,
              exerciseIndex: pos ? pos.exerciseIndex : s.exerciseIndex,
              setIndex: pos ? pos.setIndex : s.setIndex,
              finishedAt: pos ? null : now,
            },
          };
        });
      },
      skipSet: () =>
        patchSession((s, prev) => {
          const ex = workoutExercises[s.exerciseIndex];
          const pos = nextPosition(prev);
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
              restEndsAt: null,
              exerciseIndex: pos ? pos.exerciseIndex : s.exerciseIndex,
              setIndex: pos ? pos.setIndex : s.setIndex,
              finishedAt: pos ? null : Date.now(),
            },
          };
        }),
      skipExercise: () =>
        patchSession((s) => {
          const ex = workoutExercises[s.exerciseIndex];
          const hasNext = s.exerciseIndex + 1 < workoutExercises.length;
          return {
            session: {
              ...s,
              skippedExercises: [...s.skippedExercises, ex.id],
              restEndsAt: null,
              exerciseIndex: hasNext ? s.exerciseIndex + 1 : s.exerciseIndex,
              setIndex: 0,
              finishedAt: hasNext ? null : Date.now(),
            },
          };
        }),
      continueRest: () => patchSession((s) => ({ session: { ...s, restEndsAt: null } })),
      addRest: (seconds) =>
        patchSession((s) => ({
          session: {
            ...s,
            restEndsAt: (s.restEndsAt ?? Date.now()) + seconds * 1000,
            restTotal: s.restTotal + seconds,
          },
        })),
      finishWorkout: (outcome) =>
        setState((prev) => {
          if (!prev.session) return prev;
          const finished: Session = {
            ...prev.session,
            finishedAt: prev.session.finishedAt ?? Date.now(),
            outcome,
          };
          const gained =
            outcome === "completed"
              ? 100 + finished.logs.filter((l) => !l.skipped).length * 2 + (finished.prHit ? 25 : 0)
              : 0;
          return {
            ...prev,
            session: null,
            lastSession: finished,
            xp: prev.xp + gained,
            level: prev.level + (prev.xp + gained >= (prev.level + 1) * XP_PER_LEVEL ? 0 : 0),
            todayVariant: outcome === "completed" ? "completed" : "scheduled",
            syncStatus: prev.offline ? "offline-stored" : "synced",
          };
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
                    ? { ...prev.session, logs: prev.session.logs.map((l) => ({ ...l, synced: true })) }
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

export function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const restDayNames = planDays.filter((d) => d.kind === "rest").map((d) => d.weekday);

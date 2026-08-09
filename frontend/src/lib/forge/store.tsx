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
import {
  forgeApi,
  isNetworkRequestError,
  type PlanData,
  type ProgressData,
  type RemoteSession,
} from "./api";
import {
  clearOfflineData,
  enqueueOfflineOperation,
  listOfflineOperations,
  loadOfflineState,
  removeOfflineOperation,
  saveOfflineState,
  type OfflineOperation,
} from "./offline";
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

export type PlanExercise = {
  id: string;
  name: string;
  sets: number;
  repLow: number;
  repHigh: number;
  restSeconds: number;
  suggestedWeight: number;
  note?: string;
  lastResult?: string;
};

export type PersonalRecordHit = {
  exerciseId: string;
  exerciseName: string;
  kind: "maximum_weight" | "maximum_repetitions";
  weight: number;
  reps: number;
  result: string;
  previous: string;
};

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
  serverId?: string;
  workoutName: string;
  exercises: PlanExercise[];
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
  remotePlan: PlanData | null;
  remoteProgress: ProgressData | null;
};

const STORAGE_KEY = "forge.app.v3";

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
  profileName: "",
  email: "",
  timezone: "America/Sao_Paulo",
  goal: "",
  xp: 0,
  xpEvents: [],
  session: null,
  lastSession: null,
  lastSessionXp: 0,
  recovery: null,
  remotePlan: null,
  remoteProgress: null,
};

export const exAt = (session: Session, i: number): PlanExercise =>
  session.exercises[Math.min(Math.max(i, 0), session.exercises.length - 1)] as PlanExercise;
export const totalPlannedSets = (session: Session) =>
  session.exercises.reduce((n, exercise) => n + exercise.sets, 0);

function remoteExercises(remote: RemoteSession): PlanExercise[] {
  return remote.exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    sets: exercise.sets,
    repLow: exercise.repLow ?? 0,
    repHigh: exercise.repHigh ?? 0,
    restSeconds: exercise.restSeconds,
    suggestedWeight: exercise.suggestedWeight,
    note: exercise.note,
  }));
}

function sessionFromRemote(remote: RemoteSession): Session {
  const exercises = remoteExercises(remote);
  const exerciseIndex = Math.max(
    0,
    exercises.findIndex((exercise) => exercise.id === remote.activeExerciseId),
  );
  const startedAt = new Date(remote.startedAt).getTime();
  return {
    serverId: remote.id,
    workoutName: remote.name,
    exercises,
    startedAt,
    status: remote.status,
    exerciseIndex,
    setIndex: Math.max(0, remote.nextSetNumber - 1),
    logs: remote.logs.map((log) => ({
      exerciseId: log.exerciseId,
      exerciseName:
        exercises.find((exercise) => exercise.id === log.exerciseId)?.name ?? "Exercício",
      setIndex: log.setIndex,
      weight: log.weight,
      reps: log.reps,
      skipped: log.skipped,
      at: new Date(log.at).getTime(),
      synced: true,
    })),
    skippedExercises: remote.exercises
      .filter((exercise) => exercise.status === "skipped")
      .map((exercise) => exercise.id),
    rest: null,
    activeMs: remote.durationSeconds ? remote.durationSeconds * 1000 : 0,
    resumedAt: remote.status === "active" ? Date.now() : null,
    finishedAt: remote.status === "completed" || remote.status === "cancelled" ? Date.now() : null,
    outcome:
      remote.status === "completed"
        ? "completed"
        : remote.status === "cancelled"
          ? "cancelled"
          : null,
    records: [],
  };
}

async function replayOfflineOperation(operation: OfflineOperation) {
  switch (operation.kind) {
    case "record-set":
      await forgeApi.recordSet(operation.sessionId, operation.payload ?? {});
      break;
    case "skip-set":
      await forgeApi.skipSet(operation.sessionId, operation.payload);
      break;
    case "skip-exercise":
      await forgeApi.skipExercise(operation.sessionId, operation.payload);
      break;
    case "pause":
      await forgeApi.pauseSession(operation.sessionId);
      break;
    case "resume":
      await forgeApi.resumeSession(operation.sessionId);
      break;
    case "complete":
      await forgeApi.completeSession(operation.sessionId);
      break;
    case "cancel":
      await forgeApi.cancelSession(operation.sessionId);
      break;
  }
}

async function flushOfflineOperations() {
  const operations = await listOfflineOperations();
  for (const operation of operations) {
    await replayOfflineOperation(operation);
    await removeOfflineOperation(operation.id);
  }
}

async function queueOfflineOperation(
  kind: OfflineOperation["kind"],
  sessionId: string,
  payload?: Record<string, unknown>,
) {
  await enqueueOfflineOperation({
    id: crypto.randomUUID(),
    sessionId,
    kind,
    ...(payload ? { payload } : {}),
    createdAt: Date.now(),
  });
}

type Ctx = {
  state: ForgeState;
  level: number;
  progress: ReturnType<typeof getLevelProgress>;
  set: (patch: Partial<ForgeState>) => void;
  toggleTheme: () => void;
  signIn: (email?: string, password?: string) => Promise<void>;
  finishOnboarding: () => void;
  signOut: () => void;
  startWorkout: () => Promise<boolean>;
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
};

const ForgeContext = createContext<Ctx | null>(null);

function positionAfter(session: Session, exerciseIndex: number, setIndex: number) {
  const ex = exAt(session, exerciseIndex);
  if (setIndex + 1 < ex.sets) return { exerciseIndex, setIndex: setIndex + 1 };
  if (exerciseIndex + 1 < session.exercises.length)
    return { exerciseIndex: exerciseIndex + 1, setIndex: 0 };
  return null;
}

/** Active seconds of a session, ignoring paused time. */
export function sessionActiveSeconds(session: Session | null, now = Date.now()) {
  if (!session) return 0;
  const running = session.status === "active" && session.resumedAt ? now - session.resumedAt : 0;
  return Math.max(0, Math.floor((session.activeMs + running) / 1000));
}

function completedExerciseCount(session: Session) {
  return session.exercises.filter((ex) => {
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
    const hydrate = async () => {
      let loaded: Partial<ForgeState> = {};
      try {
        loaded = (await loadOfflineState<Partial<ForgeState>>()) ?? {};
      } catch {
        loaded = {};
      }
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) loaded = { ...loaded, ...(JSON.parse(raw) as Partial<ForgeState>) };
      } catch {
        loaded = {};
      }
      try {
        const user = await forgeApi.me();
        await flushOfflineOperations();
        const [remotePlan, remoteProgress] = await Promise.all([
          forgeApi.plan(),
          forgeApi.progress(),
        ]);
        setState((prev) => ({
          ...prev,
          ...loaded,
          hydrated: true,
          offline: false,
          syncStatus: "synced",
          phase: user.onboardingCompleted ? "app" : "onboarding",
          profileName: user.name || user.firstName,
          email: user.email,
          goal: user.goal ?? prev.goal,
          remotePlan,
          remoteProgress,
          xp: remoteProgress.progression?.totalExperience ?? 0,
          session: remotePlan.openSession
            ? sessionFromRemote(remotePlan.openSession)
            : prev.session,
        }));
      } catch {
        const offline = !navigator.onLine;
        setState((prev) => ({
          ...prev,
          ...loaded,
          hydrated: true,
          offline,
          phase: offline && loaded.phase ? loaded.phase : "signin",
        }));
      }
    };
    void hydrate();
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _h, ...persist } = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch {
      /* local persistence can be unavailable in private browsing */
    }
    void saveOfflineState(persist).catch(() => undefined);
  }, [state]);

  useEffect(() => {
    const synchronize = async () => {
      setState((prev) => ({ ...prev, offline: false, syncStatus: "syncing" }));
      try {
        await flushOfflineOperations();
        const [remotePlan, remoteProgress] = await Promise.all([
          forgeApi.plan(),
          forgeApi.progress(),
        ]);
        setState((prev) => ({
          ...prev,
          offline: false,
          syncStatus: "synced",
          remotePlan,
          remoteProgress,
          xp: remoteProgress.progression?.totalExperience ?? prev.xp,
        }));
      } catch {
        setState((prev) => ({ ...prev, syncStatus: "failed" }));
      }
    };
    const onOffline = () =>
      setState((prev) => ({ ...prev, offline: true, syncStatus: "offline-stored" }));
    const onOnline = () => void synchronize();
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    setState((prev) => ({ ...prev, offline: !navigator.onLine }));
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

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
      signIn: async (email, password) => {
        if (!email || !password) {
          set({ phase: "onboarding" });
          return;
        }
        const user = await forgeApi.login(email, password);
        const [remotePlan, remoteProgress] = await Promise.all([
          forgeApi.plan(),
          forgeApi.progress(),
        ]);
        set({
          phase: user.onboardingCompleted ? "app" : "onboarding",
          profileName: user.name || user.firstName,
          email: user.email,
          goal: user.goal ?? state.goal,
          remotePlan,
          remoteProgress,
          xp: remoteProgress.progression?.totalExperience ?? 0,
          session: remotePlan.openSession
            ? sessionFromRemote(remotePlan.openSession)
            : state.session,
        });
      },
      finishOnboarding: () => set({ phase: "app" }),
      signOut: async () => {
        await forgeApi.logout().catch(() => undefined);
        await clearOfflineData().catch(() => undefined);
        set({ phase: "signin", session: null });
      },
      startWorkout: async () => {
        if (state.session) return true;
        if (state.offline) {
          set({ syncStatus: "failed" });
          return false;
        }
        const planned = state.remotePlan?.days.find(
          (day) => day.id === state.remotePlan?.todayWorkoutId,
        );
        if (!planned || planned.exercises.length === 0) return false;

        const remoteSession = await forgeApi.startWorkout(planned.id);
        set({
          todayVariant: "scheduled",
          session: sessionFromRemote(remoteSession),
          syncStatus: "synced",
        });
        return true;
      },
      completeSet: (weight, reps) => {
        const now = Date.now();
        const serverId = state.session?.serverId;
        const clientGeneratedId = crypto.randomUUID();
        if (now - lock.current < 700) return;
        lock.current = now;
        patchSession((s, prev) => {
          if (s.rest) return {};
          const ex = exAt(s, s.exerciseIndex);
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
          const next = positionAfter(s, s.exerciseIndex, s.setIndex);
          return {
            syncStatus: prev.offline ? "offline-stored" : "synced",
            session: {
              ...s,
              logs: [...s.logs, log],
              rest: next
                ? { log, endsAt: now + ex.restSeconds * 1000, total: ex.restSeconds, next }
                : null,
              finishedAt: next ? null : now,
            },
          };
        });
        if (serverId) {
          const payload = {
            setNumber: (state.session?.setIndex ?? 0) + 1,
            weightKg: weight,
            repetitions: reps,
            clientGeneratedId,
          };
          void forgeApi.recordSet(serverId, payload).catch(async (error) => {
            if (!isNetworkRequestError(error)) {
              set({ syncStatus: "failed" });
              return;
            }
            await queueOfflineOperation("record-set", serverId, payload);
            set({ syncStatus: "offline-stored", offline: !navigator.onLine });
          });
        }
      },
      skipSet: () => {
        const serverId = state.session?.serverId;
        const payload = { clientGeneratedId: crypto.randomUUID() };
        patchSession((s, prev) => {
          const ex = exAt(s, s.exerciseIndex);
          const next = positionAfter(s, s.exerciseIndex, s.setIndex);
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
        });
        if (serverId)
          void forgeApi.skipSet(serverId, payload).catch(async (error) => {
            if (!isNetworkRequestError(error)) {
              set({ syncStatus: "failed" });
              return;
            }
            await queueOfflineOperation("skip-set", serverId, payload);
            set({ syncStatus: "offline-stored", offline: !navigator.onLine });
          });
      },
      skipExercise: () => {
        const serverId = state.session?.serverId;
        const payload = {
          sessionExerciseId: state.session
            ? exAt(state.session, state.session.exerciseIndex).id
            : undefined,
        };
        patchSession((s) => {
          const ex = exAt(s, s.exerciseIndex);
          const hasNext = s.exerciseIndex + 1 < s.exercises.length;
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
        });
        if (serverId)
          void forgeApi.skipExercise(serverId, payload).catch(async (error) => {
            if (!isNetworkRequestError(error)) {
              set({ syncStatus: "failed" });
              return;
            }
            await queueOfflineOperation("skip-exercise", serverId, payload);
            set({ syncStatus: "offline-stored", offline: !navigator.onLine });
          });
      },
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
      pauseWorkout: () => {
        const serverId = state.session?.serverId;
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
        });
        if (serverId)
          void forgeApi.pauseSession(serverId).catch(async (error) => {
            if (!isNetworkRequestError(error)) {
              set({ syncStatus: "failed" });
              return;
            }
            await queueOfflineOperation("pause", serverId);
            set({ syncStatus: "offline-stored", offline: !navigator.onLine });
          });
      },
      resumeWorkout: () => {
        const serverId = state.session?.serverId;
        patchSession((s) =>
          s.status === "paused"
            ? { session: { ...s, status: "active", resumedAt: Date.now() } }
            : {},
        );
        if (serverId)
          void forgeApi.resumeSession(serverId).catch(async (error) => {
            if (!isNetworkRequestError(error)) {
              set({ syncStatus: "failed" });
              return;
            }
            await queueOfflineOperation("resume", serverId);
            set({ syncStatus: "offline-stored", offline: !navigator.onLine });
          });
      },
      finishWorkout: (outcome) => {
        const serverId = state.session?.serverId;
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
        });
        if (serverId) {
          const action =
            outcome === "cancelled" ? forgeApi.cancelSession : forgeApi.completeSession;
          void (async () => {
            try {
              await action(serverId);
            } catch (error) {
              if (!isNetworkRequestError(error)) {
                set({ syncStatus: "failed" });
                return;
              }
              await queueOfflineOperation(
                outcome === "cancelled" ? "cancel" : "complete",
                serverId,
              );
              set({ syncStatus: "offline-stored", offline: !navigator.onLine });
              return;
            }
            try {
              const remoteProgress = await forgeApi.progress();
              set({
                remoteProgress,
                xp: remoteProgress.progression?.totalExperience ?? state.xp,
              });
            } catch {
              set({ syncStatus: "pending" });
            }
          })();
        }
      },
      awardXp: (candidates) =>
        setState((prev) => {
          const { xp, xpEvents } = grant(prev, candidates);
          return { ...prev, xp, xpEvents };
        }),
      syncNow: () => {
        set({ syncStatus: "syncing" });
        void flushOfflineOperations()
          .then(() =>
            setState((prev) => ({
              ...prev,
              syncStatus: "synced",
              session: prev.session
                ? {
                    ...prev.session,
                    logs: prev.session.logs.map((log) => ({ ...log, synced: true })),
                  }
                : null,
              lastSession: prev.lastSession
                ? {
                    ...prev.lastSession,
                    logs: prev.lastSession.logs.map((log) => ({ ...log, synced: true })),
                  }
                : null,
            })),
          )
          .catch(() => set({ syncStatus: "failed" }));
      },
      failSync: () => set({ syncStatus: "failed" }),
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

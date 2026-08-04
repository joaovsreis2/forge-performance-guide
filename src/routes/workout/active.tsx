import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Info,
  MoreHorizontal,
  SkipForward,
  Volume2,
  VolumeX,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SyncPill } from "@/components/forge/SyncPill";
import { Action, ActionLink, NumberField, Panel, SystemState } from "@/components/forge/ui";
import {
  exAt,
  formatClock,
  totalPlannedSets,
  useCountdown,
  useElapsed,
  useForge,
  workoutExercises,
} from "@/lib/forge/store";
import { todaysWorkout } from "@/lib/forge/data";

export const Route = createFileRoute("/workout/active")({
  head: () => ({
    meta: [
      { title: "Active workout — Forge" },
      {
        name: "description",
        content: "Log each set with large controls, guided rest timers and offline-safe storage.",
      },
      { property: "og:title", content: "Active workout — Forge" },
      { property: "og:description", content: "One set at a time. Saved on your device." },
    ],
  }),
  component: ActiveWorkout,
});

function ActiveWorkout() {
  const { state, set, completeSet, skipSet, skipExercise, continueRest, addRest, finishWorkout } =
    useForge();
  const navigate = useNavigate();
  const session = state.session;

  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);

  const exerciseIndex = session?.exerciseIndex ?? 0;
  const setIndex = session?.setIndex ?? 0;
  const exercise = exAt(exerciseIndex);
  const elapsed = useElapsed(session?.startedAt ?? null);
  const remaining = useCountdown(session?.restEndsAt ?? null);

  useEffect(() => {
    setWeight(exercise.suggestedWeight);
    setReps(exercise.repHigh);
  }, [exercise.id, exercise.suggestedWeight, exercise.repHigh]);

  useEffect(() => {
    if (session?.restEndsAt && remaining === 0) continueRest();
  }, [remaining, session?.restEndsAt, continueRest]);

  useEffect(() => {
    if (session?.finishedAt) navigate({ to: "/workout/summary" });
  }, [session?.finishedAt, navigate]);

  if (!state.hydrated) return null;

  if (!session) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <SystemState
          kind="empty"
          title="No workout in progress"
          body="There is no active session on this device right now."
          action={<ActionLink to="/workout">Open workout preview</ActionLink>}
        />
      </main>
    );
  }

  const loggedSets = session.logs.filter((l) => !l.skipped).length;
  const progress = Math.round((session.logs.length / totalPlannedSets) * 100);
  const resting = Boolean(session.restEndsAt) && remaining > 0;
  const nextIsNewExercise = setIndex === 0;

  return (
    <div className="min-h-dvh bg-background pb-40">
      {/* Minimal workout chrome — primary navigation is intentionally hidden */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Pause or leave workout"
            className="tap -ml-2 grid place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <ChevronDown aria-hidden className="size-5" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-xs font-medium text-foreground">{todaysWorkout!.name}</p>
            <p className="num text-xs text-muted-foreground">{formatClock(elapsed)}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Workout options"
            className="tap -mr-2 grid place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal aria-hidden className="size-5" />
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-md">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-elevated"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Workout progress"
          >
            <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="num mt-1.5 text-[0.6875rem] text-muted-foreground">
            {session.logs.length} of {totalPlannedSets} sets · exercise {exerciseIndex + 1} of{" "}
            {workoutExercises.length}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6">
        {state.offline ? (
          <div className="mb-5">
            <SyncPill />
            <p className="mt-2 text-xs text-muted-foreground">
              This session was saved on your device. Sets keep logging normally.
            </p>
          </div>
        ) : null}

        {resting ? (
          <RestPanel
            remaining={remaining}
            total={session.restTotal}
            nextLabel={
              nextIsNewExercise
                ? `Next: ${exercise.name} · set 1 of ${exercise.sets}`
                : `Next: ${exercise.name} · set ${setIndex + 1} of ${exercise.sets}`
            }
            target={`${exercise.repLow}–${exercise.repHigh} reps`}
            sound={state.sound}
            vibration={state.vibration}
            onContinue={continueRest}
            onAdd={() => addRest(30)}
          />
        ) : (
          <>
            <p className="eyebrow">
              Exercise {exerciseIndex + 1} of {workoutExercises.length}
            </p>
            <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight text-foreground">
              {exercise.name}
            </h1>
            <p className="num mt-1 text-sm text-muted-foreground">
              Set {setIndex + 1} of {exercise.sets} · target {exercise.repLow}–{exercise.repHigh} reps
            </p>
            {exercise.lastResult ? (
              <p className="num mt-3 inline-block rounded-md bg-elevated px-3 py-1.5 text-xs text-muted-foreground">
                Previous: {exercise.lastResult}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <NumberField label="Weight" value={weight} step={2.5} unit="kg" onChange={setWeight} />
              <NumberField label="Repetitions" value={reps} step={1} unit="reps" onChange={setReps} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                aria-expanded={notesOpen}
                className="tap inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Info aria-hidden className="size-4" /> Technique notes
              </button>
              {notesOpen ? (
                <p className="mt-2 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-muted-foreground">
                  {exercise.note ?? "Keep the movement controlled and the range consistent."}
                </p>
              ) : null}
            </div>

            {session.logs.filter((l) => l.exerciseId === exercise.id).length > 0 ? (
              <Panel className="mt-5 divide-y divide-border">
                {session.logs
                  .filter((l) => l.exerciseId === exercise.id)
                  .map((l) => (
                    <p
                      key={`${l.exerciseId}-${l.setIndex}`}
                      className="num grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-2.5 text-xs"
                    >
                      <span className="text-muted-foreground">Set {l.setIndex + 1}</span>
                      <span className="text-foreground">
                        {l.skipped ? "Skipped" : `${l.weight} kg × ${l.reps}`}
                        {!l.synced ? (
                          <span className="ml-2 text-warn">· on device</span>
                        ) : null}
                      </span>
                    </p>
                  ))}
              </Panel>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Action tone="ghost" onClick={skipSet}>
                <SkipForward aria-hidden className="size-4" /> Skip set
              </Action>
              <Action tone="ghost" onClick={skipExercise}>
                Skip exercise
              </Action>
            </div>
          </>
        )}

        <div className="mt-8 rounded-xl border border-dashed border-border p-4">
          <p className="eyebrow">Prototype controls</p>
          <button
            type="button"
            aria-pressed={state.offline}
            onClick={() =>
              set({ offline: !state.offline, syncStatus: state.offline ? "pending" : "offline-stored" })
            }
            className={`tap mt-2 rounded-md border px-3 text-xs font-medium ${
              state.offline ? "border-warn text-warn" : "border-border text-muted-foreground"
            }`}
          >
            {state.offline ? "Offline (simulated)" : "Online"}
          </button>
        </div>
      </main>

      {/* bottom-reachable primary action */}
      {!resting ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 pb-6 backdrop-blur">
          <div className="mx-auto max-w-md space-y-2">
            <Action size="lg" className="w-full" onClick={() => completeSet(weight, reps)}>
              Complete set
            </Action>
            <button
              type="button"
              onClick={() => setConfirmIncomplete(true)}
              className="tap w-full text-xs text-muted-foreground"
            >
              Finish workout early
            </button>
          </div>
        </div>
      ) : null}

      {/* pause / leave sheet */}
      {menuOpen ? (
        <Overlay onClose={() => setMenuOpen(false)} label="Workout options">
          <h2 className="text-base font-semibold text-foreground">Pause or leave</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you logged is already saved on this device.
          </p>
          <div className="mt-5 space-y-2">
            <Action
              className="w-full"
              onClick={() => setMenuOpen(false)}
            >
              Stay in workout
            </Action>
            <Action
              tone="outline"
              className="w-full"
              onClick={() => {
                setMenuOpen(false);
                navigate({ to: "/" });
              }}
            >
              Resume later
            </Action>
            <Action
              tone="danger"
              className="w-full"
              onClick={() => {
                setMenuOpen(false);
                setConfirmCancel(true);
              }}
            >
              Cancel workout
            </Action>
          </div>
        </Overlay>
      ) : null}

      {confirmCancel ? (
        <Overlay onClose={() => setConfirmCancel(false)} label="Confirm cancellation">
          <h2 className="text-base font-semibold text-foreground">Cancel this workout?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The {loggedSets} sets you already logged will be kept in your training history as a
            cancelled session. Remaining sets will not be recorded, and your plan stays unchanged.
          </p>
          <div className="mt-5 space-y-2">
            <Action
              tone="danger"
              className="w-full"
              onClick={() => {
                finishWorkout("cancelled");
                navigate({ to: "/workout/summary" });
              }}
            >
              Yes, cancel workout
            </Action>
            <Action tone="outline" className="w-full" onClick={() => setConfirmCancel(false)}>
              Keep training
            </Action>
          </div>
        </Overlay>
      ) : null}

      {confirmIncomplete ? (
        <Overlay onClose={() => setConfirmIncomplete(false)} label="Finish early">
          <h2 className="text-base font-semibold text-foreground">Finish with sets remaining?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {totalPlannedSets - session.logs.length} sets are still scheduled. Your{" "}
            {loggedSets} logged sets will be saved and the session will be marked as partially
            completed.
          </p>
          <div className="mt-5 space-y-2">
            <Action
              className="w-full"
              onClick={() => {
                finishWorkout("completed");
                navigate({ to: "/workout/summary" });
              }}
            >
              Finish and save
            </Action>
            <Action tone="outline" className="w-full" onClick={() => setConfirmIncomplete(false)}>
              Continue workout
            </Action>
          </div>
        </Overlay>
      ) : null}
    </div>
  );
}

function RestPanel({
  remaining,
  total,
  nextLabel,
  target,
  sound,
  vibration,
  onContinue,
  onAdd,
}: {
  remaining: number;
  total: number;
  nextLabel: string;
  target: string;
  sound: boolean;
  vibration: boolean;
  onContinue: () => void;
  onAdd: () => void;
}) {
  return (
    <section aria-live="polite" className="pt-4 text-center">
      <p className="eyebrow">Rest</p>
      <p className="num mt-3 text-[4.5rem] font-semibold leading-none text-foreground">
        {formatClock(remaining)}
      </p>
      <p className="num mt-2 text-xs text-muted-foreground">of {formatClock(total)} planned rest</p>

      <div className="mx-auto mt-6 max-w-xs rounded-xl border border-border bg-surface p-4 text-left">
        <p className="text-sm font-medium text-foreground">{nextLabel}</p>
        <p className="num mt-1 text-xs text-muted-foreground">Target {target}</p>
      </div>

      <div className="mt-6 space-y-2">
        <Action size="lg" className="w-full" onClick={onContinue}>
          Continue now
        </Action>
        <Action tone="outline" className="w-full" onClick={onAdd}>
          Add 30 seconds
        </Action>
      </div>

      <p className="mt-5 inline-flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {sound ? <Volume2 aria-hidden className="size-3.5" /> : <VolumeX aria-hidden className="size-3.5" />}
          Sound {sound ? "on" : "off"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Smartphone aria-hidden className="size-3.5" />
          Vibration {vibration ? "on" : "off"}
        </span>
      </p>
    </section>
  );
}

function Overlay({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-md rounded-t-2xl border border-border bg-surface p-5 pb-8 shadow-sheet sm:rounded-2xl sm:pb-5"
      >
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap -mr-2 -mt-2 grid place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Info,
  MoreHorizontal,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Smartphone,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SyncPill } from "@/components/forge/SyncPill";
import { Action, ActionLink, NumberField, Panel, SystemState } from "@/components/forge/ui";
import {
  exAt,
  formatClock,
  totalPlannedSets,
  useActiveElapsed,
  useCountdown,
  useForge,
  type LoggedSet,
} from "@/lib/forge/store";
import { formatKg } from "@/lib/forge/records";

export const Route = createFileRoute("/workout/active")({
  head: () => ({
    meta: [
      { title: "Treino ativo — Forge" },
      {
        name: "description",
        content:
          "Registre cada série com controles grandes, descanso guiado e armazenamento seguro offline.",
      },
      { property: "og:title", content: "Treino ativo — Forge" },
      { property: "og:description", content: "Uma série por vez. Salvo neste dispositivo." },
    ],
  }),
  component: ActiveWorkout,
});

function ActiveWorkout() {
  const {
    state,
    completeSet,
    skipSet,
    skipExercise,
    continueRest,
    addRest,
    pauseWorkout,
    resumeWorkout,
    finishWorkout,
  } = useForge();
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
  const exercise = session ? exAt(session, exerciseIndex) : null;
  const elapsed = useActiveElapsed(session);
  const restEndsAt = session?.rest?.endsAt ?? null;
  const remaining = useCountdown(restEndsAt);

  useEffect(() => {
    if (!exercise) return;
    setWeight(exercise.suggestedWeight);
    setReps(exercise.repHigh);
  }, [exercise]);

  useEffect(() => {
    if (restEndsAt && remaining === 0) continueRest();
  }, [remaining, restEndsAt, continueRest]);

  useEffect(() => {
    if (session?.finishedAt && !session.rest) {
      const validSets = session.logs.filter((l) => !l.skipped).length;
      finishWorkout(validSets >= totalPlannedSets(session) ? "completed" : "partial");
      navigate({ to: "/workout/summary" });
    }
  }, [session, finishWorkout, navigate]);

  if (!state.hydrated) return null;

  if (!session) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <SystemState
          kind="empty"
          title="Nenhum treino em andamento"
          body="Não há sessão ativa neste dispositivo agora."
          action={<ActionLink to="/workout">Abrir prévia do treino</ActionLink>}
        />
      </main>
    );
  }

  if (!exercise) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <SystemState
          kind="error"
          title="Treino sem exercícios"
          body="A sessão foi encontrada, mas não possui exercícios disponíveis."
          action={<ActionLink to="/">Voltar para Hoje</ActionLink>}
        />
      </main>
    );
  }

  const plannedSets = totalPlannedSets(session);
  const loggedSets = session.logs.filter((l) => !l.skipped).length;
  const progress = Math.round((session.logs.length / plannedSets) * 100);
  const resting = Boolean(session.rest) && remaining > 0;
  const paused = session.status === "paused";

  if (paused) {
    return (
      <main className="mx-auto max-w-md px-5 py-12">
        <p className="eyebrow">Sessão pausada</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{session.workoutName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          O cronômetro está parado. O tempo em pausa não conta como duração do treino.
        </p>
        <dl className="num mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
          <div>
            <dd className="text-xl font-semibold text-foreground">{formatClock(elapsed)}</dd>
            <dt className="mt-0.5 text-xs text-muted-foreground">Tempo ativo</dt>
          </div>
          <div>
            <dd className="text-xl font-semibold text-foreground">
              {loggedSets}
              <span className="text-sm font-normal text-muted-foreground">/{plannedSets}</span>
            </dd>
            <dt className="mt-0.5 text-xs text-muted-foreground">Séries registradas</dt>
          </div>
        </dl>
        <div className="mt-8 space-y-2">
          <Action size="lg" className="w-full" onClick={resumeWorkout}>
            Retomar treino
          </Action>
          <Action tone="outline" className="w-full" onClick={() => setConfirmIncomplete(true)}>
            Encerrar como parcial
          </Action>
          <Action tone="ghost" className="w-full" onClick={() => setConfirmCancel(true)}>
            Cancelar treino
          </Action>
        </div>

        {confirmIncomplete ? (
          <Overlay onClose={() => setConfirmIncomplete(false)} label="Encerrar como parcial">
            <h2 className="text-base font-semibold text-foreground">Encerrar como parcial?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Suas {loggedSets} séries registradas serão salvas e a sessão será marcada como
              parcialmente concluída.
            </p>
            <div className="mt-5 space-y-2">
              <Action
                className="w-full"
                onClick={() => {
                  finishWorkout("partial");
                  navigate({ to: "/workout/summary" });
                }}
              >
                Encerrar e salvar
              </Action>
              <Action tone="outline" className="w-full" onClick={() => setConfirmIncomplete(false)}>
                Voltar
              </Action>
            </div>
          </Overlay>
        ) : null}

        {confirmCancel ? (
          <Overlay onClose={() => setConfirmCancel(false)} label="Confirmar cancelamento">
            <h2 className="text-base font-semibold text-foreground">Cancelar este treino?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              As {loggedSets} séries já registradas continuam no histórico como sessão cancelada.
              Sessões canceladas não geram experiência.
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
                Sim, cancelar treino
              </Action>
              <Action tone="outline" className="w-full" onClick={() => setConfirmCancel(false)}>
                Voltar
              </Action>
            </div>
          </Overlay>
        ) : null}
      </main>
    );
  }

  const rest = session.rest;
  const upcoming = rest?.next ? exAt(session, rest.next.exerciseIndex) : null;
  const lastRecord = session.records[session.records.length - 1];
  const justSetRecord =
    rest && lastRecord && lastRecord.exerciseId === rest.log.exerciseId
      ? session.logs[session.logs.length - 1] === rest.log
        ? lastRecord
        : null
      : null;

  return (
    <div className="min-h-dvh bg-background pb-40">
      {/* Minimal workout chrome — primary navigation is intentionally hidden */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Pausar ou sair do treino"
            className="tap -ml-2 grid place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <ChevronDown aria-hidden className="size-5" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-xs font-medium text-foreground">{session.workoutName}</p>
            <p className="num text-xs text-muted-foreground">{formatClock(elapsed)}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Opções do treino"
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
            aria-label="Progresso do treino"
          >
            <div
              className="h-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="num mt-1.5 text-[0.6875rem] text-muted-foreground">
            {session.logs.length} de {plannedSets} séries · exercício {exerciseIndex + 1} de{" "}
            {session.exercises.length}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6">
        {state.offline ? (
          <div className="mb-5">
            <SyncPill />
            <p className="mt-2 text-xs text-muted-foreground">
              Esta sessão foi salva neste dispositivo. As séries continuam sendo registradas
              normalmente.
            </p>
          </div>
        ) : null}

        {resting && rest ? (
          <RestPanel
            remaining={remaining}
            total={rest.total}
            completed={rest.log}
            recordLabel={justSetRecord ? justSetRecord.previous : null}
            upcoming={
              upcoming && rest.next
                ? {
                    name: upcoming.name,
                    setLabel: `Série ${rest.next.setIndex + 1} de ${upcoming.sets}`,
                    target: `${upcoming.repLow}–${upcoming.repHigh} reps`,
                    suggested: `${formatKg(upcoming.suggestedWeight)} kg sugeridos`,
                  }
                : null
            }
            sound={state.sound}
            vibration={state.vibration}
            onContinue={continueRest}
            onAdd={() => addRest(30)}
          />
        ) : (
          <>
            <p className="eyebrow">
              Exercício {exerciseIndex + 1} de {session.exercises.length}
            </p>
            <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight text-foreground">
              {exercise.name}
            </h1>
            <p className="num mt-1 text-sm text-muted-foreground">
              Série {setIndex + 1} de {exercise.sets} · alvo {exercise.repLow}–{exercise.repHigh}{" "}
              reps
            </p>
            {exercise.lastResult ? (
              <p className="num mt-3 inline-block rounded-md bg-elevated px-3 py-1.5 text-xs text-muted-foreground">
                Anterior: {exercise.lastResult}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <NumberField label="Carga" value={weight} step={2.5} unit="kg" onChange={setWeight} />
              <NumberField
                label="Repetições"
                value={reps}
                step={1}
                unit="reps"
                onChange={setReps}
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                aria-expanded={notesOpen}
                className="tap inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Info aria-hidden className="size-4" /> Notas técnicas
              </button>
              {notesOpen ? (
                <p className="mt-2 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-muted-foreground">
                  {exercise.note ?? "Mantenha o movimento controlado e a amplitude consistente."}
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
                      <span className="text-muted-foreground">Série {l.setIndex + 1}</span>
                      <span className="text-foreground">
                        {l.skipped ? "Pulada" : `${formatKg(l.weight)} kg × ${l.reps}`}
                        {!l.synced ? (
                          <span className="ml-2 text-warn">· neste dispositivo</span>
                        ) : null}
                      </span>
                    </p>
                  ))}
              </Panel>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Action tone="ghost" onClick={skipSet}>
                <SkipForward aria-hidden className="size-4" /> Pular série
              </Action>
              <Action tone="ghost" onClick={skipExercise}>
                Pular exercício
              </Action>
            </div>
          </>
        )}
      </main>

      {/* bottom-reachable primary action */}
      {!resting ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 pb-6 backdrop-blur">
          <div className="mx-auto max-w-md space-y-2">
            <Action size="lg" className="w-full" onClick={() => completeSet(weight, reps)}>
              Concluir série
            </Action>
            <button
              type="button"
              onClick={() => setConfirmIncomplete(true)}
              className="tap w-full text-xs text-muted-foreground"
            >
              Encerrar treino mais cedo
            </button>
          </div>
        </div>
      ) : null}

      {/* pause / leave sheet */}
      {menuOpen ? (
        <Overlay onClose={() => setMenuOpen(false)} label="Opções do treino">
          <h2 className="text-base font-semibold text-foreground">Pausar ou sair</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tudo que você registrou já está salvo neste dispositivo.
          </p>
          <div className="mt-5 space-y-2">
            <Action className="w-full" onClick={() => setMenuOpen(false)}>
              Continuar no treino
            </Action>
            <Action
              tone="outline"
              className="w-full"
              onClick={() => {
                setMenuOpen(false);
                pauseWorkout();
                navigate({ to: "/" });
              }}
            >
              <Pause aria-hidden className="size-4" /> Retomar depois
            </Action>
            <Action
              tone="danger"
              className="w-full"
              onClick={() => {
                setMenuOpen(false);
                setConfirmCancel(true);
              }}
            >
              Cancelar treino
            </Action>
          </div>
        </Overlay>
      ) : null}

      {confirmCancel ? (
        <Overlay onClose={() => setConfirmCancel(false)} label="Confirmar cancelamento">
          <h2 className="text-base font-semibold text-foreground">Cancelar este treino?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            As {loggedSets} séries que você já registrou serão mantidas no histórico de treinos como
            uma sessão cancelada. Sessões canceladas não geram experiência, e seu plano permanece
            inalterado.
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
              Sim, cancelar treino
            </Action>
            <Action tone="outline" className="w-full" onClick={() => setConfirmCancel(false)}>
              Continuar treinando
            </Action>
          </div>
        </Overlay>
      ) : null}

      {confirmIncomplete ? (
        <Overlay onClose={() => setConfirmIncomplete(false)} label="Encerrar mais cedo">
          <h2 className="text-base font-semibold text-foreground">
            Encerrar com séries restantes?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Ainda há {plannedSets - session.logs.length} séries agendadas. Suas {loggedSets} séries
            registradas serão salvas e a sessão será marcada como parcialmente concluída.
          </p>
          <div className="mt-5 space-y-2">
            <Action
              className="w-full"
              onClick={() => {
                finishWorkout("partial");
                navigate({ to: "/workout/summary" });
              }}
            >
              Encerrar e salvar
            </Action>
            <Action tone="outline" className="w-full" onClick={() => setConfirmIncomplete(false)}>
              Continuar treino
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
  completed,
  recordLabel,
  upcoming,
  sound,
  vibration,
  onContinue,
  onAdd,
}: {
  remaining: number;
  total: number;
  completed: LoggedSet;
  recordLabel: string | null;
  upcoming: { name: string; setLabel: string; target: string; suggested: string } | null;
  sound: boolean;
  vibration: boolean;
  onContinue: () => void;
  onAdd: () => void;
}) {
  const displayedRemaining = Math.min(remaining, total);

  return (
    <section aria-live="polite" className="pt-4 text-center">
      <p className="eyebrow">Descanso</p>
      <p className="num mt-3 text-[4.5rem] font-semibold leading-none text-foreground">
        {formatClock(displayedRemaining)}
      </p>
      <p className="num mt-2 text-xs text-muted-foreground">
        de {formatClock(total)} de descanso planejado
      </p>

      {/* what was just completed */}
      <div className="mx-auto mt-6 max-w-xs rounded-xl border border-border bg-surface p-4 text-left">
        <p className="eyebrow">Série concluída</p>
        <p className="mt-1.5 text-sm font-medium text-foreground">{completed.exerciseName}</p>
        <p className="num mt-0.5 text-sm text-muted-foreground">
          Série {completed.setIndex + 1} · {formatKg(completed.weight)} kg × {completed.reps} reps
        </p>
        {recordLabel ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary">
            <Trophy aria-hidden className="size-3.5" /> Recorde pessoal · antes {recordLabel}
          </p>
        ) : null}
      </div>

      {/* what comes next */}
      {upcoming ? (
        <div className="mx-auto mt-3 max-w-xs rounded-xl border border-border bg-surface p-4 text-left">
          <p className="eyebrow">A seguir</p>
          <p className="mt-1.5 text-sm font-medium text-foreground">{upcoming.name}</p>
          <p className="num mt-0.5 text-sm text-muted-foreground">
            {upcoming.setLabel} · alvo {upcoming.target}
          </p>
          <p className="num mt-0.5 text-xs text-muted-foreground">{upcoming.suggested}</p>
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        <Action size="lg" className="w-full" onClick={onContinue}>
          Continuar agora
        </Action>
        <Action tone="outline" className="w-full" onClick={onAdd}>
          Adicionar 30 segundos
        </Action>
      </div>

      <p className="mt-5 inline-flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {sound ? (
            <Volume2 aria-hidden className="size-3.5" />
          ) : (
            <VolumeX aria-hidden className="size-3.5" />
          )}
          Som {sound ? "ligado" : "desligado"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Smartphone aria-hidden className="size-3.5" />
          Vibração {vibration ? "ligada" : "desligada"}
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
            aria-label="Fechar"
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

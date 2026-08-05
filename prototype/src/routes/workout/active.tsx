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
  const { state, completeSet, skipSet, skipExercise, continueRest, addRest, finishWorkout } =
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
    if (session?.finishedAt) {
      finishWorkout("completed");
      navigate({ to: "/workout/summary" });
    }
  }, [session?.finishedAt, finishWorkout, navigate]);

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
            aria-label="Pausar ou sair do treino"
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
            {session.logs.length} de {totalPlannedSets} séries · exercício {exerciseIndex + 1} de{" "}
            {workoutExercises.length}
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

        {resting ? (
          <RestPanel
            remaining={remaining}
            total={session.restTotal}
            nextLabel={
              nextIsNewExercise
                ? `Próximo: ${exercise.name} · série 1 de ${exercise.sets}`
                : `Próximo: ${exercise.name} · série ${setIndex + 1} de ${exercise.sets}`
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
              Exercício {exerciseIndex + 1} de {workoutExercises.length}
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
                        {l.skipped ? "Pulada" : `${l.weight} kg × ${l.reps}`}
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
                navigate({ to: "/" });
              }}
            >
              Retomar depois
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
            uma sessão cancelada. As séries restantes não serão registradas, e seu plano permanece
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
            Ainda há {totalPlannedSets - session.logs.length} séries agendadas. Suas {loggedSets}{" "}
            séries registradas serão salvas e a sessão será marcada como parcialmente concluída.
          </p>
          <div className="mt-5 space-y-2">
            <Action
              className="w-full"
              onClick={() => {
                finishWorkout("completed");
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

      <div className="mx-auto mt-6 max-w-xs rounded-xl border border-border bg-surface p-4 text-left">
        <p className="text-sm font-medium text-foreground">{nextLabel}</p>
        <p className="num mt-1 text-xs text-muted-foreground">Alvo {target}</p>
      </div>

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

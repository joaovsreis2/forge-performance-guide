import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, ActionLink, Panel, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/workout/")({
  head: () => ({
    meta: [
      { title: "Prévia do treino — Forge" },
      {
        name: "description",
        content: "Revise os exercícios, séries e descansos de hoje antes de iniciar a sessão.",
      },
      { property: "og:title", content: "Prévia do treino — Forge" },
      { property: "og:description", content: "Revise a sessão e comece quando estiver pronto." },
    ],
  }),
  component: WorkoutPreview,
});

function WorkoutPreview() {
  const ready = useAppGate();
  const { startWorkout, state } = useForge();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const remoteWorkout = state.remotePlan?.days.find(
    (day) => day.id === state.remotePlan?.todayWorkoutId,
  );
  const workout = remoteWorkout
    ? {
        ...remoteWorkout,
        exercises: remoteWorkout.exercises.map((exercise) => ({
          ...exercise,
          repLow: exercise.repLow ?? 0,
          repHigh: exercise.repHigh ?? 0,
          lastResult: undefined,
        })),
      }
    : null;

  return (
    <AppShell eyebrow="Prévia da sessão" title={workout?.name ?? "Treino de hoje"}>
      {!ready ? (
        <GateFallback />
      ) : !workout ? (
        <SystemState
          kind="empty"
          title="Nenhum treino agendado"
          body="Seu plano não possui uma sessão disponível para hoje."
          action={<ActionLink to="/plan">Ver plano</ActionLink>}
        />
      ) : (
        <>
          <ActionLink to="/" tone="ghost" className="-ml-4">
            <ArrowLeft aria-hidden className="size-4" /> Hoje
          </ActionLink>

          <section className="mt-2">
            <p className="text-sm text-muted-foreground">{workout.focus}</p>
            <dl className="num mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="sr-only">Exercícios</dt>
                <dd className="text-foreground">
                  {workout.exercises.length}{" "}
                  <span className="text-muted-foreground">exercícios</span>
                </dd>
              </div>
              <div>
                <dt className="sr-only">Séries</dt>
                <dd className="text-foreground">
                  {workout.exercises.reduce((n, e) => n + e.sets, 0)}{" "}
                  <span className="text-muted-foreground">séries</span>
                </dd>
              </div>
              <div>
                <dt className="sr-only">Duração estimada</dt>
                <dd className="text-foreground">
                  ~{workout.estimatedMinutes} <span className="text-muted-foreground">min</span>
                </dd>
              </div>
            </dl>
          </section>

          <ol className="mt-7 space-y-2">
            {workout.exercises.map((ex, i) => (
              <li key={ex.id}>
                <Panel className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 p-4">
                  <span className="num pt-0.5 text-xs text-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{ex.name}</p>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {ex.sets} séries · {ex.repLow}–{ex.repHigh} reps · {ex.restSeconds}s descanso
                    </p>
                    {ex.lastResult ? (
                      <p className="num mt-1 text-xs text-subtle">Última vez: {ex.lastResult}</p>
                    ) : null}
                    {ex.note ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenNoteId((current) => (current === ex.id ? null : ex.id))
                          }
                          aria-expanded={openNoteId === ex.id}
                          className="tap inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground hover:bg-elevated hover:text-foreground"
                        >
                          <Info aria-hidden className="size-3.5" />
                          Notas
                        </button>
                        {openNoteId === ex.id ? (
                          <p className="mt-2 rounded-md bg-elevated px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                            {ex.note}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </Panel>
              </li>
            ))}
          </ol>

          {state.offline && !state.session ? (
            <div className="mt-6">
              <SystemState
                kind="offline"
                title="Conecte-se para iniciar"
                body="Um treino já iniciado continua funcionando sem internet. Para criar uma nova sessão, sincronize primeiro."
              />
            </div>
          ) : null}

          {startError ? (
            <div className="mt-6">
              <SystemState
                kind="error"
                title="Não foi possível iniciar"
                body={startError}
                preserved="Nenhuma sessão foi criada ou alterada. Tente novamente quando a conexão estiver estável."
              />
            </div>
          ) : null}

          <div className="sticky bottom-24 mt-8 md:bottom-6">
            <Action
              size="lg"
              className="w-full shadow-raised"
              disabled={starting || (state.offline && !state.session)}
              onClick={async () => {
                if (state.offline && !state.session) return;
                if (state.session) {
                  await navigate({ to: "/workout/active" });
                  return;
                }

                setStarting(true);
                setStartError("");
                try {
                  const started = await startWorkout();
                  if (started) await navigate({ to: "/workout/active" });
                  else setStartError("O treino de hoje não está disponível para iniciar.");
                } catch (error) {
                  setStartError(
                    error instanceof Error
                      ? error.message
                      : "O servidor não confirmou o início do treino.",
                  );
                } finally {
                  setStarting(false);
                }
              }}
            >
              {starting ? "Iniciando..." : state.session ? "Retomar treino" : "Iniciar treino"}{" "}
              <ArrowRight aria-hidden className="size-4" />
            </Action>
          </div>
        </>
      )}
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, ActionLink, Panel } from "@/components/forge/ui";
import { todaysWorkout } from "@/lib/forge/data";
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
  const workout = todaysWorkout!;

  return (
    <AppShell eyebrow="Prévia da sessão" title={workout.name}>
      {!ready ? (
        <GateFallback />
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
                      <p className="mt-2 rounded-md bg-elevated px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        {ex.note}
                      </p>
                    ) : null}
                  </div>
                </Panel>
              </li>
            ))}
          </ol>

          <div className="sticky bottom-24 mt-8 md:bottom-6">
            <Action
              size="lg"
              className="w-full shadow-raised"
              onClick={() => {
                if (!state.session) startWorkout();
                navigate({ to: "/workout/active" });
              }}
            >
              {state.session ? "Retomar treino" : "Iniciar treino"}{" "}
              <ArrowRight aria-hidden className="size-4" />
            </Action>
          </div>
        </>
      )}
    </AppShell>
  );
}

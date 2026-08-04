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
      { title: "Workout preview — Forge" },
      {
        name: "description",
        content: "Review today's exercises, sets and rest before you start the session.",
      },
      { property: "og:title", content: "Workout preview — Forge" },
      { property: "og:description", content: "Review the session, then start when ready." },
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
    <AppShell eyebrow="Session preview" title={workout.name}>
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <ActionLink to="/" tone="ghost" className="-ml-4">
            <ArrowLeft aria-hidden className="size-4" /> Today
          </ActionLink>

          <section className="mt-2">
            <p className="text-sm text-muted-foreground">{workout.focus}</p>
            <dl className="num mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="sr-only">Exercises</dt>
                <dd className="text-foreground">
                  {workout.exercises.length} <span className="text-muted-foreground">exercises</span>
                </dd>
              </div>
              <div>
                <dt className="sr-only">Sets</dt>
                <dd className="text-foreground">
                  {workout.exercises.reduce((n, e) => n + e.sets, 0)}{" "}
                  <span className="text-muted-foreground">sets</span>
                </dd>
              </div>
              <div>
                <dt className="sr-only">Estimated duration</dt>
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
                      {ex.sets} sets · {ex.repLow}–{ex.repHigh} reps · {ex.restSeconds}s rest
                    </p>
                    {ex.lastResult ? (
                      <p className="num mt-1 text-xs text-subtle">Last time: {ex.lastResult}</p>
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
              {state.session ? "Resume workout" : "Start workout"}{" "}
              <ArrowRight aria-hidden className="size-4" />
            </Action>
          </div>
        </>
      )}
    </AppShell>
  );
}

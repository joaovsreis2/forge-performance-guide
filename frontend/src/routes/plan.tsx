import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { ActionLink, Panel, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plano — Forge" },
      {
        name: "description",
        content: "Sua estrutura semanal: dias de treino, ordem dos exercícios, séries e descanso.",
      },
      { property: "og:title", content: "Plano — Forge" },
      {
        property: "og:description",
        content: "Estrutura semanal, ordem dos exercícios, séries e descanso.",
      },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const ready = useAppGate();
  const { state } = useForge();
  const plan = state.remotePlan;
  const days = plan?.days ?? [];

  return (
    <AppShell eyebrow="Plano ativo" title="Plano">
      {!ready ? (
        <GateFallback />
      ) : !plan?.id ? (
        <SystemState
          kind="empty"
          title="Nenhum plano ativo"
          body="Quando um plano for atribuído à sua conta, a estrutura semanal aparecerá aqui."
        />
      ) : (
        <>
          <section>
            <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[0.6875rem] text-muted-foreground">
              <Lock aria-hidden className="size-3" /> Somente leitura nesta versão
            </p>
          </section>

          <div className="mt-8 space-y-4">
            {days.map((day) => (
              <Panel key={day.id} className="overflow-hidden">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="eyebrow">{day.weekday}</p>
                    <h3 className="truncate text-sm font-semibold text-foreground">{day.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{day.focus}</p>
                  </div>
                  <p className="num shrink-0 text-xs text-muted-foreground">
                    {day.kind === "rest" ? "Sem sessão" : `~${day.estimatedMinutes} min`}
                  </p>
                </div>

                {day.kind === "rest" ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    Descanso agendado. Recuperação faz parte do progresso.
                  </p>
                ) : (
                  <ol className="divide-y divide-border">
                    {day.exercises.map((ex, i) => (
                      <li key={ex.id} className="px-4 py-3.5">
                        <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
                          <span className="num pt-0.5 text-xs text-subtle">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{ex.name}</p>
                            <p className="num mt-1 text-xs text-muted-foreground">
                              {ex.sets} séries · {ex.repLow}–{ex.repHigh} reps · {ex.restSeconds}s
                              descanso
                            </p>
                            {ex.note ? (
                              <p className="mt-1.5 text-xs leading-relaxed text-subtle">
                                {ex.note}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            ))}
          </div>

          <div className="mt-8">
            <ActionLink to="/workout" tone="outline">
              Ver treino de hoje
            </ActionLink>
          </div>
        </>
      )}
    </AppShell>
  );
}

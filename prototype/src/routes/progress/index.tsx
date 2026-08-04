import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { ActionLink, Panel, Row, Rows, ScoreBar, Section } from "@/components/forge/ui";
import { consistencyWeeks, dimensions, personalRecords } from "@/lib/forge/data";

export const Route = createFileRoute("/progress/")({
  head: () => ({
    meta: [
      { title: "Progresso — Forge" },
      {
        name: "description",
        content:
          "Performance, consistência e recuperação explicadas separadamente, com recordes, histórico e medidas.",
      },
      { property: "og:title", content: "Progresso — Forge" },
      {
        property: "og:description",
        content: "Dimensões explicáveis em vez de um painel genérico.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const ready = useAppGate();

  return (
    <AppShell eyebrow="Últimas 6 semanas" title="Progresso">
      {!ready ? (
        <GateFallback />
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-x-10">
          <div>
            <section>
              <p className="eyebrow">Mudança mais recente</p>
              <h2 className="mt-2 text-xl font-semibold leading-snug text-foreground">
                Supino reto avançou de 67,5 kg × 9 para 70 kg × 9
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Registrado em 24 mar. É um recorde de repetições com carga maior, com base em quatro
                séries registradas.
              </p>
              <ActionLink to="/progress/exercise" tone="ghost" className="-ml-4 mt-2">
                Ver progresso por exercício <ArrowUpRight aria-hidden className="size-4" />
              </ActionLink>
            </section>

            <Section
              title="Dimensões de treino"
              hint="Cada pontuação é medida e explicada separadamente"
            >
              <Panel className="divide-y divide-border px-4">
                {dimensions.map((d) => (
                  <ScoreBar
                    key={d.key}
                    label={d.label}
                    score={d.score}
                    confidence={d.confidence}
                    trend={d.trend}
                    explanation={d.explanation}
                  />
                ))}
              </Panel>
            </Section>
          </div>

          <div>
            <Section title="Consistência" hint="Sessões concluídas em relação às agendadas">
              <Panel className="p-4">
                <ul className="flex items-end gap-3">
                  {consistencyWeeks.map((w) => (
                    <li key={w.week} className="flex-1 text-center">
                      <div className="mx-auto flex h-24 w-6 items-end overflow-hidden rounded-sm bg-elevated">
                        <div
                          className="w-full bg-primary"
                          style={{ height: `${(w.done / w.planned) * 100}%` }}
                        />
                      </div>
                      <p className="num mt-2 text-[0.6875rem] text-muted-foreground">{w.week}</p>
                      <p className="num text-[0.6875rem] text-subtle">
                        {w.done}/{w.planned}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  A semana 5 ainda está em andamento. Dias de descanso não contam contra você.
                </p>
              </Panel>
            </Section>

            <Section title="Recordes pessoais">
              <Rows>
                {personalRecords.map((r) => (
                  <Row
                    key={`${r.exercise}-${r.date}`}
                    label={r.exercise}
                    sub={`Recorde de ${r.kind.toLowerCase()} · ${r.date}`}
                    right={<span className="num">{r.detail}</span>}
                  />
                ))}
              </Rows>
            </Section>

            <Section title="Mais">
              <Rows>
                {[
                  {
                    to: "/progress/exercise",
                    label: "Progresso por exercício",
                    sub: "Gráficos por exercício",
                  },
                  {
                    to: "/progress/history",
                    label: "Histórico de treinos",
                    sub: "Sessões concluídas e canceladas",
                  },
                  {
                    to: "/progress/recovery",
                    label: "Recuperação e hábitos",
                    sub: "Sono, hidratação, movimento",
                  },
                  {
                    to: "/progress/measurements",
                    label: "Medidas corporais",
                    sub: "Peso e circunferências",
                  },
                  {
                    to: "/progress/levels",
                    label: "Nível e experiência",
                    sub: "Registro de XP e conquistas",
                  },
                ].map((l) => (
                  <li key={l.to}>
                    <ActionLink
                      to={l.to}
                      tone="ghost"
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-foreground">{l.label}</span>
                        <span className="block text-xs text-muted-foreground">{l.sub}</span>
                      </span>
                      <ArrowUpRight aria-hidden className="size-4 shrink-0" />
                    </ActionLink>
                  </li>
                ))}
              </Rows>
            </Section>
          </div>
        </div>
      )}
    </AppShell>
  );
}

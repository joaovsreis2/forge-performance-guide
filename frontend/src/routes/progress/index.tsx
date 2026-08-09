import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { ActionLink, Panel, Row, Rows, ScoreBar, Section } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

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
  const { state } = useForge();
  const remote = state.remoteProgress;
  const progression = remote?.progression;
  const dimensions = [
    {
      key: "performance",
      label: "Performance",
      score: progression?.performance ?? 0,
      confidence: remote?.records.length ? "Alta" : "Baixa",
      trend: "Dados atuais",
      explanation: "Calculada a partir dos recordes pessoais validados.",
    },
    {
      key: "consistency",
      label: "Consistência",
      score: progression?.consistency ?? 0,
      confidence: remote?.sessions.length ? "Média" : "Baixa",
      trend: "Dados atuais",
      explanation: "Calculada a partir de sessões concluídas.",
    },
    {
      key: "recovery",
      label: "Recuperação",
      score: progression?.recovery ?? 0,
      confidence: progression?.recovery ? "Média" : "Baixa",
      trend: "Dados atuais",
      explanation: "Calculada a partir dos registros diários de recuperação.",
    },
  ];
  const latestRecord = remote?.records[0];

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
                {latestRecord
                  ? `${latestRecord.exercise}: ${latestRecord.value} em ${latestRecord.type.toLowerCase()}`
                  : "Seu primeiro recorde aparecerá aqui"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {latestRecord
                  ? `Validado em ${new Date(`${latestRecord.date}T12:00:00`).toLocaleDateString("pt-BR")}.`
                  : "Conclua séries com carga ou repetições para começar a formar seu histórico."}
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
                  {(remote?.sessions ?? [])
                    .slice(0, 6)
                    .reverse()
                    .map((session) => (
                      <li key={session.id} className="flex-1 text-center">
                        <div className="mx-auto flex h-24 w-6 items-end overflow-hidden rounded-sm bg-elevated">
                          <div
                            className="w-full bg-primary"
                            style={{ height: session.status === "completed" ? "100%" : "35%" }}
                          />
                        </div>
                        <p className="num mt-2 text-[0.6875rem] text-muted-foreground">
                          {new Date(`${session.date}T12:00:00`).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </p>
                      </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Sessões concluídas aparecem preenchidas; canceladas permanecem registradas.
                </p>
              </Panel>
            </Section>

            <Section title="Recordes pessoais">
              <Rows>
                {(remote?.records ?? []).map((r) => (
                  <Row
                    key={`${r.exercise}-${r.date}`}
                    label={r.exercise}
                    sub={`${r.type} · ${new Date(`${r.date}T12:00:00`).toLocaleDateString("pt-BR")}`}
                    right={<span className="num">{r.value}</span>}
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

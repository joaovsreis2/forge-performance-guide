import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Panel, Row, Rows, ScoreBar, Section } from "@/components/forge/ui";
import { achievements, dimensions, xpLedger } from "@/lib/forge/data";
import { useForge, XP_PER_LEVEL } from "@/lib/forge/store";

export const Route = createFileRoute("/progress/levels")({
  head: () => ({
    meta: [
      { title: "Nível e experiência — Forge" },
      {
        name: "description",
        content:
          "Nível, registro de experiência e conquistas mantidos como camada secundária aos dados de treino.",
      },
      { property: "og:title", content: "Nível e experiência — Forge" },
      { property: "og:description", content: "Uma camada discreta sobre o progresso real." },
    ],
  }),
  component: Levels,
});

function Levels() {
  const ready = useAppGate();
  const { state } = useForge();
  const into = state.xp % XP_PER_LEVEL;

  return (
    <AppShell eyebrow="Progresso" title="Nível e experiência">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <Panel className="p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
              <p className="text-sm text-muted-foreground">Nível {state.level}</p>
              <p className="num text-sm text-foreground">
                {state.xp.toLocaleString("pt-BR")} XP no total
              </p>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated"
              role="progressbar"
              aria-valuenow={into}
              aria-valuemin={0}
              aria-valuemax={XP_PER_LEVEL}
              aria-label={`Progresso para o nível ${state.level + 1}`}
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }}
              />
            </div>
            <p className="num mt-2 text-xs text-muted-foreground">
              {XP_PER_LEVEL - into} XP para o nível {state.level + 1}
            </p>
          </Panel>

          <Section title="Experiência recente">
            <Rows>
              {xpLedger.map((x) => (
                <Row
                  key={x.label}
                  label={x.label}
                  sub={x.detail}
                  right={<span className="num">+{x.xp} XP</span>}
                />
              ))}
            </Rows>
          </Section>

          <Section title="Conquistas">
            <Rows>
              {achievements.map((a) => (
                <Row
                  key={a.name}
                  label={a.name}
                  sub={a.detail}
                  right={
                    <span className="text-xs">{a.earned ? "Conquistada" : "Em progresso"}</span>
                  }
                />
              ))}
            </Rows>
          </Section>

          <Section title="Como as dimensões são calculadas">
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
        </>
      )}
    </AppShell>
  );
}

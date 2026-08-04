import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Panel, Row, Rows, ScoreBar, Section } from "@/components/forge/ui";
import { achievements, dimensions, xpLedger } from "@/lib/forge/data";
import { useForge, XP_PER_LEVEL } from "@/lib/forge/store";

export const Route = createFileRoute("/progress/levels")({
  head: () => ({
    meta: [
      { title: "Level and experience — Forge" },
      { name: "description", content: "Level, experience ledger and achievements, kept secondary to training data." },
      { property: "og:title", content: "Level and experience — Forge" },
      { property: "og:description", content: "A quiet layer on top of real progress." },
    ],
  }),
  component: Levels,
});

function Levels() {
  const ready = useAppGate();
  const { state } = useForge();
  const into = state.xp % XP_PER_LEVEL;

  return (
    <AppShell eyebrow="Progress" title="Level and experience">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <Panel className="p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
              <p className="text-sm text-muted-foreground">Level {state.level}</p>
              <p className="num text-sm text-foreground">{state.xp.toLocaleString()} XP total</p>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated"
              role="progressbar"
              aria-valuenow={into}
              aria-valuemin={0}
              aria-valuemax={XP_PER_LEVEL}
              aria-label={`Progress to level ${state.level + 1}`}
            >
              <div className="h-full bg-primary" style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }} />
            </div>
            <p className="num mt-2 text-xs text-muted-foreground">
              {XP_PER_LEVEL - into} XP to level {state.level + 1}
            </p>
          </Panel>

          <Section title="Recent experience">
            <Rows>
              {xpLedger.map((x) => (
                <Row key={x.label} label={x.label} sub={x.detail} right={<span className="num">+{x.xp} XP</span>} />
              ))}
            </Rows>
          </Section>

          <Section title="Achievements">
            <Rows>
              {achievements.map((a) => (
                <Row
                  key={a.name}
                  label={a.name}
                  sub={a.detail}
                  right={<span className="text-xs">{a.earned ? "Earned" : "In progress"}</span>}
                />
              ))}
            </Rows>
          </Section>

          <Section title="How the dimensions are calculated">
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

import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { PrototypeBar } from "@/components/forge/PrototypeBar";
import { ActionLink, Panel, Row, Rows, ScoreBar, Section } from "@/components/forge/ui";
import { consistencyWeeks, dimensions, personalRecords } from "@/lib/forge/data";

export const Route = createFileRoute("/progress/")({
  head: () => ({
    meta: [
      { title: "Progress — Forge" },
      {
        name: "description",
        content:
          "Performance, consistency and recovery explained separately, with records, history and measurements.",
      },
      { property: "og:title", content: "Progress — Forge" },
      { property: "og:description", content: "Explainable dimensions instead of a dashboard." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const ready = useAppGate();

  return (
    <AppShell eyebrow="Last 6 weeks" title="Progress">
      {!ready ? (
        <GateFallback />
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-x-10">
          <div>
            <section>
              <p className="eyebrow">Most recent change</p>
              <h2 className="mt-2 text-xl font-semibold leading-snug text-foreground">
                Bench Press moved from 67.5 kg × 9 to 70 kg × 9
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Logged 24 Mar. That is a repetition record at a heavier load, based on four logged
                sets.
              </p>
              <ActionLink to="/progress/exercise" tone="ghost" className="-ml-4 mt-2">
                See exercise progress <ArrowUpRight aria-hidden className="size-4" />
              </ActionLink>
            </section>

            <Section title="Training dimensions" hint="Each score is measured and explained separately">
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
            <Section title="Consistency" hint="Sessions completed against sessions scheduled">
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
                  Week 5 is still in progress. Rest days are not counted against you.
                </p>
              </Panel>
            </Section>

            <Section title="Personal records">
              <Rows>
                {personalRecords.map((r) => (
                  <Row
                    key={`${r.exercise}-${r.date}`}
                    label={r.exercise}
                    sub={`${r.kind} record · ${r.date}`}
                    right={<span className="num">{r.detail}</span>}
                  />
                ))}
              </Rows>
            </Section>

            <Section title="More">
              <Rows>
                {[
                  { to: "/progress/exercise", label: "Exercise progress", sub: "Charts per exercise" },
                  { to: "/progress/history", label: "Training history", sub: "Completed and cancelled sessions" },
                  { to: "/progress/recovery", label: "Recovery and habits", sub: "Sleep, hydration, movement" },
                  { to: "/progress/measurements", label: "Body measurements", sub: "Weight and circumferences" },
                  { to: "/progress/levels", label: "Level and experience", sub: "XP ledger and achievements" },
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

            <PrototypeBar />
          </div>
        </div>
      )}
    </AppShell>
  );
}

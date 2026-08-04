import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Panel, Row, Rows, Section } from "@/components/forge/ui";
import { exerciseSeries } from "@/lib/forge/data";

export const Route = createFileRoute("/progress/exercise")({
  head: () => ({
    meta: [
      { title: "Progresso por exercício — Forge" },
      {
        name: "description",
        content: "Tendências de carga e repetições por exercício com resumos em linguagem clara.",
      },
      { property: "og:title", content: "Progresso por exercício — Forge" },
      { property: "og:description", content: "Um exercício por vez, explicado também em texto." },
    ],
  }),
  component: ExerciseProgress,
});

const PERIODS = ["8 semanas", "12 semanas", "6 meses"];

function ExerciseProgress() {
  const ready = useAppGate();
  const [id, setId] = useState(exerciseSeries[0]!.id);
  const [period, setPeriod] = useState(PERIODS[1]!);
  const ex = exerciseSeries.find((e) => e.id === id)!;
  const first = ex.points[0]!;
  const last = ex.points[ex.points.length - 1]!;

  return (
    <AppShell eyebrow="Progresso" title="Progresso por exercício">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <label htmlFor="exercise" className="eyebrow block">
            Exercício
          </label>
          <select
            id="exercise"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {exerciseSeries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <p className="num text-3xl font-semibold text-foreground">{ex.current}</p>
            <p className="num text-xs text-muted-foreground">Recorde: {ex.pr}</p>
          </div>

          <div className="mt-4 flex gap-1.5" role="group" aria-label="Período">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`tap rounded-md border px-3 text-xs font-medium ${
                  period === p
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Panel className="mt-4 p-4">
            <figure>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ex.points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      stroke="var(--color-border)"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      stroke="var(--color-border)"
                      unit="kg"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-elevated)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--color-foreground)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--color-primary)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Carga da melhor série de {ex.name} no período selecionado de {period.toLowerCase()}.
                Avançou de{" "}
                <span className="num">
                  {first.value} kg × {first.reps}
                </span>{" "}
                em {first.date} para{" "}
                <span className="num">
                  {last.value} kg × {last.reps}
                </span>{" "}
                em {last.date}. Pequenas quedas costumam ser semanas mais leves planejadas.
              </figcaption>
            </figure>
          </Panel>

          <Section title="Sessões recentes">
            <Rows>
              {[...ex.points]
                .reverse()
                .slice(0, 5)
                .map((p) => (
                  <Row
                    key={p.date}
                    label={p.date}
                    sub="Melhor série"
                    right={
                      <span className="num">
                        {p.value} kg × {p.reps}
                      </span>
                    }
                  />
                ))}
            </Rows>
          </Section>
        </>
      )}
    </AppShell>
  );
}

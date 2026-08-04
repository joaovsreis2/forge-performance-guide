import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, NumberField, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { measurements } from "@/lib/forge/data";

export const Route = createFileRoute("/progress/measurements")({
  head: () => ({
    meta: [
      { title: "Body measurements — Forge" },
      { name: "description", content: "Weight and optional circumferences with a simple neutral trend." },
      { property: "og:title", content: "Body measurements — Forge" },
      { property: "og:description", content: "Neutral tracking, no judgement." },
    ],
  }),
  component: Measurements,
});

function Measurements() {
  const ready = useAppGate();
  const [adding, setAdding] = useState(false);
  const [weight, setWeight] = useState(78.4);
  const [chest, setChest] = useState(102);
  const [waist, setWaist] = useState(82.5);
  const [saved, setSaved] = useState(false);

  const latest = measurements[0]!;
  const previous = measurements[1]!;
  const delta = (latest.weight - previous.weight).toFixed(1);

  return (
    <AppShell eyebrow="Progress" title="Measurements">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <p className="num text-3xl font-semibold text-foreground">
            {latest.weight}
            <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
          </p>
          <p className="num mt-1 text-sm text-muted-foreground">
            {Number(delta) >= 0 ? "+" : ""}
            {delta} kg since {previous.date}. Recorded values only, no target attached.
          </p>

          {!adding ? (
            <Action className="mt-5" onClick={() => setAdding(true)}>
              Add measurement
            </Action>
          ) : (
            <div className="mt-5 space-y-3">
              <NumberField label="Weight" value={weight} step={0.1} unit="kg" onChange={setWeight} />
              <NumberField label="Chest (optional)" value={chest} step={0.5} unit="cm" onChange={setChest} />
              <NumberField label="Waist (optional)" value={waist} step={0.5} unit="cm" onChange={setWaist} />
              <div className="flex gap-2">
                <Action
                  onClick={() => {
                    setAdding(false);
                    setSaved(true);
                  }}
                >
                  Save entry
                </Action>
                <Action tone="outline" onClick={() => setAdding(false)}>
                  Cancel
                </Action>
              </div>
            </div>
          )}

          {saved ? (
            <div className="mt-4">
              <SystemState kind="success" title="Measurement saved" body="Added to your history." />
            </div>
          ) : null}

          <Section title="History" hint="Most recent first">
            <Rows>
              {measurements.map((m) => (
                <Row
                  key={m.date}
                  label={m.date}
                  sub={`Chest ${m.chest} cm · Waist ${m.waist} cm · Arm ${m.arm} cm`}
                  right={<span className="num">{m.weight} kg</span>}
                />
              ))}
            </Rows>
          </Section>
        </>
      )}
    </AppShell>
  );
}

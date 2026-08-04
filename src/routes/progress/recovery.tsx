import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, NumberField, Panel, Section, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/progress/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery and habits — Forge" },
      { name: "description", content: "A short daily log for sleep, hydration, movement and habits." },
      { property: "og:title", content: "Recovery and habits — Forge" },
      { property: "og:description", content: "Recovery is part of progress." },
    ],
  }),
  component: Recovery,
});

const HABITS = ["Mobility", "Walk", "Protein target", "Sunlight"];

function Recovery() {
  const ready = useAppGate();
  const { state, set } = useForge();
  const [sleep, setSleep] = useState(state.recovery?.sleep ?? 7.5);
  const [hydration, setHydration] = useState(state.recovery?.hydration ?? 2.4);
  const [movement, setMovement] = useState(state.recovery?.movement ?? false);
  const [habits, setHabits] = useState<string[]>(state.recovery?.habits ?? []);
  const [saved, setSaved] = useState(false);

  return (
    <AppShell eyebrow="Today" title="Recovery">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Recovery is part of progress. Missing entries are fine — they only lower confidence, never
            your score.
          </p>

          <div className="mt-6 space-y-3">
            <NumberField label="Sleep" value={sleep} step={0.25} unit="h" onChange={setSleep} />
            <NumberField label="Hydration" value={hydration} step={0.1} unit="L" onChange={setHydration} />
          </div>

          <Section title="Cardio or mobility">
            <Panel className="p-4">
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={movement}
                  onChange={(e) => setMovement(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Completed today
              </label>
            </Panel>
          </Section>

          <Section title="Daily habits">
            <div className="flex flex-wrap gap-2">
              {HABITS.map((h) => {
                const on = habits.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setHabits(on ? habits.filter((x) => x !== h) : [...habits, h])}
                    className={`tap rounded-md border px-3 text-sm ${
                      on ? "border-primary text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {on ? "✓ " : ""}
                    {h}
                  </button>
                );
              })}
            </div>
          </Section>

          <Action
            size="lg"
            className="mt-8 w-full"
            onClick={() => {
              set({ recovery: { sleep, hydration, movement, habits } });
              setSaved(true);
            }}
          >
            Save today&apos;s recovery
          </Action>

          {saved ? (
            <div className="mt-4">
              <SystemState
                kind="success"
                title="Recovery recorded"
                body="Today's entry is saved. You can update it any time before midnight."
              />
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, NumberField, Panel, Section, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/progress/recovery")({
  head: () => ({
    meta: [
      { title: "Recuperação e hábitos — Forge" },
      {
        name: "description",
        content: "Um registro diário curto para sono, hidratação, movimento e hábitos.",
      },
      { property: "og:title", content: "Recuperação e hábitos — Forge" },
      { property: "og:description", content: "Recuperação faz parte do progresso." },
    ],
  }),
  component: Recovery,
});

const HABITS = ["Mobilidade", "Caminhada", "Meta de proteína", "Luz solar"];

function Recovery() {
  const ready = useAppGate();
  const { state, set } = useForge();
  const [sleep, setSleep] = useState(state.recovery?.sleep ?? 7.5);
  const [hydration, setHydration] = useState(state.recovery?.hydration ?? 2.4);
  const [movement, setMovement] = useState(state.recovery?.movement ?? false);
  const [habits, setHabits] = useState<string[]>(state.recovery?.habits ?? []);
  const [saved, setSaved] = useState(false);

  return (
    <AppShell eyebrow="Hoje" title="Recuperação">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Recuperação faz parte do progresso. Registros ausentes não são um problema: eles só
            reduzem a confiança, nunca sua pontuação.
          </p>

          <div className="mt-6 space-y-3">
            <NumberField label="Sono" value={sleep} step={0.25} unit="h" onChange={setSleep} />
            <NumberField
              label="Hidratação"
              value={hydration}
              step={0.1}
              unit="L"
              onChange={setHydration}
            />
          </div>

          <Section title="Cardio ou mobilidade">
            <Panel className="p-4">
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={movement}
                  onChange={(e) => setMovement(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Concluído hoje
              </label>
            </Panel>
          </Section>

          <Section title="Hábitos diários">
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
            Salvar recuperação de hoje
          </Action>

          {saved ? (
            <div className="mt-4">
              <SystemState
                kind="success"
                title="Recuperação registrada"
                body="O registro de hoje está salvo. Você pode atualizá-lo até meia-noite."
              />
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

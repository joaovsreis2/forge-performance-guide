import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, NumberField, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { measurements } from "@/lib/forge/data";

export const Route = createFileRoute("/progress/measurements")({
  head: () => ({
    meta: [
      { title: "Medidas corporais — Forge" },
      {
        name: "description",
        content: "Peso e circunferências opcionais com uma tendência simples e neutra.",
      },
      { property: "og:title", content: "Medidas corporais — Forge" },
      { property: "og:description", content: "Acompanhamento neutro, sem julgamento." },
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
    <AppShell eyebrow="Progresso" title="Medidas">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <p className="num text-3xl font-semibold text-foreground">
            {String(latest.weight).replace(".", ",")}
            <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
          </p>
          <p className="num mt-1 text-sm text-muted-foreground">
            {Number(delta) >= 0 ? "+" : ""}
            {delta.replace(".", ",")} kg desde {previous.date}. Apenas valores registrados, sem meta
            associada.
          </p>

          {!adding ? (
            <Action className="mt-5" onClick={() => setAdding(true)}>
              Adicionar medida
            </Action>
          ) : (
            <div className="mt-5 space-y-3">
              <NumberField label="Peso" value={weight} step={0.1} unit="kg" onChange={setWeight} />
              <NumberField
                label="Peito (opcional)"
                value={chest}
                step={0.5}
                unit="cm"
                onChange={setChest}
              />
              <NumberField
                label="Cintura (opcional)"
                value={waist}
                step={0.5}
                unit="cm"
                onChange={setWaist}
              />
              <div className="flex gap-2">
                <Action
                  onClick={() => {
                    setAdding(false);
                    setSaved(true);
                  }}
                >
                  Salvar registro
                </Action>
                <Action tone="outline" onClick={() => setAdding(false)}>
                  Cancelar
                </Action>
              </div>
            </div>
          )}

          {saved ? (
            <div className="mt-4">
              <SystemState
                kind="success"
                title="Medida salva"
                body="Adicionada ao seu histórico."
              />
            </div>
          ) : null}

          <Section title="Histórico" hint="Mais recentes primeiro">
            <Rows>
              {measurements.map((m) => (
                <Row
                  key={m.date}
                  label={m.date}
                  sub={`Peito ${String(m.chest).replace(".", ",")} cm · Cintura ${String(m.waist).replace(".", ",")} cm · Braço ${String(m.arm).replace(".", ",")} cm`}
                  right={<span className="num">{String(m.weight).replace(".", ",")} kg</span>}
                />
              ))}
            </Rows>
          </Section>
        </>
      )}
    </AppShell>
  );
}

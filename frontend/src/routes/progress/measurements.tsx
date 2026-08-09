import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, NumberField, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { forgeApi, type MeasurementData } from "@/lib/forge/api";

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
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    forgeApi
      .measurements()
      .then((data) => {
        setMeasurements(data);
        const latest = data[0];
        if (latest?.weightKg != null) setWeight(latest.weightKg);
        if (latest?.chestCm != null) setChest(latest.chestCm);
        if (latest?.waistCm != null) setWaist(latest.waistCm);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [ready]);

  const latest = measurements[0];
  const previous = measurements.find((item, index) => index > 0 && item.weightKg != null);
  const delta =
    latest?.weightKg != null && previous?.weightKg != null
      ? (latest.weightKg - previous.weightKg).toFixed(1)
      : null;

  return (
    <AppShell eyebrow="Progresso" title="Medidas">
      {!ready || loading ? (
        <GateFallback />
      ) : (
        <>
          {latest?.weightKg != null ? (
            <>
              <p className="num text-3xl font-semibold text-foreground">
                {String(latest.weightKg).replace(".", ",")}
                <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
              </p>
              <p className="num mt-1 text-sm text-muted-foreground">
                {delta != null && previous
                  ? `${Number(delta) >= 0 ? "+" : ""}${delta.replace(".", ",")} kg desde ${previous.date}. `
                  : ""}
                Apenas valores registrados, sem meta associada.
              </p>
            </>
          ) : (
            <SystemState
              kind="empty"
              title="Nenhuma medida registrada"
              body="Adicione seu primeiro registro corporal quando fizer sentido para você."
            />
          )}

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
                  onClick={async () => {
                    setError("");
                    try {
                      await forgeApi.saveMeasurement({
                        weightKg: weight,
                        chestCm: chest,
                        waistCm: waist,
                        bodyFatPercentage: null,
                        hipsCm: null,
                        notes: "",
                      });
                      setMeasurements(await forgeApi.measurements());
                      setAdding(false);
                      setSaved(true);
                    } catch (reason) {
                      setError(
                        reason instanceof Error ? reason.message : "Não foi possível salvar.",
                      );
                    }
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
          {error ? (
            <div className="mt-4">
              <SystemState kind="error" title="Não foi possível salvar" body={error} />
            </div>
          ) : null}

          <Section title="Histórico" hint="Mais recentes primeiro">
            <Rows>
              {measurements.map((m) => (
                <Row
                  key={m.id}
                  label={m.date}
                  sub={[
                    m.chestCm != null ? `Peito ${m.chestCm} cm` : null,
                    m.waistCm != null ? `Cintura ${m.waistCm} cm` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  right={
                    m.weightKg != null ? (
                      <span className="num">{String(m.weightKg).replace(".", ",")} kg</span>
                    ) : undefined
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

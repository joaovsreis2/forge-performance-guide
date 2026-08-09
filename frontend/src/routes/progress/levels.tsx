import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Panel, Row, Rows, ScoreBar, Section } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";
import { XP_RULES } from "@/lib/forge/xp";

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

const XP_RULE_ROWS = [
  { label: "Treino concluído", amount: XP_RULES.workoutCompleted },
  { label: "Treino parcial", amount: XP_RULES.workoutPartial },
  { label: "Treino cancelado", amount: XP_RULES.workoutCancelled },
  { label: "Exercício concluído", amount: XP_RULES.exerciseCompleted },
  {
    label: "Série válida",
    amount: XP_RULES.validSet,
    detail: `Até ${XP_RULES.awardedSetLimit} séries por sessão`,
  },
  { label: "Recorde pessoal", amount: XP_RULES.personalRecord },
  { label: "Registro de recuperação", amount: XP_RULES.recoveryLog },
  { label: "Registro de medidas", amount: XP_RULES.measurementLog },
];

function Levels() {
  const ready = useAppGate();
  const { state, progress } = useForge();
  const remote = state.remoteProgress;
  const events = remote?.experienceEvents ?? [];
  const todayKey = new Date().toLocaleDateString("en-CA");
  const today = events
    .filter((event) => event.date.slice(0, 10) === todayKey)
    .reduce((total, event) => total + event.amount, 0);
  const dimensions = [
    ["Performance", remote?.progression?.performance ?? 0, "Recordes pessoais validados"],
    ["Consistência", remote?.progression?.consistency ?? 0, "Sessões concluídas"],
    ["Recuperação", remote?.progression?.recovery ?? 0, "Registros de recuperação"],
  ] as const;

  return (
    <AppShell eyebrow="Progresso" title="Nível e experiência">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <Panel className="p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
              <p className="text-sm text-muted-foreground">Nível {progress.level}</p>
              <p className="num text-sm text-foreground">
                {state.xp.toLocaleString("pt-BR")} XP no total
              </p>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated"
              role="progressbar"
              aria-valuenow={progress.into}
              aria-valuemin={0}
              aria-valuemax={progress.span}
              aria-label={`Progresso para o nível ${progress.nextLevel}`}
            >
              <div className="h-full bg-primary" style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="num mt-2 text-xs text-muted-foreground">
              {progress.remaining} XP para o nível {progress.nextLevel} · {progress.into} de{" "}
              {progress.span} XP nesta faixa
            </p>
            <p className="num mt-1 text-xs text-muted-foreground">
              Hoje: {today} de {XP_RULES.dailyLimit} XP do limite diário
            </p>
          </Panel>

          <Section
            title="Como o nível é calculado"
            hint="XP total para o nível N = 100 × N × (N − 1)"
          >
            <Rows>
              <Row
                label="Nível 5"
                sub="100 × 5 × 4"
                right={<span className="num">2.000 XP</span>}
              />
              <Row
                label="Nível 10"
                sub="100 × 10 × 9"
                right={<span className="num">9.000 XP</span>}
              />
              <Row
                label="Nível 20"
                sub="100 × 20 × 19"
                right={<span className="num">38.000 XP</span>}
              />
            </Rows>
          </Section>

          <Section
            title="Regras de experiência"
            hint={`Limite diário de ${XP_RULES.dailyLimit} XP`}
          >
            <Rows>
              {XP_RULE_ROWS.map((rule) => (
                <Row
                  key={rule.label}
                  label={rule.label}
                  sub={rule.detail}
                  right={<span className="num">+{rule.amount} XP</span>}
                />
              ))}
            </Rows>
          </Section>

          <Section
            title="Registro de experiência"
            hint={events.length > 0 ? `${events.length} eventos recentes` : "Nenhum evento"}
          >
            <Rows>
              {events.length > 0
                ? events.map((e, index) => (
                    <Row
                      key={`${e.date}-${index}`}
                      label={e.reason}
                      sub={new Date(e.date).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                      right={<span className="num">+{e.amount} XP</span>}
                    />
                  ))
                : null}
            </Rows>
          </Section>

          <Section title="Conquistas">
            <Rows>
              {(remote?.achievements ?? []).map((a) => (
                <Row
                  key={a.name}
                  label={a.name}
                  sub={a.description}
                  right={<span className="text-xs">Conquistada</span>}
                />
              ))}
            </Rows>
          </Section>

          <Section title="Como as dimensões são calculadas">
            <Panel className="divide-y divide-border px-4">
              {dimensions.map(([label, score, explanation]) => (
                <ScoreBar
                  key={label}
                  label={label}
                  score={score}
                  confidence={score > 0 ? "Confiança média" : "Confiança baixa"}
                  trend="Dados atuais"
                  explanation={explanation}
                />
              ))}
            </Panel>
          </Section>
        </>
      )}
    </AppShell>
  );
}

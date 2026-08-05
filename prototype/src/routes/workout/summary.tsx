import { createFileRoute } from "@tanstack/react-router";
import { Check, Pause, Trophy, X } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { SyncNotice } from "@/components/forge/SyncPill";
import { ActionLink, Panel, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import {
  formatClock,
  sessionActiveSeconds,
  sessionXpBreakdown,
  totalPlannedSets,
  useForge,
} from "@/lib/forge/store";
import { formatKg } from "@/lib/forge/records";
import { XP_RULES } from "@/lib/forge/xp";
import { todaysWorkout } from "@/lib/forge/data";

export const Route = createFileRoute("/workout/summary")({
  head: () => ({
    meta: [
      { title: "Resumo da sessão — Forge" },
      {
        name: "description",
        content: "O que você concluiu, o que foi pulado, recordes e progresso de nível.",
      },
      { property: "og:title", content: "Resumo da sessão — Forge" },
      {
        property: "og:description",
        content: "Um registro claro da sessão que você acabou de finalizar.",
      },
    ],
  }),
  component: Summary,
});

const OUTCOME_COPY = {
  completed: {
    eyebrow: "Sessão registrada",
    title: "Treino concluído",
    body: "Todas as séries agendadas foram registradas.",
  },
  partial: {
    eyebrow: "Sessão parcial",
    title: "Treino parcialmente concluído",
    body: "Seu trabalho registrado foi salvo exatamente como você anotou.",
  },
  cancelled: {
    eyebrow: "Sessão cancelada",
    title: "Sessão cancelada",
    body: "As séries registradas foram preservadas. Sessões canceladas não geram experiência.",
  },
} as const;

function Summary() {
  const { state, progress } = useForge();
  const s = state.lastSession;

  if (!state.hydrated) return null;

  if (!s) {
    return (
      <AppShell eyebrow="Resumo" title="Nenhuma sessão recente">
        <SystemState
          kind="empty"
          title="Ainda não há nada para resumir"
          body="Finalize ou cancele uma sessão e o resumo aparecerá aqui."
          action={<ActionLink to="/">Voltar para Hoje</ActionLink>}
        />
      </AppShell>
    );
  }

  const outcome = s.outcome ?? "cancelled";
  const copy = OUTCOME_COPY[outcome];
  const duration = sessionActiveSeconds(s, s.finishedAt ?? Date.now());
  const done = s.logs.filter((l) => !l.skipped).length;
  const skippedSets = s.logs.filter((l) => l.skipped).length;
  const xp = sessionXpBreakdown(s);
  const capped = xp.total > state.lastSessionXp;

  return (
    <AppShell eyebrow={copy.eyebrow} title={todaysWorkout!.name}>
      <SyncNotice />

      <section className="mt-4">
        <span
          aria-hidden
          className={`grid size-10 place-items-center rounded-full border ${
            outcome === "cancelled" ? "border-border" : "border-primary/50"
          }`}
        >
          {outcome === "completed" ? (
            <Check className="size-5 text-primary" />
          ) : outcome === "partial" ? (
            <Pause className="size-4 text-primary" />
          ) : (
            <X className="size-5 text-muted-foreground" />
          )}
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">{copy.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {outcome === "completed" && done < totalPlannedSets
            ? "Seu trabalho registrado foi salvo exatamente como você anotou."
            : copy.body}
        </p>
      </section>

      <dl className="num mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
        <div>
          <dd className="text-xl font-semibold text-foreground">{formatClock(duration)}</dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">Tempo ativo</dt>
        </div>
        <div>
          <dd className="text-xl font-semibold text-foreground">
            {done}
            <span className="text-sm font-normal text-muted-foreground">/{totalPlannedSets}</span>
          </dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">Séries registradas</dt>
        </div>
        <div>
          <dd className="text-xl font-semibold text-foreground">
            {skippedSets + s.skippedExercises.length}
          </dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">Itens pulados</dt>
        </div>
      </dl>

      {s.records.length > 0 ? (
        <Section title="Recordes pessoais" hint="Validados contra seu histórico">
          <Rows>
            {s.records.map((r, i) => (
              <Row
                key={`${r.exerciseId}-${i}`}
                label={r.exerciseName}
                sub={`${r.kind === "maximum_weight" ? "Carga máxima" : "Repetições máximas"} · anterior ${r.previous}`}
                right={
                  <span className="num inline-flex items-center gap-1.5 text-foreground">
                    <Trophy aria-hidden className="size-3.5 text-primary" />
                    {r.result}
                  </span>
                }
              />
            ))}
          </Rows>
        </Section>
      ) : null}

      <Section title="Trabalho registrado" hint={`${s.logs.length} entradas`}>
        <Rows>
          {s.logs.map((l) => (
            <Row
              key={`${l.exerciseId}-${l.setIndex}`}
              label={l.exerciseName}
              sub={`Série ${l.setIndex + 1}${l.synced ? "" : " · salvo neste dispositivo"}`}
              right={
                <span className="num">
                  {l.skipped ? "Pulada" : `${formatKg(l.weight)} kg × ${l.reps}`}
                </span>
              }
            />
          ))}
        </Rows>
      </Section>

      <Section
        title="Experiência"
        hint="A gamificação permanece secundária aos seus dados de treino"
      >
        <Rows>
          {xp.lines.map((line, i) => (
            <Row
              key={`${line.label}-${i}`}
              label={line.label}
              sub={line.detail}
              right={<span className="num">+{line.amount} XP</span>}
            />
          ))}
          <Row
            label="Total da sessão"
            sub={capped ? `Limite diário de ${XP_RULES.dailyLimit} XP aplicado` : undefined}
            right={<span className="num text-foreground">+{state.lastSessionXp} XP</span>}
          />
        </Rows>
        <Panel className="mt-3 p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
            <p className="text-sm text-foreground">Nível {progress.level}</p>
            <p className="num text-xs text-muted-foreground">
              {progress.into} / {progress.span} XP para o nível {progress.nextLevel}
            </p>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated"
            role="progressbar"
            aria-valuenow={progress.into}
            aria-valuemin={0}
            aria-valuemax={progress.span}
            aria-label={`Progresso para o nível ${progress.nextLevel}`}
          >
            <div className="h-full bg-primary" style={{ width: `${progress.percent}%` }} />
          </div>
        </Panel>
      </Section>

      <div className="mt-8 flex flex-wrap gap-2">
        <ActionLink to="/">Voltar para Hoje</ActionLink>
        <ActionLink to="/progress/history" tone="outline">
          Histórico de treinos
        </ActionLink>
      </div>
    </AppShell>
  );
}

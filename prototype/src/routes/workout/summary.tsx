import { createFileRoute } from "@tanstack/react-router";
import { Check, Trophy } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { SyncNotice } from "@/components/forge/SyncPill";
import { ActionLink, Panel, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { formatClock, totalPlannedSets, useForge, XP_PER_LEVEL } from "@/lib/forge/store";
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

function Summary() {
  const { state } = useForge();
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

  const duration = Math.floor(((s.finishedAt ?? Date.now()) - s.startedAt) / 1000);
  const done = s.logs.filter((l) => !l.skipped).length;
  const skippedSets = s.logs.filter((l) => l.skipped).length;
  const xpSets = done * 2;
  const xpTotal = s.outcome === "completed" ? 100 + xpSets + (s.prHit ? 25 : 0) : 0;
  const intoLevel = state.xp % XP_PER_LEVEL;

  return (
    <AppShell
      eyebrow={s.outcome === "completed" ? "Sessão registrada" : "Sessão cancelada"}
      title={todaysWorkout!.name}
    >
      <SyncNotice />

      {s.outcome === "completed" ? (
        <section className="mt-4">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-full border border-primary/50"
          >
            <Check className="size-5 text-primary" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">Treino concluído</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {done === totalPlannedSets
              ? "Todas as séries agendadas foram registradas."
              : "Seu trabalho registrado foi salvo exatamente como você anotou."}
          </p>
        </section>
      ) : (
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-foreground">Sessão cancelada</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            As {done} séries registradas foram preservadas no seu histórico. Nada além disso foi
            registrado.
          </p>
        </section>
      )}

      <dl className="num mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
        <div>
          <dd className="text-xl font-semibold text-foreground">{formatClock(duration)}</dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">Duração</dt>
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

      {s.prHit ? (
        <Panel className="mt-6 flex items-start gap-3 p-4">
          <Trophy aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Recorde pessoal</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Você superou sua melhor marca anterior neste exercício. Ela está salva nos seus
              recordes.
            </p>
          </div>
        </Panel>
      ) : null}

      <Section title="Trabalho registrado" hint={`${s.logs.length} entradas`}>
        <Rows>
          {s.logs.map((l) => (
            <Row
              key={`${l.exerciseId}-${l.setIndex}`}
              label={l.exerciseName}
              sub={`Série ${l.setIndex + 1}${l.synced ? "" : " · salvo neste dispositivo"}`}
              right={
                <span className="num">{l.skipped ? "Pulada" : `${l.weight} kg × ${l.reps}`}</span>
              }
            />
          ))}
        </Rows>
      </Section>

      {s.outcome === "completed" ? (
        <Section
          title="Experiência"
          hint="A gamificação permanece secundária aos seus dados de treino"
        >
          <Rows>
            <Row label="Treino concluído" right={<span className="num">+100 XP</span>} />
            <Row
              label={`${done} séries válidas`}
              right={<span className="num">+{xpSets} XP</span>}
            />
            {s.prHit ? (
              <Row label="Novo recorde" right={<span className="num">+25 XP</span>} />
            ) : null}
            <Row
              label="Total da sessão"
              right={<span className="num text-foreground">+{xpTotal} XP</span>}
            />
          </Rows>
          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
              <p className="text-sm text-foreground">Nível {state.level}</p>
              <p className="num text-xs text-muted-foreground">
                {intoLevel} / {XP_PER_LEVEL} XP para o nível {state.level + 1}
              </p>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated"
              role="progressbar"
              aria-valuenow={intoLevel}
              aria-valuemin={0}
              aria-valuemax={XP_PER_LEVEL}
              aria-label={`Progresso para o nível ${state.level + 1}`}
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${(intoLevel / XP_PER_LEVEL) * 100}%` }}
              />
            </div>
          </div>
        </Section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        <ActionLink to="/">Voltar para Hoje</ActionLink>
        <ActionLink to="/progress/history" tone="outline">
          Histórico de treinos
        </ActionLink>
      </div>
    </AppShell>
  );
}

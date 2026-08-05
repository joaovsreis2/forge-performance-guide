import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Moon, Timer } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { SyncNotice, SyncPill } from "@/components/forge/SyncPill";
import { Action, ActionLink, Panel, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { history, todaysWorkout } from "@/lib/forge/data";
import { formatClock, useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoje — Forge" },
      {
        name: "description",
        content:
          "Sua sessão agendada, progresso recente e contexto de recuperação em uma tela focada.",
      },
      { property: "og:title", content: "Hoje — Forge" },
      { property: "og:description", content: "Seu treino está pronto quando você estiver." },
    ],
  }),
  component: Today,
});

function Today() {
  const ready = useAppGate();
  const { state, set } = useForge();
  const workout = todaysWorkout!;
  const session = state.session;
  const hour = new Date().getHours();
  const greeting = `Boa ${hour < 12 ? "manhã" : hour < 18 ? "tarde" : "noite"}, ${state.profileName.split(" ")[0]}`;

  return (
    <AppShell
      eyebrow={greeting}
      title="Hoje"
      actions={<SyncPill className="hidden sm:inline-flex" />}
    >
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <SyncNotice />

          {session ? (
            <Panel className="mt-4 p-5">
              <p className="eyebrow">Treino em andamento</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">{workout.name}</h2>
              <p className="num mt-1 text-sm text-muted-foreground">
                {session.logs.filter((l) => !l.skipped).length} séries registradas ·{" "}
                {formatClock(Math.floor((Date.now() - session.startedAt) / 1000))} decorridos
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Você pode continuar de onde parou.
              </p>
              <ActionLink to="/workout/active" size="lg" className="mt-4 w-full">
                Retomar treino <ArrowRight aria-hidden className="size-4" />
              </ActionLink>
            </Panel>
          ) : state.todayVariant === "scheduled" ? (
            <ScheduledState />
          ) : state.todayVariant === "rest" ? (
            <RestState />
          ) : state.todayVariant === "no-plan" ? (
            <NoPlanState />
          ) : (
            <CompletedState onRepeat={() => set({ todayVariant: "scheduled" })} />
          )}

          <Section title="Progresso recente" hint="Duas sessões mais recentes">
            <Rows>
              {history.slice(0, 2).map((h) => (
                <Row
                  key={h.id}
                  label={h.name}
                  sub={`${h.date} · ${h.focus}`}
                  right={<span className="num">{h.duration}</span>}
                />
              ))}
            </Rows>
          </Section>
        </>
      )}
    </AppShell>
  );
}

function ScheduledState() {
  const workout = todaysWorkout!;
  return (
    <>
      <section className="mt-4">
        <p className="eyebrow">Agendado · {workout.weekday}</p>
        <h2 className="mt-2 text-[2rem] font-semibold leading-tight text-foreground">
          {workout.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{workout.focus}</p>

        <dl className="num mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="sr-only">Exercícios</dt>
            <dd className="text-foreground">
              {workout.exercises.length} <span className="text-muted-foreground">exercícios</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Séries</dt>
            <dd className="text-foreground">
              {workout.exercises.reduce((n, e) => n + e.sets, 0)}{" "}
              <span className="text-muted-foreground">séries</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Duração estimada</dt>
            <dd className="text-foreground">
              ~{workout.estimatedMinutes} <span className="text-muted-foreground">min</span>
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-sm text-muted-foreground">
          Seu treino está pronto quando você estiver.
        </p>

        <ActionLink to="/workout" size="lg" className="mt-4 w-full sm:w-auto sm:min-w-64">
          Ver treino de hoje <ArrowRight aria-hidden className="size-4" />
        </ActionLink>

        <div className="mt-3">
          <ActionLink to="/progress/recovery" tone="ghost">
            <Timer aria-hidden className="size-4" /> Registrar recuperação
          </ActionLink>
        </div>
      </section>
    </>
  );
}

function RestState() {
  return (
    <section className="mt-4">
      <p className="eyebrow">Descanso agendado</p>
      <h2 className="mt-2 flex items-center gap-2 text-[2rem] font-semibold leading-tight text-foreground">
        <Moon aria-hidden className="size-6 text-muted-foreground" /> Dia de descanso
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Recuperação faz parte do progresso. A próxima sessão é Lower Body A amanhã.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <ActionLink to="/progress/recovery">Registrar recuperação</ActionLink>
        <ActionLink to="/plan" tone="outline">
          Ver plano
        </ActionLink>
      </div>
    </section>
  );
}

function NoPlanState() {
  return (
    <div className="mt-4">
      <SystemState
        kind="empty"
        title="Sem plano de treino ativo"
        body="Você ainda não tem um plano atribuído, então não há treino agendado para hoje."
        preserved="Seu histórico de treinos e recordes permanecem inalterados."
        action={<ActionLink to="/plan">Ver plano</ActionLink>}
      />
    </div>
  );
}

function CompletedState({ onRepeat }: { onRepeat: () => void }) {
  const workout = todaysWorkout!;
  return (
    <section className="mt-4">
      <p className="eyebrow">Concluído hoje</p>
      <h2 className="mt-2 text-[2rem] font-semibold leading-tight text-foreground">
        {workout.name}
      </h2>
      <p className="num mt-1 text-sm text-muted-foreground">
        51 min · 14 de 14 séries · 1 recorde de repetições
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Sessão registrada. A próxima sessão agendada é Lower Body A amanhã.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <ActionLink to="/progress/history">Ver sessão</ActionLink>
        <Action tone="outline" onClick={onRepeat}>
          Treinar novamente
        </Action>
      </div>
    </section>
  );
}

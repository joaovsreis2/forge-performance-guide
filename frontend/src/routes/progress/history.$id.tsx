import { createFileRoute, useParams } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { ActionLink, Panel, SystemState } from "@/components/forge/ui";
import { forgeApi, type RemoteSession } from "@/lib/forge/api";
import { GateFallback } from "@/components/forge/Gate";
import { formatClock } from "@/lib/forge/store";

export const Route = createFileRoute("/progress/history/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da sessão — Forge" },
      { name: "description", content: "Um retrato imutável de uma sessão de treino passada." },
      { property: "og:title", content: "Detalhe da sessão — Forge" },
      {
        property: "og:description",
        content: "Exatamente o que foi registrado, mantido sem alterações.",
      },
    ],
  }),
  component: SessionDetail,
});

function SessionDetail() {
  const { id } = useParams({ from: "/progress/history/$id" });
  const [session, setSession] = useState<RemoteSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    forgeApi
      .session(id)
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell eyebrow="Histórico" title="Carregando sessão">
        <GateFallback />
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell eyebrow="Histórico" title="Sessão indisponível">
        <SystemState
          kind="empty"
          title="Esta sessão não foi encontrada"
          body="Ela pode ter sido registrada em outra conta. Nada foi alterado."
          action={<ActionLink to="/progress/history">Voltar ao histórico</ActionLink>}
        />
      </AppShell>
    );
  }

  const stateLabel = {
    active: "Ativa",
    paused: "Pausada",
    completed: "Concluída",
    cancelled: "Cancelada",
  }[session.status];
  const started = new Date(session.startedAt);

  return (
    <AppShell eyebrow={`${started.toLocaleDateString("pt-BR")} · arquivada`} title={session.name}>
      <Panel className="border-dashed p-5">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3" /> Registro histórico — somente leitura
        </p>
        <dl className="num mt-4 grid grid-cols-3 gap-4">
          <div>
            <dd className="text-lg font-semibold text-foreground">
              {formatClock(session.durationSeconds ?? 0)}
            </dd>
            <dt className="text-xs text-muted-foreground">Duração</dt>
          </div>
          <div>
            <dd className="text-lg font-semibold text-foreground">{session.logs.length}</dd>
            <dt className="text-xs text-muted-foreground">Séries</dt>
          </div>
          <div>
            <dd className="text-lg font-semibold text-foreground">{stateLabel}</dd>
            <dt className="text-xs text-muted-foreground">Estado</dt>
          </div>
        </dl>
        <ul className="mt-5 divide-y divide-border border-t border-border">
          {session.exercises.map((exercise) => (
            <li key={exercise.id} className="py-3">
              <p className="text-sm text-foreground">{exercise.name}</p>
              <p className="num mt-0.5 text-xs text-muted-foreground">
                {session.logs
                  .filter((log) => log.exerciseId === exercise.id)
                  .map((log) => (log.skipped ? "Pulada" : `${log.weight} kg × ${log.reps}`))
                  .join(" · ") || "Sem séries registradas"}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="mt-6">
        <ActionLink to="/progress/history" tone="outline">
          Voltar ao histórico
        </ActionLink>
      </div>
    </AppShell>
  );
}

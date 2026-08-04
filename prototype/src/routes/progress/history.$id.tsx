import { createFileRoute, useParams } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { ActionLink, Panel, SystemState } from "@/components/forge/ui";
import { history } from "@/lib/forge/data";

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
  const session = history.find((h) => h.id === id);

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
    completed: "Concluída",
    partial: "Parcial",
    cancelled: "Cancelada",
  }[session.state];

  return (
    <AppShell eyebrow={`${session.date} · arquivada`} title={session.name}>
      <Panel className="border-dashed p-5">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3" /> Registro histórico — somente leitura
        </p>
        <dl className="num mt-4 grid grid-cols-3 gap-4">
          <div>
            <dd className="text-lg font-semibold text-foreground">{session.duration}</dd>
            <dt className="text-xs text-muted-foreground">Duração</dt>
          </div>
          <div>
            <dd className="text-lg font-semibold text-foreground">{session.sets}</dd>
            <dt className="text-xs text-muted-foreground">Séries</dt>
          </div>
          <div>
            <dd className="text-lg font-semibold text-foreground">{stateLabel}</dd>
            <dt className="text-xs text-muted-foreground">Estado</dt>
          </div>
        </dl>
        {session.note ? <p className="mt-4 text-sm text-muted-foreground">{session.note}</p> : null}
        <ul className="mt-5 divide-y divide-border border-t border-border">
          {session.entries.map((e) => (
            <li key={e.exercise} className="py-3">
              <p className="text-sm text-foreground">{e.exercise}</p>
              <p className="num mt-0.5 text-xs text-muted-foreground">{e.result}</p>
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

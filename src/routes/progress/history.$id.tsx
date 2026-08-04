import { createFileRoute, useParams } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { ActionLink, Panel, SystemState } from "@/components/forge/ui";
import { history } from "@/lib/forge/data";

export const Route = createFileRoute("/progress/history/$id")({
  head: () => ({
    meta: [
      { title: "Session detail — Forge" },
      { name: "description", content: "An immutable snapshot of a past training session." },
      { property: "og:title", content: "Session detail — Forge" },
      { property: "og:description", content: "Exactly what was logged, kept unchanged." },
    ],
  }),
  component: SessionDetail,
});

function SessionDetail() {
  const { id } = useParams({ from: "/progress/history/$id" });
  const session = history.find((h) => h.id === id);

  if (!session) {
    return (
      <AppShell eyebrow="History" title="Session unavailable">
        <SystemState
          kind="empty"
          title="This session could not be found"
          body="It may have been recorded on another account. Nothing was changed."
          action={<ActionLink to="/progress/history">Back to history</ActionLink>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow={`${session.date} · archived`} title={session.name}>
      <Panel className="border-dashed p-5">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3" /> Historical record — read only
        </p>
        <dl className="num mt-4 grid grid-cols-3 gap-4">
          <div>
            <dd className="text-lg font-semibold text-foreground">{session.duration}</dd>
            <dt className="text-xs text-muted-foreground">Duration</dt>
          </div>
          <div>
            <dd className="text-lg font-semibold text-foreground">{session.sets}</dd>
            <dt className="text-xs text-muted-foreground">Sets</dt>
          </div>
          <div>
            <dd className="text-lg font-semibold capitalize text-foreground">{session.state}</dd>
            <dt className="text-xs text-muted-foreground">State</dt>
          </div>
        </dl>
        {session.note ? (
          <p className="mt-4 text-sm text-muted-foreground">{session.note}</p>
        ) : null}
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
          Back to history
        </ActionLink>
      </div>
    </AppShell>
  );
}

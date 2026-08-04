import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CircleSlash, MinusCircle } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { history } from "@/lib/forge/data";

export const Route = createFileRoute("/progress/history/")({
  head: () => ({
    meta: [
      { title: "Training history — Forge" },
      { name: "description", content: "Completed, partial and cancelled sessions kept exactly as logged." },
      { property: "og:title", content: "Training history — Forge" },
      { property: "og:description", content: "An immutable record of your training." },
    ],
  }),
  component: HistoryPage,
});

const STATE = {
  completed: { label: "Completed", icon: CheckCircle2, tone: "text-ok" },
  partial: { label: "Partial", icon: MinusCircle, tone: "text-warn" },
  cancelled: { label: "Cancelled", icon: CircleSlash, tone: "text-muted-foreground" },
} as const;

function HistoryPage() {
  const ready = useAppGate();
  return (
    <AppShell eyebrow="Progress" title="Training history">
      {!ready ? (
        <GateFallback />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {history.map((h) => {
            const s = STATE[h.state];
            const Icon = s.icon;
            return (
              <li key={h.id}>
                <Link
                  to="/progress/history/$id"
                  params={{ id: h.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="eyebrow block">{h.date}</span>
                    <span className="mt-0.5 block truncate text-sm font-medium text-foreground">
                      {h.name}
                    </span>
                    <span className="num mt-0.5 block text-xs text-muted-foreground">
                      {h.duration} · {h.sets}
                    </span>
                  </span>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs ${s.tone}`}>
                    <Icon aria-hidden className="size-3.5" />
                    {s.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}

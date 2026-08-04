import { CheckCircle2, CloudOff, RefreshCw, TriangleAlert, Clock } from "lucide-react";
import { useForge, type SyncStatus } from "@/lib/forge/store";

export const SYNC_COPY: Record<
  SyncStatus,
  { label: string; detail: string; tone: "ok" | "warn" | "info" | "error" }
> = {
  synced: {
    label: "Synchronized",
    detail: "All logged work is stored on the server.",
    tone: "ok",
  },
  pending: {
    label: "Pending synchronization",
    detail: "3 sets are waiting to upload. Nothing is lost.",
    tone: "warn",
  },
  syncing: {
    label: "Syncing",
    detail: "Uploading your logged sets now.",
    tone: "info",
  },
  failed: {
    label: "Synchronization failed",
    detail: "The upload did not complete. Your sets are still saved on this device.",
    tone: "error",
  },
  "offline-stored": {
    label: "Offline — saved on device",
    detail: "This session was saved on your device and will upload when you reconnect.",
    tone: "warn",
  },
};

const ICONS = {
  synced: CheckCircle2,
  pending: Clock,
  syncing: RefreshCw,
  failed: TriangleAlert,
  "offline-stored": CloudOff,
} as const;

const TONE = {
  ok: "text-ok border-ok/40",
  warn: "text-warn border-warn/40",
  info: "text-info border-info/40",
  error: "text-destructive border-destructive/50",
} as const;

export function SyncPill({ className = "" }: { className?: string }) {
  const { state } = useForge();
  const status = state.offline && state.syncStatus === "synced" ? "offline-stored" : state.syncStatus;
  const copy = SYNC_COPY[status];
  const Icon = ICONS[status];
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full border bg-surface px-2.5 py-1 text-[0.6875rem] font-medium ${TONE[copy.tone]} ${className}`}
    >
      <Icon aria-hidden className={`size-3.5 ${status === "syncing" ? "animate-spin" : ""}`} />
      {copy.label}
    </span>
  );
}

export function SyncNotice() {
  const { state, syncNow } = useForge();
  const status = state.offline && state.syncStatus === "synced" ? "offline-stored" : state.syncStatus;
  const copy = SYNC_COPY[status];
  const Icon = ICONS[status];
  if (status === "synced") return null;
  return (
    <section
      aria-live="polite"
      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${TONE[copy.tone].split(" ")[0]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{copy.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.detail}</p>
        {status === "failed" || status === "pending" ? (
          <button
            type="button"
            onClick={syncNow}
            className="tap mt-2 inline-flex items-center rounded-md border border-border px-3 text-sm font-medium text-foreground"
          >
            Try synchronizing again
          </button>
        ) : null}
      </div>
    </section>
  );
}

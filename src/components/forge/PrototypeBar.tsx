import { useForge, type SyncStatus, type TodayVariant } from "@/lib/forge/store";

const TODAY_STATES: { id: TodayVariant; label: string }[] = [
  { id: "scheduled", label: "Scheduled" },
  { id: "rest", label: "Rest day" },
  { id: "no-plan", label: "No plan" },
  { id: "completed", label: "Completed" },
];

const SYNC_STATES: { id: SyncStatus; label: string }[] = [
  { id: "synced", label: "Synchronized" },
  { id: "pending", label: "Pending" },
  { id: "syncing", label: "Syncing" },
  { id: "failed", label: "Failed" },
  { id: "offline-stored", label: "Saved on device" },
];

/** Prototype-only controls so reviewers can inspect every state. */
export function PrototypeBar({ showToday = false }: { showToday?: boolean }) {
  const { state, set } = useForge();

  return (
    <section className="mt-10 rounded-xl border border-dashed border-border p-4">
      <h2 className="eyebrow">Prototype controls</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Not part of the product. Use these to review states.
      </p>

      {showToday ? (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted-foreground">Today state</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Today state">
            {TODAY_STATES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={state.todayVariant === s.id}
                onClick={() => set({ todayVariant: s.id })}
                className={`tap rounded-md border px-3 text-xs font-medium ${
                  state.todayVariant === s.id
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="mb-1.5 text-xs text-muted-foreground">Connection</p>
        <button
          type="button"
          aria-pressed={state.offline}
          onClick={() =>
            set({ offline: !state.offline, syncStatus: state.offline ? "pending" : "offline-stored" })
          }
          className={`tap rounded-md border px-3 text-xs font-medium ${
            state.offline ? "border-warn text-warn" : "border-border text-muted-foreground"
          }`}
        >
          {state.offline ? "Offline (simulated)" : "Online"}
        </button>
      </div>

      <div className="mt-3">
        <label htmlFor="sync-state" className="mb-1.5 block text-xs text-muted-foreground">
          Synchronization state
        </label>
        <select
          id="sync-state"
          value={state.syncStatus}
          onChange={(e) => set({ syncStatus: e.target.value as SyncStatus })}
          className="tap w-full rounded-md border border-border bg-surface px-3 text-xs text-foreground"
        >
          {SYNC_STATES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

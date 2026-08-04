import { useForge, type SyncStatus, type TodayVariant } from "@/lib/forge/store";

const TODAY_STATES: { id: TodayVariant; label: string }[] = [
  { id: "scheduled", label: "Treino agendado" },
  { id: "rest", label: "Dia de descanso" },
  { id: "no-plan", label: "Sem plano ativo" },
  { id: "completed", label: "Treino concluído" },
];

const SYNC_STATES: { id: SyncStatus; label: string }[] = [
  { id: "synced", label: "Sincronizado" },
  { id: "pending", label: "Pendente" },
  { id: "syncing", label: "Sincronizando" },
  { id: "failed", label: "Falhou" },
  { id: "offline-stored", label: "Salvo neste dispositivo" },
];

export function PrototypeBar({ showToday = false }: { showToday?: boolean }) {
  const { state, set, resetPrototype } = useForge();

  return (
    <section className="mt-10 rounded-xl border border-dashed border-border p-4">
      <h2 className="eyebrow">Controles do protótipo</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Fora da navegação normal. Use para revisar estados de demonstração.
      </p>

      {showToday ? (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted-foreground">Estado de Hoje</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Estado de Hoje">
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
        <p className="mb-1.5 text-xs text-muted-foreground">Conexão</p>
        <button
          type="button"
          aria-pressed={state.offline}
          onClick={() =>
            set({
              offline: !state.offline,
              syncStatus: state.offline ? "pending" : "offline-stored",
            })
          }
          className={`tap rounded-md border px-3 text-xs font-medium ${
            state.offline ? "border-warn text-warn" : "border-border text-muted-foreground"
          }`}
        >
          {state.offline ? "Offline simulado" : "Conectado"}
        </button>
      </div>

      <div className="mt-3">
        <label htmlFor="sync-state" className="mb-1.5 block text-xs text-muted-foreground">
          Estado de sincronização
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
      <div className="mt-3">
        <button
          type="button"
          onClick={resetPrototype}
          className="tap rounded-md border border-border px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Redefinir dados do protótipo
        </button>
      </div>
    </section>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, Panel, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Conta — Forge" },
      {
        name: "description",
        content: "Perfil, unidades, fuso horário, tema, notificações e segurança.",
      },
      { property: "og:title", content: "Conta — Forge" },
      { property: "og:description", content: "Suas preferências, mantidas simples." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const ready = useAppGate();
  const { state, set, toggleTheme, signOut } = useForge();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <AppShell eyebrow="Ajustes" title="Conta">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <Panel className="p-5">
            <p className="text-base font-medium text-foreground">{state.profileName}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{state.email}</p>
            <p className="mt-2 text-xs text-muted-foreground">Objetivo: {state.goal}</p>
          </Panel>

          <Section title="Informações físicas">
            <Rows>
              <Row label="Altura" right={<span>181 cm</span>} />
              <Row label="Peso atual" right={<span>78,4 kg</span>} />
            </Rows>
          </Section>

          <Section title="Preferências">
            <Rows>
              <Row
                label="Unidades"
                right={
                  <button
                    type="button"
                    onClick={() => set({ units: state.units === "metric" ? "imperial" : "metric" })}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {state.units === "metric" ? "Métrico (kg, cm)" : "Imperial (lb, pol)"}
                  </button>
                }
              />
              <Row label="Objetivo de treino" right={<span>{state.goal}</span>} />
              <Row label="Fuso horário" right={<span>{state.timezone}</span>} />
              <Row
                label="Tema"
                right={
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {state.theme === "dark" ? "Escuro" : "Claro"}
                  </button>
                }
              />
              <Row
                label="Som"
                sub="Alertas do temporizador de descanso"
                right={
                  <button
                    type="button"
                    aria-pressed={state.sound}
                    onClick={() => set({ sound: !state.sound })}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {state.sound ? "Ligado" : "Desligado"}
                  </button>
                }
              />
              <Row
                label="Vibração"
                right={
                  <button
                    type="button"
                    aria-pressed={state.vibration}
                    onClick={() => set({ vibration: !state.vibration })}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {state.vibration ? "Ligada" : "Desligada"}
                  </button>
                }
              />
              <Row
                label="Notificações"
                sub="Lembretes de sessão, resumo semanal"
                right={<span>2 ativas</span>}
              />
              <Row label="Segurança" sub="Senha e sessões" right={<span>Gerenciar</span>} />
            </Rows>
          </Section>

          <Section title="Sessão">
            <div className="flex flex-wrap gap-2">
              <Action
                tone="outline"
                onClick={() => {
                  signOut();
                  navigate({ to: "/signin" });
                }}
              >
                Sair
              </Action>
            </div>
          </Section>

          <Section title="Excluir conta" hint="Esta ação não pode ser desfeita">
            {!confirmDelete ? (
              <Action tone="danger" onClick={() => setConfirmDelete(true)}>
                Excluir conta
              </Action>
            ) : (
              <SystemState
                kind="error"
                title="Excluir sua conta?"
                body="Seus planos, sessões, recordes e medidas seriam removidos permanentemente."
                preserved="Nada foi excluído ainda. Este protótipo não executa a ação."
                action={
                  <Action tone="outline" onClick={() => setConfirmDelete(false)}>
                    Manter minha conta
                  </Action>
                }
              />
            )}
          </Section>
        </>
      )}
    </AppShell>
  );
}

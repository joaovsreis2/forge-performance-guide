import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, Panel, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";
import { forgeApi, type AccountData } from "@/lib/forge/api";

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
  const { state, set, signOut } = useForge();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    if (!ready) return;
    forgeApi
      .account()
      .then(setAccount)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [ready]);

  const update = (patch: Partial<AccountData>) =>
    setAccount((current) => (current ? { ...current, ...patch } : current));

  return (
    <AppShell eyebrow="Ajustes" title="Conta">
      {!ready || loading ? (
        <GateFallback />
      ) : !account ? (
        <SystemState kind="error" title="Não foi possível carregar a conta" body={error} />
      ) : (
        <>
          <Panel className="p-5">
            <p className="text-base font-medium text-foreground">{account.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{account.email}</p>
            <p className="mt-2 text-xs text-muted-foreground">Objetivo: {account.goal}</p>
          </Panel>

          <Section title="Informações físicas">
            <Rows>
              <Row
                label="Altura"
                right={
                  <span>
                    {account.heightCm != null ? `${account.heightCm} cm` : "Não informada"}
                  </span>
                }
              />
              <Row
                label="Peso atual"
                right={
                  <span>
                    {account.currentWeightKg != null
                      ? `${account.currentWeightKg} kg`
                      : "Não informado"}
                  </span>
                }
              />
            </Rows>
          </Section>

          <Section title="Preferências">
            <Rows>
              <Row
                label="Unidades"
                right={
                  <button
                    type="button"
                    onClick={() =>
                      update({ weightUnit: account.weightUnit === "kg" ? "lb" : "kg" })
                    }
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {account.weightUnit === "kg" ? "Métrico (kg, cm)" : "Imperial (lb, pol)"}
                  </button>
                }
              />
              <Row label="Objetivo de treino" right={<span>{account.goal}</span>} />
              <Row label="Fuso horário" right={<span>{account.timezone}</span>} />
              <Row
                label="Tema"
                right={
                  <button
                    type="button"
                    onClick={() =>
                      update({ appearance: account.appearance === "dark" ? "light" : "dark" })
                    }
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {account.appearance === "dark" ? "Escuro" : "Claro"}
                  </button>
                }
              />
              <Row
                label="Som"
                sub="Alertas do temporizador de descanso"
                right={
                  <button
                    type="button"
                    aria-pressed={account.soundEnabled}
                    onClick={() => update({ soundEnabled: !account.soundEnabled })}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {account.soundEnabled ? "Ligado" : "Desligado"}
                  </button>
                }
              />
              <Row
                label="Vibração"
                right={
                  <button
                    type="button"
                    aria-pressed={account.vibrationEnabled}
                    onClick={() => update({ vibrationEnabled: !account.vibrationEnabled })}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {account.vibrationEnabled ? "Ligada" : "Desligada"}
                  </button>
                }
              />
              <Row
                label="Segurança"
                sub="Senha e sessões"
                right={
                  <button
                    type="button"
                    aria-expanded={securityOpen}
                    aria-controls="security-actions"
                    onClick={() => setSecurityOpen((open) => !open)}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {securityOpen ? "Fechar" : "Gerenciar"}
                  </button>
                }
              />
            </Rows>

            {securityOpen ? (
              <div id="security-actions" className="mt-3 space-y-3 border-t border-border pt-4">
                <PasswordInput
                  label="Senha atual"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                />
                <PasswordInput label="Nova senha" value={newPassword} onChange={setNewPassword} />
                <PasswordInput
                  label="Confirmar nova senha"
                  value={passwordConfirmation}
                  onChange={setPasswordConfirmation}
                />
                <Action
                  tone="outline"
                  onClick={async () => {
                    setError("");
                    setPasswordSaved(false);
                    try {
                      await forgeApi.changePassword({
                        currentPassword,
                        password: newPassword,
                        passwordConfirmation,
                      });
                      setCurrentPassword("");
                      setNewPassword("");
                      setPasswordConfirmation("");
                      setPasswordSaved(true);
                    } catch (reason) {
                      setError(
                        reason instanceof Error
                          ? reason.message
                          : "Não foi possível alterar a senha.",
                      );
                    }
                  }}
                >
                  Alterar senha
                </Action>
                {passwordSaved ? (
                  <SystemState
                    kind="success"
                    title="Senha alterada"
                    body="Sua sessão continua ativa."
                  />
                ) : null}
              </div>
            ) : null}
            <Action
              className="mt-4"
              onClick={async () => {
                setError("");
                try {
                  const result = await forgeApi.updateAccount(account);
                  setAccount(result);
                  set({
                    profileName: result.name,
                    goal: result.goal ?? state.goal,
                    timezone: result.timezone,
                    units: result.weightUnit === "kg" ? "metric" : "imperial",
                    theme: result.appearance === "light" ? "light" : "dark",
                    sound: result.soundEnabled,
                    vibration: result.vibrationEnabled,
                  });
                  setSaved(true);
                } catch (reason) {
                  setError(reason instanceof Error ? reason.message : "Não foi possível salvar.");
                }
              }}
            >
              Salvar preferências
            </Action>
            {saved ? (
              <div className="mt-3">
                <SystemState
                  kind="success"
                  title="Preferências salvas"
                  body="Sua conta foi atualizada."
                />
              </div>
            ) : null}
            {error ? (
              <div className="mt-3">
                <SystemState kind="error" title="Não foi possível salvar" body={error} />
              </div>
            ) : null}
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
              <div className="space-y-3">
                <SystemState
                  kind="error"
                  title="Excluir sua conta?"
                  body="Seus planos, sessões, recordes e medidas serão removidos permanentemente."
                />
                <PasswordInput
                  label="Confirme sua senha"
                  value={deletePassword}
                  onChange={setDeletePassword}
                />
                <div className="flex flex-wrap gap-2">
                  <Action
                    tone="danger"
                    onClick={async () => {
                      setError("");
                      try {
                        await forgeApi.deleteAccount(deletePassword);
                        set({ phase: "signin", session: null });
                        navigate({ to: "/signin" });
                      } catch (reason) {
                        setError(
                          reason instanceof Error ? reason.message : "Não foi possível excluir.",
                        );
                      }
                    }}
                  >
                    Excluir permanentemente
                  </Action>
                  <Action tone="outline" onClick={() => setConfirmDelete(false)}>
                    Manter minha conta
                  </Action>
                </div>
              </div>
            )}
          </Section>
        </>
      )}
    </AppShell>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div>
      <label htmlFor={id} className="eyebrow block">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="current-password"
        className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
      />
    </div>
  );
}

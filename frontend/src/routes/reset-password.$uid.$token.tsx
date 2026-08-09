import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Wordmark } from "@/components/forge/AppShell";
import { Action, SystemState } from "@/components/forge/ui";
import { forgeApi } from "@/lib/forge/api";

export const Route = createFileRoute("/reset-password/$uid/$token")({
  head: () => ({ meta: [{ title: "Definir nova senha — Forge" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const { uid, token } = useParams({ from: "/reset-password/$uid/$token" });
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-10">
      <Wordmark />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <h1 className="text-2xl font-semibold text-foreground">Defina uma nova senha</h1>
        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            try {
              await forgeApi.resetPassword(uid, token, password, confirmation);
              navigate({ to: "/signin" });
            } catch (reason) {
              setError(
                reason instanceof Error ? reason.message : "Não foi possível alterar a senha.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <PasswordField label="Nova senha" value={password} onChange={setPassword} />
          <PasswordField
            label="Confirmar nova senha"
            value={confirmation}
            onChange={setConfirmation}
          />
          {error ? <SystemState kind="error" title="Link ou senha inválidos" body={error} /> : null}
          <Action type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Salvando..." : "Salvar nova senha"}
          </Action>
        </form>
        <Link
          to="/signin"
          className="mt-6 text-sm text-muted-foreground underline underline-offset-4"
        >
          Voltar para entrar
        </Link>
      </main>
    </div>
  );
}

function PasswordField({
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
        autoComplete="new-password"
        required
        className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
      />
    </div>
  );
}

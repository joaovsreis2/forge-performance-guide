import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Wordmark } from "@/components/forge/AppShell";
import { Action, SystemState } from "@/components/forge/ui";
import { forgeApi } from "@/lib/forge/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha — Forge" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [debugUrl, setDebugUrl] = useState("");

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-10">
      <Wordmark />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <h1 className="text-2xl font-semibold text-foreground">Recuperar senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe seu e-mail. Se a conta existir, enviaremos um link seguro.
        </p>
        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              const result = await forgeApi.recoverPassword(email);
              setDebugUrl(result.debugResetUrl ?? "");
              setSent(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label htmlFor="recovery-email" className="eyebrow block">
              E-mail
            </label>
            <input
              id="recovery-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            />
          </div>
          <Action type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Enviando..." : "Enviar link"}
          </Action>
        </form>
        {sent ? (
          <div className="mt-5">
            <SystemState
              kind="success"
              title="Confira seu e-mail"
              body="Se a conta existir, o link de recuperação foi enviado."
              action={
                debugUrl ? (
                  <a href={debugUrl} className="text-sm underline">
                    Abrir link local
                  </a>
                ) : undefined
              }
            />
          </div>
        ) : null}
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

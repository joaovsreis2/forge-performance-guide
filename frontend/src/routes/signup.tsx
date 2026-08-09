import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Wordmark } from "@/components/forge/AppShell";
import { Action, SystemState } from "@/components/forge/ui";
import { forgeApi } from "@/lib/forge/api";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Criar conta — Forge" },
      { name: "description", content: "Crie sua conta Forge e configure seu primeiro plano." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const { set, state } = useForge();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-10">
      <Wordmark />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <h1 className="text-2xl font-semibold text-foreground">Crie sua conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Depois disso, configuramos seu objetivo e suas informações de treino.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            try {
              const user = await forgeApi.register({
                name,
                email,
                password,
                passwordConfirmation: confirmation,
                acceptedTerms,
              });
              set({
                phase: "onboarding",
                profileName: user.name || user.firstName,
                email: user.email,
              });
              navigate({ to: "/onboarding" });
            } catch (reason) {
              setError(
                reason instanceof Error ? reason.message : "Não foi possível criar a conta.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Nome" type="text" value={name} onChange={setName} autoComplete="name" />
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            label="Senha"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <Field
            label="Confirmar senha"
            type="password"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
          />

          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            Aceito os termos necessários para criar minha conta.
          </label>

          {error ? (
            <SystemState kind="error" title="Não foi possível criar a conta" body={error} />
          ) : null}

          <Action type="submit" size="lg" className="w-full" disabled={busy || !state.hydrated}>
            {busy ? "Criando conta..." : "Criar conta"}
          </Action>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link to="/signin" className="text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div>
      <label htmlFor={id} className="eyebrow block">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
      />
    </div>
  );
}

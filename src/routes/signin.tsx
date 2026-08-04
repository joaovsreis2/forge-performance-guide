import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/forge/AppShell";
import { Action, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — Forge" },
      { name: "description", content: "Sign in to Forge to continue your training block." },
      { property: "og:title", content: "Sign in — Forge" },
      { property: "og:description", content: "Continue your training block." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { state, signIn } = useForge();
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@forge.app");
  const [password, setPassword] = useState("prototype");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state.hydrated && state.phase === "app") navigate({ to: "/" });
  }, [state.hydrated, state.phase, navigate]);

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-10">
      <Wordmark />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your training block is waiting where you left it.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.includes("@") || password.length < 4) {
              setError(true);
              return;
            }
            setError(false);
            setBusy(true);
            window.setTimeout(() => {
              setBusy(false);
              signIn();
              navigate({ to: "/onboarding" });
            }, 500);
          }}
        >
          <div>
            <label htmlFor="email" className="eyebrow block">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-subtle"
            />
          </div>
          <div>
            <label htmlFor="password" className="eyebrow block">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            />
          </div>

          {error ? (
            <SystemState
              kind="error"
              title="We could not sign you in"
              body="The email or password did not match. Nothing was changed on your account."
              preserved="Your training data is untouched. Try again or recover your password."
            />
          ) : null}

          <Action type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Action>
        </form>

        <div className="mt-6 flex flex-col items-start gap-1">
          <button type="button" className="tap text-sm text-muted-foreground underline-offset-4 hover:underline">
            Recover password
          </button>
          <button type="button" className="tap text-sm text-muted-foreground underline-offset-4 hover:underline">
            Create an account
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-subtle">Prototype — no real authentication.</p>
    </div>
  );
}

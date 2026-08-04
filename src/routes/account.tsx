import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { Action, Panel, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Forge" },
      { name: "description", content: "Profile, units, time zone, theme, notifications and security." },
      { property: "og:title", content: "Account — Forge" },
      { property: "og:description", content: "Your preferences, kept simple." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const ready = useAppGate();
  const { state, set, toggleTheme, signOut, resetPrototype } = useForge();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <AppShell eyebrow="Settings" title="Account">
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <Panel className="p-5">
            <p className="text-base font-medium text-foreground">{state.profileName}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">alex@forge.app</p>
            <p className="mt-2 text-xs text-muted-foreground">Goal: {state.goal}</p>
          </Panel>

          <Section title="Preferences">
            <Rows>
              <Row
                label="Units"
                right={
                  <button
                    type="button"
                    onClick={() => set({ units: state.units === "metric" ? "imperial" : "metric" })}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {state.units === "metric" ? "Metric (kg)" : "Imperial (lb)"}
                  </button>
                }
              />
              <Row label="Time zone" right={<span>Europe/Lisbon</span>} />
              <Row
                label="Theme"
                right={
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {state.theme === "dark" ? "Dark" : "Light"}
                  </button>
                }
              />
              <Row
                label="Sound"
                sub="Rest timer alerts"
                right={
                  <button
                    type="button"
                    aria-pressed={state.sound}
                    onClick={() => set({ sound: !state.sound })}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {state.sound ? "On" : "Off"}
                  </button>
                }
              />
              <Row
                label="Vibration"
                right={
                  <button
                    type="button"
                    aria-pressed={state.vibration}
                    onClick={() => set({ vibration: !state.vibration })}
                    className="tap rounded-md border border-border px-3 text-xs text-foreground"
                  >
                    {state.vibration ? "On" : "Off"}
                  </button>
                }
              />
              <Row label="Notifications" sub="Session reminders, weekly summary" right={<span>2 enabled</span>} />
              <Row label="Security" sub="Password and sessions" right={<span>Manage</span>} />
            </Rows>
          </Section>

          <Section title="Session">
            <div className="flex flex-wrap gap-2">
              <Action
                tone="outline"
                onClick={() => {
                  signOut();
                  navigate({ to: "/signin" });
                }}
              >
                Sign out
              </Action>
              <Action tone="ghost" onClick={resetPrototype}>
                Reset prototype data
              </Action>
            </div>
          </Section>

          <Section title="Delete account" hint="This cannot be undone">
            {!confirmDelete ? (
              <Action tone="danger" onClick={() => setConfirmDelete(true)}>
                Delete account
              </Action>
            ) : (
              <SystemState
                kind="error"
                title="Delete your account?"
                body="Your plans, sessions, records and measurements would be removed permanently."
                preserved="Nothing has been deleted yet. This prototype does not perform the action."
                action={
                  <Action tone="outline" onClick={() => setConfirmDelete(false)}>
                    Keep my account
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

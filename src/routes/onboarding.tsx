import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Wordmark } from "@/components/forge/AppShell";
import { Action, NumberField } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your training — Forge" },
      {
        name: "description",
        content: "A short setup: profile, training goal, physical information and plan preparation.",
      },
      { property: "og:title", content: "Set up your training — Forge" },
      { property: "og:description", content: "Four short steps, then your plan is ready." },
    ],
  }),
  component: Onboarding,
});

const GOALS = [
  { id: "strength", label: "Build strength", detail: "Heavier main lifts, lower repetitions" },
  { id: "muscle", label: "Build muscle", detail: "Moderate load, higher volume" },
  { id: "consistency", label: "Train consistently", detail: "Sustainable schedule first" },
  { id: "return", label: "Return after a break", detail: "Gradual reintroduction" },
];

const STEPS = ["Profile", "Goal", "Body", "Plan", "Ready"];

function Onboarding() {
  const { state, set, finishOnboarding } = useForge();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.profileName);
  const [goal, setGoal] = useState("strength");
  const [weight, setWeight] = useState(78.4);
  const [height, setHeight] = useState(181);
  const [days, setDays] = useState(4);
  const [planReady, setPlanReady] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Wordmark />
        <p className="num shrink-0 text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      <ol className="mt-4 flex gap-1.5" aria-label="Setup progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <span className="sr-only">
              {label} {i <= step ? "completed" : "pending"}
            </span>
            <span
              aria-hidden
              className={`block h-1 rounded-full ${i <= step ? "bg-primary" : "bg-elevated"}`}
            />
          </li>
        ))}
      </ol>

      <div className="mx-auto w-full max-w-sm flex-1 py-10">
        {step === 0 ? (
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Let&apos;s set up your profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This only takes a moment. You can change everything later.
            </p>
            <label htmlFor="name" className="eyebrow mt-8 block">
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            />
            <label htmlFor="tz" className="eyebrow mt-5 block">
              Time zone
            </label>
            <select
              id="tz"
              defaultValue="Europe/Lisbon"
              className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option>Europe/Lisbon</option>
              <option>Europe/Berlin</option>
              <option>America/New_York</option>
              <option>Asia/Tokyo</option>
            </select>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h1 className="text-2xl font-semibold text-foreground">What are you training for?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This shapes repetition ranges and progression pace.
            </p>
            <fieldset className="mt-6 space-y-2">
              <legend className="sr-only">Primary training goal</legend>
              {GOALS.map((g) => (
                <label
                  key={g.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                    goal === g.id ? "border-primary bg-elevated" : "border-border bg-surface"
                  }`}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={g.id}
                    checked={goal === g.id}
                    onChange={() => setGoal(g.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{g.label}</span>
                    <span className="block text-xs text-muted-foreground">{g.detail}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Basic physical information</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Used for load suggestions only. Optional fields can stay empty.
            </p>
            <div className="mt-6 space-y-3">
              <NumberField label="Body weight" value={weight} step={0.1} unit="kg" onChange={setWeight} />
              <NumberField label="Height" value={height} step={1} unit="cm" onChange={setHeight} />
              <NumberField
                label="Training days per week"
                value={days}
                step={1}
                min={2}
                unit="days"
                onChange={setDays}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Preparing your plan</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Forge Base — an upper/lower split across {days} training days.
            </p>
            <div className="mt-6 space-y-2">
              {["Schedule created", "Exercise order set", "Starting loads estimated"].map((t, i) => (
                <div
                  key={t}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"
                >
                  {planReady || i < 2 ? (
                    <Check aria-hidden className="size-4 text-primary" />
                  ) : (
                    <Loader2 aria-hidden className="size-4 animate-spin text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground">{t}</span>
                </div>
              ))}
            </div>
            {!planReady ? (
              <Action tone="outline" className="mt-4 w-full" onClick={() => setPlanReady(true)}>
                Finish plan setup
              </Action>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Your plan is ready.</p>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <span aria-hidden className="grid size-10 place-items-center rounded-full border border-primary/50">
              <Check className="size-5 text-primary" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold text-foreground">You&apos;re set up, {name.split(" ")[0]}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your first session is scheduled. Your workout is ready when you are.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-sm space-y-2">
        {step < 4 ? (
          <Action
            size="lg"
            className="w-full"
            disabled={step === 3 && !planReady}
            onClick={() => {
              if (step === 1) set({ goal: GOALS.find((g) => g.id === goal)?.label ?? "Build strength" });
              if (step === 0) set({ profileName: name });
              next();
            }}
          >
            Continue
          </Action>
        ) : (
          <Action
            size="lg"
            className="w-full"
            onClick={() => {
              finishOnboarding();
              navigate({ to: "/" });
            }}
          >
            Go to Today
          </Action>
        )}
        {step > 0 && step < 4 ? (
          <Action tone="ghost" className="w-full" onClick={() => setStep((s) => s - 1)}>
            Back
          </Action>
        ) : null}
      </div>
    </div>
  );
}

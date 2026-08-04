import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Moon, Timer } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { PrototypeBar } from "@/components/forge/PrototypeBar";
import { SyncNotice, SyncPill } from "@/components/forge/SyncPill";
import { Action, ActionLink, Panel, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { history, todaysWorkout } from "@/lib/forge/data";
import { formatClock, useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Forge" },
      {
        name: "description",
        content:
          "Your scheduled session, recent progress and recovery context in one calm screen.",
      },
      { property: "og:title", content: "Today — Forge" },
      { property: "og:description", content: "Your workout is ready when you are." },
    ],
  }),
  component: Today,
});

function Today() {
  const ready = useAppGate();
  const { state, set } = useForge();
  const workout = todaysWorkout!;
  const session = state.session;
  const greeting = `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${state.profileName.split(" ")[0]}`;

  return (
    <AppShell eyebrow={greeting} title="Today" actions={<SyncPill className="hidden sm:inline-flex" />}>
      {!ready ? (
        <GateFallback />
      ) : (
        <>
          <SyncNotice />

          {session ? (
            <Panel className="mt-4 p-5">
              <p className="eyebrow">Workout in progress</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">{workout.name}</h2>
              <p className="num mt-1 text-sm text-muted-foreground">
                {session.logs.filter((l) => !l.skipped).length} sets logged ·{" "}
                {formatClock(Math.floor((Date.now() - session.startedAt) / 1000))} elapsed
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                You can continue from where you stopped.
              </p>
              <ActionLink to="/workout/active" size="lg" className="mt-4 w-full">
                Resume workout <ArrowRight aria-hidden className="size-4" />
              </ActionLink>
            </Panel>
          ) : state.todayVariant === "scheduled" ? (
            <ScheduledState />
          ) : state.todayVariant === "rest" ? (
            <RestState />
          ) : state.todayVariant === "no-plan" ? (
            <NoPlanState />
          ) : (
            <CompletedState onRepeat={() => set({ todayVariant: "scheduled" })} />
          )}

          <Section title="Recent progress" hint="Two most recent sessions">
            <Rows>
              {history.slice(0, 2).map((h) => (
                <Row
                  key={h.id}
                  label={h.name}
                  sub={`${h.date} · ${h.focus}`}
                  right={<span className="num">{h.duration}</span>}
                />
              ))}
            </Rows>
          </Section>

          <PrototypeBar showToday />
        </>
      )}
    </AppShell>
  );
}

function ScheduledState() {
  const workout = todaysWorkout!;
  return (
    <>
      <section className="mt-4">
        <p className="eyebrow">Scheduled · {workout.weekday}</p>
        <h2 className="mt-2 text-[2rem] font-semibold leading-tight text-foreground">
          {workout.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{workout.focus}</p>

        <dl className="num mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="sr-only">Exercises</dt>
            <dd className="text-foreground">
              {workout.exercises.length}{" "}
              <span className="text-muted-foreground">exercises</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Sets</dt>
            <dd className="text-foreground">
              {workout.exercises.reduce((n, e) => n + e.sets, 0)}{" "}
              <span className="text-muted-foreground">sets</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Estimated duration</dt>
            <dd className="text-foreground">
              ~{workout.estimatedMinutes} <span className="text-muted-foreground">min</span>
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-sm text-muted-foreground">Your workout is ready when you are.</p>

        <ActionLink to="/workout" size="lg" className="mt-4 w-full sm:w-auto sm:min-w-64">
          Start workout <ArrowRight aria-hidden className="size-4" />
        </ActionLink>

        <div className="mt-3">
          <ActionLink to="/progress/recovery" tone="ghost">
            <Timer aria-hidden className="size-4" /> Log recovery instead
          </ActionLink>
        </div>
      </section>
    </>
  );
}

function RestState() {
  return (
    <section className="mt-4">
      <p className="eyebrow">Scheduled rest</p>
      <h2 className="mt-2 flex items-center gap-2 text-[2rem] font-semibold leading-tight text-foreground">
        <Moon aria-hidden className="size-6 text-muted-foreground" /> Rest day
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Recovery is part of progress. Next session is Lower A tomorrow.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <ActionLink to="/progress/recovery">Log recovery</ActionLink>
        <ActionLink to="/plan" tone="outline">
          View plan
        </ActionLink>
      </div>
    </section>
  );
}

function NoPlanState() {
  return (
    <div className="mt-4">
      <SystemState
        kind="empty"
        title="No active training plan"
        body="You don't have a plan assigned right now, so there is nothing scheduled today."
        preserved="Your training history and records are unchanged."
        action={
          <ActionLink to="/plan">Browse plans</ActionLink>
        }
      />
    </div>
  );
}

function CompletedState({ onRepeat }: { onRepeat: () => void }) {
  const workout = todaysWorkout!;
  return (
    <section className="mt-4">
      <p className="eyebrow">Completed today</p>
      <h2 className="mt-2 text-[2rem] font-semibold leading-tight text-foreground">{workout.name}</h2>
      <p className="num mt-1 text-sm text-muted-foreground">
        51 min · 14 of 14 sets · 1 repetition record
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Session recorded. Next scheduled session is Lower A tomorrow.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <ActionLink to="/progress/history">View session</ActionLink>
        <Action tone="outline" onClick={onRepeat}>
          Train again anyway
        </Action>
      </div>
    </section>
  );
}

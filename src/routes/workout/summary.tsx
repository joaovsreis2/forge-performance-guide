import { createFileRoute } from "@tanstack/react-router";
import { Check, Trophy } from "lucide-react";
import { AppShell } from "@/components/forge/AppShell";
import { SyncNotice } from "@/components/forge/SyncPill";
import { ActionLink, Panel, Row, Rows, Section, SystemState } from "@/components/forge/ui";
import { formatClock, totalPlannedSets, useForge, XP_PER_LEVEL } from "@/lib/forge/store";
import { todaysWorkout } from "@/lib/forge/data";

export const Route = createFileRoute("/workout/summary")({
  head: () => ({
    meta: [
      { title: "Session summary — Forge" },
      {
        name: "description",
        content: "What you completed, what was skipped, records and level progress.",
      },
      { property: "og:title", content: "Session summary — Forge" },
      { property: "og:description", content: "A clear record of the session you just finished." },
    ],
  }),
  component: Summary,
});

function Summary() {
  const { state } = useForge();
  const s = state.lastSession;

  if (!state.hydrated) return null;

  if (!s) {
    return (
      <AppShell eyebrow="Summary" title="No recent session">
        <SystemState
          kind="empty"
          title="Nothing to summarize yet"
          body="Finish or cancel a session and its summary will appear here."
          action={<ActionLink to="/">Back to Today</ActionLink>}
        />
      </AppShell>
    );
  }

  const duration = Math.floor(((s.finishedAt ?? Date.now()) - s.startedAt) / 1000);
  const done = s.logs.filter((l) => !l.skipped).length;
  const skippedSets = s.logs.filter((l) => l.skipped).length;
  const xpSets = done * 2;
  const xpTotal = s.outcome === "completed" ? 100 + xpSets + (s.prHit ? 25 : 0) : 0;
  const intoLevel = state.xp % XP_PER_LEVEL;

  return (
    <AppShell eyebrow={s.outcome === "completed" ? "Session recorded" : "Session cancelled"} title={todaysWorkout!.name}>
      <SyncNotice />

      {s.outcome === "completed" ? (
        <section className="mt-4">
          <span aria-hidden className="grid size-10 place-items-center rounded-full border border-primary/50">
            <Check className="size-5 text-primary" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">Session complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {done === totalPlannedSets
              ? "Every scheduled set was logged."
              : "Your logged work has been saved exactly as you recorded it."}
          </p>
        </section>
      ) : (
        <section className="mt-4">
          <h2 className="text-2xl font-semibold text-foreground">Session cancelled</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The {done} sets you logged were preserved in your history. Nothing else was recorded.
          </p>
        </section>
      )}

      <dl className="num mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
        <div>
          <dd className="text-xl font-semibold text-foreground">{formatClock(duration)}</dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">Duration</dt>
        </div>
        <div>
          <dd className="text-xl font-semibold text-foreground">
            {done}
            <span className="text-sm font-normal text-muted-foreground">/{totalPlannedSets}</span>
          </dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">Sets logged</dt>
        </div>
        <div>
          <dd className="text-xl font-semibold text-foreground">
            {skippedSets + s.skippedExercises.length}
          </dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">Skipped items</dt>
        </div>
      </dl>

      {s.prHit ? (
        <Panel className="mt-6 flex items-start gap-3 p-4">
          <Trophy aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Personal record</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You went beyond your previous best on this exercise. It is stored in your records.
            </p>
          </div>
        </Panel>
      ) : null}

      <Section title="Logged work" hint={`${s.logs.length} entries`}>
        <Rows>
          {s.logs.map((l) => (
            <Row
              key={`${l.exerciseId}-${l.setIndex}`}
              label={l.exerciseName}
              sub={`Set ${l.setIndex + 1}${l.synced ? "" : " · saved on device"}`}
              right={<span className="num">{l.skipped ? "Skipped" : `${l.weight} kg × ${l.reps}`}</span>}
            />
          ))}
        </Rows>
      </Section>

      {s.outcome === "completed" ? (
        <Section title="Experience" hint="Gamification stays secondary to your training data">
          <Rows>
            <Row label="Workout completed" right={<span className="num">+100 XP</span>} />
            <Row label={`${done} valid sets`} right={<span className="num">+{xpSets} XP</span>} />
            {s.prHit ? <Row label="New record" right={<span className="num">+25 XP</span>} /> : null}
            <Row label="Session total" right={<span className="num text-foreground">+{xpTotal} XP</span>} />
          </Rows>
          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
              <p className="text-sm text-foreground">Level {state.level}</p>
              <p className="num text-xs text-muted-foreground">
                {intoLevel} / {XP_PER_LEVEL} XP to level {state.level + 1}
              </p>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated"
              role="progressbar"
              aria-valuenow={intoLevel}
              aria-valuemin={0}
              aria-valuemax={XP_PER_LEVEL}
              aria-label={`Progress to level ${state.level + 1}`}
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${(intoLevel / XP_PER_LEVEL) * 100}%` }}
              />
            </div>
          </div>
        </Section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        <ActionLink to="/">Back to Today</ActionLink>
        <ActionLink to="/progress/history" tone="outline">
          Training history
        </ActionLink>
      </div>
    </AppShell>
  );
}

import { useEffect, useState, type ReactNode } from "react";

import { useForge } from "@/lib/forge/store";

const MINIMUM_VISIBLE_MS = 650;
const READY_HOLD_MS = 700;
const CLICK_FEEDBACK_MS = 80;
const EXIT_DURATION_MS = 320;
const CLICK_EXIT_DURATION_MS = 220;

type LaunchPhase = "visible" | "leaving" | "hidden";

export function LaunchGate({ children }: { children: ReactNode }) {
  const { state } = useForge();
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [phase, setPhase] = useState<LaunchPhase>("visible");
  const [activationKey, setActivationKey] = useState(0);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => setMinimumElapsed(true),
      reduceMotion ? 0 : MINIMUM_VISIBLE_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!state.hydrated || (!minimumElapsed && activationKey === 0)) return;

    const holdDuration = activationKey > 0 ? CLICK_FEEDBACK_MS : READY_HOLD_MS;
    const exitDuration = activationKey > 0 ? CLICK_EXIT_DURATION_MS : EXIT_DURATION_MS;
    const leaveTimer = window.setTimeout(() => setPhase("leaving"), holdDuration);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), holdDuration + exitDuration);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [activationKey, minimumElapsed, state.hydrated]);

  const isOpen = phase !== "hidden";

  return (
    <>
      <div aria-hidden={isOpen || undefined} inert={isOpen || undefined}>
        {children}
      </div>
      {isOpen ? (
        <LaunchScreen
          phase={phase}
          activationKey={activationKey}
          interactive={clientReady}
          onActivate={() => {
            setPhase("visible");
            setActivationKey((current) => current + 1);
          }}
        />
      ) : null}
    </>
  );
}

function LaunchScreen({
  phase,
  activationKey,
  interactive,
  onActivate,
}: {
  phase: Exclude<LaunchPhase, "hidden">;
  activationKey: number;
  interactive: boolean;
  onActivate: () => void;
}) {
  return (
    <section
      className="launch-screen fixed inset-0 z-[100] grid min-h-dvh place-items-center overflow-hidden bg-background px-6 text-foreground"
      data-phase={phase}
      data-activated={activationKey > 0 || undefined}
      role="status"
      aria-label="Abrindo Forge"
    >
      <button
        type="button"
        className="launch-trigger absolute inset-0 z-10 cursor-pointer bg-transparent"
        aria-label="Abrir Forge agora"
        disabled={!interactive}
        onClick={onActivate}
      />

      <div
        key={activationKey}
        className="launch-brand pointer-events-none flex flex-col items-center text-center"
        data-activated={activationKey > 0 || undefined}
      >
        <div className="launch-mark relative grid size-28 place-items-center">
          <span aria-hidden className="launch-impact absolute size-20 rounded-[16px]" />
          <span
            aria-hidden
            className="launch-corner absolute left-0 top-0 size-5 border-l border-t border-primary/55"
          />
          <span
            aria-hidden
            className="launch-corner absolute bottom-0 right-0 size-5 border-b border-r border-primary/55"
          />
          <img
            src="/forge-icon.svg"
            alt=""
            className="launch-icon size-20 rounded-[14px] shadow-raised"
            width="80"
            height="80"
          />
        </div>

        <div className="launch-copy mt-7">
          <h1 className="text-3xl font-semibold">FORGE</h1>
          <p className="mt-2 text-sm text-muted-foreground">Performance se constrói.</p>
        </div>
      </div>

      <div className="launch-footer pointer-events-none absolute inset-x-6 bottom-8 flex flex-col items-center gap-3 sm:bottom-10">
        <span aria-hidden className="h-px w-12 bg-primary" />
        <p className="text-[0.6875rem] font-medium text-subtle">PLATAFORMA DE PERFORMANCE</p>
      </div>
    </section>
  );
}

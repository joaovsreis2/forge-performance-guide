import { useEffect, useState, type ReactNode } from "react";

import { useForge } from "@/lib/forge/store";

const MINIMUM_VISIBLE_MS = 650;
const EXIT_DURATION_MS = 320;

type LaunchPhase = "visible" | "leaving" | "hidden";

export function LaunchGate({ children }: { children: ReactNode }) {
  const { state } = useForge();
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [phase, setPhase] = useState<LaunchPhase>("visible");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => setMinimumElapsed(true),
      reduceMotion ? 0 : MINIMUM_VISIBLE_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minimumElapsed || !state.hydrated) return;

    setPhase("leaving");
    const timer = window.setTimeout(() => setPhase("hidden"), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [minimumElapsed, state.hydrated]);

  const isOpen = phase !== "hidden";

  return (
    <>
      <div aria-hidden={isOpen || undefined} inert={isOpen || undefined}>
        {children}
      </div>
      {isOpen ? <LaunchScreen phase={phase} /> : null}
    </>
  );
}

function LaunchScreen({ phase }: { phase: Exclude<LaunchPhase, "hidden"> }) {
  return (
    <section
      className="launch-screen fixed inset-0 z-[100] grid min-h-dvh place-items-center overflow-hidden bg-background px-6 text-foreground"
      data-phase={phase}
      role="status"
      aria-label="Abrindo Forge"
    >
      <div className="launch-brand flex flex-col items-center text-center">
        <div className="launch-mark relative grid size-28 place-items-center">
          <span
            aria-hidden
            className="absolute left-0 top-0 size-5 border-l border-t border-primary/55"
          />
          <span
            aria-hidden
            className="absolute bottom-0 right-0 size-5 border-b border-r border-primary/55"
          />
          <img
            src="/forge-icon.svg"
            alt=""
            className="size-20 rounded-[14px] shadow-raised"
            width="80"
            height="80"
          />
        </div>

        <div className="launch-copy mt-7">
          <h1 className="text-3xl font-semibold">FORGE</h1>
          <p className="mt-2 text-sm text-muted-foreground">Performance se constrói.</p>
        </div>
      </div>

      <div className="launch-footer absolute inset-x-6 bottom-8 flex flex-col items-center gap-3 sm:bottom-10">
        <span aria-hidden className="h-px w-12 bg-primary" />
        <p className="text-[0.6875rem] font-medium text-subtle">PLATAFORMA DE PERFORMANCE</p>
      </div>
    </section>
  );
}

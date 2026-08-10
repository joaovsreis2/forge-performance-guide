import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useForge } from "@/lib/forge/store";

const CONSTRUCTION_DURATION_MS = 1_100;
const EXIT_DURATION_MS = 520;

type LaunchPhase = "visible" | "leaving" | "hidden";

export function LaunchGate({ children }: { children: ReactNode }) {
  const { state } = useForge();
  const [constructed, setConstructed] = useState(false);
  const [phase, setPhase] = useState<LaunchPhase>("visible");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => setConstructed(true),
      reduceMotion ? 0 : CONSTRUCTION_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("hidden"), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const isOpen = phase !== "hidden";
  const isReady = constructed && state.hydrated;

  return (
    <>
      <div aria-hidden={isOpen || undefined} inert={isOpen || undefined}>
        {children}
      </div>
      {isOpen ? (
        <LaunchScreen
          phase={phase}
          ready={isReady}
          onActivate={() => {
            if (isReady) setPhase("leaving");
          }}
        />
      ) : null}
    </>
  );
}

function LaunchScreen({
  phase,
  ready,
  onActivate,
}: {
  phase: Exclude<LaunchPhase, "hidden">;
  ready: boolean;
  onActivate: () => void;
}) {
  return (
    <section
      className="launch-screen fixed inset-0 z-[100] grid min-h-dvh place-items-center overflow-hidden bg-transparent px-6 text-foreground"
      data-phase={phase}
      data-ready={ready || undefined}
      role="status"
      aria-live="polite"
      aria-label={ready ? "Forge pronto para entrar" : "Preparando Forge"}
    >
      <span aria-hidden className="launch-door-line absolute left-1/2 top-1/2 z-[1]" />
      <button
        type="button"
        className="launch-trigger absolute inset-0 z-10 bg-transparent disabled:cursor-wait"
        aria-label="Continuar para o Forge"
        disabled={!ready}
        onClick={onActivate}
      />

      <div className="launch-brand pointer-events-none relative z-[2] flex flex-col items-center text-center">
        <div className="launch-mark relative grid size-28 place-items-center">
          <span
            aria-hidden
            className="launch-corner launch-corner-start absolute left-0 top-0 size-5 border-l border-t border-primary/55"
          />
          <span
            aria-hidden
            className="launch-corner launch-corner-end absolute bottom-0 right-0 size-5 border-b border-r border-primary/55"
          />
          <img
            src="/forge-icon.svg?v=4"
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

      <div className="launch-footer pointer-events-none absolute inset-x-6 bottom-8 z-[2] flex flex-col items-center gap-3 sm:bottom-10">
        <span aria-hidden className="launch-footer-line h-px w-12 bg-primary" />
        <p className="launch-footer-label flex min-h-5 items-center gap-2 text-[0.6875rem] font-medium text-subtle">
          {ready ? (
            <>
              ENTRAR <ArrowRight aria-hidden className="size-3.5" />
            </>
          ) : (
            "PREPARANDO"
          )}
        </p>
      </div>
    </section>
  );
}

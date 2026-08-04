import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForge } from "@/lib/forge/store";
import { Skeleton } from "./ui";

/** Client-side prototype gate: sign in -> onboarding -> app. */
export function useAppGate() {
  const { state } = useForge();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.hydrated) return;
    if (state.phase === "signin") navigate({ to: "/signin" });
    else if (state.phase === "onboarding") navigate({ to: "/onboarding" });
  }, [state.hydrated, state.phase, navigate]);

  return state.hydrated && state.phase === "app";
}

export function GateFallback() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-20 w-full" />
      <span className="sr-only">Loading your training data</span>
    </div>
  );
}

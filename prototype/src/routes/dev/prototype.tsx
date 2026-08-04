import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/forge/AppShell";
import { PrototypeBar } from "@/components/forge/PrototypeBar";
import { GateFallback, useAppGate } from "@/components/forge/Gate";

export const Route = createFileRoute("/dev/prototype")({
  head: () => ({
    meta: [
      { title: "Controles do protótipo — Forge" },
      {
        name: "description",
        content: "Controles internos para revisar estados do protótipo Forge.",
      },
      { property: "og:title", content: "Controles do protótipo — Forge" },
      { property: "og:description", content: "Estados de demonstração fora das rotas do produto." },
    ],
  }),
  component: PrototypeControls,
});

function PrototypeControls() {
  const ready = useAppGate();

  return (
    <AppShell eyebrow="Desenvolvimento" title="Controles do protótipo">
      {!ready ? <GateFallback /> : <PrototypeBar showToday />}
    </AppShell>
  );
}

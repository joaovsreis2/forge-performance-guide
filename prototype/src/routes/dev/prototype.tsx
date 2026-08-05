import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/forge/AppShell";
import { PrototypeBar } from "@/components/forge/PrototypeBar";
import { GateFallback, useAppGate } from "@/components/forge/Gate";
import { ActionLink, SystemState } from "@/components/forge/ui";
import { useForge } from "@/lib/forge/store";

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
  const { state } = useForge();
  const ready = useAppGate({ redirect: false });

  return (
    <AppShell eyebrow="Desenvolvimento" title="Cenários do protótipo">
      {!state.hydrated ? (
        <GateFallback />
      ) : !ready ? (
        <SystemState
          kind="denied"
          title="A área de protótipo exige uma sessão ativa."
          body="Esta rota altera estados internos da demonstração e só fica disponível durante uma sessão autenticada."
          preserved="Nenhum cenário foi alterado. Depois de entrar e concluir o onboarding, volte para /dev/prototype."
          action={<ActionLink to="/signin">Ir para o login</ActionLink>}
        />
      ) : (
        <PrototypeBar showToday />
      )}
    </AppShell>
  );
}

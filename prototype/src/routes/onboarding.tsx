import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Wordmark } from "@/components/forge/AppShell";
import { Action, NumberField } from "@/components/forge/ui";
import { PLAN_NAME } from "@/lib/forge/data";
import { useForge } from "@/lib/forge/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Configurar seu treino — Forge" },
      {
        name: "description",
        content:
          "Uma configuração breve: perfil, objetivo, informações físicas e atribuição do plano.",
      },
      { property: "og:title", content: "Configurar seu treino — Forge" },
      {
        property: "og:description",
        content: "Quatro passos curtos, depois seu plano fica pronto.",
      },
    ],
  }),
  component: Onboarding,
});

const GOALS = [
  {
    id: "strength",
    label: "Ganhar força",
    detail: "Levantamentos principais mais pesados, menos repetições",
  },
  { id: "muscle", label: "Ganhar massa muscular", detail: "Carga moderada, mais volume" },
  { id: "consistency", label: "Treinar com consistência", detail: "Agenda sustentável primeiro" },
  { id: "return", label: "Voltar após uma pausa", detail: "Reintrodução gradual" },
];

const STEPS = ["Perfil", "Objetivo", "Corpo", "Plano", "Pronto"];

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
          Etapa {step + 1} de {STEPS.length}
        </p>
      </div>

      <ol className="mt-4 flex gap-1.5" aria-label="Progresso da configuração">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <span className="sr-only">
              {label} {i <= step ? "concluída" : "pendente"}
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
            <h1 className="text-2xl font-semibold text-foreground">Vamos configurar seu perfil</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Isso leva só um momento. Você pode alterar tudo depois.
            </p>
            <label htmlFor="name" className="eyebrow mt-8 block">
              Nome de exibição
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            />
            <label htmlFor="tz" className="eyebrow mt-5 block">
              Fuso horário
            </label>
            <select
              id="tz"
              defaultValue="America/Sao_Paulo"
              className="tap mt-1.5 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option>America/Sao_Paulo</option>
              <option>America/New_York</option>
              <option>Europe/Berlin</option>
              <option>Asia/Tokyo</option>
            </select>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Qual é seu objetivo de treino?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Isso orienta faixas de repetição e ritmo de progressão.
            </p>
            <fieldset className="mt-6 space-y-2">
              <legend className="sr-only">Objetivo principal de treino</legend>
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
            <h1 className="text-2xl font-semibold text-foreground">Informações físicas básicas</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Usadas apenas para contexto de treino. Campos opcionais podem ficar vazios.
            </p>
            <div className="mt-6 space-y-3">
              <NumberField
                label="Peso corporal"
                value={weight}
                step={0.1}
                unit="kg"
                onChange={setWeight}
              />
              <NumberField label="Altura" value={height} step={1} unit="cm" onChange={setHeight} />
              <NumberField
                label="Dias de treino por semana"
                value={days}
                step={1}
                min={2}
                unit="dias"
                onChange={setDays}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Plano atribuído</h1>
            <p className="mt-2 text-sm text-muted-foreground">{PLAN_NAME}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu plano foi importado de uma planilha ou atribuído por um administrador.
            </p>
            <div className="mt-6 space-y-2">
              {["Plano atribuído", "Agenda semanal importada", "Exercícios preservados"].map(
                (t, i) => (
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
                ),
              )}
            </div>
            {!planReady ? (
              <div className="mt-4">
                <p id="plan-confirmation-help" className="text-sm font-medium text-foreground">
                  Confirme o plano atribuído para continuar.
                </p>
                <Action
                  tone="outline"
                  className="mt-3 w-full"
                  aria-describedby="plan-confirmation-help"
                  onClick={() => {
                    setPlanReady(true);
                    window.requestAnimationFrame(() =>
                      document.getElementById("onboarding-continue")?.focus(),
                    );
                  }}
                >
                  Confirmar plano atribuído
                </Action>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ok" role="status">
                Plano confirmado. Você já pode continuar.
              </p>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-full border border-primary/50"
            >
              <Check className="size-5 text-primary" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold text-foreground">
              Tudo pronto, {name.split(" ")[0]}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua primeira sessão está agendada. Seu treino está pronto quando você estiver.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-sm space-y-2">
        {step < 4 ? (
          <Action
            id="onboarding-continue"
            size="lg"
            className="w-full"
            disabled={step === 3 && !planReady}
            aria-describedby={step === 3 && !planReady ? "plan-confirmation-help" : undefined}
            onClick={() => {
              if (step === 1)
                set({ goal: GOALS.find((g) => g.id === goal)?.label ?? "Ganhar força" });
              if (step === 0) set({ profileName: name });
              next();
            }}
          >
            Continuar
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
            Ir para Hoje
          </Action>
        )}
        {step > 0 && step < 4 ? (
          <Action tone="ghost" className="w-full" onClick={() => setStep((s) => s - 1)}>
            Voltar
          </Action>
        ) : null}
      </div>
    </div>
  );
}

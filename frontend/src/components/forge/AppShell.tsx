import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarRange, LineChart, Sun, Moon, UserRound, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useForge } from "@/lib/forge/store";
import { SyncPill } from "./SyncPill";

const NAV = [
  { to: "/", label: "Hoje", icon: Zap },
  { to: "/plan", label: "Plano", icon: CalendarRange },
  { to: "/progress", label: "Progresso", icon: LineChart },
  { to: "/account", label: "Conta", icon: UserRound },
] as const;

export function AppShell({
  title,
  eyebrow,
  children,
  actions,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { state, toggleTheme } = useForge();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-0 md:pl-56">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <Wordmark />
        </Link>
        <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`tap flex items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                  active
                    ? "bg-elevated font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 space-y-3 px-1">
          <SyncPill />
          <ThemeButton theme={state.theme} onClick={toggleTheme} wide />
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="eyebrow">{eyebrow}</p>
            ) : (
              <div className="md:hidden">
                <Wordmark small />
              </div>
            )}
            <h1 className="truncate text-[1.375rem] font-semibold text-foreground">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <div className="md:hidden">
              <ThemeButton theme={state.theme} onClick={toggleTheme} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-10 pt-6">{children}</main>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/98 backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`tap flex flex-col items-center justify-center gap-1 py-2 text-[0.6875rem] ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon aria-hidden className="size-5" />
                  <span className="font-medium">{label}</span>
                  <span
                    aria-hidden
                    className={`h-0.5 w-6 rounded-full ${active ? "bg-primary" : "bg-transparent"}`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-[5px] border border-primary/60 text-[0.625rem] font-bold text-primary"
      >
        F
      </span>
      <span
        className={`font-semibold tracking-[0.22em] text-foreground ${small ? "text-[0.6875rem]" : "text-xs"}`}
      >
        FORGE
      </span>
    </span>
  );
}

function ThemeButton({
  theme,
  onClick,
  wide,
}: {
  theme: string;
  onClick: () => void;
  wide?: boolean;
}) {
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
      className={`tap inline-flex items-center justify-center gap-2 rounded-md border border-border text-sm text-muted-foreground transition-colors hover:text-foreground ${
        wide ? "w-full px-3" : "px-3"
      }`}
    >
      <Icon aria-hidden className="size-4" />
      {wide ? <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span> : null}
    </button>
  );
}

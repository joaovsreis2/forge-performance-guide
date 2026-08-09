import { Link } from "@tanstack/react-router";
import {
  CircleSlash,
  Info,
  Loader2,
  Lock,
  Minus,
  Plus,
  CheckCircle2,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import type { ReactNode } from "react";

/* ---------------- actions ---------------- */

const base =
  "tap inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const tones = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border text-foreground hover:bg-elevated",
  ghost: "text-muted-foreground hover:text-foreground",
  danger: "border border-destructive/50 text-destructive hover:bg-destructive/10",
} as const;

type Tone = keyof typeof tones;

export function Action({
  tone = "primary",
  size = "md",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: "md" | "lg" }) {
  return (
    <button
      {...rest}
      className={`${base} ${tones[tone]} ${size === "lg" ? "h-14 px-6 text-base" : "h-11 px-4"} ${className}`}
    />
  );
}

export function ActionLink({
  tone = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: React.ComponentProps<typeof Link> & { tone?: Tone; size?: "md" | "lg" }) {
  return (
    <Link
      {...rest}
      className={`${base} ${tones[tone]} ${size === "lg" ? "h-14 px-6 text-base" : "h-11 px-4"} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ---------------- layout ---------------- */

export function Section({
  title,
  hint,
  action,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-9 ${className}`}>
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface ${className}`}>{children}</div>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {children}
    </ul>
  );
}

export function Row({
  label,
  value,
  sub,
  right,
}: {
  label: ReactNode;
  value?: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{label}</p>
        {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
      </div>
      <div className="num shrink-0 text-right text-sm text-muted-foreground">{right ?? value}</div>
    </li>
  );
}

export function Metric({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div>
      <p className="num text-2xl font-semibold text-foreground">
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
        ) : null}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ---------------- score bar ---------------- */

export function ScoreBar({
  label,
  score,
  confidence,
  trend,
  explanation,
}: {
  label: string;
  score: number;
  confidence: string;
  trend: string;
  explanation?: string;
}) {
  return (
    <div className="py-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <h3 className="truncate text-sm font-medium text-foreground">{label}</h3>
        <p className="num shrink-0 text-xl font-semibold text-foreground">
          {score}
          <span className="text-xs font-normal text-muted-foreground">/100</span>
        </p>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-elevated"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} score ${score} of 100, ${confidence}`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-muted-foreground">{confidence}</span>
        <span aria-hidden className="text-border">
          ·
        </span>
        <span className="num text-muted-foreground">{trend}</span>
      </div>
      {explanation ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{explanation}</p>
      ) : null}
    </div>
  );
}

/* ---------------- numeric entry ---------------- */

export function NumberField({
  label,
  value,
  step,
  min = 0,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  unit?: string;
  onChange: (n: number) => void;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <label htmlFor={id} className="eyebrow block">
        {label}
      </label>
      <div className="mt-2 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuir ${label}`}
          onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
          className="tap grid place-items-center rounded-lg border border-border text-foreground hover:bg-elevated"
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <div className="flex items-baseline justify-center gap-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="num w-full min-w-0 bg-transparent text-center text-3xl font-semibold text-foreground outline-none"
          />
          {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
        </div>
        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          onClick={() => onChange(Number((value + step).toFixed(2)))}
          className="tap grid place-items-center rounded-lg border border-border text-foreground hover:bg-elevated"
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- system states ---------------- */

const stateIcons = {
  loading: Loader2,
  empty: CircleSlash,
  error: TriangleAlert,
  denied: Lock,
  offline: WifiOff,
  success: CheckCircle2,
  info: Info,
} as const;

export function SystemState({
  kind,
  title,
  body,
  preserved,
  action,
}: {
  kind: keyof typeof stateIcons;
  title: string;
  body: string;
  preserved?: string;
  action?: ReactNode;
}) {
  const Icon = stateIcons[kind];
  const tone =
    kind === "error"
      ? "text-destructive"
      : kind === "success"
        ? "text-ok"
        : kind === "offline"
          ? "text-warn"
          : "text-muted-foreground";
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className="rounded-xl border border-border bg-surface p-5"
    >
      <Icon aria-hidden className={`size-5 ${tone} ${kind === "loading" ? "animate-spin" : ""}`} />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {preserved ? (
        <p className="mt-2 rounded-md bg-elevated px-3 py-2 text-xs text-muted-foreground">
          {preserved}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-elevated ${className}`} />;
}

// XP and level rules. Deterministic, auditable, no hidden state.
// Total XP required to reach level N = 100 * N * (N - 1)

export const XP_RULES = {
  workoutCompleted: 100,
  workoutPartial: 50,
  workoutCancelled: 0,
  exerciseCompleted: 5,
  validSet: 2,
  awardedSetLimit: 20,
  personalRecord: 25,
  recoveryLog: 5,
  measurementLog: 10,
  dailyLimit: 500,
} as const;

export type XpEventType =
  | "workout_completed"
  | "workout_partial"
  | "exercise_completed"
  | "valid_set"
  | "personal_record"
  | "recovery_log"
  | "measurement_log";

export type XpEvent = {
  id: string;
  type: XpEventType;
  source: string;
  amount: number;
  at: number;
};

export type XpCandidate = Omit<XpEvent, "at">;

export function getXpRequiredForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 100 * n * (n - 1);
}

export function getLevelFromTotalXp(totalXp: number): number {
  const xp = Math.max(0, totalXp);
  let level = 1;
  while (getXpRequiredForLevel(level + 1) <= xp) level += 1;
  return level;
}

export function getLevelProgress(totalXp: number) {
  const xp = Math.max(0, totalXp);
  const level = getLevelFromTotalXp(xp);
  const floor = getXpRequiredForLevel(level);
  const ceiling = getXpRequiredForLevel(level + 1);
  const into = xp - floor;
  const span = ceiling - floor;
  return {
    level,
    totalXp: xp,
    into,
    span,
    remaining: span - into,
    nextLevel: level + 1,
    percent: span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 0,
  };
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function xpEarnedOnDay(events: XpEvent[], ts: number): number {
  const from = startOfDay(ts);
  const to = from + 86_400_000;
  return events
    .filter((e) => e.at >= from && e.at < to)
    .reduce((total, e) => total + e.amount, 0);
}

/**
 * Appends candidate events, ignoring duplicates (same id) and respecting the
 * daily XP limit. Returns the new ledger plus the amount actually granted.
 */
export function applyXpEvents(
  events: XpEvent[],
  candidates: XpCandidate[],
  now = Date.now(),
): { events: XpEvent[]; gained: number; capped: boolean } {
  const known = new Set(events.map((e) => e.id));
  let dayTotal = xpEarnedOnDay(events, now);
  let gained = 0;
  let capped = false;
  const next = [...events];

  for (const candidate of candidates) {
    if (candidate.amount <= 0) continue;
    if (known.has(candidate.id)) continue;
    const room = XP_RULES.dailyLimit - dayTotal;
    if (room <= 0) {
      capped = true;
      break;
    }
    const amount = Math.min(candidate.amount, room);
    if (amount < candidate.amount) capped = true;
    known.add(candidate.id);
    dayTotal += amount;
    gained += amount;
    next.push({ ...candidate, amount, at: now });
  }

  return { events: next, gained, capped };
}

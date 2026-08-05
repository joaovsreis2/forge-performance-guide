// Authoritative mock personal-record registry.
// A record only exists when a set beats the historical entry for the same
// exercise according to deterministic rules.

export type RecordKind = "maximum_weight" | "maximum_repetitions";

export type ExerciseRecords = {
  /** Heaviest load ever completed, with the reps achieved at that load. */
  maxWeight: number;
  maxWeightReps: number;
  /** Best reps ever completed at a given load (key = load in kg). */
  repsByWeight: Record<string, number>;
  date: string;
};

export type PersonalRecordHit = {
  exerciseId: string;
  exerciseName: string;
  kind: RecordKind;
  weight: number;
  reps: number;
  /** Human readable result, e.g. "60 kg × 10 repetições". */
  result: string;
  /** Human readable previous best, e.g. "60 kg × 9". */
  previous: string;
};

export const personalRecordRegistry: Record<string, ExerciseRecords> = {
  bench: {
    maxWeight: 72.5,
    maxWeightReps: 8,
    repsByWeight: { "65": 10, "67.5": 9, "70": 9, "72.5": 8 },
    date: "12 mar",
  },
  row: {
    maxWeight: 60,
    maxWeightReps: 9,
    repsByWeight: { "55": 11, "57.5": 12, "60": 9 },
    date: "28 fev",
  },
  incline: {
    maxWeight: 24,
    maxWeightReps: 10,
    repsByWeight: { "22.5": 11, "24": 10 },
    date: "05 mar",
  },
  lateral: {
    maxWeight: 12,
    maxWeightReps: 12,
    repsByWeight: { "10": 13, "12": 12 },
    date: "19 mar",
  },
  squat: {
    maxWeight: 100,
    maxWeightReps: 5,
    repsByWeight: { "95": 7, "100": 5 },
    date: "05 mar",
  },
  rdl: {
    maxWeight: 80,
    maxWeightReps: 9,
    repsByWeight: { "77.5": 9, "80": 9 },
    date: "18 mar",
  },
  legpress: {
    maxWeight: 150,
    maxWeightReps: 10,
    repsByWeight: { "140": 10, "150": 10 },
    date: "18 mar",
  },
  legcurl: {
    maxWeight: 47.5,
    maxWeightReps: 12,
    repsByWeight: { "45": 14, "47.5": 12 },
    date: "11 mar",
  },
  ohp: {
    maxWeight: 45,
    maxWeightReps: 6,
    repsByWeight: { "42.5": 7, "45": 6 },
    date: "26 fev",
  },
  pullup: {
    maxWeight: 10,
    maxWeightReps: 6,
    repsByWeight: { "5": 7, "7.5": 7, "10": 6 },
    date: "14 mar",
  },
  dip: {
    maxWeight: 0,
    maxWeightReps: 11,
    repsByWeight: { "0": 11 },
    date: "26 mar",
  },
  curl: {
    maxWeight: 14,
    maxWeightReps: 10,
    repsByWeight: { "12.5": 12, "14": 10 },
    date: "20 mar",
  },
  deadlift: {
    maxWeight: 130,
    maxWeightReps: 4,
    repsByWeight: { "125": 5, "130": 4 },
    date: "19 mar",
  },
  frontsquat: {
    maxWeight: 75,
    maxWeightReps: 6,
    repsByWeight: { "70": 8, "75": 6 },
    date: "12 mar",
  },
  legext: {
    maxWeight: 55,
    maxWeightReps: 12,
    repsByWeight: { "50": 14, "55": 12 },
    date: "06 mar",
  },
  calf: {
    maxWeight: 90,
    maxWeightReps: 15,
    repsByWeight: { "80": 16, "90": 15 },
    date: "20 mar",
  },
};

const emptyRecords = (): ExerciseRecords => ({
  maxWeight: 0,
  maxWeightReps: 0,
  repsByWeight: {},
  date: "—",
});

export function getExerciseRecords(exerciseId: string): ExerciseRecords {
  const found = personalRecordRegistry[exerciseId];
  return found ? { ...found, repsByWeight: { ...found.repsByWeight } } : emptyRecords();
}

export function formatKg(value: number): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

const weightKey = (weight: number) => String(weight);

/** Folds sets already logged in this session into the historical records. */
export function mergeSetIntoRecords(records: ExerciseRecords, weight: number, reps: number) {
  const next: ExerciseRecords = { ...records, repsByWeight: { ...records.repsByWeight } };
  if (weight > next.maxWeight) {
    next.maxWeight = weight;
    next.maxWeightReps = reps;
  } else if (weight === next.maxWeight && reps > next.maxWeightReps) {
    next.maxWeightReps = reps;
  }
  const key = weightKey(weight);
  const best = next.repsByWeight[key];
  if (best === undefined || reps > best) next.repsByWeight[key] = reps;
  return next;
}

/**
 * Deterministic record check. Exceeding the planned repetition range is NOT a
 * record — only beating the stored history is.
 */
export function evaluatePersonalRecord(
  exerciseId: string,
  exerciseName: string,
  weight: number,
  reps: number,
  records: ExerciseRecords,
): PersonalRecordHit | null {
  if (reps <= 0) return null;

  const result = `${formatKg(weight)} kg × ${reps} repetições`;

  if (weight > records.maxWeight) {
    return {
      exerciseId,
      exerciseName,
      kind: "maximum_weight",
      weight,
      reps,
      result,
      previous:
        records.maxWeight > 0
          ? `${formatKg(records.maxWeight)} kg × ${records.maxWeightReps}`
          : "Sem registro anterior",
    };
  }

  const previousReps = records.repsByWeight[weightKey(weight)];
  if (previousReps !== undefined && reps > previousReps) {
    return {
      exerciseId,
      exerciseName,
      kind: "maximum_repetitions",
      weight,
      reps,
      result,
      previous: `${formatKg(weight)} kg × ${previousReps}`,
    };
  }

  return null;
}

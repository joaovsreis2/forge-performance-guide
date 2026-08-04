export type SetSpec = {
  sets: number;
  repLow: number;
  repHigh: number;
  restSeconds: number;
};

export type PlanExercise = SetSpec & {
  id: string;
  name: string;
  note?: string;
  lastResult?: string;
  suggestedWeight: number;
};

export type PlanDay = {
  id: string;
  weekday: string;
  name: string;
  focus: string;
  kind: "training" | "rest";
  estimatedMinutes: number;
  exercises: PlanExercise[];
};

export const PLAN_NAME = "Forge Base — Upper/Lower, 4 days";
export const PLAN_META = "Week 5 of 12 · Progressive overload · Read-only in MVP";

export const planDays: PlanDay[] = [
  {
    id: "d1",
    weekday: "Monday",
    name: "Upper A",
    focus: "Horizontal push & pull",
    kind: "training",
    estimatedMinutes: 52,
    exercises: [
      {
        id: "bench",
        name: "Bench Press",
        sets: 4,
        repLow: 8,
        repHigh: 10,
        restSeconds: 90,
        suggestedWeight: 72.5,
        lastResult: "70 kg × 9",
        note: "Shoulder blades retracted. Elbows about 45°. Stop 1 rep short of failure on the first two sets.",
      },
      {
        id: "row",
        name: "Barbell Row",
        sets: 4,
        repLow: 8,
        repHigh: 12,
        restSeconds: 90,
        suggestedWeight: 60,
        lastResult: "57.5 kg × 10",
        note: "Torso around 30° from horizontal. Pull to the lower ribs, control the descent.",
      },
      {
        id: "incline",
        name: "Incline Dumbbell Press",
        sets: 3,
        repLow: 10,
        repHigh: 12,
        restSeconds: 75,
        suggestedWeight: 24,
        lastResult: "22.5 kg × 11",
        note: "Bench at 30°. Keep wrists stacked over elbows.",
      },
      {
        id: "lateral",
        name: "Lateral Raise",
        sets: 3,
        repLow: 12,
        repHigh: 15,
        restSeconds: 60,
        suggestedWeight: 10,
        lastResult: "10 kg × 13",
        note: "Lead with the elbow. No shrugging at the top.",
      },
    ],
  },
  {
    id: "d2",
    weekday: "Tuesday",
    name: "Lower A",
    focus: "Squat pattern & posterior chain",
    kind: "training",
    estimatedMinutes: 58,
    exercises: [
      {
        id: "squat",
        name: "Back Squat",
        sets: 4,
        repLow: 5,
        repHigh: 8,
        restSeconds: 150,
        suggestedWeight: 100,
        lastResult: "95 kg × 7",
        note: "Brace before unracking. Consistent depth over added load.",
      },
      {
        id: "rdl",
        name: "Romanian Deadlift",
        sets: 3,
        repLow: 8,
        repHigh: 10,
        restSeconds: 120,
        suggestedWeight: 80,
        lastResult: "77.5 kg × 9",
        note: "Hinge until you feel hamstring tension, not lower-back strain.",
      },
      {
        id: "split",
        name: "Bulgarian Split Squat",
        sets: 3,
        repLow: 10,
        repHigh: 12,
        restSeconds: 90,
        suggestedWeight: 20,
        lastResult: "20 kg × 10",
      },
      {
        id: "calf",
        name: "Standing Calf Raise",
        sets: 3,
        repLow: 12,
        repHigh: 15,
        restSeconds: 60,
        suggestedWeight: 45,
        lastResult: "45 kg × 14",
      },
    ],
  },
  {
    id: "d3",
    weekday: "Wednesday",
    name: "Rest",
    focus: "Mobility optional",
    kind: "rest",
    estimatedMinutes: 0,
    exercises: [],
  },
  {
    id: "d4",
    weekday: "Thursday",
    name: "Upper B",
    focus: "Vertical push & pull",
    kind: "training",
    estimatedMinutes: 50,
    exercises: [
      {
        id: "ohp",
        name: "Overhead Press",
        sets: 4,
        repLow: 6,
        repHigh: 8,
        restSeconds: 120,
        suggestedWeight: 45,
        lastResult: "42.5 kg × 7",
        note: "Ribs down, no excessive lean back.",
      },
      {
        id: "pullup",
        name: "Weighted Pull-up",
        sets: 4,
        repLow: 6,
        repHigh: 8,
        restSeconds: 120,
        suggestedWeight: 7.5,
        lastResult: "+5 kg × 7",
      },
      {
        id: "dip",
        name: "Parallel Bar Dip",
        sets: 3,
        repLow: 8,
        repHigh: 12,
        restSeconds: 90,
        suggestedWeight: 0,
        lastResult: "Bodyweight × 11",
      },
      {
        id: "curl",
        name: "Incline Dumbbell Curl",
        sets: 3,
        repLow: 10,
        repHigh: 12,
        restSeconds: 60,
        suggestedWeight: 14,
        lastResult: "12.5 kg × 12",
      },
    ],
  },
  {
    id: "d5",
    weekday: "Friday",
    name: "Lower B",
    focus: "Hinge pattern & unilateral",
    kind: "training",
    estimatedMinutes: 55,
    exercises: [
      {
        id: "dl",
        name: "Deadlift",
        sets: 3,
        repLow: 3,
        repHigh: 5,
        restSeconds: 180,
        suggestedWeight: 130,
        lastResult: "125 kg × 5",
        note: "Reset each rep. Stop the set if bar speed drops noticeably.",
      },
      {
        id: "frontsquat",
        name: "Front Squat",
        sets: 3,
        repLow: 6,
        repHigh: 8,
        restSeconds: 120,
        suggestedWeight: 70,
        lastResult: "67.5 kg × 7",
      },
      {
        id: "legcurl",
        name: "Seated Leg Curl",
        sets: 3,
        repLow: 10,
        repHigh: 12,
        restSeconds: 75,
        suggestedWeight: 40,
        lastResult: "37.5 kg × 12",
      },
    ],
  },
  {
    id: "d6",
    weekday: "Saturday",
    name: "Rest",
    focus: "Walk or easy cardio",
    kind: "rest",
    estimatedMinutes: 0,
    exercises: [],
  },
  {
    id: "d7",
    weekday: "Sunday",
    name: "Rest",
    focus: "Full recovery",
    kind: "rest",
    estimatedMinutes: 0,
    exercises: [],
  },
];

export const todaysWorkout = planDays[0];

export const dimensions = [
  {
    key: "performance",
    label: "Performance",
    score: 68,
    confidence: "Medium confidence",
    trend: "+3 over 4 weeks",
    explanation:
      "Based on logged load and repetitions across your main lifts. Confidence is medium because two sessions were partially logged.",
  },
  {
    key: "consistency",
    label: "Consistency",
    score: 82,
    confidence: "High confidence",
    trend: "Stable",
    explanation:
      "Sessions completed against sessions scheduled over the last 6 weeks. Rest days are not counted against you.",
  },
  {
    key: "recovery",
    label: "Recovery",
    score: 61,
    confidence: "Medium confidence",
    trend: "−4 over 2 weeks",
    explanation:
      "Sleep duration, hydration and reported readiness. Missing entries reduce confidence rather than the score.",
  },
] as const;

export type ExerciseSeries = {
  id: string;
  name: string;
  current: string;
  pr: string;
  points: { date: string; value: number; reps: number }[];
};

export const exerciseSeries: ExerciseSeries[] = [
  {
    id: "bench",
    name: "Bench Press",
    current: "70 kg × 9",
    pr: "72.5 kg × 8 — 12 Mar",
    points: [
      { date: "Jan 06", value: 62.5, reps: 8 },
      { date: "Jan 20", value: 65, reps: 8 },
      { date: "Feb 03", value: 65, reps: 10 },
      { date: "Feb 17", value: 67.5, reps: 9 },
      { date: "Mar 03", value: 70, reps: 8 },
      { date: "Mar 12", value: 72.5, reps: 8 },
      { date: "Mar 24", value: 70, reps: 9 },
    ],
  },
  {
    id: "squat",
    name: "Back Squat",
    current: "95 kg × 7",
    pr: "100 kg × 5 — 05 Mar",
    points: [
      { date: "Jan 07", value: 82.5, reps: 6 },
      { date: "Jan 21", value: 85, reps: 6 },
      { date: "Feb 04", value: 90, reps: 5 },
      { date: "Feb 18", value: 92.5, reps: 6 },
      { date: "Mar 05", value: 100, reps: 5 },
      { date: "Mar 19", value: 95, reps: 7 },
    ],
  },
  {
    id: "dl",
    name: "Deadlift",
    current: "125 kg × 5",
    pr: "130 kg × 4 — 19 Mar",
    points: [
      { date: "Jan 10", value: 110, reps: 5 },
      { date: "Jan 24", value: 115, reps: 5 },
      { date: "Feb 07", value: 117.5, reps: 4 },
      { date: "Feb 21", value: 122.5, reps: 4 },
      { date: "Mar 07", value: 125, reps: 5 },
      { date: "Mar 19", value: 130, reps: 4 },
    ],
  },
  {
    id: "ohp",
    name: "Overhead Press",
    current: "42.5 kg × 7",
    pr: "45 kg × 6 — 26 Feb",
    points: [
      { date: "Jan 09", value: 37.5, reps: 6 },
      { date: "Jan 23", value: 40, reps: 6 },
      { date: "Feb 12", value: 42.5, reps: 6 },
      { date: "Feb 26", value: 45, reps: 6 },
      { date: "Mar 14", value: 42.5, reps: 7 },
    ],
  },
];

export const personalRecords = [
  { exercise: "Deadlift", detail: "130 kg × 4", date: "19 Mar", kind: "Load" },
  { exercise: "Bench Press", detail: "72.5 kg × 8", date: "12 Mar", kind: "Load" },
  { exercise: "Back Squat", detail: "100 kg × 5", date: "05 Mar", kind: "Load" },
  { exercise: "Barbell Row", detail: "57.5 kg × 12", date: "28 Feb", kind: "Repetitions" },
];

export type HistorySession = {
  id: string;
  date: string;
  name: string;
  focus: string;
  duration: string;
  state: "completed" | "cancelled" | "partial";
  sets: string;
  note?: string;
  entries: { exercise: string; result: string }[];
};

export const history: HistorySession[] = [
  {
    id: "h1",
    date: "Thu 26 Mar",
    name: "Upper B",
    focus: "Vertical push & pull",
    duration: "48 min",
    state: "completed",
    sets: "14 of 14 sets",
    entries: [
      { exercise: "Overhead Press", result: "42.5 kg × 7, 7, 6, 6" },
      { exercise: "Weighted Pull-up", result: "+5 kg × 7, 7, 6, 6" },
      { exercise: "Parallel Bar Dip", result: "Bodyweight × 11, 10, 9" },
      { exercise: "Incline Dumbbell Curl", result: "12.5 kg × 12, 11, 10" },
    ],
  },
  {
    id: "h2",
    date: "Tue 24 Mar",
    name: "Upper A",
    focus: "Horizontal push & pull",
    duration: "51 min",
    state: "completed",
    sets: "14 of 14 sets",
    note: "New repetition record on Bench Press.",
    entries: [
      { exercise: "Bench Press", result: "70 kg × 9, 9, 8, 8" },
      { exercise: "Barbell Row", result: "57.5 kg × 10, 10, 9, 9" },
      { exercise: "Incline Dumbbell Press", result: "22.5 kg × 11, 10, 10" },
      { exercise: "Lateral Raise", result: "10 kg × 13, 12, 12" },
    ],
  },
  {
    id: "h3",
    date: "Fri 20 Mar",
    name: "Lower B",
    focus: "Hinge pattern",
    duration: "22 min",
    state: "cancelled",
    sets: "3 of 9 sets",
    note: "Cancelled after the first exercise. Completed sets were preserved.",
    entries: [{ exercise: "Deadlift", result: "125 kg × 5, 5, 4" }],
  },
  {
    id: "h4",
    date: "Wed 18 Mar",
    name: "Lower A",
    focus: "Squat pattern",
    duration: "56 min",
    state: "completed",
    sets: "13 of 13 sets",
    entries: [
      { exercise: "Back Squat", result: "95 kg × 7, 7, 6, 6" },
      { exercise: "Romanian Deadlift", result: "77.5 kg × 9, 9, 8" },
      { exercise: "Bulgarian Split Squat", result: "20 kg × 10, 10, 9" },
      { exercise: "Standing Calf Raise", result: "45 kg × 14, 13, 12" },
    ],
  },
  {
    id: "h5",
    date: "Mon 16 Mar",
    name: "Upper A",
    focus: "Horizontal push & pull",
    duration: "49 min",
    state: "partial",
    sets: "11 of 14 sets",
    note: "Session was ended early. Logged work is unchanged.",
    entries: [
      { exercise: "Bench Press", result: "67.5 kg × 9, 9, 8, 8" },
      { exercise: "Barbell Row", result: "55 kg × 11, 10, 10, 9" },
      { exercise: "Incline Dumbbell Press", result: "22.5 kg × 10, 10, 9" },
    ],
  },
];

export const xpLedger = [
  { label: "Workout completed", detail: "Upper A · 26 Mar", xp: 100 },
  { label: "8 valid sets", detail: "2 XP per logged set", xp: 16 },
  { label: "New repetition record", detail: "Bench Press 70 kg × 9", xp: 25 },
  { label: "Recovery recorded", detail: "Sleep and hydration", xp: 5 },
];

export const achievements = [
  { name: "Twelve weeks logged", detail: "Earned 18 Mar", earned: true },
  { name: "Fifty sessions", detail: "Earned 02 Mar", earned: true },
  { name: "Consistent month", detail: "16 of 16 sessions", earned: true },
  { name: "Full training block", detail: "3 of 12 weeks remaining", earned: false },
];

export const measurements = [
  { date: "26 Mar", weight: 78.4, chest: 102, waist: 82.5, arm: 35.4 },
  { date: "19 Mar", weight: 78.1, chest: 101.5, waist: 82.5, arm: 35.2 },
  { date: "12 Mar", weight: 77.8, chest: 101, waist: 83, arm: 35 },
  { date: "05 Mar", weight: 77.9, chest: 101, waist: 83, arm: 35 },
  { date: "26 Feb", weight: 77.2, chest: 100.5, waist: 83.5, arm: 34.7 },
];

export const consistencyWeeks = [
  { week: "W1", done: 4, planned: 4 },
  { week: "W2", done: 4, planned: 4 },
  { week: "W3", done: 3, planned: 4 },
  { week: "W4", done: 4, planned: 4 },
  { week: "W5", done: 2, planned: 4 },
];

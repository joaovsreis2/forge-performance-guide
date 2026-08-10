const API_BASE = import.meta.env["VITE_API_URL"] ?? "http://127.0.0.1:8000/api";

type ApiError = { detail?: string };

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function isNetworkRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && error.status === null;
}

let csrfToken: string | null = null;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (method !== "GET" && method !== "HEAD") {
    if (!csrfToken) csrfToken = (await request<{ csrfToken: string }>("/csrf/")).csrfToken;
    headers.set("X-CSRFToken", csrfToken);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiRequestError("Sem conexão com o Forge.", null);
  }
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    throw new ApiRequestError(body.detail ?? `Erro ${response.status}`, response.status);
  }
  return body;
}

async function refreshSessionCsrf<T>(operation: Promise<T>): Promise<T> {
  const result = await operation;
  csrfToken = null;
  return result;
}

export const forgeApi = {
  me: () => request<UserData>("/me/"),
  account: () => request<AccountData>("/account/"),
  updateAccount: (payload: Partial<AccountData>) =>
    request<AccountData>("/account/", { method: "POST", body: JSON.stringify(payload) }),
  completeOnboarding: (payload: OnboardingData) =>
    request<UserData>("/onboarding/", { method: "POST", body: JSON.stringify(payload) }),
  plan: () => request<PlanData>("/plan/"),
  progress: () => request<ProgressData>("/progress/"),
  recovery: () => request<RecoveryData>("/recovery/"),
  saveRecovery: (payload: SaveRecoveryData) =>
    request<RecoveryData>("/recovery/", { method: "POST", body: JSON.stringify(payload) }),
  measurements: () => request<MeasurementData[]>("/measurements/"),
  saveMeasurement: (payload: SaveMeasurementData) =>
    request<MeasurementData>("/measurements/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (email: string, password: string) =>
    refreshSessionCsrf(
      request<UserData>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    ),
  register: (payload: RegistrationData) =>
    refreshSessionCsrf(
      request<UserData>("/auth/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    ),
  recoverPassword: (email: string) =>
    request<{ ok: boolean; debugResetUrl?: string }>("/auth/password/recover/", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (uid: string, token: string, password: string, passwordConfirmation: string) =>
    request<{ ok: boolean }>(`/auth/password/reset/${uid}/${token}/`, {
      method: "POST",
      body: JSON.stringify({ password, passwordConfirmation }),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout/", { method: "POST" }),
  changePassword: (payload: PasswordChangeData) =>
    refreshSessionCsrf(
      request<{ ok: boolean }>("/account/password/", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    ),
  deleteAccount: (password: string) =>
    request<{ ok: boolean }>("/account/delete/", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  startWorkout: (workoutId: string) =>
    request<RemoteSession>(`/workouts/${workoutId}/start/`, { method: "POST", body: "{}" }),
  session: (sessionId: string) => request<RemoteSession>(`/sessions/${sessionId}/`),
  recordSet: (sessionId: string, payload: Record<string, unknown>) =>
    request<RemoteSession>(`/sessions/${sessionId}/sets/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  skipSet: (sessionId: string, payload: Record<string, unknown> = {}) =>
    request<RemoteSession>(`/sessions/${sessionId}/skip-set/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  skipExercise: (sessionId: string, payload: Record<string, unknown> = {}) =>
    request<RemoteSession>(`/sessions/${sessionId}/skip-exercise/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  pauseSession: (sessionId: string) =>
    request<RemoteSession>(`/sessions/${sessionId}/pause/`, { method: "POST", body: "{}" }),
  resumeSession: (sessionId: string) =>
    request<RemoteSession>(`/sessions/${sessionId}/resume/`, { method: "POST", body: "{}" }),
  completeSession: (sessionId: string) =>
    request<RemoteSession>(`/sessions/${sessionId}/complete/`, { method: "POST", body: "{}" }),
  cancelSession: (sessionId: string) =>
    request<RemoteSession>(`/sessions/${sessionId}/cancel/`, { method: "POST", body: "{}" }),
};

export type UserData = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  goal: string | null;
  onboardingCompleted: boolean;
};

export type AccountData = UserData & {
  trainingGoal: string;
  birthDate: string | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  timezone: string;
  weightUnit: "kg" | "lb";
  distanceUnit: "m" | "km" | "mi";
  appearance: "system" | "light" | "dark";
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export type RecoveryData = {
  date: string;
  sleepMinutes: number | null;
  hydrationMl: number | null;
  movementCompleted: boolean;
  notes: string;
  habits: { id: string; name: string; completed: boolean }[];
};

export type SaveRecoveryData = {
  sleepMinutes: number;
  hydrationMl: number;
  movementCompleted: boolean;
  completedHabitIds: string[];
  notes?: string;
};

export type MeasurementData = {
  id: string;
  date: string;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  notes: string;
};

export type SaveMeasurementData = Omit<MeasurementData, "id" | "date">;

export type OnboardingData = {
  name: string;
  trainingGoal: string;
  heightCm: number;
  currentWeightKg: number;
  timezone: string;
};

export type RegistrationData = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  acceptedTerms: boolean;
};

export type PasswordChangeData = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

export type RemoteWorkout = {
  id: string;
  weekday: string | null;
  name: string;
  focus: string;
  kind: "training" | "rest";
  estimatedMinutes: number;
  exercises: {
    id: string;
    name: string;
    sets: number;
    repLow: number | null;
    repHigh: number | null;
    restSeconds: number;
    suggestedWeight: number;
    note: string;
  }[];
};

export type PlanData = {
  id: string | null;
  name: string | null;
  description: string | null;
  todayWorkoutId: string | null;
  days: RemoteWorkout[];
  openSession: RemoteSession | null;
};

export type RemoteSession = {
  id: string;
  status: "active" | "paused" | "completed" | "cancelled";
  name: string;
  startedAt: string;
  durationSeconds: number | null;
  activeExerciseId: string | null;
  nextSetNumber: number;
  exercises: (RemoteWorkout["exercises"][number] & {
    status: string;
    completedSets: number;
  })[];
  logs: {
    id: string;
    exerciseId: string;
    setIndex: number;
    weight: number;
    reps: number;
    skipped: boolean;
    at: string;
  }[];
};

export type ProgressData = {
  progression: {
    level: number;
    totalExperience: number;
    performance: number;
    consistency: number;
    recovery: number;
  } | null;
  sessions: {
    id: string;
    name: string;
    status: string;
    date: string;
    durationSeconds: number | null;
  }[];
  records: { exercise: string; type: string; value: number; date: string }[];
  experienceEvents: { reason: string; amount: number; date: string }[];
  achievements: { name: string; description: string; earnedAt: string }[];
  exerciseSeries: {
    id: string;
    name: string;
    points: { date: string; weightKg: number; repetitions: number }[];
  }[];
};

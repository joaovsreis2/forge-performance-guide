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

export const PLAN_NAME = "Forge Strength Foundation";
export const PLAN_META = "Semana 5 de 12 · Sobrecarga progressiva · Somente leitura no MVP";

export const planDays: PlanDay[] = [
  {
    id: "d1",
    weekday: "Segunda-feira",
    name: "Upper Body A",
    focus: "Empurrar e puxar horizontal",
    kind: "training",
    estimatedMinutes: 52,
    exercises: [
      {
        id: "bench",
        name: "Supino reto",
        sets: 4,
        repLow: 8,
        repHigh: 10,
        restSeconds: 90,
        suggestedWeight: 72.5,
        lastResult: "70 kg × 9",
        note: "Escápulas retraídas. Cotovelos perto de 45°. Pare 1 repetição antes da falha nas duas primeiras séries.",
      },
      {
        id: "row",
        name: "Remada baixa",
        sets: 4,
        repLow: 8,
        repHigh: 12,
        restSeconds: 90,
        suggestedWeight: 60,
        lastResult: "57.5 kg × 10",
        note: "Tronco firme e levemente inclinado. Puxe até a parte baixa das costelas e controle a descida.",
      },
      {
        id: "incline",
        name: "Supino inclinado com halteres",
        sets: 3,
        repLow: 10,
        repHigh: 12,
        restSeconds: 75,
        suggestedWeight: 24,
        lastResult: "22.5 kg × 11",
        note: "Banco a 30°. Mantenha os punhos alinhados sobre os cotovelos.",
      },
      {
        id: "lateral",
        name: "Elevação lateral",
        sets: 3,
        repLow: 12,
        repHigh: 15,
        restSeconds: 60,
        suggestedWeight: 10,
        lastResult: "10 kg × 13",
        note: "Conduza o movimento pelo cotovelo. Não eleve os ombros no topo.",
      },
    ],
  },
  {
    id: "d2",
    weekday: "Terça-feira",
    name: "Lower Body A",
    focus: "Agachamento e cadeia posterior",
    kind: "training",
    estimatedMinutes: 58,
    exercises: [
      {
        id: "squat",
        name: "Agachamento livre",
        sets: 4,
        repLow: 5,
        repHigh: 8,
        restSeconds: 150,
        suggestedWeight: 100,
        lastResult: "95 kg × 7",
        note: "Trave o tronco antes de tirar a barra do suporte. Priorize profundidade consistente antes de aumentar carga.",
      },
      {
        id: "rdl",
        name: "Levantamento terra romeno",
        sets: 3,
        repLow: 8,
        repHigh: 10,
        restSeconds: 120,
        suggestedWeight: 80,
        lastResult: "77.5 kg × 9",
        note: "Faça a dobradiça até sentir tensão nos posteriores, sem sobrecarregar a lombar.",
      },
      {
        id: "legpress",
        name: "Leg press",
        sets: 3,
        repLow: 10,
        repHigh: 12,
        restSeconds: 90,
        suggestedWeight: 20,
        lastResult: "20 kg × 10",
      },
      {
        id: "legcurl",
        name: "Mesa flexora",
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
    weekday: "Quarta-feira",
    name: "Descanso",
    focus: "Mobilidade opcional",
    kind: "rest",
    estimatedMinutes: 0,
    exercises: [],
  },
  {
    id: "d4",
    weekday: "Quinta-feira",
    name: "Upper Body B",
    focus: "Empurrar e puxar vertical",
    kind: "training",
    estimatedMinutes: 50,
    exercises: [
      {
        id: "ohp",
        name: "Desenvolvimento militar",
        sets: 4,
        repLow: 6,
        repHigh: 8,
        restSeconds: 120,
        suggestedWeight: 45,
        lastResult: "42.5 kg × 7",
        note: "Costelas baixas, sem inclinar demais o tronco para trás.",
      },
      {
        id: "pullup",
        name: "Puxada alta",
        sets: 4,
        repLow: 6,
        repHigh: 8,
        restSeconds: 120,
        suggestedWeight: 7.5,
        lastResult: "+5 kg × 7",
      },
      {
        id: "dip",
        name: "Paralelas",
        sets: 3,
        repLow: 8,
        repHigh: 12,
        restSeconds: 90,
        suggestedWeight: 0,
        lastResult: "Peso corporal × 11",
      },
      {
        id: "curl",
        name: "Rosca inclinada com halteres",
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
    weekday: "Sexta-feira",
    name: "Descanso",
    focus: "Recuperação completa",
    kind: "rest",
    estimatedMinutes: 0,
    exercises: [],
  },
  {
    id: "d6",
    weekday: "Sábado",
    name: "Lower Body B",
    focus: "Dobradiça de quadril e agachamento frontal",
    kind: "training",
    estimatedMinutes: 55,
    exercises: [
      {
        id: "dl",
        name: "Levantamento terra",
        sets: 3,
        repLow: 3,
        repHigh: 5,
        restSeconds: 180,
        suggestedWeight: 130,
        lastResult: "125 kg × 5",
        note: "Reposicione a cada repetição. Encerre a série se a velocidade da barra cair de forma clara.",
      },
      {
        id: "frontsquat",
        name: "Agachamento frontal",
        sets: 3,
        repLow: 6,
        repHigh: 8,
        restSeconds: 120,
        suggestedWeight: 70,
        lastResult: "67.5 kg × 7",
      },
      {
        id: "legextension",
        name: "Cadeira extensora",
        sets: 3,
        repLow: 10,
        repHigh: 12,
        restSeconds: 75,
        suggestedWeight: 40,
        lastResult: "37.5 kg × 12",
      },
      {
        id: "calf",
        name: "Panturrilha em pé",
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
    id: "d7",
    weekday: "Domingo",
    name: "Descanso",
    focus: "Recuperação completa",
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
    confidence: "Confiança média",
    trend: "+3 em 4 semanas",
    explanation:
      "Com base em cargas e repetições registradas nos principais levantamentos. A confiança é média porque duas sessões foram registradas parcialmente.",
  },
  {
    key: "consistency",
    label: "Consistência",
    score: 82,
    confidence: "Confiança alta",
    trend: "Estável",
    explanation:
      "Sessões concluídas em relação às sessões programadas nas últimas 6 semanas. Dias de descanso não contam contra você.",
  },
  {
    key: "recovery",
    label: "Recuperação",
    score: 61,
    confidence: "Confiança média",
    trend: "-4 em 2 semanas",
    explanation:
      "Duração do sono, hidratação e prontidão informada. Registros ausentes reduzem a confiança, não necessariamente a pontuação.",
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
    name: "Supino reto",
    current: "70 kg × 9",
    pr: "72.5 kg × 8 — 12 Mar",
    points: [
      { date: "06 jan", value: 62.5, reps: 8 },
      { date: "20 jan", value: 65, reps: 8 },
      { date: "03 fev", value: 65, reps: 10 },
      { date: "17 fev", value: 67.5, reps: 9 },
      { date: "03 mar", value: 70, reps: 8 },
      { date: "12 mar", value: 72.5, reps: 8 },
      { date: "24 mar", value: 70, reps: 9 },
    ],
  },
  {
    id: "squat",
    name: "Agachamento livre",
    current: "95 kg × 7",
    pr: "100 kg × 5 — 05 Mar",
    points: [
      { date: "07 jan", value: 82.5, reps: 6 },
      { date: "21 jan", value: 85, reps: 6 },
      { date: "04 fev", value: 90, reps: 5 },
      { date: "18 fev", value: 92.5, reps: 6 },
      { date: "05 mar", value: 100, reps: 5 },
      { date: "19 mar", value: 95, reps: 7 },
    ],
  },
  {
    id: "dl",
    name: "Levantamento terra",
    current: "125 kg × 5",
    pr: "130 kg × 4 — 19 Mar",
    points: [
      { date: "10 jan", value: 110, reps: 5 },
      { date: "24 jan", value: 115, reps: 5 },
      { date: "07 fev", value: 117.5, reps: 4 },
      { date: "21 fev", value: 122.5, reps: 4 },
      { date: "07 mar", value: 125, reps: 5 },
      { date: "19 mar", value: 130, reps: 4 },
    ],
  },
  {
    id: "ohp",
    name: "Desenvolvimento militar",
    current: "42.5 kg × 7",
    pr: "45 kg × 6 — 26 Feb",
    points: [
      { date: "09 jan", value: 37.5, reps: 6 },
      { date: "23 jan", value: 40, reps: 6 },
      { date: "12 fev", value: 42.5, reps: 6 },
      { date: "26 fev", value: 45, reps: 6 },
      { date: "14 mar", value: 42.5, reps: 7 },
    ],
  },
];

export const personalRecords = [
  { exercise: "Levantamento terra", detail: "130 kg × 4", date: "19 mar", kind: "Carga" },
  { exercise: "Supino reto", detail: "72,5 kg × 8", date: "12 mar", kind: "Carga" },
  { exercise: "Agachamento livre", detail: "100 kg × 5", date: "05 mar", kind: "Carga" },
  { exercise: "Remada baixa", detail: "57,5 kg × 12", date: "28 fev", kind: "Repetições" },
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
    date: "qui., 26 mar",
    name: "Upper Body B",
    focus: "Empurrar e puxar vertical",
    duration: "48 min",
    state: "completed",
    sets: "14 de 14 séries",
    entries: [
      { exercise: "Desenvolvimento militar", result: "42,5 kg × 7, 7, 6, 6" },
      { exercise: "Puxada alta", result: "65 kg × 7, 7, 6, 6" },
      { exercise: "Paralelas", result: "Peso corporal × 11, 10, 9" },
      { exercise: "Rosca inclinada com halteres", result: "12,5 kg × 12, 11, 10" },
    ],
  },
  {
    id: "h2",
    date: "ter., 24 mar",
    name: "Upper Body A",
    focus: "Empurrar e puxar horizontal",
    duration: "51 min",
    state: "completed",
    sets: "14 de 14 séries",
    note: "Novo recorde de repetições no Supino reto.",
    entries: [
      { exercise: "Supino reto", result: "70 kg × 9, 9, 8, 8" },
      { exercise: "Remada baixa", result: "57,5 kg × 10, 10, 9, 9" },
      { exercise: "Supino inclinado com halteres", result: "22,5 kg × 11, 10, 10" },
      { exercise: "Elevação lateral", result: "10 kg × 13, 12, 12" },
    ],
  },
  {
    id: "h3",
    date: "sex., 20 mar",
    name: "Lower Body B",
    focus: "Dobradiça de quadril",
    duration: "22 min",
    state: "cancelled",
    sets: "3 de 12 séries",
    note: "Cancelado após o primeiro exercício. As séries concluídas foram preservadas.",
    entries: [{ exercise: "Levantamento terra", result: "125 kg × 5, 5, 4" }],
  },
  {
    id: "h4",
    date: "qua., 18 mar",
    name: "Lower Body A",
    focus: "Agachamento",
    duration: "56 min",
    state: "completed",
    sets: "13 de 13 séries",
    entries: [
      { exercise: "Agachamento livre", result: "95 kg × 7, 7, 6, 6" },
      { exercise: "Levantamento terra romeno", result: "77,5 kg × 9, 9, 8" },
      { exercise: "Leg press", result: "140 kg × 10, 10, 9" },
      { exercise: "Mesa flexora", result: "45 kg × 14, 13, 12" },
    ],
  },
  {
    id: "h5",
    date: "seg., 16 mar",
    name: "Upper Body A",
    focus: "Empurrar e puxar horizontal",
    duration: "49 min",
    state: "partial",
    sets: "11 de 14 séries",
    note: "A sessão foi encerrada mais cedo. O trabalho registrado permanece inalterado.",
    entries: [
      { exercise: "Supino reto", result: "67,5 kg × 9, 9, 8, 8" },
      { exercise: "Remada baixa", result: "55 kg × 11, 10, 10, 9" },
      { exercise: "Supino inclinado com halteres", result: "22,5 kg × 10, 10, 9" },
    ],
  },
];

export const xpLedger = [
  { label: "Treino concluído", detail: "Upper Body A · 26 mar", xp: 100 },
  { label: "8 séries válidas", detail: "2 XP por série registrada", xp: 16 },
  { label: "Novo recorde de repetições", detail: "Supino reto 70 kg × 9", xp: 25 },
  { label: "Recuperação registrada", detail: "Sono e hidratação", xp: 5 },
];

export const achievements = [
  { name: "Doze semanas registradas", detail: "Conquistado em 18 mar", earned: true },
  { name: "Cinquenta sessões", detail: "Conquistado em 02 mar", earned: true },
  { name: "Mês consistente", detail: "16 de 16 sessões", earned: true },
  { name: "Bloco completo de treino", detail: "Faltam 3 de 12 semanas", earned: false },
];

export const measurements = [
  { date: "26 mar", weight: 78.4, chest: 102, waist: 82.5, arm: 35.4 },
  { date: "19 mar", weight: 78.1, chest: 101.5, waist: 82.5, arm: 35.2 },
  { date: "12 mar", weight: 77.8, chest: 101, waist: 83, arm: 35 },
  { date: "05 mar", weight: 77.9, chest: 101, waist: 83, arm: 35 },
  { date: "26 fev", weight: 77.2, chest: 100.5, waist: 83.5, arm: 34.7 },
];

export const consistencyWeeks = [
  { week: "W1", done: 4, planned: 4 },
  { week: "W2", done: 4, planned: 4 },
  { week: "W3", done: 3, planned: 4 },
  { week: "W4", done: 4, planned: 4 },
  { week: "W5", done: 2, planned: 4 },
];

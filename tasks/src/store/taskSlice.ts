import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export const STORAGE_KEY = "teams_tasks";

export type TaskStatus = "todo" | "doing" | "done" | "blocked";
export type TaskPriority = "Alta" | "Media" | "Baixa" | "";
export type TaskFilter = TaskStatus | "all" | "prio-media" | "prio-alta";
export type TaskSort = "date" | "prio" | "who" | "status";

export interface Task {
  id: number | string;
  status: TaskStatus;
  who: string;
  day: string;
  task: string;
  note: string;
  prio: TaskPriority;
}

export type NewTask = Omit<Task, "id">;

interface TaskState {
  activeUserId: string | null;
  items: Task[];
  filter: TaskFilter;
  search: string;
  sort: TaskSort;
}

type Counts = Record<"all" | TaskStatus | "alta" | "media", number>;

export const STATUS = {
  todo: { label: "Por fazer", badge: "b-todo", dot: "d-todo" },
  doing: { label: "Em progresso", badge: "b-doing", dot: "d-doing" },
  done: { label: "Concluida", badge: "b-done", dot: "d-done" },
  blocked: { label: "Bloqueada", badge: "b-blocked", dot: "d-blocked" },
} satisfies Record<TaskStatus, { label: string; badge: string; dot: string }>;

export const FILTER_TITLES = {
  all: "Todas as tarefas",
  todo: "Por fazer",
  doing: "Em progresso",
  blocked: "Bloqueadas",
  done: "Concluidas",
  "prio-alta": "Prioridade alta",
  "prio-media": "Prioridade media",
} satisfies Record<TaskFilter, string>;

export const PRIO_ORDER = {
  Alta: 0,
  Media: 1,
  Baixa: 2,
  "": 3,
} satisfies Record<TaskPriority, number>;

const seedTasks: Task[] = [
  {
    id: 1,
    status: "todo",
    who: "a",
    task: "do something",
    note: "",
    prio: "Alta",
    day: "2026-01-01",
  },
];

const userStorageKey = (userId: string) => `${STORAGE_KEY}:${userId}`;

const isTask = (task: unknown): task is Task => {
  if (!task || typeof task != "object") return false;
  const candidate = task as Partial<Task>;
  return (
    typeof candidate.task === "string" && typeof candidate.status === "string"
  );
};

export const loadTasksForUser = (userId: string): Task[] => {
  try {
    const stored = localStorage.getItem(userStorageKey(userId));
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) && parsed.every(isTask) && parsed.length
      ? parsed
      : seedTasks;
  } catch {
    return seedTasks;
  }
};

export const saveTasksForUser = (userId: string, tasks: Task[]) => {
  if (!userId) return;

  localStorage.setItem(userStorageKey(userId), JSON.stringify(tasks));
};

const initialState: TaskState = {
  activeUserId: null,
  items: [],
  filter: "all",
  search: "",
  sort: "date",
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    loadUserTasks(
      state,
      action: PayloadAction<{ userId: string; tasks: Task[] }>
    ) {
      (state.activeUserId = action.payload.userId),
        (state.items = action.payload.tasks),
        (state.filter = "all"),
        (state.search = ""),
        (state.sort = "date");
    },
    addTask: {
      reducer(state, action: PayloadAction<Task>) {
        state.items.push(action.payload);
      },
      prepare(task: NewTask) {
        return {
          payload: {
            id: nanoid(),
            status: task.status || "todo",
            task: task.task.trim(),
            who: task.who?.trim() || "",
            day: task.day || "",
            prio: (task.prio || "") as TaskPriority,
            note: task.note?.trim(),
          },
        };
      },
    },
    updateTask(state, action: PayloadAction<Task>) {
      const index = state.items.findIndex(
        (task) => task.id === action.payload.id
      );
      if (index >= 0) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          task: action.payload.task.trim(),
          who: action.payload.who?.trim(),
          note: action.payload.note?.trim(),
        };
      }
    },
    deleteTask(state, action: PayloadAction<Task["id"]>) {
      state.items = state.items.filter((task) => task.id != action.payload);
    },
    toggleDone(state, action: PayloadAction<Task["id"]>) {
      const task = state.items.find((task) => (task.id = action.payload));
      if (task) {
        task.status = task.status === "done" ? "todo" : "done";
      }
    },
    setFilter(state, action: PayloadAction<TaskFilter>) {
      state.filter = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setSort(state, action: PayloadAction<TaskSort>) {
      state.sort = action.payload;
    },
  },
});

export const {
  addTask,
  deleteTask,
  loadUserTasks,
  setFilter,
  setSearch,
  setSort,
  toggleDone,
  updateTask,
} = taskSlice.actions;

export const selectCounts = (state: RootState): Counts =>
  state.task.items.reduce(
    (counts: Counts, task) => {
      counts.all += 1;

      // Increment status count dynamically
      if (counts.hasOwnProperty(task.status)) {
        counts[task.status] += 1;
      }

      // Priority checks
      if (task.prio === "Alta") counts.alta += 1;
      if (task.prio === "Media") counts.media += 1;

      // CRITICAL: You must return the accumulator
      return counts;
    },
    { all: 0, todo: 0, doing: 0, done: 0, blocked: 0, alta: 0, media: 0 }
  );

export const selectVisibleTasks = (state: RootState): Task[] => {
  const { filter, items, search, sort } = state.task;

  const q = search.trim().toLowerCase();
  let visible = items;

  if (filter === "prio-alta") visible.filter((task) => task.prio === "Alta");
  else if (filter === "prio-media")
    visible.filter((task) => task.prio === "Media");
  else if (filter !== "all") visible.filter((task) => task.status === filter);

  if (q) {
    visible = visible.filter((task) => {
      `${task.task}${task.who}${task.note}`.toLowerCase().includes(q);
    });
  }

  return [...visible].sort((a, b) => {
    if (sort === "date") return (a.day || "9999") < (b.day || "9999") ? -1 : 1;
    if (sort === "prio")
      return PRIO_ORDER[a.prio || ""] - PRIO_ORDER[b.prio || ""];
    if (sort === "who") return (a.who || "").localeCompare(b.who || "");
    if (sort === "status")
      return (a.status || "").localeCompare(b.status || "");
    return 0;
  });
};

export default taskSlice.reducer;

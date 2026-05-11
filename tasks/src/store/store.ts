import { configureStore } from "@reduxjs/toolkit";
import taskReducer, { saveTasksForUser } from "./taskSlice";

export const store = configureStore({
  reducer: {
    task: taskReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

let lastPersistedKey: string | undefined;
let lastPersistedValue: string | undefined;

store.subscribe(() => {
  const { activeUserId, items } = store.getState().task;

  if (!activeUserId) return;

  const serialized = JSON.stringify(items);
  if (activeUserId === lastPersistedKey && serialized === lastPersistedValue)
    return;

  saveTasksForUser(activeUserId, items);
  lastPersistedKey = activeUserId;
  lastPersistedValue = serialized;
});

import { useState, useCallback, useEffect } from "react";
import type { Task, TaskFormData, FilterStatus, FilterPriority } from "@/types/task";

const STORAGE_KEY = "task-manager-tasks";

function generateId(): string {
  return crypto.randomUUID();
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

const priorityOrder = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const activeTasks = tasks.filter((t) => !t.deletedAt);
  const trashedTasks = tasks.filter((t) => !!t.deletedAt);

  const filteredTasks = sortTasks(
    activeTasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      return true;
    })
  );

  const pendingCount = activeTasks.filter((t) => t.status === "pending").length;
  const completedCount = activeTasks.filter((t) => t.status === "completed").length;

  const addTask = useCallback((data: TaskFormData) => {
    const now = new Date().toISOString();
    const task: Task = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    setTasks((prev) => [...prev, task]);
  }, []);

  const updateTask = useCallback((id: string, data: Partial<TaskFormData>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      )
    );
  }, []);

  const softDelete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t
      )
    );
  }, []);

  const restore = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, deletedAt: null } : t))
    );
  }, []);

  const permanentDelete = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "pending" ? "completed" : "pending",
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  return {
    tasks: filteredTasks,
    trashedTasks,
    pendingCount,
    completedCount,
    filterStatus,
    filterPriority,
    setFilterStatus,
    setFilterPriority,
    addTask,
    updateTask,
    softDelete,
    restore,
    permanentDelete,
    toggleStatus,
  };
}

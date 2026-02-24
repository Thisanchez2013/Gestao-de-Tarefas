export type Priority = "high" | "medium" | "low";
export type Status = "pending" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  status: Status;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type TaskFormData = Omit<Task, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type FilterStatus = "all" | Status;
export type FilterPriority = "all" | Priority;

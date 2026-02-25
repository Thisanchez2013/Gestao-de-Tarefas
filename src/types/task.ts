export type Priority = "high" | "medium" | "low";
export type Status = "pending" | "completed";

// src/types/task.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;    // Verifique se tem o underline _
  created_at: string;  // Verifique se tem o underline _
  updated_at: string;
  deleted_at: string | null;
}

export type TaskFormData = Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>;

export type FilterStatus = "all" | Status;
export type FilterPriority = "all" | Priority;

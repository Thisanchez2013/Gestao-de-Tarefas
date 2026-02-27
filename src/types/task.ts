// src/types/task.ts
import { Supplier } from "./supplier";

export type Priority = "high" | "medium" | "low";
export type Status = "pending" | "completed";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  due_date: string;
  supplier_id?: string;
  estimated_hours?: number;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type TaskFormData = Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'supplier_id' | 'estimated_hours' | 'tags' | 'notes'>;

export type FilterStatus = "all" | Status;
export type FilterPriority = "all" | Priority;

export interface TaskWithSupplier extends Task {
  supplier?: Supplier;
}
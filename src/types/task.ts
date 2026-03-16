// src/types/task.ts
import { Supplier } from "./supplier";

export type Priority = "high" | "medium" | "low";
export type Status = "pending" | "completed";

/**
 * schedule_type define o modo de agendamento da tarefa:
 *  - "date"     → apenas data (sem horário definido); aparece como tarefa do dia no calendário
 *  - "datetime" → data + intervalo de horário; aparece na timeline ocupando o bloco correto
 */
export type ScheduleType = "date" | "datetime";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  due_date: string;
  /** Modo de agendamento: "date" (só data) ou "datetime" (data + intervalo). Default: "date" */
  schedule_type?: ScheduleType;
  /** Horário de início no formato "HH:MM" — usado apenas quando schedule_type === "datetime" */
  scheduled_start?: string | null;
  /** Horário de fim no formato "HH:MM" — usado apenas quando schedule_type === "datetime" */
  scheduled_end?: string | null;
  supplier_id?: string;
  estimated_hours?: number;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Campos de timer
  total_tracked_seconds?: number;
  timer_running?: boolean;
  timer_started_at?: string | null;
}

export type TaskFormData = Pick<
  Task,
  | "title"
  | "description"
  | "priority"
  | "due_date"
  | "schedule_type"
  | "scheduled_start"
  | "scheduled_end"
  | "supplier_id"
  | "estimated_hours"
  | "tags"
  | "notes"
>;

export type FilterStatus = "all" | Status;
export type FilterPriority = "all" | Priority;

export interface TaskWithSupplier extends Task {
  supplier?: Supplier;
}

// Sessão de tempo individual
export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note?: string;
}
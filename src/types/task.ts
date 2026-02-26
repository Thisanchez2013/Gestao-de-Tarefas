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
  due_date: string;    // ISO string
  supplier_id?: string; // FK para a entidade Supplier
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * TaskFormData define os dados necessários para criar ou editar uma tarefa.
 * Omitimos campos gerados automaticamente pelo sistema (id, datas de controle).
 */
export type TaskFormData = Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'supplier_id'>;

export type FilterStatus = "all" | Status;
export type FilterPriority = "all" | Priority;

/**
 * Interface auxiliar para quando buscamos a tarefa populada com os dados do fornecedor
 */
export interface TaskWithSupplier extends Task {
  supplier?: Supplier;
}
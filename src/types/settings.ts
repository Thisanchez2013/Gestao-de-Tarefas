// src/types/settings.ts

// ─── Configuração de um campo individual ──────────────────────
export interface FieldConfig {
  key: string;         // identificador interno do campo
  label: string;       // label exibido na UI
  visible: boolean;    // aparece no formulário?
  required: boolean;   // é obrigatório?
  order: number;       // posição de exibição
  locked?: boolean;    // campos que nunca podem ser ocultados/removidos
}

// ─── Módulos configuráveis ────────────────────────────────────
export type SettingsModule = "tasks" | "suppliers" | "interface" | "system";

export interface TaskFieldSettings {
  description: FieldConfig;
  priority: FieldConfig;
  due_date: FieldConfig;
  estimated_hours: FieldConfig;
  supplier_id: FieldConfig;
  tags: FieldConfig;
  notes: FieldConfig;
}

export interface SupplierFieldSettings {
  category: FieldConfig;
  phone: FieldConfig;
  location_name: FieldConfig;
  email: FieldConfig;
  notes: FieldConfig;
}

export interface InterfaceSettings {
  showDashboard: boolean;
  showSearchBar: boolean;
  showFilterBar: boolean;
  compactCards: boolean;
  animationsEnabled: boolean;
}

export type TaskTimeMode = "simple" | "session_based";

export interface SystemSettings {
  confirmBeforeDelete: boolean;
  autoCloseModalOnComplete: boolean;
  defaultPriority: "high" | "medium" | "low";
  defaultTab: "tasks" | "suppliers" | "trash";
  task_time_mode: TaskTimeMode;
}

export interface AppSettings {
  tasks: {
    fields: TaskFieldSettings;
  };
  suppliers: {
    fields: SupplierFieldSettings;
  };
  interface: InterfaceSettings;
  system: SystemSettings;
}

// ─── Configuração padrão ──────────────────────────────────────
export const DEFAULT_SETTINGS: AppSettings = {
  tasks: {
    fields: {
      description:     { key: "description",     label: "Descrição",         visible: true,  required: false, order: 1 },
      priority:        { key: "priority",         label: "Prioridade",        visible: true,  required: true,  order: 2, locked: true },
      due_date:        { key: "due_date",         label: "Data de Vencimento",visible: true,  required: true,  order: 3, locked: true },
      estimated_hours: { key: "estimated_hours",  label: "Horas Estimadas",   visible: true,  required: false, order: 4 },
      supplier_id:     { key: "supplier_id",      label: "Fornecedor Vinculado", visible: true, required: false, order: 5 },
      tags:            { key: "tags",             label: "Etiquetas",         visible: true,  required: false, order: 6 },
      notes:           { key: "notes",            label: "Observações",       visible: true,  required: false, order: 7 },
    },
  },
  suppliers: {
    fields: {
      category:      { key: "category",      label: "Categoria",    visible: true,  required: false, order: 1 },
      phone:         { key: "phone",         label: "Telefone",     visible: true,  required: false, order: 2 },
      location_name: { key: "location_name", label: "Localização",  visible: true,  required: false, order: 3 },
      email:         { key: "email",         label: "E-mail",       visible: true,  required: false, order: 4 },
      notes:         { key: "notes",         label: "Observações",  visible: true,  required: false, order: 5 },
    },
  },
  interface: {
    showDashboard:    true,
    showSearchBar:    true,
    showFilterBar:    true,
    compactCards:     false,
    animationsEnabled: true,
  },
  system: {
    confirmBeforeDelete:       true,
    autoCloseModalOnComplete:  true,
    defaultPriority:           "medium",
    defaultTab:                "tasks",
    task_time_mode:            "session_based",
  },
};
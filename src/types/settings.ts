// src/types/settings.ts

// ─── Configuração de um campo individual ──────────────────────
export interface FieldConfig {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
  order: number;
  locked?: boolean;
}

export type SettingsModule = "tasks" | "suppliers" | "interface" | "system" | "timer" | "calendar" | "security" | "notifications";

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
  sidebarCollapsed: boolean;
  showTaskCount: boolean;
}

export type TaskTimeMode = "simple" | "session_based";
export type DateFormat = "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";
export type TimeFormat = "24h" | "12h";
export type WeekStart = "sunday" | "monday";
export type Language = "pt-BR" | "en-US";

export interface SystemSettings {
  confirmBeforeDelete: boolean;
  autoCloseModalOnComplete: boolean;
  defaultPriority: "high" | "medium" | "low";
  defaultTab: "tasks" | "suppliers" | "trash";
  task_time_mode: TaskTimeMode;
  language: Language;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
}

export interface TimerSettings {
  enabled: boolean;
  showInTaskCard: boolean;
  autoStartOnOpen: boolean;
  alertOnLongSession: boolean;
  longSessionThresholdMinutes: number;
  showSessionHistory: boolean;
  exportEnabled: boolean;
  soundEnabled: boolean;
  defaultMode: TaskTimeMode;
}

export interface CalendarSettings {
  enabled: boolean;
  weekStart: WeekStart;
  showWeekends: boolean;
  defaultView: "month" | "week" | "day";
  showCompletedTasks: boolean;
  highlightOverdue: boolean;
  showTaskPriority: boolean;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
}

export interface SecuritySettings {
  requirePasswordConfirmation: boolean;
  sessionTimeoutMinutes: number;
  showChangePasswordInMenu: boolean;
  twoFactorEnabled: boolean;
  minPasswordLength: number;
  requireStrongPassword: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  dueDateAlerts: boolean;
  dueDateAlertHoursBefore: number;
  taskCompletionSound: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
}

export interface AppSettings {
  tasks: { fields: TaskFieldSettings };
  suppliers: { fields: SupplierFieldSettings };
  interface: InterfaceSettings;
  system: SystemSettings;
  timer: TimerSettings;
  calendar: CalendarSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  tasks: {
    fields: {
      description:     { key: "description",     label: "Descrição",            visible: true,  required: false, order: 1 },
      priority:        { key: "priority",         label: "Prioridade",           visible: true,  required: true,  order: 2, locked: true },
      due_date:        { key: "due_date",         label: "Data de Vencimento",   visible: true,  required: true,  order: 3, locked: true },
      estimated_hours: { key: "estimated_hours",  label: "Horas Estimadas",      visible: true,  required: false, order: 4 },
      supplier_id:     { key: "supplier_id",      label: "Fornecedor Vinculado", visible: true,  required: false, order: 5 },
      tags:            { key: "tags",             label: "Etiquetas",            visible: true,  required: false, order: 6 },
      notes:           { key: "notes",            label: "Observações",          visible: true,  required: false, order: 7 },
    },
  },
  suppliers: {
    fields: {
      category:      { key: "category",      label: "Categoria",   visible: true, required: false, order: 1 },
      phone:         { key: "phone",         label: "Telefone",    visible: true, required: false, order: 2 },
      location_name: { key: "location_name", label: "Localização", visible: true, required: false, order: 3 },
      email:         { key: "email",         label: "E-mail",      visible: true, required: false, order: 4 },
      notes:         { key: "notes",         label: "Observações", visible: true, required: false, order: 5 },
    },
  },
  interface: {
    showDashboard: true, showSearchBar: true, showFilterBar: true,
    compactCards: false, animationsEnabled: true, sidebarCollapsed: false, showTaskCount: true,
  },
  system: {
    confirmBeforeDelete: true, autoCloseModalOnComplete: true,
    defaultPriority: "medium", defaultTab: "tasks", task_time_mode: "session_based",
    language: "pt-BR", dateFormat: "dd/MM/yyyy", timeFormat: "24h",
  },
  timer: {
    enabled: true, showInTaskCard: true, autoStartOnOpen: false,
    alertOnLongSession: true, longSessionThresholdMinutes: 120,
    showSessionHistory: true, exportEnabled: true, soundEnabled: false, defaultMode: "session_based",
  },
  calendar: {
    enabled: true, weekStart: "sunday", showWeekends: true, defaultView: "month",
    showCompletedTasks: false, highlightOverdue: true, showTaskPriority: true,
    reminderEnabled: false, reminderMinutesBefore: 30,
  },
  security: {
    requirePasswordConfirmation: true, sessionTimeoutMinutes: 0,
    showChangePasswordInMenu: true, twoFactorEnabled: false,
    minPasswordLength: 6, requireStrongPassword: false,
  },
  notifications: {
    enabled: true, dueDateAlerts: true, dueDateAlertHoursBefore: 24,
    taskCompletionSound: false, desktopNotifications: false, emailNotifications: false,
  },
};
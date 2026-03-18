// src/hooks/useI18n.ts
// Mini sistema de internacionalização baseado nas configurações do usuário
import { useSettings } from "@/hooks/useSettings";

const translations = {
  "pt-BR": {
    // Tabs
    tasks: "Tarefas",
    suppliers: "Fornecedores",
    trash: "Lixeira",
    // Botões
    newTask: "Nova Tarefa",
    newSupplier: "Fornecedor",
    task: "Tarefa",
    // Empty state
    allClean: "Tudo limpo!",
    addFirstTask: "Adicione sua primeira tarefa para começar.",
    noResults: "Nenhum resultado",
    noTaskWith: (q: string) => `Nenhuma tarefa com "${q}".`,
    // Prioridade
    high: "Alta",
    medium: "Média",
    low: "Baixa",
    // Status
    pending: "Pendente",
    completed: "Concluída",
    overdue: "Atrasada",
    dueSoon: "Vence em breve",
    // Ações
    edit: "Editar",
    delete: "Excluir",
    restore: "Restaurar",
    cancel: "Cancelar",
    save: "Salvar",
    confirm: "Confirmar?",
    yes: "Sim",
    no: "Não",
    // Datas
    noDate: "Sem data",
    createdAt: "Criada em",
    // Timer
    sessionMode: "SESSÕES",
    simpleMode: "SIMPLES",
    liveLabel: "AO VIVO",
    // Misc
    syncingLabel: "Sincronizando…",
    savedLabel: "Salvo",
  },
  "en-US": {
    // Tabs
    tasks: "Tasks",
    suppliers: "Suppliers",
    trash: "Trash",
    // Buttons
    newTask: "New Task",
    newSupplier: "Supplier",
    task: "Task",
    // Empty state
    allClean: "All clear!",
    addFirstTask: "Add your first task to get started.",
    noResults: "No results",
    noTaskWith: (q: string) => `No task matching "${q}".`,
    // Priority
    high: "High",
    medium: "Medium",
    low: "Low",
    // Status
    pending: "Pending",
    completed: "Completed",
    overdue: "Overdue",
    dueSoon: "Due soon",
    // Actions
    edit: "Edit",
    delete: "Delete",
    restore: "Restore",
    cancel: "Cancel",
    save: "Save",
    confirm: "Confirm?",
    yes: "Yes",
    no: "No",
    // Dates
    noDate: "No date",
    createdAt: "Created on",
    // Timer
    sessionMode: "SESSIONS",
    simpleMode: "SIMPLE",
    liveLabel: "LIVE",
    // Misc
    syncingLabel: "Syncing…",
    savedLabel: "Saved",
  },
} as const;

export function useI18n() {
  const { settings } = useSettings();
  return translations[settings.system.language] ?? translations["pt-BR"];
}
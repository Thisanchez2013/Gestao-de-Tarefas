// src/components/FilterBar.tsx — responsivo para mobile
import type { FilterStatus, FilterPriority } from "@/types/task";
import { motion } from "framer-motion";

interface Props {
  filterStatus: FilterStatus;
  filterPriority: FilterPriority;
  onStatusChange: (s: FilterStatus) => void;
  onPriorityChange: (p: FilterPriority) => void;
}

const statuses: { value: FilterStatus; label: string; emoji: string }[] = [
  { value: "all",       label: "Todas",     emoji: "○" },
  { value: "pending",   label: "Pendentes", emoji: "◔" },
  { value: "completed", label: "Concluídas",emoji: "●" },
];

const priorities: { value: FilterPriority; label: string; active: string }[] = [
  { value: "all",    label: "Todas", active: "bg-primary text-primary-foreground" },
  { value: "high",   label: "Alta",  active: "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/50 dark:ring-rose-800" },
  { value: "medium", label: "Média", active: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/50 dark:ring-amber-800" },
  { value: "low",    label: "Baixa", active: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/50 dark:ring-emerald-800" },
];

export function FilterBar({ filterStatus, filterPriority, onStatusChange, onPriorityChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      // Scroll horizontal no mobile — tudo numa linha
      className="flex items-center gap-2 overflow-x-auto scrollbar-none"
    >
      {/* Status chips */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 shrink-0">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 touch-manipulation
              ${filterStatus === s.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
          >
            <span className="mr-1 opacity-70 hidden sm:inline">{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Divider — só desktop */}
      <div className="h-4 w-px bg-border hidden sm:block shrink-0" />

      {/* Priority chips */}
      <div className="flex items-center gap-1 shrink-0">
        {priorities.map((p) => (
          <button
            key={p.value}
            onClick={() => onPriorityChange(p.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 touch-manipulation
              ${filterPriority === p.value
                ? p.active
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
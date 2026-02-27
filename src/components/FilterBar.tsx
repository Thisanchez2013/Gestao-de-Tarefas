// src/components/FilterBar.tsx
import type { FilterStatus, FilterPriority } from "@/types/task";
import { motion } from "framer-motion";

interface Props {
  filterStatus: FilterStatus;
  filterPriority: FilterPriority;
  onStatusChange: (s: FilterStatus) => void;
  onPriorityChange: (p: FilterPriority) => void;
}

const statuses: { value: FilterStatus; label: string; emoji: string }[] = [
  { value: "all", label: "Todas", emoji: "○" },
  { value: "pending", label: "Pendentes", emoji: "◔" },
  { value: "completed", label: "Concluídas", emoji: "●" },
];

const priorities: { value: FilterPriority; label: string; color: string }[] = [
  { value: "all", label: "Todas", color: "bg-muted text-muted-foreground" },
  { value: "high", label: "Alta", color: "bg-rose-50 text-rose-600" },
  { value: "medium", label: "Média", color: "bg-amber-50 text-amber-600" },
  { value: "low", label: "Baixa", color: "bg-emerald-50 text-emerald-600" },
];

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass?: string;
}

function FilterChip({ active, onClick, children, activeClass }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
        ${active
          ? activeClass || "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        }
      `}
    >
      {children}
    </button>
  );
}

export function FilterBar({
  filterStatus,
  filterPriority,
  onStatusChange,
  onPriorityChange,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-wrap items-center gap-3"
    >
      <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl p-1">
        {statuses.map((s) => (
          <FilterChip
            key={s.value}
            active={filterStatus === s.value}
            onClick={() => onStatusChange(s.value)}
          >
            <span className="mr-1 opacity-70">{s.emoji}</span>
            {s.label}
          </FilterChip>
        ))}
      </div>

      <div className="h-4 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground font-medium mr-1">Prioridade:</span>
        {priorities.map((p) => (
          <FilterChip
            key={p.value}
            active={filterPriority === p.value}
            onClick={() => onPriorityChange(p.value)}
            activeClass={`${p.color} shadow-sm ring-1 ring-inset ring-current/20`}
          >
            {p.label}
          </FilterChip>
        ))}
      </div>
    </motion.div>
  );
}

import type { FilterStatus, FilterPriority } from "@/types/task";
import { Button } from "@/components/ui/button";

interface Props {
  filterStatus: FilterStatus;
  filterPriority: FilterPriority;
  onStatusChange: (s: FilterStatus) => void;
  onPriorityChange: (p: FilterPriority) => void;
}

const statuses: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "completed", label: "Concluídas" },
];

const priorities: { value: FilterPriority; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
];

export function FilterBar({ filterStatus, filterPriority, onStatusChange, onPriorityChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground mr-1">Status:</span>
      {statuses.map((s) => (
        <Button
          key={s.value}
          size="sm"
          variant={filterStatus === s.value ? "default" : "outline"}
          onClick={() => onStatusChange(s.value)}
          className="text-xs h-7"
        >
          {s.label}
        </Button>
      ))}
      <span className="text-sm text-muted-foreground ml-3 mr-1">Prioridade:</span>
      {priorities.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={filterPriority === p.value ? "default" : "outline"}
          onClick={() => onPriorityChange(p.value)}
          className="text-xs h-7"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

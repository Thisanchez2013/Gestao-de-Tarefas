import type { Priority } from "@/types/task";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface Props {
  pendingCount: number;
  completedCount: number;
}

export function Dashboard({ pendingCount, completedCount }: Props) {
  const total = pendingCount + completedCount;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <div className="rounded-full bg-priority-medium-bg p-2">
          <Clock className="h-5 w-5 text-priority-medium" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-semibold">{pendingCount}</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <div className="rounded-full bg-priority-low-bg p-2">
          <CheckCircle2 className="h-5 w-5 text-priority-low" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Concluídas</p>
          <p className="text-2xl font-semibold">{completedCount}</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground mb-2">Progresso</p>
        <div className="w-full bg-secondary rounded-full h-2.5">
          <div
            className="bg-success h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{pct}% concluído</p>
      </div>
    </div>
  );
}

import type { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Pencil, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityLabel = { high: "Alta", medium: "Média", low: "Baixa" };

export function TaskCard({ task, onToggle, onEdit, onDelete }: Props) {
  const isCompleted = task.status === "completed";
  const isOverdue =
    !isCompleted && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div
      className={`group rounded-lg border bg-card p-4 transition-all hover:shadow-md ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 shrink-0 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-medium leading-tight ${
                isCompleted ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium priority-${task.priority}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full priority-dot-${task.priority}`} />
              {priorityLabel[task.priority]}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span
              className={`text-xs font-mono ${
                isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
              }`}
            >
              {format(new Date(task.dueDate), "dd MMM yyyy", { locale: ptBR })}
              {isOverdue && " — Atrasada"}
            </span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

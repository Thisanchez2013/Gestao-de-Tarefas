// src/components/TrashView.tsx
import type { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { format, isValid, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  tasks: Task[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

const priorityConfig = {
  high: {
    label: "Alta",
    textColor: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    dot: "bg-rose-500",
    border: "border-l-rose-400",
  },
  medium: {
    label: "Média",
    textColor: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    dot: "bg-amber-400",
    border: "border-l-amber-400",
  },
  low: {
    label: "Baixa",
    textColor: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    dot: "bg-emerald-500",
    border: "border-l-emerald-400",
  },
};

const TAG_COLORS = [
  "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
  "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  "bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300",
  "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function TrashView({ tasks, onRestore, onPermanentDelete }: Props) {
  const { toast } = useToast();

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="relative mb-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
            <Trash2 className="h-9 w-9 text-muted-foreground/30" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <h3 className="font-bold text-base text-foreground mb-1">Lixeira vazia</h3>
        <p className="text-sm text-muted-foreground max-w-[220px]">
          Nenhuma tarefa descartada por aqui. Tudo limpo!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header da lixeira */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {tasks.length} {tasks.length === 1 ? "tarefa descartada" : "tarefas descartadas"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Itens excluídos ficam aqui até serem removidos permanentemente
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {tasks.map((task, i) => {
          const config = priorityConfig[task.priority];
          const deletedAt = task.deleted_at ? new Date(task.deleted_at) : null;
          const dueDate = new Date(task.due_date);
          const isDueDateValid = isValid(dueDate);
          const tags = task.tags ?? [];
          const isCompleted = task.status === "completed";

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -24, scale: 0.97, transition: { duration: 0.2 } }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className={`
                relative rounded-2xl border border-border/70 border-l-4 bg-card
                shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
                ${config.border} opacity-80 hover:opacity-100
              `}
            >
              {/* Faixa "excluída há X tempo" */}
              <div className="absolute top-0 right-0 px-2.5 py-1 bg-destructive/8 border-b border-l border-border/50 rounded-bl-xl">
                <p className="text-[10px] font-semibold text-destructive/70 uppercase tracking-wider">
                  Excluída {deletedAt && isValid(deletedAt)
                    ? formatDistanceToNow(deletedAt, { locale: ptBR, addSuffix: true })
                    : ""}
                </p>
              </div>

              <div className="px-4 pt-4 pb-3">
                {/* Título */}
                <div className="flex items-start gap-2.5 pr-28">
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${config.dot} opacity-60`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-through text-muted-foreground/70 leading-snug">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground/50 mt-0.5 line-clamp-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadados */}
                <div className="flex items-center gap-3 mt-2.5 ml-4 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </span>

                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                    {isCompleted ? "Concluída" : "Pendente"}
                  </span>

                  {isDueDateValid && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/50 font-medium">
                        {format(dueDate, "dd 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                  )}

                  {task.estimated_hours && task.estimated_hours > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/50 font-medium">
                        {task.estimated_hours}h
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-2 ml-4">
                    {tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium opacity-60 ${getTagColor(tag)}`}
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground/50">+{tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer com ações */}
              <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50 font-mono">
                  Criada em {format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => {
                      onRestore(task.id);
                      toast({ title: "✅ Tarefa restaurada com sucesso!" });
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restaurar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => {
                      onPermanentDelete(task.id);
                      toast({ title: "🗑️ Tarefa excluída permanentemente." });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
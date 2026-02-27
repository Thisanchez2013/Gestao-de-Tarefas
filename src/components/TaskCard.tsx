// src/components/TaskCard.tsx
import type { TaskWithSupplier } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  MapPin,
  Clock,
  Tag,
  ChevronRight,
  Building2,
} from "lucide-react";
import { format, isValid, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  task: TaskWithSupplier;
  onToggle: (id: string) => void;
  onEdit: (task: TaskWithSupplier) => void;
  onDelete: (id: string) => void;
  onOpen: (task: TaskWithSupplier) => void;
}

const priorityConfig = {
  high: {
    label: "Alta",
    textColor: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/50",
    dot: "bg-rose-500",
    border: "border-l-rose-500",
    glow: "shadow-rose-100 dark:shadow-rose-950",
  },
  medium: {
    label: "Média",
    textColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    dot: "bg-amber-400",
    border: "border-l-amber-400",
    glow: "shadow-amber-100 dark:shadow-amber-950",
  },
  low: {
    label: "Baixa",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    glow: "shadow-emerald-100 dark:shadow-emerald-950",
  },
};

const TAG_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function TaskCard({ task, onToggle, onEdit, onDelete, onOpen }: Props) {
  const isCompleted = task.status === "completed";
  const { supplier } = task;
  const config = priorityConfig[task.priority];

  const dateObj = new Date(task.due_date);
  const isDateValid = isValid(dateObj);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = !isCompleted && isDateValid && dateObj < today;
  const daysUntilDue = isDateValid ? differenceInDays(dateObj, today) : null;
  const isDueSoon = !isCompleted && !isOverdue && daysUntilDue !== null && daysUntilDue <= 2;

  const tags = task.tags ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`
        group relative overflow-hidden
        rounded-2xl border-l-4 border border-border/80 bg-card
        shadow-sm transition-all duration-200 hover:shadow-lg ${config.glow}
        ${config.border}
        ${isCompleted ? "opacity-60" : ""}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />

      <button
        onClick={() => onOpen(task)}
        className="w-full text-left px-4 pt-3.5 pb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl"
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
            className="mt-0.5 shrink-0 cursor-pointer transition-transform active:scale-90"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isCompleted ? (
                <motion.div key="checked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.18, type: "spring", stiffness: 400 }}>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div key="unchecked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <Circle className="h-5 w-5 text-muted-foreground/25 group-hover:text-primary/40 transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap pr-14">
              <h3 className={`font-semibold text-sm leading-snug transition-all ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task.title}
              </h3>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                {config.label}
              </span>

              {isOverdue && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  <AlertCircle className="h-3 w-3" />
                  Atrasada
                </span>
              )}

              {isDueSoon && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                  <Clock className="h-3 w-3" />
                  Vence em breve
                </span>
              )}

              {tags.slice(0, 2).map((tag) => (
                <span key={tag} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${getTagColor(tag)}`}>
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground font-medium">+{tags.length - 2}</span>
              )}
            </div>

            {/* Descrição */}
            {task.description && (
              <p className={`text-xs mt-1.5 line-clamp-1 leading-relaxed ${isCompleted ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                {task.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              {supplier && (
                <div className="flex items-center gap-1 min-w-0">
                  <div className="flex h-4 w-4 items-center justify-center rounded bg-primary/10 shrink-0">
                    <Building2 className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <span className="text-[11px] font-medium text-primary/80 truncate max-w-[120px]">
                    {supplier.name}
                  </span>
                  {supplier.location_name && (
                    <span className="text-[11px] text-muted-foreground/60 hidden sm:inline truncate">
                      · {supplier.location_name}
                    </span>
                  )}
                </div>
              )}

              {supplier && <span className="text-border/60 text-xs select-none">·</span>}

              <div className="flex items-center gap-1">
                <Calendar className={`h-3 w-3 shrink-0 ${isOverdue ? "text-rose-500" : isDueSoon ? "text-orange-500" : "text-muted-foreground/40"}`} />
                <span className={`text-[11px] font-medium ${isOverdue ? "text-rose-500" : isDueSoon ? "text-orange-500" : "text-muted-foreground/60"}`}>
                  {isDateValid ? format(dateObj, "dd 'de' MMM", { locale: ptBR }) : "Sem data"}
                </span>
              </div>

              {task.estimated_hours && task.estimated_hours > 0 && (
                <>
                  <span className="text-border/60 text-xs select-none">·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-[11px] text-muted-foreground/60 font-medium">
                      {task.estimated_hours}h
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors shrink-0 mt-1 absolute right-4 top-4" />
        </div>
      </button>

      {/* Botões de ação rápida */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 bg-card/98 backdrop-blur-sm rounded-xl p-1 shadow-md border border-border/80 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          aria-label="Editar tarefa"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          aria-label="Mover para lixeira"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}
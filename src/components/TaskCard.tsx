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
  Phone,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { format, isValid } from "date-fns";
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
    textColor: "text-rose-600",
    bgColor: "bg-rose-50",
    dot: "bg-rose-500",
    border: "border-l-rose-500",
  },
  medium: {
    label: "Média",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    dot: "bg-amber-400",
    border: "border-l-amber-400",
  },
  low: {
    label: "Baixa",
    textColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
  },
};

export function TaskCard({ task, onToggle, onEdit, onDelete, onOpen }: Props) {
  const isCompleted = task.status === "completed";
  const { supplier } = task;
  const config = priorityConfig[task.priority];

  const dateObj = new Date(task.due_date);
  const isDateValid = isValid(dateObj);
  const isOverdue =
    !isCompleted &&
    isDateValid &&
    dateObj < new Date(new Date().toDateString());

  const handleWhatsApp = (phoneNumber: string) => {
    window.open(`https://wa.me/${phoneNumber.replace(/\D/g, "")}`, "_blank");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`
        group relative overflow-hidden
        rounded-xl border-l-[3px] border border-border bg-card
        shadow-sm transition-shadow hover:shadow-md
        ${config.border}
        ${isCompleted ? "opacity-70" : ""}
      `}
    >
      {/* Área clicável principal — abre o modal de detalhe */}
      <button
        onClick={() => onOpen(task)}
        className="w-full text-left px-4 py-3.5 focus:outline-none"
      >
        <div className="flex items-start gap-3">
          {/* Checkbox — clique isolado, não propaga pro botão pai */}
          <div
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
            className="mt-0.5 shrink-0 cursor-pointer transition-transform active:scale-90"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isCompleted ? (
                <motion.div
                  key="checked"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="unchecked"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {/* Título + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-semibold text-sm leading-snug transition-all ${
                  isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {task.title}
              </h3>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                {config.label}
              </span>

              {isOverdue && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-600">
                  <AlertCircle className="h-3 w-3" />
                  Atrasada
                </span>
              )}
            </div>

            {/* Descrição — preview truncado */}
            {task.description && (
              <p
                className={`text-xs mt-1 line-clamp-1 leading-relaxed ${
                  isCompleted ? "text-muted-foreground/60" : "text-muted-foreground"
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Fornecedor resumido */}
            {supplier && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <MapPin className="h-3 w-3 text-primary/60 shrink-0" />
                <span className="text-[11px] font-medium text-primary/80 truncate">
                  {supplier.name} · {supplier.location_name}
                </span>
              </div>
            )}

            {/* Data */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Calendar className={`h-3 w-3 shrink-0 ${isOverdue ? "text-rose-500" : "text-muted-foreground/50"}`} />
              <span className={`text-[11px] font-medium ${isOverdue ? "text-rose-500" : "text-muted-foreground/60"}`}>
                {isDateValid
                  ? format(dateObj, "dd 'de' MMM, yyyy", { locale: ptBR })
                  : "Sem data"}
              </span>
            </div>
          </div>

          {/* Seta indicando que é clicável */}
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0 mt-0.5" />
        </div>
      </button>

      {/* Botões de ação rápida — aparecem no hover, fora da área clicável */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 bg-card/95 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-border/60">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary"
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          aria-label="Editar tarefa"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          aria-label="Mover para lixeira"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}
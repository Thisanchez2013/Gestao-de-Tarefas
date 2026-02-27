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
} from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  task: TaskWithSupplier;
  onToggle: (id: string) => void;
  onEdit: (task: TaskWithSupplier) => void;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  high: {
    label: "Alta",
    textColor: "text-rose-600",
    bgColor: "bg-rose-50",
    dot: "bg-rose-500",
    border: "border-l-rose-500",
    ring: "ring-rose-100",
  },
  medium: {
    label: "Média",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    dot: "bg-amber-400",
    border: "border-l-amber-400",
    ring: "ring-amber-100",
  },
  low: {
    label: "Baixa",
    textColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    ring: "ring-emerald-100",
  },
};

export function TaskCard({ task, onToggle, onEdit, onDelete }: Props) {
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
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
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
        px-4 py-3.5 shadow-sm
        transition-shadow hover:shadow-md
        ${config.border}
        ${isCompleted ? "opacity-70" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 shrink-0 transition-transform active:scale-90 focus:outline-none"
          aria-label={isCompleted ? "Marcar como pendente" : "Marcar como concluída"}
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
                <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + Priority badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold text-sm leading-snug transition-all ${
                isCompleted
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
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

          {/* Description */}
          {task.description && (
            <p
              className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                isCompleted ? "text-muted-foreground/60" : "text-muted-foreground"
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Supplier section */}
          {supplier && (
            <div className="mt-2.5 flex flex-wrap items-center gap-3 pt-2.5 border-t border-border/60">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <MapPin className="h-3 w-3" />
                {supplier.location_name} · {supplier.name}
              </span>

              <a
                href={`tel:${supplier.phone}`}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-3 w-3" />
                {supplier.phone}
              </a>

              <button
                onClick={() => handleWhatsApp(supplier.phone)}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                WhatsApp
              </button>
            </div>
          )}

          {/* Due date */}
          <div className="flex items-center gap-1.5 mt-2">
            <Calendar
              className={`h-3 w-3 ${isOverdue ? "text-rose-500" : "text-muted-foreground/60"}`}
            />
            <span
              className={`text-[11px] font-medium ${
                isOverdue ? "text-rose-500" : "text-muted-foreground/70"
              }`}
            >
              {isDateValid
                ? format(dateObj, "dd 'de' MMM, yyyy", { locale: ptBR })
                : "Sem data definida"}
            </span>
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
            onClick={() => onEdit(task)}
            aria-label="Editar tarefa"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(task.id)}
            aria-label="Mover para lixeira"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

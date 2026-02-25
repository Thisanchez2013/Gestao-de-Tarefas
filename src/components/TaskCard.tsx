// src/components/TaskCard.tsx
import type { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Pencil, Trash2, Calendar, AlertCircle } from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  high: { label: "Alta", color: "text-rose-600", bg: "bg-rose-50", dot: "bg-rose-500" },
  medium: { label: "Média", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  low: { label: "Baixa", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" }
};

export function TaskCard({ task, onToggle, onEdit, onDelete }: Props) {
  const isCompleted = task.status === "completed";
  
  // Tratamento seguro para data inválida
  const dateObj = new Date(task.dueDate);
  const isDateValid = isValid(dateObj);
  
  const isOverdue = 
    !isCompleted && 
    isDateValid && 
    dateObj < new Date(new Date().toDateString());

  const config = priorityConfig[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      className={`group relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        isCompleted ? "border-emerald-100 bg-emerald-50/20" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Botão Check Animado */}
        <button
          onClick={() => onToggle(task.id)}
          className="mt-1 shrink-0 transition-transform active:scale-90"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50" />
          ) : (
            <Circle className="h-6 w-6 text-slate-300 hover:text-violet-500 transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className={`font-semibold text-slate-800 transition-all ${
              isCompleted ? "line-through text-slate-400 opacity-70" : ""
            }`}>
              {task.title}
            </h3>
            
            {/* Indicador de Prioridade */}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.bg} ${config.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${config.dot} animate-pulse`} />
              {config.label}
            </span>
          </div>

          {task.description && (
            <p className={`text-sm mt-1 line-clamp-2 transition-all ${
              isCompleted ? "text-slate-400" : "text-slate-600"
            }`}>
              {task.description}
            </p>
          )}

          {/* Rodapé do Card com Data Segura */}
          <div className="flex items-center gap-4 mt-3">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${
              isOverdue ? "text-rose-600" : "text-slate-400"
            }`}>
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {isDateValid 
                  ? format(dateObj, "dd 'de' MMM", { locale: ptBR })
                  : "Data não definida"}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 ml-1 animate-bounce">
                   <AlertCircle className="h-3 w-3" /> Atrasada
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ações (Hover) */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-violet-50 hover:text-violet-600" onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Detalhe Visual Lateral */}
      {task.priority === "high" && !isCompleted && (
        <div className="absolute left-0 top-0 h-full w-1 bg-rose-500" />
      )}
    </motion.div>
  );
}
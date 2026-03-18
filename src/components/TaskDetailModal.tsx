// src/components/TaskDetailModal.tsx
import { useState, useEffect } from "react";
import type { TaskWithSupplier } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Clock,
  Tag,
  FileText,
  Building2,
  StickyNote,
  Mail,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isValid, formatDistanceToNow } from "date-fns";
import { TaskTimer } from "@/components/TaskTimer";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useSettings } from "@/hooks/useSettings";
import { useDateFormat } from "@/hooks/useDateFormat";

interface Props {
  task: TaskWithSupplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string) => void;
  onEdit: (task: TaskWithSupplier) => void;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  high: {
    label: "Alta",
    textColor: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/50",
    dot: "bg-rose-500",
    border: "border-rose-200 dark:border-rose-800",
    accent: "bg-rose-500",
  },
  medium: {
    label: "Média",
    textColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    dot: "bg-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    accent: "bg-amber-400",
  },
  low: {
    label: "Baixa",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
    accent: "bg-emerald-500",
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
  for (let i = 0; i < tag.length; i++)
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// Animação SVG do check de conclusão
function CompletionOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm rounded-lg"
    >
      {/* Círculo pulsante de fundo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.15, 1] }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex items-center justify-center"
      >
        {/* Anel externo pulsante */}
        <motion.div
          className="absolute h-28 w-28 rounded-full bg-emerald-500/10"
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 1, repeat: 1, ease: "easeOut" }}
        />
        {/* Círculo principal */}
        <motion.div
          className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        >
          {/* Check SVG animado */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Texto */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-5 text-center"
      >
        <p className="text-base font-bold text-foreground">Tarefa concluída!</p>
        <p className="text-xs text-muted-foreground mt-1">Ótimo trabalho 🎉</p>
      </motion.div>
    </motion.div>
  );
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const { updateTask } = useTaskStore();
  const { settings } = useSettings();
  const { formatDate, formatDateTime, locale } = useDateFormat();
  const [showCompletion, setShowCompletion] = useState(false);

  if (!task) return null;

  const isCompleted = task.status === "completed";
  const config = priorityConfig[task.priority];
  const { supplier } = task;

  const dateObj = new Date(task.due_date);
  const isDateValid = isValid(dateObj);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = !isCompleted && isDateValid && dateObj < today;

  const createdAt = new Date(task.created_at);
  const updatedAt = new Date(task.updated_at);
  const tags = task.tags ?? [];

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
  };

  const handleEdit = () => {
    onOpenChange(false);
    setTimeout(() => onEdit(task), 150);
  };

  const handleDelete = () => {
    onOpenChange(false);
    setTimeout(() => onDelete(task.id), 150);
  };

  // Ao clicar em "Concluir": mostra animação, depois fecha o modal
  const handleToggle = () => {
    if (!isCompleted) {
      // Vai concluir — mostra animação primeiro
      setShowCompletion(true);
      onToggle(task.id);
    } else {
      // Vai reabrir — sem animação
      onToggle(task.id);
    }
  };

  const handleCompletionDone = () => {
    setShowCompletion(false);
    // Fecha o modal somente se a configuração permitir
    if (settings.system.autoCloseModalOnComplete) {
      setTimeout(() => onOpenChange(false), 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0 border-0 shadow-2xl">
        {/* Títulos acessíveis para leitores de tela */}
        <DialogTitle className="sr-only">
          {task.title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detalhes da tarefa: {task.title}. Prioridade {task.priority}. Vencimento {task.due_date}.
        </DialogDescription>

        {/* Accent bar por prioridade */}
        <div className={`h-1 w-full ${config.accent}`} />

        {/* Overlay de conclusão */}
        <AnimatePresence>
          {showCompletion && (
            <CompletionOverlay onDone={handleCompletionDone} />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-b from-muted/30 to-transparent">
          <div className="flex items-start gap-3 pr-8">
            <button
              onClick={handleToggle}
              className="mt-0.5 shrink-0 transition-transform active:scale-90 focus:outline-none"
            >
              {isCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground/30 hover:text-primary transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h2
                className={`text-lg font-bold leading-snug ${
                  isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {task.title}
              </h2>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${config.bgColor} ${config.textColor} ${config.border}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                  Prioridade {config.label}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {isCompleted ? (
                    <><CheckCircle2 className="h-3 w-3" /> Concluída</>
                  ) : (
                    <><Clock className="h-3 w-3" /> Pendente</>
                  )}
                </span>

                {isOverdue && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                    <AlertCircle className="h-3 w-3" />
                    Atrasada
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Corpo com scroll */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 pb-2">
          <div className="space-y-4 py-2">

            {/* Cronômetro */}
            <TaskTimer task={task} onUpdate={updateTask} />

            {/* Descrição */}
            {task.description && (
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Descrição
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Grid prazo + estimativa */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-xl border p-3.5 ${
                  isOverdue
                    ? "border-rose-200 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30"
                    : "border-border/60 bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {isOverdue ? (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  ) : (
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Prazo
                  </span>
                </div>
                {isDateValid ? (
                  <>
                    <p
                      className={`text-sm font-semibold ${
                        isOverdue ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                      }`}
                    >
                      {formatDate(dateObj)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isOverdue ? "Vencida " : ""}
                      {formatDistanceToNow(dateObj, { locale, addSuffix: true })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sem data</p>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estimativa
                  </span>
                </div>
                {task.estimated_hours && task.estimated_hours > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">{task.estimated_hours}h</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">horas estimadas</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Não definida</p>
                )}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getTagColor(tag)}`}
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            {task.notes && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Notas Adicionais
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {task.notes}
                </p>
              </div>
            )}

            {/* Fornecedor */}
            {supplier && (
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="px-4 py-3 bg-primary/5 border-b border-border/40 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Fornecedor
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{supplier.name}</p>
                      {supplier.category && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground mt-0.5">
                          <Layers className="h-2.5 w-2.5" />
                          {supplier.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1 border-t border-border/40">
                    {supplier.location_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{supplier.location_name}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <a
                          href={`mailto:${supplier.email}`}
                          className="text-primary hover:underline truncate"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <a
                            href={`tel:${supplier.phone}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {supplier.phone}
                          </a>
                        </div>
                        <button
                          onClick={() => handleWhatsApp(supplier.phone)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/70"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>

                  {supplier.notes && (
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Obs. do fornecedor
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {supplier.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="rounded-xl bg-muted/30 px-4 py-3 grid grid-cols-2 gap-3 border border-border/40">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Criada em
                </p>
                <p className="text-xs text-foreground font-medium font-mono">
                  {isValid(createdAt) ? formatDate(createdAt) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Atualizada
                </p>
                <p className="text-xs text-foreground font-medium font-mono">
                  {isValid(updatedAt)
                    ? formatDistanceToNow(updatedAt, { locale, addSuffix: true })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2 h-9" onClick={handleEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>

          <Button
            size="sm"
            className={`flex-1 gap-2 h-9 transition-all ${
              !isCompleted
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : ""
            }`}
            onClick={handleToggle}
          >
            {isCompleted ? (
              <><Circle className="h-3.5 w-3.5" />Reabrir</>
            ) : (
              <><CheckCircle2 className="h-3.5 w-3.5" />Concluir</>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive shrink-0"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// src/components/TaskDetailModal.tsx
import type { TaskWithSupplier } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { format, isValid, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

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
    textColor: "text-rose-600",
    bgColor: "bg-rose-50",
    dot: "bg-rose-500",
    border: "border-rose-200",
  },
  medium: {
    label: "Média",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    dot: "bg-amber-400",
    border: "border-amber-200",
  },
  low: {
    label: "Baixa",
    textColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
};

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  if (!task) return null;

  const isCompleted = task.status === "completed";
  const config = priorityConfig[task.priority];
  const { supplier } = task;

  const dateObj = new Date(task.due_date);
  const isDateValid = isValid(dateObj);
  const isOverdue =
    !isCompleted && isDateValid && dateObj < new Date(new Date().toDateString());

  const createdAt = new Date(task.created_at);
  const updatedAt = new Date(task.updated_at);

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

  const handleToggle = () => {
    onToggle(task.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Accent bar top — cor por prioridade */}
        <div
          className={`h-1.5 w-full ${
            task.priority === "high"
              ? "bg-rose-500"
              : task.priority === "medium"
              ? "bg-amber-400"
              : "bg-emerald-500"
          }`}
        />

        <div className="px-6 pt-5 pb-6 space-y-5">
          {/* Header */}
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Checkbox grande */}
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

                <div className="min-w-0">
                  <DialogTitle
                    className={`text-lg font-bold leading-snug text-left ${
                      isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </DialogTitle>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${config.bgColor} ${config.textColor} ${config.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                      Prioridade {config.label}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
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
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-200">
                        <AlertCircle className="h-3 w-3" />
                        Atrasada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Separador */}
          <div className="h-px bg-border" />

          {/* Descrição */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" />
              Descrição
            </div>
            {task.description ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma descrição adicionada.
              </p>
            )}
          </div>

          {/* Data de vencimento */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              Prazo
            </div>
            {isDateValid ? (
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    isOverdue ? "text-rose-600" : "text-foreground"
                  }`}
                >
                  {format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({isOverdue ? "vencida" : formatDistanceToNow(dateObj, { locale: ptBR, addSuffix: true })})
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sem data definida.</p>
            )}
          </div>

          {/* Fornecedor */}
          {supplier && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5" />
                Fornecedor
              </div>
              <div className="rounded-xl border bg-accent/40 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{supplier.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {supplier.location_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                  <a
                    href={`tel:${supplier.phone}`}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {supplier.phone}
                  </a>
                  <button
                    onClick={() => handleWhatsApp(supplier.phone)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors ml-auto"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Abrir WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-xl bg-muted/50 px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Criada em</p>
              <p className="text-xs text-foreground font-medium font-mono">
                {isValid(createdAt)
                  ? format(createdAt, "dd/MM/yyyy", { locale: ptBR })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Atualizada</p>
              <p className="text-xs text-foreground font-medium font-mono">
                {isValid(updatedAt)
                  ? formatDistanceToNow(updatedAt, { locale: ptBR, addSuffix: true })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-9"
              onClick={handleEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar tarefa
            </Button>

            <Button
              size="sm"
              className="flex-1 gap-2 h-9"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
// src/components/KanbanView.tsx
// Kanban com DnD + mobile responsivo.
// Mobile: scroll horizontal com snap, padding lateral para centralizar a primeira coluna.
// Desktop: grid de 4 colunas.

import { useMemo, useRef, useState, useCallback } from "react";
import type { TaskWithSupplier, Priority } from "@/types/task";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Clock, AlertCircle, Calendar,
  Building2, Tag, Pencil, Trash2, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isValid, differenceInDays } from "date-fns";
import { useDateFormat } from "@/hooks/useDateFormat";

// ─── Config de colunas ────────────────────────────────────────

type ColumnId = "high" | "medium" | "low" | "completed";

interface ColumnDef {
  id: ColumnId;
  label: string;
  accent: string;
  headerBg: string;
  emptyText: string;
}

const COLUMNS: ColumnDef[] = [
  { id: "high",      label: "Alta Prioridade",  accent: "bg-rose-500",    headerBg: "bg-rose-50 dark:bg-rose-950/20",     emptyText: "Nenhuma urgente" },
  { id: "medium",    label: "Média Prioridade",  accent: "bg-amber-400",   headerBg: "bg-amber-50 dark:bg-amber-950/20",   emptyText: "Nenhuma em andamento" },
  { id: "low",       label: "Baixa Prioridade",  accent: "bg-emerald-500", headerBg: "bg-emerald-50 dark:bg-emerald-950/20",emptyText: "Nenhuma de baixa" },
  { id: "completed", label: "Concluídas",         accent: "bg-sky-400",     headerBg: "bg-sky-50 dark:bg-sky-950/20",       emptyText: "Nenhuma concluída" },
];

function getColumnId(task: TaskWithSupplier): ColumnId {
  return task.status === "completed" ? "completed" : (task.priority as ColumnId);
}

const PRIORITY_BORDER: Record<Priority, string> = {
  high: "border-t-rose-500",
  medium: "border-t-amber-400",
  low: "border-t-emerald-500",
};

const PRIORITY_BADGE: Record<Priority, { label: string; dot: string; text: string; bg: string }> = {
  high:   { label: "Alta",  dot: "bg-rose-500",    text: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-950/50" },
  medium: { label: "Média", dot: "bg-amber-400",   text: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/50" },
  low:    { label: "Baixa", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-950/50" },
};

const TAG_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
];
function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h);
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
}

// ─── KanbanCard ───────────────────────────────────────────────

interface CardProps {
  task: TaskWithSupplier;
  dragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggle: (id: string) => void;
  onEdit: (t: TaskWithSupplier) => void;
  onDelete: (id: string) => void;
  onOpen: (t: TaskWithSupplier) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

function KanbanCard({
  task, dragging, onDragStart, onDragEnd,
  onToggle, onEdit, onDelete, onOpen,
  isSelecting, isSelected, onSelect,
}: CardProps) {
  const { formatCardDate } = useDateFormat();
  const badge = PRIORITY_BADGE[task.priority];
  const borderTop = PRIORITY_BORDER[task.priority];
  const isCompleted = task.status === "completed";
  const dateObj = new Date(task.due_date);
  const validDate = isValid(dateObj);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = !isCompleted && validDate && dateObj < today;
  const days = validDate ? differenceInDays(dateObj, today) : null;
  const soon = !isCompleted && !overdue && days !== null && days <= 2;
  const tags = task.tags ?? [];

  return (
    <div
      draggable={!isSelecting}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => (isSelecting ? onSelect?.(task.id) : onOpen(task))}
      className={cn(
        "group relative rounded-xl border border-t-2 border-border/80 bg-card shadow-sm",
        "transition-all duration-150 cursor-pointer select-none active:scale-[0.98]",
        borderTop,
        dragging ? "opacity-40 scale-95 ring-2 ring-primary/30" : "hover:shadow-md hover:-translate-y-0.5",
        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
    >
      {/* Grip handle — desktop hover */}
      {!isSelecting && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-25 transition-opacity pointer-events-none hidden sm:block">
          <GripVertical className="h-3.5 w-3.5 text-foreground" />
        </div>
      )}

      {/* Checkbox bulk */}
      {isSelecting && (
        <div className="absolute top-2 left-2 z-10" onClick={(e) => { e.stopPropagation(); onSelect?.(task.id); }}>
          <div className={cn(
            "h-5 w-5 rounded border-2 transition-colors",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground/40 bg-card"
          )}>
            {isSelected && (
              <svg className="h-3.5 w-3.5 text-primary-foreground m-auto" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      )}

      <div className="p-3">
        <h4 className={cn(
          "text-sm font-semibold leading-snug mb-1.5",
          isSelecting ? "pl-6" : "pr-4",
          isCompleted ? "line-through text-muted-foreground" : "text-foreground",
        )}>
          {task.title}
        </h4>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{task.description}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium", tagColor(tag))}>
                <Tag className="h-2 w-2" />{tag}
              </span>
            ))}
            {tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{tags.length - 2}</span>}
          </div>
        )}

        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", badge.bg, badge.text)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />{badge.label}
            </span>
            {validDate && (
              <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium", overdue ? "text-rose-500" : soon ? "text-orange-500" : "text-muted-foreground/60")}>
                {overdue ? <AlertCircle className="h-2.5 w-2.5" /> : soon ? <Clock className="h-2.5 w-2.5" /> : <Calendar className="h-2.5 w-2.5" />}
                {formatCardDate(dateObj)}
              </span>
            )}
          </div>
          {task.supplier && (
            <div className="flex items-center gap-0.5 min-w-0">
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded bg-primary/10 shrink-0">
                <Building2 className="h-2 w-2 text-primary" />
              </div>
              <span className="text-[10px] text-primary/70 truncate max-w-[56px]">{task.supplier.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      {!isSelecting && (
        <div className={cn(
          "absolute top-2 right-2 flex gap-0.5",
          "opacity-30 sm:opacity-0 sm:group-hover:opacity-100",
          "transition-opacity bg-card/90 backdrop-blur-sm rounded-lg p-0.5 shadow border border-border/60"
        )}>
          <button onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} className="p-1.5 rounded-md hover:bg-muted" title={isCompleted ? "Reabrir" : "Concluir"}>
            {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 rounded-md hover:bg-muted" title="Editar">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground/50" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 rounded-md hover:bg-rose-50 hover:text-rose-500" title="Excluir">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground/50" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────

interface ColProps {
  col: ColumnDef;
  tasks: TaskWithSupplier[];
  draggingId: string | null;
  dragOverCol: ColumnId | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, colId: ColumnId) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, colId: ColumnId) => void;
  onToggle: (id: string) => void;
  onEdit: (t: TaskWithSupplier) => void;
  onDelete: (id: string) => void;
  onOpen: (t: TaskWithSupplier) => void;
  isSelecting?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}

function KanbanColumn({
  col, tasks, draggingId, dragOverCol,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onToggle, onEdit, onDelete, onOpen,
  isSelecting, selectedIds, onSelect,
}: ColProps) {
  const isOver = dragOverCol === col.id;
  const isDraggingAny = draggingId !== null;

  return (
    <div className="flex flex-col gap-2 min-h-[200px]">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
        col.headerBg,
        isOver && "ring-2 ring-primary/40",
      )}>
        <span className={cn("h-2 w-2 rounded-full shrink-0", col.accent)} />
        <span className="text-xs font-bold uppercase tracking-wide text-foreground/70 flex-1">{col.label}</span>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">{tasks.length}</span>
      </div>

      <div
        onDragOver={(e) => onDragOver(e, col.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, col.id)}
        className={cn(
          "flex flex-col gap-2 flex-1 rounded-xl p-1.5 -m-1.5 transition-all duration-150",
          isOver ? "bg-primary/6 ring-2 ring-primary/30 ring-dashed" : isDraggingAny ? "bg-muted/20 ring-1 ring-border/40 ring-dashed" : "",
        )}
      >
        {tasks.length === 0 ? (
          <div className={cn(
            "flex items-center justify-center flex-1 min-h-[80px] rounded-xl border border-dashed transition-all",
            isOver ? "border-primary/50 bg-primary/5" : "border-border/60",
          )}>
            <p className="text-xs text-muted-foreground/50 text-center px-2">
              {isOver ? "↓ Solte aqui" : col.emptyText}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <motion.div
                key={task.id} layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <KanbanCard
                  task={task} dragging={draggingId === task.id}
                  onDragStart={onDragStart} onDragEnd={onDragEnd}
                  onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onOpen={onOpen}
                  isSelecting={isSelecting} isSelected={selectedIds?.has(task.id)} onSelect={onSelect}
                />
              </motion.div>
            ))}
            {isOver && tasks.length > 0 && (
              <motion.div key="drop-line" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
                className="h-0.5 rounded-full bg-primary/40 mx-1" />
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── KanbanView ───────────────────────────────────────────────

export interface KanbanViewProps {
  tasks: TaskWithSupplier[];
  onUpdate: (id: string, patch: Partial<TaskWithSupplier>) => Promise<void>;
  onToggle: (id: string) => void;
  onEdit: (t: TaskWithSupplier) => void;
  onDelete: (id: string) => void;
  onOpen: (t: TaskWithSupplier) => void;
  isSelecting?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}

export function KanbanView({
  tasks, onUpdate, onToggle, onEdit, onDelete, onOpen,
  isSelecting, selectedIds, onSelect,
}: KanbanViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const columns = useMemo(
    () => COLUMNS.map((col) => ({ ...col, tasks: tasks.filter((t) => getColumnId(t) === col.id) })),
    [tasks],
  );

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", id);
    setTimeout(() => setDraggingId(id), 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverCol(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setDragOverCol(colId);
  }, []);

  const handleDragLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setDragOverCol(null), 80);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetColId: ColumnId) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("taskId");
      setDraggingId(null);
      setDragOverCol(null);
      if (!taskId) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task || getColumnId(task) === targetColId) return;

      const patch: Partial<TaskWithSupplier> = {};
      if (targetColId === "completed") {
        patch.status = "completed";
      } else {
        patch.status = "pending";
        patch.priority = targetColId as Priority;
      }
      await onUpdate(taskId, patch);
    },
    [tasks, onUpdate],
  );

  return (
    /*
      Mobile: flex horizontal com scroll snap.
        - overflow-x-auto com -mx-3 px-3 para sair da margem do main
        - cada coluna tem w-[82vw] para ficar centrada e mostrar "peek" da próxima
        - snap-x snap-mandatory para parar certinho em cada coluna
        - pb-4 para não cortar shadow dos cards
      Desktop: grid 4 colunas normal, sem scroll horizontal
    */
    <>
      {/* Mobile */}
      <div className="
        sm:hidden
        flex gap-3
        overflow-x-auto scrollbar-none
        snap-x snap-mandatory
        -mx-3 px-3
        pb-4
      ">
        {columns.map((col, i) => (
          <div
            key={col.id}
            className="snap-center snap-always shrink-0 w-[82vw]"
            // Último card: padding direito para mostrar que tem mais
            style={i === columns.length - 1 ? {} : {}}
          >
            <KanbanColumn
              col={col} tasks={col.tasks}
              draggingId={draggingId} dragOverCol={dragOverCol}
              onDragStart={handleDragStart} onDragEnd={handleDragEnd}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onOpen={onOpen}
              isSelecting={isSelecting} selectedIds={selectedIds} onSelect={onSelect}
            />
          </div>
        ))}
        {/* Padding final para o último card não colar na borda */}
        <div className="shrink-0 w-3" aria-hidden />
      </div>

      {/* Desktop */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-4 pb-6">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id} col={col} tasks={col.tasks}
            draggingId={draggingId} dragOverCol={dragOverCol}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onOpen={onOpen}
            isSelecting={isSelecting} selectedIds={selectedIds} onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
}
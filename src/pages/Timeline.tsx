// src/pages/Timeline.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CalendarDays, Clock,
  Zap, CheckCircle2, Circle, StickyNote, BarChart3, RefreshCw,
  Timer, Tag, FileText, X, CalendarClock, TrendingUp, Layers, Plus,
  CalendarCheck, AlarmClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  useTimeline, useDayScheduled, useWeekTimeline, useMonthTimeline,
  toHHMM, timeToPercent, diffMinutes,
} from "@/hooks/useTimeline";
import type { TimelineEntry, ScheduledTask } from "@/hooks/useTimeline";
import { formatSeconds, formatSecondsLong, formatClock } from "@/hooks/useTimer";
import {
  format, isToday, isYesterday, addDays, subDays,
  addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isSameMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { FeedbackOverlay } from "@/components/FeedbackOverlay";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { useTaskStore } from "@/hooks/useTaskStore";
import type { TaskFormData } from "@/types/task";

// ─── Config da grade ────────────────────────────────────────────
const H_START      = 6;
const H_END        = 23;
const PX_PER_HOUR  = 96;
const HOURS        = Array.from({ length: H_END - H_START + 1 }, (_, i) => H_START + i);
const TOTAL_HEIGHT = (H_END - H_START) * PX_PER_HOUR;

// ─── Paleta de prioridade ───────────────────────────────────────
const P = {
  high: {
    gradient: "from-rose-500 to-rose-600",
    bg:       "bg-rose-500",
    light:    "bg-rose-50 dark:bg-rose-950/50",
    border:   "border-rose-300 dark:border-rose-700/70",
    text:     "text-rose-600 dark:text-rose-400",
    badge:    "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
    dot:      "bg-rose-500",
    label:    "Alta",
    emoji:    "🔴",
    scheduled: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60",
    scheduledText: "text-rose-600 dark:text-rose-400",
  },
  medium: {
    gradient: "from-amber-400 to-amber-500",
    bg:       "bg-amber-400",
    light:    "bg-amber-50 dark:bg-amber-950/50",
    border:   "border-amber-300 dark:border-amber-700/70",
    text:     "text-amber-600 dark:text-amber-400",
    badge:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    dot:      "bg-amber-400",
    label:    "Média",
    emoji:    "🟡",
    scheduled: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
    scheduledText: "text-amber-600 dark:text-amber-400",
  },
  low: {
    gradient: "from-emerald-500 to-emerald-600",
    bg:       "bg-emerald-500",
    light:    "bg-emerald-50 dark:bg-emerald-950/50",
    border:   "border-emerald-300 dark:border-emerald-700/70",
    text:     "text-emerald-600 dark:text-emerald-400",
    badge:    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    dot:      "bg-emerald-500",
    label:    "Baixa",
    emoji:    "🟢",
    scheduled: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    scheduledText: "text-emerald-600 dark:text-emerald-400",
  },
} as const;

// ─── Helpers ────────────────────────────────────────────────────
function dayLabel(d: Date): string {
  if (isToday(d))     return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd 'de' MMMM", { locale: ptBR });
}
function minutesToPx(m: number) { return (m / 60) * PX_PER_HOUR; }
function isoToTopPx(iso: string) {
  const d = new Date(iso);
  return minutesToPx((d.getHours() - H_START) * 60 + d.getMinutes());
}
function dateToInputValue(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// ─── SectionCard ────────────────────────────────────────────────
function SectionCard({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-2 bg-muted/30">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

// ─── Modal de detalhes da entrada ───────────────────────────────
function EntryDetailModal({ entry, onClose }: { entry: TimelineEntry; onClose: () => void }) {
  const c        = P[entry.task_priority];
  const duration = entry.duration_seconds ?? 0;
  const estimated    = entry.task_estimated_hours ? entry.task_estimated_hours * 3600 : null;
  const totalTracked = entry.task_total_tracked_seconds ?? 0;
  const progressPct  = estimated ? Math.min(100, Math.round((totalTracked / estimated) * 100)) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit   ={{ opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-card border border-border/80 shadow-2xl shadow-black/25 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("relative px-6 pt-6 pb-5 shrink-0", c.light)}>
          <button onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 hover:bg-background transition-colors shadow-sm">
            <X className="h-4 w-4 text-foreground/60" />
          </button>
          <div className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold mb-3", c.badge)}>
            <span>{c.emoji}</span><span>Prioridade {c.label}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground leading-snug pr-10 mb-2">{entry.task_title}</h2>
          <div className="flex items-center gap-2">
            {entry.task_status === "completed"
              ? <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Tarefa concluída</span></>
              : <><Circle className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Tarefa em andamento</span></>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <SectionCard icon={<Timer className="h-4 w-4 text-muted-foreground" />} label="Esta sessão">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Início",  value: toHHMM(entry.started_at) },
                { label: "Duração", value: formatSeconds(duration), colored: true },
                { label: "Fim",     value: entry.ended_at ? toHHMM(entry.ended_at) : "—" },
              ].map(({ label, value, colored }, i) => (
                <div key={label} className={cn("text-center", i === 1 && "border-x border-border/40")}>
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">{label}</p>
                  <p className={cn("text-lg font-bold font-mono tabular-nums", colored ? c.text : "text-foreground")}>{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} label="Tempo total na tarefa">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Acumulado em todas as sessões</span>
              <span className={cn("text-base font-bold font-mono tabular-nums", c.text)}>
                {totalTracked > 0 ? formatSecondsLong(totalTracked) : "—"}
              </span>
            </div>
            {progressPct !== null && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{progressPct}% do estimado</span>
                  <span>{formatSecondsLong(estimated!)} estimado</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={cn("h-full rounded-full bg-gradient-to-r", c.gradient)} />
                </div>
              </div>
            )}
          </SectionCard>

          {entry.note && (
            <SectionCard icon={<StickyNote className="h-4 w-4 text-muted-foreground" />} label="Nota da sessão">
              <p className="text-sm text-foreground/80 leading-relaxed italic break-words whitespace-pre-wrap">"{entry.note}"</p>
            </SectionCard>
          )}
          {entry.task_description && (
            <SectionCard icon={<FileText className="h-4 w-4 text-muted-foreground" />} label="Descrição da tarefa">
              <p className="text-sm text-foreground/80 leading-relaxed break-words whitespace-pre-wrap">{entry.task_description}</p>
            </SectionCard>
          )}
          {entry.task_tags && entry.task_tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap px-1">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              {entry.task_tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">{tag}</span>
              ))}
            </div>
          )}
          {entry.task_notes && (
            <SectionCard icon={<Layers className="h-4 w-4 text-muted-foreground" />} label="Observações internas">
              <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{entry.task_notes}</p>
            </SectionCard>
          )}
          {entry.task_due_date && (
            <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
              <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">
                Vence em{" "}
                <strong className="text-foreground font-semibold">
                  {format(new Date(entry.task_due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </strong>
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Bloco de sessão rastreada (timeline vertical) ───────────────
function TimeBlock({ entry, index, onSelect, columnOffset = 0, columnWidth = 1 }: {
  entry: TimelineEntry;
  index: number;
  onSelect: (e: TimelineEntry) => void;
  columnOffset?: number;
  columnWidth?: number;
}) {
  const c         = P[entry.task_priority];
  const isRunning = !entry.ended_at;
  const topPx     = isoToTopPx(entry.started_at);
  const endISO    = entry.ended_at ?? new Date().toISOString();
  const mins      = diffMinutes(entry.started_at, endISO);
  const heightPx  = Math.max(minutesToPx(mins), 24);
  const isShort   = heightPx < 28;
  const isTall    = heightPx > 52;

  return (
    <motion.button
      initial={{ opacity: 0, scaleY: 0.5, x: -6 }}
      animate={{ opacity: 1, scaleY: 1,   x: 0  }}
      transition={{ delay: index * 0.045, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute", top: topPx, height: heightPx,
        left: `${columnOffset * 100}%`, width: `${columnWidth * 100}%`,
        transformOrigin: "top", paddingLeft: "3px", paddingRight: "3px",
      }}
      onClick={() => onSelect(entry)}
      className="group z-10"
    >
      <div className={cn(
        "relative h-full w-full rounded-lg border overflow-hidden transition-all duration-150 cursor-pointer",
        "hover:ring-2 hover:shadow-lg", c.light, c.border,
        isRunning && "ring-2 ring-primary/40 shadow-md shadow-primary/15",
      )}>
        <div className={cn("absolute left-0 inset-y-0 w-1 rounded-l-lg bg-gradient-to-b", c.gradient)} />

        <div className={cn(
          "absolute inset-0 pl-3 pr-2 flex flex-col overflow-hidden",
          isShort ? "justify-center py-0" : "justify-center py-1.5"
        )}>
          {!isShort && (
            <p className={cn("font-bold leading-tight text-[11px] break-words line-clamp-2 w-full", c.text)}>
              {entry.task_title}
            </p>
          )}
          {isTall && (
            <div className="flex items-center justify-between w-full mt-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/70 font-medium font-mono truncate">
                {toHHMM(entry.started_at)} → {entry.ended_at ? toHHMM(entry.ended_at) : "…"}
              </p>
              {entry.duration_seconds && (
                <p className={cn("text-[10px] font-bold font-mono ml-1 shrink-0", c.text)}>
                  {formatSeconds(entry.duration_seconds)}
                </p>
              )}
            </div>
          )}
        </div>

        {isRunning && (
          <motion.div className="absolute inset-0 bg-primary/10 rounded-lg"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors rounded-lg" />
      </div>
    </motion.button>
  );
}

// ─── Faixa de tarefa agendada (acima da grade, no dia) ───────────
function ScheduledTaskBanner({ task, onCreateTask }: {
  task: ScheduledTask;
  onCreateTask?: () => void;
}) {
  const c = P[task.task_priority];
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium",
        c.scheduled
      )}
    >
      <CalendarCheck className={cn("h-3.5 w-3.5 shrink-0", c.scheduledText)} />
      <div className="flex-1 min-w-0">
        <span className={cn("font-semibold truncate block", c.scheduledText)}>{task.task_title}</span>
        {task.task_description && (
          <span className="text-muted-foreground/70 truncate block text-[10px]">{task.task_description}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={cn("text-[10px] font-semibold uppercase tracking-wide opacity-70", c.scheduledText)}>
          Agendada
        </span>
        {task.task_status === "completed" && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        )}
      </div>
    </motion.div>
  );
}

// ─── Bloco de tarefa agendada com horário (na grade, tipo datetime) ─
function ScheduledTimeBlock({ task, index }: {
  task: ScheduledTask;
  index: number;
}) {
  const c = P[task.task_priority];

  // Converte "HH:MM" para minutos desde H_START
  function timeToMins(t: string) {
    const [h, m] = t.split(":").map(Number);
    return (h - H_START) * 60 + m;
  }

  const startMins  = timeToMins(task.task_scheduled_start ?? "00:00");
  const endMins    = timeToMins(task.task_scheduled_end   ?? "01:00");
  const durationM  = Math.max(endMins - startMins, 15); // mínimo 15 min para visibilidade
  const topPx      = minutesToPx(startMins);
  const heightPx   = minutesToPx(durationM);
  const isShort    = heightPx < 36;
  const isTall     = heightPx > 60;

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.6, x: -6 }}
      animate={{ opacity: 1, scaleY: 1,   x: 0  }}
      transition={{ delay: index * 0.045, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute",
        top: topPx,
        height: heightPx,
        left: 0,
        right: 0,
        transformOrigin: "top",
        paddingLeft: "3px",
        paddingRight: "3px",
        zIndex: 8,
      }}
    >
      <div className={cn(
        "relative h-full w-full rounded-lg border overflow-hidden",
        c.scheduled, c.border,
        "border-dashed opacity-90",
      )}>
        <div className={cn("absolute left-0 inset-y-0 w-1 rounded-l-lg bg-gradient-to-b opacity-60", c.gradient)} />
        <div className={cn(
          "absolute inset-0 pl-3 pr-2 flex flex-col overflow-hidden",
          isShort ? "justify-center" : "justify-center py-1.5"
        )}>
          <div className="flex items-center gap-1.5 min-w-0">
            <AlarmClock className={cn("h-3 w-3 shrink-0 opacity-70", c.scheduledText)} />
            <p className={cn("font-bold leading-tight text-[11px] truncate flex-1", c.scheduledText)}>
              {task.task_title}
            </p>
            {task.task_status === "completed" && (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            )}
          </div>
          {isTall && (
            <p className={cn("text-[10px] font-mono mt-0.5 opacity-60", c.scheduledText)}>
              {task.task_scheduled_start} → {task.task_scheduled_end}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}


function HourGrid({ entries, scheduledDatetime = [], showCurrentTime, currentTimePct, onSelect, onClickHour }: {
  entries: TimelineEntry[];
  scheduledDatetime?: ScheduledTask[];
  showCurrentTime: boolean;
  currentTimePct: number;
  onSelect: (e: TimelineEntry) => void;
  onClickHour?: (hour: number) => void;
}) {
  const currentTopPx = (currentTimePct / 100) * TOTAL_HEIGHT;

  const columns: TimelineEntry[][] = [];
  for (const entry of entries) {
    const startMs = new Date(entry.started_at).getTime();
    let placed = false;
    for (const col of columns) {
      const last    = col[col.length - 1];
      const lastEnd = last.ended_at ? new Date(last.ended_at).getTime() : Date.now();
      if (startMs >= lastEnd) { col.push(entry); placed = true; break; }
    }
    if (!placed) columns.push([entry]);
  }
  const totalCols = Math.max(1, columns.length);

  return (
    <div className="flex flex-1 min-w-0">
      {/* Coluna de horas */}
      <div className="w-16 shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
        {HOURS.map((h, i) => (
          <div key={h} className="absolute w-full flex items-start justify-end pr-3"
            style={{ top: i * PX_PER_HOUR - 9 }}>
            <span className="text-xs font-mono text-muted-foreground/50 font-semibold">
              {String(h).padStart(2, "0")}h
            </span>
          </div>
        ))}
      </div>

      {/* Área dos blocos */}
      <div className="flex-1 relative" style={{ height: TOTAL_HEIGHT }}>
        {HOURS.map((h, i) => (
          <div key={i}>
            <div className="absolute left-0 right-0 border-t border-border/25 group/hour"
              style={{ top: i * PX_PER_HOUR, height: PX_PER_HOUR }}>
              {onClickHour && (
                <button
                  className="absolute inset-0 w-full opacity-0 group-hover/hour:opacity-100 bg-primary/5 transition-opacity cursor-pointer flex items-center justify-end pr-3"
                  onClick={() => onClickHour(h)}
                >
                  <span className="text-[10px] text-primary/60 font-medium flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Nova tarefa
                  </span>
                </button>
              )}
            </div>
            <div className="absolute left-0 right-0 border-t border-border/10 border-dashed pointer-events-none"
              style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
          </div>
        ))}

        {showCurrentTime && (
          <motion.div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: currentTopPx }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-1.5">
              <motion.div className="h-3 w-3 rounded-full bg-primary shrink-0 -ml-1.5 shadow shadow-primary/40"
                animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <div className="flex-1 h-px bg-primary/60" />
              <span className="text-[10px] font-bold text-primary font-mono px-1.5 py-0.5 rounded bg-background/90 border border-primary/20">
                {toHHMM(new Date().toISOString())}
              </span>
            </div>
          </motion.div>
        )}

        {/* Tarefas agendadas com horário específico (datetime) na grade */}
        {scheduledDatetime.map((task, i) => (
          <ScheduledTimeBlock key={task.id} task={task} index={i} />
        ))}

        {columns.map((col, colIdx) =>
          col.map((entry, i) => (
            <TimeBlock key={entry.id} entry={entry} index={i + colIdx * 3}
              onSelect={onSelect} columnOffset={colIdx / totalCols} columnWidth={1 / totalCols} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── View Semanal ────────────────────────────────────────────────
function WeekView({ date, onSelectEntry, onClickSlot }: {
  date: Date;
  onSelectEntry: (e: TimelineEntry) => void;
  onClickSlot: (date: Date, hour: number) => void;
}) {
  const { entriesByDay, scheduledByDay, scheduledDatetimeByDay, loading } = useWeekTimeline(date);
  const days = eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 0 }),
    end:   endOfWeek(date,   { weekStartsOn: 0 }),
  });
  const now = new Date();
  const currentTimePct = timeToPercent(now.toISOString(), H_START, H_END);
  const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header dos dias */}
      <div className="flex border-b border-border/40">
        <div className="w-16 shrink-0" />
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const hasSched = (scheduledByDay[key] || []).length > 0 || (scheduledDatetimeByDay[key] || []).length > 0;
          return (
            <div key={i} className={cn("flex-1 text-center py-2.5 border-l border-border/20", isToday(day) && "bg-primary/5")}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{DAY_NAMES[i]}</p>
              <p className={cn("text-sm font-bold mt-0.5", isToday(day) ? "text-primary" : "text-foreground/70")}>
                {format(day, "d")}
              </p>
              {hasSched && (
                <div className="flex justify-center mt-1">
                  <div className="h-1 w-1 rounded-full bg-primary/60" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Faixas de tarefas do dia (allDay — sem horário) */}
      {days.some(d => (scheduledByDay[format(d, "yyyy-MM-dd")] || []).length > 0) && (
        <div className="flex border-b border-border/30 bg-muted/10">
          <div className="w-16 shrink-0 flex items-center justify-end pr-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 rotate-[-90deg] whitespace-nowrap">Dia</span>
          </div>
          {days.map((day, i) => {
            const key = format(day, "yyyy-MM-dd");
            const sched = scheduledByDay[key] || [];
            return (
              <div key={i} className="flex-1 border-l border-border/20 px-1 py-1 space-y-0.5 min-h-[28px]">
                {sched.map((t) => {
                  const c = P[t.task_priority];
                  return (
                    <div key={t.id}
                      className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded truncate border", c.scheduled, c.scheduledText)}>
                      📅 {t.task_title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Grade de horas */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "480px" }}>
        <div className="flex" style={{ minHeight: TOTAL_HEIGHT }}>
          <div className="w-16 shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
            {HOURS.map((h, i) => (
              <div key={h} className="absolute w-full flex items-start justify-end pr-3"
                style={{ top: i * PX_PER_HOUR - 9 }}>
                <span className="text-xs font-mono text-muted-foreground/50 font-semibold">
                  {String(h).padStart(2, "0")}h
                </span>
              </div>
            ))}
          </div>

          {days.map((day, di) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEntries = entriesByDay[key] || [];
            const dayDatetime = (scheduledDatetimeByDay[key] || []).filter(t => t.task_scheduled_start);
            const showNow = isToday(day) && currentTimePct >= 0 && currentTimePct <= 100;
            const currentTopPx = (currentTimePct / 100) * TOTAL_HEIGHT;

            const columns: TimelineEntry[][] = [];
            for (const entry of dayEntries) {
              const startMs = new Date(entry.started_at).getTime();
              let placed = false;
              for (const col of columns) {
                const last = col[col.length - 1];
                const lastEnd = last.ended_at ? new Date(last.ended_at).getTime() : Date.now();
                if (startMs >= lastEnd) { col.push(entry); placed = true; break; }
              }
              if (!placed) columns.push([entry]);
            }
            const totalCols = Math.max(1, columns.length);

            return (
              <div key={di}
                className={cn("flex-1 relative border-l border-border/20", isToday(day) && "bg-primary/3")}
                style={{ height: TOTAL_HEIGHT }}>
                {HOURS.map((h, i) => (
                  <div key={i}>
                    <div className="absolute left-0 right-0 border-t border-border/20 group/slot"
                      style={{ top: i * PX_PER_HOUR, height: PX_PER_HOUR }}>
                      <button className="absolute inset-0 w-full opacity-0 group-hover/slot:opacity-100 bg-primary/5 transition-opacity cursor-pointer"
                        onClick={() => onClickSlot(day, h)} />
                    </div>
                    <div className="absolute left-0 right-0 border-t border-border/10 border-dashed pointer-events-none"
                      style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
                  </div>
                ))}

                {showNow && (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: currentTopPx }}>
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 shadow shadow-primary/40" />
                    <div className="flex-1 h-px bg-primary/50" />
                  </div>
                )}

                {/* Tarefas com horário específico na grade semanal */}
                {!loading && dayDatetime.map((task, i) => (
                  <ScheduledTimeBlock key={task.id} task={task} index={i} />
                ))}

                {loading
                  ? <div className="absolute inset-0 bg-muted/10 animate-pulse rounded" />
                  : columns.map((col, colIdx) =>
                      col.map((entry, ei) => (
                        <TimeBlock key={entry.id} entry={entry} index={ei}
                          onSelect={onSelectEntry}
                          columnOffset={colIdx / totalCols} columnWidth={1 / totalCols} />
                      ))
                    )
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── View Mensal ─────────────────────────────────────────────────
function MonthView({ date, onClickDay }: {
  date: Date;
  onClickDay: (day: Date) => void;
}) {
  const { entriesByDay, scheduledByDay, scheduledDatetimeByDay, loading } = useMonthTimeline(date);
  const calStart = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
  const calEnd   = endOfWeek(endOfMonth(date),     { weekStartsOn: 0 });
  const allDays  = eachDayOfInterval({ start: calStart, end: calEnd });
  const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 border-b border-border/40">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {allDays.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, date);
          const isCurrentDay   = isToday(day);
          const key            = format(day, "yyyy-MM-dd");
          const trackedEntries    = entriesByDay[key] || [];
          const scheduledList     = scheduledByDay[key] || [];         // allDay
          const scheduledDtList   = scheduledDatetimeByDay[key] || []; // com horário

          // Combina: rastreadas + allDay + datetime
          const allItems = [
            ...trackedEntries.map(e  => ({ id: e.id,  title: e.task_title,  priority: e.task_priority, type: "tracked"   as const, time: null })),
            ...scheduledList.map(t   => ({ id: t.id,  title: t.task_title,  priority: t.task_priority, type: "allday"    as const, time: null })),
            ...scheduledDtList.map(t => ({ id: t.id,  title: t.task_title,  priority: t.task_priority, type: "datetime"  as const, time: t.task_scheduled_start ?? null })),
          ];

          const totalTrackedSecs = trackedEntries.reduce((acc, e) => acc + (e.duration_seconds ?? 0), 0);
          const totalMins = totalTrackedSecs / 60;

          return (
            <motion.button key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.005 }}
              onClick={() => onClickDay(day)}
              className={cn(
                "relative min-h-[88px] p-2 border-b border-r border-border/20 text-left",
                "transition-colors hover:bg-muted/40 cursor-pointer",
                !isCurrentMonth && "bg-muted/10",
                isCurrentDay && "bg-primary/5 ring-1 ring-inset ring-primary/20",
              )}
            >
              {/* Número do dia */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-bold leading-none",
                  isCurrentDay
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs"
                    : isCurrentMonth ? "text-foreground" : "text-muted-foreground/40"
                )}>
                  {format(day, "d")}
                </span>
                {totalMins > 0 && !loading && (
                  <span className="text-[9px] font-mono text-muted-foreground/60">
                    {totalMins >= 60
                      ? `${Math.floor(totalMins / 60)}h${Math.round(totalMins % 60).toString().padStart(2, "0")}`
                      : `${Math.round(totalMins)}m`}
                  </span>
                )}
              </div>

              {/* Itens do dia */}
              {!loading && allItems.length > 0 && (
                <div className="space-y-0.5">
                  {allItems.slice(0, 3).map((item) => {
                    const c = P[item.priority];
                    const prefix = item.type === "allday" ? "📅 " : item.type === "datetime" ? `⏰ ` : "";
                    return (
                      <div key={item.id} className={cn(
                        "text-[10px] leading-tight truncate px-1.5 py-0.5 rounded font-medium border",
                        item.type === "allday" || item.type === "datetime"
                          ? cn(c.scheduled, c.scheduledText, "border-dashed")
                          : cn(c.light, c.text, "border-transparent")
                      )}>
                        {prefix}{item.type === "datetime" && item.time ? `${item.time} ` : ""}{item.title}
                      </div>
                    );
                  })}
                  {allItems.length > 3 && (
                    <div className="text-[10px] text-muted-foreground/60 px-1">
                      +{allItems.length - 3} mais
                    </div>
                  )}
                </div>
              )}

              {loading && (
                <div className="absolute inset-2 top-7 rounded bg-muted/30 animate-pulse" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────
type ViewMode = "day" | "week" | "month";

export default function Timeline() {
  const navigate    = useNavigate();
  const scrollRef   = useRef<HTMLDivElement>(null);
  const { addTask } = useTaskStore();

  const [viewMode, setViewMode]           = useState<ViewMode>("day");
  const [currentDate, setCurrentDate]     = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);

  const { feedback, trigger: triggerFeedback, clear: clearFeedback } = useActionFeedback();
  const [createOpen, setCreateOpen]               = useState(false);
  const [prefilledDueDate, setPrefilledDueDate]   = useState<string>("");

  const { entries, loading, summary, refetch }     = useTimeline(currentDate);
  const { scheduled, allDay, datetime: scheduledDatetime, refetch: refetchScheduled } = useDayScheduled(currentDate);

  const now             = new Date();
  const currentTimePct  = timeToPercent(now.toISOString(), H_START, H_END);
  const showCurrentTime = isToday(currentDate) && viewMode === "day" && currentTimePct >= 0 && currentTimePct <= 100;

  useEffect(() => {
    if (viewMode !== "day" || loading || !scrollRef.current) return;
    const top    = (currentTimePct / 100) * TOTAL_HEIGHT;
    const target = Math.max(0, top - scrollRef.current.clientHeight / 2);
    scrollRef.current.scrollTo({ top: target, behavior: "smooth" });
  }, [loading, currentTimePct, viewMode]);

  function refetchAll() { refetch(); refetchScheduled(); }

  // ── Navegação ──
  function goBack() {
    if (viewMode === "day")   setCurrentDate((d) => subDays(d, 1));
    if (viewMode === "week")  setCurrentDate((d) => subWeeks(d, 1));
    if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
  }
  function goForward() {
    if (viewMode === "day")   setCurrentDate((d) => addDays(d, 1));
    if (viewMode === "week")  setCurrentDate((d) => addWeeks(d, 1));
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
  }

  function periodLabel(): string {
    if (viewMode === "day") return dayLabel(currentDate);
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate,   { weekStartsOn: 0 });
      return `${format(ws, "d MMM", { locale: ptBR })} – ${format(we, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  }
  function periodSubLabel(): string {
    if (viewMode === "day") return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      return `Semana ${format(ws, "w")} de ${format(ws, "yyyy")}`;
    }
    return `${format(startOfMonth(currentDate), "d")} a ${format(endOfMonth(currentDate), "d 'de' MMMM", { locale: ptBR })}`;
  }

  function handleClickHour(hour: number, day?: Date) {
    const targetDay = day ?? currentDate;
    setPrefilledDueDate(dateToInputValue(targetDay));
    setCreateOpen(true);
  }

  function handleClickMonthDay(day: Date) {
    setCurrentDate(day);
    setViewMode("day");
  }

  async function handleCreateTask(data: TaskFormData) {
    await addTask({ ...data, due_date: prefilledDueDate || data.due_date });
    setCreateOpen(false);
    triggerFeedback("task-created");
    refetchAll();
  }

  function dateToInputValue(d: Date): string {
    return format(d, "yyyy-MM-dd");
  }

  const summaryCards = [
    { icon: <Clock className="h-4 w-4 text-primary" />, label: "Tempo total",
      value: summary.totalSeconds > 0 ? formatSecondsLong(summary.totalSeconds) : "—",
      sub: summary.totalSeconds > 0 ? formatClock(summary.totalSeconds) : null },
    { icon: <BarChart3 className="h-4 w-4 text-violet-500" />, label: "Sessões",
      value: summary.blockCount > 0 ? String(summary.blockCount) : "—", sub: null },
    { icon: <Zap className="h-4 w-4 text-amber-500" />, label: "Tarefas",
      value: summary.uniqueTasks > 0 ? String(summary.uniqueTasks) : "—", sub: null },
    { icon: <CalendarClock className="h-4 w-4 text-emerald-500" />, label: "Período",
      value: summary.firstStart && summary.lastEnd
        ? `${toHHMM(summary.firstStart)} – ${toHHMM(summary.lastEnd)}` : "—", sub: null },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Feedback visual de criação */}
      <FeedbackOverlay type={feedback.type} onDone={clearFeedback} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-md shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight leading-none">Calendário</p>
              <p className="text-xs text-muted-foreground mt-0.5">Planejamento e visualização de tarefas</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="default" onClick={() => handleClickHour(new Date().getHours())}
              className="h-8 px-3 rounded-xl gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nova tarefa</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={refetchAll}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 flex flex-col flex-1 py-6 space-y-5">

        {/* ── Seletor de modo + navegação ── */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center rounded-xl border border-border/60 bg-card p-1 gap-0.5">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}>
                {mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 justify-center">
            <Button variant="ghost" size="sm" onClick={goBack}
              className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[180px]">
              <motion.p key={`${viewMode}-${currentDate.toDateString()}`}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-foreground leading-tight capitalize">
                {periodLabel()}
              </motion.p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{periodSubLabel()}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={goForward}
              className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}
            className={cn(
              "h-8 px-3 rounded-xl text-xs font-semibold border-border/60",
              isToday(currentDate) && viewMode === "day" && "opacity-40 pointer-events-none"
            )}>
            Hoje
          </Button>
        </div>

        {/* ── Cards de resumo (só no modo dia) ── */}
        {viewMode === "day" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summaryCards.map((card, i) => (
              <motion.div key={card.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-border/60 bg-card px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {card.icon}
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground font-mono tabular-nums leading-tight">{card.value}</p>
                {card.sub && <p className="text-xs text-muted-foreground font-mono">{card.sub}</p>}
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Conteúdo da view ── */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden flex-1">
          <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">
                {viewMode === "day" ? "Linha do tempo" : viewMode === "week" ? "Visão semanal" : "Visão mensal"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground/60 hidden sm:block">
              {viewMode === "month" ? "Clique em um dia para ver detalhes" : "Clique em um horário para criar tarefa"}
            </span>
          </div>

          {/* ── View: Dia ── */}
          {viewMode === "day" && (
            <div>
              {/* Faixa de tarefas do dia (sem horário definido — schedule_type="date") */}
              {allDay.length > 0 && (
                <div className="px-4 pt-3 pb-2 border-b border-border/30 space-y-1.5 bg-muted/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Tarefas do dia — {isToday(currentDate) ? "hoje" : dayLabel(currentDate)}
                    </span>
                  </div>
                  {allDay.map((task) => (
                    <ScheduledTaskBanner key={task.id} task={task} />
                  ))}
                </div>
              )}

              <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: "560px" }}>
                <div className="px-4 py-4">
                  {loading ? (
                    <div className="relative" style={{ height: TOTAL_HEIGHT }}>
                      {[{ top: 130, h: 90 }, { top: 260, h: 64 }, { top: 400, h: 130 }].map((s, i) => (
                        <div key={i} className="absolute rounded-lg bg-muted/40 animate-pulse"
                          style={{ top: s.top, height: s.h, left: 68, right: 8 }} />
                      ))}
                    </div>
                  ) : entries.length === 0 && scheduled.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 mb-4 ring-1 ring-primary/10">
                        <CalendarDays className="h-7 w-7 text-primary/40" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 text-base">Nenhuma sessão registrada</h3>
                      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-4">
                        {isToday(currentDate)
                          ? "Use o cronômetro em uma tarefa para ver os blocos aparecerem aqui."
                          : "Nenhum tempo foi registrado neste dia."}
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleClickHour(9)}
                        className="rounded-xl gap-2 text-xs font-semibold">
                        <Plus className="h-3.5 w-3.5" />
                        Criar tarefa para este dia
                      </Button>
                    </motion.div>
                  ) : (
                    <HourGrid entries={entries} scheduledDatetime={scheduledDatetime}
                      showCurrentTime={showCurrentTime}
                      currentTimePct={currentTimePct} onSelect={setSelectedEntry}
                      onClickHour={(h) => handleClickHour(h)} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── View: Semana ── */}
          {viewMode === "week" && (
            <WeekView date={currentDate} onSelectEntry={setSelectedEntry}
              onClickSlot={(day, hour) => handleClickHour(hour, day)} />
          )}

          {/* ── View: Mês ── */}
          {viewMode === "month" && (
            <MonthView date={currentDate} onClickDay={handleClickMonthDay} />
          )}
        </div>

        {/* ── Legenda ── */}
        {viewMode !== "month" && (
          <div className="flex items-center gap-5 justify-center py-1">
            {(["high", "medium", "low"] as const).map((p) => (
              <div key={p} className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", P[p].bg)} />
                <span className="text-sm text-muted-foreground">{P[p].label}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal de detalhes ── */}
      <AnimatePresence>
        {selectedEntry && (
          <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>

      {/* ── Modal de criação ── */}
      <TaskFormDialog open={createOpen} onOpenChange={setCreateOpen}
        onSubmit={handleCreateTask} editTask={null} />
    </div>
  );
}
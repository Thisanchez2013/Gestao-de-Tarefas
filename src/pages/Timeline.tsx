// src/pages/Timeline.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CalendarDays, Clock,
  Zap, CheckCircle2, Circle, StickyNote, BarChart3, RefreshCw,
  Timer, Tag, FileText, X, CalendarClock, TrendingUp, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTimeline, toHHMM, timeToPercent, diffMinutes } from "@/hooks/useTimeline";
import { formatSeconds, formatSecondsLong, formatClock } from "@/hooks/useTimer";
import { format, isToday, isYesterday, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TimelineEntry } from "@/hooks/useTimeline";
import { cn } from "@/lib/utils";

// ─── Configuração da grade ─────────────────────────────────────
const H_START      = 6;
const H_END        = 23;
const PX_PER_HOUR  = 96;   // altura generosa — ~1.6rem por 10 min
const HOURS        = Array.from({ length: H_END - H_START + 1 }, (_, i) => H_START + i);
const TOTAL_HEIGHT = (H_END - H_START) * PX_PER_HOUR;

// ─── Paleta por prioridade ─────────────────────────────────────
const P = {
  high: {
    gradient: "from-rose-500 to-rose-600",
    bg:       "bg-rose-500",
    light:    "bg-rose-50 dark:bg-rose-950/50",
    border:   "border-rose-300 dark:border-rose-700/70",
    text:     "text-rose-600 dark:text-rose-400",
    ring:     "ring-rose-400/40",
    badge:    "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
    label:    "Alta",
    emoji:    "🔴",
  },
  medium: {
    gradient: "from-amber-400 to-amber-500",
    bg:       "bg-amber-400",
    light:    "bg-amber-50 dark:bg-amber-950/50",
    border:   "border-amber-300 dark:border-amber-700/70",
    text:     "text-amber-600 dark:text-amber-400",
    ring:     "ring-amber-400/40",
    badge:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    label:    "Média",
    emoji:    "🟡",
  },
  low: {
    gradient: "from-emerald-500 to-emerald-600",
    bg:       "bg-emerald-500",
    light:    "bg-emerald-50 dark:bg-emerald-950/50",
    border:   "border-emerald-300 dark:border-emerald-700/70",
    text:     "text-emerald-600 dark:text-emerald-400",
    ring:     "ring-emerald-400/40",
    badge:    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    label:    "Baixa",
    emoji:    "🟢",
  },
} as const;

// ─── Helpers ───────────────────────────────────────────────────
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

// ─── Bloco separador de seção no modal ────────────────────────
function SectionCard({ icon, label, children }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
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

// ─── Modal de detalhes ─────────────────────────────────────────
function EntryDetailModal({ entry, onClose }: { entry: TimelineEntry; onClose: () => void }) {
  const c        = P[entry.task_priority];
  const duration = entry.duration_seconds ?? 0;
  const estimated    = entry.task_estimated_hours ? entry.task_estimated_hours * 3600 : null;
  const totalTracked = entry.task_total_tracked_seconds ?? 0;
  const progressPct  = estimated ? Math.min(100, Math.round((totalTracked / estimated) * 100)) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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

        {/* ── Cabeçalho colorido ─── */}
        <div className={cn("relative px-6 pt-6 pb-5 shrink-0", c.light)}>
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 hover:bg-background transition-colors shadow-sm"
          >
            <X className="h-4 w-4 text-foreground/60" />
          </button>

          {/* Badge prioridade */}
          <div className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold mb-3", c.badge)}>
            <span>{c.emoji}</span>
            <span>Prioridade {c.label}</span>
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-foreground leading-snug pr-10 mb-2">
            {entry.task_title}
          </h2>

          {/* Status */}
          <div className="flex items-center gap-2">
            {entry.task_status === "completed" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Tarefa concluída</span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tarefa em andamento</span>
              </>
            )}
          </div>
        </div>

        {/* ── Corpo scrollável ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Trio início / duração / fim */}
          <SectionCard
            icon={<Timer className="h-4 w-4 text-muted-foreground" />}
            label="Esta sessão"
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Início",  value: toHHMM(entry.started_at) },
                { label: "Duração", value: formatSeconds(duration), colored: true },
                { label: "Fim",     value: entry.ended_at ? toHHMM(entry.ended_at) : "—" },
              ].map(({ label, value, colored }, i) => (
                <div key={label} className={cn("text-center", i === 1 && "border-x border-border/40")}>
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">{label}</p>
                  <p className={cn("text-lg font-bold font-mono tabular-nums", colored ? c.text : "text-foreground")}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Tempo total acumulado */}
          <SectionCard
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            label="Tempo total na tarefa"
          >
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
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={cn("h-full rounded-full bg-gradient-to-r", c.gradient)}
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* Nota da sessão */}
          {entry.note && (
            <SectionCard
              icon={<StickyNote className="h-4 w-4 text-muted-foreground" />}
              label="Nota da sessão"
            >
              <p className="text-sm text-foreground/80 leading-relaxed italic break-words whitespace-pre-wrap">
                "{entry.note}"
              </p>
            </SectionCard>
          )}

          {/* Descrição */}
          {entry.task_description && (
            <SectionCard
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              label="Descrição da tarefa"
            >
              <p className="text-sm text-foreground/80 leading-relaxed break-words whitespace-pre-wrap">
                {entry.task_description}
              </p>
            </SectionCard>
          )}

          {/* Etiquetas */}
          {entry.task_tags && entry.task_tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap px-1">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              {entry.task_tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Observações internas */}
          {entry.task_notes && (
            <SectionCard
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              label="Observações internas"
            >
              <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                {entry.task_notes}
              </p>
            </SectionCard>
          )}

          {/* Data de vencimento */}
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

// ─── Bloco vertical de tempo ──────────────────────────────────
function TimeBlock({ entry, index, onSelect, columnOffset = 0, columnWidth = 1 }: {
  entry: TimelineEntry;
  index: number;
  onSelect: (e: TimelineEntry) => void;
  columnOffset?: number;
  columnWidth?: number;
}) {
  const c        = P[entry.task_priority];
  const isRunning = !entry.ended_at;
  const topPx    = isoToTopPx(entry.started_at);
  const endISO   = entry.ended_at ?? new Date().toISOString();
  const mins     = diffMinutes(entry.started_at, endISO);
  const heightPx = Math.max(minutesToPx(mins), 24);
  const isTall   = heightPx > 52;
  const isShort  = heightPx < 36;

  return (
    <motion.button
      initial={{ opacity: 0, scaleY: 0.5, x: -6 }}
      animate={{ opacity: 1, scaleY: 1,   x: 0  }}
      transition={{ delay: index * 0.045, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position:      "absolute",
        top:           topPx,
        height:        heightPx,
        left:          `${columnOffset * 100}%`,
        width:         `${columnWidth * 100}%`,
        transformOrigin: "top",
        paddingLeft:   "3px",
        paddingRight:  "3px",
      }}
      onClick={() => onSelect(entry)}
      className="group z-10"
    >
      <div className={cn(
        "relative h-full w-full rounded-lg border overflow-hidden transition-all duration-150 cursor-pointer",
        "hover:ring-2 hover:shadow-lg",
        c.light, c.border,
        isRunning && "ring-2 ring-primary/40 shadow-md shadow-primary/15",
      )}>
        {/* Barra lateral */}
        <div className={cn("absolute left-0 inset-y-0 w-1 rounded-l-lg bg-gradient-to-b", c.gradient)} />

        {/* Texto */}
        <div className={cn("pl-3 pr-2 flex flex-col justify-center h-full overflow-hidden", isShort ? "py-0" : "py-1.5")}>
          {!isShort && (
            <p className={cn("font-bold leading-tight truncate", isTall ? "text-xs" : "text-[11px]", c.text)}>
              {entry.task_title}
            </p>
          )}
          {isTall && (
            <p className="text-[10px] text-muted-foreground/70 font-medium mt-0.5 truncate font-mono">
              {toHHMM(entry.started_at)} → {entry.ended_at ? toHHMM(entry.ended_at) : "…"}
            </p>
          )}
          {isTall && entry.duration_seconds && (
            <p className={cn("text-[10px] font-bold mt-0.5 font-mono", c.text)}>
              {formatSeconds(entry.duration_seconds)}
            </p>
          )}
        </div>

        {/* Pulse em andamento */}
        {isRunning && (
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-lg"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors rounded-lg" />
      </div>
    </motion.button>
  );
}

// ─── Grade de horas vertical ──────────────────────────────────
function HourGrid({ entries, showCurrentTime, currentTimePct, onSelect }: {
  entries: TimelineEntry[];
  showCurrentTime: boolean;
  currentTimePct: number;
  onSelect: (e: TimelineEntry) => void;
}) {
  const currentTopPx = (currentTimePct / 100) * TOTAL_HEIGHT;

  // Detecta sobreposições → colunas
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
          <div
            key={h}
            className="absolute w-full flex items-start justify-end pr-3"
            style={{ top: i * PX_PER_HOUR - 9 }}
          >
            <span className="text-xs font-mono text-muted-foreground/50 font-semibold">
              {String(h).padStart(2, "0")}h
            </span>
          </div>
        ))}
      </div>

      {/* Área dos blocos */}
      <div className="flex-1 relative" style={{ height: TOTAL_HEIGHT }}>
        {/* Linhas de hora e meia hora */}
        {HOURS.map((_, i) => (
          <div key={i}>
            <div className="absolute left-0 right-0 border-t border-border/25" style={{ top: i * PX_PER_HOUR }} />
            <div className="absolute left-0 right-0 border-t border-border/10 border-dashed" style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
          </div>
        ))}

        {/* Indicador hora atual */}
        {showCurrentTime && (
          <motion.div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: currentTopPx }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-1.5">
              <motion.div
                className="h-3 w-3 rounded-full bg-primary shrink-0 -ml-1.5 shadow shadow-primary/40"
                animate={{ scale: [1, 1.35, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="flex-1 h-px bg-primary/60" />
              <span className="text-[10px] font-bold text-primary font-mono px-1.5 py-0.5 rounded bg-background/90 border border-primary/20">
                {toHHMM(new Date().toISOString())}
              </span>
            </div>
          </motion.div>
        )}

        {/* Blocos */}
        {columns.map((col, colIdx) =>
          col.map((entry, i) => (
            <TimeBlock
              key={entry.id}
              entry={entry}
              index={i + colIdx * 3}
              onSelect={onSelect}
              columnOffset={colIdx / totalCols}
              columnWidth={1 / totalCols}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function Timeline() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const { entries, loading, summary, refetch } = useTimeline(currentDate);

  const now              = new Date();
  const currentTimePct   = timeToPercent(now.toISOString(), H_START, H_END);
  const showCurrentTime  = isToday(currentDate) && currentTimePct >= 0 && currentTimePct <= 100;

  useEffect(() => {
    if (!loading && scrollRef.current) {
      const top    = (currentTimePct / 100) * TOTAL_HEIGHT;
      const target = Math.max(0, top - scrollRef.current.clientHeight / 2);
      scrollRef.current.scrollTo({ top: target, behavior: "smooth" });
    }
  }, [loading, currentTimePct]);

  const summaryCards = [
    {
      icon:  <Clock className="h-4 w-4 text-primary" />,
      label: "Tempo total",
      value: summary.totalSeconds > 0 ? formatSecondsLong(summary.totalSeconds) : "—",
      sub:   summary.totalSeconds > 0 ? formatClock(summary.totalSeconds) : null,
    },
    {
      icon:  <BarChart3 className="h-4 w-4 text-violet-500" />,
      label: "Sessões",
      value: summary.blockCount > 0 ? String(summary.blockCount) : "—",
      sub:   null,
    },
    {
      icon:  <Zap className="h-4 w-4 text-amber-500" />,
      label: "Tarefas",
      value: summary.uniqueTasks > 0 ? String(summary.uniqueTasks) : "—",
      sub:   null,
    },
    {
      icon:  <CalendarClock className="h-4 w-4 text-emerald-500" />,
      label: "Período",
      value: summary.firstStart && summary.lastEnd
        ? `${toHHMM(summary.firstStart)} – ${toHHMM(summary.lastEnd)}`
        : "—",
      sub: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

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
              <p className="text-base font-bold tracking-tight leading-none">Timeline</p>
              <p className="text-xs text-muted-foreground mt-0.5">Distribuição do seu dia em tarefas</p>
            </div>
          </div>

          <div className="ml-auto">
            <Button size="icon" variant="ghost" onClick={refetch}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 flex flex-col flex-1 py-6 space-y-5">

        {/* ── Navegação de datas ── */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm"
            onClick={() => setCurrentDate((d) => subDays(d, 1))}
            className="h-9 px-4 rounded-xl gap-2 text-muted-foreground hover:text-foreground hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-sm font-medium">Anterior</span>
          </Button>

          <div className="text-center">
            <motion.p
              key={currentDate.toDateString()}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-foreground leading-tight"
            >
              {dayLabel(currentDate)}
            </motion.p>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">
              {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          <Button variant="ghost" size="sm"
            onClick={() => setCurrentDate((d) => addDays(d, 1))}
            disabled={isToday(currentDate)}
            className="h-9 px-4 rounded-xl gap-2 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30">
            <span className="hidden sm:inline text-sm font-medium">Próximo</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Cards de resumo ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border/60 bg-card px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                {card.icon}
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground font-mono tabular-nums leading-tight">
                {card.value}
              </p>
              {card.sub && (
                <p className="text-xs text-muted-foreground font-mono">{card.sub}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Grade vertical ── */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden flex-1">

          {/* Cabeçalho */}
          <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">
                Linha do tempo
              </span>
            </div>
            <span className="text-xs text-muted-foreground/60 hidden sm:block">
              Clique em um bloco para ver os detalhes
            </span>
          </div>

          {/* Scroll vertical */}
          <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: "560px" }}>
            <div className="px-4 py-4">
              {loading ? (
                <div className="relative" style={{ height: TOTAL_HEIGHT }}>
                  {[{ top: 130, h: 90 }, { top: 260, h: 64 }, { top: 400, h: 130 }].map((s, i) => (
                    <div key={i} className="absolute rounded-lg bg-muted/40 animate-pulse"
                      style={{ top: s.top, height: s.h, left: 68, right: 8 }} />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 mb-4 ring-1 ring-primary/10">
                    <CalendarDays className="h-7 w-7 text-primary/40" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 text-base">Nenhuma sessão registrada</h3>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    {isToday(currentDate)
                      ? "Use o cronômetro em uma tarefa para ver os blocos aparecerem aqui."
                      : "Nenhum tempo foi registrado neste dia."}
                  </p>
                </motion.div>
              ) : (
                <HourGrid
                  entries={entries}
                  showCurrentTime={showCurrentTime}
                  currentTimePct={currentTimePct}
                  onSelect={setSelectedEntry}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Legenda ── */}
        {entries.length > 0 && (
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

      {/* ── Modal ── */}
      <AnimatePresence>
        {selectedEntry && (
          <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
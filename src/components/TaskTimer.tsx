// src/components/TaskTimer.tsx
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Square, Trash2, Timer, FileText,
  Clock, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, BarChart3, Calendar, Pencil,
  Download, Copy, X, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimer, formatClock, formatSeconds, formatSecondsLong } from "@/hooks/useTimer";
import { useSettings } from "@/hooks/useSettings";
import { useI18n } from "@/hooks/useI18n";
import type { Task, TimeEntry } from "@/types/task";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Props {
  task: Task;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

// ─── Paleta de cores por sessão ───────────────────────────────
const SESSION_COLORS = [
  { bg: "bg-violet-500", light: "bg-violet-100 dark:bg-violet-950/60", text: "text-violet-600 dark:text-violet-300" },
  { bg: "bg-sky-500",    light: "bg-sky-100 dark:bg-sky-950/60",        text: "text-sky-600 dark:text-sky-300" },
  { bg: "bg-emerald-500",light: "bg-emerald-100 dark:bg-emerald-950/60",text: "text-emerald-600 dark:text-emerald-300" },
  { bg: "bg-amber-500",  light: "bg-amber-100 dark:bg-amber-950/60",    text: "text-amber-600 dark:text-amber-300" },
  { bg: "bg-rose-500",   light: "bg-rose-100 dark:bg-rose-950/60",      text: "text-rose-600 dark:text-rose-300" },
  { bg: "bg-fuchsia-500",light: "bg-fuchsia-100 dark:bg-fuchsia-950/60",text: "text-fuchsia-600 dark:text-fuchsia-300" },
];
function sessionColor(idx: number) { return SESSION_COLORS[idx % SESSION_COLORS.length]; }
function getBarWidth(entry: TimeEntry, total: number) {
  if (!total || !entry.duration_seconds) return 0;
  return Math.min((entry.duration_seconds / total) * 100, 100);
}

// ─── Formata ISO para input datetime-local ────────────────────
function toDatetimeLocal(iso: string): string {
  try {
    const d = parseISO(iso);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch { return ""; }
}

// ─── Converte datetime-local para ISO ─────────────────────────
function fromDatetimeLocal(val: string): string {
  try { return new Date(val).toISOString(); }
  catch { return new Date().toISOString(); }
}

// ══════════════════════════════════════════════════════════════
// MODAL DE EDIÇÃO DE SESSÃO
// ══════════════════════════════════════════════════════════════
function EditSessionModal({
  entry,
  index,
  onSave,
  onClose,
}: {
  entry: TimeEntry;
  index: number;
  onSave: (patch: { started_at: string; ended_at: string; note: string }) => void;
  onClose: () => void;
}) {
  const color = sessionColor(index);
  const [startVal, setStartVal] = useState(toDatetimeLocal(entry.started_at));
  const [endVal,   setEndVal]   = useState(toDatetimeLocal(entry.ended_at ?? entry.started_at));
  const [noteVal,  setNoteVal]  = useState(entry.note ?? "");
  const [saving,   setSaving]   = useState(false);

  // Calcula duração em tempo real conforme o usuário muda os campos
  const startMs = startVal ? new Date(startVal).getTime() : 0;
  const endMs   = endVal   ? new Date(endVal).getTime()   : 0;
  const previewSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));

  const isValid_ = startMs > 0 && endMs > 0 && endMs > startMs;

  const handleSave = async () => {
    if (!isValid_) return;
    setSaving(true);
    await onSave({
      started_at: fromDatetimeLocal(startVal),
      ended_at:   fromDatetimeLocal(endVal),
      note: noteVal,
    });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{ opacity: 0, scale: 0.92,    y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header do modal */}
        <div className={`h-1 w-full ${color.bg}`} />
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${color.light} ${color.text}`}>
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Editar Sessão</p>
              <p className="text-[10px] text-muted-foreground">Altere horários, duração ou descrição</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Início */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Início
            </label>
            <input
              type="datetime-local"
              value={startVal}
              onChange={(e) => setStartVal(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Fim */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Fim
            </label>
            <input
              type="datetime-local"
              value={endVal}
              onChange={(e) => setEndVal(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Preview da duração */}
          <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
            !isValid_
              ? "bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40"
              : "bg-primary/5 border border-primary/15"
          }`}>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Duração calculada
            </span>
            {isValid_ ? (
              <span className={`text-sm font-black font-mono tabular-nums ${color.text}`}>
                {formatSecondsLong(previewSecs)}
              </span>
            ) : (
              <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Horário inválido
              </span>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Descrição <span className="normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={noteVal}
              onChange={(e) => setNoteVal(e.target.value)}
              placeholder="Ex: Análise inicial, correção do SQL..."
              rows={2}
              className="w-full resize-none rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/40 bg-muted/20 flex items-center gap-2">
          <Button
            className="flex-1 gap-2 h-9 rounded-xl"
            disabled={!isValid_ || saving}
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Button variant="outline" className="h-9 px-4 rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// MENU DE EXPORTAÇÃO
// ══════════════════════════════════════════════════════════════
function ExportMenu({
  entries,
  taskTitle,
  totalTracked,
  onClose,
}: {
  entries: TimeEntry[];
  taskTitle: string;
  totalTracked: number;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const buildText = useCallback(() => {
    const lines = [
      `Relatório de Tempo — ${taskTitle}`,
      `Total acumulado: ${formatSecondsLong(totalTracked)}`,
      `Sessões: ${entries.length}`,
      `${"─".repeat(40)}`,
      ...([...entries].reverse().map((e, i) => {
        const start = isValid(new Date(e.started_at)) ? format(new Date(e.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";
        const end   = e.ended_at && isValid(new Date(e.ended_at)) ? format(new Date(e.ended_at), "HH:mm") : "—";
        const dur   = formatSeconds(e.duration_seconds ?? 0);
        const note  = e.note ? `\n   📝 ${e.note}` : "";
        return `#${i + 1}  ${start} → ${end}  (${dur})${note}`;
      })),
    ];
    return lines.join("\n");
  }, [entries, taskTitle, totalTracked]);

  const buildCsv = useCallback(() => {
    const header = "Sessão;Data;Início;Fim;Duração (seg);Duração;Descrição";
    const rows = [...entries].reverse().map((e, i) => {
      const start = new Date(e.started_at);
      const end   = e.ended_at ? new Date(e.ended_at) : null;
      return [
        i + 1,
        isValid(start) ? format(start, "dd/MM/yyyy") : "",
        isValid(start) ? format(start, "HH:mm") : "",
        end && isValid(end) ? format(end, "HH:mm") : "",
        e.duration_seconds ?? 0,
        formatSeconds(e.duration_seconds ?? 0),
        `"${(e.note ?? "").replace(/"/g, '""')}"`,
      ].join(";");
    });
    return [header, ...rows].join("\n");
  }, [entries]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(buildText());
    toast({ title: "Copiado!", description: "Relatório copiado para a área de transferência." });
    onClose();
  };

  const handleDownloadCsv = () => {
    const blob = new Blob(["\uFEFF" + buildCsv()], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `sessoes-${taskTitle.slice(0, 30).replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV baixado!" });
    onClose();
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([buildText()], { type: "text/plain;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `sessoes-${taskTitle.slice(0, 30).replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "TXT baixado!" });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{ opacity: 0, scale: 0.92,    y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-xs bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <Download className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Exportar Sessões</p>
              <p className="text-[10px] text-muted-foreground">{entries.length} sessões · {formatSecondsLong(totalTracked)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={handleCopyText}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/60 transition-colors text-left group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/40 group-hover:bg-sky-200 dark:group-hover:bg-sky-950/60 transition-colors">
              <Copy className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Copiar como texto</p>
              <p className="text-[11px] text-muted-foreground">Cola em qualquer lugar — e-mail, chat, doc</p>
            </div>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/60 transition-colors text-left group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-950/60 transition-colors">
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Baixar CSV</p>
              <p className="text-[11px] text-muted-foreground">Abre no Excel, Google Sheets, Numbers</p>
            </div>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/60 transition-colors text-left group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40 group-hover:bg-violet-200 dark:group-hover:bg-violet-950/60 transition-colors">
              <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Baixar TXT</p>
              <p className="text-[11px] text-muted-foreground">Relatório legível em texto puro</p>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// CARD DE SESSÃO
// ══════════════════════════════════════════════════════════════
function SessionCard({
  entry, index, total, onDelete, onEdit,
}: {
  entry: TimeEntry; index: number; total: number;
  onDelete: () => void; onEdit: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color    = sessionColor(index);
  const startDate = new Date(entry.started_at);
  const endDate   = entry.ended_at ? new Date(entry.ended_at) : null;
  const barW      = getBarWidth(entry, total);
  const duration  = entry.duration_seconds ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{ opacity: 0, x: -20,   scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="group relative rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border hover:shadow-sm transition-all duration-200"
    >
      {/* Faixa lateral colorida */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.bg}`} />

      <div className="pl-4 pr-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Número */}
            <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${color.light} ${color.text}`}>
              {index + 1}
            </span>
            <div className="min-w-0">
              {/* Horários */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-foreground tabular-nums font-mono">
                  {isValid(startDate) ? format(startDate, "dd/MM", { locale: ptBR }) : "—"}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {isValid(startDate) ? format(startDate, "HH:mm") : "—"}
                </span>
                {endDate && isValid(endDate) && (
                  <>
                    <span className="text-muted-foreground/40 text-[10px]">→</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {format(endDate, "HH:mm")}
                    </span>
                  </>
                )}
              </div>
              {/* Nota */}
              {entry.note && (
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 italic line-clamp-2">
                  {entry.note}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Duração */}
            <span className={`text-xs font-bold tabular-nums font-mono px-2 py-0.5 rounded-lg ${color.light} ${color.text}`}>
              {formatSeconds(duration)}
            </span>

            {/* Ações — aparecem no hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Editar */}
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground/50 transition-colors"
                title="Editar sessão"
              >
                <Pencil className="h-3 w-3" />
              </button>

              {/* Deletar */}
              <AnimatePresence mode="wait">
                {confirmDelete ? (
                  <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-0.5">
                    <button onClick={onDelete} className="text-[10px] font-bold text-rose-600 hover:text-rose-700 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors">
                      Sim
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors">
                      Não
                    </button>
                  </motion.div>
                ) : (
                  <motion.button key="trash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setConfirmDelete(true)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50 transition-colors"
                    title="Remover sessão"
                  >
                    <Trash2 className="h-3 w-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Barra de proporção */}
        {barW > 0 && (
          <div className="mt-2.5 h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${color.bg} opacity-60`}
              initial={{ width: 0 }}
              animate={{ width: `${barW}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 * index }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Mini timeline ────────────────────────────────────────────
function SessionTimeline({ entries, total }: { entries: TimeEntry[]; total: number }) {
  if (entries.length < 2 || !total) return null;
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-muted gap-px">
      {[...entries].reverse().map((e, i) => {
        const w     = getBarWidth(e, total);
        const color = sessionColor(entries.length - 1 - i);
        return (
          <motion.div
            key={e.id}
            className={`h-full ${color.bg} opacity-75`}
            style={{ width: `${w}%` }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: i * 0.07, ease: "easeOut" }}
            title={formatSeconds(e.duration_seconds ?? 0)}
          />
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export function TaskTimer({ task, onUpdate }: Props) {
  const { settings } = useSettings();
  const t = useI18n();
  const isSessionMode = settings.system.task_time_mode === "session_based";

  // Se o módulo de cronômetro estiver desativado, não renderiza nada
  if (!settings.timer.enabled) return null;

  const {
    isRunning, elapsed, totalTracked, timeEntries, loadingEntries,
    start, stop, discard, deleteEntry, editEntry,
  } = useTimer({ task, onUpdate });

  const [showHistory,    setShowHistory]    = useState(true);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [showNoteInput,  setShowNoteInput]  = useState(false);
  const [note,           setNote]           = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Edição
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const editingIndex = editingEntry
    ? timeEntries.length - 1 - timeEntries.findIndex((e) => e.id === editingEntry.id)
    : 0;

  // Exportação
  const [showExport, setShowExport] = useState(false);

  const estimatedSeconds    = (task.estimated_hours ?? 0) * 3600;
  const trackedWithCurrent  = totalTracked + (isRunning ? elapsed : 0);
  const progress            = estimatedSeconds > 0 ? Math.min((trackedWithCurrent / estimatedSeconds) * 100, 100) : 0;
  const isOverEstimate      = estimatedSeconds > 0 && trackedWithCurrent > estimatedSeconds;
  const sessionCount        = timeEntries.length;

  const handleStopClick = () => {
    if (isSessionMode) { setShowNoteInput(true); setTimeout(() => noteRef.current?.focus(), 80); }
    else stop(undefined);
  };
  const handleConfirmStop = async () => { setShowNoteInput(false); await stop(note); setNote(""); };
  const handleCancelNote  = () => { setShowNoteInput(false); setNote(""); };

  const handleEditSave = async (patch: { started_at: string; ended_at: string; note: string }) => {
    if (!editingEntry) return;
    await editEntry(editingEntry.id, editingEntry.duration_seconds ?? 0, patch);
    setEditingEntry(null);
  };

  return (
    <>
      {/* ── Modais fora do fluxo normal ── */}
      <AnimatePresence>
        {editingEntry && (
          <EditSessionModal
            entry={editingEntry}
            index={editingIndex}
            onSave={handleEditSave}
            onClose={() => setEditingEntry(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showExport && (
          <ExportMenu
            entries={timeEntries}
            taskTitle={task.title}
            totalTracked={totalTracked}
            onClose={() => setShowExport(false)}
          />
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div className="px-4 pt-3.5 pb-3 border-b border-border/40 bg-gradient-to-r from-muted/40 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                <Timer className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-bold text-foreground tracking-tight">Controle de Tempo</span>
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${
                isSessionMode
                  ? "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"
                  : "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300"
              }`}>
                {isSessionMode ? t.sessionMode : t.simpleMode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão exportar — só aparece se tiver sessões e exportação habilitada */}
              {isSessionMode && sessionCount > 0 && settings.timer.exportEnabled && (
                <button
                  onClick={() => setShowExport(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                  title="Exportar sessões"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              )}

              {/* Toggle histórico — controlado por settings.timer.showSessionHistory */}
              {isSessionMode && sessionCount > 0 && settings.timer.showSessionHistory && (
                <button
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BarChart3 className="h-3 w-3" />
                  {sessionCount} {sessionCount === 1 ? "sessão" : "sessões"}
                  {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}

              <AnimatePresence>
                {isRunning && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >
                    <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
                    {t.liveLabel}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ══ PAINEL TIMER ════════════════════════════════════ */}
        <div className="p-4 space-y-3">

          {/* Relógio + botão */}
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.04 }}
              onClick={isRunning ? handleStopClick : start}
              disabled={showNoteInput}
              className={`
                relative shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl
                shadow-lg transition-colors duration-200 disabled:opacity-50
                ${isRunning
                  ? "bg-rose-500 hover:bg-rose-600 shadow-rose-300/50 dark:shadow-rose-900/60"
                  : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-300/50 dark:shadow-emerald-900/60"
                }
              `}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isRunning ? (
                  <motion.span key="stop" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    <Square className="h-5 w-5 fill-white text-white" />
                  </motion.span>
                ) : (
                  <motion.span key="play" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    <Play className="h-5 w-5 fill-white text-white translate-x-0.5" />
                  </motion.span>
                )}
              </AnimatePresence>
              {isRunning && (
                <motion.span
                  className="absolute inset-0 rounded-2xl bg-rose-400 -z-10"
                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </motion.button>

            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {isRunning ? (
                  <motion.div key="running" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                    <div className="font-mono text-[2rem] font-black tabular-nums tracking-tighter text-emerald-600 dark:text-emerald-400 leading-none">
                      {formatClock(elapsed)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground/60" />
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        sessão atual{isSessionMode && sessionCount > 0 && ` · #${sessionCount + 1}`}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                    <div className="font-mono text-[2rem] font-black tabular-nums tracking-tighter text-muted-foreground/25 leading-none">
                      00:00:00
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wider">
                        {isSessionMode
                          ? sessionCount > 0 ? `${sessionCount} sessão(ões) registrada(s)` : "nenhuma sessão ainda"
                          : "pronto para iniciar"}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {isRunning && !showNoteInput && (
                <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                  <Button size="sm" variant="ghost"
                    className="h-8 px-2.5 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={() => setConfirmDiscard(true)}>
                    Descartar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nota ao parar */}
          <AnimatePresence>
            {isSessionMode && showNoteInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-3.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-primary">O que você fez nesta sessão?</span>
                    <span className="ml-auto text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">opcional</span>
                  </div>
                  <textarea
                    ref={noteRef} value={note} onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleConfirmStop();
                      if (e.key === "Escape") handleCancelNote();
                    }}
                    placeholder="Ex: Análise inicial do problema, correção do SQL, validação com cliente..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-border/50 bg-background/80 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-7 text-xs px-3 gap-1.5 rounded-lg" onClick={handleConfirmStop}>
                      <CheckCircle2 className="h-3 w-3" /> Salvar sessão
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-3 rounded-lg text-muted-foreground" onClick={handleCancelNote}>
                      Continuar
                    </Button>
                    <span className="text-[9px] text-muted-foreground/40 ml-auto hidden sm:inline">⌘↵ para salvar</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Total acumulado */}
          <div className={`flex items-center justify-between rounded-xl px-3.5 py-3 border transition-colors ${
            trackedWithCurrent > 0
              ? isOverEstimate
                ? "bg-rose-50/60 border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/40"
                : "bg-primary/[0.04] border-primary/15"
              : "bg-muted/30 border-border/40"
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                trackedWithCurrent > 0
                  ? isOverEstimate ? "bg-rose-100 dark:bg-rose-950/40" : "bg-primary/10"
                  : "bg-muted"
              }`}>
                <Timer className={`h-3.5 w-3.5 ${
                  trackedWithCurrent > 0
                    ? isOverEstimate ? "text-rose-500" : "text-primary"
                    : "text-muted-foreground/30"
                }`} />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tempo total acumulado</div>
                <div className={`text-sm font-black tabular-nums font-mono leading-tight ${
                  trackedWithCurrent > 0
                    ? isOverEstimate ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                    : "text-muted-foreground/30"
                }`}>
                  {trackedWithCurrent > 0 ? formatSecondsLong(trackedWithCurrent) : "Nenhum tempo ainda"}
                </div>
              </div>
            </div>
            {estimatedSeconds > 0 && (
              <div className="text-right">
                <div className={`text-sm font-black tabular-nums ${isOverEstimate ? "text-rose-500" : "text-primary"}`}>
                  {Math.round(progress)}%
                </div>
                <div className="text-[10px] text-muted-foreground">de {task.estimated_hours}h</div>
              </div>
            )}
          </div>

          {/* Barra de progresso */}
          {estimatedSeconds > 0 && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isOverEstimate ? "bg-rose-500" : "bg-primary"}`}
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">0h</span>
                {isOverEstimate && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    +{formatSeconds(trackedWithCurrent - estimatedSeconds)} além da estimativa
                  </motion.span>
                )}
                <span className="text-[10px] text-muted-foreground">{task.estimated_hours}h</span>
              </div>
            </div>
          )}

          {/* Confirmar descarte */}
          <AnimatePresence>
            {confirmDiscard && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">Descartar esta sessão sem salvar?</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="destructive" className="h-7 text-xs px-3 rounded-lg" onClick={() => { discard(); setConfirmDiscard(false); }}>Descartar</Button>
                    <Button size="sm" variant="outline"      className="h-7 text-xs px-3 rounded-lg" onClick={() => setConfirmDiscard(false)}>Cancelar</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ HISTÓRICO ═══════════════════════════════════════ */}
        <AnimatePresence>
          {isSessionMode && showHistory && settings.timer.showSessionHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/40 bg-muted/20">
                {/* Sub-header */}
                <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Histórico de Atuações
                    </span>
                  </div>
                  {sessionCount > 0 && totalTracked > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {sessionCount} {sessionCount === 1 ? "atuação" : "atuações"} · {formatSecondsLong(totalTracked)}
                    </span>
                  )}
                </div>

                {/* Timeline */}
                {sessionCount > 1 && totalTracked > 0 && (
                  <div className="px-4 pb-3 space-y-1">
                    <SessionTimeline entries={timeEntries} total={totalTracked} />
                    <div className="flex gap-3 flex-wrap">
                      {[...timeEntries].reverse().slice(0, 6).map((e, i) => (
                        <span key={e.id} className={`text-[9px] font-bold ${sessionColor(i).text}`}>
                          #{i + 1} {formatSeconds(e.duration_seconds ?? 0)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de sessões */}
                <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
                  {loadingEntries ? (
                    <div className="space-y-2">
                      {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />)}
                    </div>
                  ) : sessionCount === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-6 gap-2">
                      <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center">
                        <Clock className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        Nenhuma sessão registrada ainda.<br />
                        <span className="text-muted-foreground/50">Inicie o timer para começar a registrar.</span>
                      </p>
                    </motion.div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {timeEntries.map((entry, i) => (
                        <SessionCard
                          key={entry.id}
                          entry={entry}
                          index={timeEntries.length - 1 - i}
                          total={totalTracked}
                          onDelete={() => deleteEntry(entry.id, entry.duration_seconds ?? 0)}
                          onEdit={() => setEditingEntry(entry)}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
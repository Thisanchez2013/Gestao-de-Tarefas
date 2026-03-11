// src/components/TaskTimer.tsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Trash2, ChevronDown, ChevronUp, Timer, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimer, formatClock, formatSeconds, formatSecondsLong } from "@/hooks/useTimer";
import type { Task } from "@/types/task";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  task: Task;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

export function TaskTimer({ task, onUpdate }: Props) {
  const {
    isRunning,
    elapsed,
    totalTracked,
    timeEntries,
    loadingEntries,
    start,
    stop,
    discard,
    deleteEntry,
  } = useTimer({ task, onUpdate });

  const [showHistory, setShowHistory] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Fluxo de parar: primeiro pede a nota, depois salva
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const estimatedSeconds = (task.estimated_hours ?? 0) * 3600;
  const trackedWithCurrent = totalTracked + (isRunning ? elapsed : 0);
  const progress =
    estimatedSeconds > 0 ? Math.min((trackedWithCurrent / estimatedSeconds) * 100, 100) : 0;
  const isOverEstimate = estimatedSeconds > 0 && trackedWithCurrent > estimatedSeconds;

  // Clique no botão Stop — abre o campo de nota antes de salvar
  const handleStopClick = () => {
    setShowNoteInput(true);
    setTimeout(() => noteRef.current?.focus(), 80);
  };

  // Confirma parar e salva a nota
  const handleConfirmStop = async () => {
    setShowNoteInput(false);
    await stop(note);
    setNote("");
  };

  // Cancela o campo de nota (mantém cronômetro rodando)
  const handleCancelNote = () => {
    setShowNoteInput(false);
    setNote("");
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tempo Rastreado
          </span>
          <AnimatePresence>
            {isRunning && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                AO VIVO
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {timeEntries.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {timeEntries.length} {timeEntries.length === 1 ? "sessão" : "sessões"}
            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* ── Corpo principal ──────────────────────────────── */}
      <div className="p-4 space-y-3">

        {/* Bloco central: tempo + botão */}
        <div className="flex items-center gap-4">

          {/* Botão Play/Stop */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={isRunning ? handleStopClick : start}
            disabled={showNoteInput}
            className={`
              relative flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full
              shadow-lg transition-colors duration-200 disabled:opacity-60
              ${isRunning
                ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200/80 dark:shadow-rose-950"
                : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200/80 dark:shadow-emerald-950"
              }
            `}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isRunning ? (
                <motion.span key="stop" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Square className="h-4 w-4 fill-white text-white" />
                </motion.span>
              ) : (
                <motion.span key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Play className="h-4 w-4 fill-white text-white translate-x-0.5" />
                </motion.span>
              )}
            </AnimatePresence>
            {isRunning && !showNoteInput && (
              <motion.span
                className="absolute inset-0 rounded-full bg-rose-400 -z-10"
                animate={{ scale: [1, 1.5], opacity: [0.35, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
          </motion.button>

          {/* Displays de tempo */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.div
                  key="running"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                >
                  <div className="font-mono text-3xl font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">
                    {formatClock(elapsed)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">
                    sessão atual
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                >
                  <div className="font-mono text-3xl font-bold tabular-nums tracking-tight text-muted-foreground/40 leading-none">
                    00:00:00
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 mt-0.5 font-medium uppercase tracking-wide">
                    pronto para iniciar
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Botão descartar */}
          <AnimatePresence>
            {isRunning && !showNoteInput && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDiscard(true)}
                >
                  Descartar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Campo de nota ao parar ────────────────────── */}
        <AnimatePresence>
          {showNoteInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-3 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-primary">
                    O que você fez nesta sessão?
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">opcional</span>
                </div>
                <textarea
                  ref={noteRef}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleConfirmStop();
                    if (e.key === "Escape") handleCancelNote();
                  }}
                  placeholder="Ex: Refatoração do componente TaskCard, correção do filtro..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs px-3 gap-1.5"
                    onClick={handleConfirmStop}
                  >
                    <Square className="h-2.5 w-2.5 fill-current" />
                    Salvar e parar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-3 text-muted-foreground"
                    onClick={handleCancelNote}
                  >
                    Continuar
                  </Button>
                  <span className="text-[9px] text-muted-foreground/50 ml-auto">
                    ⌘↵ para salvar
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Total acumulado — sempre visível ─────────── */}
        <div className={`
          flex items-center justify-between rounded-lg px-3 py-2.5
          ${totalTracked > 0 || isRunning
            ? "bg-primary/5 border border-primary/10"
            : "bg-muted/30 border border-border/40"
          }
        `}>
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-md flex items-center justify-center ${
              totalTracked > 0 || isRunning ? "bg-primary/10" : "bg-muted"
            }`}>
              <Timer className={`h-3 w-3 ${totalTracked > 0 || isRunning ? "text-primary" : "text-muted-foreground/40"}`} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total gasto
              </div>
              <div className={`text-sm font-bold tabular-nums font-mono ${
                totalTracked > 0 || isRunning ? "text-foreground" : "text-muted-foreground/40"
              }`}>
                {trackedWithCurrent > 0
                  ? formatSecondsLong(trackedWithCurrent)
                  : "Nenhum tempo registrado"}
              </div>
            </div>
          </div>

          {estimatedSeconds > 0 && (
            <div className="text-right">
              <div className={`text-xs font-bold tabular-nums ${
                isOverEstimate ? "text-rose-500" : "text-primary"
              }`}>
                {Math.round(progress)}%
              </div>
              <div className="text-[10px] text-muted-foreground">
                de {task.estimated_hours}h
              </div>
            </div>
          )}
        </div>

        {/* ── Barra de progresso ────────────────────────── */}
        {estimatedSeconds > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors ${
                  isOverEstimate ? "bg-rose-500" : "bg-primary"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            {isOverEstimate && (
              <p className="text-[10px] text-rose-500 font-medium">
                ⚠ Excedeu a estimativa em {formatSeconds(trackedWithCurrent - estimatedSeconds)}
              </p>
            )}
          </div>
        )}

        {/* ── Confirmar descarte ───────────────────────── */}
        <AnimatePresence>
          {confirmDiscard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 p-3">
                <p className="text-xs text-rose-700 dark:text-rose-300 mb-2 font-medium">
                  Descartar esta sessão sem salvar?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs px-3"
                    onClick={() => { discard(); setConfirmDiscard(false); }}
                  >
                    Sim, descartar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-3"
                    onClick={() => setConfirmDiscard(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Histórico de sessões ─────────────────────────── */}
      <AnimatePresence>
        {showHistory && timeEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sessões registradas
                </span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {loadingEntries ? (
                  <div className="text-xs text-muted-foreground py-2">Carregando...</div>
                ) : (
                  timeEntries.map((entry) => {
                    const startDate = new Date(entry.started_at);
                    const endDate = entry.ended_at ? new Date(entry.ended_at) : null;
                    return (
                      <div
                        key={entry.id}
                        className="rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors group"
                      >
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Duração em destaque */}
                            <span className="text-xs font-bold text-foreground tabular-nums font-mono w-14 shrink-0">
                              {formatSeconds(entry.duration_seconds ?? 0)}
                            </span>
                            {/* Horários — contraste legível em light e dark */}
                            <span className="text-[11px] text-foreground/70 dark:text-foreground/80 tabular-nums truncate font-medium">
                              {isValid(startDate)
                                ? format(startDate, "dd/MM HH:mm", { locale: ptBR })
                                : "—"}
                              {endDate && isValid(endDate) && (
                                <>
                                  <span className="mx-1 text-muted-foreground">→</span>
                                  {format(endDate, "HH:mm")}
                                </>
                              )}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteEntry(entry.id, entry.duration_seconds ?? 0)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground shrink-0"
                            title="Remover sessão"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Nota da sessão — exibida abaixo se existir */}
                        {entry.note && (
                          <div className="px-3 pb-2 flex items-start gap-1.5">
                            <FileText className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-foreground/70 dark:text-foreground/60 leading-relaxed italic">
                              {entry.note}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// src/hooks/useTimer.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TimeEntry } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";

interface UseTimerOptions {
  task: Task;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

// ─── Helpers de formatação (exportados) ──────────────────────
export function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatSecondsLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (s > 0 && h === 0) parts.push(`${s}s`);
  return parts.length > 0 ? parts.join(" ") : "0s";
}

// ─── Sons do cronômetro ───────────────────────────────────────
function playBeep(type: "start" | "stop") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = type === "start" ? 880 : 440;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignora se AudioContext não disponível
  }
}

// ════════════════════════════════════════════════════════════
export function useTimer({ task, onUpdate }: UseTimerOptions) {
  const { toast } = useToast();
  const { settings } = useSettings();

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [localRunning, setLocalRunning] = useState<boolean>(
    !!task.timer_running && !!task.timer_started_at
  );
  const [localStartedAt, setLocalStartedAt] = useState<string | null>(
    task.timer_started_at ?? null
  );
  const [localTotal, setLocalTotal] = useState<number>(
    task.total_tracked_seconds ?? 0
  );
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Alerta de sessão longa
  const longAlertFiredRef = useRef(false);

  const prevTaskIdRef = useRef(task.id);
  useEffect(() => {
    if (prevTaskIdRef.current !== task.id) {
      prevTaskIdRef.current = task.id;
      setLocalRunning(!!task.timer_running && !!task.timer_started_at);
      setLocalStartedAt(task.timer_started_at ?? null);
      setLocalTotal(task.total_tracked_seconds ?? 0);
      longAlertFiredRef.current = false;
    }
  }, [task.id, task.timer_running, task.timer_started_at, task.total_tracked_seconds]);

  useEffect(() => {
    if (localRunning && localStartedAt) {
      const diff = Math.floor(
        (Date.now() - new Date(localStartedAt).getTime()) / 1000
      );
      setElapsed(Math.max(0, diff));
    } else {
      setElapsed(0);
    }
  }, [localRunning, localStartedAt]);

  // Tick do cronômetro + alerta de sessão longa
  useEffect(() => {
    if (localRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;

          // Verificar alerta de sessão longa
          if (
            settings.timer.alertOnLongSession &&
            !longAlertFiredRef.current
          ) {
            const threshold = settings.timer.longSessionThresholdMinutes * 60;
            if (next >= threshold) {
              longAlertFiredRef.current = true;
              toast({
                title: "⏰ Sessão longa",
                description: `Você está trabalhando há ${settings.timer.longSessionThresholdMinutes} minutos nesta tarefa.`,
              });
            }
          }

          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [localRunning, settings.timer.alertOnLongSession, settings.timer.longSessionThresholdMinutes, toast]);

  // Carregar entradas de tempo (modo sessão)
  const loadEntries = useCallback(async () => {
    if (settings.system.task_time_mode !== "session_based") return;
    try {
      setLoadingEntries(true);
      const { data } = await supabase
        .from("time_entries")
        .select("*")
        .eq("task_id", task.id)
        .order("started_at", { ascending: false });
      if (data) setTimeEntries(data as TimeEntry[]);
    } catch {
      // silencia
    } finally {
      setLoadingEntries(false);
    }
  }, [task.id, settings.system.task_time_mode]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // ── START ──────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (localRunning) return;
    const startedAt = new Date().toISOString();
    longAlertFiredRef.current = false;

    // Som de início
    if (settings.timer.soundEnabled) playBeep("start");

    setLocalRunning(true);
    setLocalStartedAt(startedAt);

    const patch: Partial<Task> = {
      timer_running: true,
      timer_started_at: startedAt,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await supabase
        .from("tasks")
        .update(patch)
        .eq("id", task.id)
        .eq("user_id", user.id);
      onUpdate(task.id, patch);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao iniciar timer", description: err.message });
      setLocalRunning(false);
      setLocalStartedAt(null);
    }
  }, [localRunning, task.id, onUpdate, toast, settings.timer.soundEnabled]);

  // ── STOP ───────────────────────────────────────────────────
  const stop = useCallback(async (note?: string) => {
    if (!localRunning || !localStartedAt) return;

    const endedAt = new Date().toISOString();
    const startMs = new Date(localStartedAt).getTime();
    const duration = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    const newTotal = localTotal + duration;

    // Som de parada
    if (settings.timer.soundEnabled) playBeep("stop");

    setLocalRunning(false);
    setLocalStartedAt(null);
    setLocalTotal(newTotal);

    const patch: Partial<Task> = {
      timer_running: false,
      timer_started_at: null,
      total_tracked_seconds: newTotal,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase
        .from("tasks")
        .update(patch)
        .eq("id", task.id)
        .eq("user_id", user.id);

      if (settings.system.task_time_mode === "session_based") {
        const entry = {
          task_id: task.id,
          user_id: user.id,
          started_at: localStartedAt,
          ended_at: endedAt,
          duration_seconds: duration,
          note: note ?? null,
        };
        const { data: newEntry } = await supabase
          .from("time_entries")
          .insert(entry)
          .select()
          .single();
        if (newEntry) {
          setTimeEntries((prev) => [newEntry as TimeEntry, ...prev]);
        }
      }

      onUpdate(task.id, patch);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao parar timer", description: err.message });
    }
  }, [localRunning, localStartedAt, localTotal, task.id, onUpdate, toast, settings.system.task_time_mode, settings.timer.soundEnabled]);

  // ── DISCARD ────────────────────────────────────────────────
  const discard = useCallback(async () => {
    setLocalRunning(false);
    setLocalStartedAt(null);
    const patch: Partial<Task> = {
      timer_running: false,
      timer_started_at: null,
    };
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("tasks").update(patch).eq("id", task.id).eq("user_id", user.id);
      onUpdate(task.id, patch);
    } catch { }
  }, [task.id, onUpdate]);

  // ── DELETE ENTRY ───────────────────────────────────────────
  const deleteEntry = useCallback(async (entryId: string, duration: number) => {
    setTimeEntries((prev) => prev.filter((e) => e.id !== entryId));
    const newTotal = Math.max(0, localTotal - duration);
    setLocalTotal(newTotal);
    const patch: Partial<Task> = { total_tracked_seconds: newTotal };
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("time_entries").delete().eq("id", entryId).eq("user_id", user.id);
      await supabase.from("tasks").update(patch).eq("id", task.id).eq("user_id", user.id);
      onUpdate(task.id, patch);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao remover sessão", description: err.message });
    }
  }, [task.id, localTotal, onUpdate, toast]);

  // ── EDIT ENTRY ─────────────────────────────────────────────
  const editEntry = useCallback(async (
    entryId: string,
    oldDuration: number,
    patch: { started_at: string; ended_at: string; note: string }
  ) => {
    const newDuration = Math.max(
      0,
      Math.floor((new Date(patch.ended_at).getTime() - new Date(patch.started_at).getTime()) / 1000)
    );
    const totalDelta = newDuration - oldDuration;
    const newTotal   = Math.max(0, localTotal + totalDelta);

    setTimeEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, ...patch, duration_seconds: newDuration }
          : e
      )
    );
    setLocalTotal(newTotal);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("time_entries")
        .update({ ...patch, duration_seconds: newDuration })
        .eq("id", entryId)
        .eq("user_id", user.id);
      const taskPatch: Partial<Task> = { total_tracked_seconds: newTotal };
      await supabase.from("tasks").update(taskPatch).eq("id", task.id).eq("user_id", user.id);
      onUpdate(task.id, taskPatch);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao editar sessão", description: err.message });
    }
  }, [task.id, localTotal, onUpdate, toast]);

  return {
    isRunning: localRunning,
    elapsed,
    totalTracked: localTotal,
    timeEntries,
    loadingEntries,
    start,
    stop,
    discard,
    deleteEntry,
    editEntry,
  };
}
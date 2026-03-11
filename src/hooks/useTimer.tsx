// src/hooks/useTimer.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TimeEntry } from "@/types/task";
import { useToast } from "@/hooks/use-toast";

interface UseTimerOptions {
  task: Task;
  onUpdate: (id: string, data: Partial<Task>) => void;
}

export function useTimer({ task, onUpdate }: UseTimerOptions) {
  const { toast } = useToast();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Estado LOCAL do timer — não depende do task prop para re-renderizar
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

  // Sincroniza estado local quando a tarefa muda (troca de modal)
  const prevTaskIdRef = useRef(task.id);
  useEffect(() => {
    if (prevTaskIdRef.current !== task.id) {
      prevTaskIdRef.current = task.id;
      setLocalRunning(!!task.timer_running && !!task.timer_started_at);
      setLocalStartedAt(task.timer_started_at ?? null);
      setLocalTotal(task.total_tracked_seconds ?? 0);
    }
  }, [task.id, task.timer_running, task.timer_started_at, task.total_tracked_seconds]);

  // Calcula elapsed inicial quando começa a rodar
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

  // Tick do relógio
  useEffect(() => {
    if (localRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [localRunning]);

  // Busca as entradas de tempo da tarefa
  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("task_id", task.id)
        .order("started_at", { ascending: false });
      if (error) throw error;
      setTimeEntries(data || []);
    } catch {
      // silencia — tabela pode não existir ainda
    } finally {
      setLoadingEntries(false);
    }
  }, [task.id]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ─── INICIA ───────────────────────────────────────────────
  const start = useCallback(async () => {
    const startedAt = new Date().toISOString();

    setLocalRunning(true);
    setLocalStartedAt(startedAt);
    setElapsed(0);

    onUpdate(task.id, {
      timer_running: true,
      timer_started_at: startedAt,
    });

    const { error } = await supabase
      .from("tasks")
      .update({
        timer_running: true,
        timer_started_at: startedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      setLocalRunning(false);
      setLocalStartedAt(null);
      setElapsed(0);
      onUpdate(task.id, { timer_running: false, timer_started_at: null });
      toast({ variant: "destructive", title: "Erro ao iniciar timer", description: error.message });
    }
  }, [task.id, onUpdate, toast]);

  // ─── PARA (com nota opcional) ─────────────────────────────
  const stop = useCallback(async (note?: string) => {
    if (!localStartedAt) return;

    const endedAt = new Date().toISOString();
    const sessionSeconds = Math.floor(
      (new Date(endedAt).getTime() - new Date(localStartedAt).getTime()) / 1000
    );
    const newTotal = localTotal + sessionSeconds;

    setLocalRunning(false);
    setLocalStartedAt(null);
    setLocalTotal(newTotal);
    setElapsed(0);

    onUpdate(task.id, {
      timer_running: false,
      timer_started_at: null,
      total_tracked_seconds: newTotal,
    });

    const { data: { user } } = await supabase.auth.getUser();
    const entry = {
      task_id: task.id,
      user_id: user?.id ?? "",
      started_at: localStartedAt,
      ended_at: endedAt,
      duration_seconds: sessionSeconds,
      note: note?.trim() || null,
    };

    const [taskRes, entryRes] = await Promise.all([
      supabase
        .from("tasks")
        .update({
          timer_running: false,
          timer_started_at: null,
          total_tracked_seconds: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id),
      supabase.from("time_entries").insert([entry]).select().single(),
    ]);

    if (taskRes.error) {
      toast({ variant: "destructive", title: "Erro ao salvar timer", description: taskRes.error.message });
    }
    if (entryRes.data) {
      setTimeEntries((prev) => [entryRes.data, ...prev]);
    }
  }, [localStartedAt, localTotal, task.id, onUpdate, toast]);

  // ─── DESCARTA ─────────────────────────────────────────────
  const discard = useCallback(async () => {
    setLocalRunning(false);
    setLocalStartedAt(null);
    setElapsed(0);
    onUpdate(task.id, { timer_running: false, timer_started_at: null });
    await supabase
      .from("tasks")
      .update({ timer_running: false, timer_started_at: null, updated_at: new Date().toISOString() })
      .eq("id", task.id);
  }, [task.id, onUpdate]);

  // ─── DELETA ENTRADA ───────────────────────────────────────
  const deleteEntry = useCallback(async (entryId: string, duration: number) => {
    const newTotal = Math.max(0, localTotal - duration);
    setTimeEntries((prev) => prev.filter((e) => e.id !== entryId));
    setLocalTotal(newTotal);
    onUpdate(task.id, { total_tracked_seconds: newTotal });

    await Promise.all([
      supabase.from("time_entries").delete().eq("id", entryId),
      supabase.from("tasks").update({
        total_tracked_seconds: newTotal,
        updated_at: new Date().toISOString(),
      }).eq("id", task.id),
    ]);
    toast({ title: "Sessão removida" });
  }, [localTotal, task.id, onUpdate, toast]);

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
    refetchEntries: fetchEntries,
  };
}

// ─── FORMATADORES ─────────────────────────────────────────────
export function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatSecondsLong(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [
    h > 0 ? `${h}h` : null,
    m > 0 ? `${String(m).padStart(h > 0 ? 2 : 1, "0")}m` : h > 0 ? "00m" : null,
    `${String(s).padStart(2, "0")}s`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
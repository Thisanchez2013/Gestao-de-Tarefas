// src/hooks/useTimeline.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { TimeEntry, Task } from "@/types/task";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export interface TimelineEntry extends TimeEntry {
  task_title: string;
  task_description?: string;
  task_priority: "high" | "medium" | "low";
  task_status: "pending" | "completed";
  task_due_date?: string;
  task_tags?: string[];
  task_notes?: string;
  task_estimated_hours?: number;
  task_total_tracked_seconds?: number;
}

// Tarefa agendada (sem time_entry — aparece pelo due_date)
export interface ScheduledTask {
  id: string;
  task_id: string;
  task_title: string;
  task_description?: string;
  task_priority: "high" | "medium" | "low";
  task_status: "pending" | "completed";
  task_due_date: string;
  /** "date" = só data (all-day); "datetime" = intervalo de horário */
  task_schedule_type: "date" | "datetime";
  /** Início do intervalo "HH:MM" — presente quando task_schedule_type === "datetime" */
  task_scheduled_start?: string | null;
  /** Fim do intervalo "HH:MM" — presente quando task_schedule_type === "datetime" */
  task_scheduled_end?: string | null;
  task_tags?: string[];
  task_notes?: string;
  task_estimated_hours?: number;
  task_total_tracked_seconds?: number;
  isScheduled: true; // discriminator
}

export interface DaySummary {
  totalSeconds: number;
  blockCount: number;
  uniqueTasks: number;
  firstStart: string | null;
  lastEnd: string | null;
}

// ── Busca time_entries num intervalo ──────────────────────────────
async function fetchEntriesForRange(from: Date, to: Date): Promise<TimelineEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("time_entries")
    .select(`
      *,
      tasks!inner(
        title, description, priority, status,
        due_date, tags, notes, estimated_hours, total_tracked_seconds
      )
    `)
    .eq("user_id", user.id)
    .gte("started_at", from.toISOString())
    .lte("started_at", to.toISOString())
    .order("started_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    task_id: row.task_id,
    user_id: row.user_id,
    started_at: row.started_at,
    ended_at: row.ended_at,
    duration_seconds: row.duration_seconds,
    note: row.note,
    task_title: row.tasks?.title ?? "Tarefa",
    task_description: row.tasks?.description,
    task_priority: row.tasks?.priority ?? "medium",
    task_status: row.tasks?.status ?? "pending",
    task_due_date: row.tasks?.due_date,
    task_tags: row.tasks?.tags,
    task_notes: row.tasks?.notes,
    task_estimated_hours: row.tasks?.estimated_hours,
    task_total_tracked_seconds: row.tasks?.total_tracked_seconds,
  }));
}

// ── Busca tarefas agendadas por due_date num intervalo ────────────
async function fetchScheduledTasksForRange(from: Date, to: Date): Promise<ScheduledTask[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Formata como "YYYY-MM-DD" para comparar só a data (due_date é date, não timestamp)
  const fromStr = from.toISOString().slice(0, 10);
  const toStr   = to.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, priority, status, due_date, schedule_type, scheduled_start, scheduled_end, tags, notes, estimated_hours, total_tracked_seconds")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("due_date", fromStr)
    .lte("due_date", toStr)
    .order("due_date", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: `scheduled-${row.id}`,
    task_id: row.id,
    task_title: row.title ?? "Tarefa",
    task_description: row.description,
    task_priority: row.priority ?? "medium",
    task_status: row.status ?? "pending",
    task_due_date: row.due_date,
    task_schedule_type: (row.schedule_type as "date" | "datetime") ?? "date",
    task_scheduled_start: row.scheduled_start ?? null,
    task_scheduled_end: row.scheduled_end ?? null,
    task_tags: row.tags,
    task_notes: row.notes,
    task_estimated_hours: row.estimated_hours,
    task_total_tracked_seconds: row.total_tracked_seconds,
    isScheduled: true as const,
  }));
}

// ── Hook dia (time_entries) ───────────────────────────────────────
export function useTimeline(date: Date) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DaySummary>({
    totalSeconds: 0,
    blockCount: 0,
    uniqueTasks: 0,
    firstStart: null,
    lastEnd: null,
  });

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const mapped = await fetchEntriesForRange(dayStart, dayEnd);
      setEntries(mapped);

      const completed = mapped.filter((e) => e.ended_at);
      const total = completed.reduce((acc, e) => acc + (e.duration_seconds ?? 0), 0);
      const uniqueTasks = new Set(mapped.map((e) => e.task_id)).size;

      setSummary({
        totalSeconds: total,
        blockCount: mapped.length,
        uniqueTasks,
        firstStart: mapped[0]?.started_at ?? null,
        lastEnd: completed[completed.length - 1]?.ended_at ?? null,
      });
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [dayStart.toISOString(), dayEnd.toISOString()]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { entries, loading, summary, refetch: fetchData };
}

// ── Hook dia com tarefas agendadas ────────────────────────────────
export function useDayScheduled(date: Date) {
  const [allDay,   setAllDay]   = useState<ScheduledTask[]>([]);
  const [datetime, setDatetime] = useState<ScheduledTask[]>([]);
  const [loading, setLoading]   = useState(true);

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = await fetchScheduledTasksForRange(dayStart, dayEnd);
      setAllDay(tasks.filter((t) => t.task_schedule_type !== "datetime"));
      setDatetime(
        tasks
          .filter((t) => t.task_schedule_type === "datetime" && t.task_scheduled_start)
          .sort((a, b) => (a.task_scheduled_start ?? "").localeCompare(b.task_scheduled_start ?? ""))
      );
    } catch {
      setAllDay([]);
      setDatetime([]);
    } finally {
      setLoading(false);
    }
  }, [dayStart.toISOString()]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Mantém retrocompatibilidade: `scheduled` retorna todos
  const scheduled = [...allDay, ...datetime];
  return { scheduled, allDay, datetime, loading, refetch: fetchData };
}

// ── Hook semana ───────────────────────────────────────────────────
export function useWeekTimeline(date: Date) {
  const [entriesByDay, setEntriesByDay]               = useState<Record<string, TimelineEntry[]>>({});
  const [scheduledByDay, setScheduledByDay]           = useState<Record<string, ScheduledTask[]>>({});
  const [scheduledDatetimeByDay, setScheduledDatetimeByDay] = useState<Record<string, ScheduledTask[]>>({});
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd   = endOfWeek(date,   { weekStartsOn: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(weekStart); from.setHours(0, 0, 0, 0);
      const to   = new Date(weekEnd);   to.setHours(23, 59, 59, 999);

      const [mapped, scheduledRaw] = await Promise.all([
        fetchEntriesForRange(from, to),
        fetchScheduledTasksForRange(from, to),
      ]);

      const byDay: Record<string, TimelineEntry[]> = {};
      for (const entry of mapped) {
        const key = entry.started_at.slice(0, 10);
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push(entry);
      }

      const sByDay: Record<string, ScheduledTask[]> = {};
      const sByDayDatetime: Record<string, ScheduledTask[]> = {};
      for (const task of scheduledRaw) {
        const key = task.task_due_date.slice(0, 10);
        const alreadyTracked = (byDay[key] || []).some((e) => e.task_id === task.task_id);
        if (!alreadyTracked) {
          if (task.task_schedule_type === "datetime" && task.task_scheduled_start) {
            if (!sByDayDatetime[key]) sByDayDatetime[key] = [];
            sByDayDatetime[key].push(task);
          } else {
            if (!sByDay[key]) sByDay[key] = [];
            sByDay[key].push(task);
          }
        }
      }

      setEntriesByDay(byDay);
      setScheduledByDay(sByDay);
      setScheduledDatetimeByDay(sByDayDatetime);
    } catch {
      setEntriesByDay({});
      setScheduledByDay({});
      setScheduledDatetimeByDay({});
    } finally {
      setLoading(false);
    }
  }, [weekStart.toISOString()]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { entriesByDay, scheduledByDay, scheduledDatetimeByDay, loading, refetch: fetchData, weekStart, weekEnd };
}

// ── Hook mês ──────────────────────────────────────────────────────
export function useMonthTimeline(date: Date) {
  const [entriesByDay, setEntriesByDay]               = useState<Record<string, TimelineEntry[]>>({});
  const [scheduledByDay, setScheduledByDay]           = useState<Record<string, ScheduledTask[]>>({});
  const [scheduledDatetimeByDay, setScheduledDatetimeByDay] = useState<Record<string, ScheduledTask[]>>({});
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(date);
  const monthEnd   = endOfMonth(date);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(monthStart); from.setHours(0, 0, 0, 0);
      const to   = new Date(monthEnd);   to.setHours(23, 59, 59, 999);

      const [mapped, scheduledRaw] = await Promise.all([
        fetchEntriesForRange(from, to),
        fetchScheduledTasksForRange(from, to),
      ]);

      const byDay: Record<string, TimelineEntry[]> = {};
      for (const entry of mapped) {
        const key = entry.started_at.slice(0, 10);
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push(entry);
      }

      const sByDay: Record<string, ScheduledTask[]> = {};
      const sByDayDatetime: Record<string, ScheduledTask[]> = {};
      for (const task of scheduledRaw) {
        const key = task.task_due_date.slice(0, 10);
        const alreadyTracked = (byDay[key] || []).some((e) => e.task_id === task.task_id);
        if (!alreadyTracked) {
          if (task.task_schedule_type === "datetime" && task.task_scheduled_start) {
            if (!sByDayDatetime[key]) sByDayDatetime[key] = [];
            sByDayDatetime[key].push(task);
          } else {
            if (!sByDay[key]) sByDay[key] = [];
            sByDay[key].push(task);
          }
        }
      }

      setEntriesByDay(byDay);
      setScheduledByDay(sByDay);
      setScheduledDatetimeByDay(sByDayDatetime);
    } catch {
      setEntriesByDay({});
      setScheduledByDay({});
      setScheduledDatetimeByDay({});
    } finally {
      setLoading(false);
    }
  }, [monthStart.toISOString()]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { entriesByDay, scheduledByDay, scheduledDatetimeByDay, loading, refetch: fetchData, monthStart, monthEnd };
}

// ── Utilitários ───────────────────────────────────────────────────
export function toHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function timeToPercent(iso: string, hStart: number, hEnd: number): number {
  const d = new Date(iso);
  const minutesFromStart = (d.getHours() - hStart) * 60 + d.getMinutes();
  const totalMinutes = (hEnd - hStart) * 60;
  return Math.max(0, Math.min(100, (minutesFromStart / totalMinutes) * 100));
}

export function diffMinutes(start: string, end: string): number {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000);
}
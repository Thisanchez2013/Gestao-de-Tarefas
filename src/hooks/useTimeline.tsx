// src/hooks/useTimeline.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { TimeEntry } from "@/types/task";

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

export interface DaySummary {
  totalSeconds: number;
  blockCount: number;
  uniqueTasks: number;
  firstStart: string | null;
  lastEnd: string | null;
}

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

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .gte("started_at", dayStart.toISOString())
        .lte("started_at", dayEnd.toISOString())
        .order("started_at", { ascending: true });

      if (error) throw error;

      const mapped: TimelineEntry[] = (data || []).map((row: any) => ({
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { entries, loading, summary, refetch: fetchData };
}

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
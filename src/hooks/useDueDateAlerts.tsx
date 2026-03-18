// src/hooks/useDueDateAlerts.tsx
import { useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/types/task";

export function useDueDateAlerts(tasks: Task[]) {
  const { settings } = useSettings();
  const { toast } = useToast();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!settings.notifications.enabled) return;
    if (!settings.notifications.dueDateAlerts) return;
    if (tasks.length === 0) return;

    firedRef.current = true;

    const hoursThreshold = settings.notifications.dueDateAlertHoursBefore;
    const now = Date.now();
    const threshold = hoursThreshold * 60 * 60 * 1000;

    const upcoming = tasks.filter((t) => {
      if (t.status === "completed" || t.deleted_at) return false;
      const due = new Date(t.due_date).getTime();
      const diff = due - now;
      return diff > 0 && diff <= threshold;
    });

    const overdue = tasks.filter((t) => {
      if (t.status === "completed" || t.deleted_at) return false;
      const due = new Date(t.due_date).getTime();
      return due < now;
    });

    if (overdue.length > 0) {
      toast({
        variant: "destructive",
        title: `⚠️ ${overdue.length} tarefa${overdue.length > 1 ? "s" : ""} atrasada${overdue.length > 1 ? "s" : ""}`,
        description: overdue.slice(0, 2).map((t) => t.title).join(", ") + (overdue.length > 2 ? ` e mais ${overdue.length - 2}...` : ""),
      });
    } else if (upcoming.length > 0) {
      toast({
        title: `🔔 ${upcoming.length} tarefa${upcoming.length > 1 ? "s" : ""} vencendo em breve`,
        description: `Nas próximas ${hoursThreshold}h: ${upcoming.slice(0, 2).map((t) => t.title).join(", ")}${upcoming.length > 2 ? "..." : ""}`,
      });
    }
  }, [tasks, settings.notifications.enabled, settings.notifications.dueDateAlerts, settings.notifications.dueDateAlertHoursBefore, toast]);
}
// src/hooks/useDateFormat.ts
import { useSettings } from "@/hooks/useSettings";
import { format, isValid } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useCallback } from "react";

export function useDateFormat() {
  const { settings } = useSettings();

  const locale = settings.system.language === "pt-BR" ? ptBR : enUS;
  const dateFormat = settings.system.dateFormat;
  const timeFormat = settings.system.timeFormat;

  /** Formata apenas a data segundo as configurações do usuário */
  const formatDate = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (!isValid(d)) return "—";
    return format(d, dateFormat, { locale });
  }, [dateFormat, locale]);

  /** Formata hora segundo as configurações (24h ou 12h) */
  const formatTime = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (!isValid(d)) return "—";
    return format(d, timeFormat === "12h" ? "hh:mm a" : "HH:mm", { locale });
  }, [timeFormat, locale]);

  /** Formata data + hora */
  const formatDateTime = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (!isValid(d)) return "—";
    const timeFmt = timeFormat === "12h" ? "hh:mm a" : "HH:mm";
    return format(d, `${dateFormat} ${timeFmt}`, { locale });
  }, [dateFormat, timeFormat, locale]);

  /** Formata de forma amigável para cards (ex: "15 de Mar") */
  const formatCardDate = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return settings.system.language === "pt-BR" ? "Sem data" : "No date";
    const d = typeof date === "string" ? new Date(date) : date;
    if (!isValid(d)) return settings.system.language === "pt-BR" ? "Sem data" : "No date";
    if (settings.system.language === "pt-BR") {
      return format(d, "dd 'de' MMM", { locale: ptBR });
    }
    return format(d, "MMM dd", { locale: enUS });
  }, [settings.system.language]);

  return { formatDate, formatTime, formatDateTime, formatCardDate, locale };
}
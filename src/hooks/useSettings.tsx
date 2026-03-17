// src/hooks/useSettings.tsx
import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from "react";
import type {
  AppSettings, FieldConfig, TaskFieldSettings, SupplierFieldSettings,
  TimerSettings, CalendarSettings, SecuritySettings, NotificationSettings,
} from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "taskflow_settings";

function deepMerge<T>(defaults: T, saved: Partial<T>): T {
  const result = { ...defaults };
  for (const key in saved) {
    const k = key as keyof T;
    if (saved[k] !== null && typeof saved[k] === "object" && !Array.isArray(saved[k]) && typeof defaults[k] === "object") {
      result[k] = deepMerge(defaults[k] as any, saved[k] as any);
    } else if (saved[k] !== undefined) {
      result[k] = saved[k] as T[keyof T];
    }
  }
  return result;
}

function loadFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return deepMerge(DEFAULT_SETTINGS, JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextType {
  settings: AppSettings;
  updateTaskField: (key: keyof TaskFieldSettings, patch: Partial<FieldConfig>) => void;
  updateSupplierField: (key: keyof SupplierFieldSettings, patch: Partial<FieldConfig>) => void;
  updateInterface: (patch: Partial<AppSettings["interface"]>) => void;
  updateSystem: (patch: Partial<AppSettings["system"]>) => void;
  updateTimer: (patch: Partial<TimerSettings>) => void;
  updateCalendar: (patch: Partial<CalendarSettings>) => void;
  updateSecurity: (patch: Partial<SecuritySettings>) => void;
  updateNotifications: (patch: Partial<NotificationSettings>) => void;
  resetToDefaults: () => void;
  isSaving: boolean;
  isTaskFieldVisible: (key: keyof TaskFieldSettings) => boolean;
  isTaskFieldRequired: (key: keyof TaskFieldSettings) => boolean;
  isSupplierFieldVisible: (key: keyof SupplierFieldSettings) => boolean;
  isSupplierFieldRequired: (key: keyof SupplierFieldSettings) => boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadFromStorage);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const persistToSupabase = useCallback(async (newSettings: AppSettings) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_settings").upsert(
        { user_id: user.id, settings: newSettings, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    } catch { } finally { setIsSaving(false); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("user_settings").select("settings").eq("user_id", user.id).single();
        if (data?.settings) {
          const merged = deepMerge(DEFAULT_SETTINGS, data.settings);
          setSettings(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch { }
    })();
  }, []);

  const commit = useCallback((next: AppSettings) => {
    setSettings(next);
    persistToSupabase(next);
  }, [persistToSupabase]);

  const updateTaskField = useCallback((key: keyof TaskFieldSettings, patch: Partial<FieldConfig>) => {
    setSettings(prev => {
      const next = { ...prev, tasks: { ...prev.tasks, fields: { ...prev.tasks.fields, [key]: { ...prev.tasks.fields[key], ...patch } } } };
      persistToSupabase(next); return next;
    });
  }, [persistToSupabase]);

  const updateSupplierField = useCallback((key: keyof SupplierFieldSettings, patch: Partial<FieldConfig>) => {
    setSettings(prev => {
      const next = { ...prev, suppliers: { ...prev.suppliers, fields: { ...prev.suppliers.fields, [key]: { ...prev.suppliers.fields[key], ...patch } } } };
      persistToSupabase(next); return next;
    });
  }, [persistToSupabase]);

  const updateInterface = useCallback((patch: Partial<AppSettings["interface"]>) => {
    setSettings(prev => { const next = { ...prev, interface: { ...prev.interface, ...patch } }; persistToSupabase(next); return next; });
  }, [persistToSupabase]);

  const updateSystem = useCallback((patch: Partial<AppSettings["system"]>) => {
    setSettings(prev => { const next = { ...prev, system: { ...prev.system, ...patch } }; persistToSupabase(next); return next; });
  }, [persistToSupabase]);

  const updateTimer = useCallback((patch: Partial<TimerSettings>) => {
    setSettings(prev => { const next = { ...prev, timer: { ...prev.timer, ...patch } }; persistToSupabase(next); return next; });
  }, [persistToSupabase]);

  const updateCalendar = useCallback((patch: Partial<CalendarSettings>) => {
    setSettings(prev => { const next = { ...prev, calendar: { ...prev.calendar, ...patch } }; persistToSupabase(next); return next; });
  }, [persistToSupabase]);

  const updateSecurity = useCallback((patch: Partial<SecuritySettings>) => {
    setSettings(prev => { const next = { ...prev, security: { ...prev.security, ...patch } }; persistToSupabase(next); return next; });
  }, [persistToSupabase]);

  const updateNotifications = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings(prev => { const next = { ...prev, notifications: { ...prev.notifications, ...patch } }; persistToSupabase(next); return next; });
  }, [persistToSupabase]);

  const resetToDefaults = useCallback(() => { commit(DEFAULT_SETTINGS); }, [commit]);

  const isTaskFieldVisible    = useCallback((k: keyof TaskFieldSettings)    => settings.tasks.fields[k].visible,    [settings]);
  const isTaskFieldRequired   = useCallback((k: keyof TaskFieldSettings)    => settings.tasks.fields[k].required,   [settings]);
  const isSupplierFieldVisible = useCallback((k: keyof SupplierFieldSettings) => settings.suppliers.fields[k].visible, [settings]);
  const isSupplierFieldRequired = useCallback((k: keyof SupplierFieldSettings) => settings.suppliers.fields[k].required, [settings]);

  const value = useMemo(() => ({
    settings, updateTaskField, updateSupplierField, updateInterface, updateSystem,
    updateTimer, updateCalendar, updateSecurity, updateNotifications,
    resetToDefaults, isSaving,
    isTaskFieldVisible, isTaskFieldRequired, isSupplierFieldVisible, isSupplierFieldRequired,
  }), [settings, updateTaskField, updateSupplierField, updateInterface, updateSystem,
    updateTimer, updateCalendar, updateSecurity, updateNotifications,
    resetToDefaults, isSaving, isTaskFieldVisible, isTaskFieldRequired, isSupplierFieldVisible, isSupplierFieldRequired]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
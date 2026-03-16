// src/hooks/useUserOptions.tsx
// Gerencia opções personalizadas (categorias e tags) por usuário no Supabase

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type OptionType = "category" | "tag";

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Busca opções do usuário por tipo ─────────────────────────────
async function fetchOptions(type: OptionType): Promise<string[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_options")
    .select("value")
    .eq("user_id", userId)
    .eq("type", type)
    .order("created_at", { ascending: true });

  if (error) { console.error("useUserOptions fetch:", error.message); return []; }
  return (data ?? []).map((r: any) => r.value);
}

// ── Salva uma nova opção (ignora duplicatas via UNIQUE) ───────────
async function saveOption(type: OptionType, value: string): Promise<void> {
  const userId = await getUserId();
  if (!userId || !value.trim()) return;

  const { error } = await supabase
    .from("user_options")
    .upsert({ user_id: userId, type, value: value.trim() }, { onConflict: "user_id,type,value" });

  if (error) console.error("useUserOptions save:", error.message);
}

// ── Remove uma opção ─────────────────────────────────────────────
async function deleteOption(type: OptionType, value: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase
    .from("user_options")
    .delete()
    .eq("user_id", userId)
    .eq("type", type)
    .eq("value", value);

  if (error) console.error("useUserOptions delete:", error.message);
}

// ── Hook principal ────────────────────────────────────────────────
export function useUserOptions(type: OptionType) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchOptions(type);
    setOptions(data);
    setLoading(false);
  }, [type]);

  useEffect(() => { load(); }, [load]);

  // Salva e adiciona localmente sem precisar recarregar
  const save = useCallback(async (value: string) => {
    const clean = value.trim();
    if (!clean || options.includes(clean)) return;
    setOptions((prev) => [...prev, clean]);   // otimista
    await saveOption(type, clean);
  }, [type, options]);

  const remove = useCallback(async (value: string) => {
    setOptions((prev) => prev.filter((o) => o !== value));  // otimista
    await deleteOption(type, value);
  }, [type]);

  return { options, loading, save, remove, reload: load };
}
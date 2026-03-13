// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ─── Tipo do perfil ───────────────────────────────────────────
export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Busca email pelo username (usado no login) ───────────────
export async function getEmailByUsername(username: string): Promise<string | null> {
  const normalized = username.toLowerCase().trim();
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', normalized)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar usuário:', error.message);
    return null;
  }
  return data?.email ?? null;
}

// ─── Busca o perfil completo do usuário logado ────────────────
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Erro ao buscar perfil:', error.message);
    return null;
  }
  return data as Profile;
}

// ─── Atualiza o perfil do usuário logado ─────────────────────
export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'username' | 'name' | 'avatar_url'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

// ─── Verifica se username já está em uso ─────────────────────
export async function isUsernameTaken(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  const normalized = username.toLowerCase().trim();
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized);

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data } = await query.maybeSingle();
  return !!data;
}
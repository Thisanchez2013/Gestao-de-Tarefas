import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Variáveis de ambiente do Supabase não encontradas!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage, // ← era sessionStorage
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function getEmailByUsername(username: string): Promise<string | null> {
  const normalized = username.toLowerCase().trim();

  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', normalized)
    .maybeSingle(); // ← era single(), que jogava erro quando não encontrava

  if (error) {
    console.error('Erro ao buscar usuário:', error.message);
    return null;
  }

  return data?.email ?? null;
}
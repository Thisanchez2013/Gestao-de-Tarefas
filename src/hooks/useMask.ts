// src/hooks/useMask.ts

/**
 * Aplica máscara de telefone automaticamente.
 * Detecta celular (9 dígitos) ou fixo (8 dígitos).
 * Formato celular: (11) 99999-9999
 * Formato fixo:    (11) 9999-9999
 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const len = digits.length;

  if (len <= 2) return digits.length ? `(${digits}` : "";
  if (len <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (len <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

/**
 * Permite apenas números e ponto decimal para horas estimadas.
 * Ex: 1, 1.5, 2.5
 */
export function maskHours(value: string): string {
  const clean = value.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
  return clean;
}
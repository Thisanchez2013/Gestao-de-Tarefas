// src/components/ui/ComboInput.tsx
// Input com autocomplete de opções salvas pelo usuário.
// Ao pressionar Enter salva a opção; sugestões aparecem como chips clicáveis.

import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];           // opções já salvas pelo usuário
  onSaveOption: (v: string) => void;   // persiste nova opção
  onDeleteOption?: (v: string) => void; // remove opção salva
  placeholder?: string;
  className?: string;
  error?: boolean;
  id?: string;
}

export function ComboInput({
  value,
  onChange,
  options,
  onSaveOption,
  onDeleteOption,
  placeholder = "Digite e pressione Enter para salvar",
  className,
  error,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincroniza quando value muda externamente (ex: edição)
  useEffect(() => { setQuery(value); }, [value]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()) && o !== value
  );

  function select(opt: string) {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const clean = query.trim();
      if (!clean) return;
      onChange(clean);
      onSaveOption(clean);   // persiste no Supabase
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  function handleDelete(e: React.MouseEvent, opt: string) {
    e.stopPropagation();
    onDeleteOption?.(opt);
    if (value === opt) { onChange(""); setQuery(""); }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={cn(
        "flex items-center rounded-xl border border-border/80 bg-background h-10 px-3 gap-2 transition-colors",
        "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/60",
        error && "border-destructive",
        className,
      )}>
        <input
          ref={inputRef}
          id={id}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => { onChange(""); setQuery(""); inputRef.current?.focus(); }}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Hint de salvar */}
      {query.trim() && !options.includes(query.trim()) && (
        <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
          <Plus className="h-3 w-3" />
          Pressione <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> para salvar "{query.trim()}"
        </p>
      )}

      {/* Dropdown de sugestões */}
      <AnimatePresence>
        {open && (filtered.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 w-full rounded-xl border border-border/80 bg-popover shadow-lg overflow-hidden"
          >
            <div className="py-1 max-h-48 overflow-y-auto">
              {filtered.map((opt) => (
                <div
                  key={opt}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted/60 cursor-pointer group"
                  onMouseDown={(e) => { e.preventDefault(); select(opt); }}
                >
                  <span className="text-sm text-foreground">{opt}</span>
                  {onDeleteOption && (
                    <button
                      type="button"
                      onMouseDown={(e) => handleDelete(e, opt)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all ml-2"
                      title="Remover sugestão"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
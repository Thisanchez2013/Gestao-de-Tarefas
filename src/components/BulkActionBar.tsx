// src/components/BulkActionBar.tsx
// Barra flutuante de ações em massa — responsiva para mobile
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Undo2, Trash2, X, CheckSquare, Square, MinusSquare } from "lucide-react";

interface Props {
  count: number;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onCompleteSelected: () => void;
  onReopenSelected: () => void;
  onDeleteSelected: () => void;
  onCancel: () => void;
}

export function BulkActionBar({
  count, allSelected, someSelected,
  onSelectAll, onClearSelection,
  onCompleteSelected, onReopenSelected, onDeleteSelected, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          // No mobile fica logo acima do bottom nav (bottom-[72px]); no desktop fica em bottom-6
          className="fixed bottom-[72px] sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-lg"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl px-2.5 sm:px-3 py-2.5">

            {/* Seleção total */}
            <button
              onClick={allSelected ? onClearSelection : onSelectAll}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-muted transition-colors shrink-0"
              title={allSelected ? "Desmarcar todas" : "Selecionar todas"}
            >
              {allSelected
                ? <CheckSquare className="h-4 w-4 text-primary" />
                : someSelected
                ? <MinusSquare className="h-4 w-4 text-primary/70" />
                : <Square className="h-4 w-4 text-muted-foreground" />
              }
            </button>

            {/* Contagem */}
            <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums shrink-0">
              {count}<span className="hidden sm:inline"> selecionada{count !== 1 ? "s" : ""}</span>
            </span>

            <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />

            {/* Ações */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0">
              <button
                onClick={onCompleteSelected}
                className="flex items-center gap-1 h-8 px-2 sm:px-2.5 rounded-xl text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors"
                title="Concluir selecionadas"
              >
                <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Concluir</span>
              </button>

              <button
                onClick={onReopenSelected}
                className="flex items-center gap-1 h-8 px-2 sm:px-2.5 rounded-xl text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/50 transition-colors"
                title="Reabrir selecionadas"
              >
                <Undo2 className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Reabrir</span>
              </button>

              <button
                onClick={onDeleteSelected}
                className="flex items-center gap-1 h-8 px-2 sm:px-2.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
                title="Excluir selecionadas"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </div>

            <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />

            {/* Cancelar */}
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
              title="Cancelar seleção"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
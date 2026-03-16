// src/components/FeedbackOverlay.tsx
// Overlay de feedback visual centralizado para ações do sistema

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Trash2, RotateCcw, Building2, Plus } from "lucide-react";

export type FeedbackType =
  | "task-created"
  | "task-deleted"
  | "task-completed"
  | "task-reopened"
  | "supplier-created";

interface Config {
  icon: React.ReactNode;
  color: string;       // classe Tailwind do círculo
  ring: string;        // sombra/ring colorida
  label: string;
  sublabel: string;
  duration: number;    // ms para auto-fechar
}

const CONFIGS: Record<FeedbackType, Config> = {
  "task-created": {
    icon: <Plus className="h-10 w-10 text-white" />,
    color: "bg-primary",
    ring: "shadow-primary/35",
    label: "Tarefa criada!",
    sublabel: "Adicionada à sua lista ✨",
    duration: 1600,
  },
  "task-completed": {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
        <motion.path
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
        />
      </svg>
    ),
    color: "bg-emerald-500",
    ring: "shadow-emerald-500/35",
    label: "Tarefa concluída!",
    sublabel: "Ótimo trabalho 🎉",
    duration: 1800,
  },
  "task-reopened": {
    icon: <RotateCcw className="h-10 w-10 text-white" />,
    color: "bg-amber-500",
    ring: "shadow-amber-500/35",
    label: "Tarefa reaberta",
    sublabel: "De volta à lista de pendentes",
    duration: 1400,
  },
  "task-deleted": {
    icon: <Trash2 className="h-10 w-10 text-white" />,
    color: "bg-rose-500",
    ring: "shadow-rose-500/35",
    label: "Tarefa removida",
    sublabel: "Movida para a lixeira 🗑️",
    duration: 1400,
  },
  "supplier-created": {
    icon: <Building2 className="h-10 w-10 text-white" />,
    color: "bg-violet-500",
    ring: "shadow-violet-500/35",
    label: "Fornecedor adicionado!",
    sublabel: "Pronto para vincular tarefas 🏢",
    duration: 1600,
  },
};

interface Props {
  type: FeedbackType | null;
  onDone: () => void;
}

export function FeedbackOverlay({ type, onDone }: Props) {
  const cfg = type ? CONFIGS[type] : null;

  useEffect(() => {
    if (!cfg) return;
    const t = setTimeout(onDone, cfg.duration);
    return () => clearTimeout(t);
  }, [cfg, onDone]);

  return (
    <AnimatePresence>
      {cfg && (
        <motion.div
          key={type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onDone}
        >
          {/* Pulsação de fundo */}
          <motion.div
            className={`absolute h-48 w-48 rounded-full ${cfg.color} opacity-10`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.8, 1.8], opacity: [0.15, 0] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />

          {/* Círculo principal */}
          <motion.div
            className={`relative flex h-24 w-24 items-center justify-center rounded-full ${cfg.color} shadow-2xl ${cfg.ring}`}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.05 }}
          >
            {cfg.icon}

            {/* Anel pulsante ao redor */}
            <motion.div
              className={`absolute inset-0 rounded-full border-4 border-current opacity-30 ${cfg.color.replace("bg-", "border-")}`}
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            />
          </motion.div>

          {/* Texto */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <p className="text-lg font-bold text-foreground">{cfg.label}</p>
            <p className="text-sm text-muted-foreground mt-1">{cfg.sublabel}</p>
          </motion.div>

          {/* Barra de progresso */}
          <motion.div
            className="mt-6 h-0.5 w-24 rounded-full bg-border overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className={`h-full ${cfg.color}`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: cfg.duration / 1000 - 0.1, ease: "linear", delay: 0.1 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
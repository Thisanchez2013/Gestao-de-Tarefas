// src/components/Dashboard.tsx
import { CheckCircle2, Clock, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  pendingCount: number;
  completedCount: number;
}

export function Dashboard({ pendingCount, completedCount }: Props) {
  const total = pendingCount + completedCount;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {/* Card Pendentes */}
      <motion.div
        whileHover={{ y: -4 }}
        className="rounded-xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-sm transition-all flex items-center gap-4"
      >
        <div className="rounded-lg bg-amber-500 p-3 shadow-amber-200/50 shadow-lg">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600/80">
            Pendentes
          </p>
          <p className="text-3xl font-bold text-slate-800">{pendingCount}</p>
        </div>
      </motion.div>

      {/* Card Concluídas */}
      <motion.div
        whileHover={{ y: -4 }}
        className="rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-sm transition-all flex items-center gap-4"
      >
        <div className="rounded-lg bg-emerald-500 p-3 shadow-emerald-200/50 shadow-lg">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/80">
            Concluídas
          </p>
          <p className="text-3xl font-bold text-slate-800">{completedCount}</p>
        </div>
      </motion.div>

      {/* Card Progresso - versão premium */}
      <motion.div
        whileHover={{ y: -4 }}
        className="
          relative overflow-hidden rounded-xl
          border border-sky-100/70
          bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/40
          p-5 shadow-sm transition-all
        "
      >
        {/* Glow suave no canto */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {/* Ícone com gradiente */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg shadow-sky-200/60">
              <Activity className="h-4 w-4 text-white" />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Progresso Geral
            </p>
          </div>

          {/* Badge do % */}
          <span className="text-xs font-black text-sky-700 bg-sky-100/70 border border-sky-200/60 px-2.5 py-1 rounded-full">
            {pct}%
          </span>
        </div>

        {/* Barra */}
        <div className="relative w-full rounded-full h-3.5 overflow-hidden bg-slate-100 border border-sky-100">
          {/* preenchimento */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 shadow-[0_0_14px_rgba(56,189,248,0.35)]"
          />

          {/* “shine” por cima (faixa de brilho andando) */}
          <motion.div
            initial={{ x: "-40%" }}
            animate={{ x: "140%" }}
            transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
            style={{ mixBlendMode: "overlay" }}
          />
        </div>

        <p className="text-[10px] text-slate-500 mt-2 font-medium text-right italic">
          {total} tarefas catalogadas
        </p>
      </motion.div>
    </div>
  );
}
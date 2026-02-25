// src/components/Dashboard.tsx
import { CheckCircle2, Clock, Activity } from "lucide-react";
import { motion } from "framer-motion"; // Sugestão: npm install framer-motion

interface Props {
  pendingCount: number;
  completedCount: number;
}

export function Dashboard({ pendingCount, completedCount }: Props) {
  const total = pendingCount + completedCount;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {/* Card Pendentes - Azul Suave */}
      <motion.div 
        whileHover={{ y: -4 }}
        className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-5 shadow-sm transition-all flex items-center gap-4"
      >
        <div className="rounded-lg bg-blue-500 p-3 shadow-blue-200 shadow-lg">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600/70">Pendentes</p>
          <p className="text-3xl font-bold text-slate-800">{pendingCount}</p>
        </div>
      </motion.div>

      {/* Card Concluídas - Verde Suave */}
      <motion.div 
        whileHover={{ y: -4 }}
        className="rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-5 shadow-sm transition-all flex items-center gap-4"
      >
        <div className="rounded-lg bg-emerald-500 p-3 shadow-emerald-200 shadow-lg">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/70">Concluídas</p>
          <p className="text-3xl font-bold text-slate-800">{completedCount}</p>
        </div>
      </motion.div>

      {/* Card Progresso - Gradiente Moderno */}
      <motion.div 
        whileHover={{ y: -4 }}
        className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Progresso Geral</p>
          </div>
          <span className="text-sm font-bold text-violet-600">{pct}%</span>
        </div>
        
        <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2 italic text-right">
          {total} tarefas catalogadas
        </p>
      </motion.div>
    </div>
  );
}
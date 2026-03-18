// src/components/Dashboard.tsx — responsivo para mobile
import { CheckCircle2, Clock, ListTodo } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";

interface Props {
  pendingCount: number;
  completedCount: number;
}

const MotionDiv = motion.div;

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
  iconBg: string;
  delay?: number;
}

function StatCard({ icon, label, value, colorClass, iconBg, delay = 0 }: StatCardProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${colorClass} opacity-80 mb-0.5 sm:mb-1 truncate`}>
            {label}
          </p>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-2xl sm:text-4xl font-extrabold text-foreground tabular-nums"
          >
            {value}
          </motion.p>
        </div>
        <div className={`flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl ${iconBg} shadow-sm shrink-0`}>
          {icon}
        </div>
      </div>
    </MotionDiv>
  );
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-xl border bg-card px-3 py-2 shadow-lg text-sm font-medium">
        <span style={{ color: (item.payload as { color: string }).color }}>{item.name}</span>
        <span className="text-foreground ml-2 font-bold">{item.value}</span>
      </div>
    );
  }
  return null;
};

export function Dashboard({ pendingCount, completedCount }: Props) {
  const total = pendingCount + completedCount;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const donutData =
    total > 0
      ? [
          { name: "Concluídas", value: completedCount, color: "#1a5276" },
          { name: "Pendentes",  value: pendingCount,   color: "#f97316" },
        ]
      : [{ name: "Sem tarefas", value: 1, color: "#e2eaf0" }];

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      // Mobile: 2 colunas. md+: 4 colunas.
      className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-2"
    >
      <StatCard
        icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-400" />}
        label="Pendentes"
        value={pendingCount}
        colorClass="text-orange-600 dark:text-orange-400"
        iconBg="bg-orange-100/80 dark:bg-orange-500/15"
        delay={0}
      />
      <StatCard
        icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />}
        label="Concluídas"
        value={completedCount}
        colorClass="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-100/80 dark:bg-emerald-500/15"
        delay={0.07}
      />
      <StatCard
        icon={<ListTodo className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        label="Total"
        value={total}
        colorClass="text-primary"
        iconBg="bg-primary/10 dark:bg-primary/20"
        delay={0.14}
      />

      {/* Donut card */}
      <MotionDiv
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.21, ease: "easeOut" }}
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-sm flex items-center gap-2 sm:gap-4"
      >
        <div className="h-14 w-14 sm:h-[68px] sm:w-[68px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%" cy="50%"
                innerRadius={18} outerRadius={26}
                paddingAngle={total > 0 ? 3 : 0}
                dataKey="value"
                strokeWidth={0}
                startAngle={90} endAngle={-270}
              >
                {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary opacity-80 mb-0.5 sm:mb-1">
            Progresso
          </p>
          <motion.p
            key={pct}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl sm:text-4xl font-extrabold text-foreground tabular-nums"
          >
            {pct}%
          </motion.p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
            {total > 0 ? `${completedCount}/${total}` : "Nenhuma tarefa"}
          </p>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
}
// src/components/Dashboard.tsx
import { CheckCircle2, Clock, TrendingUp, ListTodo } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm card-hover"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest ${colorClass} opacity-80 mb-1`}>
            {label}
          </p>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-4xl font-extrabold text-foreground tabular-nums"
          >
            {value}
          </motion.p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} shadow-sm`}>
          {icon}
        </div>
      </div>
    </MotionDiv>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border bg-card px-3 py-2 shadow-lg text-sm font-medium">
        <span style={{ color: payload[0].payload.color }}>{payload[0].name}</span>
        <span className="text-foreground ml-2 font-bold">{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

export function Dashboard({ pendingCount, completedCount }: Props) {
  const total = pendingCount + completedCount;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const donutData = total > 0
    ? [
        { name: "Concluídas", value: completedCount, color: "#1a5276" },
        { name: "Pendentes", value: pendingCount, color: "#f97316" },
      ]
    : [{ name: "Sem tarefas", value: 1, color: "#e2eaf0" }];

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {/* Stat: Pendentes */}
      <StatCard
        icon={<Clock className="h-5 w-5 text-orange-500 dark:text-orange-400" />}
        label="Pendentes"
        value={pendingCount}
        colorClass="text-orange-600 dark:text-orange-400"
        iconBg="bg-orange-100/80 dark:bg-orange-500/15"
        delay={0}
      />

      {/* Stat: Concluídas */}
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        label="Concluídas"
        value={completedCount}
        colorClass="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-100/80 dark:bg-emerald-500/15"
        delay={0.07}
      />

      {/* Stat: Total */}
      <StatCard
        icon={<ListTodo className="h-5 w-5 text-primary" />}
        label="Total"
        value={total}
        colorClass="text-primary"
        iconBg="bg-primary/10 dark:bg-primary/20"
        delay={0.14}
      />

      {/* Donut Chart Card */}
      <MotionDiv
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.21, ease: "easeOut" }}
        whileHover={{ y: -3, transition: { duration: 0.15 } }}
        className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm card-hover flex items-center gap-4"
      >
        <div className="h-[68px] w-[68px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={32}
                paddingAngle={total > 0 ? 3 : 0}
                dataKey="value"
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
              >
                {donutData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary opacity-80 mb-1">
            Progresso
          </p>
          <motion.p
            key={pct}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-4xl font-extrabold text-foreground tabular-nums"
          >
            {pct}%
          </motion.p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {total > 0 ? `${completedCount} de ${total} concluídas` : "Nenhuma tarefa"}
          </p>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
}
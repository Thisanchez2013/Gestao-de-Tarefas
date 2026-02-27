// src/components/TrashView.tsx
import type { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  tasks: Task[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export function TrashView({ tasks, onRestore, onPermanentDelete }: Props) {
  const { toast } = useToast();

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Trash2 className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">Lixeira vazia</h3>
        <p className="text-sm text-muted-foreground">Nenhuma tarefa descartada por aqui.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        {tasks.length} {tasks.length === 1 ? "tarefa na lixeira" : "tarefas na lixeira"}
      </p>
      <AnimatePresence>
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 group hover:shadow-sm transition-shadow"
          >
            <div className="min-w-0 mr-4">
              <p className="font-medium text-sm line-through text-muted-foreground truncate">
                {task.title}
              </p>
              <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">
                Excluída em{" "}
                {task.deletedAt
                  ? format(new Date(task.deletedAt), "dd MMM yyyy", { locale: ptBR })
                  : "—"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 hover:border-primary hover:text-primary"
                onClick={() => {
                  onRestore(task.id);
                  toast({ title: "Tarefa restaurada!" });
                }}
              >
                <RotateCcw className="h-3 w-3" />
                Restaurar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  onPermanentDelete(task.id);
                  toast({ title: "Tarefa excluída permanentemente." });
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

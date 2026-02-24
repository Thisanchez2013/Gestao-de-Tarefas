import type { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Props {
  tasks: Task[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export function TrashView({ tasks, onRestore, onPermanentDelete }: Props) {
  const { toast } = useToast();

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trash2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>A lixeira está vazia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-lg border bg-card p-4 flex items-center justify-between opacity-70"
        >
          <div>
            <p className="font-medium line-through">{task.title}</p>
            <p className="text-xs text-muted-foreground font-mono">
              Excluída em{" "}
              {task.deletedAt
                ? format(new Date(task.deletedAt), "dd MMM yyyy", { locale: ptBR })
                : "—"}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onRestore(task.id);
                toast({ title: "Tarefa restaurada!" });
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                onPermanentDelete(task.id);
                toast({ title: "Tarefa excluída permanentemente." });
              }}
            >
              Excluir
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

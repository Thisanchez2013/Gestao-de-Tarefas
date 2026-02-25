import { useState, useEffect } from "react";
import type { Task, TaskFormData, Priority } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => void;
  editTask?: Task | null;
  onUpdate?: (id: string, data: Partial<TaskFormData>) => void;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

export function TaskFormDialog({ open, onOpenChange, onSubmit, editTask, onUpdate }: Props) {
  const { toast } = useToast();
  const isEditing = !!editTask;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(getTodayStr());
  const [priority, setPriority] = useState<Priority>("medium");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title || "");
        setDescription(editTask.description || "");
        // CORREÇÃO: Usar due_date para carregar a data no modal de edição
        setDueDate(editTask.due_date ? editTask.due_date.split("T")[0] : getTodayStr());
        setPriority(editTask.priority || "medium");
      } else {
        setTitle("");
        setDescription("");
        setDueDate(getTodayStr());
        setPriority("medium");
      }
      setErrors({});
    }
  }, [open, editTask]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "O título é obrigatório.";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(dueDate + "T12:00:00");
    if (selectedDate < today) errs.dueDate = "A data não pode ser retroativa.";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const dateISO = new Date(dueDate + "T12:00:00").toISOString();

    const data: TaskFormData = {
      title: title.trim(),
      description: description.trim(),
      // CORREÇÃO: Salvar como due_date para alinhar com o banco de dados
      due_date: dateISO,
      status: editTask?.status ?? "pending",
      priority,
    };

    if (isEditing && onUpdate && editTask) {
      onUpdate(editTask.id, data);
      toast({ title: "Tarefa atualizada com sucesso!" });
    } else {
      onSubmit(data);
      toast({ title: "Tarefa criada com sucesso!" });
    }
    
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Estudar React"
            />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="desc">Descrição</Label>
            <Textarea 
              id="desc" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Detalhes opcionais..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="due">Data de Vencimento</Label>
              <Input 
                id="due" 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
                className="font-mono text-sm"
              />
              {errors.dueDate && <p className="text-sm text-destructive mt-1">{errors.dueDate}</p>}
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Salvar Alterações" : "Criar Tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
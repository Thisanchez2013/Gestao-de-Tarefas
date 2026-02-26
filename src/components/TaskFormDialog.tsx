// src/components/TaskFormDialog.tsx
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
import { useTaskStore } from "@/hooks/useTaskStore";
import { MapPin } from "lucide-react";

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
  const { suppliers } = useTaskStore(); // Acessando a lista global de fornecedores
  const isEditing = !!editTask;

  // Estados do formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(getTodayStr());
  const [priority, setPriority] = useState<Priority>("medium");
  const [supplierId, setSupplierId] = useState<string>("none"); 
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincroniza os campos quando o modal abre ou o editTask muda
  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title || "");
        setDescription(editTask.description || "");
        setDueDate(editTask.due_date ? editTask.due_date.split("T")[0] : getTodayStr());
        setPriority(editTask.priority || "medium");
        // Se a tarefa tiver um supplier_id, define no estado, caso contrário "none"
        setSupplierId(editTask.supplier_id || "none");
      } else {
        setTitle("");
        setDescription("");
        setDueDate(getTodayStr());
        setPriority("medium");
        setSupplierId("none");
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
      due_date: dateISO,
      priority,
      // Se for "none", enviamos null ou undefined para o banco
      supplier_id: supplierId === "none" ? undefined : supplierId,
    };

    if (isEditing && onUpdate && editTask) {
      onUpdate(editTask.id, data);
      toast({ title: "Tarefa atualizada!" });
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
          {/* Título */}
          <div className="space-y-1">
            <Label htmlFor="title">Título *</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Comprar suprimentos"
            />
            {errors.title && <p className="text-xs text-destructive font-medium">{errors.title}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea 
              id="desc" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Detalhes opcionais..."
              className="resize-none"
            />
          </div>

          {/* Seleção de Fornecedor */}
          <div className="space-y-1">
            <Label>Fornecedor vinculado</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Selecione um parceiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem fornecedor vinculado</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-[10px] opacity-70 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> {s.location_name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Data de Vencimento */}
            <div className="space-y-1">
              <Label htmlFor="due">Vencimento</Label>
              <Input 
                id="due" 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
                className="font-mono text-sm"
              />
              {errors.dueDate && <p className="text-xs text-destructive font-medium">{errors.dueDate}</p>}
            </div>
            
            {/* Prioridade */}
            <div className="space-y-1">
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

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-primary">
            {isEditing ? "Salvar Alterações" : "Criar Tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
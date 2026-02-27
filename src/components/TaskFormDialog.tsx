// src/components/TaskFormDialog.tsx
import { useState, useEffect, useRef } from "react";
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
import { MapPin, Building2, Clock, Tag, X, StickyNote, CalendarDays, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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

const PRIORITY_OPTIONS = [
  { value: "high",   label: "Alta",  emoji: "🔴", desc: "Urgente e crítica", textColor: "text-rose-600",    bgColor: "bg-rose-50 dark:bg-rose-950/40",    borderColor: "border-rose-200 dark:border-rose-800"   },
  { value: "medium", label: "Média", emoji: "🟡", desc: "Importante",        textColor: "text-amber-600",   bgColor: "bg-amber-50 dark:bg-amber-950/40",   borderColor: "border-amber-200 dark:border-amber-800"  },
  { value: "low",    label: "Baixa", emoji: "🟢", desc: "Quando possível",   textColor: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/40", borderColor: "border-emerald-200 dark:border-emerald-800" },
] as const;

const PRESET_TAGS = ["Compras", "Reunião", "Entrega", "Revisão", "Pagamento", "Ligação", "Vistoria"];

export function TaskFormDialog({ open, onOpenChange, onSubmit, editTask, onUpdate }: Props) {
  const { toast } = useToast();
  const { suppliers } = useTaskStore();
  const isEditing = !!editTask;
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(getTodayStr());
  const [priority, setPriority] = useState<Priority>("medium");
  const [supplierId, setSupplierId] = useState<string>("none");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"basic" | "extra">("basic");

  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title || "");
        setDescription(editTask.description || "");
        setDueDate(editTask.due_date ? editTask.due_date.split("T")[0] : getTodayStr());
        setPriority(editTask.priority || "medium");
        setSupplierId(editTask.supplier_id || "none");
        setEstimatedHours(editTask.estimated_hours ? String(editTask.estimated_hours) : "");
        setTags(editTask.tags || []);
        setNotes(editTask.notes || "");
      } else {
        setTitle(""); setDescription(""); setDueDate(getTodayStr());
        setPriority("medium"); setSupplierId("none");
        setEstimatedHours(""); setTags([]); setNotes("");
      }
      setErrors({});
      setActiveTab("basic");
      setTagInput("");
    }
  }, [open, editTask]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "O título é obrigatório.";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dueDate + "T12:00:00");
    if (selectedDate < today) errs.dueDate = "A data não pode ser retroativa.";
    if (estimatedHours && (isNaN(Number(estimatedHours)) || Number(estimatedHours) < 0)) {
      errs.estimatedHours = "Informe um número válido.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const data: TaskFormData = {
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: new Date(dueDate + "T12:00:00").toISOString(),
      priority,
      supplier_id: supplierId === "none" ? undefined : supplierId,
      estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      notes: notes.trim() || undefined,
    };

    if (isEditing && onUpdate && editTask) {
      onUpdate(editTask.id, data);
      toast({ title: "✅ Tarefa atualizada!" });
    } else {
      onSubmit(data);
      toast({ title: "✅ Tarefa criada com sucesso!" });
    }
    onOpenChange(false);
  }

  function addTag(tag: string) {
    const clean = tag.trim();
    if (clean && !tags.includes(clean)) setTags([...tags, clean]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isEditing ? "Editar Tarefa" : "Nova Tarefa"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditing ? "Altere os campos abaixo" : "Preencha os dados da nova tarefa"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-muted/50 rounded-xl p-1">
            {[{ id: "basic" as const, label: "Básico" }, { id: "extra" as const, label: "Detalhes" }].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {activeTab === "basic" && (
            <>
              {/* Título */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Título *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ligar para o fornecedor de material"
                  className={cn("rounded-xl h-10 text-sm", errors.title && "border-destructive")}
                  autoFocus
                />
                {errors.title && <p className="text-xs text-destructive font-medium">{errors.title}</p>}
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Descrição
                </Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que precisa ser feito..."
                  className="resize-none rounded-xl text-sm min-h-[80px]"
                  rows={3}
                />
              </div>

              {/* Prioridade — Cards visuais */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Prioridade
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value as Priority)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center",
                        priority === opt.value
                          ? `${opt.bgColor} ${opt.borderColor}`
                          : "border-border/60 hover:border-border bg-card"
                      )}
                    >
                      <span className="text-base">{opt.emoji}</span>
                      <span className={cn("text-[11px] font-bold", priority === opt.value ? opt.textColor : "text-muted-foreground")}>
                        {opt.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground/70 hidden sm:block">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Data de Vencimento */}
                <div className="space-y-1.5">
                  <Label htmlFor="due" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Vencimento
                  </Label>
                  <Input
                    id="due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={cn("font-mono text-sm rounded-xl h-10", errors.dueDate && "border-destructive")}
                  />
                  {errors.dueDate && <p className="text-xs text-destructive font-medium">{errors.dueDate}</p>}
                </div>

                {/* Horas Estimadas */}
                <div className="space-y-1.5">
                  <Label htmlFor="hours" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Horas estimadas
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="Ex: 2"
                    className={cn("text-sm rounded-xl h-10", errors.estimatedHours && "border-destructive")}
                  />
                  {errors.estimatedHours && <p className="text-xs text-destructive font-medium">{errors.estimatedHours}</p>}
                </div>
              </div>

              {/* Fornecedor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Fornecedor vinculado
                </Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="w-full bg-background rounded-xl h-10 text-sm">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Sem fornecedor vinculado</span>
                    </SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 shrink-0">
                            <Building2 className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{s.name}</span>
                            {s.location_name && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" /> {s.location_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {activeTab === "extra" && (
            <>
              {/* Tags */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Etiquetas
                </Label>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_TAGS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => tags.includes(preset) ? removeTag(preset) : addTag(preset)}
                      className={cn(
                        "text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all",
                        tags.includes(preset)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Tag pills + input */}
                <div
                  className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-border/80 bg-background min-h-[44px] cursor-text"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-full px-2.5 py-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => tagInput && addTag(tagInput)}
                    placeholder={tags.length === 0 ? "Digite e pressione Enter..." : ""}
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Pressione Enter ou vírgula para adicionar uma etiqueta.</p>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <StickyNote className="h-3 w-3" /> Observações internas
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações privadas, instruções extras, contexto adicional..."
                  className="resize-none rounded-xl text-sm min-h-[100px]"
                  rows={4}
                />
                <p className="text-[10px] text-muted-foreground">Visível apenas para você. Não aparece nos relatórios.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-9 text-sm">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl h-9 text-sm font-semibold px-6">
            {isEditing ? "Salvar Alterações" : "Criar Tarefa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
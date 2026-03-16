// src/components/TaskFormDialog.tsx
import { useState, useEffect, useRef } from "react";
import type { Task, TaskFormData, Priority, ScheduleType } from "@/types/task";
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
import { useSettings } from "@/hooks/useSettings";
import {
  MapPin, Building2, Clock, Tag, X, StickyNote,
  CalendarDays, Zap, CalendarCheck, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUserOptions } from "@/hooks/useUserOptions";
import { maskHours } from "@/hooks/useMask";

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

export function TaskFormDialog({ open, onOpenChange, onSubmit, editTask, onUpdate }: Props) {
  const { toast } = useToast();
  const { suppliers } = useTaskStore();
  const { settings, isTaskFieldVisible, isTaskFieldRequired } = useSettings();
  const isEditing = !!editTask;
  const tagInputRef = useRef<HTMLInputElement>(null);
  const { options: tagOptions, save: saveTag, remove: removeTagOption } = useUserOptions("tag");

  const defaultPriority = settings.system.defaultPriority as Priority;

  // ── Estados do formulário ───────────────────────────────────
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [priority, setPriority]         = useState<Priority>(defaultPriority);
  const [supplierId, setSupplierId]     = useState<string>("none");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [tags, setTags]                 = useState<string[]>([]);
  const [tagInput, setTagInput]         = useState("");
  const [notes, setNotes]               = useState("");
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [activeTab, setActiveTab]       = useState<"basic" | "extra">("basic");

  // Campos de data/hora
  const [dueDate, setDueDate]           = useState(getTodayStr());   // usado em mode "date"
  const [serviceDate, setServiceDate]   = useState(getTodayStr());   // usado em mode "datetime"
  const [scheduleType, setScheduleType] = useState<ScheduleType>("date");
  const [scheduledStart, setScheduledStart] = useState<string>("");
  const [scheduledEnd, setScheduledEnd]     = useState<string>("");

  const hasExtraTab = isTaskFieldVisible("tags") || isTaskFieldVisible("notes");

  // ── Reset / preencher ao abrir ──────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (editTask) {
      setTitle(editTask.title || "");
      setDescription(editTask.description || "");
      setPriority(editTask.priority || defaultPriority);
      setSupplierId(editTask.supplier_id || "none");
      setEstimatedHours(editTask.estimated_hours ? String(editTask.estimated_hours) : "");
      setTags(editTask.tags || []);
      setNotes(editTask.notes || "");
      const type = editTask.schedule_type ?? "date";
      setScheduleType(type);
      setScheduledStart(editTask.scheduled_start ?? "");
      setScheduledEnd(editTask.scheduled_end ?? "");
      const rawDate = editTask.due_date ? editTask.due_date.split("T")[0] : getTodayStr();
      if (type === "date") {
        setDueDate(rawDate);
        setServiceDate(getTodayStr());
      } else {
        setDueDate(getTodayStr());
        setServiceDate(rawDate);
      }
    } else {
      setTitle(""); setDescription(""); setPriority(defaultPriority);
      setSupplierId("none"); setEstimatedHours(""); setTags([]); setNotes("");
      setDueDate(getTodayStr()); setServiceDate(getTodayStr());
      setScheduleType("date"); setScheduledStart(""); setScheduledEnd("");
    }
    setErrors({});
    setActiveTab("basic");
    setTagInput("");
  }, [open, editTask, defaultPriority]);

  // ── Ao trocar o tipo de agendamento ────────────────────────
  function handleScheduleTypeChange(type: ScheduleType) {
    setScheduleType(type);
    if (type === "date") {
      setScheduledStart("");
      setScheduledEnd("");
      setServiceDate(getTodayStr());
    }
  }

  // ── Validação ───────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!title.trim()) errs.title = "O título é obrigatório.";

    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (scheduleType === "date") {
      const sel = new Date(dueDate + "T12:00:00");
      if (sel < today) errs.dueDate = "A data não pode ser retroativa.";
    } else {
      if (!serviceDate) {
        errs.serviceDate = "Informe a data de realização do serviço.";
      } else {
        const sel = new Date(serviceDate + "T12:00:00");
        if (sel < today) errs.serviceDate = "A data de realização não pode ser no passado.";
      }
      if (!scheduledStart) {
        errs.scheduledStart = "Informe o horário de início.";
      } else if (!/^\d{2}:\d{2}$/.test(scheduledStart)) {
        errs.scheduledStart = "Horário de início inválido.";
      }
      if (!scheduledEnd) {
        errs.scheduledEnd = "Informe o horário de fim.";
      } else if (!/^\d{2}:\d{2}$/.test(scheduledEnd)) {
        errs.scheduledEnd = "Horário de fim inválido.";
      }
      if (scheduledStart && scheduledEnd && scheduledEnd <= scheduledStart) {
        errs.scheduledEnd = "O horário de fim deve ser após o início.";
      }
    }

    if (isTaskFieldRequired("description") && isTaskFieldVisible("description") && !description.trim())
      errs.description = "A descrição é obrigatória.";
    if (isTaskFieldRequired("estimated_hours") && isTaskFieldVisible("estimated_hours") && !estimatedHours)
      errs.estimatedHours = "As horas estimadas são obrigatórias.";
    if (estimatedHours && (isNaN(Number(estimatedHours)) || Number(estimatedHours) < 0))
      errs.estimatedHours = "Informe um número válido.";
    if (isTaskFieldRequired("supplier_id") && isTaskFieldVisible("supplier_id") && supplierId === "none")
      errs.supplierId = "O fornecedor é obrigatório.";
    if (isTaskFieldRequired("tags") && isTaskFieldVisible("tags") && tags.length === 0)
      errs.tags = "Adicione ao menos uma etiqueta.";
    if (isTaskFieldRequired("notes") && isTaskFieldVisible("notes") && !notes.trim())
      errs.notes = "As observações são obrigatórias.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────
  function handleSubmit() {
    if (!validate()) return;

    const effectiveDueDate = scheduleType === "datetime"
      ? new Date(serviceDate + "T12:00:00").toISOString()
      : new Date(dueDate + "T12:00:00").toISOString();

    const data: TaskFormData = {
      title: title.trim(),
      description: isTaskFieldVisible("description") ? (description.trim() || undefined) : undefined,
      due_date: effectiveDueDate,
      schedule_type: scheduleType,
      scheduled_start: scheduleType === "datetime" ? scheduledStart : null,
      scheduled_end:   scheduleType === "datetime" ? scheduledEnd   : null,
      priority,
      supplier_id: isTaskFieldVisible("supplier_id") && supplierId !== "none" ? supplierId : undefined,
      estimated_hours: isTaskFieldVisible("estimated_hours") && estimatedHours ? Number(estimatedHours) : undefined,
      tags: isTaskFieldVisible("tags") && tags.length > 0 ? tags : undefined,
      notes: isTaskFieldVisible("notes") ? (notes.trim() || undefined) : undefined,
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

  // ── Tags helpers ────────────────────────────────────────────
  function addTag(tag: string) {
    const clean = tag.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      saveTag(clean);   // persiste no Supabase
    }
    setTagInput("");
  }
  function removeTag(tag: string) { setTags(tags.filter((t) => t !== tag)); }
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    else if (e.key === "Backspace" && !tagInput && tags.length > 0) removeTag(tags[tags.length - 1]);
  }

  function FieldLabel({ fieldKey, icon, children }: {
    fieldKey: keyof typeof settings.tasks.fields;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) {
    const required = isTaskFieldRequired(fieldKey);
    return (
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {icon}{children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
    );
  }

  const todayStr = getTodayStr();

  // ── JSX ─────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
            >
              <Zap className="h-4 w-4 text-primary" />
            </motion.div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isEditing ? "Editar Tarefa" : "Nova Tarefa"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditing ? "Altere os campos abaixo" : "Preencha os dados da nova tarefa"}
              </p>
            </div>
          </div>

          {hasExtraTab && (
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
          )}
        </DialogHeader>

        <motion.div
          className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          {(activeTab === "basic" || !hasExtraTab) && (
            <>
              {/* Título */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Título <span className="text-destructive">*</span>
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
              {isTaskFieldVisible("description") && (
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="description">Descrição</FieldLabel>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o que precisa ser feito..."
                    className={cn("resize-none rounded-xl text-sm min-h-[80px]", errors.description && "border-destructive")}
                    rows={3}
                  />
                  {errors.description && <p className="text-xs text-destructive font-medium">{errors.description}</p>}
                </div>
              )}

              {/* Prioridade */}
              {isTaskFieldVisible("priority") && (
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="priority">Prioridade</FieldLabel>
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
              )}

              {/* ── Tipo de agendamento (toggle) ── */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" /> Tipo de agendamento
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleScheduleTypeChange("date")}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all",
                      scheduleType === "date"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/60 hover:border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CalendarCheck className={cn("h-4 w-4 shrink-0", scheduleType === "date" ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className="text-[11px] font-bold leading-tight">Por data</p>
                      <p className="text-[9px] opacity-70 mt-0.5">Tarefa do dia, sem horário</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScheduleTypeChange("datetime")}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all",
                      scheduleType === "datetime"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/60 hover:border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Clock className={cn("h-4 w-4 shrink-0", scheduleType === "datetime" ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className="text-[11px] font-bold leading-tight">Por horário</p>
                      <p className="text-[9px] opacity-70 mt-0.5">Aparece na timeline</p>
                    </div>
                  </button>
                </div>

                {/* ── Campos de data/hora — dependem do modo ── */}
                {scheduleType === "date" ? (
                  /* Modo "Por data": campo Vencimento + Horas Estimadas */
                  <div className={cn("gap-3", isTaskFieldVisible("estimated_hours") ? "grid grid-cols-2" : "")}>
                    <div className="space-y-1.5">
                      <Label htmlFor="due" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Vencimento <span className="text-destructive">*</span>
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
                    {isTaskFieldVisible("estimated_hours") && (
                      <div className="space-y-1.5">
                        <FieldLabel fieldKey="estimated_hours" icon={<Clock className="h-3 w-3" />}>
                          Horas estimadas
                        </FieldLabel>
                        <Input
                          id="hours"
                          type="text"
                          inputMode="decimal"
                          value={estimatedHours}
                          onChange={(e) => setEstimatedHours(maskHours(e.target.value))}
                          placeholder="Ex: 2 ou 1.5"
                          maxLength={5}
                          className={cn("text-sm rounded-xl h-10", errors.estimatedHours && "border-destructive")}
                        />
                        {errors.estimatedHours && <p className="text-xs text-destructive font-medium">{errors.estimatedHours}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Modo "Por horário": Data de Realização + Início + Fim */
                  <div className="space-y-3">
                    {/* Data de realização */}
                    <div className="space-y-1.5">
                      <Label htmlFor="service-date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3" /> Data de realização <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="service-date"
                        type="date"
                        value={serviceDate}
                        min={todayStr}
                        onChange={(e) => setServiceDate(e.target.value)}
                        className={cn("font-mono text-sm rounded-xl h-10", errors.serviceDate && "border-destructive")}
                      />
                      {errors.serviceDate && <p className="text-xs text-destructive font-medium">{errors.serviceDate}</p>}
                    </div>
                    {/* Horário início e fim */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="scheduled_start" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Início <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="scheduled_start"
                          type="time"
                          value={scheduledStart}
                          onChange={(e) => setScheduledStart(e.target.value)}
                          className={cn("font-mono text-sm rounded-xl h-10 w-full", errors.scheduledStart && "border-destructive")}
                        />
                        {errors.scheduledStart && <p className="text-xs text-destructive font-medium">{errors.scheduledStart}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="scheduled_end" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Fim <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="scheduled_end"
                          type="time"
                          value={scheduledEnd}
                          onChange={(e) => setScheduledEnd(e.target.value)}
                          className={cn("font-mono text-sm rounded-xl h-10 w-full", errors.scheduledEnd && "border-destructive")}
                        />
                        {errors.scheduledEnd && <p className="text-xs text-destructive font-medium">{errors.scheduledEnd}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fornecedor */}
              {isTaskFieldVisible("supplier_id") && (
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="supplier_id" icon={<Building2 className="h-3 w-3" />}>
                    Fornecedor vinculado
                  </FieldLabel>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className={cn("w-full bg-background rounded-xl h-10 text-sm", errors.supplierId && "border-destructive")}>
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
                  {errors.supplierId && <p className="text-xs text-destructive font-medium">{errors.supplierId}</p>}
                </div>
              )}

              {!hasExtraTab && (
                <>
                  {isTaskFieldVisible("tags") && (
                    <TagsField
                      tags={tags} tagInput={tagInput} tagInputRef={tagInputRef}
                      setTagInput={setTagInput} addTag={addTag} removeTag={removeTag}
                      handleTagKeyDown={handleTagKeyDown} error={errors.tags}
                      required={isTaskFieldRequired("tags")}
                      savedOptions={tagOptions}
                      onSaveOption={saveTag}
                      onDeleteOption={removeTagOption}
                    />
                  )}
                  {isTaskFieldVisible("notes") && (
                    <NotesField notes={notes} setNotes={setNotes} error={errors.notes} required={isTaskFieldRequired("notes")} />
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "extra" && hasExtraTab && (
            <>
              {isTaskFieldVisible("tags") && (
                <TagsField
                  tags={tags} tagInput={tagInput} tagInputRef={tagInputRef}
                  setTagInput={setTagInput} addTag={addTag} removeTag={removeTag}
                  handleTagKeyDown={handleTagKeyDown} error={errors.tags}
                  required={isTaskFieldRequired("tags")}
                  savedOptions={tagOptions}
                  onSaveOption={saveTag}
                  onDeleteOption={removeTagOption}
                />
              )}
              {isTaskFieldVisible("notes") && (
                <NotesField notes={notes} setNotes={setNotes} error={errors.notes} required={isTaskFieldRequired("notes")} />
              )}
            </>
          )}
        </motion.div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-9 text-sm">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl h-9 text-sm font-semibold px-6 active:scale-95 transition-transform">
            {isEditing ? "Salvar Alterações" : "Criar Tarefa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────
function TagsField({ tags, tagInput, tagInputRef, setTagInput, addTag, removeTag, handleTagKeyDown, error, required, savedOptions = [], onSaveOption, onDeleteOption }: any) {
  // Sugestões: opções salvas que ainda não estão selecionadas
  const suggestions = (savedOptions as string[]).filter((o: string) => !tags.includes(o));

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <Tag className="h-3 w-3" /> Etiquetas{required && <span className="text-destructive">*</span>}
      </Label>

      {/* Sugestões salvas pelo usuário */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((opt: string) => (
            <div key={opt} className="group relative inline-flex items-center">
              <button
                type="button"
                onClick={() => addTag(opt)}
                className="text-[11px] font-medium px-2.5 py-1 pr-6 rounded-full border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
              >
                {opt}
              </button>
              {/* Botão X para remover a sugestão salva */}
              <button
                type="button"
                onClick={() => onDeleteOption(opt)}
                className="absolute right-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all"
                title="Remover sugestão"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Campo de entrada + tags selecionadas */}
      <div
        className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-border/80 bg-background min-h-[44px] cursor-text"
        onClick={() => tagInputRef.current?.focus()}
      >
        {tags.map((tag: string) => (
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
          placeholder={tags.length === 0 ? "Digite e pressione Enter para salvar..." : ""}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/50"
        />
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

function NotesField({ notes, setNotes, error, required }: any) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <StickyNote className="h-3 w-3" /> Observações internas{required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anotações privadas, instruções extras, contexto adicional..."
        className={cn("resize-none rounded-xl text-sm min-h-[100px]", error && "border-destructive")}
        rows={4}
      />
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}
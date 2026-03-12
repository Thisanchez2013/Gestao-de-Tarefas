// src/components/supplier/SupplierFormDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useSettings } from "@/hooks/useSettings";
import { Supplier, SupplierFormData } from "@/types/supplier";
import { Building2, Phone, MapPin, Mail, StickyNote, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { maskPhone } from "@/hooks/useMask";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSupplier?: Supplier | null;
}

const CATEGORIES = [
  "Farmácia", "Supermercado", "Materiais de Construção",
  "Serviços Elétricos", "Serviços Hidráulicos", "Limpeza",
  "Alimentação", "Tecnologia", "Transporte", "Logística", "Escritório", "Outro",
];

export function SupplierFormDialog({ open, onOpenChange, editSupplier }: Props) {
  const { addSupplier, updateSupplier } = useTaskStore();
  const { isSupplierFieldVisible, isSupplierFieldRequired } = useSettings();

  const [formData, setFormData] = useState<SupplierFormData>({
    name: "", phone: "", location_name: "", email: "", category: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editSupplier) {
        setFormData({
          name: editSupplier.name,
          phone: editSupplier.phone,
          location_name: editSupplier.location_name,
          email: editSupplier.email || "",
          category: editSupplier.category || "",
          notes: editSupplier.notes || "",
        });
      } else {
        setFormData({ name: "", phone: "", location_name: "", email: "", category: "", notes: "" });
      }
      setErrors({});
    }
  }, [open, editSupplier]);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) errs.name = "O nome é obrigatório.";

    // Telefone: visível E (obrigatório por settings OU campo locked)
    if (isSupplierFieldVisible("phone")) {
      if (isSupplierFieldRequired("phone") && !formData.phone.trim()) {
        errs.phone = "O telefone é obrigatório.";
      } else if (formData.phone && formData.phone.replace(/\D/g, "").length < 10) {
        errs.phone = "Telefone inválido.";
      }
    }

    if (isSupplierFieldVisible("email") && formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errs.email = "E-mail inválido.";
      }
    }
    if (isSupplierFieldRequired("location_name") && isSupplierFieldVisible("location_name") && !formData.location_name.trim()) {
      errs.location_name = "A localização é obrigatória.";
    }
    if (isSupplierFieldRequired("category") && isSupplierFieldVisible("category") && !formData.category) {
      errs.category = "A categoria é obrigatória.";
    }
    if (isSupplierFieldRequired("notes") && isSupplierFieldVisible("notes") && !formData.notes?.trim()) {
      errs.notes = "As observações são obrigatórias.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const set = (field: keyof SupplierFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const payload: SupplierFormData = {
        ...formData,
        email: formData.email?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        location_name: formData.location_name?.trim() || "",
      };
      if (editSupplier) {
        await updateSupplier(editSupplier.id, payload);
      } else {
        await addSupplier(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao processar fornecedor:", error);
    }
  };

  // Helper label com indicador de obrigatório dinâmico
  function FieldLabel({ fieldKey, icon, children }: {
    fieldKey: keyof ReturnType<typeof useSettings>["settings"]["suppliers"]["fields"];
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) {
    const required = isSupplierFieldRequired(fieldKey as any);
    return (
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {icon}
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {editSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {editSupplier ? "Atualize as informações do fornecedor" : "Cadastre um novo parceiro ou fornecedor"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Nome — sempre obrigatório, não configurável */}
          <div className="space-y-1.5">
            <Label htmlFor="s-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="s-name"
              value={formData.name}
              onChange={set("name")}
              placeholder="Ex: Farmácia Central"
              className={cn("rounded-xl h-10 text-sm", errors.name && "border-destructive")}
              autoFocus
            />
            {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
          </div>

          {/* Categoria */}
          {isSupplierFieldVisible("category") && (
            <div className="space-y-1.5">
              <FieldLabel fieldKey="category" icon={<Tag className="h-3 w-3" />}>Categoria</FieldLabel>
              <Select
                value={formData.category || "none"}
                onValueChange={(v) => setFormData({ ...formData, category: v === "none" ? "" : v })}
              >
                <SelectTrigger className={cn("rounded-xl h-10 text-sm bg-background", errors.category && "border-destructive")}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Sem categoria</span>
                  </SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive font-medium">{errors.category}</p>}
            </div>
          )}

          <div className={cn(
            "gap-3",
            isSupplierFieldVisible("phone") && isSupplierFieldVisible("location_name") ? "grid grid-cols-2" : ""
          )}>
            {/* Telefone */}
            {isSupplierFieldVisible("phone") && (
              <div className="space-y-1.5">
                <FieldLabel fieldKey="phone" icon={<Phone className="h-3 w-3" />}>Telefone</FieldLabel>
                <Input
                  id="s-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  inputMode="numeric"
                  className={cn("rounded-xl h-10 text-sm", errors.phone && "border-destructive")}
                />
                {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone}</p>}
              </div>
            )}

            {/* Localização */}
            {isSupplierFieldVisible("location_name") && (
              <div className="space-y-1.5">
                <FieldLabel fieldKey="location_name" icon={<MapPin className="h-3 w-3" />}>Localização</FieldLabel>
                <Input
                  id="s-location"
                  value={formData.location_name}
                  onChange={set("location_name")}
                  placeholder="Ex: Centro, SP"
                  className={cn("rounded-xl h-10 text-sm", errors.location_name && "border-destructive")}
                />
                {errors.location_name && <p className="text-xs text-destructive font-medium">{errors.location_name}</p>}
              </div>
            )}
          </div>

          {/* E-mail */}
          {isSupplierFieldVisible("email") && (
            <div className="space-y-1.5">
              <FieldLabel fieldKey="email" icon={<Mail className="h-3 w-3" />}>E-mail</FieldLabel>
              <Input
                id="s-email"
                type="email"
                value={formData.email}
                onChange={set("email")}
                placeholder="contato@fornecedor.com.br"
                className={cn("rounded-xl h-10 text-sm", errors.email && "border-destructive")}
              />
              {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
            </div>
          )}

          {/* Observações */}
          {isSupplierFieldVisible("notes") && (
            <div className="space-y-1.5">
              <FieldLabel fieldKey="notes" icon={<StickyNote className="h-3 w-3" />}>Observações</FieldLabel>
              <Textarea
                id="s-notes"
                value={formData.notes}
                onChange={set("notes")}
                placeholder="Condições de pagamento, horários de atendimento, notas importantes..."
                className={cn("resize-none rounded-xl text-sm min-h-[80px]", errors.notes && "border-destructive")}
                rows={3}
              />
              {errors.notes && <p className="text-xs text-destructive font-medium">{errors.notes}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-9 text-sm">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl h-9 text-sm font-semibold px-6">
            {editSupplier ? "Salvar Alterações" : "Cadastrar Fornecedor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
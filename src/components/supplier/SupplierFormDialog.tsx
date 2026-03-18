// src/components/supplier/SupplierFormDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useSettings } from "@/hooks/useSettings";
import type { SupplierFieldSettings } from "@/types/settings";
import { useUserOptions } from "@/hooks/useUserOptions";
import { ComboInput } from "@/components/ui/ComboInput";
import { Supplier, SupplierFormData } from "@/types/supplier";
import { Building2, Phone, MapPin, Mail, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { maskPhone } from "@/hooks/useMask";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSupplier?: Supplier | null;
  onSuccess?: () => void;
}

export function SupplierFormDialog({ open, onOpenChange, editSupplier, onSuccess }: Props) {
  const { addSupplier, updateSupplier } = useTaskStore();
  const { isSupplierFieldVisible, isSupplierFieldRequired } = useSettings();
  const { options: categoryOptions, save: saveCategory, remove: removeCategory } = useUserOptions("category");

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
    if (isSupplierFieldVisible("phone")) {
      if (formData.phone && formData.phone.replace(/\D/g, "").length < 10)
        errs.phone = "Telefone inválido.";
    }
    if (isSupplierFieldVisible("email") && formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        errs.email = "E-mail inválido.";
    }
    if (isSupplierFieldRequired("location_name") && isSupplierFieldVisible("location_name") && !formData.location_name.trim())
      errs.location_name = "A localização é obrigatória.";
    if (isSupplierFieldRequired("category") && isSupplierFieldVisible("category") && !formData.category)
      errs.category = "A categoria é obrigatória.";
    if (isSupplierFieldRequired("notes") && isSupplierFieldVisible("notes") && !formData.notes?.trim())
      errs.notes = "As observações são obrigatórias.";
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
      // Salva a categoria como opção do usuário se for nova
      if (payload.category) await saveCategory(payload.category);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao processar fornecedor:", error);
    }
  };

  function FieldLabel({ fieldKey, icon, children }: {
    fieldKey: keyof SupplierFieldSettings;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) {
    const required = isSupplierFieldRequired(fieldKey);
    return (
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {icon}{children}
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
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
            >
              <Building2 className="h-4 w-4 text-primary" />
            </motion.div>
            <div>
              <DialogTitle className="text-base font-bold">
                {editSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {editSupplier ? "Atualize as informações do fornecedor" : "Cadastre um novo parceiro ou fornecedor"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <motion.div
          className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          {/* Nome */}
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

          {/* Categoria — ComboInput com opções salvas pelo usuário */}
          {isSupplierFieldVisible("category") && (
            <div className="space-y-1.5">
              <FieldLabel fieldKey="category" icon={
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              }>
                Categoria
              </FieldLabel>
              <ComboInput
                id="s-category"
                value={formData.category || ""}
                onChange={(v) => setFormData({ ...formData, category: v })}
                options={categoryOptions}
                onSaveOption={saveCategory}
                onDeleteOption={removeCategory}
                placeholder="Ex: Farmácia — Enter para salvar"
                error={!!errors.category}
              />
              {errors.category && <p className="text-xs text-destructive font-medium">{errors.category}</p>}
            </div>
          )}

          {/* Telefone + Localização */}
          <div className={cn(
            "gap-3",
            isSupplierFieldVisible("phone") && isSupplierFieldVisible("location_name") ? "grid grid-cols-2" : ""
          )}>
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
        </motion.div>

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
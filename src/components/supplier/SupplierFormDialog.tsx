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
import { Supplier, SupplierFormData } from "@/types/supplier";
import { Building2, Phone, MapPin, Mail, StickyNote, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (!formData.phone.trim()) errs.phone = "O telefone é obrigatório.";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "E-mail inválido.";
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
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="s-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Nome *
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
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Tag className="h-3 w-3" /> Categoria
            </Label>
            <Select
              value={formData.category || "none"}
              onValueChange={(v) => setFormData({ ...formData, category: v === "none" ? "" : v })}
            >
              <SelectTrigger className="rounded-xl h-10 text-sm bg-background">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Telefone */}
            <div className="space-y-1.5">
              <Label htmlFor="s-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Phone className="h-3 w-3" /> Telefone *
              </Label>
              <Input
                id="s-phone"
                value={formData.phone}
                onChange={set("phone")}
                placeholder="(11) 99999-9999"
                className={cn("rounded-xl h-10 text-sm", errors.phone && "border-destructive")}
              />
              {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone}</p>}
            </div>

            {/* Localização */}
            <div className="space-y-1.5">
              <Label htmlFor="s-location" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Localização
              </Label>
              <Input
                id="s-location"
                value={formData.location_name}
                onChange={set("location_name")}
                placeholder="Ex: Centro, SP"
                className="rounded-xl h-10 text-sm"
              />
            </div>
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label htmlFor="s-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Mail className="h-3 w-3" /> E-mail
            </Label>
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

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="s-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <StickyNote className="h-3 w-3" /> Observações
            </Label>
            <Textarea
              id="s-notes"
              value={formData.notes}
              onChange={set("notes")}
              placeholder="Condições de pagamento, horários de atendimento, notas importantes..."
              className="resize-none rounded-xl text-sm min-h-[80px]"
              rows={3}
            />
          </div>
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
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTaskStore } from "@/hooks/useTaskStore";
import { Supplier, SupplierFormData } from "@/types/supplier";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSupplier?: Supplier | null;
}

export function SupplierFormDialog({ open, onOpenChange, editSupplier }: Props) {
  const { addSupplier, updateSupplier } = useTaskStore();
  
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    phone: "",
    location_name: ""
  });

  useEffect(() => {
    if (open) {
      if (editSupplier) {
        setFormData({
          name: editSupplier.name,
          phone: editSupplier.phone,
          location_name: editSupplier.location_name
        });
      } else {
        setFormData({ name: "", phone: "", location_name: "" });
      }
    }
  }, [open, editSupplier]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) return;

    try {
      if (editSupplier) {
        await updateSupplier(editSupplier.id, formData);
      } else {
        await addSupplier(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao processar fornecedor:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Ex: Farmácia Central"
            />
          </div>
          <div className="space-y-1">
            <Label>Telefone *</Label>
            <Input 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="Ex: 11999999999"
            />
          </div>
          <div className="space-y-1">
            <Label>Local / Categoria</Label>
            <Input 
              value={formData.location_name}
              onChange={e => setFormData({...formData, location_name: e.target.value})}
              placeholder="Ex: Supermercado"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} className="font-semibold">
            {editSupplier ? "Salvar Alterações" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, MapPin, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Supplier } from "@/types/supplier";
import { SupplierFormDialog } from "./SupplierFormDialog";

export function SupplierListView() {
  const { suppliers } = useTaskStore();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      toast({ 
        variant: "destructive", 
        title: "Erro ao excluir", 
        description: "Verifique se não há tarefas vinculadas a ele." 
      });
    } else {
      toast({ title: "Fornecedor removido!" });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">Gerenciar Fornecedores</h2>
      <div className="grid gap-3">
        {suppliers.length === 0 && (
          <p className="text-muted-foreground text-center py-10 bg-card/50 rounded-xl border border-dashed">
            Nenhum fornecedor cadastrado.
          </p>
        )}
        {suppliers.map((s) => (
          <div key={s.id} className="group flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm transition-all hover:shadow-md">
            <div>
              <h3 className="font-semibold text-lg text-slate-800">{s.name}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {s.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {s.location_name}</span>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleEdit(s)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <SupplierFormDialog 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        editSupplier={selectedSupplier}
      />
    </div>
  );
}
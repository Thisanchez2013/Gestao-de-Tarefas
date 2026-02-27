// src/components/supplier/SupplierListView.tsx
import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, MapPin, Phone, MessageSquare, Building2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Supplier } from "@/types/supplier";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { motion } from "framer-motion";

function EmptySuppliers({ onNew }: { onNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 mb-4 ring-1 ring-primary/10">
        <Building2 className="h-7 w-7 text-primary/70" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Nenhum fornecedor cadastrado</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Adicione fornecedores para vinculá-los às suas tarefas e agilizar o contato.
      </p>
      <Button onClick={onNew} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Adicionar fornecedor
      </Button>
    </motion.div>
  );
}

export function SupplierListView() {
  const { suppliers } = useTaskStore();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Verifique se não há tarefas vinculadas a ele.",
      });
    } else {
      toast({ title: "Fornecedor removido!" });
    }
  };

  const handleWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  if (suppliers.length === 0) {
    return (
      <>
        <EmptySuppliers onNew={handleNew} />
        <SupplierFormDialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          editSupplier={selectedSupplier}
        />
      </>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">Fornecedores</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {suppliers.length} {suppliers.length === 1 ? "cadastrado" : "cadastrados"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleNew} className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          Novo
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {suppliers.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            whileHover={{ y: -2, transition: { duration: 0.12 } }}
            className="group relative rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground leading-tight">{s.name}</h3>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {s.location_name}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                  onClick={() => handleEdit(s)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(s.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-3 pt-3 border-t border-border/60">
              <a
                href={`tel:${s.phone}`}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-3 w-3" />
                {s.phone}
              </a>
              <button
                onClick={() => handleWhatsApp(s.phone)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors ml-auto"
              >
                <MessageSquare className="h-3 w-3" />
                WhatsApp
              </button>
            </div>
          </motion.div>
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

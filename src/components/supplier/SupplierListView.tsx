// src/components/supplier/SupplierListView.tsx
import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, MapPin, Phone, MessageSquare, Building2, Plus, Mail, Tag, StickyNote, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Supplier } from "@/types/supplier";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Farmácia":                { bg: "bg-rose-100 dark:bg-rose-950/50",      text: "text-rose-700 dark:text-rose-300"      },
  "Supermercado":            { bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300" },
  "Materiais de Construção": { bg: "bg-orange-100 dark:bg-orange-950/50",  text: "text-orange-700 dark:text-orange-300"  },
  "Serviços Elétricos":      { bg: "bg-yellow-100 dark:bg-yellow-950/50",  text: "text-yellow-700 dark:text-yellow-300"  },
  "Serviços Hidráulicos":    { bg: "bg-sky-100 dark:bg-sky-950/50",        text: "text-sky-700 dark:text-sky-300"        },
  "Limpeza":                 { bg: "bg-cyan-100 dark:bg-cyan-950/50",      text: "text-cyan-700 dark:text-cyan-300"      },
  "Alimentação":             { bg: "bg-amber-100 dark:bg-amber-950/50",    text: "text-amber-700 dark:text-amber-300"    },
  "Tecnologia":              { bg: "bg-violet-100 dark:bg-violet-950/50",  text: "text-violet-700 dark:text-violet-300"  },
  "Transporte":              { bg: "bg-blue-100 dark:bg-blue-950/50",      text: "text-blue-700 dark:text-blue-300"      },
  "Logística":               { bg: "bg-indigo-100 dark:bg-indigo-950/50",  text: "text-indigo-700 dark:text-indigo-300"  },
  "Escritório":              { bg: "bg-slate-100 dark:bg-slate-800/50",    text: "text-slate-700 dark:text-slate-300"    },
};

function getCategoryColor(category?: string) {
  if (!category) return { bg: "bg-muted", text: "text-muted-foreground" };
  return CATEGORY_COLORS[category] ?? { bg: "bg-primary/10", text: "text-primary" };
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

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
      <Button onClick={onNew} size="sm" className="gap-2 rounded-xl">
        <Plus className="h-4 w-4" />
        Adicionar fornecedor
      </Button>
    </motion.div>
  );
}

function SupplierCard({ s, onEdit, onDelete }: { s: Supplier; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = getCategoryColor(s.category);
  const initials = getInitials(s.name);
  const hasExtra = s.email || s.notes;

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3, transition: { duration: 0.12 } }}
      className="group relative rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 rounded-l-2xl" />

      <div className="pl-4 pr-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0 ring-1 ring-primary/20">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-foreground leading-tight truncate">{s.name}</h3>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {s.category && (
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", catColor.bg, catColor.text)}>
                      <Tag className="h-2.5 w-2.5" />
                      {s.category}
                    </span>
                  )}
                  {s.location_name && (
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {s.location_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={onEdit}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium">
            <Phone className="h-3 w-3" />
            {s.phone}
          </a>

          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => handleWhatsApp(s.phone)} className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 rounded-lg px-2 py-1">
              <MessageSquare className="h-3 w-3" />
              WhatsApp
            </button>

            {hasExtra && (
              <button onClick={() => setExpanded((v) => !v)} className="flex items-center justify-center h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors ml-1">
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && hasExtra && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <a href={`mailto:${s.email}`} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors truncate">
                      {s.email}
                    </a>
                  </div>
                )}
                {s.notes && (
                  <div className="flex items-start gap-2">
                    <StickyNote className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{s.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function SupplierListView() {
  const { suppliers } = useTaskStore();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleEdit = (supplier: Supplier) => { setSelectedSupplier(supplier); setIsModalOpen(true); };
  const handleNew = () => { setSelectedSupplier(null); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: "Verifique se não há tarefas vinculadas a ele." });
    } else {
      toast({ title: "Fornecedor removido!" });
    }
  };

  if (suppliers.length === 0) {
    return (
      <>
        <EmptySuppliers onNew={handleNew} />
        <SupplierFormDialog open={isModalOpen} onOpenChange={setIsModalOpen} editSupplier={selectedSupplier} />
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
        <Button size="sm" variant="outline" onClick={handleNew} className="gap-2 rounded-xl">
          <Plus className="h-3.5 w-3.5" />
          Novo
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {suppliers.map((s) => (
          <SupplierCard
            key={s.id}
            s={s}
            onEdit={() => handleEdit(s)}
            onDelete={() => handleDelete(s.id)}
          />
        ))}
      </div>

      <SupplierFormDialog open={isModalOpen} onOpenChange={setIsModalOpen} editSupplier={selectedSupplier} />
    </div>
  );
}
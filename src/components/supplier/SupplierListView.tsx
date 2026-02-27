import { useState, useRef, useEffect } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, Pencil, Phone, MapPin, ChevronDown,
  Check, X, Building2, Tag, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Supplier } from "@/types/supplier";

// ─── Mapa de cores por categoria ────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  alimentacao:  { bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-400" },
  tecnologia:   { bg: "bg-blue-50",     text: "text-blue-700",     dot: "bg-blue-400"    },
  logistica:    { bg: "bg-amber-50",    text: "text-amber-700",    dot: "bg-amber-400"   },
  limpeza:      { bg: "bg-violet-50",   text: "text-violet-700",   dot: "bg-violet-400"  },
  manutencao:   { bg: "bg-orange-50",   text: "text-orange-700",   dot: "bg-orange-400"  },
  default:      { bg: "bg-slate-100",   text: "text-slate-600",    dot: "bg-slate-400"   },
};

function getCategoryStyle(category?: string) {
  if (!category) return CATEGORY_STYLES.default;
  const key = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATEGORY_STYLES[key] ?? CATEGORY_STYLES.default;
}

// ─── Componente de campo editável inline ────────────────────────────────────
function InlineField({
  icon: Icon,
  value,
  placeholder,
  isEditing,
  onChange,
}: {
  icon: React.ElementType;
  value: string;
  placeholder: string;
  isEditing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      {isEditing ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-7 text-sm border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 px-2 py-0 rounded-md"
        />
      ) : (
        <span className="text-slate-600 truncate">{value || <span className="text-slate-300 italic">{placeholder}</span>}</span>
      )}
    </div>
  );
}

// ─── Card individual ─────────────────────────────────────────────────────────
function SupplierCard({ supplier }: { supplier: Supplier }) {
  const { updateSupplier, deleteSupplier } = useTaskStore();
  const { toast } = useToast();

  const [expanded, setExpanded]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draft, setDraft] = useState({
    name:          supplier.name          ?? "",
    phone:         supplier.phone         ?? "",
    location_name: supplier.location_name ?? "",
    category:      supplier.category      ?? "",
  });

  // Sincroniza draft se o supplier vier atualizado de fora
  useEffect(() => {
    if (!isEditing) {
      setDraft({
        name:          supplier.name          ?? "",
        phone:         supplier.phone         ?? "",
        location_name: supplier.location_name ?? "",
        category:      supplier.category      ?? "",
      });
    }
  }, [supplier, isEditing]);

  const catStyle = getCategoryStyle(supplier.category);

  // ── Edição ────────────────────────────────────────────────────────────────
  const handleEdit = () => {
    setExpanded(true);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft({
      name:          supplier.name          ?? "",
      phone:         supplier.phone         ?? "",
      location_name: supplier.location_name ?? "",
      category:      supplier.category      ?? "",
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório" });
      return;
    }
    setIsSaving(true);
    await updateSupplier(supplier.id, draft);
    setIsSaving(false);
    setIsEditing(false);
  };

  // ── Exclusão com confirmação dupla ───────────────────────────────────────
  const handleDeleteClick = () => {
    if (confirmDelete) {
      // segunda vez: exclui de facto
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteSupplier(supplier.id);
    } else {
      // primeira vez: pede confirmação
      setConfirmDelete(true);
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  useEffect(() => () => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
  }, []);

  return (
    <div
      className={`
        group relative bg-white border rounded-2xl shadow-sm overflow-hidden
        transition-all duration-300
        ${isEditing ? "border-slate-400 shadow-md ring-1 ring-slate-300" : "border-slate-200 hover:border-slate-300 hover:shadow-md"}
      `}
    >
      {/* Faixa lateral colorida por categoria */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${catStyle.dot}`} />

      {/* ── Cabeçalho (sempre visível) ─────────────────────────────────── */}
      <div className="pl-5 pr-4 py-3.5 flex items-center justify-between gap-3">
        {/* Nome + categoria */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar inicial */}
          <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${catStyle.bg} ${catStyle.text}`}>
            {(supplier.name ?? "?")[0].toUpperCase()}
          </div>

          <div className="min-w-0">
            {isEditing ? (
              <Input
                value={draft.name}
                onChange={(e) => setDraft(p => ({ ...p, name: e.target.value }))}
                placeholder="Nome do fornecedor"
                className="h-7 font-semibold text-slate-800 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 px-2 py-0 rounded-md"
              />
            ) : (
              <p className="font-semibold text-slate-800 truncate leading-tight">{supplier.name}</p>
            )}

            {/* Badge de categoria */}
            {supplier.category && !isEditing && (
              <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium ${catStyle.bg} ${catStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                {supplier.category}
              </span>
            )}
            {isEditing && (
              <Input
                value={draft.category}
                onChange={(e) => setDraft(p => ({ ...p, category: e.target.value }))}
                placeholder="Categoria"
                className="h-6 mt-1 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 px-2 py-0 rounded-md w-32"
              />
            )}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-slate-600"
                onClick={handleCancel}
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 bg-slate-800 hover:bg-slate-900 text-white rounded-lg"
                onClick={handleSave}
                disabled={isSaving}
                title="Salvar"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700"
                onClick={handleEdit}
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className={`h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity
                  ${confirmDelete
                    ? "opacity-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 animate-pulse"
                    : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                onClick={handleDeleteClick}
                title={confirmDelete ? "Clique novamente para confirmar" : "Excluir"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-slate-700"
                onClick={() => setExpanded(p => !p)}
                title={expanded ? "Recolher" : "Expandir"}
              >
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Detalhes expandíveis ────────────────────────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out
          ${expanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="pl-5 pr-4 pb-4 pt-1 border-t border-slate-100 space-y-2.5">
          <InlineField
            icon={Phone}
            value={draft.phone}
            placeholder="Telefone"
            isEditing={isEditing}
            onChange={(v) => setDraft(p => ({ ...p, phone: v }))}
          />
          <InlineField
            icon={MapPin}
            value={draft.location_name}
            placeholder="Localização"
            isEditing={isEditing}
            onChange={(v) => setDraft(p => ({ ...p, location_name: v }))}
          />

          {/* Rodapé com dica de exclusão dupla */}
          {confirmDelete && (
            <p className="text-xs text-red-500 font-medium pt-1 flex items-center gap-1">
              <X className="h-3 w-3" />
              Clique novamente no ícone de lixo para confirmar a exclusão
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Lista principal ─────────────────────────────────────────────────────────
export function SupplierListView() {
  const { suppliers } = useTaskStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Fornecedores</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {suppliers.length} {suppliers.length === 1 ? "cadastrado" : "cadastrados"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Building2 className="h-4 w-4" />
          <span>Passe o mouse sobre o card para editar</span>
        </div>
      </div>

      <div className="grid gap-2.5">
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Building2 className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-slate-400 text-sm">Nenhum fornecedor cadastrado.</p>
          </div>
        ) : (
          suppliers.map((s) => <SupplierCard key={s.id} supplier={s} />)
        )}
      </div>
    </div>
  );
}
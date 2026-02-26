// src/pages/Index.tsx
import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useTheme } from "@/hooks/useTheme";
import { Dashboard } from "@/components/Dashboard";
import { FilterBar } from "@/components/FilterBar";
import { TaskCard } from "@/components/TaskCard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { SupplierFormDialog } from "@/components/supplier/SupplierFormDialog";
import { SupplierListView } from "@/components/supplier/SupplierListView"; // Novo componente de listagem
import { TrashView } from "@/components/TrashView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  ListTodo, 
  Moon, 
  Sun, 
  Search, 
  LogOut,
  UserPlus 
} from "lucide-react";
import type { Task } from "@/types/task";

const Index = () => {
  const store = useTaskStore();
  const { dark, toggle: toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Atualizado para incluir a aba de fornecedores
  const [tab, setTab] = useState<"tasks" | "trash" | "suppliers">("tasks");
  const [formOpen, setFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({ title: "Até logo!", description: "Você saiu com sucesso." });
      navigate("/login");
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Erro ao sair", 
        description: error.message 
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <ListTodo className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Minhas Tarefas</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} title="Alternar tema">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setSupplierFormOpen(true)}
              className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 transition-all shadow-sm"
            >
              <UserPlus className="h-4 w-4 mr-2" /> 
              <span className="hidden sm:inline">Novo Fornecedor</span>
              <span className="sm:hidden">Fornecedor</span>
            </Button>

            <Button onClick={() => { setEditTask(null); setFormOpen(true); }} className="shadow-md">
              <Plus className="h-4 w-4 mr-2" /> 
              <span className="hidden sm:inline">Nova Tarefa</span>
              <span className="sm:hidden">Tarefa</span>
            </Button>

            <Button 
              size="icon" 
              variant="outline" 
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Dashboard pendingCount={store.pendingCount} completedCount={store.completedCount} />
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas pelo título..."
            className="pl-10 h-11 bg-card"
            value={store.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
          />
        </div>

        {/* Abas de Navegação Atualizadas */}
        <div className="flex gap-6 border-b overflow-x-auto">
          <button 
            onClick={() => setTab("tasks")} 
            className={`pb-3 text-sm whitespace-nowrap transition-colors relative ${
              tab === "tasks" ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            Ativas
            {tab === "tasks" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <button 
            onClick={() => setTab("suppliers")} 
            className={`pb-3 text-sm whitespace-nowrap transition-colors relative ${
              tab === "suppliers" ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            Fornecedores ({store.suppliers.length})
            {tab === "suppliers" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <button 
            onClick={() => setTab("trash")} 
            className={`pb-3 text-sm whitespace-nowrap transition-colors relative ${
              tab === "trash" ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            Lixeira ({store.trashedTasks.length})
            {tab === "trash" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>

        {/* Conteúdo Dinâmico com a nova aba */}
        {tab === "tasks" && (
          <div className="space-y-6">
            <FilterBar 
              filterStatus={store.filterStatus} 
              filterPriority={store.filterPriority} 
              onStatusChange={store.setFilterStatus} 
              onPriorityChange={store.setFilterPriority} 
            />
            
            <div className="space-y-3">
              {store.tasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={handleEdit} 
                  onToggle={store.toggleStatus} 
                  onDelete={store.softDelete} 
                />
              ))}
              
              {store.tasks.length === 0 && (
                <div className="text-center py-16 bg-card/50 rounded-xl border border-dashed">
                  <p className="text-muted-foreground">
                    {store.searchQuery ? "Nenhuma tarefa encontrada para esta busca." : "Sua lista está limpa!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "suppliers" && (
          <SupplierListView />
        )}

        {tab === "trash" && (
          <TrashView 
            tasks={store.trashedTasks} 
            onRestore={store.restore} 
            onPermanentDelete={store.permanentDelete} 
          />
        )}
      </main>

      {/* Modais de Formulário */}
      <TaskFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={store.addTask} 
        editTask={editTask} 
        onUpdate={store.updateTask} 
      />

      <SupplierFormDialog 
        open={supplierFormOpen} 
        onOpenChange={setSupplierFormOpen} 
      />
    </div>
  );
};

export default Index;
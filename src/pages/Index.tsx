import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useTheme } from "@/hooks/useTheme";
import { Dashboard } from "@/components/Dashboard";
import { FilterBar } from "@/components/FilterBar";
import { TaskCard } from "@/components/TaskCard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { TrashView } from "@/components/TrashView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Certifique-se de ter o componente Input
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ListTodo, Moon, Sun, Search } from "lucide-react";
import type { Task } from "@/types/task";

const Index = () => {
  const store = useTaskStore();
  const { dark, toggle: toggleTheme } = useTheme();
  const { toast } = useToast();
  const [tab, setTab] = useState<"tasks" | "trash">("tasks");
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            <h1 className="text-xl font-bold">Tarefas</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button onClick={() => { setEditTask(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Dashboard pendingCount={store.pendingCount} completedCount={store.completedCount} />
        
        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas pelo título..."
            className="pl-10"
            value={store.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-4 border-b">
          <button onClick={() => setTab("tasks")} className={`pb-2 ${tab === "tasks" ? "border-b-2 border-primary font-bold" : ""}`}>
            Ativas
          </button>
          <button onClick={() => setTab("trash")} className={`pb-2 ${tab === "trash" ? "border-b-2 border-primary font-bold" : ""}`}>
            Lixeira ({store.trashedTasks.length})
          </button>
        </div>

        {tab === "tasks" ? (
          <>
            <FilterBar 
              filterStatus={store.filterStatus} 
              filterPriority={store.filterPriority} 
              onStatusChange={store.setFilterStatus} 
              onPriorityChange={store.setFilterPriority} 
            />
            <div className="space-y-2">
              {store.tasks.map(task => (
                <TaskCard key={task.id} task={task} onEdit={handleEdit} onToggle={store.toggleStatus} onDelete={store.softDelete} />
              ))}
              {store.tasks.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  {store.searchQuery ? "Nenhuma tarefa encontrada para esta busca." : "Nenhuma tarefa pendente."}
                </p>
              )}
            </div>
          </>
        ) : (
          <TrashView tasks={store.trashedTasks} onRestore={store.restore} onPermanentDelete={store.permanentDelete} />
        )}
      </main>

      <TaskFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={store.addTask} 
        editTask={editTask} 
        onUpdate={store.updateTask} 
      />
    </div>
  );
};

export default Index;
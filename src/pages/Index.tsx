import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useTheme } from "@/hooks/useTheme";
import { Dashboard } from "@/components/Dashboard";
import { FilterBar } from "@/components/FilterBar";
import { TaskCard } from "@/components/TaskCard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { TrashView } from "@/components/TrashView";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ListTodo, Moon, Sun } from "lucide-react";
import type { Task } from "@/types/task";

type Tab = "tasks" | "trash";

const Index = () => {
  const store = useTaskStore();
  const { dark, toggle: toggleTheme } = useTheme();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("tasks");
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  function handleEdit(task: Task) {
    setEditTask(task);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    store.softDelete(id);
    toast({ title: "Tarefa movida para a lixeira." });
  }

  function handleToggle(id: string) {
    store.toggleStatus(id);
    const task = store.tasks.find((t) => t.id === id);
    toast({
      title:
        task?.status === "pending"
          ? "Tarefa concluída com sucesso!"
          : "Tarefa reaberta.",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-foreground" />
            <h1 className="text-xl font-bold">Tarefas</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              onClick={() => {
                setEditTask(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Dashboard pendingCount={store.pendingCount} completedCount={store.completedCount} />

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setTab("tasks")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "tasks"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Tarefas
          </button>
          <button
            onClick={() => setTab("trash")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
              tab === "trash"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Lixeira
            {store.trashedTasks.length > 0 && (
              <span className="bg-secondary text-secondary-foreground text-xs rounded-full px-1.5">
                {store.trashedTasks.length}
              </span>
            )}
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
            {store.tasks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg">Nenhuma tarefa encontrada</p>
                <p className="text-sm mt-1">Crie sua primeira tarefa para começar!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {store.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <TrashView
            tasks={store.trashedTasks}
            onRestore={store.restore}
            onPermanentDelete={store.permanentDelete}
          />
        )}
      </main>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditTask(null);
        }}
        onSubmit={store.addTask}
        editTask={editTask}
        onUpdate={store.updateTask}
      />
    </div>
  );
};

export default Index;

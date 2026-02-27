// src/pages/Index.tsx
import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useTheme } from "@/hooks/useTheme";
import { Dashboard } from "@/components/Dashboard";
import { FilterBar } from "@/components/FilterBar";
import { TaskCard } from "@/components/TaskCard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { SupplierFormDialog } from "@/components/supplier/SupplierFormDialog";
import { SupplierListView } from "@/components/supplier/SupplierListView";
import { TrashView } from "@/components/TrashView";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  CheckSquare,
  Moon,
  Sun,
  Search,
  LogOut,
  UserPlus,
  ClipboardList,
  Trash2,
  Building2,
} from "lucide-react";
import type { Task } from "@/types/task";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "tasks" | "trash" | "suppliers";

const Index = () => {
  const store = useTaskStore();
  const { dark, toggle: toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("tasks");
  const [formOpen, setFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: "Até logo!", description: "Você saiu com sucesso." });
      navigate("/login");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao sair", description: error.message });
    }
  };

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setFormOpen(true);
  };

  const handleOpen = (task: Task) => {
    setDetailTask(task);
    setDetailOpen(true);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "tasks",
      label: "Tarefas",
      icon: <ClipboardList className="h-3.5 w-3.5" />,
      count: store.pendingCount > 0 ? store.pendingCount : undefined,
    },
    {
      id: "suppliers",
      label: "Fornecedores",
      icon: <Building2 className="h-3.5 w-3.5" />,
      count: store.suppliers.length > 0 ? store.suppliers.length : undefined,
    },
    {
      id: "trash",
      label: "Lixeira",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      count: store.trashedTasks.length > 0 ? store.trashedTasks.length : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
              <CheckSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight hidden sm:inline">
              Task<span className="text-primary">Flow</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSupplierFormOpen(true)}
              className="h-8 rounded-xl border-primary/20 text-primary hover:bg-primary/5 hover:text-primary gap-1.5 hidden sm:flex"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Fornecedor
            </Button>

            <Button
              size="sm"
              onClick={() => { setEditTask(null); setFormOpen(true); }}
              className="h-8 rounded-xl gap-1.5 shadow-sm shadow-primary/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nova Tarefa</span>
              <span className="sm:hidden">Tarefa</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleLogout}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/8"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Dashboard stats */}
        <Dashboard
          pendingCount={store.pendingCount}
          completedCount={store.completedCount}
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar tarefas pelo título…"
            className="pl-10 h-10 rounded-xl bg-card border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
            value={store.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 border-b border-border/60 overflow-x-auto scrollbar-thin">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                relative flex items-center gap-1.5 px-3 pb-3 pt-1 text-sm whitespace-nowrap transition-colors
                ${tab === t.id
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className={`
                  inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold
                  ${tab === t.id
                    ? "bg-primary/12 text-primary"
                    : "bg-muted text-muted-foreground"
                  }
                `}>
                  {t.count}
                </span>
              )}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "tasks" && (
              <div className="space-y-4">
                <FilterBar
                  filterStatus={store.filterStatus}
                  filterPriority={store.filterPriority}
                  onStatusChange={store.setFilterStatus}
                  onPriorityChange={store.setFilterPriority}
                />

                {/* Task list */}
                <div className="space-y-2 task-list">
                  {store.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onToggle={store.toggleStatus}
                      onDelete={store.softDelete}
                      onOpen={handleOpen}
                    />
                  ))}
                </div>

                {/* Empty state */}
                {store.tasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 mb-4 ring-1 ring-primary/10">
                      <ClipboardList className="h-7 w-7 text-primary/60" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {store.searchQuery ? "Nenhum resultado" : "Tudo limpo!"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {store.searchQuery
                        ? `Nenhuma tarefa com "${store.searchQuery}".`
                        : "Adicione sua primeira tarefa para começar."}
                    </p>
                    {!store.searchQuery && (
                      <Button
                        size="sm"
                        onClick={() => { setEditTask(null); setFormOpen(true); }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Nova Tarefa
                      </Button>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {tab === "suppliers" && <SupplierListView />}

            {tab === "trash" && (
              <TrashView
                tasks={store.trashedTasks}
                onRestore={store.restore}
                onPermanentDelete={store.permanentDelete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
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

      <TaskDetailModal
        task={detailTask ? store.suppliers
          ? { ...detailTask, supplier: store.suppliers.find(s => s.id === detailTask.supplier_id) }
          : detailTask
        : null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggle={store.toggleStatus}
        onEdit={handleEdit}
        onDelete={store.softDelete}
      />
    </div>
  );
};

export default Index;
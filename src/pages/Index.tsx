// src/pages/Index.tsx
import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";
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
  KeyRound,
  Settings2,
  CalendarDays,
} from "lucide-react";
import type { Task } from "@/types/task";
import { motion, AnimatePresence } from "framer-motion";
import { FeedbackOverlay } from "@/components/FeedbackOverlay";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { useDueDateAlerts } from "@/hooks/useDueDateAlerts";
import { useI18n } from "@/hooks/useI18n";

type Tab = "tasks" | "trash" | "suppliers";

const Index = () => {
  const store = useTaskStore();
  const { dark, toggle: toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { feedback, trigger: triggerFeedback, clear: clearFeedback } = useActionFeedback();
  const t = useI18n();

  // Alertas de data de vencimento controlados por settings.notifications
  useDueDateAlerts(store.tasks);

  const defaultTab = (settings.system.defaultTab as Tab) ?? "tasks";
  const [tab, setTab] = useState<Tab>(defaultTab);
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
      label: t.tasks,
      icon: <ClipboardList className="h-3.5 w-3.5" />,
      count: store.pendingCount > 0 ? store.pendingCount : undefined,
    },
    {
      id: "suppliers",
      label: t.suppliers,
      icon: <Building2 className="h-3.5 w-3.5" />,
      count: store.suppliers.length > 0 ? store.suppliers.length : undefined,
    },
    {
      id: "trash",
      label: t.trash,
      icon: <Trash2 className="h-3.5 w-3.5" />,
      count: store.trashedTasks.length > 0 ? store.trashedTasks.length : undefined,
    },
  ];

  // Wrappers com feedback visual
  async function handleAddTask(data: import("@/types/task").TaskFormData) {
    await store.addTask(data);
    triggerFeedback("task-created");
  }

  async function handleAddSupplier(data: import("@/types/supplier").SupplierFormData) {
    await store.addSupplier(data);
    triggerFeedback("supplier-created");
  }

  // Som de conclusão de tarefa (configuração notifications.taskCompletionSound)
  function playCompletionSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 660;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { }
  }

  function handleToggleWithFeedback(id: string) {
    const task = store.tasks.find(t => t.id === id) ?? store.trashedTasks.find(t => t.id === id);
    const willComplete = task?.status === "pending";
    store.toggleStatus(id);
    if (willComplete) {
      triggerFeedback("task-completed");
      if (settings.notifications.enabled && settings.notifications.taskCompletionSound) {
        playCompletionSound();
      }
    } else {
      triggerFeedback("task-reopened");
    }
  }

  function handleDeleteWithFeedback(id: string) {
    store.softDelete(id);
    triggerFeedback("task-deleted");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Feedback visual global */}
      <FeedbackOverlay type={feedback.type} onDone={clearFeedback} />

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
              {t.newSupplier}
            </Button>

            <Button
              size="sm"
              onClick={() => { setEditTask(null); setFormOpen(true); }}
              className="h-8 rounded-xl gap-1.5 shadow-sm shadow-primary/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.newTask}</span>
              <span className="sm:hidden">{t.task}</span>
            </Button>

            {/* Timeline — controlado por calendar.enabled */}
            {settings.calendar.enabled && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate("/timeline")}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                title="Timeline do dia"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            )}

            {/* Configurações */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/settings")}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              title="Configurações"
            >
              <Settings2 className="h-4 w-4" />
            </Button>

            {/* Alterar senha — controlado por security.showChangePasswordInMenu */}
            {settings.security.showChangePasswordInMenu && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate("/alterar-senha")}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                title="Alterar senha"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            )}

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
        {/* Dashboard — controlado pelas configurações */}
        {settings.interface.showDashboard && (
          <Dashboard
            pendingCount={store.pendingCount}
            completedCount={store.completedCount}
          />
        )}

        {/* Search — controlado pelas configurações */}
        {settings.interface.showSearchBar && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar tarefas pelo título…"
              className="pl-10 h-10 rounded-xl bg-card border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
            />
          </div>
        )}

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
              {settings.interface.showTaskCount && t.count !== undefined && (
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
            initial={settings.interface.animationsEnabled ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={settings.interface.animationsEnabled ? { opacity: 0, y: -4 } : undefined}
            transition={{ duration: 0.2 }}
          >
            {tab === "tasks" && (
              <div className="space-y-4">
                {/* FilterBar — controlada pelas configurações */}
                {settings.interface.showFilterBar && (
                  <FilterBar
                    filterStatus={store.filterStatus}
                    filterPriority={store.filterPriority}
                    onStatusChange={store.setFilterStatus}
                    onPriorityChange={store.setFilterPriority}
                  />
                )}

                {/* Task list */}
                <div className={`task-list ${settings.interface.compactCards ? "space-y-1" : "space-y-2"}`}>
                  {store.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onToggle={handleToggleWithFeedback}
                      onDelete={handleDeleteWithFeedback}
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
                      {store.searchQuery ? t.noResults : t.allClean}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {store.searchQuery
                        ? t.noTaskWith(store.searchQuery)
                        : t.addFirstTask}
                    </p>
                    {!store.searchQuery && (
                      <Button
                        size="sm"
                        onClick={() => { setEditTask(null); setFormOpen(true); }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {t.newTask}
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
        onSubmit={handleAddTask}
        editTask={editTask}
        onUpdate={store.updateTask}
      />

      <SupplierFormDialog
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        onSuccess={() => triggerFeedback("supplier-created")}
      />

      <TaskDetailModal
        task={detailTask
          ? store.suppliers
            ? { ...detailTask, supplier: store.suppliers.find(s => s.id === detailTask.supplier_id) }
            : detailTask
          : null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggle={handleToggleWithFeedback}
        onEdit={handleEdit}
        onDelete={handleDeleteWithFeedback}
      />
    </div>
  );
};

export default Index;
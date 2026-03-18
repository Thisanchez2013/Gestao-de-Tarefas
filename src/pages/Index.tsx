// src/pages/Index.tsx — mobile-first, sem duplicação de botões
import { useState } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";
import { Dashboard } from "@/components/Dashboard";
import { FilterBar } from "@/components/FilterBar";
import { TaskCard } from "@/components/TaskCard";
import { KanbanView } from "@/components/KanbanView";
import { BulkActionBar } from "@/components/BulkActionBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
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
  Plus, CheckSquare, Moon, Sun, Search, LogOut,
  UserPlus, ClipboardList, Trash2, Building2,
  Settings2, CalendarDays, LayoutList, Columns2, CheckCheck, X,
} from "lucide-react";
import type { Task } from "@/types/task";
import { motion, AnimatePresence } from "framer-motion";
import { FeedbackOverlay } from "@/components/FeedbackOverlay";
import { useActionFeedback } from "@/hooks/Useactionfeedback";
import { useDueDateAlerts } from "@/hooks/useDueDateAlerts";
import { useI18n } from "@/hooks/useI18n";

type Tab = "tasks" | "trash" | "suppliers";
type ViewMode = "list" | "kanban";

const Index = () => {
  const store = useTaskStore();
  const { dark, toggle: toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { feedback, trigger: triggerFeedback, clear: clearFeedback } = useActionFeedback();
  const t = useI18n();

  useDueDateAlerts(store.tasks);

  const defaultTab = (settings.system.defaultTab as Tab) ?? "tasks";
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [formOpen, setFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const allTaskIds = store.tasks.map((t) => t.id);
  const bulk = useBulkSelection(allTaskIds);

  // ─── handlers ──────────────────────────────────────────────

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

  const handleEdit = (task: Task) => { setEditTask(task); setFormOpen(true); };
  const handleOpen = (task: Task) => { setDetailTask(task); setDetailOpen(true); };

  async function handleAddTask(data: import("@/types/task").TaskFormData) {
    await store.addTask(data);
    triggerFeedback("task-created");
  }
  async function handleAddSupplier(data: import("@/types/supplier").SupplierFormData) {
    await store.addSupplier(data);
    triggerFeedback("supplier-created");
  }

  function playCompletionSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 660; osc.type = "sine";
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch { }
  }

  function handleToggleWithFeedback(id: string) {
    const task = store.tasks.find((t) => t.id === id) ?? store.trashedTasks.find((t) => t.id === id);
    const willComplete = task?.status === "pending";
    store.toggleStatus(id);
    if (willComplete) {
      triggerFeedback("task-completed");
      if (settings.notifications.enabled && settings.notifications.taskCompletionSound) playCompletionSound();
    } else {
      triggerFeedback("task-reopened");
    }
  }

  function handleDeleteWithFeedback(id: string) {
    store.softDelete(id);
    triggerFeedback("task-deleted");
  }

  // ─── Bulk ───────────────────────────────────────────────────

  async function handleBulkComplete() {
    const ids = Array.from(bulk.selectedIds);
    await Promise.all(
      ids.filter((id) => store.tasks.find((t) => t.id === id)?.status === "pending")
        .map((id) => store.toggleStatus(id))
    );
    toast({ title: `${ids.length} tarefa(s) concluída(s)!` });
    bulk.clearSelection();
    triggerFeedback("task-completed");
  }

  async function handleBulkReopen() {
    const ids = Array.from(bulk.selectedIds);
    await Promise.all(
      ids.filter((id) => store.tasks.find((t) => t.id === id)?.status === "completed")
        .map((id) => store.toggleStatus(id))
    );
    toast({ title: `${ids.length} tarefa(s) reaberta(s)!` });
    bulk.clearSelection();
    triggerFeedback("task-reopened");
  }

  async function handleBulkDelete() {
    const ids = Array.from(bulk.selectedIds);
    await Promise.all(ids.map((id) => store.softDelete(id)));
    toast({ title: `${ids.length} tarefa(s) movida(s) para a lixeira.` });
    bulk.clearSelection();
    bulk.toggleSelectionMode();
    triggerFeedback("task-deleted");
  }

  function handleCancelBulk() {
    bulk.clearSelection();
    bulk.toggleSelectionMode();
  }

  // ─── Tabs ───────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "tasks", label: t.tasks,
      icon: <ClipboardList className="h-3.5 w-3.5" />,
      count: store.pendingCount > 0 ? store.pendingCount : undefined,
    },
    {
      id: "suppliers", label: t.suppliers,
      icon: <Building2 className="h-3.5 w-3.5" />,
      count: store.suppliers.length > 0 ? store.suppliers.length : undefined,
    },
    {
      id: "trash", label: t.trash,
      icon: <Trash2 className="h-3.5 w-3.5" />,
      count: store.trashedTasks.length > 0 ? store.trashedTasks.length : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <FeedbackOverlay type={feedback.type} onDone={clearFeedback} />

      {/* ─── Header ────────────────────────────────────────────
          Mobile:  logo + tema + logout (3 ícones apenas)
          Desktop: logo + todos os botões
      ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-2">

          {/* Logo */}
          <div className="flex items-center gap-2 mr-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30 shrink-0">
              <CheckSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight hidden sm:inline">
              Task<span className="text-primary">Flow</span>
            </span>
          </div>

          {/* Overlay de busca no mobile */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-0 top-0 z-30 flex items-center h-14 px-3 bg-card border-b gap-2"
              >
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  placeholder="Buscar tarefas…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  value={store.searchQuery}
                  onChange={(e) => store.setSearchQuery(e.target.value)}
                />
                <button
                  onClick={() => { setSearchOpen(false); store.setSearchQuery(""); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Botões do header ──
              No mobile: apenas Busca + Tema + Logout
              No desktop: todos os botões
          ── */}
          <div className="flex items-center gap-1">

            {/* Busca — ícone mobile, input inline desktop */}
            {settings.interface.showSearchBar && (
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground sm:hidden"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* Tema — visível em ambos */}
            <Button
              size="icon" variant="ghost" onClick={toggleTheme}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* ── Botões APENAS no desktop (sm:flex) ── */}
            <Button
              variant="outline" size="sm"
              onClick={() => setSupplierFormOpen(true)}
              className="h-8 rounded-xl border-primary/20 text-primary hover:bg-primary/5 gap-1.5 hidden sm:flex"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t.newSupplier}
            </Button>

            <Button
              size="sm"
              onClick={() => { setEditTask(null); setFormOpen(true); }}
              className="h-8 rounded-xl gap-1.5 shadow-sm shadow-primary/20 hidden sm:flex"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.newTask}
            </Button>

            {settings.calendar.enabled && (
              <Button
                size="icon" variant="ghost"
                onClick={() => navigate("/timeline")}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hidden sm:flex"
                title="Timeline"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            )}

            {/* Settings — sempre visível (desktop e mobile) */}
            <Button
              size="icon" variant="ghost"
              onClick={() => navigate("/settings")}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              title="Configurações"
            >
              <Settings2 className="h-4 w-4" />
            </Button>

            {/* Logout — visível em ambos */}
            <Button
              size="icon" variant="ghost" onClick={handleLogout}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/8"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search bar inline — só desktop */}
        {settings.interface.showSearchBar && (
          <div className="hidden sm:block border-t border-border/40">
            <div className="max-w-5xl mx-auto px-6 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar tarefas pelo título…"
                  className="pl-9 h-8 rounded-lg bg-muted/50 border-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                  value={store.searchQuery}
                  onChange={(e) => store.setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Main ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">

        {settings.interface.showDashboard && (
          <Dashboard pendingCount={store.pendingCount} completedCount={store.completedCount} />
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border/60 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {tabs.map((tab_item) => (
            <button
              key={tab_item.id}
              onClick={() => setTab(tab_item.id)}
              className={`relative flex items-center gap-1.5 px-3 pb-3 pt-1 text-sm whitespace-nowrap transition-colors shrink-0
                ${tab === tab_item.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab_item.icon}
              {tab_item.label}
              {settings.interface.showTaskCount && tab_item.count !== undefined && (
                <span className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold
                  ${tab === tab_item.id ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {tab_item.count}
                </span>
              )}
              {tab === tab_item.id && (
                <motion.div layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />
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
              <div className="space-y-3">

                {/* Controles: filtros + toggle visualização + bulk */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {settings.interface.showFilterBar && (
                    <div className="overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 flex-1">
                      <FilterBar
                        filterStatus={store.filterStatus}
                        filterPriority={store.filterPriority}
                        onStatusChange={store.setFilterStatus}
                        onPriorityChange={store.setFilterPriority}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 justify-end shrink-0">
                    {store.tasks.length > 0 && (
                      <Button
                        size="icon"
                        variant={bulk.isSelecting ? "secondary" : "ghost"}
                        onClick={bulk.toggleSelectionMode}
                        className="h-8 w-8 rounded-xl"
                        title="Ações em massa"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="flex items-center gap-0.5 rounded-xl border border-border/80 bg-card p-0.5">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors
                          ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        title="Lista"
                      >
                        <LayoutList className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode("kanban")}
                        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors
                          ${viewMode === "kanban" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        title="Kanban"
                      >
                        <Columns2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista */}
                {viewMode === "list" && (
                  <div className={`task-list ${settings.interface.compactCards ? "space-y-1" : "space-y-2"}`}>
                    {store.tasks.map((task) => (
                      <div key={task.id} className="relative">
                        {bulk.isSelecting && (
                          <div
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
                            onClick={() => bulk.toggleItem(task.id)}
                          >
                            <div className={`h-4 w-4 rounded border-2 transition-all
                              ${bulk.isSelected(task.id) ? "bg-primary border-primary" : "border-muted-foreground/40 bg-card"}`}>
                              {bulk.isSelected(task.id) && (
                                <svg className="h-3 w-3 text-primary-foreground m-auto" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
                        <div
                          className={bulk.isSelecting ? "pl-8 transition-all" : ""}
                          onClick={bulk.isSelecting ? () => bulk.toggleItem(task.id) : undefined}
                        >
                          <TaskCard
                            task={task}
                            onEdit={handleEdit}
                            onToggle={handleToggleWithFeedback}
                            onDelete={handleDeleteWithFeedback}
                            onOpen={handleOpen}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Kanban */}
                {viewMode === "kanban" && (
                  <KanbanView
                    tasks={store.tasks}
                    onUpdate={store.updateTask}
                    onToggle={handleToggleWithFeedback}
                    onEdit={handleEdit}
                    onDelete={handleDeleteWithFeedback}
                    onOpen={handleOpen}
                    isSelecting={bulk.isSelecting}
                    selectedIds={bulk.selectedIds}
                    onSelect={bulk.toggleItem}
                  />
                )}

                {/* Empty state */}
                {store.tasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 mb-4 ring-1 ring-primary/10">
                      <ClipboardList className="h-6 w-6 text-primary/60" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {store.searchQuery ? t.noResults : t.allClean}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5 max-w-[240px]">
                      {store.searchQuery ? t.noTaskWith(store.searchQuery) : t.addFirstTask}
                    </p>
                    {!store.searchQuery && (
                      <Button size="sm" onClick={() => { setEditTask(null); setFormOpen(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />{t.newTask}
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

      {/* ─── Bottom nav — APENAS mobile ────────────────────────
          Contém apenas ações que NÃO estão no header mobile.
          Settings está no header, então não duplica aqui.
      ───────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-card/95 backdrop-blur-xl border-t border-border/60">
        <div className="flex items-center justify-around px-2 py-1.5 pb-[max(env(safe-area-inset-bottom),8px)]">

          {/* Nova tarefa */}
          <button
            onClick={() => { setEditTask(null); setFormOpen(true); }}
            className="flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 px-3 rounded-xl bg-primary text-primary-foreground shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Nova</span>
          </button>

          {/* Timeline (só se ativo) */}
          {settings.calendar.enabled && (
            <button
              onClick={() => navigate("/timeline")}
              className="flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 px-3 rounded-xl text-muted-foreground"
            >
              <CalendarDays className="h-5 w-5" />
              <span className="text-[10px] font-medium">Agenda</span>
            </button>
          )}

          {/* Novo fornecedor */}
          <button
            onClick={() => setSupplierFormOpen(true)}
            className="flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 px-3 rounded-xl text-muted-foreground"
          >
            <UserPlus className="h-5 w-5" />
            <span className="text-[10px] font-medium">Fornecedor</span>
          </button>

          {/* Busca (só se ativo) */}
          {settings.interface.showSearchBar && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 px-3 rounded-xl text-muted-foreground"
            >
              <Search className="h-5 w-5" />
              <span className="text-[10px] font-medium">Buscar</span>
            </button>
          )}
        </div>
      </nav>

      {/* Espaço para não cobrir conteúdo com o bottom nav */}
      <div className="h-20 sm:hidden" />

      {/* Bulk action bar */}
      <BulkActionBar
        count={bulk.count}
        allSelected={bulk.allSelected}
        someSelected={bulk.someSelected}
        onSelectAll={bulk.selectAll}
        onClearSelection={bulk.clearSelection}
        onCompleteSelected={handleBulkComplete}
        onReopenSelected={handleBulkReopen}
        onDeleteSelected={handleBulkDelete}
        onCancel={handleCancelBulk}
      />

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
            ? { ...detailTask, supplier: store.suppliers.find((s) => s.id === detailTask.supplier_id) }
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
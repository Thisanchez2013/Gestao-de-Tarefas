import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TaskFormData, FilterStatus, FilterPriority, TaskWithSupplier } from "@/types/task";
import type { Supplier, SupplierFormData } from "@/types/supplier";
import { useToast } from "@/hooks/use-toast";

type TaskStoreContextType = ReturnType<typeof useTaskStoreLogic>;
const TaskStoreContext = createContext<TaskStoreContextType | null>(null);

const priorityOrder = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: TaskWithSupplier[]): TaskWithSupplier[] {
  return [...tasks].sort((a, b) => {
    const pDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    if (pDiff !== 0) return pDiff;
    const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
    const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
    return dateA - dateB;
  });
}

function useTaskStoreLogic() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tasksRes, suppliersRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('suppliers').select('*').eq('user_id', user.id)
      ]);

      setTasks(tasksRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao carregar", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('db-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'suppliers' }, () => fetchData())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'suppliers' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // --- FORNECEDORES ---
  const addSupplier = async (formData: SupplierFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...formData, user_id: user?.id }])
        .select()
        .single();
      if (error) throw error;
      if (data) setSuppliers(prev => [...prev, data]);
      toast({ title: "Fornecedor cadastrado!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const updateSupplier = async (id: string, formData: Partial<SupplierFormData>) => {
    try {
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...formData } : s));
      const { data, error } = await supabase
        .from('suppliers')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (data) setSuppliers(prev => prev.map(s => s.id === id ? data : s));
      toast({ title: "Fornecedor atualizado!" });
    } catch (error: any) {
      fetchData();
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast({ title: "Fornecedor removido!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  // --- TAREFAS ---
  const addTask = async (formData: TaskFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...formData, status: 'pending', user_id: user?.id }])
        .select()
        .single();
      if (error) throw error;
      if (data) setTasks(prev => [...prev, data]);
      toast({ title: "Tarefa adicionada!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const updateTask = async (id: string, formData: Partial<TaskFormData>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...formData, updated_at: new Date().toISOString() } : t));
      toast({ title: "Tarefa atualizada!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const toggleStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === "pending" ? "completed" : "pending";
    // Otimista
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      // Rollback
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: task.status } : t));
      toast({ variant: "destructive", title: "Erro ao atualizar status", description: error.message });
    }
  };

  // Move para lixeira — soft delete via deleted_at
  const softDelete = async (id: string) => {
    const deletedAt = new Date().toISOString();
    // Otimista
    setTasks(prev => prev.map(t => t.id === id ? { ...t, deleted_at: deletedAt } : t));
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: deletedAt })
      .eq('id', id);
    if (error) {
      // Rollback
      setTasks(prev => prev.map(t => t.id === id ? { ...t, deleted_at: null } : t));
      toast({ variant: "destructive", title: "Erro ao mover para lixeira", description: error.message });
    } else {
      toast({ title: "Movido para a lixeira" });
    }
  };

  // Restaura da lixeira
  const restore = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, deleted_at: null } : t));
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: null })
      .eq('id', id);
    if (error) {
      fetchData();
      toast({ variant: "destructive", title: "Erro ao restaurar", description: error.message });
    } else {
      toast({ title: "Tarefa restaurada!" });
    }
  };

  // Exclui permanentemente
  const permanentDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      fetchData();
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    } else {
      toast({ title: "Tarefa excluída permanentemente." });
    }
  };

  // --- DERIVADOS ---
  const tasksWithSuppliers = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      supplier: suppliers.find(s => s.id === task.supplier_id)
    }));
  }, [tasks, suppliers]);

  const activeTasks = tasksWithSuppliers.filter(t => !t.deleted_at);
  const trashedTasks = tasksWithSuppliers.filter(t => !!t.deleted_at);

  const filteredTasks = sortTasks(
    activeTasks.filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
  );

  return {
    tasks: filteredTasks,
    trashedTasks,
    suppliers,
    loading,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    searchQuery,
    setSearchQuery,
    addTask,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    updateTask,
    toggleStatus,
    softDelete,
    restore,
    permanentDelete,
    pendingCount: activeTasks.filter(t => t.status === 'pending').length,
    completedCount: activeTasks.filter(t => t.status === 'completed').length,
  };
}

export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  const logic = useTaskStoreLogic();
  return <TaskStoreContext.Provider value={logic}>{children}</TaskStoreContext.Provider>;
}

export function useTaskStore() {
  const context = useContext(TaskStoreContext);
  if (!context) throw new Error("useTaskStore deve estar dentro de um TaskStoreProvider");
  return context;
}
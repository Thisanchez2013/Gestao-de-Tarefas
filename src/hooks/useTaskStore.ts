import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TaskFormData, FilterStatus, FilterPriority, TaskWithSupplier } from "@/types/task";
import type { Supplier, SupplierFormData } from "@/types/supplier";
import { useToast } from "@/hooks/use-toast";

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

export function useTaskStore() {
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
      if (!user) {
        setTasks([]);
        setSuppliers([]);
        return;
      }

      const [tasksRes, suppliersRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('suppliers').select('*').eq('user_id', user.id)
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (suppliersRes.error) throw suppliersRes.error;

      setTasks(tasksRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('db-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const tasksWithSuppliers: TaskWithSupplier[] = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      supplier: suppliers.find(s => s.id === task.supplier_id)
    }));
  }, [tasks, suppliers]);

  const activeTasks = tasksWithSuppliers.filter((t) => !t.deleted_at);
  const trashedTasks = tasksWithSuppliers.filter((t) => !!t.deleted_at);

  const filteredTasks = sortTasks(
    activeTasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
  );

  const addTask = async (formData: TaskFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tasks')
        .insert([{ ...formData, status: 'pending', user_id: user?.id }]);

      if (error) throw error;
      toast({ title: "Tarefa adicionada!" });
      fetchData(); 
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao adicionar", description: error.message });
    }
  };

  const updateTask = async (id: string, formData: Partial<TaskFormData>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Tarefa atualizada!" });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    }
  };

  const addSupplier = async (formData: SupplierFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('suppliers')
        .insert([{ ...formData, user_id: user?.id }]);

      if (error) throw error;
      toast({ title: "Fornecedor cadastrado!" });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no cadastro", description: error.message });
    }
  };

  const updateSupplier = async (id: string, formData: Partial<SupplierFormData>) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Fornecedor atualizado!" });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    }
  };

  const toggleStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const { error } = await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) fetchData();
  };

  const softDelete = async (id: string) => {
    const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      toast({ title: "Movido para a lixeira" });
      fetchData();
    }
  };

  const restore = async (id: string) => {
    const { error } = await supabase.from('tasks').update({ deleted_at: null }).eq('id', id);
    if (!error) {
      toast({ title: "Restaurado!" });
      fetchData();
    }
  };

  const permanentDelete = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      toast({ title: "Excluído permanentemente" });
      fetchData();
    }
  };

  return {
    tasks: filteredTasks,
    trashedTasks,
    suppliers,
    loading,
    filterStatus,
    filterPriority,
    searchQuery,
    setFilterStatus,
    setFilterPriority,
    setSearchQuery,
    addTask,
    addSupplier,
    updateSupplier,
    updateTask,
    softDelete,
    restore,
    permanentDelete,
    toggleStatus,
    pendingCount: activeTasks.filter(t => t.status === 'pending').length,
    completedCount: activeTasks.filter(t => t.status === 'completed').length,
  };
}
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, TaskFormData, FilterStatus, FilterPriority } from "@/types/task";
import { useToast } from "@/hooks/use-toast";

const priorityOrder = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    if (pDiff !== 0) return pDiff;
    // CORREÇÃO: Verificação de segurança para a data na ordenação
    const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
    const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
    return dateA - dateB;
  });
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar tarefas",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasks(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const activeTasks = tasks.filter((t) => !t.deleted_at);
  const trashedTasks = tasks.filter((t) => !!t.deleted_at);

  const filteredTasks = sortTasks(
    activeTasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      return true;
    })
  );

  const addTask = async (formData: TaskFormData) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          due_date: formData.due_date, // Salva corretamente no banco
          status: 'pending'
        }]);

      if (error) throw error;
      toast({ title: "Tarefa adicionada!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao adicionar", description: error.message });
    }
  };

  // CORREÇÃO: Função updateTask adicionada para evitar duplicação na edição
  const updateTask = async (id: string, formData: Partial<TaskFormData>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          due_date: formData.due_date, // Garante que a data seja atualizada
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Tarefa atualizada com sucesso!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    }
  };

  const toggleStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === "pending" ? "completed" : "pending";
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    }
  };

  const softDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Tarefa movida para a lixeira" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    }
  };

  const restore = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Tarefa restaurada" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao restaurar", description: error.message });
    }
  };

  const permanentDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Tarefa excluída permanentemente" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    }
  };

  return {
    tasks: filteredTasks,
    trashedTasks,
    loading,
    filterStatus,
    filterPriority,
    setFilterStatus,
    setFilterPriority,
    addTask,
    updateTask, // Exposto para o TaskFormDialog
    softDelete,
    restore,
    permanentDelete,
    toggleStatus,
    pendingCount: activeTasks.filter(t => t.status === 'pending').length,
    completedCount: activeTasks.filter(t => t.status === 'completed').length,
  };
}
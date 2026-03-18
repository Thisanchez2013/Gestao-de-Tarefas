// src/hooks/useBulkSelection.tsx
// Hook para gerenciar seleção em massa de tarefas
import { useState, useCallback } from "react";

export function useBulkSelection(allIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const toggleSelectionMode = useCallback(() => {
    setIsSelecting((prev) => {
      if (prev) setSelectedIds(new Set()); // limpa ao sair do modo
      return !prev;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const allSelected = allIds.length > 0 && selectedIds.size === allIds.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const count = selectedIds.size;

  return {
    isSelecting,
    selectedIds,
    count,
    allSelected,
    someSelected,
    toggleSelectionMode,
    toggleItem,
    selectAll,
    clearSelection,
    isSelected,
  };
}
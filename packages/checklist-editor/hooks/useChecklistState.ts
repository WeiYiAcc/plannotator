import { useState, useCallback, useMemo } from 'react';
import type {
  Checklist,
  ChecklistItem,
  ChecklistItemStatus,
  ChecklistItemResult,
} from '@plannotator/shared/checklist-types';

export type { Checklist, ChecklistItem, ChecklistItemStatus, ChecklistItemResult };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseChecklistStateOptions {
  items: ChecklistItem[];
}

export function useChecklistState({ items }: UseChecklistStateOptions) {
  const [results, setResults] = useState<Map<string, ChecklistItemResult>>(() => {
    const map = new Map<string, ChecklistItemResult>();
    for (const item of items) {
      map.set(item.id, { id: item.id, status: 'pending' });
    }
    return map;
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    items.length > 0 ? items[0].id : null,
  );

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Categories in order of first appearance
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const item of items) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        cats.push(item.category);
      }
    }
    return cats;
  }, [items]);

  // Grouped items
  const groupedItems = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const cat of categories) {
      map.set(cat, []);
    }
    for (const item of items) {
      map.get(item.category)!.push(item);
    }
    return map;
  }, [items, categories]);

  // Flat ordered list for keyboard navigation
  const flatItemIds = useMemo(() => {
    const ids: string[] = [];
    for (const cat of categories) {
      if (collapsedGroups.has(cat)) continue;
      const group = groupedItems.get(cat);
      if (group) {
        for (const item of group) ids.push(item.id);
      }
    }
    return ids;
  }, [categories, groupedItems, collapsedGroups]);

  // --- Actions ---

  const setStatus = useCallback((id: string, status: ChecklistItemStatus) => {
    setResults(prev => {
      const next = new Map(prev);
      const existing = next.get(id);
      next.set(id, { ...existing, id, status });
      return next;
    });
  }, []);

  const addNote = useCallback((id: string, note: string) => {
    setResults(prev => {
      const next = new Map(prev);
      const existing = next.get(id) || { id, status: 'pending' as const };
      const notes = [...(existing.notes || []), note];
      next.set(id, { ...existing, notes });
      return next;
    });
  }, []);

  const removeNote = useCallback((id: string, index: number) => {
    setResults(prev => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (!existing?.notes) return prev;
      const notes = existing.notes.filter((_, i) => i !== index);
      next.set(id, { ...existing, notes: notes.length > 0 ? notes : undefined });
      return next;
    });
  }, []);

  const setImages = useCallback((id: string, images: { path: string; name: string }[]) => {
    setResults(prev => {
      const next = new Map(prev);
      const existing = next.get(id) || { id, status: 'pending' as const };
      next.set(id, { ...existing, images: images.length > 0 ? images : undefined });
      return next;
    });
  }, []);

  const selectItem = useCallback((id: string | null) => {
    setSelectedItemId(id);
  }, []);

  const selectNext = useCallback((): string | null => {
    if (!selectedItemId) {
      if (flatItemIds.length > 0) {
        setSelectedItemId(flatItemIds[0]);
        return flatItemIds[0];
      }
      return null;
    }
    const idx = flatItemIds.indexOf(selectedItemId);
    if (idx < flatItemIds.length - 1) {
      setSelectedItemId(flatItemIds[idx + 1]);
      return flatItemIds[idx + 1];
    }
    return selectedItemId;
  }, [selectedItemId, flatItemIds]);

  const selectPrev = useCallback((): string | null => {
    if (!selectedItemId) {
      if (flatItemIds.length > 0) {
        const last = flatItemIds[flatItemIds.length - 1];
        setSelectedItemId(last);
        return last;
      }
      return null;
    }
    const idx = flatItemIds.indexOf(selectedItemId);
    if (idx > 0) {
      setSelectedItemId(flatItemIds[idx - 1]);
      return flatItemIds[idx - 1];
    }
    return selectedItemId;
  }, [selectedItemId, flatItemIds]);

  const toggleGroup = useCallback((category: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const getResult = useCallback((id: string): ChecklistItemResult => {
    return results.get(id) || { id, status: 'pending' };
  }, [results]);

  const allResults = useMemo(() => Array.from(results.values()), [results]);

  const restoreResults = useCallback((restored: ChecklistItemResult[]) => {
    setResults(prev => {
      const next = new Map(prev);
      for (const r of restored) {
        next.set(r.id, r);
      }
      return next;
    });
  }, []);

  return {
    results,
    allResults,
    selectedItemId,
    collapsedGroups,
    categories,
    groupedItems,
    flatItemIds,
    setStatus,
    addNote,
    removeNote,
    setImages,
    selectItem,
    selectNext,
    selectPrev,
    toggleGroup,
    getResult,
    restoreResults,
  };
}

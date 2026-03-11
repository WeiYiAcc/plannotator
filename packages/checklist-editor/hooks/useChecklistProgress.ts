import { useMemo } from 'react';
import type { ChecklistItem, ChecklistItemResult, ChecklistItemStatus } from './useChecklistState';

export interface StatusCounts {
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  total: number;
}

export interface CategoryProgress {
  category: string;
  reviewed: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export type SubmitState =
  | 'all-pending'
  | 'partial'
  | 'all-reviewed-with-failures'
  | 'all-passed';

export function useChecklistProgress(
  items: ChecklistItem[],
  results: Map<string, ChecklistItemResult>,
) {
  const counts = useMemo((): StatusCounts => {
    const c: StatusCounts = { passed: 0, failed: 0, skipped: 0, pending: 0, total: items.length };
    for (const item of items) {
      const r = results.get(item.id);
      const status: ChecklistItemStatus = r?.status ?? 'pending';
      c[status]++;
    }
    return c;
  }, [items, results]);

  const categoryProgress = useMemo((): Map<string, CategoryProgress> => {
    const map = new Map<string, CategoryProgress>();
    for (const item of items) {
      let cp = map.get(item.category);
      if (!cp) {
        cp = { category: item.category, reviewed: 0, total: 0, passed: 0, failed: 0, skipped: 0 };
        map.set(item.category, cp);
      }
      cp.total++;
      const r = results.get(item.id);
      const status: ChecklistItemStatus = r?.status ?? 'pending';
      if (status !== 'pending') {
        cp.reviewed++;
        if (status === 'passed') cp.passed++;
        if (status === 'failed') cp.failed++;
        if (status === 'skipped') cp.skipped++;
      }
    }
    return map;
  }, [items, results]);

  const submitState = useMemo((): SubmitState => {
    const reviewed = counts.passed + counts.failed + counts.skipped;
    if (reviewed === 0) return 'all-pending';
    if (reviewed < items.length) return 'partial';
    if (counts.failed > 0) return 'all-reviewed-with-failures';
    return 'all-passed';
  }, [items.length, counts]);

  return { counts, categoryProgress, submitState };
}

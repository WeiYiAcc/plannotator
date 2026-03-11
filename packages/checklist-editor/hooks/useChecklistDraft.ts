/**
 * Auto-save checklist results to the server as a draft.
 *
 * Follows the pattern from useCodeAnnotationDraft — debounced POST to /api/draft,
 * load on mount, restore/dismiss via banner.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatTimeAgo } from '@plannotator/ui/utils/timeFormat';
import type { ChecklistItemResult } from './useChecklistState';

const DEBOUNCE_MS = 500;

interface DraftData {
  checklistResults: ChecklistItemResult[];
  globalNotes?: string[] | string;
  ts: number;
}

interface UseChecklistDraftOptions {
  results: ChecklistItemResult[];
  globalNotes: string[];
  isApiMode: boolean;
  submitted: boolean;
}

interface UseChecklistDraftResult {
  draftBanner: { count: number; timeAgo: string } | null;
  restoreDraft: () => { results: ChecklistItemResult[]; globalNotes: string[] } | null;
  dismissDraft: () => void;
}

export function useChecklistDraft({
  results,
  globalNotes,
  isApiMode,
  submitted,
}: UseChecklistDraftOptions): UseChecklistDraftResult {
  const [draftBanner, setDraftBanner] = useState<{ count: number; timeAgo: string } | null>(null);
  const draftDataRef = useRef<DraftData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);

  // Load draft on mount
  useEffect(() => {
    if (!isApiMode) return;

    fetch('/api/draft')
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: DraftData | null) => {
        if (
          data?.checklistResults &&
          Array.isArray(data.checklistResults) &&
          data.checklistResults.length > 0
        ) {
          const reviewed = data.checklistResults.filter(r => r.status !== 'pending');
          if (reviewed.length > 0) {
            draftDataRef.current = data;
            setDraftBanner({
              count: reviewed.length,
              timeAgo: formatTimeAgo(data.ts || 0),
            });
          }
        }
        hasMountedRef.current = true;
      })
      .catch(() => {
        hasMountedRef.current = true;
      });
  }, [isApiMode]);

  // Debounced auto-save on result changes
  useEffect(() => {
    if (!isApiMode || submitted) return;
    if (!hasMountedRef.current) return;

    const reviewed = results.filter(r => r.status !== 'pending');
    if (reviewed.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const payload: DraftData = {
        checklistResults: results,
        globalNotes: globalNotes.length > 0 ? globalNotes : undefined,
        ts: Date.now(),
      };

      fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [results, globalNotes, isApiMode, submitted]);

  const restoreDraft = useCallback(() => {
    const data = draftDataRef.current;
    setDraftBanner(null);
    draftDataRef.current = null;
    if (!data) return null;
    return {
      results: data.checklistResults,
      globalNotes: Array.isArray(data.globalNotes) ? data.globalNotes : data.globalNotes ? [data.globalNotes] : [],
    };
  }, []);

  const dismissDraft = useCallback(() => {
    setDraftBanner(null);
    draftDataRef.current = null;
    fetch('/api/draft', { method: 'DELETE' }).catch(() => {});
  }, []);

  return { draftBanner, restoreDraft, dismissDraft };
}

import React, { useState, useRef } from 'react';
import type { ChecklistItem, ChecklistItemResult } from '../hooks/useChecklistState';
import type { ChecklistPR } from '@plannotator/shared/checklist-types';
import { StatusIcon } from './StatusButton';
import { PRIcon } from './ChecklistHeader';

export interface ChecklistAutomations {
  postToPR: boolean;
  approveIfAllPass: boolean;
}

interface ChecklistAnnotationPanelProps {
  items: ChecklistItem[];
  getResult: (id: string) => ChecklistItemResult;
  globalNotes: string[];
  pr?: ChecklistPR;
  automations: ChecklistAutomations;
  onAutomationsChange: (automations: ChecklistAutomations) => void;
  onSelectItem: (id: string) => void;
  onRemoveItemNote: (id: string, index: number) => void;
  onRemoveGlobalNote: (index: number) => void;
  width: number;
  feedbackMarkdown: string;
}

// Provider labels
const PROVIDER_LABELS: Record<ChecklistPR['provider'], string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  'azure-devops': 'Azure DevOps',
};

export const ChecklistAnnotationPanel: React.FC<ChecklistAnnotationPanelProps> = ({
  items,
  getResult,
  globalNotes,
  pr,
  automations,
  onAutomationsChange,
  onSelectItem,
  onRemoveItemNote,
  onRemoveGlobalNote,
  width,
  feedbackMarkdown,
}) => {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const itemsWithNotes = items.filter(item => {
    const result = getResult(item.id);
    return (result.notes && result.notes.length > 0) || (result.images && result.images.length > 0);
  });

  // Count all individual notes
  const itemNoteCount = itemsWithNotes.reduce((sum, item) => {
    const result = getResult(item.id);
    return sum + (result.notes?.length || 0);
  }, 0);
  const noteCount = itemNoteCount + globalNotes.length;

  const handleCopy = async () => {
    if (!feedbackMarkdown) return;
    try {
      await navigator.clipboard.writeText(feedbackMarkdown);
      setCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  return (
    <aside
      className="border-l border-border/50 bg-card/30 backdrop-blur-sm h-full flex flex-col flex-shrink-0"
      style={{ width }}
    >
      {/* Automations — at the top, only when a PR is linked */}
      {pr && (
        <div className="border-b border-border/50">
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <PRIcon className="w-3 h-3 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Automations
              </h3>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={automations.postToPR}
                  onChange={(e) => onAutomationsChange({ ...automations, postToPR: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-border/50 text-primary focus:ring-primary/30 flex-shrink-0"
                />
                <span className="text-xs text-foreground/80 group-hover:text-foreground transition-colors whitespace-nowrap">
                  Post results to {pr.provider === 'gitlab' ? 'MR' : 'PR'}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={automations.approveIfAllPass}
                  onChange={(e) => onAutomationsChange({ ...automations, approveIfAllPass: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-border/50 text-primary focus:ring-primary/30 flex-shrink-0"
                />
                <span className="text-xs text-foreground/80 group-hover:text-foreground transition-colors whitespace-nowrap">
                  Approve if all pass
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Notes header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </h2>
          {noteCount > 0 && (
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {noteCount}
            </span>
          )}
        </div>
      </div>

      {/* Notes content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* Global notes */}
          {globalNotes.map((note, i) => (
            <div
              key={`global-${i}`}
              className="group p-2.5 rounded-lg hover:bg-muted/50 transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span className="text-[11px] font-medium text-muted-foreground flex-1">
                  Global
                </span>
                <button
                  onClick={() => onRemoveGlobalNote(i)}
                  className="p-0.5 rounded text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove note"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 pl-5">
                {note}
              </p>
            </div>
          ))}

          {/* Divider */}
          {globalNotes.length > 0 && itemsWithNotes.length > 0 && (
            <div className="border-t border-border/50 my-1" />
          )}

          {/* Per-item notes — each note is a separate entry */}
          {itemsWithNotes.map(item => {
            const result = getResult(item.id);
            const notes = result.notes || [];
            return notes.map((note, noteIdx) => (
              <div
                key={`${item.id}-${noteIdx}`}
                className="group p-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/50"
                onClick={() => onSelectItem(item.id)}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <StatusIcon status={result.status} className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium text-foreground truncate flex-1">
                    {item.check}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveItemNote(item.id, noteIdx); }}
                    className="p-0.5 rounded text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove note"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 pl-5">
                  {note}
                </p>
              </div>
            ));
          })}

          {noteCount === 0 && (
            <div className="flex flex-col items-center justify-center h-24 text-center px-4">
              <p className="text-xs text-muted-foreground/60">
                Add notes to checklist items to see them here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border/50">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy All
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

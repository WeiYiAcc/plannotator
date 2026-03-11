import React, { useState, useEffect, useRef } from 'react';
import type { ChecklistItem as ChecklistItemType, ChecklistItemResult } from '../hooks/useChecklistState';
import type { CategoryProgress } from '../hooks/useChecklistProgress';
import { ChecklistItem } from './ChecklistItem';
import { StatusIcon } from './StatusButton';

const MAX_COMPACT_VISIBLE = 3;

interface ChecklistGroupProps {
  category: string;
  items: ChecklistItemType[];
  progress: CategoryProgress;
  expandedItems: Set<string>;
  selectedItemId: string | null;
  onToggleExpand: (id: string) => void;
  onOpenNote: (anchorEl: HTMLElement, itemId: string) => void;
  getResult: (id: string) => ChecklistItemResult;
  onSetStatus: (id: string, status: ChecklistItemResult['status']) => void;
}

export const ChecklistGroup: React.FC<ChecklistGroupProps> = ({
  category,
  items,
  progress,
  expandedItems,
  selectedItemId,
  onToggleExpand,
  onOpenNote,
  getResult,
  onSetStatus,
}) => {
  const isComplete = progress.reviewed === progress.total && progress.reviewed > 0;
  const [manuallyExpanded, setManuallyExpanded] = useState(false);
  const wasCompleteRef = useRef(false);

  // Auto-collapse when category becomes complete
  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      setManuallyExpanded(false);
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete]);

  const isCollapsed = isComplete && !manuallyExpanded;
  const overflow = items.length - MAX_COMPACT_VISIBLE;

  return (
    <div className="mb-4">
      {/* Category heading */}
      <div
        className={`category-header flex items-center gap-2 px-1 py-2 ${isComplete ? 'cursor-pointer select-none' : ''}`}
        onClick={isComplete ? () => setManuallyExpanded(prev => !prev) : undefined}
      >
        {/* Collapse chevron — only when complete */}
        {isComplete && (
          <svg
            className={`w-3 h-3 text-muted-foreground/50 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}

        <span className={`flex-1 transition-colors duration-300 ${isComplete ? 'text-muted-foreground/50' : ''}`}>
          {category}
        </span>

        {/* Micro-progress */}
        <span className={`text-[10px] font-mono tabular-nums transition-colors duration-300 ${
          isComplete ? 'text-success/60' : ''
        }`}>
          {progress.reviewed > 0 && (
            <>
              <span className={isComplete ? '' : 'text-muted-foreground'}>
                {progress.reviewed}
              </span>
              <span className={isComplete ? '' : 'text-muted-foreground/40'}>/{progress.total}</span>
            </>
          )}
          {progress.reviewed === 0 && (
            <span className="text-muted-foreground/40">{progress.total}</span>
          )}
        </span>

        {/* Completion check */}
        {isComplete && progress.failed === 0 && (
          <svg className="w-3.5 h-3.5 text-success/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}

        {/* Failure indicator */}
        {progress.failed > 0 && !isComplete && (
          <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
        )}
      </div>

      {/* Full items — visible when not collapsed */}
      <div className={`checklist-group-body ${isCollapsed ? '' : 'expanded'}`}>
        <div>
          <div className="space-y-2">
            {items.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                result={getResult(item.id)}
                isExpanded={expandedItems.has(item.id)}
                isSelected={selectedItemId === item.id}
                onToggleExpand={() => onToggleExpand(item.id)}
                onOpenNote={(anchorEl) => onOpenNote(anchorEl, item.id)}
                onSetStatus={status => onSetStatus(item.id, status)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Compact summary — visible when collapsed */}
      <div className={`checklist-group-compact ${isCollapsed ? 'expanded' : ''}`}>
        <div>
          <div className="compact-summary-inner">
            <div className="relative">
              {items.slice(0, MAX_COMPACT_VISIBLE).map((item, i) => {
                const result = getResult(item.id);
                return (
                  <div
                    key={item.id}
                    className="compact-summary-row"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <StatusIcon status={result.status} className="w-3 h-3" />
                    <span className="truncate">{item.check}</span>
                  </div>
                );
              })}

              {/* Overflow fade + count */}
              {overflow > 0 && (
                <div className="compact-summary-overflow">
                  <span>+{overflow} more</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

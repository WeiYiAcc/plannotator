import type { ChecklistItem, ChecklistItemResult, ChecklistItemStatus } from '../hooks/useChecklistState';

const STATUS_ICONS: Record<ChecklistItemStatus, string> = {
  passed: '[PASS]',
  failed: '[FAIL]',
  skipped: '[SKIP]',
  pending: '[----]',
};

/**
 * Format checklist results as markdown feedback suitable for sending
 * to the agent or copying to clipboard.
 */
export function exportChecklistResults(
  items: ChecklistItem[],
  results: Map<string, ChecklistItemResult>,
  globalNotes?: string[] | string,
): string {
  const lines: string[] = [];

  lines.push('# QA Checklist Results\n');

  // Summary counts
  const counts = { passed: 0, failed: 0, skipped: 0, pending: 0 };
  for (const item of items) {
    const r = results.get(item.id);
    counts[r?.status ?? 'pending']++;
  }

  const total = items.length;
  const reviewed = counts.passed + counts.failed + counts.skipped;
  lines.push(`**${reviewed}/${total}** items reviewed | ${counts.passed} passed | ${counts.failed} failed | ${counts.skipped} skipped\n`);

  // Group by category
  const categories: string[] = [];
  const grouped = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    if (!grouped.has(item.category)) {
      categories.push(item.category);
      grouped.set(item.category, []);
    }
    grouped.get(item.category)!.push(item);
  }

  for (const category of categories) {
    const catItems = grouped.get(category)!;
    lines.push(`## ${category}\n`);

    for (const item of catItems) {
      const r = results.get(item.id);
      const status = r?.status ?? 'pending';
      const icon = STATUS_ICONS[status];
      const critical = item.critical ? ' **[CRITICAL]**' : '';

      lines.push(`### ${icon} ${item.check}${critical}\n`);

      if (status === 'failed') {
        lines.push(`> **Status:** FAILED\n`);
      }

      if (r?.notes && r.notes.length > 0) {
        for (const note of r.notes) {
          lines.push(`**Notes:** ${note}\n`);
        }
      }

      if (r?.images && r.images.length > 0) {
        lines.push('**Evidence:**');
        for (const img of r.images) {
          lines.push(`- [${img.name}] ${img.path}`);
        }
        lines.push('');
      }
    }
  }

  const notes = Array.isArray(globalNotes) ? globalNotes : globalNotes ? [globalNotes] : [];
  if (notes.length > 0) {
    lines.push('---\n');
    lines.push(`## Overall Notes\n`);
    for (const note of notes) {
      lines.push(`- ${note}\n`);
    }
  }

  return lines.join('\n');
}

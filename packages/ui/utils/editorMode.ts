/**
 * Editor Mode Settings Utility
 *
 * Persists the last-used editor mode (selection, comment, redline) so it
 * carries over between plan reviews.
 */

import type { EditorMode } from '../types';
import { storage } from './storage';

const STORAGE_KEY = 'plannotator-editor-mode';

const DEFAULT_MODE: EditorMode = 'selection';

/**
 * Get the last-used editor mode from storage
 */
export function getEditorMode(): EditorMode {
  const stored = storage.getItem(STORAGE_KEY);
  if (stored === 'selection' || stored === 'comment' || stored === 'redline') {
    return stored;
  }
  return DEFAULT_MODE;
}

/**
 * Save editor mode to storage
 */
export function saveEditorMode(mode: EditorMode): void {
  storage.setItem(STORAGE_KEY, mode);
}

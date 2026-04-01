/**
 * Improvement Hook Reader
 *
 * Reads improvement hook files from ~/.plannotator/hooks/.
 * Runtime-agnostic: uses only node:fs, node:path, node:os.
 *
 * Security model:
 * - Hardcoded base path (no user input determines file path)
 * - KNOWN_HOOKS allowlist (only pre-registered relative paths)
 * - Size cap to prevent runaway context injection
 * - Same trust model as ~/.plannotator/config.json
 */

import { homedir } from "os";
import { join } from "path";
import { readFileSync, statSync } from "fs";

/** Base directory for hook-injectable files */
const HOOKS_BASE_DIR = join(homedir(), ".plannotator", "hooks");

/** Maximum file size to read (50 KB) */
const MAX_FILE_SIZE = 50 * 1024;

/**
 * Known improvement hook file paths, keyed by hook name.
 * Each path is relative to ~/.plannotator/hooks/.
 */
const KNOWN_HOOKS = {
  "enterplanmode-improve": "compound/enterplanmode-improve-hook.txt",
} as const;

export type ImprovementHookName = keyof typeof KNOWN_HOOKS;

export interface ImprovementHookResult {
  content: string;
  hookName: ImprovementHookName;
  filePath: string;
}

/**
 * Read an improvement hook file by name.
 * Returns null if the file doesn't exist, is empty, is too large, or on any error.
 * Only reads from the hardcoded HOOKS_BASE_DIR — no user-supplied paths.
 */
export function readImprovementHook(
  hookName: ImprovementHookName,
): ImprovementHookResult | null {
  const relativePath = KNOWN_HOOKS[hookName];
  if (!relativePath) return null;

  const filePath = join(HOOKS_BASE_DIR, relativePath);

  try {
    const stat = statSync(filePath);
    if (!stat.isFile() || stat.size === 0 || stat.size > MAX_FILE_SIZE) return null;

    const content = readFileSync(filePath, "utf-8").trim();
    if (!content) return null;

    return { content, hookName, filePath };
  } catch {
    // File doesn't exist or unreadable — silent passthrough
    return null;
  }
}

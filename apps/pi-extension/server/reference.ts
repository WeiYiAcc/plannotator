/**
 * Document and reference handlers (Node.js equivalents of packages/server/reference-handlers.ts).
 * VaultNode, buildFileTree, walkMarkdownFiles, handleDocRequest,
 * detectObsidianVaults, handleObsidian*, handleFileBrowserRequest
 */

import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
	type Dirent,
} from "node:fs";
import type { ServerResponse } from "node:http";
import { isAbsolute, join, resolve as resolvePath } from "node:path";

import { json } from "./helpers";

import {
	type VaultNode,
	buildFileTree,
	FILE_BROWSER_EXCLUDED,
} from "../generated/reference-common.js";
import { detectObsidianVaults } from "../generated/integrations-common.js";

type Res = ServerResponse;

/** Recursively walk a directory collecting markdown files, skipping ignored dirs. */
function walkMarkdownFiles(dir: string, root: string, results: string[]): void {
	let entries: Dirent[];
	try {
		entries = readdirSync(dir, { withFileTypes: true }) as Dirent[];
	} catch {
		return;
	}
	for (const entry of entries) {
		if (entry.isDirectory()) {
			if (FILE_BROWSER_EXCLUDED.includes(entry.name + "/")) continue;
			walkMarkdownFiles(join(dir, entry.name), root, results);
		} else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) {
			const relative = join(dir, entry.name)
				.slice(root.length + 1)
				.replace(/\\/g, "/");
			results.push(relative);
		}
	}
}

/** Serve a linked markdown document. Node.js equivalent of handleDoc. */
export function handleDocRequest(res: Res, url: URL): void {
	const requestedPath = url.searchParams.get("path");
	if (!requestedPath) {
		json(res, { error: "Missing path parameter" }, 400);
		return;
	}

	// Try resolving relative to base directory first (used by annotate mode)
	const base = url.searchParams.get("base");
	if (
		base &&
		!requestedPath.startsWith("/") &&
		/\.mdx?$/i.test(requestedPath)
	) {
		const fromBase = resolvePath(base, requestedPath);
		try {
			if (existsSync(fromBase)) {
				const markdown = readFileSync(fromBase, "utf-8");
				json(res, { markdown, filepath: fromBase });
				return;
			}
		} catch {
			/* fall through */
		}
	}

	// Absolute path
	if (isAbsolute(requestedPath)) {
		if (/\.mdx?$/i.test(requestedPath) && existsSync(requestedPath)) {
			try {
				const markdown = readFileSync(requestedPath, "utf-8");
				json(res, { markdown, filepath: requestedPath });
				return;
			} catch {
				/* fall through */
			}
		}
		json(res, { error: `File not found: ${requestedPath}` }, 404);
		return;
	}

	// Relative to cwd
	const projectRoot = process.cwd();
	const fromRoot = resolvePath(projectRoot, requestedPath);
	if (/\.mdx?$/i.test(fromRoot) && existsSync(fromRoot)) {
		try {
			const markdown = readFileSync(fromRoot, "utf-8");
			json(res, { markdown, filepath: fromRoot });
			return;
		} catch {
			/* fall through */
		}
	}

	// Case-insensitive search for bare filenames
	if (!requestedPath.includes("/") && /\.mdx?$/i.test(requestedPath)) {
		const files: string[] = [];
		walkMarkdownFiles(projectRoot, projectRoot, files);
		const target = requestedPath.toLowerCase();
		const matches = files.filter(
			(f) => f.split("/").pop()!.toLowerCase() === target,
		);
		if (matches.length === 1) {
			const fullPath = resolvePath(projectRoot, matches[0]);
			try {
				const markdown = readFileSync(fullPath, "utf-8");
				json(res, { markdown, filepath: fullPath });
				return;
			} catch {
				/* fall through */
			}
		}
		if (matches.length > 1) {
			json(
				res,
				{
					error: `Ambiguous filename '${requestedPath}': found ${matches.length} matches`,
					matches,
				},
				400,
			);
			return;
		}
	}

	json(res, { error: `File not found: ${requestedPath}` }, 404);
}

export function handleObsidianVaultsRequest(res: Res): void {
	json(res, { vaults: detectObsidianVaults() });
}

export function handleObsidianFilesRequest(res: Res, url: URL): void {
	const vaultPath = url.searchParams.get("vaultPath");
	if (!vaultPath) {
		json(res, { error: "Missing vaultPath parameter" }, 400);
		return;
	}
	const resolvedVault = resolvePath(vaultPath);
	if (!existsSync(resolvedVault) || !statSync(resolvedVault).isDirectory()) {
		json(res, { error: "Invalid vault path" }, 400);
		return;
	}
	try {
		const files: string[] = [];
		walkMarkdownFiles(resolvedVault, resolvedVault, files);
		files.sort();
		json(res, { tree: buildFileTree(files) });
	} catch {
		json(res, { error: "Failed to list vault files" }, 500);
	}
}

export function handleObsidianDocRequest(res: Res, url: URL): void {
	const vaultPath = url.searchParams.get("vaultPath");
	const filePath = url.searchParams.get("path");
	if (!vaultPath || !filePath) {
		json(res, { error: "Missing vaultPath or path parameter" }, 400);
		return;
	}
	if (!/\.mdx?$/i.test(filePath)) {
		json(res, { error: "Only markdown files are supported" }, 400);
		return;
	}
	const resolvedVault = resolvePath(vaultPath);
	let resolvedFile = resolvePath(resolvedVault, filePath);

	// Bare filename search within vault
	if (!existsSync(resolvedFile) && !filePath.includes("/")) {
		const files: string[] = [];
		walkMarkdownFiles(resolvedVault, resolvedVault, files);
		const matches = files.filter(
			(f) => f.split("/").pop()!.toLowerCase() === filePath.toLowerCase(),
		);
		if (matches.length === 1) {
			resolvedFile = resolvePath(resolvedVault, matches[0]);
		} else if (matches.length > 1) {
			json(
				res,
				{
					error: `Ambiguous filename '${filePath}': found ${matches.length} matches`,
					matches,
				},
				400,
			);
			return;
		}
	}

	// Security: must be within vault
	if (
		!resolvedFile.startsWith(resolvedVault + "/") &&
		resolvedFile !== resolvedVault
	) {
		json(res, { error: "Access denied: path is outside vault" }, 403);
		return;
	}

	if (!existsSync(resolvedFile)) {
		json(res, { error: `File not found: ${filePath}` }, 404);
		return;
	}
	try {
		const markdown = readFileSync(resolvedFile, "utf-8");
		json(res, { markdown, filepath: resolvedFile });
	} catch {
		json(res, { error: "Failed to read file" }, 500);
	}
}

export function handleFileBrowserRequest(res: Res, url: URL): void {
	const dirPath = url.searchParams.get("dirPath");
	if (!dirPath) {
		json(res, { error: "Missing dirPath parameter" }, 400);
		return;
	}
	const resolvedDir = resolvePath(dirPath);
	if (!existsSync(resolvedDir) || !statSync(resolvedDir).isDirectory()) {
		json(res, { error: "Invalid directory path" }, 400);
		return;
	}
	try {
		const files: string[] = [];
		walkMarkdownFiles(resolvedDir, resolvedDir, files);
		files.sort();
		json(res, { tree: buildFileTree(files) });
	} catch {
		json(res, { error: "Failed to list directory files" }, 500);
	}
}

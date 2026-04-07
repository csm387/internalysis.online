import type { Scenario, WebsitePage, FileNode, Thread } from "@/engine/scenarioTypes";
import type { Clue, UnlockCondition } from "@/engine/types";

export type ValidationIssue = {
  level: "error" | "warn";
  code: string;
  message: string;
  path?: string;
};

function uniqCount(ids: string[]) {
  const map = new Map<string, number>();
  for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
  return map;
}

function walkFiles(node: FileNode, visit: (n: FileNode, path: string) => void, path: string) {
  visit(node, path);
  if (node.kind === "folder") {
    for (const c of node.children) walkFiles(c, visit, `${path}/${c.name}`);
  }
}

function validateUnlockCondition(cond: UnlockCondition, clueIds: Set<string>) {
  const refs: string[] = [];
  if (cond.type === "hasClue") refs.push(cond.clueId);
  if (cond.type === "hasAll") refs.push(...cond.clueIds);
  if (cond.type === "connected") refs.push(cond.a, cond.b);
  const missing = refs.filter((r) => !clueIds.has(r));
  return missing;
}

export function validateScenario(s: Scenario): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!s.id) issues.push({ level: "error", code: "scenario.id.missing", message: "Scenario id is required.", path: "id" });
  if (!s.name) issues.push({ level: "error", code: "scenario.name.missing", message: "Scenario name is required.", path: "name" });
  if (!s.defaultBrowserUrl) issues.push({ level: "warn", code: "scenario.defaultBrowserUrl.missing", message: "defaultBrowserUrl is empty.", path: "defaultBrowserUrl" });

  const clueIdCounts = uniqCount(s.clues.map((c) => c.id));
  for (const [id, n] of clueIdCounts.entries()) {
    if (!id) issues.push({ level: "error", code: "clue.id.empty", message: "A clue has an empty id.", path: "clues" });
    if (n > 1) issues.push({ level: "error", code: "clue.id.duplicate", message: `Duplicate clue id: ${id}`, path: "clues" });
  }
  const clueIds = new Set(Array.from(clueIdCounts.keys()).filter(Boolean));

  for (const c of s.clues) {
    if (!c.title) issues.push({ level: "warn", code: "clue.title.empty", message: `Clue "${c.id}" has an empty title.`, path: `clues.${c.id}.title` });
    for (const r of c.relatedClues) {
      if (!clueIds.has(r)) issues.push({ level: "warn", code: "clue.related.missing", message: `Clue "${c.id}" references missing related clue "${r}".`, path: `clues.${c.id}.relatedClues` });
    }
    for (const cond of c.unlockConditions ?? []) {
      const missing = validateUnlockCondition(cond, clueIds);
      for (const m of missing) {
        issues.push({ level: "warn", code: "clue.unlock.ref.missing", message: `Clue "${c.id}" unlock condition references missing clue "${m}".`, path: `clues.${c.id}.unlockConditions` });
      }
    }
  }

  const pageIdCounts = uniqCount(s.websites.map((p) => p.id));
  for (const [id, n] of pageIdCounts.entries()) {
    if (!id) issues.push({ level: "error", code: "page.id.empty", message: "A website page has an empty id.", path: "websites" });
    if (n > 1) issues.push({ level: "error", code: "page.id.duplicate", message: `Duplicate page id: ${id}`, path: "websites" });
  }

  const urlCounts = uniqCount(s.websites.map((p) => p.url));
  for (const [url, n] of urlCounts.entries()) {
    if (!url) issues.push({ level: "error", code: "page.url.empty", message: "A website page has an empty url.", path: "websites" });
    if (n > 1) issues.push({ level: "error", code: "page.url.duplicate", message: `Duplicate page url: ${url}`, path: "websites" });
  }

  const urls = new Set(s.websites.map((p) => p.url));
  for (const p of s.websites) {
    if (p.clueId && !clueIds.has(p.clueId)) {
      issues.push({ level: "warn", code: "page.clue.missing", message: `Page "${p.url}" references missing clue "${p.clueId}".`, path: `websites.${p.id}.clueId` });
    }
    for (const l of p.links ?? []) {
      if (!urls.has(l.url)) {
        issues.push({ level: "warn", code: "page.link.missing", message: `Page "${p.url}" links to missing url "${l.url}".`, path: `websites.${p.id}.links` });
      }
    }
  }

  // Filesystem clue refs
  walkFiles(s.fileSystem, (node, path) => {
    if (node.kind === "file" && node.clueId && !clueIds.has(node.clueId)) {
      issues.push({ level: "warn", code: "files.clue.missing", message: `File "${path}" references missing clue "${node.clueId}".`, path });
    }
  }, "/root");

  // Threads clue refs
  for (const t of s.threads as Thread[]) {
    for (const m of t.messages) {
      if (m.clueId && !clueIds.has(m.clueId)) {
        issues.push({ level: "warn", code: "thread.clue.missing", message: `Message "${m.id}" references missing clue "${m.clueId}".`, path: `threads.${t.id}.${m.id}` });
      }
    }
  }

  // Starting clues exist
  for (const id of s.startingClueIds) {
    if (!clueIds.has(id)) {
      issues.push({ level: "warn", code: "startingClue.missing", message: `Starting clue id "${id}" does not exist.`, path: "startingClueIds" });
    }
  }

  // Image support checks
  for (const c of s.clues as Clue[]) {
    if (c.type === "image" && !c.content.imageSrc) {
      issues.push({ level: "warn", code: "imageClue.noSrc", message: `Image clue "${c.id}" has no imageSrc.`, path: `clues.${c.id}.content.imageSrc` });
    }
  }

  return issues;
}


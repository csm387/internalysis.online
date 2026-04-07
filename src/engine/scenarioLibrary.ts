import type { Scenario } from "@/engine/scenarioTypes";

export type LibraryRecord = {
  version: 1;
  scenarios: Record<string, Scenario>;
  pinnedIds: string[];
  updatedAtById: Record<string, number>;
  nameOverrideById: Record<string, string>;
};

const KEY = "mistery_library_v1";

function now() {
  return Date.now();
}

export function loadLibrary(): LibraryRecord {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { version: 1, scenarios: {}, pinnedIds: [], updatedAtById: {}, nameOverrideById: {} };
    }
    const parsed = JSON.parse(raw) as Partial<LibraryRecord>;
    return {
      version: 1,
      scenarios: (parsed.scenarios ?? {}) as Record<string, Scenario>,
      pinnedIds: Array.isArray(parsed.pinnedIds) ? parsed.pinnedIds : [],
      updatedAtById: (parsed.updatedAtById ?? {}) as Record<string, number>,
      nameOverrideById: (parsed.nameOverrideById ?? {}) as Record<string, string>,
    };
  } catch {
    return { version: 1, scenarios: {}, pinnedIds: [], updatedAtById: {}, nameOverrideById: {} };
  }
}

export function saveLibrary(lib: LibraryRecord) {
  localStorage.setItem(KEY, JSON.stringify(lib));
}

export function listLibraryScenarios(lib: LibraryRecord): { scenario: Scenario; pinned: boolean; displayName: string; updatedAt: number }[] {
  const pinnedSet = new Set(lib.pinnedIds);
  const items = Object.values(lib.scenarios).map((s) => ({
    scenario: s,
    pinned: pinnedSet.has(s.id),
    displayName: lib.nameOverrideById[s.id] ?? s.name,
    updatedAt: lib.updatedAtById[s.id] ?? 0,
  }));
  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  });
  return items;
}

export function upsertScenario(lib: LibraryRecord, scenario: Scenario): LibraryRecord {
  return {
    ...lib,
    scenarios: { ...lib.scenarios, [scenario.id]: scenario },
    updatedAtById: { ...lib.updatedAtById, [scenario.id]: now() },
  };
}

export function deleteScenario(lib: LibraryRecord, id: string): LibraryRecord {
  const { [id]: _gone, ...rest } = lib.scenarios;
  const { [id]: _t, ...restT } = lib.updatedAtById;
  const { [id]: _n, ...restN } = lib.nameOverrideById;
  return {
    ...lib,
    scenarios: rest,
    updatedAtById: restT,
    nameOverrideById: restN,
    pinnedIds: lib.pinnedIds.filter((x) => x !== id),
  };
}

export function renameScenario(lib: LibraryRecord, id: string, name: string): LibraryRecord {
  return {
    ...lib,
    nameOverrideById: { ...lib.nameOverrideById, [id]: name },
    updatedAtById: { ...lib.updatedAtById, [id]: now() },
  };
}

export function togglePin(lib: LibraryRecord, id: string): LibraryRecord {
  const set = new Set(lib.pinnedIds);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return { ...lib, pinnedIds: Array.from(set) };
}


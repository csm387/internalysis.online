import type { Clue, EvidenceConnection, UnlockCondition } from "./types";

export type GameProgress = {
  stage: number;
  milestones: string[];
};

export type EngineInput = {
  allClues: Clue[];
  discoveredClueIds: string[];
  connections: EvidenceConnection[];
  progress: GameProgress;
};

export type EngineOutput = {
  newlyUnlockedClueIds: string[];
  progress: GameProgress;
};

function normalizePair(a: string, b: string) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function hasConnection(connections: EvidenceConnection[], a: string, b: string) {
  const target = normalizePair(a, b);
  return connections.some((c) => normalizePair(c.a, c.b) === target);
}

function meetsCondition(
  cond: UnlockCondition,
  discovered: Set<string>,
  connections: EvidenceConnection[],
  progress: GameProgress,
) {
  switch (cond.type) {
    case "always":
      return true;
    case "hasClue":
      return discovered.has(cond.clueId);
    case "hasAll":
      return cond.clueIds.every((id) => discovered.has(id));
    case "connected":
      return hasConnection(connections, cond.a, cond.b);
    case "progressAtLeast":
      return progress.stage >= cond.stage;
    default: {
      const _exhaustive: never = cond;
      return _exhaustive;
    }
  }
}

function shouldUnlock(clue: Clue, input: EngineInput) {
  const discovered = new Set(input.discoveredClueIds);
  if (discovered.has(clue.id)) return false;
  if (!clue.unlockConditions || clue.unlockConditions.length === 0) return false;
  return clue.unlockConditions.every((c) =>
    meetsCondition(c, discovered, input.connections, input.progress),
  );
}

/**
 * Pure progression step:
 * - unlocks clues whose conditions are satisfied
 * - updates progress based on validated board connections
 */
export function runEngine(input: EngineInput): EngineOutput {
  const discovered = new Set(input.discoveredClueIds);
  const out: EngineOutput = {
    newlyUnlockedClueIds: [],
    progress: { ...input.progress, milestones: [...input.progress.milestones] },
  };

  // MVP validation milestones (scenario-agnostic):
  // If the player links any two discovered clues, consider it a "board link" breakthrough.
  const anyLinkKey = "board_link_made";
  if (input.connections.length > 0 && !out.progress.milestones.includes(anyLinkKey)) {
    out.progress.milestones.push(anyLinkKey);
    out.progress.stage = Math.max(out.progress.stage, 1);
  }

  // Scenario-specific milestone preserved for the default case.
  const breakthroughKey = "link_cctv_invoice";
  const hasBreakthrough = hasConnection(input.connections, "image_cctv_2", "doc_invoice_1");
  if (hasBreakthrough && !out.progress.milestones.includes(breakthroughKey)) {
    out.progress.milestones.push(breakthroughKey);
    out.progress.stage = Math.max(out.progress.stage, 1);
  }

  for (const clue of input.allClues) {
    if (discovered.has(clue.id)) continue;
    if (shouldUnlock(clue, input)) out.newlyUnlockedClueIds.push(clue.id);
  }

  return out;
}


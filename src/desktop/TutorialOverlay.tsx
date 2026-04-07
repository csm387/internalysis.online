"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/engine/state";
import type { Scenario } from "@/engine/scenarioTypes";

type Step = NonNullable<NonNullable<Scenario["tutorial"]>["steps"]>[number];

function meets(step: Step, discovered: Set<string>, stage: number, milestones: Set<string>) {
  switch (step.when.type) {
    case "always":
      return true;
    case "hasClue":
      return discovered.has(step.when.clueId);
    case "progressAtLeast":
      return stage >= step.when.stage;
    case "milestone":
      return milestones.has(step.when.id);
  }
}

export function TutorialOverlay() {
  const tutorial = useGameStore((s) => s.scenario.tutorial);
  const discovered = useGameStore((s) => s.discoveredClueIds);
  const progress = useGameStore((s) => s.progress);

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const step = useMemo(() => {
    if (!tutorial?.enabled) return null;
    const disc = new Set(discovered);
    const miles = new Set(progress.milestones);
    const dismissed = new Set(dismissedIds);
    return (
      tutorial.steps.find((s) => !dismissed.has(s.id) && meets(s, disc, progress.stage, miles)) ??
      null
    );
  }, [tutorial, discovered, progress.milestones, progress.stage, dismissedIds]);

  if (!tutorial?.enabled || !step) return null;

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-[80] w-[360px]">
      <div className="pointer-events-auto rounded-sm border border-[color:var(--accent)]/30 bg-black/55 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="mb-1 text-[11px] text-zinc-200/70">TUTORIAL</div>
        <div className="text-[13px] text-zinc-100/90">{step.title}</div>
        <div className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-zinc-200/80">
          {step.text}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="h-8 flex-1 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[12px] hover:border-white/20"
            onClick={() => setDismissedIds((prev) => [...prev, step.id])}
          >
            OK
          </button>
          <button
            type="button"
            className="h-8 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[12px] hover:border-white/20"
            onClick={() => setDismissedIds((prev) => [...prev, step.id])}
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useRouter } from "next/navigation";
import { ScenarioEditorApp } from "@/apps/editor/ScenarioEditorApp";
import { useGameStore } from "@/engine/state";

export function ScenarioEditorPage() {
  const router = useRouter();
  const backToMenu = useGameStore((s) => s.backToMenu);

  return (
    <div className="pixel-ui crt jitter relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06071a] via-[#05060a] to-[#0b0d24]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[color:var(--ui-0)]/80 px-3 backdrop-blur">
          <button
            type="button"
            className="h-9 rounded-sm border border-white/10 bg-[color:var(--ui-1)] px-3 text-[12px] hover:border-white/20"
            onClick={() => {
              backToMenu();
              router.push("/");
            }}
          >
            ← BACK TO MENU
          </button>
          <div className="text-[12px] text-zinc-100/80">SCENARIO EDITOR</div>
          <div className="ml-auto text-[11px] text-zinc-200/60">
            Offline now; storage layer is swappable for online later.
          </div>
        </div>

        <div className="min-h-0 flex-1 p-3">
          <div className="h-full overflow-hidden rounded-sm border border-white/10 bg-black/15">
            <ScenarioEditorApp />
          </div>
        </div>
      </div>
    </div>
  );
}


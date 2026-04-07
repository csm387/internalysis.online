"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SCENARIO } from "@/data/scenario";
import { TUTORIAL_SCENARIO } from "@/data/tutorialScenario";
import { useGameStore } from "@/engine/state";
import { useRouter } from "next/navigation";
import type { Scenario } from "@/engine/scenarioTypes";
import {
  loadLibrary,
  saveLibrary,
  listLibraryScenarios,
  deleteScenario,
  renameScenario,
  togglePin,
} from "@/engine/scenarioLibrary";

export function MainMenu() {
  const startGame = useGameStore((s) => s.startGame);
  const setScenario = useGameStore((s) => s.setScenario);
  const router = useRouter();
  const [libVersion, setLibVersion] = useState(0);
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    // trigger initial library load
    setLibVersion((v) => v + 1);
  }, []);

  const scenarios = useMemo(() => {
    const builtins = [TUTORIAL_SCENARIO, DEFAULT_SCENARIO];
    const byId = new Map<string, Scenario>();
    for (const s of builtins) byId.set(s.id, s);
    const lib = loadLibrary();
    for (const item of listLibraryScenarios(lib)) byId.set(item.scenario.id, item.scenario);
    return Array.from(byId.values());
  }, [libVersion]);

  const libraryItems = useMemo(() => {
    const lib = loadLibrary();
    return listLibraryScenarios(lib);
  }, [libVersion]);

  return (
    <div className="pixel-ui crt jitter relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06071a] via-[#05060a] to-[#0b0d24]" />
      <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:9px_9px]" />

      <div className="relative z-10 flex h-full items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-sm border border-white/10 bg-black/20 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-[12px] text-zinc-200/70">OFFLINE CASE PLATFORM</div>
              <div className="text-[26px] leading-8 text-zinc-100/90">MISTERY OS</div>
            </div>
            <div className="text-right text-[11px] text-zinc-200/60">
              Select a scenario, or create your own in the Editor.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-sm border border-white/10 bg-black/10 p-3">
              <div className="mb-2 text-[11px] text-zinc-200/70">SCENARIOS</div>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-[2px] border border-white/10 bg-black/10 p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[12px] text-zinc-100/90">{s.name}</div>
                        <div className="truncate text-[11px] text-zinc-200/60">{s.id}</div>
                      </div>
                      <button
                        type="button"
                        className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
                        onClick={() => startGame(s)}
                      >
                        START
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
                  onClick={() => startGame(TUTORIAL_SCENARIO)}
                >
                  START TUTORIAL
                </button>
                <button
                  type="button"
                  className="h-8 rounded-[2px] border border-white/10 bg-black/10 px-3 text-[12px] hover:border-white/20"
                  onClick={() => {
                    router.push("/editor");
                  }}
                >
                  OPEN EDITOR
                </button>
              </div>
            </div>

            <div className="rounded-sm border border-white/10 bg-black/10 p-3">
              <div className="mb-2 text-[11px] text-zinc-200/70">IMPORT SCENARIO (JSON)</div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="h-56 w-full resize-none rounded-[2px] border border-white/10 bg-black/20 p-2 text-[12px] leading-5 text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                spellCheck={false}
                placeholder='Paste a Scenario JSON here (version: 1). Then press "IMPORT + START".'
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
                  onClick={() => {
                    try {
                      const s = JSON.parse(importText) as Scenario;
                      if (!s || s.version !== 1 || !s.id || !s.name) {
                        setStatus("Import failed: invalid scenario shape.");
                        return;
                      }
                      setScenario(s, { reset: true });
                      startGame(s);
                      setStatus("Imported and started.");
                    } catch (e) {
                      setStatus(`Import failed: ${e instanceof Error ? e.message : "Invalid JSON"}`);
                    }
                  }}
                >
                  IMPORT + START
                </button>
                <button
                  type="button"
                  className="h-8 rounded-[2px] border border-white/10 bg-black/10 px-3 text-[12px] hover:border-white/20"
                  onClick={() => {
                    setImportText(JSON.stringify(TUTORIAL_SCENARIO, null, 2));
                    setStatus("Loaded tutorial JSON into the box.");
                  }}
                >
                  LOAD SAMPLE
                </button>
              </div>
              {status && <div className="mt-2 text-[11px] text-zinc-200/70">{status}</div>}
            </div>
          </div>

          <div className="mt-4 rounded-sm border border-white/10 bg-black/10 p-3">
            <div className="mb-2 text-[11px] text-zinc-200/70">SCENARIO LIBRARY (SAVED)</div>
            {libraryItems.length === 0 ? (
              <div className="text-[12px] text-zinc-200/60">
                No saved scenarios yet. Create one in the Editor and save it.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {libraryItems.map((it) => (
                  <div
                    key={it.scenario.id}
                    className="rounded-[2px] border border-white/10 bg-black/10 p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[12px] text-zinc-100/90">
                          {it.pinned ? "★ " : ""}
                          {it.displayName}
                        </div>
                        <div className="truncate text-[11px] text-zinc-200/60">{it.scenario.id}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
                          onClick={() => startGame(it.scenario)}
                        >
                          START
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                        onClick={() => {
                          const lib = loadLibrary();
                          const next = togglePin(lib, it.scenario.id);
                          saveLibrary(next);
                          setLibVersion((v) => v + 1);
                        }}
                      >
                        {it.pinned ? "UNPIN" : "PIN"}
                      </button>
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                        onClick={() => {
                          const name = prompt("Rename scenario", it.displayName);
                          if (!name) return;
                          const lib = loadLibrary();
                          const next = renameScenario(lib, it.scenario.id, name);
                          saveLibrary(next);
                          setLibVersion((v) => v + 1);
                        }}
                      >
                        RENAME
                      </button>
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-[color:var(--danger)]/40 bg-black/10 px-2 text-[11px] text-zinc-100/90 hover:border-[color:var(--danger)]/70"
                        onClick={() => {
                          if (!confirm(`Delete "${it.displayName}"?`)) return;
                          const lib = loadLibrary();
                          const next = deleteScenario(lib, it.scenario.id);
                          saveLibrary(next);
                          setLibVersion((v) => v + 1);
                        }}
                      >
                        DELETE
                      </button>
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                        onClick={() => {
                          setScenario(it.scenario, { reset: true });
                          router.push("/editor");
                        }}
                      >
                        EDIT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


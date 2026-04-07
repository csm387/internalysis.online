"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SCENARIO } from "@/data/scenario";
import { TUTORIAL_SCENARIO } from "@/data/tutorialScenario";
import { useGameStore } from "@/engine/state";
import { useRouter } from "next/navigation";
import type { Scenario } from "@/engine/scenarioTypes";
import { useAuthStore } from "@/engine/authStore";
import type { ScenarioMeta } from "@/repositories/backendApi";
import { apiDeleteScenario, apiGetScenario, apiListScenarios, apiUpdateScenario } from "@/repositories/backendApi";

export function MainMenu() {
  const startGame = useGameStore((s) => s.startGame);
  const setScenario = useGameStore((s) => s.setScenario);
  const router = useRouter();
  const { user, csrfToken, loading, refresh, logout } = useAuthStore();
  const [onlineItems, setOnlineItems] = useState<ScenarioMeta[]>([]);
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      setOnlineItems([]);
      return;
    }
    apiListScenarios()
      .then((r) => setOnlineItems(r.scenarios))
      .catch((e) => setStatus(e instanceof Error ? e.message : "Failed to load scenarios"));
  }, [user]);

  async function startOnlineScenario(id: string) {
    const full = await apiGetScenario(id);
    const s = full.scenario;
    setScenario(s, { reset: true });
    startGame(s);
  }

  const scenarios = useMemo(() => {
    const builtins = [TUTORIAL_SCENARIO, DEFAULT_SCENARIO];
    const byId = new Map<string, Scenario>();
    for (const s of builtins) byId.set(s.id, s);
    return Array.from(byId.values());
  }, []);

  return (
    <div className="pixel-ui crt jitter relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06071a] via-[#05060a] to-[#0b0d24]" />
      <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:9px_9px]" />

      <div className="relative z-10 flex h-full items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-sm border border-white/10 bg-black/20 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-[12px] text-zinc-200/70">OFFLINE CASE PLATFORM</div>
              <div className="text-[26px] leading-8 text-zinc-100/90">internalysis.online</div>
            </div>
            <div className="text-right text-[11px] text-zinc-200/60">
              {user ? (
                <div className="space-y-1">
                  <div>Signed in{user.email ? `: ${user.email}` : ""}</div>
                  <button
                    type="button"
                    className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                    onClick={() => logout()}
                    disabled={loading}
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div>Sign in to use the online library.</div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                      onClick={() => router.push("/login")}
                    >
                      LOGIN
                    </button>
                    <button
                      type="button"
                      className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                      onClick={() => router.push("/register")}
                    >
                      REGISTER
                    </button>
                  </div>
                </div>
              )}
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
            <div className="mb-2 text-[11px] text-zinc-200/70">SCENARIO LIBRARY (ONLINE)</div>
            {!user ? (
              <div className="text-[12px] text-zinc-200/60">Login to see your online scenarios.</div>
            ) : onlineItems.length === 0 ? (
              <div className="text-[12px] text-zinc-200/60">
                No saved scenarios yet. Create one in the Editor and save it.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {onlineItems.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-[2px] border border-white/10 bg-black/10 p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[12px] text-zinc-100/90">
                          {it.pinned ? "★ " : ""}
                          {it.name}
                        </div>
                        <div className="truncate text-[11px] text-zinc-200/60">{it.id}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
                          onClick={() => startOnlineScenario(it.id)}
                        >
                          START
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                        onClick={async () => {
                          await apiUpdateScenario(it.id, { pinned: !it.pinned }, csrfToken);
                          const r = await apiListScenarios();
                          setOnlineItems(r.scenarios);
                        }}
                      >
                        {it.pinned ? "UNPIN" : "PIN"}
                      </button>
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                        onClick={async () => {
                          const name = prompt("Rename scenario", it.name);
                          if (!name) return;
                          await apiUpdateScenario(it.id, { name }, csrfToken);
                          const r = await apiListScenarios();
                          setOnlineItems(r.scenarios);
                        }}
                      >
                        RENAME
                      </button>
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-[color:var(--danger)]/40 bg-black/10 px-2 text-[11px] text-zinc-100/90 hover:border-[color:var(--danger)]/70"
                        onClick={async () => {
                          if (!confirm(`Delete "${it.name}"?`)) return;
                          await apiDeleteScenario(it.id, csrfToken);
                          const r = await apiListScenarios();
                          setOnlineItems(r.scenarios);
                        }}
                      >
                        DELETE
                      </button>
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                        onClick={async () => {
                          const full = await apiGetScenario(it.id);
                          setScenario(full.scenario, { reset: true });
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


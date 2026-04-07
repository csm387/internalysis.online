"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/engine/state";
import type { Scenario, WebsitePage } from "@/engine/scenarioTypes";
import type { Clue, UnlockCondition } from "@/engine/types";
import { validateScenario } from "@/engine/scenarioValidate";
import { useAuthStore } from "@/engine/authStore";
import {
  apiDeleteScenario,
  apiGetScenario,
  apiListScenarios,
  apiUpdateScenario,
  apiUploadAsset,
  apiUpsertScenario,
  type ScenarioMeta,
} from "@/repositories/backendApi";

function safeJsonParse<T>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

function emptyClue(): Clue {
  return {
    id: `clue_${Date.now().toString(16)}`,
    title: "New Clue",
    type: "document",
    content: { text: "" },
    relatedClues: [],
    unlockConditions: [{ type: "always" }],
  };
}

function emptyPage(): WebsitePage {
  return {
    id: `page_${Date.now().toString(16)}`,
    url: "os://browser/custom",
    title: "New Page",
    body: "",
    links: [],
    keywords: [],
  };
}

function conditionToText(c: UnlockCondition) {
  switch (c.type) {
    case "always":
      return "always";
    case "hasClue":
      return `hasClue:${c.clueId}`;
    case "hasAll":
      return `hasAll:${c.clueIds.join(",")}`;
    case "connected":
      return `connected:${c.a}+${c.b}`;
    case "progressAtLeast":
      return `progressAtLeast:${c.stage}`;
  }
}

function textToCondition(text: string): UnlockCondition | null {
  const t = text.trim();
  if (!t) return null;
  if (t === "always") return { type: "always" };
  if (t.startsWith("hasClue:")) return { type: "hasClue", clueId: t.slice("hasClue:".length).trim() };
  if (t.startsWith("hasAll:"))
    return {
      type: "hasAll",
      clueIds: t
        .slice("hasAll:".length)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };
  if (t.startsWith("connected:")) {
    const rest = t.slice("connected:".length);
    const [a, b] = rest.split("+").map((x) => x.trim());
    if (!a || !b) return null;
    return { type: "connected", a, b };
  }
  if (t.startsWith("progressAtLeast:")) {
    const n = Number(t.slice("progressAtLeast:".length).trim());
    if (!Number.isFinite(n)) return null;
    return { type: "progressAtLeast", stage: n };
  }
  return null;
}

export function ScenarioEditorApp() {
  const scenario = useGameStore((s) => s.scenario);
  const setScenario = useGameStore((s) => s.setScenario);
  const resetCaseState = useGameStore((s) => s.resetCaseState);
  const startGame = useGameStore((s) => s.startGame);
  const router = useRouter();
  const { user, csrfToken } = useAuthStore();

  const [tab, setTab] = useState<"meta" | "clues" | "sites" | "io" | "library" | "validate">("meta");
  const [selectedClueId, setSelectedClueId] = useState<string>(scenario.clues[0]?.id ?? "");
  const [selectedPageId, setSelectedPageId] = useState<string>(scenario.websites[0]?.id ?? "");
  const [ioText, setIoText] = useState<string>(() => JSON.stringify(scenario, null, 2));
  const [ioStatus, setIoStatus] = useState<string>("");
  const [onlineItems, setOnlineItems] = useState<ScenarioMeta[]>([]);
  const [renameDraft, setRenameDraft] = useState<string>("");

  const selectedClue = useMemo(
    () => scenario.clues.find((c) => c.id === selectedClueId) ?? null,
    [scenario.clues, selectedClueId],
  );
  const selectedPage = useMemo(
    () => scenario.websites.find((p) => p.id === selectedPageId) ?? null,
    [scenario.websites, selectedPageId],
  );

  function patchScenario(patch: Partial<Scenario>) {
    setScenario({ ...scenario, ...patch }, { reset: false });
  }

  async function refreshOnlineList() {
    if (!user) {
      setOnlineItems([]);
      return;
    }
    const r = await apiListScenarios();
    setOnlineItems(r.scenarios);
  }

  async function saveToLibrary() {
    if (!user) {
      setIoStatus("Login required to save online.");
      return;
    }
    await apiUpsertScenario({ id: scenario.id, name: scenario.name, json: scenario }, csrfToken);
    await refreshOnlineList();
    setIoStatus(`Saved "${scenario.name}" online.`);
  }

  async function loadFromLibrary(id: string) {
    if (!user) return;
    const full = await apiGetScenario(id);
    const s = full.scenario as Scenario;
    setScenario(s, { reset: true });
    setSelectedClueId(s.clues[0]?.id ?? "");
    setSelectedPageId(s.websites[0]?.id ?? "");
    setIoText(JSON.stringify(s, null, 2));
    setIoStatus(`Loaded "${s.name}" online.`);
  }

  const validation = useMemo(() => validateScenario(scenario), [scenario]);
  const hasErrors = validation.some((i) => i.level === "error");

  async function onPickClueImage(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("Failed to read file"));
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
    if (!selectedClue) return;

    if (user) {
      try {
        const up = await apiUploadAsset(dataUrl, csrfToken);
        patchScenario({
          clues: scenario.clues.map((c) =>
            c.id === selectedClue.id ? { ...c, content: { ...c.content, imageSrc: up.url } } : c,
          ),
        });
        setIoStatus("Image uploaded to backend assets.");
        return;
      } catch (e) {
        setIoStatus(`Upload failed, keeping local data URL. (${e instanceof Error ? e.message : "error"})`);
      }
    }

    patchScenario({
      clues: scenario.clues.map((c) =>
        c.id === selectedClue.id ? { ...c, content: { ...c.content, imageSrc: dataUrl } } : c,
      ),
    });
  }

  return (
    <div className="flex h-full">
      <div className="w-56 border-r border-white/10 bg-[color:var(--ui-0)] p-2">
        <div className="mb-2 text-[11px] text-zinc-200/70">EDITOR</div>
        <div className="space-y-1">
          {(
            [
              ["meta", "Meta"],
              ["clues", "Clues"],
              ["sites", "Websites"],
              ["io", "Import/Export"],
              ["library", "Library"],
              ["validate", "Validate"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={[
                "block w-full rounded-[2px] border px-2 py-1 text-left text-[12px]",
                tab === k
                  ? "border-[color:var(--accent)]/50 bg-[color:var(--ui-2)]"
                  : "border-white/10 bg-black/10 hover:border-white/20",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          <button
            type="button"
            className="h-8 w-full rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[12px] hover:border-white/20"
            onClick={saveToLibrary}
          >
            SAVE (ONLINE)
          </button>
          <button
            type="button"
            className="h-8 w-full rounded-[2px] border border-white/10 bg-black/10 px-2 text-[12px] hover:border-white/20"
            onClick={async () => {
              await refreshOnlineList();
              setTab("library");
            }}
          >
            OPEN ONLINE LIBRARY
          </button>
          <button
            type="button"
            className="h-8 w-full rounded-[2px] border border-white/10 bg-black/10 px-2 text-[12px] hover:border-white/20 disabled:opacity-50"
            disabled={hasErrors}
            onClick={() => {
              // playtest current scenario in-game
              startGame(scenario);
              router.push("/");
            }}
            title={hasErrors ? "Fix validation errors before playtesting" : "Playtest this scenario"}
          >
            PLAYTEST
          </button>
          <button
            type="button"
            className="h-8 w-full rounded-[2px] border border-white/10 bg-black/10 px-2 text-[12px] hover:border-white/20"
            onClick={() => {
              resetCaseState();
              setIoStatus("Case state reset (discovered clues/links/notes).");
            }}
          >
            RESET CASE STATE
          </button>
          {ioStatus && <div className="text-[11px] text-zinc-200/70">{ioStatus}</div>}
        </div>
      </div>

      <div className="min-w-0 flex-1 p-3">
        {tab === "meta" && (
          <div className="max-w-3xl space-y-3">
            <div className="rounded-sm border border-white/10 bg-black/10 p-3">
              <div className="mb-2 text-[11px] text-zinc-200/70">SCENARIO META</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <label className="text-[11px] text-zinc-200/70">
                  Name
                  <input
                    value={scenario.name}
                    onChange={(e) => patchScenario({ name: e.target.value })}
                    className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                  />
                </label>
                <label className="text-[11px] text-zinc-200/70">
                  Default browser URL
                  <input
                    value={scenario.defaultBrowserUrl}
                    onChange={(e) => patchScenario({ defaultBrowserUrl: e.target.value })}
                    className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                    spellCheck={false}
                  />
                </label>
              </div>

              <label className="mt-2 block text-[11px] text-zinc-200/70">
                Starting clue IDs (comma-separated)
                <input
                  value={scenario.startingClueIds.join(", ")}
                  onChange={(e) =>
                    patchScenario({
                      startingClueIds: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                  spellCheck={false}
                />
              </label>
            </div>
          </div>
        )}

        {tab === "clues" && (
          <div className="flex h-full gap-3">
            <div className="w-80 shrink-0 rounded-sm border border-white/10 bg-black/10 p-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] text-zinc-200/70">CLUES ({scenario.clues.length})</div>
                <button
                  type="button"
                  className="h-7 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[12px] hover:border-white/20"
                  onClick={() => {
                    const c = emptyClue();
                    patchScenario({ clues: [c, ...scenario.clues] });
                    setSelectedClueId(c.id);
                  }}
                >
                  + ADD
                </button>
              </div>
              <div className="space-y-1">
                {scenario.clues.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClueId(c.id)}
                    className={[
                      "block w-full rounded-[2px] border px-2 py-1 text-left text-[12px]",
                      selectedClueId === c.id
                        ? "border-[color:var(--accent)]/50 bg-[color:var(--ui-2)]"
                        : "border-white/10 bg-black/10 hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="truncate text-zinc-100/90">{c.title}</div>
                    <div className="truncate text-[11px] text-zinc-200/60">{c.id}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1 rounded-sm border border-white/10 bg-black/10 p-3">
              {!selectedClue ? (
                <div className="text-[12px] text-zinc-200/60">Select a clue.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-zinc-200/70">EDIT CLUE</div>
                    <button
                      type="button"
                      className="h-7 rounded-[2px] border border-[color:var(--danger)]/40 bg-black/10 px-2 text-[12px] text-zinc-100/90 hover:border-[color:var(--danger)]/70"
                      onClick={() => {
                        const next = scenario.clues.filter((c) => c.id !== selectedClue.id);
                        patchScenario({ clues: next });
                        setSelectedClueId(next[0]?.id ?? "");
                      }}
                    >
                      DELETE
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <label className="text-[11px] text-zinc-200/70">
                      ID
                      <input
                        value={selectedClue.id}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          patchScenario({
                            clues: scenario.clues.map((c) => (c.id === selectedClue.id ? { ...c, id: nextId } : c)),
                          });
                          setSelectedClueId(nextId);
                        }}
                        className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                        spellCheck={false}
                      />
                    </label>
                    <label className="text-[11px] text-zinc-200/70">
                      Title
                      <input
                        value={selectedClue.title}
                        onChange={(e) =>
                          patchScenario({
                            clues: scenario.clues.map((c) =>
                              c.id === selectedClue.id ? { ...c, title: e.target.value } : c,
                            ),
                          })
                        }
                        className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                      />
                    </label>
                  </div>

                  <label className="block text-[11px] text-zinc-200/70">
                    Type
                    <select
                      value={selectedClue.type}
                      onChange={(e) =>
                        patchScenario({
                          clues: scenario.clues.map((c) =>
                            c.id === selectedClue.id ? { ...c, type: e.target.value as Clue["type"] } : c,
                          ),
                        })
                      }
                      className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                    >
                      <option value="document">document</option>
                      <option value="image">image</option>
                      <option value="message">message</option>
                      <option value="website">website</option>
                    </select>
                  </label>

                  <label className="block text-[11px] text-zinc-200/70">
                    Content text
                    <textarea
                      value={selectedClue.content.text ?? ""}
                      onChange={(e) =>
                        patchScenario({
                          clues: scenario.clues.map((c) =>
                            c.id === selectedClue.id ? { ...c, content: { ...c.content, text: e.target.value } } : c,
                          ),
                        })
                      }
                      className="mt-1 h-24 w-full resize-none rounded-[2px] border border-white/10 bg-black/20 p-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                    />
                  </label>

                  <label className="block text-[11px] text-zinc-200/70">
                    Image src (optional)
                    <input
                      value={selectedClue.content.imageSrc ?? ""}
                      onChange={(e) =>
                        patchScenario({
                          clues: scenario.clues.map((c) =>
                            c.id === selectedClue.id
                              ? { ...c, content: { ...c.content, imageSrc: e.target.value || undefined } }
                              : c,
                          ),
                        })
                      }
                      className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                      spellCheck={false}
                    />
                  </label>

                  <div className="rounded-[2px] border border-white/10 bg-black/10 p-2">
                    <div className="mb-1 text-[11px] text-zinc-200/70">Image upload (stores as data URL)</div>
                    <input
                      type="file"
                      accept="image/*"
                      className="text-[12px] text-zinc-200/70"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        onPickClueImage(f).catch((err) => setIoStatus(String(err)));
                      }}
                    />
                    {selectedClue.content.imageSrc && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedClue.content.imageSrc}
                          alt="preview"
                          className="max-h-40 w-auto rounded-sm border border-white/10"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    )}
                  </div>

                  <label className="block text-[11px] text-zinc-200/70">
                    Related clue IDs (comma-separated)
                    <input
                      value={selectedClue.relatedClues.join(", ")}
                      onChange={(e) =>
                        patchScenario({
                          clues: scenario.clues.map((c) =>
                            c.id === selectedClue.id
                              ? {
                                  ...c,
                                  relatedClues: e.target.value
                                    .split(",")
                                    .map((x) => x.trim())
                                    .filter(Boolean),
                                }
                              : c,
                          ),
                        })
                      }
                      className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                      spellCheck={false}
                    />
                  </label>

                  <label className="block text-[11px] text-zinc-200/70">
                    Unlock conditions (one per line)
                    <textarea
                      value={selectedClue.unlockConditions.map(conditionToText).join("\n")}
                      onChange={(e) => {
                        const conds = e.target.value
                          .split("\n")
                          .map((line) => textToCondition(line))
                          .filter((x): x is UnlockCondition => Boolean(x));
                        patchScenario({
                          clues: scenario.clues.map((c) =>
                            c.id === selectedClue.id ? { ...c, unlockConditions: conds.length ? conds : [{ type: "always" }] } : c,
                          ),
                        });
                      }}
                      className="mt-1 h-24 w-full resize-none rounded-[2px] border border-white/10 bg-black/20 p-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                      spellCheck={false}
                      placeholder={[
                        "always",
                        "hasClue:msg_email_1",
                        "hasAll:image_cctv_2,doc_invoice_1",
                        "connected:image_cctv_2+doc_invoice_1",
                        "progressAtLeast:1",
                      ].join("\n")}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "sites" && (
          <div className="flex h-full gap-3">
            <div className="w-80 shrink-0 rounded-sm border border-white/10 bg-black/10 p-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] text-zinc-200/70">PAGES ({scenario.websites.length})</div>
                <button
                  type="button"
                  className="h-7 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[12px] hover:border-white/20"
                  onClick={() => {
                    const p = emptyPage();
                    patchScenario({ websites: [p, ...scenario.websites] });
                    setSelectedPageId(p.id);
                  }}
                >
                  + ADD
                </button>
              </div>
              <div className="space-y-1">
                {scenario.websites.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPageId(p.id)}
                    className={[
                      "block w-full rounded-[2px] border px-2 py-1 text-left text-[12px]",
                      selectedPageId === p.id
                        ? "border-[color:var(--accent)]/50 bg-[color:var(--ui-2)]"
                        : "border-white/10 bg-black/10 hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="truncate text-zinc-100/90">{p.title}</div>
                    <div className="truncate text-[11px] text-zinc-200/60">{p.url}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1 rounded-sm border border-white/10 bg-black/10 p-3">
              {!selectedPage ? (
                <div className="text-[12px] text-zinc-200/60">Select a page.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-zinc-200/70">EDIT PAGE</div>
                    <button
                      type="button"
                      className="h-7 rounded-[2px] border border-[color:var(--danger)]/40 bg-black/10 px-2 text-[12px] text-zinc-100/90 hover:border-[color:var(--danger)]/70"
                      onClick={() => {
                        const next = scenario.websites.filter((p) => p.id !== selectedPage.id);
                        patchScenario({ websites: next });
                        setSelectedPageId(next[0]?.id ?? "");
                      }}
                    >
                      DELETE
                    </button>
                  </div>

                  <label className="block text-[11px] text-zinc-200/70">
                    URL (fake)
                    <input
                      value={selectedPage.url}
                      onChange={(e) =>
                        patchScenario({
                          websites: scenario.websites.map((p) =>
                            p.id === selectedPage.id ? { ...p, url: e.target.value } : p,
                          ),
                        })
                      }
                      className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                      spellCheck={false}
                    />
                  </label>

                  <label className="block text-[11px] text-zinc-200/70">
                    Title
                    <input
                      value={selectedPage.title}
                      onChange={(e) =>
                        patchScenario({
                          websites: scenario.websites.map((p) =>
                            p.id === selectedPage.id ? { ...p, title: e.target.value } : p,
                          ),
                        })
                      }
                      className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                    />
                  </label>

                  <label className="block text-[11px] text-zinc-200/70">
                    Body
                    <textarea
                      value={selectedPage.body}
                      onChange={(e) =>
                        patchScenario({
                          websites: scenario.websites.map((p) =>
                            p.id === selectedPage.id ? { ...p, body: e.target.value } : p,
                          ),
                        })
                      }
                      className="mt-1 h-36 w-full resize-none rounded-[2px] border border-white/10 bg-black/20 p-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                    />
                  </label>

                  <label className="block text-[11px] text-zinc-200/70">
                    Keywords (comma-separated)
                    <input
                      value={selectedPage.keywords.join(", ")}
                      onChange={(e) =>
                        patchScenario({
                          websites: scenario.websites.map((p) =>
                            p.id === selectedPage.id
                              ? {
                                  ...p,
                                  keywords: e.target.value
                                    .split(",")
                                    .map((x) => x.trim())
                                    .filter(Boolean),
                                }
                              : p,
                          ),
                        })
                      }
                      className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                      spellCheck={false}
                    />
                  </label>

                  <label className="block text-[11px] text-zinc-200/70">
                    Clue ID to discover when visited (optional)
                    <input
                      value={selectedPage.clueId ?? ""}
                      onChange={(e) =>
                        patchScenario({
                          websites: scenario.websites.map((p) =>
                            p.id === selectedPage.id ? { ...p, clueId: e.target.value || undefined } : p,
                          ),
                        })
                      }
                      className="mt-1 h-8 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                      spellCheck={false}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "io" && (
          <div className="max-w-4xl space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[12px] hover:border-white/20"
                onClick={() => {
                  setIoText(JSON.stringify(scenario, null, 2));
                  setIoStatus("Exported current scenario to text.");
                }}
              >
                EXPORT → TEXT
              </button>
              <button
                type="button"
                className="h-8 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[12px] hover:border-white/20"
                onClick={() => {
                  const parsed = safeJsonParse<Scenario>(ioText);
                  if (!parsed.ok) {
                    setIoStatus(`Import failed: ${parsed.error}`);
                    return;
                  }
                  setScenario(parsed.value, { reset: true });
                  setSelectedClueId(parsed.value.clues[0]?.id ?? "");
                  setSelectedPageId(parsed.value.websites[0]?.id ?? "");
                  setIoStatus("Imported scenario and reset case state.");
                }}
              >
                IMPORT FROM TEXT
              </button>
            </div>

            <textarea
              value={ioText}
              onChange={(e) => setIoText(e.target.value)}
              className="h-[480px] w-full resize-none rounded-sm border border-white/10 bg-black/20 p-3 text-[12px] leading-5 text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
              spellCheck={false}
            />
            <div className="text-[11px] text-zinc-200/70">
              Tip: save/export JSON and share it with other players. They can import it here.
            </div>
          </div>
        )}

        {tab === "library" && (
          <div className="max-w-4xl space-y-3">
            <div className="rounded-sm border border-white/10 bg-black/10 p-3">
              <div className="mb-2 text-[11px] text-zinc-200/70">LIBRARY</div>
              <div className="mb-2 text-[12px] text-zinc-100/80">
                Saved scenarios are stored online (per account).
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {!user ? (
                  <div className="text-[12px] text-zinc-200/70">Login required.</div>
                ) : onlineItems.length === 0 ? (
                  <div className="text-[12px] text-zinc-200/70">No scenarios yet.</div>
                ) : (
                  onlineItems.map((it) => (
                  <div key={it.id} className="rounded-[2px] border border-white/10 bg-black/10 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[12px] text-zinc-100/90">
                          {it.pinned ? "★ " : ""}
                          {it.name}
                        </div>
                        <div className="truncate text-[11px] text-zinc-200/60">{it.id}</div>
                      </div>
                      <button
                        type="button"
                        className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
                        onClick={() => loadFromLibrary(it.id)}
                      >
                        LOAD
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
                        onClick={async () => {
                          await apiUpdateScenario(it.id, { pinned: !it.pinned }, csrfToken);
                          await refreshOnlineList();
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
                          await refreshOnlineList();
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
                          await refreshOnlineList();
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                )))}
              </div>
            </div>

            <div className="rounded-sm border border-white/10 bg-black/10 p-3">
              <div className="mb-2 text-[11px] text-zinc-200/70">RENAME CURRENT (OVERRIDE)</div>
              <div className="flex gap-2">
                <input
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  className="h-8 flex-1 rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                  placeholder={scenario.name}
                />
                <button
                  type="button"
                  className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
                  onClick={async () => {
                    const name = renameDraft.trim();
                    if (!name) return;
                    if (!user) return;
                    await apiUpdateScenario(scenario.id, { name }, csrfToken);
                    await refreshOnlineList();
                    setIoStatus("Renamed online.");
                  }}
                >
                  APPLY
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "validate" && (
          <div className="max-w-4xl space-y-2">
            <div className="rounded-sm border border-white/10 bg-black/10 p-3">
              <div className="mb-2 text-[11px] text-zinc-200/70">VALIDATION</div>
              {validation.length === 0 ? (
                <div className="text-[12px] text-zinc-200/70">No issues found.</div>
              ) : (
                <div className="space-y-2">
                  {validation.map((i, idx) => (
                    <div
                      key={`${i.code}_${idx}`}
                      className={[
                        "rounded-[2px] border px-2 py-1 text-[12px]",
                        i.level === "error"
                          ? "border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10"
                          : "border-white/10 bg-black/10",
                      ].join(" ")}
                    >
                      <div className="text-zinc-100/90">
                        {i.level.toUpperCase()}: {i.message}
                      </div>
                      {i.path && <div className="text-[11px] text-zinc-200/60">path: {i.path}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


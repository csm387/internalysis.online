"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/engine/state";
import type { Clue } from "@/engine/types";

function byId(clues: Clue[]) {
  const m = new Map<string, Clue>();
  for (const c of clues) m.set(c.id, c);
  return m;
}

function typeTag(type: Clue["type"]) {
  switch (type) {
    case "document":
      return "DOC";
    case "image":
      return "IMG";
    case "message":
      return "MSG";
    case "website":
      return "WEB";
  }
}

export function CaseBoardApp() {
  const clues = useGameStore((s) => s.scenario.clues);
  const discovered = useGameStore((s) => s.discoveredClueIds);
  const connections = useGameStore((s) => s.connections);
  const addConnection = useGameStore((s) => s.addConnection);
  const notesByClueId = useGameStore((s) => s.notesByClueId);
  const setNote = useGameStore((s) => s.setNote);
  const progress = useGameStore((s) => s.progress);

  const clueMap = useMemo(() => byId(clues), [clues]);
  const discoveredClues = useMemo(
    () => clues.filter((c) => discovered.includes(c.id)),
    [clues, discovered],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [activeClueId, setActiveClueId] = useState<string | null>(null);

  const activeClue = activeClueId ? clueMap.get(activeClueId) ?? null : null;

  return (
    <div className="flex h-full">
      <div className="w-[360px] border-r border-white/10 bg-[color:var(--ui-0)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] text-zinc-200/70">
            COLLECTED EVIDENCE ({discoveredClues.length})
          </div>
          <div className="text-[11px] text-zinc-200/70">
            STAGE <span className="text-[color:var(--accent)]">{progress.stage}</span>
          </div>
        </div>

        <div className="space-y-2">
          {discoveredClues.map((c) => {
            const isSel = selected.includes(c.id);
            const isActive = activeClueId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={[
                  "w-full rounded-sm border p-2 text-left",
                  isActive
                    ? "border-[color:var(--accent)]/60 bg-[color:var(--ui-2)]"
                    : "border-white/10 bg-black/10 hover:border-white/20",
                ].join(" ")}
                onClick={() => {
                  setActiveClueId(c.id);
                  setSelected((prev) => {
                    if (prev.includes(c.id)) return prev.filter((x) => x !== c.id);
                    if (prev.length >= 2) return [prev[1], c.id];
                    return [...prev, c.id];
                  });
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[12px] text-zinc-100/90">{c.title}</div>
                  <div
                    className={[
                      "rounded-[2px] border px-1 text-[10px] leading-4",
                      isSel ? "border-[color:var(--accent)]/60 text-[color:var(--accent)]" : "border-white/15 text-zinc-200/70",
                    ].join(" ")}
                  >
                    {typeTag(c.type)}
                  </div>
                </div>
                {c.relatedClues.length > 0 && (
                  <div className="mt-1 text-[11px] text-zinc-200/60">
                    related: {c.relatedClues.slice(0, 3).join(", ")}
                    {c.relatedClues.length > 3 ? "…" : ""}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-sm border border-white/10 bg-black/10 p-2">
          <div className="mb-2 text-[11px] text-zinc-200/70">LINK TOOL</div>
          <div className="text-[12px] text-zinc-100/80">
            Selected:{" "}
            {selected.length === 0 ? (
              <span className="text-zinc-200/50">none</span>
            ) : (
              selected.join(" + ")
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="h-8 flex-1 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[12px] hover:border-white/20 disabled:opacity-50"
              disabled={selected.length !== 2}
              onClick={() => {
                if (selected.length !== 2) return;
                addConnection(selected[0], selected[1]);
              }}
            >
              LINK
            </button>
            <button
              type="button"
              className="h-8 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[12px] hover:border-white/20"
              onClick={() => setSelected([])}
            >
              CLEAR
            </button>
          </div>

          {progress.milestones.includes("link_cctv_invoice") && (
            <div className="mt-2 rounded-[2px] border border-[color:var(--ok)]/30 bg-[color:var(--ok)]/10 px-2 py-1 text-[11px] text-zinc-100/90">
              Breakthrough logged: CCTV still matches K-17 invoice.
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-sm border border-white/10 bg-black/10 p-3">
            <div className="mb-2 text-[11px] text-zinc-200/70">CONNECTIONS</div>
            {connections.length === 0 ? (
              <div className="text-[12px] text-zinc-200/50">No links yet.</div>
            ) : (
              <div className="space-y-1">
                {connections.map((c) => (
                  <div
                    key={`${c.a}::${c.b}`}
                    className="rounded-[2px] border border-white/10 bg-black/10 px-2 py-1 text-[12px] text-zinc-100/80"
                  >
                    {c.a} ↔ {c.b}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-sm border border-white/10 bg-black/10 p-3">
            <div className="mb-2 text-[11px] text-zinc-200/70">EVIDENCE VIEWER</div>
            {!activeClue ? (
              <div className="text-[12px] text-zinc-200/50">
                Select a clue to view details and add notes.
              </div>
            ) : (
              <div>
                <div className="text-[12px] text-zinc-100/90">{activeClue.title}</div>
                <div className="mt-2 rounded-[2px] border border-white/10 bg-black/10 p-2">
                  {activeClue.type === "image" && activeClue.content.imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeClue.content.imageSrc}
                      alt={activeClue.title}
                      className="max-h-56 w-auto rounded-sm border border-white/10"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-[12px] leading-5 text-zinc-200/80">
                      {activeClue.content.text ?? "(no text)"}
                    </pre>
                  )}
                </div>

                <div className="mt-3 text-[11px] text-zinc-200/70">NOTES</div>
                <textarea
                  value={notesByClueId[activeClue.id] ?? ""}
                  onChange={(e) => setNote(activeClue.id, e.target.value)}
                  className="mt-1 h-24 w-full resize-none rounded-[2px] border border-white/10 bg-black/20 p-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                  placeholder="Your notes…"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


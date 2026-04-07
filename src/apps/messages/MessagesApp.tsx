"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/engine/state";

export function MessagesApp() {
  const discovered = useGameStore((s) => s.discoveredClueIds);
  const discoverClue = useGameStore((s) => s.discoverClue);
  const threads = useGameStore((s) => s.scenario.threads);
  const [threadId, setThreadId] = useState(threads[0]?.id ?? "");

  const thread = useMemo(() => threads.find((t) => t.id === threadId) ?? threads[0], [threadId, threads]);

  return (
    <div className="flex h-full">
      <div className="w-56 border-r border-white/10 bg-[color:var(--ui-0)] p-2">
        <div className="mb-2 text-[11px] text-zinc-200/70">THREADS</div>
        <div className="space-y-1">
          {threads.map((t) => {
            const active = t.id === threadId;
            return (
              <button
                key={t.id}
                type="button"
                className={[
                  "block w-full rounded-[2px] border px-2 py-1 text-left text-[12px]",
                  active
                    ? "border-[color:var(--accent)]/50 bg-[color:var(--ui-2)]"
                    : "border-white/10 bg-black/10 hover:border-white/20",
                ].join(" ")}
                onClick={() => setThreadId(t.id)}
              >
                {t.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 flex-1 p-3">
        <div className="mb-2 text-[11px] text-zinc-200/70">
          PARTICIPANTS: {thread?.participants.join(", ")}
        </div>

        <div className="space-y-2">
          {thread?.messages.map((m) => {
            const unlocked = !m.clueId || discovered.includes(m.clueId);
            return (
              <div
                key={m.id}
                className="rounded-sm border border-white/10 bg-black/10 p-2"
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-200/70">
                  <div>{m.from}</div>
                  <div>{m.time}</div>
                </div>
                <div className="mt-1 text-[12px] leading-5 text-zinc-100/90">
                  {unlocked ? (
                    m.text
                  ) : (
                    <span className="text-zinc-200/50">[LOCKED MESSAGE — requires more evidence]</span>
                  )}
                </div>
                {!unlocked && (
                  <button
                    type="button"
                    className="mt-2 h-7 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[12px] hover:border-white/20"
                    onClick={() => {
                      // MVP: allow manually "recovering" cached message as a clue.
                      // In a fuller game, this would depend on other actions.
                      if (m.clueId) discoverClue(m.clueId);
                    }}
                  >
                    RECOVER CACHE
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


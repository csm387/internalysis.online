"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/engine/state";
import type { AppType } from "@/engine/types";
import { useRouter } from "next/navigation";

function labelFor(app: AppType) {
  switch (app) {
    case "browser":
      return "Browser";
    case "files":
      return "Files";
    case "messages":
      return "Messages";
    case "board":
      return "Case Board";
  }
}

export function Taskbar() {
  const windows = useGameStore((s) => s.windows);
  const focusedWindowId = useGameStore((s) => s.focusedWindowId);
  const focusWindow = useGameStore((s) => s.focusWindow);
  const openApp = useGameStore((s) => s.openApp);
  const toggleMinimize = useGameStore((s) => s.toggleMinimize);
  const progress = useGameStore((s) => s.progress);
  const router = useRouter();

  const [ctx, setCtx] = useState<null | { x: number; y: number; windowId: string }>(null);
  const closeWindow = useGameStore((s) => s.closeWindow);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 h-12 border-t border-white/10 bg-[color:var(--ui-0)]/95 backdrop-blur">
      <div className="flex h-full items-center gap-2 px-2">
        <button
          type="button"
          className="h-9 rounded-sm border border-white/10 bg-[color:var(--ui-1)] px-3 text-[12px] hover:border-white/20"
          onClick={() => openApp("browser")}
        >
          MISTERY
        </button>

        <div className="flex items-center gap-1">
          {windows
            .slice()
            .sort((a, b) => a.z - b.z)
            .map((win) => {
            const active = win.id === focusedWindowId;
            return (
              <button
                key={win.id}
                type="button"
                className={[
                  "h-9 max-w-[220px] truncate rounded-sm border px-3 text-[12px]",
                  active
                    ? "border-[color:var(--accent)]/60 bg-[color:var(--ui-2)]"
                    : "border-white/10 bg-[color:var(--ui-1)] hover:border-white/20",
                  win.minimized ? "opacity-70" : "",
                ].join(" ")}
                title={win.title}
                onClick={() => {
                  if (win.minimized) return toggleMinimize(win.id);
                  focusWindow(win.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCtx({ x: e.clientX, y: e.clientY, windowId: win.id });
                }}
              >
                {labelFor(win.app)}: {win.title}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3 pr-2 text-[11px] text-zinc-200/80">
          <button
            type="button"
            className="h-7 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[11px] hover:border-white/20"
            onClick={() => openApp("browser", { mode: "new" })}
            title="New Browser Window"
          >
            +BROWSER
          </button>
          <button
            type="button"
            className="h-7 rounded-[2px] border border-white/10 bg-black/10 px-2 text-[11px] hover:border-white/20"
            onClick={() => router.push("/editor")}
            title="Open Editor"
          >
            EDITOR
          </button>
          <div>
            CASE STAGE: <span className="text-[color:var(--accent)]">{progress.stage}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="text-zinc-200/70">OFFLINE</div>
        </div>
      </div>

      {ctx && (
        <div
          className="absolute inset-0 z-[60]"
          onMouseDown={() => setCtx(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setCtx(null);
          }}
        >
          <div
            className="absolute w-44 rounded-sm border border-white/10 bg-[color:var(--ui-0)]/98 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
            style={{ left: ctx.x, top: ctx.y - 48 }}
          >
            <button
              type="button"
              className="block w-full rounded-[2px] border border-transparent px-2 py-1 text-left text-[12px] hover:border-white/10 hover:bg-white/5"
              onClick={() => {
                toggleMinimize(ctx.windowId);
                setCtx(null);
              }}
            >
              Minimize / Restore
            </button>
            <button
              type="button"
              className="block w-full rounded-[2px] border border-transparent px-2 py-1 text-left text-[12px] hover:border-white/10 hover:bg-white/5"
              onClick={() => {
                closeWindow(ctx.windowId);
                setCtx(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


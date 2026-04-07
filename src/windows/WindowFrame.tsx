"use client";

import { useRef } from "react";
import type { PropsWithChildren } from "react";
import type { WindowInstance } from "@/engine/types";
import { useGameStore } from "@/engine/state";
import { WindowContextProvider } from "@/windows/windowContext";

type Props = PropsWithChildren<{
  win: WindowInstance;
}>;

export function WindowFrame({ win, children }: Props) {
  const focusedId = useGameStore((s) => s.focusedWindowId);
  const focusWindow = useGameStore((s) => s.focusWindow);
  const closeWindow = useGameStore((s) => s.closeWindow);
  const moveWindow = useGameStore((s) => s.moveWindow);
  const toggleMinimize = useGameStore((s) => s.toggleMinimize);
  const isFocused = win.id === focusedId;

  const drag = useRef<null | { pointerId: number; dx: number; dy: number }>(null);

  return (
    <WindowContextProvider value={{ windowId: win.id }}>
      <div
        className="pointer-events-auto absolute select-none"
        style={{
          left: win.position.x,
          top: win.position.y,
          width: win.size.w,
          height: win.size.h,
          zIndex: win.z,
        }}
        onMouseDown={() => focusWindow(win.id)}
      >
      <div
        className={[
          "flex h-full flex-col overflow-hidden rounded-sm border bg-[color:var(--ui-0)] shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
          isFocused ? "border-[color:var(--accent)]/40" : "border-white/10",
        ].join(" ")}
      >
        <div
          className="flex h-9 cursor-grab items-center gap-2 border-b border-white/10 bg-[color:var(--ui-1)] px-2 active:cursor-grabbing"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement)?.closest("button")) return;
            // Dragging uses pointer events so it works on touchpads/mice.
            // Only title-bar initiates drag so app content stays interactive.
            focusWindow(win.id);
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            drag.current = {
              pointerId: e.pointerId,
              dx: e.clientX - win.position.x,
              dy: e.clientY - win.position.y,
            };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.pointerId !== e.pointerId) return;
            moveWindow(win.id, { x: e.clientX - d.dx, y: e.clientY - d.dy });
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (!d || d.pointerId !== e.pointerId) return;
            drag.current = null;
            try {
              (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
            } catch {
              // ignore
            }
          }}
        >
          <div className="h-3 w-3 rounded-[2px] bg-[color:var(--accent)]/80 shadow-[0_0_0_1px_rgba(0,0,0,0.4)_inset]" />
          <div className="flex-1 truncate text-[12px] text-zinc-100/90">
            {win.title}
          </div>
          <button
            type="button"
            className="h-6 w-8 rounded-[2px] border border-white/10 bg-black/10 text-[11px] leading-6 text-zinc-100/90 hover:border-white/20"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize(win.id);
            }}
            aria-label="Minimize window"
            title="Minimize"
          >
            _
          </button>
          <button
            type="button"
            className="h-6 w-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] text-[11px] leading-6 text-zinc-100/90 hover:border-white/20"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
            aria-label="Close window"
            title="Close"
          >
            X
          </button>
        </div>

        {!win.minimized && (
          <div className="min-h-0 flex-1 bg-[color:var(--ui-0)]">{children}</div>
        )}
      </div>
      </div>
    </WindowContextProvider>
  );
}


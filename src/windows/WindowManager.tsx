"use client";

import { useGameStore } from "@/engine/state";
import { WindowFrame } from "./WindowFrame";
import { BrowserApp } from "@/apps/browser/BrowserApp";
import { FilesApp } from "@/apps/files/FilesApp";
import { MessagesApp } from "@/apps/messages/MessagesApp";
import { CaseBoardApp } from "@/apps/board/CaseBoardApp";

export function WindowManager() {
  const windows = useGameStore((s) => s.windows);

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {windows
        .slice()
        .sort((a, b) => a.z - b.z)
        .filter((w) => !w.minimized)
        .map((w) => (
          <WindowFrame key={w.id} win={w}>
            {w.app === "browser" && <BrowserApp />}
            {w.app === "files" && <FilesApp />}
            {w.app === "messages" && <MessagesApp />}
            {w.app === "board" && <CaseBoardApp />}
          </WindowFrame>
        ))}
    </div>
  );
}


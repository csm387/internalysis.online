"use client";

import { DesktopIcon } from "@/desktop/DesktopIcon";
import { Taskbar } from "@/desktop/Taskbar";
import { WindowManager } from "@/windows/WindowManager";
import { useGameStore } from "@/engine/state";
import { useRouter } from "next/navigation";
import { TutorialOverlay } from "@/desktop/TutorialOverlay";

export function DesktopShell() {
  const openApp = useGameStore((s) => s.openApp);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const router = useRouter();

  return (
    <div className="pixel-ui crt jitter relative flex-1 overflow-hidden">
      {/* Wallpaper */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#06071a] via-[#05060a] to-[#0b0d24]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />

      {/* Desktop icons */}
      <div className="relative z-10 p-5">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            className="h-8 rounded-sm border border-white/10 bg-black/20 px-3 text-[12px] hover:border-white/20"
            onClick={() => backToMenu()}
          >
            ← MENU
          </button>
          <button
            type="button"
            className="h-8 rounded-sm border border-white/10 bg-black/20 px-3 text-[12px] hover:border-white/20"
            onClick={() => router.push("/editor")}
          >
            EDITOR
          </button>
        </div>
        <div className="grid w-[220px] grid-cols-2 gap-3">
          <DesktopIcon label="Browser" iconSrc="/apps_icons/browser_icon.svg" onOpen={() => openApp("browser", { mode: "reuse" })} />
          <DesktopIcon label="Files" iconSrc="/apps_icons/files_icon.svg" onOpen={() => openApp("files")} />
          <DesktopIcon label="Messages" iconSrc="/apps_icons/messages_icon.svg" onOpen={() => openApp("messages")} />
          <DesktopIcon label="Case Board" iconSrc="/apps_icons/case_board_icon.svg" onOpen={() => openApp("board")} />
        </div>
      </div>

      <WindowManager />
      <TutorialOverlay />
      <Taskbar />
    </div>
  );
}


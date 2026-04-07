"use client";

import { useEffect } from "react";
import { DesktopShell } from "@/desktop/DesktopShell";
import { useGameStore } from "@/engine/state";
import { MainMenu } from "@/components/MainMenu";

export function GameRoot() {
  const initialize = useGameStore((s) => s.initialize);
  const uiMode = useGameStore((s) => s.uiMode);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (uiMode === "menu") return <MainMenu />;
  return <DesktopShell />;
}


"use client";

import { createContext, useContext } from "react";

type WindowContextValue = { windowId: string };

const Ctx = createContext<WindowContextValue | null>(null);

export function WindowContextProvider({
  value,
  children,
}: {
  value: WindowContextValue;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWindowId() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWindowId must be used inside a WindowContextProvider");
  return v.windowId;
}


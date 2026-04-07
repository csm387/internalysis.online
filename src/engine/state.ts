"use client";

import { create } from "zustand";
import { DEFAULT_SCENARIO } from "@/data/scenario";
import { runEngine, type GameProgress } from "@/engine/gameEngine";
import type { AppType, EvidenceConnection, WindowInstance } from "@/engine/types";
import type { Scenario } from "@/engine/scenarioTypes";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function nextWindowDefaults(app: AppType): Pick<WindowInstance, "position" | "size"> {
  const base = { x: 70, y: 60 };
  switch (app) {
    case "browser":
      return { position: base, size: { w: 820, h: 520 } };
    case "files":
      return { position: { x: 110, y: 100 }, size: { w: 720, h: 460 } };
    case "messages":
      return { position: { x: 150, y: 140 }, size: { w: 700, h: 450 } };
    case "board":
      return { position: { x: 90, y: 90 }, size: { w: 900, h: 560 } };
  }
}

function defaultTitle(app: AppType) {
  switch (app) {
    case "browser":
      return "NetSurfer (Offline)";
    case "files":
      return "FileCabinet";
    case "messages":
      return "Messages (Cached)";
    case "board":
      return "Case Board";
  }
}

function normalizeConnection(a: string, b: string): EvidenceConnection {
  return a < b ? { a, b } : { a: b, b: a };
}

type BrowserState = {
  lastSearch: string;
};

type BrowserTab = {
  id: string;
  url: string;
  title?: string;
};

type BrowserWindowState = {
  activeTabId: string;
  addressBar: string;
  tabs: BrowserTab[];
};

type GameState = {
  scenario: Scenario;
  uiMode: "menu" | "os";
  selectedScenarioId: string | null;

  windows: WindowInstance[];
  focusedWindowId: string | null;

  discoveredClueIds: string[];
  connections: EvidenceConnection[];
  notesByClueId: Record<string, string>;
  progress: GameProgress;

  browser: BrowserState;
  browserWindows: Record<string, BrowserWindowState>;

  initialize: () => void;
  setScenario: (scenario: Scenario, opts?: { reset?: boolean }) => void;
  resetCaseState: () => void;
  startGame: (scenario: Scenario) => void;
  backToMenu: () => void;

  openApp: (app: AppType, opts?: { mode?: "reuse" | "new" }) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  moveWindow: (windowId: string, position: { x: number; y: number }) => void;
  toggleMinimize: (windowId: string) => void;

  discoverClue: (clueId: string) => void;
  addConnection: (a: string, b: string) => void;
  setNote: (clueId: string, note: string) => void;

  navigate: (url: string) => void;
  setAddressBar: (value: string) => void;
  searchBrowser: (query: string) => { url: string; title: string }[];

  // Browser tabs (per window)
  ensureBrowserWindow: (windowId: string) => void;
  addBrowserTab: (windowId: string, url?: string) => void;
  closeBrowserTab: (windowId: string, tabId: string) => void;
  setActiveBrowserTab: (windowId: string, tabId: string) => void;
  setBrowserAddressBar: (windowId: string, value: string) => void;
  navigateBrowserTab: (windowId: string, url: string) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  scenario: DEFAULT_SCENARIO,
  uiMode: "menu",
  selectedScenarioId: null,

  windows: [],
  focusedWindowId: null,

  discoveredClueIds: [],
  connections: [],
  notesByClueId: {},
  progress: { stage: 0, milestones: [] },

  browser: {
    lastSearch: "",
  },
  browserWindows: {},

  initialize: () => {
    const s = get();
    // Don't auto-start the OS anymore; main menu decides.
    if (s.windows.length > 0) return;

    set({ uiMode: "menu" });
  },

  setScenario: (scenario, opts) => {
    set({ scenario });
    if (opts?.reset !== false) get().resetCaseState();
  },

  resetCaseState: () => {
    const s = get();
    set({
      discoveredClueIds: [...s.scenario.startingClueIds],
      connections: [],
      notesByClueId: {},
      progress: { stage: 0, milestones: [] },
      browser: { ...s.browser, lastSearch: "" },
      browserWindows: {},
    });
  },

  startGame: (scenario) => {
    set({
      scenario,
      selectedScenarioId: scenario.id,
      uiMode: "os",
      windows: [],
      focusedWindowId: null,
    });
    get().resetCaseState();
    get().openApp("browser");
    get().openApp("messages");
  },

  backToMenu: () => {
    set({
      uiMode: "menu",
      windows: [],
      focusedWindowId: null,
    });
  },

  openApp: (app, opts) => {
    const mode = opts?.mode ?? "reuse";
    const existing = mode === "reuse" ? get().windows.find((w) => w.app === app) : undefined;
    if (existing) {
      if (existing.minimized) {
        set((state) => ({
          windows: state.windows.map((w) => (w.id === existing.id ? { ...w, minimized: false } : w)),
        }));
      }
      get().focusWindow(existing.id);
      return;
    }

    const z = (get().windows.reduce((m, w) => Math.max(m, w.z), 0) || 0) + 1;
    const { position, size } = nextWindowDefaults(app);
    const id = uid(app);

    const win: WindowInstance = {
      id,
      app,
      title: defaultTitle(app),
      z,
      position,
      size,
    };

    set((state) => ({
      windows: [...state.windows, win],
      focusedWindowId: id,
    }));

    if (app === "browser") get().ensureBrowserWindow(id);
  },

  closeWindow: (windowId) => {
    set((state) => {
      const remaining = state.windows.filter((w) => w.id !== windowId);
      const nextFocus =
        remaining.length === 0
          ? null
          : remaining
              .filter((w) => !w.minimized)
              .reduce(
                (best, w) => (w.z > best.z ? w : best),
                remaining.filter((w) => !w.minimized)[0] ?? remaining[0],
              ).id;
      return { windows: remaining, focusedWindowId: nextFocus };
    });

    // Cleanup browser state
    set((state) => {
      if (!state.browserWindows[windowId]) return state;
      const { [windowId]: _gone, ...rest } = state.browserWindows;
      return { browserWindows: rest };
    });
  },

  focusWindow: (windowId) => {
    set((state) => {
      const target = state.windows.find((w) => w.id === windowId);
      if (!target) return state;
      // Restoring on focus feels OS-like.
      const restored = target.minimized
        ? state.windows.map((w) => (w.id === windowId ? { ...w, minimized: false } : w))
        : state.windows;
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.z), 0);
      const bump =
        target.z === maxZ
          ? restored
          : restored.map((w) => (w.id === windowId ? { ...w, z: maxZ + 1 } : w));
      return { windows: bump, focusedWindowId: windowId };
    });
  },

  toggleMinimize: (windowId) => {
    set((state) => {
      const target = state.windows.find((w) => w.id === windowId);
      if (!target) return state;
      const minimized = !target.minimized;
      const nextWindows = state.windows.map((w) =>
        w.id === windowId ? { ...w, minimized } : w,
      );
      const nextFocus =
        minimized && state.focusedWindowId === windowId
          ? nextWindows
              .filter((w) => !w.minimized && w.id !== windowId)
              .reduce(
                (best, w) => (w.z > best.z ? w : best),
                nextWindows.filter((w) => !w.minimized && w.id !== windowId)[0] ?? target,
              )?.id ?? null
          : state.focusedWindowId;
      return { windows: nextWindows, focusedWindowId: nextFocus };
    });
  },

  moveWindow: (windowId, position) => {
    const margin = 8;
    const taskbar = 48;
    const w = get().windows.find((x) => x.id === windowId);
    if (!w) return;

    const maxX = Math.max(margin, window.innerWidth - w.size.w - margin);
    const maxY = Math.max(margin, window.innerHeight - taskbar - w.size.h - margin);

    const next = {
      x: clamp(position.x, margin, maxX),
      y: clamp(position.y, margin, maxY),
    };

    set((state) => ({
      windows: state.windows.map((win) => (win.id === windowId ? { ...win, position: next } : win)),
    }));
  },

  discoverClue: (clueId) => {
    const s = get();
    if (s.discoveredClueIds.includes(clueId)) return;

    const nextDiscovered = [...s.discoveredClueIds, clueId];
    set({ discoveredClueIds: nextDiscovered });

    // Run the engine immediately to unlock chained evidence.
    const out = runEngine({
      allClues: s.scenario.clues,
      discoveredClueIds: nextDiscovered,
      connections: s.connections,
      progress: s.progress,
    });

    if (out.newlyUnlockedClueIds.length > 0 || out.progress.stage !== s.progress.stage) {
      set((state) => ({
        discoveredClueIds: Array.from(new Set([...state.discoveredClueIds, ...out.newlyUnlockedClueIds])),
        progress: out.progress,
      }));
    }
  },

  addConnection: (a, b) => {
    if (a === b) return;
    const s = get();
    const conn = normalizeConnection(a, b);
    const key = `${conn.a}::${conn.b}`;
    const already = s.connections.some((c) => `${c.a}::${c.b}` === key);
    if (already) return;

    const nextConnections = [...s.connections, conn];
    set({ connections: nextConnections });

    const out = runEngine({
      allClues: s.scenario.clues,
      discoveredClueIds: s.discoveredClueIds,
      connections: nextConnections,
      progress: s.progress,
    });

    if (out.newlyUnlockedClueIds.length > 0 || out.progress.stage !== s.progress.stage) {
      set((state) => ({
        discoveredClueIds: Array.from(new Set([...state.discoveredClueIds, ...out.newlyUnlockedClueIds])),
        progress: out.progress,
      }));
    }
  },

  setNote: (clueId, note) => {
    set((state) => ({
      notesByClueId: { ...state.notesByClueId, [clueId]: note },
    }));
  },

  // Legacy single-browser API kept for compatibility (no-op wrappers).
  // Use navigateBrowserTab/setBrowserAddressBar from BrowserApp.
  navigate: (_url) => {},
  setAddressBar: (_value) => {},

  searchBrowser: (query) => {
    const q = query.trim().toLowerCase();
    set((state) => ({ browser: { ...state.browser, lastSearch: q } }));
    if (!q) return [];

    const scored = get().scenario.websites.map((p) => {
      const hay = `${p.title} ${p.body} ${p.keywords.join(" ")}`.toLowerCase();
      const hits = q
        .split(/\s+/)
        .filter(Boolean)
        .reduce((acc, token) => (hay.includes(token) ? acc + 1 : acc), 0);
      return { p, hits };
    })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 8);

    return scored.map(({ p }) => ({ url: p.url, title: p.title }));
  },

  ensureBrowserWindow: (windowId) => {
    const s = get();
    if (s.browserWindows[windowId]) return;
    const url = s.scenario.defaultBrowserUrl;
    const tabId = uid("tab");
    set((state) => ({
      browserWindows: {
        ...state.browserWindows,
        [windowId]: {
          activeTabId: tabId,
          addressBar: url,
          tabs: [{ id: tabId, url }],
        },
      },
    }));
    const page = get().scenario.websites.find((p) => p.url === url);
    if (page?.clueId) get().discoverClue(page.clueId);
  },

  addBrowserTab: (windowId, url) => {
    get().ensureBrowserWindow(windowId);
    const s = get();
    const win = s.browserWindows[windowId];
    if (!win) return;
    const safeUrl = url ?? s.scenario.defaultBrowserUrl;
    const tabId = uid("tab");
    set((state) => ({
      browserWindows: {
        ...state.browserWindows,
        [windowId]: {
          ...win,
          activeTabId: tabId,
          addressBar: safeUrl,
          tabs: [...win.tabs, { id: tabId, url: safeUrl }],
        },
      },
    }));
  },

  closeBrowserTab: (windowId, tabId) => {
    const s = get();
    const win = s.browserWindows[windowId];
    if (!win) return;
    if (win.tabs.length <= 1) return;
    const nextTabs = win.tabs.filter((t) => t.id !== tabId);
    const nextActive = win.activeTabId === tabId ? nextTabs[nextTabs.length - 1]!.id : win.activeTabId;
    const nextActiveUrl = nextTabs.find((t) => t.id === nextActive)?.url ?? nextTabs[0]!.url;
    set((state) => ({
      browserWindows: {
        ...state.browserWindows,
        [windowId]: {
          ...win,
          tabs: nextTabs,
          activeTabId: nextActive,
          addressBar: nextActiveUrl,
        },
      },
    }));
  },

  setActiveBrowserTab: (windowId, tabId) => {
    const s = get();
    const win = s.browserWindows[windowId];
    if (!win) return;
    const tab = win.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    set((state) => ({
      browserWindows: {
        ...state.browserWindows,
        [windowId]: { ...win, activeTabId: tabId, addressBar: tab.url },
      },
    }));
  },

  setBrowserAddressBar: (windowId, value) => {
    const s = get();
    const win = s.browserWindows[windowId];
    if (!win) return;
    set((state) => ({
      browserWindows: {
        ...state.browserWindows,
        [windowId]: { ...win, addressBar: value },
      },
    }));
  },

  navigateBrowserTab: (windowId, url) => {
    get().ensureBrowserWindow(windowId);
    const s = get();
    const win = s.browserWindows[windowId];
    if (!win) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    const safe = trimmed.startsWith("os://") ? trimmed : `os://browser/${trimmed.replace(/^\/+/, "")}`;
    const nextTabs = win.tabs.map((t) => (t.id === win.activeTabId ? { ...t, url: safe } : t));
    set((state) => ({
      browserWindows: {
        ...state.browserWindows,
        [windowId]: { ...win, tabs: nextTabs, addressBar: safe },
      },
    }));
    const page = get().scenario.websites.find((p) => p.url === safe);
    if (page?.clueId) get().discoverClue(page.clueId);
  },
}));


"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/engine/state";
import { useWindowId } from "@/windows/windowContext";

export function BrowserApp() {
  const windowId = useWindowId();
  const ensureBrowserWindow = useGameStore((s) => s.ensureBrowserWindow);
  const addBrowserTab = useGameStore((s) => s.addBrowserTab);
  const closeBrowserTab = useGameStore((s) => s.closeBrowserTab);
  const setActiveBrowserTab = useGameStore((s) => s.setActiveBrowserTab);
  const navigateBrowserTab = useGameStore((s) => s.navigateBrowserTab);
  const setBrowserAddressBar = useGameStore((s) => s.setBrowserAddressBar);
  const searchBrowser = useGameStore((s) => s.searchBrowser);
  const pages = useGameStore((s) => s.scenario.websites);
  const bw = useGameStore((s) => s.browserWindows[windowId] ?? null);

  useMemo(() => {
    ensureBrowserWindow(windowId);
    return null;
  }, [ensureBrowserWindow, windowId]);

  const activeTab = bw?.tabs.find((t) => t.id === bw.activeTabId) ?? null;
  const url = activeTab?.url ?? "";
  const addressBar = bw?.addressBar ?? "";

  const page = useMemo(() => pages.find((p) => p.url === url) ?? null, [pages, url]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ url: string; title: string }[]>([]);

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 bg-[color:var(--ui-0)] px-2 py-1">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-auto">
          {(bw?.tabs ?? []).map((t) => {
            const isActive = t.id === bw?.activeTabId;
            const tabTitle = pages.find((p) => p.url === t.url)?.title ?? t.url.replace("os://browser/", "");
            return (
              <button
                key={t.id}
                type="button"
                className={[
                  "group flex items-center gap-2 rounded-[2px] border px-2 py-1 text-[12px]",
                  isActive
                    ? "border-[color:var(--accent)]/50 bg-[color:var(--ui-2)]"
                    : "border-white/10 bg-black/10 hover:border-white/20",
                ].join(" ")}
                onClick={() => setActiveBrowserTab(windowId, t.id)}
                title={tabTitle}
              >
                <div className="max-w-[160px] truncate">{tabTitle || "tab"}</div>
                <span
                  className="rounded-[2px] border border-transparent px-1 text-[11px] text-zinc-200/70 hover:border-white/10 hover:bg-white/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeBrowserTab(windowId, t.id);
                  }}
                  title="Close tab"
                >
                  x
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="h-7 rounded-[2px] border border-white/10 bg-[color:var(--ui-1)] px-2 text-[12px] hover:border-white/20"
          onClick={() => addBrowserTab(windowId)}
          title="New tab"
        >
          +
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 bg-[color:var(--ui-1)] px-2 py-2">
        <div className="text-[11px] text-zinc-200/70">URL</div>
        <input
          value={addressBar}
          onChange={(e) => setBrowserAddressBar(windowId, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigateBrowserTab(windowId, addressBar);
          }}
          className="h-8 flex-1 rounded-[2px] border border-white/10 bg-black/30 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
          spellCheck={false}
        />
        <button
          type="button"
          className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
          onClick={() => navigateBrowserTab(windowId, addressBar)}
        >
          GO
        </button>
        <button
          type="button"
          className="h-8 rounded-[2px] border border-white/10 bg-black/10 px-3 text-[12px] hover:border-white/20"
          onClick={() => addBrowserTab(windowId)}
          title="Open a new tab"
        >
          TAB
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 bg-[color:var(--ui-0)] px-2 py-2">
        <div className="text-[11px] text-zinc-200/70">SEARCH</div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setResults(searchBrowser(search));
          }}
          className="h-8 flex-1 rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
          placeholder="keywords… (pier 9, badge, K-17, directory)"
          spellCheck={false}
        />
        <button
          type="button"
          className="h-8 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20"
          onClick={() => setResults(searchBrowser(search))}
        >
          FIND
        </button>
      </div>

      {results.length > 0 && (
        <div className="border-b border-white/10 bg-[color:var(--ui-0)] px-2 py-2">
          <div className="mb-1 text-[11px] text-zinc-200/70">RESULTS</div>
          <div className="flex flex-col gap-1">
            {results.map((r) => (
              <button
                key={r.url}
                type="button"
                className="rounded-[2px] border border-white/10 bg-black/10 px-2 py-1 text-left text-[12px] hover:border-white/20"
                onClick={() => {
                  navigateBrowserTab(windowId, r.url);
                  setResults([]);
                }}
              >
                <div className="text-zinc-100/90">{r.title}</div>
                <div className="text-[11px] text-zinc-200/60">{r.url}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="rounded-sm border border-white/10 bg-black/10 p-3">
          <div className="mb-2 text-[13px] text-zinc-100/90">
            {page?.title ?? "Page Not Found (Offline)"}
          </div>
          <pre className="whitespace-pre-wrap text-[12px] leading-5 text-zinc-200/80">
            {page?.body ??
              [
                "The requested page is not in the cache.",
                "",
                "Tips:",
                "- Use SEARCH to locate known pages.",
                "- Try: os://browser/news",
              ].join("\n")}
          </pre>

          {page?.links?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {page.links.map((l) => (
                <button
                  key={l.url}
                  type="button"
                  className="rounded-[2px] border border-[color:var(--accent)]/30 bg-[color:var(--ui-2)] px-2 py-1 text-[12px] text-zinc-100/90 hover:border-[color:var(--accent)]/60"
                  onClick={() => navigateBrowserTab(windowId, l.url)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


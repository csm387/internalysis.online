"use client";

import { useMemo, useState } from "react";
import type { FileNode } from "@/engine/scenarioTypes";
import { useGameStore } from "@/engine/state";

type Path = string[]; // ["Case","Pier9"]

function getNodeAtPath(root: FileNode, path: Path): FileNode | null {
  let cur: FileNode = root;
  for (const seg of path) {
    if (cur.kind !== "folder") return null;
    const next = cur.children.find((c) => c.name === seg);
    if (!next) return null;
    cur = next;
  }
  return cur;
}

function joinPath(path: Path) {
  return path.length ? `/${path.join("/")}` : "/";
}

function FolderTree({
  node,
  path,
  current,
  onOpenFolder,
}: {
  node: FileNode;
  path: Path;
  current: Path;
  onOpenFolder: (path: Path) => void;
}) {
  if (node.kind !== "folder") return null;
  return (
    <div className="space-y-1">
      {node.children
        .filter((c) => c.kind === "folder")
        .map((c) => {
          const nextPath = [...path, c.name];
          const active = joinPath(nextPath) === joinPath(current);
          return (
            <button
              key={joinPath(nextPath)}
              type="button"
              className={[
                "block w-full rounded-[2px] border px-2 py-1 text-left text-[12px]",
                active
                  ? "border-[color:var(--accent)]/50 bg-[color:var(--ui-2)]"
                  : "border-white/10 bg-black/10 hover:border-white/20",
              ].join(" ")}
              onClick={() => onOpenFolder(nextPath)}
            >
              {c.name}
            </button>
          );
        })}
    </div>
  );
}

export function FilesApp() {
  const discoverClue = useGameStore((s) => s.discoverClue);
  const fileSystem = useGameStore((s) => s.scenario.fileSystem);
  const [path, setPath] = useState<Path>(["Desktop"]);
  const [openFile, setOpenFile] = useState<Extract<FileNode, { kind: "file" }> | null>(null);

  const folder = useMemo(() => getNodeAtPath(fileSystem, path), [fileSystem, path]);
  const files =
    folder && folder.kind === "folder" ? folder.children.filter((c) => c.kind === "file") : [];

  return (
    <div className="flex h-full">
      <div className="w-56 border-r border-white/10 bg-[color:var(--ui-0)] p-2">
        <div className="mb-2 text-[11px] text-zinc-200/70">FOLDERS</div>
        <FolderTree
          node={fileSystem}
          path={[]}
          current={path}
          onOpenFolder={(p) => {
            setPath(p);
            setOpenFile(null);
          }}
        />
      </div>

      <div className="min-w-0 flex-1 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] text-zinc-200/70">PATH: {joinPath(path)}</div>
          <button
            type="button"
            className="h-7 rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-2 text-[12px] hover:border-white/20"
            onClick={() => {
              const next = path.slice(0, -1);
              setPath(next.length ? next : []);
              setOpenFile(null);
            }}
          >
            UP
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {files.map((f) => (
            <button
              key={f.name}
              type="button"
              className="rounded-[2px] border border-white/10 bg-black/10 p-2 text-left hover:border-white/20"
              onClick={() => {
                setOpenFile(f);
                if (f.clueId) discoverClue(f.clueId);
              }}
            >
              <div className="text-[12px] text-zinc-100/90">{f.name}</div>
              <div className="text-[11px] text-zinc-200/60">{f.fileType.toUpperCase()}</div>
            </button>
          ))}
        </div>

        {openFile && (
          <div className="mt-3 rounded-sm border border-white/10 bg-black/10 p-3">
            <div className="mb-2 text-[12px] text-zinc-100/90">{openFile.name}</div>
            {openFile.fileType === "img" && openFile.content.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={openFile.content.imageSrc}
                alt={openFile.name}
                className="max-h-64 w-auto rounded-sm border border-white/10"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-[12px] leading-5 text-zinc-200/80">
                {openFile.content.text ?? "(empty)"}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


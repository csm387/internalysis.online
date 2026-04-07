## internalysis.online — Browser-based detective investigation game

A fictional, **offline** detective investigation prototype built with **Next.js (App Router) + React + TypeScript**.

You play inside a fake “old computer” desktop:

- **Desktop environment**: taskbar, icons, window system (open/close/focus)
- **Apps**: Browser, Files, Messages, Case Board
- **In-game browser**: fake URL space (`os://browser/...`), clickable links, keyword search
- **Evidence system**: data-driven clues in `src/data/clues.ts`
- **Progression engine**: unlocks clues based on conditions + case-board validation

Everything is **locally generated / hard-coded fictional data**. No real APIs. No internet.

## Getting Started

Install and run the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Core folders (MVP)

The project uses a modular “fake OS” architecture:

- `src/app/`: Next.js route shell
- `src/components/`: app-level React components (e.g. `GameRoot`)
- `src/desktop/`: desktop UI (icons/taskbar)
- `src/windows/`: window manager + window chrome
- `src/apps/`: in-OS apps
  - `src/apps/browser/`: fake browser UI + rendering
  - `src/apps/files/`: file explorer UI + file viewer
  - `src/apps/messages/`: fake email/messages UI
  - `src/apps/board/`: case board UI + linking + notes
- `src/data/`: fictional content
  - `src/data/clues.ts`: evidence definitions + unlock conditions
  - `src/data/websites.ts`: offline website pages + links + keywords
  - `src/data/files.ts`: fake filesystem tree
  - `src/data/messages.ts`: fake message threads
- `src/engine/`: gameplay logic + global state
  - `src/engine/state.ts`: Zustand store (windows, discovered clues, progress)
  - `src/engine/gameEngine.ts`: pure unlock/progression logic
  - `src/engine/types.ts`: shared types

## How progression works (MVP)

- Start with two clues pre-discovered (`STARTING_CLUE_IDS`)
- Visiting certain browser pages can discover website clues
- Opening certain files discovers file-based clues
- Linking key evidence on the case board triggers a **stage breakthrough** and unlocks additional pages

## Notes

- Evidence images are simple local assets in `public/evidence/`
- Visual style aims for a dark, pixel/PS2-era UI with optional CRT overlay (CSS)


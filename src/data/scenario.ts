import { CLUES, STARTING_CLUE_IDS } from "@/data/clues";
import { DEFAULT_BROWSER_URL, WEBSITE_PAGES } from "@/data/websites";
import { FILE_SYSTEM } from "@/data/files";
import { THREADS } from "@/data/messages";
import type { Scenario } from "@/engine/scenarioTypes";

export const DEFAULT_SCENARIO: Scenario = {
  version: 1,
  id: "pier9_k17",
  name: "Pier 9 — K-17",
  defaultBrowserUrl: DEFAULT_BROWSER_URL,
  startingClueIds: STARTING_CLUE_IDS,
  clues: CLUES,
  websites: WEBSITE_PAGES,
  fileSystem: FILE_SYSTEM,
  threads: THREADS,
};


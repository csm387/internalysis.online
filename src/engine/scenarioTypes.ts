import type { Clue } from "@/engine/types";

export type WebsitePage = {
  id: string;
  url: string; // fake URL space: os://browser/...
  title: string;
  body: string;
  links: { label: string; url: string }[];
  keywords: string[];
  clueId?: string;
};

export type FileNode =
  | {
      kind: "folder";
      name: string;
      children: FileNode[];
    }
  | {
      kind: "file";
      name: string;
      fileType: "txt" | "img" | "log";
      content: { text?: string; imageSrc?: string };
      clueId?: string;
    };

export type Message = {
  id: string;
  from: string;
  text: string;
  time: string;
  clueId?: string;
};

export type Thread = {
  id: string;
  title: string;
  participants: string[];
  messages: Message[];
};

export type Scenario = {
  version: 1;
  id: string;
  name: string;
  defaultBrowserUrl: string;
  startingClueIds: string[];
  clues: Clue[];
  websites: WebsitePage[];
  fileSystem: FileNode;
  threads: Thread[];
  tutorial?: {
    enabled: boolean;
    steps: {
      id: string;
      title: string;
      text: string;
      when:
        | { type: "always" }
        | { type: "hasClue"; clueId: string }
        | { type: "progressAtLeast"; stage: number }
        | { type: "milestone"; id: string };
    }[];
  };
};


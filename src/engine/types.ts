export type ClueType = "document" | "image" | "message" | "website";

export type UnlockCondition =
  | { type: "always" }
  | { type: "hasClue"; clueId: string }
  | { type: "hasAll"; clueIds: string[] }
  | { type: "connected"; a: string; b: string }
  | { type: "progressAtLeast"; stage: number };

export type Clue = {
  id: string;
  title: string;
  type: ClueType;
  content: {
    text?: string;
    imageSrc?: string;
    url?: string;
  };
  relatedClues: string[];
  unlockConditions: UnlockCondition[];
};

export type EvidenceConnection = {
  a: string;
  b: string;
};

export type AppType = "browser" | "files" | "messages" | "board";

export type WindowInstance = {
  id: string;
  app: AppType;
  title: string;
  z: number;
  position: { x: number; y: number };
  size: { w: number; h: number };
  minimized?: boolean;
};


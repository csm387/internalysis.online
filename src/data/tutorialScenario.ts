import type { Scenario } from "@/engine/scenarioTypes";

export const TUTORIAL_SCENARIO: Scenario = {
  version: 1,
  id: "tutorial_basics",
  name: "Tutorial — Basics",
  defaultBrowserUrl: "os://browser/tutorial/welcome",
  startingClueIds: ["tut_welcome_site"],
  clues: [
    {
      id: "tut_welcome_site",
      title: "Welcome Page (Cached)",
      type: "website",
      content: {
        url: "os://browser/tutorial/welcome",
        text: [
          "WELCOME, DETECTIVE.",
          "",
          "This is an offline terminal simulation.",
          "Your job: collect evidence, connect it on the case board, unlock new leads.",
          "",
          "Tip: open the Case Board and link the two tutorial clues when you find them.",
        ].join("\n"),
      },
      relatedClues: ["tut_note_doc", "tut_photo_img"],
      unlockConditions: [{ type: "always" }],
    },
    {
      id: "tut_note_doc",
      title: "Training Note.txt",
      type: "document",
      content: {
        text: [
          "TRAINING NOTE",
          "",
          "Step 1: Open Files and locate /Case/Tutorial/training_note.txt",
          "Step 2: Open the image too.",
          "Step 3: Link them on the Case Board.",
        ].join("\n"),
      },
      relatedClues: ["tut_photo_img"],
      unlockConditions: [{ type: "always" }],
    },
    {
      id: "tut_photo_img",
      title: "Training Photo (Badge Sticker)",
      type: "image",
      content: {
        imageSrc: "/evidence/cctv-kiosk.svg",
        text: "A badge sticker reads: K-17 (training sample).",
      },
      relatedClues: ["tut_note_doc"],
      unlockConditions: [{ type: "always" }],
    },
    {
      id: "tut_unlocked_profile",
      title: "Unlocked Lead: Dummy Profile",
      type: "website",
      content: {
        url: "os://browser/tutorial/lead",
        text: [
          "GOOD WORK.",
          "",
          "You linked two pieces of evidence.",
          "That’s how real scenarios gate progress.",
        ].join("\n"),
      },
      relatedClues: [],
      unlockConditions: [
        { type: "connected", a: "tut_note_doc", b: "tut_photo_img" },
        { type: "progressAtLeast", stage: 1 },
      ],
    },
  ],
  websites: [
    {
      id: "tut_welcome",
      url: "os://browser/tutorial/welcome",
      title: "Tutorial Welcome",
      body: [
        "WELCOME, DETECTIVE.",
        "",
        "Use the desktop icons to open apps.",
        "Try: Files → open training_note.txt",
        "Then: Case Board → link the two tutorial clues.",
      ].join("\n"),
      links: [
        { label: "Open: Tutorial Lead (locked until you link evidence)", url: "os://browser/tutorial/lead" },
      ],
      keywords: ["tutorial", "welcome", "case board", "files"],
      clueId: "tut_welcome_site",
    },
    {
      id: "tut_lead",
      url: "os://browser/tutorial/lead",
      title: "Tutorial Lead",
      body: [
        "This page is part of the tutorial.",
        "If it shows up as 'not found', you haven't unlocked the clue yet.",
      ].join("\n"),
      links: [{ label: "Back", url: "os://browser/tutorial/welcome" }],
      keywords: ["tutorial", "lead"],
      clueId: "tut_unlocked_profile",
    },
  ],
  fileSystem: {
    kind: "folder",
    name: "root",
    children: [
      {
        kind: "folder",
        name: "Desktop",
        children: [
          {
            kind: "file",
            name: "TUTORIAL_README.txt",
            fileType: "txt",
            content: {
              text: "Open Files → Case → Tutorial.",
            },
          },
        ],
      },
      {
        kind: "folder",
        name: "Case",
        children: [
          {
            kind: "folder",
            name: "Tutorial",
            children: [
              {
                kind: "file",
                name: "training_note.txt",
                fileType: "txt",
                content: { text: "TRAINING NOTE: link the note with the photo on the Case Board." },
                clueId: "tut_note_doc",
              },
              {
                kind: "file",
                name: "training_photo.svg",
                fileType: "img",
                content: { imageSrc: "/evidence/cctv-kiosk.svg" },
                clueId: "tut_photo_img",
              },
            ],
          },
        ],
      },
    ],
  },
  threads: [
    {
      id: "tut_thread",
      title: "Training Bot",
      participants: ["training.bot@terminal.example"],
      messages: [
        {
          id: "t1",
          from: "training.bot@terminal.example",
          time: "00:00",
          text: "Open Files, then open the tutorial note and photo. Link them on the Case Board.",
        },
      ],
    },
  ],
  tutorial: {
    enabled: true,
    steps: [
      {
        id: "s1",
        title: "Welcome",
        text: "Open apps from the desktop icons (or taskbar). Start with Files.",
        when: { type: "always" },
      },
      {
        id: "s2",
        title: "Collect Evidence",
        text: "In Files, open /Case/Tutorial/training_note.txt and training_photo.svg.",
        when: { type: "hasClue", clueId: "tut_welcome_site" },
      },
      {
        id: "s3",
        title: "Make the Link",
        text: "Open Case Board, select the two tutorial clues, then press LINK.",
        when: { type: "hasClue", clueId: "tut_photo_img" },
      },
      {
        id: "s4",
        title: "Progression",
        text: "Nice. Some scenarios unlock new pages when you connect evidence.",
        when: { type: "progressAtLeast", stage: 1 },
      },
    ],
  },
};


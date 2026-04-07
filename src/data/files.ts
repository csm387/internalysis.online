import type { FileNode } from "@/engine/scenarioTypes";

export const FILE_SYSTEM: FileNode = {
  kind: "folder",
  name: "root",
  children: [
    {
      kind: "folder",
      name: "Desktop",
      children: [
        {
          kind: "file",
          name: "READ_ME_FIRST.txt",
          fileType: "txt",
          content: {
            text: [
              "MISTERY OS — CASE TERMINAL (fictional)",
              "",
              "Use the Browser to explore cached sites.",
              "Use Messages for comms.",
              "Pin evidence on the Case Board and link related items.",
            ].join("\n"),
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
          name: "Pier9",
          children: [
            {
              kind: "file",
              name: "kiosk_still.png",
              fileType: "img",
              content: { imageSrc: "/evidence/cctv-kiosk.svg" },
              clueId: "image_cctv_2",
            },
            {
              kind: "file",
              name: "badge_invoice_scan.txt",
              fileType: "txt",
              content: {
                text: [
                  "Scan text appears degraded.",
                  "Look for 'K-17' and 'night pickup' notes.",
                ].join("\n"),
              },
              clueId: "doc_invoice_1",
            },
          ],
        },
      ],
    },
  ],
};


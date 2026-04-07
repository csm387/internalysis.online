import type { Clue } from "@/engine/types";

/**
 * All fictional evidence is defined here.
 * Unlock conditions are evaluated by the engine; UI only renders discovered clues.
 */
export const CLUES: Clue[] = [
  {
    id: "site_news_1",
    title: "Local News: Warehouse Fire (Archive Copy)",
    type: "website",
    content: {
      url: "os://browser/news",
      text: [
        "NORTH HARBOR — A late-night fire damaged a storage warehouse on Pier 9.",
        "Officials say the blaze started in an auxiliary office. No injuries reported.",
        "A bystander reported a 'flicker' of light near the security kiosk moments before alarms.",
        "",
        "A burnt ID badge was recovered. The name is partially legible: '...N DANE'.",
      ].join("\n"),
    },
    relatedClues: ["image_cctv_2", "doc_invoice_1"],
    unlockConditions: [{ type: "always" }],
  },
  {
    id: "msg_email_1",
    title: "Email Draft: 'Re: Replacement Tags'",
    type: "message",
    content: {
      text: [
        "From: purchasing@larkspur-logistics.example",
        "To: temp.badges@northharbor-bldg.example",
        "Subject: Re: Replacement Tags",
        "",
        "Need three replacements. Same serial range as last month.",
        "Use the 'night pickup' note again.",
        "",
        "-M",
      ].join("\n"),
    },
    relatedClues: ["doc_invoice_1"],
    unlockConditions: [{ type: "always" }],
  },
  {
    id: "image_cctv_2",
    title: "Security Still: Kiosk Camera (00:13)",
    type: "image",
    content: {
      imageSrc: "/evidence/cctv-kiosk.svg",
      text: [
        "Frame grab from Pier 9 kiosk camera.",
        "A figure in a work jacket pauses at the badge reader.",
        "A tiny sticker is visible: 'K-17'.",
      ].join("\n"),
    },
    relatedClues: ["site_news_1", "doc_invoice_1", "site_suspect_1"],
    unlockConditions: [{ type: "hasClue", clueId: "site_news_1" }],
  },
  {
    id: "doc_invoice_1",
    title: "Invoice Scan: Temp Badge Stock (K-17)",
    type: "document",
    content: {
      text: [
        "LARKSPUR LOGISTICS (Fictional)",
        "Invoice # LL-8841",
        "",
        "Item: Temporary Access Tags (K-17 batch)",
        "Qty: 3",
        "Delivery: NIGHT PICKUP (dock window 00:00–01:00)",
        "",
        "Note: 'Use last month's serial range.'",
      ].join("\n"),
    },
    relatedClues: ["msg_email_1", "image_cctv_2", "site_suspect_1"],
    unlockConditions: [{ type: "hasClue", clueId: "msg_email_1" }],
  },
  {
    id: "site_suspect_1",
    title: "Profile Page: 'N. Dane' (Internal Directory)",
    type: "website",
    content: {
      url: "os://browser/directory/n-dane",
      text: [
        "EMPLOYEE DIRECTORY (OFFLINE CACHE)",
        "",
        "Name: N. Dane",
        "Role: Night Receiving (Contract)",
        "Recent activity: 3 badge re-issues approved (K-17)",
        "",
        "Personal note: 'Keeps a small toolbox. Prefers to work alone.'",
      ].join("\n"),
    },
    relatedClues: ["image_cctv_2", "doc_invoice_1"],
    unlockConditions: [
      { type: "hasAll", clueIds: ["image_cctv_2", "doc_invoice_1"] },
      { type: "connected", a: "image_cctv_2", b: "doc_invoice_1" },
    ],
  },
];

export const STARTING_CLUE_IDS = ["site_news_1", "msg_email_1"];


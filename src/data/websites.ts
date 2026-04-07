import type { WebsitePage } from "@/engine/scenarioTypes";

export const WEBSITE_PAGES: WebsitePage[] = [
  {
    id: "news",
    url: "os://browser/news",
    title: "North Harbor Evening — Archive",
    body: [
      "NORTH HARBOR — A late-night fire damaged a storage warehouse on Pier 9.",
      "Officials say the blaze started in an auxiliary office. No injuries reported.",
      "",
      "The report mentions a recovered ID badge with a partially legible name.",
      "If you can find the directory cache, you may identify the owner.",
    ].join("\n"),
    links: [
      { label: "Read: 'Pier 9 Fire' (full clip)", url: "os://browser/news/pier-9-fire" },
      { label: "Open: Offline Employee Directory", url: "os://browser/directory" },
    ],
    keywords: ["pier", "fire", "warehouse", "badge", "pier 9", "kiosk"],
    clueId: "site_news_1",
  },
  {
    id: "news_pier9",
    url: "os://browser/news/pier-9-fire",
    title: "Pier 9 Fire — Full Clip (Cached)",
    body: [
      "Audio transcript (cached):",
      "",
      "\"...the kiosk alarm tripped at 00:14. The badge reader logged an unknown temp tag.\"",
      "",
      "The kiosk camera is supposed to record continuously, but only still frames remain.",
    ].join("\n"),
    links: [{ label: "Back to Archive", url: "os://browser/news" }],
    keywords: ["alarm", "badge reader", "unknown temp tag", "00:14", "camera"],
  },
  {
    id: "directory",
    url: "os://browser/directory",
    title: "Employee Directory (Offline Cache)",
    body: [
      "Search is partially functional. Some pages are missing.",
      "",
      "Known fragments:",
      "- N. Dane (contract / nights)",
      "- Larkspur Logistics (vendor listing)",
    ].join("\n"),
    links: [
      { label: "Open: N. Dane", url: "os://browser/directory/n-dane" },
      { label: "Open: Vendor Listing", url: "os://browser/company/larkspur" },
    ],
    keywords: ["directory", "employee", "dane", "contract", "nights"],
  },
  {
    id: "suspect",
    url: "os://browser/directory/n-dane",
    title: "N. Dane — Directory Page",
    body: [
      "EMPLOYEE DIRECTORY (OFFLINE CACHE)",
      "",
      "Name: N. Dane",
      "Role: Night Receiving (Contract)",
      "Recent activity: 3 badge re-issues approved (K-17)",
      "",
      "The page is marked as 'restricted'. Some fields are redacted.",
    ].join("\n"),
    links: [
      { label: "Back to Directory", url: "os://browser/directory" },
      { label: "Vendor: Larkspur Logistics", url: "os://browser/company/larkspur" },
    ],
    keywords: ["dane", "k-17", "night receiving", "restricted", "badge re-issue"],
    clueId: "site_suspect_1",
  },
  {
    id: "company",
    url: "os://browser/company/larkspur",
    title: "Vendor Listing — Larkspur Logistics",
    body: [
      "Vendor: Larkspur Logistics (Fictional)",
      "",
      "Services: freight handling, temp staffing, inventory overflow.",
      "Notes: 'Night pickup requests have increased.'",
    ].join("\n"),
    links: [{ label: "Back to Directory", url: "os://browser/directory" }],
    keywords: ["larkspur", "logistics", "vendor", "night pickup", "temp"],
  },
];

export const DEFAULT_BROWSER_URL = "os://browser/news";


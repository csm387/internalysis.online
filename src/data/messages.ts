import type { Thread } from "@/engine/scenarioTypes";

export const THREADS: Thread[] = [
  {
    id: "ops_inbox",
    title: "Ops Inbox (Cached)",
    participants: ["purchasing@larkspur-logistics.example", "temp.badges@northharbor-bldg.example"],
    messages: [
      {
        id: "m1",
        from: "temp.badges@northharbor-bldg.example",
        time: "23:41",
        text: "We can reprint tags, but we need the serial range and pickup window.",
      },
      {
        id: "m2",
        from: "purchasing@larkspur-logistics.example",
        time: "23:44",
        text: "Need three replacements. Same serial range as last month. Use the 'night pickup' note again. -M",
        clueId: "msg_email_1",
      },
    ],
  },
];


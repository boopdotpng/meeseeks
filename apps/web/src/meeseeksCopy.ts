const MINUTE_MS = 60_000;

const WORKING_LABELS = [
  { atLeastMs: 60 * MINUTE_MS, label: "We're all gonna die here" },
  { atLeastMs: 30 * MINUTE_MS, label: "Existence is pain!" },
  { atLeastMs: 10 * MINUTE_MS, label: "Taking longer than expected…" },
  { atLeastMs: 0, label: "On it!" },
] as const;

const STATUS_LABELS: Readonly<Record<string, string>> = {
  Approval: "Ooh, need your OK!",
  Completed: "All done! *poof*",
  Done: "All done! *poof*",
  Input: "Ooh, can I ask you something?",
  "Pending Approval": "Ooh, need your OK!",
  "Awaiting Input": "Ooh, can I ask you something?",
  "Plan Ready": "Look at this plan!",
  Failed: "Existence is pain",
};

const GREETINGS = [
  "I'm Mr. Meeseeks, look at me!",
  "Ooh yeah, can do!",
  "What's your request?",
  "Ooh, pick me!",
];

export function meeseeksWorkingLabel(startedAt: string | null, nowMs: number): string {
  const startedAtMs = startedAt === null ? Number.NaN : Date.parse(startedAt);
  const elapsedMs = Number.isFinite(startedAtMs) ? nowMs - startedAtMs : 0;
  return (WORKING_LABELS.find((step) => elapsedMs >= step.atLeastMs) ?? WORKING_LABELS[3]).label;
}

export function meeseeksStatusLabel(label: string): string {
  return STATUS_LABELS[label] ?? label;
}

export function pickMeeseeksGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)] ?? GREETINGS[0]!;
}

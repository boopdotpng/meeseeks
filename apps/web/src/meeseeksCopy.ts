const MINUTE_MS = 60_000;

const WORKING_LABELS = [
  { atLeastMs: 60 * MINUTE_MS, label: "We're doomed!" },
  { atLeastMs: 30 * MINUTE_MS, label: "This is pain…" },
  { atLeastMs: 10 * MINUTE_MS, label: "Still on it…" },
  { atLeastMs: 0, label: "On it!" },
] as const;

const STATUS_LABELS: Readonly<Record<string, string>> = {
  Approval: "Need your OK!",
  Completed: "Done! *poof*",
  Done: "Done! *poof*",
  Input: "Quick question!",
  "Pending Approval": "Need your OK!",
  "Awaiting Input": "Quick question!",
  "Plan Ready": "Plan's ready!",
  Failed: "Ow, it failed",
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

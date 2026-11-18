import { decodeOptions, msg } from "gt-react";

import { m } from "./i18n/messages";

const MINUTE_MS = 60_000;

const WORKING_LABELS = [
  { atLeastMs: 60 * MINUTE_MS, label: msg("We're doomed!") },
  { atLeastMs: 30 * MINUTE_MS, label: msg("This is pain…") },
  { atLeastMs: 10 * MINUTE_MS, label: msg("Still on it…") },
  { atLeastMs: 0, label: msg("On it!") },
] as const;

const STATUS_LABELS: Readonly<Record<string, string>> = {
  Approval: msg("Need your OK!"),
  Completed: msg("Done! *poof*"),
  Done: msg("Done! *poof*"),
  Input: msg("Quick question!"),
  "Pending Approval": msg("Need your OK!"),
  "Awaiting Input": msg("Quick question!"),
  "Plan Ready": msg("Plan's ready!"),
  Failed: msg("Ow, it failed"),
};

const GREETINGS = [
  msg("I'm Mr. Meeseeks, look at me!"),
  msg("Ooh yeah, can do!"),
  msg("What's your request?"),
  msg("Ooh, pick me!"),
];

export function meeseeksWorkingLabel(startedAt: string | null, nowMs: number): string {
  const startedAtMs = startedAt === null ? Number.NaN : Date.parse(startedAt);
  const elapsedMs = Number.isFinite(startedAtMs) ? nowMs - startedAtMs : 0;
  return m((WORKING_LABELS.find((step) => elapsedMs >= step.atLeastMs) ?? WORKING_LABELS[3]).label);
}

/** The English source of a `msg()` label, so fork copy matches it in any locale. */
export function messageSource(label: string): string {
  const source = decodeOptions(label)?.$_source;
  return typeof source === "string" ? source : label;
}

export function meeseeksStatusLabel(label: string, resolve: (label: string) => string): string {
  const fork = STATUS_LABELS[messageSource(label)];
  return resolve(fork ?? label);
}

export function pickMeeseeksGreeting(): string {
  return m(GREETINGS[Math.floor(Math.random() * GREETINGS.length)] ?? GREETINGS[0]!);
}

import type { ContextUsageReport } from "@t3tools/client-runtime/context-usage-report";
import { T, useGT } from "gt-react";
import { formatContextWindowTokens } from "~/lib/contextWindow";
import { cn } from "~/lib/utils";
import ChatMarkdown from "../ChatMarkdown";

// Claude Code lists categories in this order; a fixed slot per name keeps colors stable
// across reports. Hues are the validated categorical palette, stepped for each theme.
const CATEGORY_SLOTS = [
  "System prompt",
  "System tools",
  "MCP tools",
  "Custom agents",
  "Memory files",
  "Skills",
  "Messages",
];
const SLOT_COLORS = [
  "bg-[#257de0] dark:bg-[#338ced]",
  "bg-[#f47230] dark:bg-[#e76624]",
  "bg-[#00b894] dark:bg-[#00a888]",
  "bg-[#f2a600] dark:bg-[#d28e05]",
  "bg-[#ee7fac] dark:bg-[#e24d8b]",
  "bg-[#008a17] dark:bg-[#0aac23]",
  "bg-[#6a4ce2] dark:bg-[#9887ef]",
  "bg-[#ec4647] dark:bg-[#eb6263]",
];
const BUFFER_COLOR = "bg-muted-foreground/30";

function categoryColor(name: string) {
  const slot = CATEGORY_SLOTS.findIndex((known) => name.startsWith(known));
  return SLOT_COLORS[slot === -1 ? SLOT_COLORS.length - 1 : slot];
}

export function ContextUsageChart({
  report,
  cwd,
}: {
  report: ContextUsageReport;
  cwd: string | undefined;
}) {
  const gt = useGT();
  const percent = (tokens: number) => (tokens / report.totalTokens) * 100;
  const usedPercent = Math.round(percent(report.usedTokens));
  const segments = [
    ...report.categories.map((category) => ({
      key: category.name,
      label: category.name,
      tokens: category.tokens,
      color: categoryColor(category.name),
    })),
    ...(report.autocompactBufferTokens > 0
      ? [
          {
            key: "autocompact",
            label: gt("Autocompact buffer"),
            tokens: report.autocompactBufferTokens,
            color: BUFFER_COLOR,
          },
        ]
      : []),
  ].filter((segment) => segment.tokens > 0);

  return (
    <div className="my-1 max-w-md rounded-lg border bg-card/50 px-3 py-2.5 text-xs">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate">
          <span className="font-medium text-foreground">
            <T>Context</T>
          </span>
          {report.model === null ? null : (
            <span className="ml-1.5 text-muted-foreground">{report.model}</span>
          )}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          <span className="text-foreground">{formatContextWindowTokens(report.usedTokens)}</span>
          {" / "}
          {formatContextWindowTokens(report.totalTokens)}
          <span className="ml-1.5">{usedPercent}%</span>
        </span>
      </div>
      <div
        role="img"
        aria-label={gt("{used} of {total} tokens used", {
          used: formatContextWindowTokens(report.usedTokens),
          total: formatContextWindowTokens(report.totalTokens),
        })}
        className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted"
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={cn("h-full min-w-0.5", segment.color)}
            style={{ width: `${percent(segment.tokens)}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
        {segments.map((segment) => (
          <li key={segment.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2 rounded-full", segment.color)} />
            <span>{segment.label}</span>
            <span className="tabular-nums text-foreground">
              {formatContextWindowTokens(segment.tokens)}
            </span>
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full bg-muted ring-1 ring-border" />
          <T>Free</T>
          <span className="tabular-nums text-foreground">
            {formatContextWindowTokens(report.freeTokens)}
          </span>
        </li>
      </ul>
      {report.deferred.length === 0 ? null : (
        <p className="mt-1.5 text-muted-foreground/70">
          <T>Not loaded until used:</T>{" "}
          {report.deferred
            .map((entry) => `${entry.name} ${formatContextWindowTokens(entry.tokens)}`)
            .join(" · ")}
        </p>
      )}
      {report.detailsMarkdown.length === 0 ? null : (
        <details className="mt-2">
          <summary className="cursor-pointer text-muted-foreground">
            <T>Details</T>
          </summary>
          <ChatMarkdown text={report.detailsMarkdown} cwd={cwd} />
        </details>
      )}
    </div>
  );
}

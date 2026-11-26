export interface ContextUsageCategory {
  readonly name: string;
  readonly tokens: number;
}

export interface ContextUsageReport {
  readonly model: string | null;
  readonly usedTokens: number;
  readonly totalTokens: number;
  /** Categories that occupy the window, in Claude Code's order; excludes free space. */
  readonly categories: ReadonlyArray<ContextUsageCategory>;
  readonly freeTokens: number;
  readonly autocompactBufferTokens: number;
  /** The per-item tables (MCP tools, memory files, skills, …) after the category table. */
  readonly detailsMarkdown: string;
}

const HEADING = /^\s*## Context Usage\s*$/m;
const TOKENS_LINE = /^\*\*Tokens:\*\*\s*([\d.,]+[km]?)\s*\/\s*([\d.,]+[km]?)/im;
const MODEL_LINE = /^\*\*Model:\*\*\s*(.+)$/im;
const ROW = /^\|\s*([^|]+?)\s*\|\s*([\d.,]+[km]?)\s*\|\s*[\d.]+%\s*\|\s*$/i;

function parseTokenCount(value: string): number | null {
  const match = /^([\d.,]+)([km]?)$/i.exec(value.trim());
  if (match === null) return null;
  const base = Number(match[1]!.replaceAll(",", ""));
  if (!Number.isFinite(base)) return null;
  const unit = match[2]!.toLowerCase();
  return Math.round(base * (unit === "m" ? 1_000_000 : unit === "k" ? 1_000 : 1));
}

/** Parses the markdown Claude Code's `/context` command returns through the Agent SDK. */
export function parseContextUsageReport(markdown: string): ContextUsageReport | null {
  if (!HEADING.test(markdown)) return null;
  const tokens = TOKENS_LINE.exec(markdown);
  if (tokens === null) return null;
  const usedTokens = parseTokenCount(tokens[1]!);
  const totalTokens = parseTokenCount(tokens[2]!);
  if (usedTokens === null || totalTokens === null || totalTokens <= 0) return null;

  const lines = markdown.split("\n");
  const tableStart = lines.findIndex((line) => /^###\s+Estimated usage by category/i.test(line));
  const categories: ContextUsageCategory[] = [];
  let freeTokens = 0;
  let autocompactBufferTokens = 0;
  let detailsStart = lines.length;
  if (tableStart !== -1) {
    for (let index = tableStart + 1; index < lines.length; index++) {
      const line = lines[index]!;
      if (/^###\s/.test(line)) {
        detailsStart = index;
        break;
      }
      const row = ROW.exec(line);
      if (row === null) continue;
      const count = parseTokenCount(row[2]!);
      if (count === null) continue;
      const name = row[1]!;
      if (name === "Free space") freeTokens = count;
      else if (name === "Autocompact buffer") autocompactBufferTokens = count;
      else categories.push({ name, tokens: count });
    }
  }

  return {
    model: MODEL_LINE.exec(markdown)?.[1]?.trim() ?? null,
    usedTokens,
    totalTokens,
    categories,
    freeTokens,
    autocompactBufferTokens,
    detailsMarkdown: lines.slice(detailsStart).join("\n").trim(),
  };
}

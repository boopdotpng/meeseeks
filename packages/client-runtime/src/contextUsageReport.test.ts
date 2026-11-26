import { describe, expect, it } from "vite-plus/test";

import { parseContextUsageReport } from "./contextUsageReport.ts";

const REPORT = `## Context Usage

**Model:** claude-opus-5-5
**Tokens:** 41.2k / 1m (4%)

### Estimated usage by category
| Category | Tokens | Percentage |
|----------|--------|------------|
| System prompt | 2k | 0.2% |
| System tools | 5.8k | 0.6% |
| MCP tools | 1,250 | 0.1% |
| Messages | 32.2k | 3.2% |
| Free space | 925.8k | 92.6% |
| Autocompact buffer | 33k | 3.3% |

### Skills
| Skill | Source | Tokens |
|-------|--------|--------|
| dataviz | Plugin | 400 |
`;

describe("parseContextUsageReport", () => {
  it("reads totals, categories and the trailing detail tables", () => {
    expect(parseContextUsageReport(REPORT)).toEqual({
      model: "claude-opus-5-5",
      usedTokens: 41_200,
      totalTokens: 1_000_000,
      categories: [
        { name: "System prompt", tokens: 2_000 },
        { name: "System tools", tokens: 5_800 },
        { name: "MCP tools", tokens: 1_250 },
        { name: "Messages", tokens: 32_200 },
      ],
      freeTokens: 925_800,
      autocompactBufferTokens: 33_000,
      detailsMarkdown:
        "### Skills\n| Skill | Source | Tokens |\n|-------|--------|--------|\n| dataviz | Plugin | 400 |",
    });
  });

  it("ignores ordinary replies", () => {
    expect(parseContextUsageReport("## Context\nSome prose about context usage.")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import type { MhWildsBreakData, MhWildsPartData } from "../types";
import {
  displayableBreakRecords,
  isBreakRewardKind,
  partBreakCount,
  reportBreakActions,
  reportBreakSummary,
} from "./break-info";

function part(breaks: Array<Partial<MhWildsBreakData>>): MhWildsPartData {
  return {
    index: 0,
    id: "part-0",
    type: 1,
    typeInfo: {
      index: 0,
      iconType: 0,
      nameGuid: "name-0",
      name: { en: "Head" },
    },
    breaks: breaks.map((item, index) => ({
      id: `break-${index}`,
      ...item,
    })),
    breakRewards: [],
  };
}

describe("MH Wilds break information", () => {
  it("counts finite break records instead of each record's max count", () => {
    const head = part([
      { executeCount: 1, maxCount: 1 },
      { executeCount: 2, maxCount: 2 },
      { executeCount: 1, maxCount: 255, condition: 1 },
      { executeCount: 1, maxCount: 9999 },
    ]);

    expect(displayableBreakRecords(head).map((item) => item.id)).toEqual([
      "break-0",
      "break-1",
    ]);
    expect(partBreakCount(head)).toBe(2);
  });

  it("labels grouped report slots as parts", () => {
    expect(reportBreakSummary("Rompible x2", undefined)).toEqual({
      actions: ["breakable"],
      count: 2,
      countKind: "parts",
    });
  });

  it("uses detailed break records when a report slot maps to one part", () => {
    const head = part([
      { executeCount: 1, maxCount: 1 },
      { executeCount: 1, maxCount: 1 },
    ]);

    expect(reportBreakSummary("Rompible x2/punto débil", head)).toEqual({
      actions: ["breakable", "weakPoint"],
      count: 2,
      countKind: "breaks",
    });
  });

  it("recognizes Spanish, English, and API break reward kinds", () => {
    expect(reportBreakActions("Cercenable x2")).toEqual(["severable"]);
    expect(reportBreakActions("Breakable x2/Weak Point")).toEqual([
      "breakable",
      "weakPoint",
    ]);
    expect(isBreakRewardKind("broken-part")).toBe(true);
    expect(isBreakRewardKind("broken_part")).toBe(true);
    expect(isBreakRewardKind("carve")).toBe(false);
  });
});

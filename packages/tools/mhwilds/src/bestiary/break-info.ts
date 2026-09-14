import type { MhWildsBreakData, MhWildsPartData } from "../types";

/**
 * Some game records describe conditional/unbounded state transitions rather
 * than a player-facing break stage. They use these sentinel values instead of
 * a normal finite break count.
 */
const NON_DISPLAYABLE_COUNTS = new Set([255]);

export type MhBreakAction = "breakable" | "severable" | "weakPoint";

export type MhReportBreakSummary = {
  actions: MhBreakAction[];
  count: number | null;
  countKind: "parts" | "breaks" | null;
};

export function isDisplayableBreakRecord(
  breakData: MhWildsBreakData,
): boolean {
  const value = breakData.maxCount ?? breakData.executeCount;
  if (value == null || value < 1 || value >= 9999) return false;
  return !NON_DISPLAYABLE_COUNTS.has(value);
}

export function displayableBreakRecords(
  part: MhWildsPartData,
): MhWildsBreakData[] {
  return part.breaks.filter(isDisplayableBreakRecord);
}

/** Count actual finite break records, not the per-record MaxCount field. */
export function partBreakCount(part: MhWildsPartData): number {
  return displayableBreakRecords(part).length;
}

export function reportBreakCount(label: string | null | undefined): number | null {
  const match = label?.match(/(?:x|×)\s*(\d+)/i);
  if (!match) return null;
  const count = Number(match[1]);
  return Number.isInteger(count) && count > 0 ? count : null;
}

function normalizedLabel(label: string): string {
  return label
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function reportBreakActions(
  label: string | null | undefined,
): MhBreakAction[] {
  if (!label) return [];
  const normalized = normalizedLabel(label);
  const actions: MhBreakAction[] = [];
  if (normalized.includes("rompible") || normalized.includes("breakable"))
    actions.push("breakable");
  if (normalized.includes("cercenable") || normalized.includes("severable"))
    actions.push("severable");
  if (normalized.includes("punto debil") || normalized.includes("weak point"))
    actions.push("weakPoint");
  return actions;
}

/**
 * The anatomy report can describe a group (for example two wings) while the
 * detailed part data contains separate physical parts. If the report maps to
 * one physical part, its break records are the precise count; otherwise the
 * report's xN suffix is presented as a number of parts.
 */
export function reportBreakSummary(
  label: string | null | undefined,
  part: MhWildsPartData | undefined,
): MhReportBreakSummary {
  const directCount = part ? partBreakCount(part) : 0;
  if (part && directCount > 0) {
    return {
      actions: reportBreakActions(label),
      count: directCount,
      countKind: "breaks",
    };
  }

  const groupedCount = reportBreakCount(label);
  return {
    actions: reportBreakActions(label),
    count: groupedCount,
    countKind: groupedCount == null ? null : "parts",
  };
}

export function isBreakRewardKind(kind: string | null | undefined): boolean {
  const normalized = kind?.trim().toLocaleLowerCase().replaceAll("_", "-");
  return (
    normalized === "break" ||
    normalized === "broken" ||
    normalized === "broken-part" ||
    normalized === "broken-fragment"
  );
}

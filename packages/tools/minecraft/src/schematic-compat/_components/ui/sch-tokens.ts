import type { SchRing } from "../../../ui";

// Shapes and tone tokens shared by the conversion-specific panels (setup, diff,
// export). The generic pieces they compose with live in the shared schematic kit.

export type SchStatus = "safe" | "renamed" | "state-changed" | "missing" | "mod-only";
export type SchGame = "minecraft" | "hytale";
export type BulkAction = "skip" | "remap" | "air";
/** How an environment is sourced: scan a game folder, or use bundled vanilla. */
export type SchEnvMode = "instance" | "vanilla";

export interface SchBlock {
  id: string;
  namespace: string;
  states?: Record<string, string>;
}
export interface SchDiffEntry {
  block: SchBlock;
  status: SchStatus;
  instanceCount: number;
  autoCandidate?: string;
  incompatibleStates?: string[];
}
export interface SchRegistry {
  name?: string | null;
  version: string;
  loader?: string;
  mods: number;
  blocks: number;
  /** Built from a bundled vanilla registry rather than a scanned folder. */
  bundled?: boolean;
}
export interface BulkNsGroup {
  namespace: string;
  entries: unknown[];
  remap: number;
}
export interface FilterChip {
  key: SchStatus;
  label: string;
  count: number;
}

export type Tone = "ok" | "warn" | "bad" | "accent" | "dim";

export const TONE: Record<Tone, { fg: string; soft: string; bd: string; dot: string; cssVar: string }> = {
  ok: { fg: "text-ok", soft: "bg-ok-soft", bd: "border-ok", dot: "bg-ok", cssVar: "var(--ok)" },
  warn: { fg: "text-warn", soft: "bg-warn-soft", bd: "border-warn", dot: "bg-warn", cssVar: "var(--warn)" },
  bad: { fg: "text-bad", soft: "bg-bad-soft", bd: "border-bad", dot: "bg-bad", cssVar: "var(--bad)" },
  accent: { fg: "text-accent-bright", soft: "bg-accent-soft", bd: "border-accent-line", dot: "bg-accent", cssVar: "var(--accent)" },
  dim: { fg: "text-txt-dim", soft: "bg-panel-2", bd: "border-line-2", dot: "bg-txt-dim", cssVar: "var(--dim)" },
};

export const STATUS_META: Record<SchStatus, { ring: SchRing; tone: Tone }> = {
  safe: { ring: "safe", tone: "ok" },
  renamed: { ring: "warn", tone: "warn" },
  "state-changed": { ring: "warn", tone: "warn" },
  missing: { ring: "bad", tone: "bad" },
  // Mod-only shares the "missing" red treatment; a "mod" pill distinguishes it.
  "mod-only": { ring: "bad", tone: "bad" },
};

export const POP_SHADOW = "shadow-[0_20px_46px_-18px_var(--shadow-color)]";

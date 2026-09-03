"use client";

/**
 * Domain labels for the teambuilder, resolved from the catalog.
 *
 * Stats, types, natures, genders and move categories are DATA the dex hands
 * back in English; the words a player reads for them live in the catalog under
 * `tb.*`, and these helpers are the only place the two meet. A component never
 * spells a stat or a nature in JSX — it asks here, and an unknown value comes
 * back verbatim rather than as a missing-message key.
 */

import { useMemo } from "react";
import { Dex } from "@pkmn/dex";

import { useToolT, BATTLESIM_NS } from "../i18n";

export const TB_NS = `${BATTLESIM_NS}.tb`;

export const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type StatId = (typeof STAT_IDS)[number];

/** The eighteen attacking types in Pokédex order — a LIST, for chips and tables. */
export const TYPE_LIST = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
] as const;

const KNOWN_TYPES = new Set<string>([...TYPE_LIST, "Stellar"]);
const KNOWN_CATS = new Set(["Physical", "Special", "Status"]);

/** Showdown's id: lower-case alphanumerics only. */
export const toId = (s: string | undefined | null) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export interface TbLabels {
  stat(id: string): string;
  statShort(id: string): string;
  type(name: string): string;
  cat(name: string): string;
  gender(g: string | undefined): string;
  /** `Firme (+Atq −AtE)` — the nature with the stats it moves. */
  nature(name: string): string;
}

export function useTbLabels(): TbLabels {
  const t = useToolT(TB_NS);
  return useMemo<TbLabels>(() => {
    const statShort = (id: string) => ((STAT_IDS as readonly string[]).includes(id) ? t(`statsShort.${id}`) : id);
    return {
      stat: (id) => ((STAT_IDS as readonly string[]).includes(id) ? t(`stats.${id}`) : id),
      statShort,
      type: (name) => (KNOWN_TYPES.has(name) ? t(`types.${name}`) : name),
      cat: (name) => (KNOWN_CATS.has(name) ? t(`cat.${name}`) : name),
      gender: (g) => (g === "M" ? t("set.genderM") : g === "F" ? t("set.genderF") : t("set.genderAny")),
      nature: (name) => {
        const n = Dex.natures.get(name);
        if (!n.exists) return name;
        const base = t(`natures.${n.id}`);
        if (!n.plus || !n.minus) return base;
        return `${base} (+${statShort(n.plus)} −${statShort(n.minus)})`;
      },
    };
  }, [t]);
}

/**
 * Normalise what a stored set carries so the controls can show it.
 *
 * Imports and older saves hold `nature: "adamant"`, `teraType: "fire"` or
 * `gender: "m"`; the dex's canonical spelling is what every option list uses,
 * and a value in the wrong case rendered as a blank select on a fresh set.
 */
export function canonicalNature(raw: string | undefined): string {
  if (!raw) return "Serious";
  const n = Dex.natures.get(raw);
  return n.exists ? n.name : raw;
}

export function canonicalType(raw: string | undefined): string {
  if (!raw) return "";
  const ty = Dex.types.get(raw);
  return ty.exists ? ty.name : raw;
}

export function canonicalGender(raw: string | undefined): "" | "M" | "F" {
  const g = (raw ?? "").toUpperCase();
  return g === "M" || g === "F" ? g : "";
}

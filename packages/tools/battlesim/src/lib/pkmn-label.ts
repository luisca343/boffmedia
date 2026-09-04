"use client";

/**
 * One place that turns whatever the engine happens to be holding — an id, a
 * display name, a `item:` condition — into the string a player reads.
 *
 * The tool stores these three things inconsistently and always has: `BSXMon`
 * carries `item` as an ID and `ability` as a NAME, `BSXKeyMove` carries both,
 * and the log hands over whatever the English sentence contained. Every screen
 * that wanted a label therefore wrote its own `Dex.items.get(x)?.name ?? x`,
 * and adding a second language to five copies of that line is how four of them
 * end up translated and the fifth does not.
 *
 * So the `Dex` round-trip and the translation happen together, here: the id or
 * name goes to the dex to get the canonical ENGLISH name, and that name is the
 * key the Spanish table is looked up by (see `@boffmedia/pkmn-names` — English
 * is the key everywhere, and translation happens only on the way out).
 */

import { Dex } from "@pkmn/dex";
import { usePkmnNames, type PkmnNameTable } from "@boffmedia/pkmn-names";
import { useMemo } from "react";

export interface PkmnLabels {
  /** Localised move name, from an id or an English name. */
  move(value: string | null | undefined): string;
  ability(value: string | null | undefined): string;
  item(value: string | null | undefined): string;
  /** The table itself, for a caller that already holds English names. */
  names: PkmnNameTable;
}

function labelsFor(names: PkmnNameTable): PkmnLabels {
  const of = (kind: "move" | "ability" | "item", value: string | null | undefined) => {
    if (!value) return "";
    const dex = kind === "move" ? Dex.moves.get(value) : kind === "ability" ? Dex.abilities.get(value) : Dex.items.get(value);
    const english = dex?.exists ? dex.name : value;
    return names[kind](english);
  };
  return {
    move: (value) => of("move", value),
    ability: (value) => of("ability", value),
    item: (value) => of("item", value),
    names,
  };
}

export function usePkmnLabels(): PkmnLabels {
  const names = usePkmnNames();
  return useMemo(() => labelsFor(names), [names]);
}

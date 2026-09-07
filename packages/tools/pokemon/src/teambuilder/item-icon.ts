import { Dex } from "@pkmn/dex";
import { Icons } from "@pkmn/img";
import type { CSSProperties } from "react";

/**
 * Showdown's canonical item icon lookup.
 *
 * Keep this in the Pokémon package so the teambuilder and VGC meta never
 * derive different image URLs for the same item name.
 */
export function itemIconStyle(name: string | undefined): CSSProperties | null {
  if (!name) return null;
  const item = Dex.items.get(name);
  if (!item.exists) return null;
  try {
    const icon = Icons.getItem(item.name);
    return icon?.css ? (icon.css as CSSProperties) : null;
  } catch {
    return null;
  }
}

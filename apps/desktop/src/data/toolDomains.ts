import type { ToolDomain } from "@boffmedia/tool-kit"

/**
 * How a tool domain presents itself in the Tools section: its hue, its seal and
 * where its name and tagline live in the message store.
 *
 * The hue numbers are the SAME ones apps/web's hub uses (`@/data/hub`) — a
 * player who knows Monster Hunter as the green section on the site meets the
 * same green here. They are duplicated rather than shared because the two hosts
 * key them differently: the site groups by hub slug (`otros`), the launcher by
 * the registry's `ToolDomain` (`misc`), and collapsing those two vocabularies
 * into one table would tie the launcher's listing to the site's URL structure.
 */
export interface ToolDomainMeta {
  hue: number
  /** Letter seal drawn when the domain has no art. */
  logoLabel: string
  nameKey: string
  taglineKey: string
}

export const TOOL_DOMAIN_META: Record<ToolDomain, ToolDomainMeta> = {
  mhwilds: { hue: 130, logoLabel: "MH", nameKey: "tools.domains.mhwilds.name", taglineKey: "tools.domains.mhwilds.tagline" },
  minecraft: { hue: 145, logoLabel: "M", nameKey: "tools.domains.minecraft.name", taglineKey: "tools.domains.minecraft.tagline" },
  pokemon: { hue: 28, logoLabel: "P", nameKey: "tools.domains.pokemon.name", taglineKey: "tools.domains.pokemon.tagline" },
  misc: { hue: 200, logoLabel: "+", nameKey: "tools.domains.misc.name", taglineKey: "tools.domains.misc.tagline" },
}

/** Section order. Domains absent from the registry are skipped, so this is a
 *  preference, not a promise that all four appear. */
export const TOOL_DOMAIN_ORDER: ToolDomain[] = ["mhwilds", "minecraft", "pokemon", "misc"]

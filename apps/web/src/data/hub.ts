/** v3 tools-hub presentation config — one entry per game in the hub. */
export interface HubEntry {
  /** Short display code (brand-style, not translated). */
  short: string
  /** i18n key for the one-line tagline shown on hub cards. */
  taglineKey: string
  /** Base hue (deg) for the game's accent color. */
  hue: number
  /** Letter shown in the GameLogo seal when no icon image loads. */
  logoLabel: string
  /** i18n namespace holding this game's tool strings (`<ns>.<toolKey>.title|description|features`). */
  toolNs: string
  /** i18n namespace for external-link titles (`<ns>.<linkKey>`). */
  extNs: string
  /** i18n namespace for the banner (`<ns>.title.prefix|highlight`, `<ns>.subtitle`); omit to build the banner from the game name + tagline. */
  headerNs?: string
}

export const hubConfig: Record<string, HubEntry> = {
  pokemon: {
    short: "PKMN",
    taglineKey: "toolsUi.taglines.pokemon",
    hue: 28,
    logoLabel: "P",
    toolNs: "pokemon.tools",
    extNs: "pokemon.externalLinks",
    headerNs: "pokemon.header",
  },
  mhwilds: {
    short: "MHW",
    taglineKey: "toolsUi.taglines.mhwilds",
    hue: 130,
    logoLabel: "M",
    toolNs: "tools.mhwilds.tools",
    extNs: "tools.mhwilds.externalLinks",
    headerNs: "tools.mhwilds.header",
  },
  otros: {
    short: "MISC",
    taglineKey: "toolsUi.taglines.otros",
    hue: 200,
    logoLabel: "O",
    toolNs: "otros.tools",
    extNs: "otros.externalLinks",
    headerNs: "otros.header",
  },
  minecraft: {
    short: "MC",
    taglineKey: "toolsUi.taglines.minecraft",
    hue: 145,
    logoLabel: "M",
    // Tool strings are owned by @boffmedia/tools-minecraft under `tools.<toolKey>.*`
    // and merged in by both hosts; only the game name + category labels stay in the
    // web catalog under `games.minecraft.*`.
    toolNs: "tools",
    extNs: "games.minecraft.externalLinks",
  },
}

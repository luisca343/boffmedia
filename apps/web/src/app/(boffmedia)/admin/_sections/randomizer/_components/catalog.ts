/**
 * Data-driven catalog of the FVX randomizer settings editor.
 *
 * One source of truth that drives the whole redesigned editor: the category rail,
 * per-category change counts, the live summary drawer, cross-category search, the
 * gating (enable/disable) of every control with a plain-English reason, and the
 * flat control-row rendering. Field names, enum values and gate conditions are
 * transcribed verbatim from the per-tab source + the zod `RandomizerSettings`
 * schema (`packages/pack-schema`) + `default-settings.ts`.
 *
 * The values themselves stay in the react-hook-form form — this module never
 * stores form state, only the metadata + gate predicates the UI reads.
 */

import type { IconName } from "@boffmedia/ui"
import type { RandomizerSettings } from "@boffmedia/pack-schema"

export type RzField = keyof RandomizerSettings

/* -------------------------------------------------------------------------- */
/* Gate predicates — an enable condition evaluated against current form values */
/* -------------------------------------------------------------------------- */

export type RzGate =
  | { k: "bool"; f: RzField } // enabled when values[f] is truthy
  | { k: "notUnchanged"; f: RzField } // enabled when values[f] !== "UNCHANGED"
  | { k: "in"; f: RzField; v: string[] } // enabled when values[f] ∈ v
  | { k: "eq"; f: RzField; v: string } // enabled when values[f] === v
  | { k: "and"; g: RzGate[] } // enabled when every sub-gate passes

type Values = Record<string, unknown>

/** The single gate whose failure is the reason a control is disabled (for text). */
export function firstFailingGate(gate: RzGate, values: Values): RzGate | null {
  switch (gate.k) {
    case "and": {
      for (const g of gate.g) {
        const f = firstFailingGate(g, values)
        if (f) return f
      }
      return null
    }
    default:
      return gatePasses(gate, values) ? null : gate
  }
}

export function gatePasses(gate: RzGate, values: Values): boolean {
  switch (gate.k) {
    case "bool":
      return Boolean(values[gate.f])
    case "notUnchanged":
      return values[gate.f] !== "UNCHANGED"
    case "in":
      return gate.v.includes(String(values[gate.f]))
    case "eq":
      return values[gate.f] === gate.v
    case "and":
      return gate.g.every((g) => gatePasses(g, values))
  }
}

/** The field a failing gate points at, for the "Requires …" reason line. */
export function gateParentField(gate: RzGate): RzField | null {
  return gate.k === "and" ? gateParentField(gate.g[0]) : gate.f
}

/** All fields a gate depends on (to scope a `useWatch`). */
export function gateFields(gate?: RzGate): RzField[] {
  if (!gate) return []
  if (gate.k === "and") return gate.g.flatMap(gateFields)
  return [gate.f]
}

/* -------------------------------------------------------------------------- */
/* Control + panel + category shape                                           */
/* -------------------------------------------------------------------------- */

export type RzControlKind =
  | "toggle"
  | "radio"
  | "select"
  | "slider"
  | "gated"
  | "singleType"
  | "battleStyle"
  | "customStarter"
  | "miscBitmask"

export interface RzOption {
  value: string
  labelKey: string
}

export interface RzControl {
  /** Real RandomizerSettings field this binds to (nested for battle style). */
  field: RzField
  kind: RzControlKind
  /** i18n key for the control's display label (used in rail search + summary). */
  labelKey: string
  tipKey?: string
  /** radio / select options, for rendering + summary value resolution. */
  options?: RzOption[]
  min?: number
  max?: number
  unit?: string
  /** value written when a gated toggle is switched on (off = 0). */
  onValue?: number
  /** enable condition; when absent the control is always enabled. */
  gate?: RzGate
  /** render condition; when absent the control always renders. */
  show?: RzGate
}

export interface RzPanel {
  titleKey: string
  controls: RzControl[]
}

export interface RzCategory {
  id: string
  icon: IconName
  /** short rail label */
  labelKey: string
  /** one-line blurb under the category header (hidden in compact density) */
  blurbKey: string
  panels: RzPanel[]
}

/* -------------------------------------------------------------------------- */
/* Misc tweaks — bit-packed into the single int field `currentMiscTweaks`.     */
/* Masks are authoritative from FVX's MiscTweak (see tabs/misc.tsx).           */
/* -------------------------------------------------------------------------- */

export const MISC_BITS: { mask: number; key: string }[] = [
  { mask: 1, key: "miscBWExpPatch" },
  { mask: 2, key: "miscNerfXAccuracy" },
  { mask: 4, key: "miscFixCritRate" },
  { mask: 8, key: "miscFastestText" },
  { mask: 16, key: "miscRunningShoesIndoors" },
  { mask: 32, key: "miscRandomizePCPotion" },
  { mask: 64, key: "miscAllowPikachuEvolution" },
  { mask: 128, key: "miscGiveNationalDexAt" },
  { mask: 512, key: "miscForceChallengeMode" },
  { mask: 1024, key: "miscLowerCasePokemonNames" },
  { mask: 2048, key: "miscRandomizeCatchingTutorial" },
  { mask: 4096, key: "miscBanLuckyEgg" },
  { mask: 8192, key: "miscNoFreeLuckyEgg" },
  { mask: 16384, key: "miscBanBigMoneyManiac" },
  { mask: 32768, key: "miscSOSBattles" },
  { mask: 65536, key: "miscBalanceStaticLevels" },
  { mask: 131072, key: "miscRetainAltFormes" },
  { mask: 262144, key: "miscRunWithoutRunningShoes" },
  { mask: 524288, key: "miscFasterHPAndEXPBars" },
  { mask: 1048576, key: "miscFastDistortionWorld" },
  { mask: 2097152, key: "miscUpdateRotomFormeTyping" },
  { mask: 4194304, key: "miscDisableLowHPMusic" },
]

/* -------------------------------------------------------------------------- */
/* Control constructors — keep the data below terse + consistent              */
/* -------------------------------------------------------------------------- */

const bool = (f: RzField): RzGate => ({ k: "bool", f })
const nu = (f: RzField): RzGate => ({ k: "notUnchanged", f })
const inn = (f: RzField, ...v: string[]): RzGate => ({ k: "in", f, v })
const eq = (f: RzField, v: string): RzGate => ({ k: "eq", f, v })
const and = (...g: RzGate[]): RzGate => ({ k: "and", g })
const isRandom = (f: RzField): RzGate => eq(f, "RANDOM")

/** Starters are "random" for one of the three random modes. */
const RANDOM_STARTERS = inn(
  "startersMod",
  "COMPLETELY_RANDOM",
  "RANDOM_WITH_TWO_EVOLUTIONS",
  "RANDOM_BASIC",
)

function tog(field: RzField, gate?: RzGate): RzControl {
  return {
    field,
    kind: "toggle",
    labelKey: `opt.${field}.label`,
    tipKey: `opt.${field}.tip`,
    gate,
  }
}

function radio(field: RzField, titleKey: string, values: string[], gate?: RzGate): RzControl {
  return {
    field,
    kind: "radio",
    labelKey: titleKey,
    options: values.map((v) => ({ value: v, labelKey: `opt.${field}.${v}` })),
    gate,
  }
}

function sel(field: RzField, options: RzOption[], gate?: RzGate, show?: RzGate): RzControl {
  return {
    field,
    kind: "select",
    labelKey: `opt.${field}.label`,
    tipKey: `opt.${field}.tip`,
    options,
    gate,
    show,
  }
}

function slider(
  field: RzField,
  min: number,
  max: number,
  unit: string | undefined,
  gate?: RzGate,
): RzControl {
  return {
    field,
    kind: "slider",
    labelKey: `opt.${field}.label`,
    tipKey: `opt.${field}.tip`,
    min,
    max,
    unit,
    gate,
  }
}

function gated(field: RzField, min: number, max: number, onValue: number, gate?: RzGate): RzControl {
  return {
    field,
    kind: "gated",
    labelKey: `opt.${field}.label`,
    tipKey: `opt.${field}.tip`,
    min,
    max,
    onValue,
    gate,
  }
}

const GENERATIONS: RzOption[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
  value: String(n),
  labelKey: `opt.generations.gen${n}`,
}))

/* -------------------------------------------------------------------------- */
/* THE CATALOG                                                                */
/* -------------------------------------------------------------------------- */

export const CATEGORIES: RzCategory[] = [
  /* ---------------- GENERAL ---------------- */
  {
    id: "general",
    icon: "sliders",
    labelKey: "rail.general",
    blurbKey: "rail.blurb.general",
    panels: [
      {
        titleKey: "chrome.generalOptions",
        controls: [
          tog("limitPokemon"),
          tog("banIrregularAltFormes"),
          tog("banPrematureEvos"),
          tog("randomizeIntroMon"),
          tog("raceMode"),
        ],
      },
    ],
  },

  /* ---------------- TRAITS ---------------- */
  {
    id: "traits",
    icon: "paw",
    labelKey: "tabs.traits",
    blurbKey: "rail.blurb.traits",
    panels: [
      {
        titleKey: "panels.baseStatistics",
        controls: [
          radio("baseStatisticsMod", "panels.baseStatisticsMode", ["UNCHANGED", "SHUFFLE", "RANDOM"]),
          radio(
            "bstMod",
            "panels.bstMode",
            ["UNCHANGED", "RANDOM_BUFF_NERF", "SHUFFLE", "RANDOM"],
            nu("baseStatisticsMod"),
          ),
          tog("baseStatsFollowEvolutions", nu("baseStatisticsMod")),
          tog("baseStatsFollowMegaEvolutions", nu("baseStatisticsMod")),
          tog("assignEvoStatsRandomly", nu("baseStatisticsMod")),
          tog("updateBaseStats", nu("baseStatisticsMod")),
          sel("updateBaseStatsToGeneration", GENERATIONS, and(nu("baseStatisticsMod"), bool("updateBaseStats"))),
          tog("bstFollowEvolutions", nu("bstMod")),
          tog("bstShuffleSwapLegendaries", nu("bstMod")),
          slider("bstBuffNerfMaxPercentage", 10, 50, "%", eq("bstMod", "RANDOM_BUFF_NERF")),
        ],
      },
      {
        titleKey: "panels.types",
        controls: [
          radio("speciesTypesMod", "panels.typesMode", [
            "UNCHANGED",
            "RANDOM_FOLLOW_EVOLUTIONS",
            "COMPLETELY_RANDOM",
          ]),
          tog("typesFollowMegaEvolutions", nu("speciesTypesMod")),
          tog("dualTypeOnly", nu("speciesTypesMod")),
        ],
      },
      {
        titleKey: "panels.abilities",
        controls: [
          radio("abilitiesMod", "panels.abilitiesMode", ["UNCHANGED", "RANDOMIZE"]),
          tog("allowWonderGuard", nu("abilitiesMod")),
          tog("banBadAbilities", nu("abilitiesMod")),
          tog("banTrappingAbilities", nu("abilitiesMod")),
          tog("banNegativeAbilities", nu("abilitiesMod")),
          tog("weighDuplicateAbilitiesTogether", nu("abilitiesMod")),
          tog("abilitiesFollowEvolutions", nu("abilitiesMod")),
          tog("abilitiesFollowMegaEvolutions", nu("abilitiesMod")),
          tog("ensureTwoAbilities", nu("abilitiesMod")),
        ],
      },
      {
        titleKey: "panels.evolutions",
        controls: [
          radio("evolutionsMod", "panels.evolutionsMode", ["UNCHANGED", "RANDOM", "RANDOM_EVERY_LEVEL"]),
          tog("evosAllowAltFormes", nu("evolutionsMod")),
          tog("evosForceChange", nu("evolutionsMod")),
          tog("changeImpossibleEvolutions", nu("evolutionsMod")),
          tog("makeEvolutionsEasier", nu("evolutionsMod")),
          tog("evosMaxThreeStages", nu("evolutionsMod")),
          tog("evosForceGrowth", nu("evolutionsMod")),
          tog("evosNoConvergence", nu("evolutionsMod")),
          tog("evosSameTyping", nu("evolutionsMod")),
          tog("evosSimilarStrength", nu("evolutionsMod")),
          tog("removeTimeBasedEvolutions", nu("evolutionsMod")),
          tog("adjustEvolutionLevels", nu("evolutionsMod")),
          tog("estimateLevelForEvolutionImprovements"),
          slider("makeEvolutionsEasierLvl", 20, 65, undefined, bool("makeEvolutionsEasier")),
        ],
      },
      {
        titleKey: "panels.expCurves",
        controls: [
          radio("expCurveMod", "panels.expCurveMode", ["LEGENDARIES", "STRONG_LEGENDARIES", "ALL"]),
          tog("standardizeEXPCurves"),
          sel(
            "selectedEXPCurve",
            ["SLOW", "MEDIUM_SLOW", "MEDIUM_FAST", "FAST", "ERRATIC", "FLUCTUATING"].map((v) => ({
              value: v,
              labelKey: `opt.expCurves.${v}`,
            })),
            bool("standardizeEXPCurves"),
          ),
        ],
      },
    ],
  },

  /* ---------------- STARTERS ---------------- */
  {
    id: "starters",
    icon: "star",
    labelKey: "tabs.starters",
    blurbKey: "rail.blurb.starters",
    panels: [
      {
        titleKey: "panels.starterPokemon",
        controls: [
          radio("startersMod", "panels.starterMode", [
            "UNCHANGED",
            "CUSTOM",
            "COMPLETELY_RANDOM",
            "RANDOM_WITH_TWO_EVOLUTIONS",
            "RANDOM_BASIC",
          ]),
          {
            field: "customStarters",
            kind: "customStarter",
            labelKey: "opt.customStarter.label1",
            tipKey: "opt.customStarter.tip",
            show: eq("startersMod", "CUSTOM"),
          },
        ],
      },
      {
        titleKey: "panels.typeRestrictions",
        controls: [
          radio(
            "startersTypeMod",
            "panels.typeRestrictionsMode",
            ["NONE", "FIRE_WATER_GRASS", "TRIANGLE", "UNIQUE", "SINGLE_TYPE"],
            RANDOM_STARTERS,
          ),
          {
            field: "startersSingleType",
            kind: "singleType",
            labelKey: "opt.startersSingleType.label",
            tipKey: "opt.startersSingleType.tip",
            gate: RANDOM_STARTERS,
            show: eq("startersTypeMod", "SINGLE_TYPE"),
          },
          tog("startersNoDualTypes", RANDOM_STARTERS),
        ],
      },
      {
        titleKey: "panels.starterModifiers",
        controls: [
          tog("allowStarterAltFormes", RANDOM_STARTERS),
          tog("startersNoLegendaries", RANDOM_STARTERS),
          gated("startersBSTMinimum", 1, 1530, 300, RANDOM_STARTERS),
          gated("startersBSTMaximum", 1, 1530, 600, RANDOM_STARTERS),
          tog("randomizeStartersHeldItems"),
          tog("banBadRandomStarterHeldItems", bool("randomizeStartersHeldItems")),
        ],
      },
      {
        titleKey: "panels.staticPokemon",
        controls: [
          radio("staticPokemonMod", "panels.staticPokemonMode", [
            "UNCHANGED",
            "RANDOM_MATCHING",
            "COMPLETELY_RANDOM",
            "SIMILAR_STRENGTH",
          ]),
          tog("swapStaticMegaEvos", nu("staticPokemonMod")),
          tog("limit600", nu("staticPokemonMod")),
          tog("allowStaticAltFormes", nu("staticPokemonMod")),
          tog("limitMainGameLegendaries", nu("staticPokemonMod")),
          tog("correctStaticMusic", nu("staticPokemonMod")),
          tog("staticLevelModified"),
          slider("staticLevelModifier", -50, 50, "%", bool("staticLevelModified")),
        ],
      },
      {
        titleKey: "panels.inGameTrades",
        controls: [
          radio("inGameTradesMod", "panels.inGameTradesMode", [
            "UNCHANGED",
            "RANDOMIZE_GIVEN",
            "RANDOMIZE_GIVEN_AND_REQUESTED",
          ]),
          tog("randomizeInGameTradesNicknames", nu("inGameTradesMod")),
          tog("randomizeInGameTradesOTs", nu("inGameTradesMod")),
          tog("randomizeInGameTradesIVs", nu("inGameTradesMod")),
          tog("randomizeInGameTradesItems", nu("inGameTradesMod")),
        ],
      },
    ],
  },

  /* ---------------- MOVES ---------------- */
  {
    id: "moves",
    icon: "zap",
    labelKey: "tabs.moves",
    blurbKey: "rail.blurb.moves",
    panels: [
      {
        titleKey: "panels.moveData",
        controls: [
          tog("randomizeMovePowers"),
          tog("randomizeMoveAccuracies"),
          tog("randomizeMovePPs"),
          tog("randomizeMoveTypes"),
          tog("randomizeMoveNames"),
          tog("randomizeMoveCategory"),
          tog("updateMoves"),
          sel("updateMovesToGeneration", GENERATIONS, bool("updateMoves")),
        ],
      },
      {
        titleKey: "panels.pokemonMovesets",
        controls: [
          radio("movesetsMod", "panels.pokemonMovesetsMode", [
            "UNCHANGED",
            "RANDOM_PREFER_SAME_TYPE",
            "COMPLETELY_RANDOM",
            "METRONOME_ONLY",
          ]),
          tog("startWithGuaranteedMoves", nu("movesetsMod")),
          slider("guaranteedMoveCount", 1, 4, undefined, and(nu("movesetsMod"), bool("startWithGuaranteedMoves"))),
          tog("reorderDamagingMoves", nu("movesetsMod")),
          tog("blockBrokenMovesetMoves", nu("movesetsMod")),
          tog("movesetsForceGoodDamaging", nu("movesetsMod")),
          slider(
            "movesetsGoodDamagingPercent",
            0,
            100,
            "%",
            and(nu("movesetsMod"), bool("movesetsForceGoodDamaging")),
          ),
          tog("evolutionMovesForAll", nu("movesetsMod")),
        ],
      },
    ],
  },

  /* ---------------- FOES ---------------- */
  {
    id: "foes",
    icon: "shield",
    labelKey: "tabs.foes",
    blurbKey: "rail.blurb.foes",
    panels: [
      {
        titleKey: "panels.trainerPokemon",
        controls: [
          sel("trainersMod", [
            "UNCHANGED",
            "RANDOM",
            "DISTRIBUTED",
            "MAINPLAYTHROUGH",
            "TYPE_THEMED",
            "TYPE_THEMED_ELITE4_GYMS",
            "KEEP_THEMED",
            "KEEP_THEME_OR_PRIMARY",
          ].map((v) => ({ value: v, labelKey: `opt.trainersMod.${v}` }))),
          tog("rivalCarriesStarterThroughout"),
          tog("trainersUsePokemonOfSimilarStrength", nu("trainersMod")),
          tog("trainersAvoidDuplicates", nu("trainersMod")),
          tog("trainersMatchTypingDistribution", nu("trainersMod")),
          tog("trainersUseLocalPokemon", nu("trainersMod")),
          tog("trainersBlockLegendaries", nu("trainersMod")),
          tog("trainersBlockEarlyWonderGuard", nu("trainersMod")),
          tog("allowTrainerAlternateFormes", nu("trainersMod")),
          tog("swapTrainerMegaEvos", nu("trainersMod")),
          tog("shinyChance"),
          tog("randomizeTrainerNames"),
          tog("randomizeTrainerClassNames"),
          tog("trainersEvolveTheirPokemon"),
          slider("trainersEvolutionLevelModifier", 0, 50, "%", bool("trainersEvolveTheirPokemon")),
          tog("trainersLevelModified"),
          slider("trainersLevelModifier", -50, 50, "%", bool("trainersLevelModified")),
          gated("eliteFourUniquePokemonNumber", 1, 2, 1),
          gated("additionalBossTrainerPokemon", 1, 5, 1),
          gated("additionalImportantTrainerPokemon", 1, 5, 1),
          gated("additionalRegularTrainerPokemon", 1, 5, 1),
          tog("randomizeHeldItemsForBossTrainerPokemon"),
          tog("randomizeHeldItemsForImportantTrainerPokemon"),
          tog("randomizeHeldItemsForRegularTrainerPokemon"),
          tog("consumableItemsOnlyForTrainerPokemon"),
          tog("sensibleItemsOnlyForTrainerPokemon"),
          tog("highestLevelOnlyGetsItemsForTrainerPokemon"),
          tog("diverseTypesForBossTrainers", nu("trainersMod")),
          tog("diverseTypesForImportantTrainers", nu("trainersMod")),
          tog("diverseTypesForRegularTrainers", nu("trainersMod")),
          tog("betterBossTrainerMovesets"),
          tog("betterImportantTrainerMovesets"),
          tog("betterRegularTrainerMovesets"),
        ],
      },
      {
        titleKey: "panels.battleStyle",
        controls: [
          {
            field: "settingBattleStyle",
            kind: "battleStyle",
            labelKey: "panels.battleStyleMode",
            tipKey: "opt.battleStyleStyle.tip",
          },
        ],
      },
      {
        titleKey: "panels.totemPokemon",
        controls: [
          radio("totemPokemonMod", "panels.totemMode", ["UNCHANGED", "RANDOM", "SIMILAR_STRENGTH"]),
          radio("allyPokemonMod", "panels.allyMode", ["UNCHANGED", "RANDOM", "SIMILAR_STRENGTH"]),
          radio("auraMod", "panels.auraMode", ["UNCHANGED", "RANDOM", "SAME_STRENGTH"]),
          tog("randomizeTotemHeldItems"),
          tog("allowTotemAltFormes"),
          tog("totemLevelsModified"),
          slider("totemLevelModifier", -50, 50, "%", bool("totemLevelsModified")),
        ],
      },
    ],
  },

  /* ---------------- WILD ---------------- */
  {
    id: "wild",
    icon: "tree",
    labelKey: "tabs.wild",
    blurbKey: "rail.blurb.wild",
    panels: [
      {
        titleKey: "panels.wildPokemon",
        controls: [
          tog("randomizeWildPokemon"),
          tog("useTimeBasedEncounters"),
          tog("blockWildLegendaries", bool("randomizeWildPokemon")),
          tog("randomizeWildPokemonHeldItems"),
          tog("banBadRandomWildPokemonHeldItems", bool("randomizeWildPokemonHeldItems")),
          tog("allowWildAltFormes", bool("randomizeWildPokemon")),
        ],
      },
      {
        titleKey: "panels.wildTypeRestrictions",
        controls: [
          radio(
            "wildPokemonTypeMod",
            "panels.wildTypeRestrictionsMode",
            ["NONE", "KEEP_PRIMARY", "RANDOM_THEMES"],
            bool("randomizeWildPokemon"),
          ),
          tog("keepWildTypeThemes", bool("randomizeWildPokemon")),
        ],
      },
      {
        titleKey: "panels.encounterGrouping",
        controls: [
          radio(
            "wildPokemonZoneMod",
            "panels.encounterGroupingMode",
            ["NONE", "GAME", "NAMED_LOCATION", "MAP", "ENCOUNTER_SET"],
            bool("randomizeWildPokemon"),
          ),
          tog("splitWildZoneByEncounterTypes", bool("randomizeWildPokemon")),
        ],
      },
      {
        titleKey: "panels.evolutionRestrictions",
        controls: [
          radio(
            "wildPokemonEvolutionMod",
            "panels.evolutionRestrictionsMode",
            ["NONE", "BASIC_ONLY", "KEEP_STAGE"],
            bool("randomizeWildPokemon"),
          ),
          tog("keepWildEvolutionFamilies", bool("randomizeWildPokemon")),
        ],
      },
      {
        titleKey: "panels.wildCatchLevel",
        controls: [
          tog("useMinimumCatchRate"),
          slider("minimumCatchRateLevel", 1, 5, undefined, bool("useMinimumCatchRate")),
          tog("wildLevelsModified"),
          slider("wildLevelModifier", -50, 50, "%", bool("wildLevelsModified")),
          tog("catchEmAllEncounters", bool("randomizeWildPokemon")),
          tog("similarStrengthEncounters", bool("randomizeWildPokemon")),
          tog("balanceShakingGrass", bool("randomizeWildPokemon")),
        ],
      },
    ],
  },

  /* ---------------- TM/HM/TUTORS ---------------- */
  {
    id: "tmhm",
    icon: "book",
    labelKey: "tabs.tmhm",
    blurbKey: "rail.blurb.tmhm",
    panels: [
      {
        titleKey: "panels.tmMoves",
        controls: [
          radio("tmsMod", "panels.tmMovesMode", ["UNCHANGED", "RANDOM"]),
          tog("blockBrokenTMMoves", isRandom("tmsMod")),
          tog("keepFieldMoveTMs", isRandom("tmsMod")),
          tog("tmsForceGoodDamaging", isRandom("tmsMod")),
          slider("tmsGoodDamagingPercent", 0, 100, "%", and(isRandom("tmsMod"), bool("tmsForceGoodDamaging"))),
        ],
      },
      {
        titleKey: "panels.tmHmCompatibility",
        controls: [
          radio("tmsHmsCompatibilityMod", "panels.tmHmCompatibilityMode", [
            "UNCHANGED",
            "RANDOM_PREFER_TYPE",
            "COMPLETELY_RANDOM",
            "FULL",
          ]),
          tog("tmsFollowEvolutions", inn("tmsHmsCompatibilityMod", "RANDOM_PREFER_TYPE", "COMPLETELY_RANDOM")),
          tog("tmLevelUpMoveSanity"),
          tog("fullHMCompat"),
        ],
      },
      {
        titleKey: "panels.tutorMoves",
        controls: [
          radio("moveTutorMovesMod", "panels.tutorMovesMode", ["UNCHANGED", "RANDOM"]),
          tog("blockBrokenTutorMoves", isRandom("moveTutorMovesMod")),
          tog("keepFieldMoveTutors", isRandom("moveTutorMovesMod")),
          tog("tutorsForceGoodDamaging", isRandom("moveTutorMovesMod")),
          slider(
            "tutorsGoodDamagingPercent",
            0,
            100,
            "%",
            and(isRandom("moveTutorMovesMod"), bool("tutorsForceGoodDamaging")),
          ),
        ],
      },
      {
        titleKey: "panels.tutorMovesCompatibility",
        controls: [
          radio("moveTutorsCompatibilityMod", "panels.tutorMovesCompatibilityMode", [
            "UNCHANGED",
            "RANDOM_PREFER_TYPE",
            "COMPLETELY_RANDOM",
            "FULL",
          ]),
          tog(
            "tutorFollowEvolutions",
            inn("moveTutorsCompatibilityMod", "RANDOM_PREFER_TYPE", "COMPLETELY_RANDOM"),
          ),
          tog("tutorLevelUpMoveSanity"),
        ],
      },
    ],
  },

  /* ---------------- ITEMS ---------------- */
  {
    id: "items",
    icon: "cube",
    labelKey: "tabs.items",
    blurbKey: "rail.blurb.items",
    panels: [
      {
        titleKey: "panels.fieldItems",
        controls: [
          radio("fieldItemsMod", "panels.fieldItemsMode", ["UNCHANGED", "SHUFFLE", "RANDOM", "RANDOM_EVEN"]),
          tog("banBadRandomFieldItems", inn("fieldItemsMod", "RANDOM", "RANDOM_EVEN")),
        ],
      },
      {
        titleKey: "panels.specialShopItems",
        controls: [
          radio("shopItemsMod", "panels.specialShopItemsMode", ["UNCHANGED", "SHUFFLE", "RANDOM"]),
          tog("banBadRandomShopItems", isRandom("shopItemsMod")),
          tog("banRegularShopItems", isRandom("shopItemsMod")),
          tog("guaranteeEvolutionItems", isRandom("shopItemsMod")),
          tog("guaranteeXItems", isRandom("shopItemsMod")),
          tog("banOPShopItems", isRandom("shopItemsMod")),
        ],
      },
      {
        titleKey: "panels.shopItems",
        controls: [tog("balanceShopPrices"), tog("addCheapRareCandiesToShops")],
      },
      {
        titleKey: "panels.pickupItems",
        controls: [
          radio("pickupItemsMod", "panels.pickupItemsMode", ["UNCHANGED", "RANDOM"]),
          tog("banBadRandomPickupItems", isRandom("pickupItemsMod")),
        ],
      },
    ],
  },

  /* ---------------- TYPE CHART ---------------- */
  {
    id: "types",
    icon: "layers",
    labelKey: "tabs.types",
    blurbKey: "rail.blurb.types",
    panels: [
      {
        titleKey: "panels.typeEffectiveness",
        controls: [
          radio("typeEffectivenessMod", "panels.typeEffectivenessMode", [
            "UNCHANGED",
            "RANDOM",
            "RANDOM_BALANCED",
            "KEEP_IDENTITIES",
            "INVERSE",
          ]),
          tog("inverseTypesRandomImmunities", nu("typeEffectivenessMod")),
          tog("updateTypeEffectiveness"),
        ],
      },
    ],
  },

  /* ---------------- GRAPHICS ---------------- */
  {
    id: "graphics",
    icon: "eye",
    labelKey: "tabs.graphics",
    blurbKey: "rail.blurb.graphics",
    panels: [
      {
        titleKey: "panels.pokemonPalettes",
        controls: [
          radio("pokemonPalettesMod", "panels.pokemonPalettesMode", ["UNCHANGED", "RANDOM"]),
          tog("pokemonPalettesFollowTypes", isRandom("pokemonPalettesMod")),
          tog("pokemonPalettesFollowEvolutions", isRandom("pokemonPalettesMod")),
          tog("pokemonPalettesShinyFromNormal", isRandom("pokemonPalettesMod")),
        ],
      },
    ],
  },

  /* ---------------- MISC ---------------- */
  {
    id: "misc",
    icon: "sparkles",
    labelKey: "tabs.misc",
    blurbKey: "rail.blurb.misc",
    panels: [
      {
        titleKey: "panels.miscTweaks",
        controls: [
          {
            field: "currentMiscTweaks",
            kind: "miscBitmask",
            labelKey: "panels.miscTweaks",
          },
        ],
      },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/* Derived indexes + helpers                                                  */
/* -------------------------------------------------------------------------- */

export interface RzFieldEntry {
  control: RzControl
  category: RzCategory
  panel: RzPanel
}

/** field id → its control + category + panel (nested/battle-style included). */
export const FIELD_INDEX: Record<string, RzFieldEntry> = {}
for (const category of CATEGORIES) {
  for (const panel of category.panels) {
    for (const control of panel.controls) {
      FIELD_INDEX[control.field] = { control, category, panel }
    }
  }
}

/** Every "real" changeable field the catalog owns (misc handled specially). */
export const ALL_FIELDS: RzField[] = Object.keys(FIELD_INDEX) as RzField[]

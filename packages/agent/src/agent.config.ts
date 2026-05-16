// BookStack IDs for the harness agent.
// Generated 2026-05-16 — do not edit manually unless you recreate the BookStack structure.

export const bookstack = {
  shelves: {
    infrastructure: 1,
    boffmedia: 2,
    smartrotom: 3
  },

  books: {
    // Infrastructure shelf
    harnessAgent: 4,
    devops: 5,
    sharedDatabase: 6,

    // Boffmedia shelf
    technicalBoffmedia: 7,
    apiReferenceBoffmedia: 8,
    gamingTools: 9,
    eventsCommunity: 10,
    agentTasksBoffmedia: 11,

    // SmartRotom shelf
    technicalSmartrotom: 12,
    apiReferenceSmartrotom: 13,
    appsSmartrotom: 14,
    minecraftIntegration: 15,
    agentTasksSmartrotom: 16
  },

  chapters: {
    adrsBoffmedia: 17,    // inside books.technicalBoffmedia
    adrsSmartrotom: 18    // inside books.technicalSmartrotom
  },

  pages: {
    // Harness Agent book (4)
    harnessAgentArchitecture: 19,
    toolReference: 20,
    runHistory: 21,
    conventionsBoffmedia: 22,

    // DevOps book (5)
    dockerSetup: 23,
    gitlabPipelines: 24,
    grafanaDashboards: 25,
    runbooks: 26,

    // Shared database book (6)
    schemaOverview: 27,
    userRelations: 28,
    migrationLog: 29,

    // Technical — Boffmedia book (7)
    architectureBoffmedia: 30,
    changelogBoffmedia: 31,         // ← writeChangelog target

    // Gaming tools book (9)
    pokemonTracker: 32,
    damageCalculator: 33,
    monsterHunterBuildCreator: 34,

    // Events & community book (10)
    eventScheduling: 35,
    leaderboards: 36,
    playerProfiles: 37,
    tournaments: 38,

    // Technical — SmartRotom book (12)
    architectureSmartrotom: 39,
    minecraftIntegrationOverview: 40,
    changelogSmartrotom: 41,        // ← writeChangelog target

    // Apps — SmartRotom book (14)
    maps: 42,
    bank: 43,
    shop: 44,
    pokemonPcBox: 45,
    youtube: 46,
    minigames: 47,

    // Minecraft integration book (15)
    pluginArchitecture: 48,
    serverEvents: 49,
    externalBrowserFlow: 50,
    authWithMinecraft: 51,

    // Harness Agent book (4)
    taskSpecTemplate: 52           // ← enable as BookStack template in UI (page editor → Template toggle)
  }
} as const

// Shorthand helpers used by tool functions

export const CHANGELOG_PAGE_IDS = {
  boffmedia: bookstack.pages.changelogBoffmedia,
  smartrotom: bookstack.pages.changelogSmartrotom
} as const

export const ADR_CHAPTER_IDS = {
  boffmedia: bookstack.chapters.adrsBoffmedia,
  smartrotom: bookstack.chapters.adrsSmartrotom
} as const

export const API_REFERENCE_BOOK_IDS = {
  boffmedia: bookstack.books.apiReferenceBoffmedia,
  smartrotom: bookstack.books.apiReferenceSmartrotom
} as const

export const CONVENTIONS_PAGE_IDS = {
  boffmedia: bookstack.pages.conventionsBoffmedia
} as const

export const TECHNICAL_BOOK_IDS = {
  boffmedia: bookstack.books.technicalBoffmedia,
  smartrotom: bookstack.books.technicalSmartrotom
} as const

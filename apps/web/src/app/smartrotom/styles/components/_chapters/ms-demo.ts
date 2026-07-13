import type { IDialogue, NPC, QuestData } from "@/app/smartrotom/misiones/_types"
import { QuestStatus } from "@/types/misiones"

/**
 * Specimen fixtures for the Misiones chapters. Shaped EXACTLY like the real
 * `QuestData` / `NPC` / `IDialogue` the quest API returns — same fields, no more:
 * there is no xp, no rarity and no player level to demo, because the game does
 * not have them (see docs/smartrotom/deferred/README.md).
 */

const requirements = (level = 0, requiredQuests: number[] = []) => ({
  available: true,
  requiredQuests,
  requiredDialogs: [],
  requiredLevel: level,
  requiredTime: 0,
  factionRequirements: [],
  scoreboardRequirements: [],
})

export const MS_NPCS: NPC[] = [
  { id: 1, name: "Prof. Oak", skin: "oak", dialogId: 100, text: "", questId: 2, requirements: requirements() },
  { id: 2, name: "Brock", skin: "brock", dialogId: 101, text: "", questId: 11, requirements: requirements() },
]

export const MS_QUESTS: QuestData[] = [
  {
    id: 2,
    name: "Capturar tu primer Pokémon salvaje",
    logText:
      "Usa las Poké Ball que te dio el Prof. Oak para capturar a un Pokémon salvaje. Cruza al norte hacia la Ruta 1 y debilita al objetivo antes de lanzar.",
    completeText: "Has capturado tu primer Pokémon.",
    repeatable: false,
    type: 0,
    nextQuest: 3,
    category: "Pueblo Paleta",
    status: QuestStatus.ACTIVE,
    dialogId: 100,
    objectives: [
      { name: "poke_ball: Equipar Poké Ball", progress: 1, total: 1 },
      { name: "Capturar un Pokémon salvaje", progress: 0, total: 1 },
    ],
    requirements: requirements(2),
    rewards: [
      { item: "pixelmon:poke_ball", count: 5 },
      { item: "pixelmon:potion", count: 3 },
    ],
  },
  {
    id: 3,
    name: "Entregar el informe de la Ruta 1",
    logText: "Registra al menos 5 especies en la Ruta 1 y vuelve con el Prof. Oak para entregar tu reporte.",
    completeText: "El Prof. Oak archiva tu informe.",
    repeatable: false,
    type: 0,
    nextQuest: 0,
    category: "Pueblo Paleta",
    status: QuestStatus.AVAILABLE,
    dialogId: 100,
    objectives: [{ name: "Registrar especies en la Pokédex", progress: 2, total: 5 }],
    requirements: requirements(3, [2]),
    rewards: [{ item: "pixelmon:running_shoes", count: 1 }],
  },
  {
    id: 11,
    name: "La medalla Roca",
    logText: "Brock te reta a un combate de tipo Roca. Demuestra que mereces la Medalla Roca.",
    completeText: "La Medalla Roca es tuya.",
    repeatable: false,
    type: 0,
    nextQuest: 0,
    category: "Ciudad Plateada",
    status: QuestStatus.COMPLETED,
    dialogId: 101,
    objectives: [{ name: "Derrotar a Brock", progress: 1, total: 1 }],
    requirements: requirements(5),
    rewards: [{ item: "pixelmon:boulder_badge", count: 1 }],
  },
]

export const MS_DIALOGS: IDialogue[] = [
  {
    id: 100,
    name: "Laboratorio Oak — primer encuentro",
    text: "¡Por fin llegas! Toma estas Poké Ball. La Ruta 1 está justo al norte; verás Pidgey y Rattata salvajes.",
    questId: 2,
    requirements: requirements(),
  },
]

import type { ChainLink, IDialogue, NPC, QuestData, SealStatus } from "../_types"
import { normalizeStatus, STATUS_ORDER } from "./status"

/** How far along a quest is, counted over every objective it carries. */
export function questProgress(quest: QuestData) {
  const objectives = quest.objectives ?? []
  const done = objectives.filter((o) => o.progress >= o.total).length
  const value = objectives.reduce((sum, o) => sum + Math.min(o.progress, o.total), 0)
  const max = objectives.reduce((sum, o) => sum + o.total, 0)
  return {
    done,
    total: objectives.length,
    pct: max > 0 ? Math.round((value / max) * 100) : 0,
  }
}

/** The one line the tracked-quest card puts under "SIGUIENTE". */
export function nextObjective(quest: QuestData) {
  return (quest.objectives ?? []).find((o) => o.progress < o.total)
}

export function questCounts(quests: QuestData[]) {
  const counts: Record<string, number> = { ALL: quests.length }
  for (const quest of quests) {
    const status = normalizeStatus(quest)
    counts[status] = (counts[status] ?? 0) + 1
  }
  return counts
}

export function sortByStatus(quests: QuestData[]) {
  return [...quests].sort((a, b) => STATUS_ORDER[normalizeStatus(a)] - STATUS_ORDER[normalizeStatus(b)])
}

export const npcForQuest = (npcs: NPC[], quest: Pick<QuestData, "dialogId">) =>
  npcs.find((npc) => npc.dialogId === quest.dialogId)

export const dialogForQuest = (dialogs: IDialogue[], quest: Pick<QuestData, "id">) =>
  dialogs.find((dialog) => dialog.questId === quest.id)

/**
 * The rope between papers. The game stores the forward link on the quest
 * (`nextQuest`) and the backward one in its requirements (`requiredQuests`), so
 * a chain is walked forward from `nextQuest` and back through whichever quest
 * names this one as required. `seen` guards the cycle a bad quest file can hold.
 */
export function chainFor(quest: QuestData, quests: QuestData[]): ChainLink[] {
  const byId = new Map(quests.map((q) => [q.id, q]))
  const links: ChainLink[] = []

  const required = quest.requirements?.requiredQuests ?? []
  const previous =
    quests.find((q) => q.nextQuest === quest.id) ?? required.map((id) => byId.get(id)).find(Boolean)
  if (previous) links.push({ quest: previous, rel: "prev" })

  links.push({ quest, rel: "self" })

  const seen = new Set<number>([quest.id, previous?.id].filter(Boolean) as number[])
  let cursor: QuestData | undefined = byId.get(quest.nextQuest)
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id)
    links.push({ quest: cursor, rel: "next" })
    cursor = byId.get(cursor.nextQuest)
  }

  return links
}

/**
 * Every chain on the board, longest first — the conspiracy wall. A chain starts
 * at a quest nothing else leads into, and is only a chain if something follows.
 */
export function buildChains(quests: QuestData[]) {
  const byId = new Map(quests.map((q) => [q.id, q]))
  const isLinkedTo = new Set(quests.map((q) => q.nextQuest).filter((id) => byId.has(id)))

  const seen = new Set<number>()
  const chains: QuestData[][] = []

  for (const quest of quests) {
    if (isLinkedTo.has(quest.id) || seen.has(quest.id)) continue
    const line: QuestData[] = []
    let cursor: QuestData | undefined = quest
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id)
      line.push(cursor)
      cursor = byId.get(cursor.nextQuest)
    }
    if (line.length > 1) chains.push(line)
  }

  const loose = quests.filter((quest) => !chains.some((line) => line.some((q) => q.id === quest.id)))
  return { chains: chains.sort((a, b) => b.length - a.length), loose }
}

/** Board search — name, log text, the NPC who gave it, the reino it belongs to. */
export function searchQuests(quests: QuestData[], term: string, npcs: NPC[]) {
  const needle = term.trim().toLowerCase()
  if (!needle) return quests
  return quests.filter((quest) => {
    const npc = npcForQuest(npcs, quest)
    return (
      quest.name.toLowerCase().includes(needle) ||
      (quest.logText ?? "").toLowerCase().includes(needle) ||
      (npc?.name ?? "").toLowerCase().includes(needle) ||
      (quest.category ?? "").toLowerCase().includes(needle)
    )
  })
}

/**
 * The paper's rest angle on the cork — deterministic per quest, so a paper does
 * not jump every render. ±1.7°.
 */
export function tiltFor(id: number) {
  const seed = (id * 2654435761) % 2 ** 32
  return (((seed % 100) / 100) - 0.5) * 3.4
}

export const statusOf = normalizeStatus
export type { SealStatus }

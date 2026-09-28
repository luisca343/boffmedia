import { LIMITS, type TierListDocument } from "./schema"
import { applyTierListAction, type TierListAction } from "./engine"

export interface TierListHistory { past: TierListDocument[]; present: TierListDocument; future: TierListDocument[] }
export type TierListHistoryAction = TierListAction | { type: "undo" } | { type: "redo" } | { type: "load"; document: TierListDocument }
export const createHistory = (present: TierListDocument): TierListHistory => ({ past: [], present, future: [] })
export function tierListHistoryReducer(history: TierListHistory, action: TierListHistoryAction): TierListHistory {
  if (action.type === "load") return createHistory(action.document)
  if (action.type === "undo") {
    if (!history.past.length) return history
    return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future] }
  }
  if (action.type === "redo") {
    if (!history.future.length) return history
    return { past: [...history.past, history.present].slice(-LIMITS.history), present: history.future[0], future: history.future.slice(1) }
  }
  const present = applyTierListAction(history.present, action)
  return present === history.present ? history : { past: [...history.past, history.present].slice(-LIMITS.history), present, future: [] }
}

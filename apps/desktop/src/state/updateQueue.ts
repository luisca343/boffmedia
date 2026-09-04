/** Batch update queue for multiple packs.
 *
 * Reuses the existing install state machine to handle updates sequentially.
 * Prevents re-entrancy (multiple queues from concurrent clicks) and allows
 * stopping the queue at any point.
 *
 * The queue itself is pure state — the reducer dispatches the actual installs
 * through the existing app.tsx install callback.
 */

export type UpdateQueueState = {
  /** Packs queued for update, in order. */
  queued: string[]
  /** The pack currently being updated, or null if idle. */
  current: string | null
  /** True if the queue is stopping (user clicked stop). */
  stopping: boolean
}

export type UpdateQueueAction =
  | { type: "queue/enqueue"; packIds: string[] }
  | { type: "queue/start"; packId: string }
  | { type: "queue/done" | "queue/error" }
  | { type: "queue/stop" }
  | { type: "queue/clear" }

export function updateQueueReducer(
  state: UpdateQueueState,
  action: UpdateQueueAction,
): UpdateQueueState {
  switch (action.type) {
    case "queue/enqueue": {
      // Only add to queue if not already there or currently processing
      const unique = new Set([...state.queued, ...action.packIds])
      const newQueued = Array.from(unique)
      // Preserve order: keep existing queued first, then add new ones
      return {
        ...state,
        queued: state.queued.concat(
          action.packIds.filter((id) => !state.queued.includes(id)),
        ),
      }
    }
    case "queue/start": {
      // Remove from queued and set as current
      return {
        ...state,
        current: action.packId,
        queued: state.queued.filter((id) => id !== action.packId),
      }
    }
    case "queue/done":
    case "queue/error": {
      // Move to next item in queue, or idle if empty
      const next = state.queued[0] ?? null
      return {
        ...state,
        current: next,
        queued: next ? state.queued.slice(1) : [],
        stopping: false,
      }
    }
    case "queue/stop": {
      return { ...state, stopping: true }
    }
    case "queue/clear": {
      return { queued: [], current: null, stopping: false }
    }
    default:
      return state
  }
}

export const initialUpdateQueueState: UpdateQueueState = {
  queued: [],
  current: null,
  stopping: false,
}

/** True if there are any updates queued or in progress. */
export function isUpdateQueueActive(state: UpdateQueueState): boolean {
  return state.queued.length > 0 || state.current !== null
}

/** Number of packs waiting or in progress. */
export function updateQueueCount(state: UpdateQueueState): number {
  return state.queued.length + (state.current ? 1 : 0)
}

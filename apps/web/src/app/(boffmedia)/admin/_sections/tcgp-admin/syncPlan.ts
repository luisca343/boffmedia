import type { TcgSyncSetStatus, TcgSyncStatus } from "@/services/api/boffmedia/ptcgpService"

/** The four independently selectable data types. */
export interface TcgSyncSelection {
  series: boolean
  sets: boolean
  cards: boolean
  images: boolean
  force: boolean
}

export const EMPTY_SELECTION: TcgSyncSelection = {
  series: false,
  sets: false,
  cards: false,
  images: false,
  force: false,
}

/**
 * What a run would actually do, computed from the same rules the API applies.
 * The point is that the admin reads this BEFORE starting: "3 sets, ~740 cards,
 * ~1,480 images" is the difference between an informed click and the old
 * download-everything button.
 */
export interface TcgSyncPlan {
  /** Sets that will be walked (a selected set already complete is not one). */
  setsToProcess: TcgSyncSetStatus[]
  /** Selected sets the API will skip because they are already complete. */
  setsSkipped: TcgSyncSetStatus[]
  cardsToFetch: number
  imagesToDownload: number
  /** Nothing selected, or nothing left to do. */
  empty: boolean
}

/**
 * A set is re-walked when its stored card count is behind the remote one — or
 * whenever `force` is on. `cardsRemote === 0` means the remote catalogue could
 * not be read, so the set is treated as work rather than silently skipped.
 */
export function setNeedsCards(set: TcgSyncSetStatus, force: boolean): boolean {
  if (force) return true
  if (set.cardsRemote === 0) return set.cardsInDb === 0
  return set.cardsInDb < set.cardsRemote
}

export function setNeedsImages(set: TcgSyncSetStatus, force: boolean): boolean {
  if (force) return set.cardsInDb > 0 || set.cardsRemote > 0
  return set.imagesMissing > 0 || setNeedsCards(set, false)
}

export function buildSyncPlan(
  status: TcgSyncStatus | null,
  selection: TcgSyncSelection,
  selectedSetIds: Set<string>,
): TcgSyncPlan {
  const empty: TcgSyncPlan = {
    setsToProcess: [],
    setsSkipped: [],
    cardsToFetch: 0,
    imagesToDownload: 0,
    empty: true,
  }
  if (!status) return empty

  const touchesSets = selection.cards || selection.images
  if (!touchesSets) {
    // Series/sets-only runs do real work but walk no expansions.
    return { ...empty, empty: !selection.series && !selection.sets }
  }

  const chosen = status.sets.filter((s) => selectedSetIds.has(s.id))
  const setsToProcess: TcgSyncSetStatus[] = []
  const setsSkipped: TcgSyncSetStatus[] = []
  let cardsToFetch = 0
  let imagesToDownload = 0

  for (const set of chosen) {
    const doCards = selection.cards && setNeedsCards(set, selection.force)
    const doImages = selection.images && setNeedsImages(set, selection.force)

    if (!doCards && !doImages) {
      setsSkipped.push(set)
      continue
    }
    setsToProcess.push(set)

    // The API re-fetches a whole set when it is incomplete, so the estimate is
    // the full set, not just the delta.
    if (doCards) cardsToFetch += set.cardsRemote || set.cardsInDb

    if (doImages) {
      // Up to two files per card without artwork - an upper bound, since one
      // locale is often absent upstream. The plan line says "~" for that reason.
      const newCards = Math.max(0, set.cardsRemote - set.cardsInDb)
      imagesToDownload += selection.force
        ? (set.cardsRemote || set.cardsInDb) * 2
        : (set.imagesMissing + newCards) * 2
    }
  }

  return {
    setsToProcess,
    setsSkipped,
    cardsToFetch,
    imagesToDownload,
    empty: setsToProcess.length === 0 && !selection.series && !selection.sets,
  }
}

/** Sets that are not fully imported — the default selection for an update run. */
export function incompleteSetIds(status: TcgSyncStatus | null): string[] {
  return (status?.sets ?? []).filter((s) => s.state !== "ok").map((s) => s.id)
}

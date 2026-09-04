import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedAutoPOSTWithHeaders,
} from "@/services/http/boff-client"
import { STEP_UP_HEADER } from "@/services/api/boffmedia/stepUp"

/**
 * Types are declared here rather than imported from `@boffmedia/shared`
 * because that package is regenerated from the live API's Swagger
 * (`pnpm generate:shared`, which needs the API up on :34301). Replace these
 * with the generated entities on the next regeneration — the shapes are the
 * `entities/moderation.entity.ts` classes verbatim.
 */
export type ReportableContentType = "forum_thread" | "forum_post" | "rooker_post" | "user_profile"

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "sexual"
  | "illegal"
  | "off_topic"
  | "other"

/** The order the reasons are offered in. `other` stays last — it is the fallback. */
export const REPORT_REASONS: ReportReason[] = [
  "spam",
  "harassment",
  "hate",
  "sexual",
  "illegal",
  "off_topic",
  "other",
]

export type ReportAcknowledgement = {
  received: boolean
  duplicate: boolean
}

export type ModerationAuthor = {
  userId?: number | null
  uuid?: string | null
  username?: string | null
  openReports: number
  actionedReports: number
  totalReports: number
  sanctions: number
  contentBanned: boolean
}

export type ModerationQueueItem = {
  contentType: ReportableContentType
  contentId: string
  reportCount: number
  reasons: string[]
  firstReportedAt: string
  lastReportedAt: string
  excerpt?: string | null
  hidden: boolean
  contentExists: boolean
  contentCreatedAt?: string | null
  author: ModerationAuthor
}

export type ModerationQueuePage = {
  items: ModerationQueueItem[]
  total: number
  limit?: number
  offset?: number
}

export type ModerationQueueSort = "reports" | "oldest" | "newest"

export type ModerationQueueParams = {
  status?: "open" | "actioned" | "dismissed"
  contentType?: ReportableContentType
  sort?: ModerationQueueSort
  limit?: number
  offset?: number
}

export type SanctionKind = "warning" | "content_ban"

export class ModerationService {
  /** Any signed-in user. One endpoint for every surface. */
  static report(input: {
    contentType: ReportableContentType
    contentId: string
    reason: ReportReason
    detail?: string
  }) {
    return apiAuthedAutoPOST<ReportAcknowledgement>("/moderation/reports", input)
  }

  static queue(params: ModerationQueueParams = {}) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      const text = String(value)
      // An empty filter is "no filter": sending `contentType=` would make the
      // API validate the empty string against the registry and 400.
      if (text) search.set(key, text)
    }
    const qs = search.toString()
    return apiAuthedAutoGET<ModerationQueuePage>(`/moderation/admin/reports${qs ? `?${qs}` : ""}`)
  }

  static dismiss(contentType: string, contentId: string, reason: string) {
    return apiAuthedAutoPOST<{ success: true }>(
      `/moderation/admin/reports/${contentType}/${encodeURIComponent(contentId)}/dismiss`,
      { reason },
    )
  }

  static hide(contentType: string, contentId: string, reason: string) {
    return apiAuthedAutoPOST<{ success: true }>(
      `/moderation/admin/reports/${contentType}/${encodeURIComponent(contentId)}/hide`,
      { reason },
    )
  }

  static unhide(contentType: string, contentId: string, reason: string) {
    return apiAuthedAutoPOST<{ success: true }>(
      `/moderation/admin/reports/${contentType}/${encodeURIComponent(contentId)}/unhide`,
      { reason },
    )
  }

  /**
   * The only moderation action that takes a step-up token: a content ban stops
   * a person participating the moment it lands, which is what the other
   * step-up sites have in common. Hiding a post costs one click to undo.
   */
  static sanction(
    input: {
      contentType: string
      contentId: string
      kind: SanctionKind
      reason: string
      days?: number
    },
    stepUpToken: string,
  ) {
    return apiAuthedAutoPOSTWithHeaders<{ success: true; sanctionId: number }>(
      "/moderation/admin/sanctions",
      input,
      { [STEP_UP_HEADER]: stepUpToken },
    )
  }
}

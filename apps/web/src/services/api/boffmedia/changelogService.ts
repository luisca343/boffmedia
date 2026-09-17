import type { ChangelogListEntity, MarkChangelogSeenDto } from "@boffmedia/shared"

import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
} from "@/services/http/boff-client"

export type ChangelogProduct = "boffmedia" | "smartrotom"
export type ChangelogPlatform = "all" | "web" | "desktop"
export type ChangelogLocale = "es" | "en"

function listQuery(
  product: ChangelogProduct,
  platform: ChangelogPlatform,
  locale: ChangelogLocale,
  limit = 50,
): string {
  const query = new URLSearchParams({
    product,
    platform,
    locale,
    limit: String(limit),
  })
  return `/changelogs?${query.toString()}`
}

/** Public product changelog API. The GET deliberately uses the auto-auth
 * helper: it still works anonymously, while an existing Boffmedia account
 * lets the server calculate that account's per-product unread cursor. */
export const ChangelogService = {
  list(
    product: ChangelogProduct,
    platform: ChangelogPlatform,
    locale: ChangelogLocale,
    limit?: number,
  ) {
    return apiAuthedAutoGET<ChangelogListEntity>(
      listQuery(product, platform, locale, limit),
    )
  },

  markSeen(input: {
    entryId: number
    product: ChangelogProduct
    platform: ChangelogPlatform
  }) {
    return apiAuthedAutoPOST<{ success: boolean }>(
      "/changelogs/seen",
      input as MarkChangelogSeenDto,
    )
  },
}

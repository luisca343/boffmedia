"use client"

import { Button } from "@boffmedia/ui"
import { useToolT } from "../../i18n"
import { useWishlist } from "../_utils/wishlist"

const PLANNER_WISHLIST_HREF = "/mhwilds/wishlist"

/** A persistent entry point to the shared crafting target list. */
export function WishlistLink({ href = PLANNER_WISHLIST_HREF }: { href?: string }) {
  const t = useToolT("tools.mhwilds")
  const { entries } = useWishlist()
  const label = t("build_planner.wishlist.nav", { count: entries.length })

  return (
    <Button
      size="sm"
      variant={entries.length > 0 ? "pri" : "default"}
      icon="list"
      href={href}
      title={label}
      aria-label={label}
    >
      {label}
    </Button>
  )
}

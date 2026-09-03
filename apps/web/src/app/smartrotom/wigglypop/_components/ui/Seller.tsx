"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { WpListing, WpSeller } from "../../_types/market.types"
import { Icon } from "./Icon"

/**
 * A seller's avatar. Hue is derived from the uuid, so the same player is always the
 * same colour everywhere in the app without us storing one — SmartRotom's
 * `rotom_users` has no avatar column (and the skin-head service is a different
 * subsystem entirely), so this is the honest fallback rather than a broken <img>.
 */
export function Avatar({
  seller,
  size = 46,
  className,
}: {
  seller: Pick<WpSeller, "uuid" | "username">
  size?: number
  className?: string
}) {
  const hue = hashHue(seller.uuid)
  const initials = seller.username.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()
  return (
    <div
      className={cn(
        "flex flex-none items-center justify-center rounded-[15px] font-wp-display font-semibold text-white",
        "shadow-[0_6px_14px_-6px_rgba(120,70,100,.5)]",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.37,
        background: `linear-gradient(150deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 65% 42%))`,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

function hashHue(uuid: string): number {
  let h = 0
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) % 360
  return h
}

/**
 * The trust row. Every badge here states a fact the backend can actually prove:
 *
 * · "Propiedad verificada (PC)" — the listing's `pokemonKey` was matched against the
 *   seller's live PC when they listed it. **Pokémon only.** An item listing is
 *   seller-DECLARED (there is no bag API), so claiming verified ownership on one
 *   would be exactly the lie the rest of the app goes out of its way not to tell —
 *   it gets the honest counterpart badge instead.
 * · "Pago en depósito" — the money really is held in a StarBank escrow account.
 *
 * There is deliberately no "vendedor verificado" badge: nothing in the domain
 * verifies a seller, and a badge that means nothing is worse than no badge.
 */
export function TrustBadges({
  listing,
  className,
}: {
  listing: Pick<WpListing, "escrow" | "kind">
  className?: string
}) {
  const t = useTranslations("wigglypop")
  const badges: Array<{
    icon: "shieldCheck" | "lock" | "history" | "info"
    label: string
    pink?: boolean
    amber?: boolean
  }> = []

  if (listing.kind === "item") {
    badges.push({ icon: "info", label: t("trust.itemDeclared"), amber: true })
  } else {
    badges.push({ icon: "shieldCheck", label: t("trust.ownerVerified") })
  }
  if (listing.escrow) badges.push({ icon: "lock", label: t("trust.escrowHeld") })
  if (listing.kind !== "item") {
    badges.push({ icon: "history", label: t("trust.priceHistory"), pink: true })
  }

  return (
    <div className={cn("flex flex-wrap gap-[0.4375rem]", className)}>
      {badges.map((b) => (
        <span
          key={b.label}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-wp-pill border-wp px-[0.6875rem] py-[0.4375rem] font-wp text-[0.75rem] font-extrabold",
            b.amber
              ? "border-wp-amber/30 bg-wp-amber/[.10] text-wp-amber"
              : b.pink
                ? "border-wp-accent/30 bg-wp-accent/[.13] text-wp-accent-strong"
                : "border-wp-teal/30 bg-[#e4f7f4] text-wp-teal-deep",
          )}
        >
          <Icon name={b.icon} size={14} />
          {b.label}
        </span>
      ))}
    </div>
  )
}

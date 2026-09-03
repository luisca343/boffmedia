"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { fmt } from "../_utils/format"
import { cartCount, useCartStore } from "../_stores/cartStore"
import { Button, Icon, NavBadge, type IconName } from "./ui"

const NAV: Array<{ href: string; labelKey: string; icon: IconName }> = [
  { href: "/smartrotom/wigglypop", labelKey: "nav.market", icon: "grid" },
  { href: "/smartrotom/wigglypop/objetos", labelKey: "nav.items", icon: "package" },
  { href: "/smartrotom/wigglypop/anuncios", labelKey: "nav.myListings", icon: "list" },
  { href: "/smartrotom/wigglypop/seguimiento", labelKey: "nav.watchlist", icon: "bookmark" },
  { href: "/smartrotom/wigglypop/compras", labelKey: "nav.myOrders", icon: "history" },
]

/**
 * The marketplace's own top bar, under SmartRotom's Rotom nav.
 *
 * The wallet pill is the one CREAM surface in the app — the only warm note on a
 * cool-pink page — which is what makes your money feel like the thing you are
 * holding while you browse. The balance is real: it is the player's StarBank
 * balance, not a Wigglypop credit.
 */
export function TopNav({
  balance,
  search,
  onSearch,
  watchCount,
  activeOrders,
  activeListings,
}: {
  balance: number | null
  search: string
  onSearch: (q: string) => void
  watchCount: number
  activeOrders: number
  activeListings: number
}) {
  const t = useTranslations("wigglypop")
  const pathname = usePathname()
  const router = useRouter()
  const lines = useCartStore((s) => s.lines)
  const count = cartCount(lines)

  const badgeFor = (href: string) => {
    if (href.endsWith("/seguimiento") && watchCount > 0)
      return <NavBadge tone="teal">{watchCount}</NavBadge>
    if (href.endsWith("/compras") && activeOrders > 0)
      return <NavBadge tone="gold">{activeOrders}</NavBadge>
    if (href.endsWith("/anuncios") && activeListings > 0)
      return <NavBadge tone="teal">{activeListings}</NavBadge>
    return null
  }

  return (
    <nav className="wp-chrome relative z-40 flex h-[4.125rem] flex-none items-center gap-3 border-b border-wp-line/24 px-[1.125rem] shadow-[0_6px_20px_-16px_rgba(223,63,137,.5)]">
      <Link href="/smartrotom/wigglypop" className="flex flex-none items-center gap-3">
        <span className="wp-grad-mark flex h-10 w-10 items-center justify-center rounded-[14px] shadow-[0_8px_18px_-6px_rgba(223,63,137,.7),inset_0_1px_0_rgba(255,255,255,.5)]">
          {/* The mascot: a speech bubble with Wigglytuff's face — buy, sell, chat. */}
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 4h14a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 19 17h-6.5L7 21v-4H5a2.5 2.5 0 0 1-2.5-2.5v-8A2.5 2.5 0 0 1 5 4z"
              fill="#fff"
            />
            <circle cx="9.4" cy="10" r="1.5" fill="#ef4f97" />
            <circle cx="14.6" cy="10" r="1.5" fill="#ef4f97" />
            <path
              d="M9.6 12.6q2.4 2 4.8 0"
              stroke="#ef4f97"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </span>
        <span>
          <span className="block font-wp-display text-[1.375rem] font-semibold leading-none text-wp-fg">
            Wiggly<b className="font-semibold text-wp-accent">pop</b>
          </span>
          <span className="mt-[3px] block font-wp text-[0.625rem] font-extrabold uppercase tracking-[.1em] text-wp-fg-subtle">
            {t("nav.tagline")}
          </span>
        </span>
      </Link>

      <span className="h-7 w-px flex-none bg-wp-line/24" />

      <div className="flex items-center gap-[3px]">
        {NAV.map((item) => {
          const active =
            item.href === "/smartrotom/wigglypop"
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center gap-[0.4375rem] rounded-wp-pill border-wp border-transparent px-3.5 py-[0.5625rem]",
                "font-wp text-[0.84375rem] font-extrabold transition-all duration-150 ease-wp-soft",
                active
                  ? "wp-grad-primary text-white shadow-wp-tab"
                  : "text-wp-fg-muted hover:bg-wp-panel-2 hover:text-wp-accent-strong",
              )}
            >
              <Icon name={item.icon} size={16} />
              {t(item.labelKey)}
              {badgeFor(item.href)}
            </Link>
          )
        })}
      </div>

      <div className="relative min-w-[7.5rem] max-w-[18.75rem] flex-1">
        <Icon
          name="search"
          size={17}
          className="pointer-events-none absolute left-[0.8125rem] top-1/2 -translate-y-1/2 text-wp-fg-subtle"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => {
            if (pathname !== "/smartrotom/wigglypop") router.push("/smartrotom/wigglypop")
          }}
          placeholder={t("nav.searchPlaceholder")}
          aria-label={t("nav.searchAriaLabel")}
          className={cn(
            "h-11 w-full rounded-wp-pill border-wp border-wp-line/24 bg-white pl-[2.625rem] pr-4",
            "font-wp text-sm font-bold text-wp-fg shadow-[inset_0_1px_2px_rgba(223,63,137,.05)]",
            "outline-none transition-[border-color,box-shadow] duration-150",
            "placeholder:text-wp-fg-subtle hover:border-wp-line/46",
            "focus:border-wp-accent focus:shadow-[0_0_0_4px_rgb(var(--wp-accent)/.13)]",
          )}
        />
      </div>

      <Link href="/smartrotom/wigglypop/carrito" className="relative flex-none">
        <Button iconOnly aria-label={t("nav.cartAriaLabel", { count })}>
          <Icon name="cart" size={18} />
        </Button>
        {count > 0 && <NavBadge tone="accent">{count}</NavBadge>}
      </Link>

      <div className="flex flex-none items-center gap-2.5 rounded-wp-pill border-wp border-wp-cream-deep bg-wp-cream py-1.5 pl-[0.8125rem] pr-2.5">
        <Icon name="dollar" size={16} className="text-wp-accent" />
        <div>
          <div className="font-wp text-[0.59375rem] font-bold uppercase leading-none tracking-[.06em] text-wp-fg-subtle">
            {t("nav.walletLabel")}
          </div>
          {/* Real StarBank balance. `null` while it loads — never a fake 0, which
              would flash "you are broke" at every player on every page load. */}
          <div className="wp-num font-wp text-[0.90625rem] text-wp-fg">
            {balance === null ? "—" : `₽${fmt(balance)}`}
          </div>
        </div>
      </div>

      <Link href="/smartrotom/wigglypop/vender" className="flex-none">
        <Button variant="primary">
          <Icon name="plus" size={16} />
          {t("nav.sellButton")}
        </Button>
      </Link>
    </nav>
  )
}

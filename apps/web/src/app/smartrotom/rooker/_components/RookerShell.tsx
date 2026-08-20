"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Avatar, Icon, RookerMark, type IconName } from "./ui"
import { RightRail } from "./RightRail"
import { ComposeModal } from "./ComposeModal"
import { DisplayPanel } from "./DisplayPanel"
import { useComposeStore } from "../_stores/composeStore"
import { useMe, useNotifications, useRookerUuid } from "../_hooks/queries"

interface NavItem {
  key: string
  href: string
  icon: IconName
  label: string
}

/**
 * The nest's navigation.
 *
 * There is no Gremio tab: guilds do not exist anywhere in the server — no table, no
 * API, nothing to derive them from — so the screen would have to fabricate its own
 * contents. Deferred instead (docs/smartrotom/deferred/README.md). Mensajes is here but
 * points at ChatApp, which is where the server's real DMs already live.
 */
function isActive(pathname: string, href: string) {
  if (href === "/smartrotom/rooker") return pathname === href
  return pathname.startsWith(href)
}

function NavBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="absolute -right-2 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-rk-pill border-2 border-rk-bg bg-rk-accent px-1 text-[10px] font-extrabold text-rk-accent-fg">
      {count > 99 ? "99+" : count}
    </span>
  )
}

export function RookerShell({ children }: { children: ReactNode }) {
  const t = useTranslations("rooker")
  const pathname = usePathname()
  const uuid = useRookerUuid()
  const openCompose = useComposeStore((s) => s.openCompose)
  const { data: me } = useMe()
  const { data: notifications } = useNotifications()

  const NAV: NavItem[] = [
    { key: "inicio", href: "/smartrotom/rooker", icon: "home", label: t("shell.nav.inicio") },
    { key: "buscar", href: "/smartrotom/rooker/buscar", icon: "search", label: t("shell.nav.explorar") },
    { key: "notificaciones", href: "/smartrotom/rooker/notificaciones", icon: "bell", label: t("shell.nav.notificaciones") },
    { key: "mensajes", href: "/smartrotom/rooker/mensajes", icon: "mail", label: t("shell.nav.mensajes") },
    { key: "vitrina", href: "/smartrotom/rooker/vitrina", icon: "grid", label: t("shell.nav.vitrina") },
  ]

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0
  const myHref = me?.handle ? `/smartrotom/rooker/${me.handle}` : "/smartrotom/rooker"
  const profileActive = Boolean(me?.handle) && pathname === myHref

  return (
    <div className="flex min-h-0 flex-1 justify-center">
      <div className="flex w-full max-w-[1265px] min-w-0">
        {/* ── Left nav (desktop). Collapses to icons under 1000px, exactly as the
            handoff's breakpoints do, and disappears entirely on mobile. ───────── */}
        <nav className="sticky top-0 hidden h-full w-[88px] flex-none flex-col items-center border-r border-rk-line px-2 pb-3 pt-1 md:flex xl:w-[275px] xl:items-start xl:px-2">
          <Link
            href="/smartrotom/rooker"
            aria-label={t("shell.homeAriaLabel")}
            className="mb-0.5 grid h-[52px] w-[52px] place-items-center rounded-full text-rk-accent transition-colors hover:bg-rk-hover"
          >
            <RookerMark size={48} />
          </Link>

          <div className="flex w-full flex-col items-center gap-0.5 xl:items-start">
            {NAV.map((item) => {
              const on = isActive(pathname, item.href)
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex w-fit max-w-full items-center gap-[18px] rounded-rk-pill px-4 py-[11px] text-[20px] text-rk-fg transition-colors hover:bg-rk-hover",
                    on ? "font-extrabold" : "font-normal",
                  )}
                >
                  <span className="relative grid flex-none place-items-center">
                    <Icon name={item.icon} size={26} fill={on} stroke={on ? 0 : 2} />
                    {item.key === "notificaciones" && <NavBadge count={unread} />}
                  </span>
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              )
            })}

            {me?.handle && (
              <Link
                href={myHref}
                aria-current={profileActive ? "page" : undefined}
                className={cn(
                  "flex w-fit max-w-full items-center gap-[18px] rounded-rk-pill px-4 py-[11px] text-[20px] text-rk-fg transition-colors hover:bg-rk-hover",
                  profileActive ? "font-extrabold" : "font-normal",
                )}
              >
                <Icon name="feather" size={26} fill={profileActive} stroke={profileActive ? 0 : 2} />
                <span className="hidden xl:inline">{t("shell.nav.perfil")}</span>
              </Link>
            )}

            <DisplayPanel />
          </div>

          {uuid && (
            <button
              type="button"
              onClick={() => openCompose("text")}
              className="mt-4 grid h-[52px] w-[52px] place-items-center rounded-rk-pill bg-rk-accent text-[17px] font-bold text-rk-accent-fg transition-[filter] hover:brightness-[.92] xl:h-auto xl:w-full xl:py-[15px]"
            >
              <span className="hidden xl:inline">{t("compose.submit")}</span>
              <Icon name="feather" size={24} className="xl:hidden" />
            </button>
          )}

          <div className="flex-1" />

          {me && (
            <Link
              href={myHref}
              className="flex w-full items-center gap-2.5 rounded-rk-pill p-2 transition-colors hover:bg-rk-hover"
            >
              <Avatar user={{ uuid: me.uuid, username: me.username, partnerPokemonId: me.partnerPokemonId }} size={40} />
              <div className="hidden min-w-0 flex-1 text-left xl:block">
                <div className="truncate text-[15px] font-bold text-rk-fg">
                  {me.displayName || me.username}
                </div>
                <div className="truncate text-[14px] text-rk-fg-subtle">@{me.handle}</div>
              </div>
              <Icon name="more" size={16} className="hidden flex-none text-rk-fg-subtle xl:block" />
            </Link>
          )}
        </nav>

        {/* ── Mobile top bar ─────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col md:max-w-[600px] md:border-r md:border-rk-line">
          <div className="flex items-center justify-between border-b border-rk-line bg-rk-nav px-3.5 py-2 backdrop-blur-md md:hidden">
            {me ? (
              <Link href={myHref} aria-label={t("shell.yourProfileAriaLabel")}>
                <Avatar user={{ uuid: me.uuid, username: me.username, partnerPokemonId: me.partnerPokemonId }} size={32} />
              </Link>
            ) : (
              <span className="h-8 w-8" />
            )}
            <div className="flex items-center gap-1.5 text-rk-accent">
              <RookerMark size={32} />
              <span className="text-[19px] font-extrabold tracking-[-.02em] text-rk-fg">Rooker</span>
            </div>
            <DisplayPanel compact />
          </div>

          <main className="rk-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {children}
            {/* Clears the fixed mobile tab bar so the last trino is never trapped
                underneath it. */}
            <div className="h-[76px] md:hidden" />
          </main>
        </div>

        {/* ── Right rail. The handoff hides it below 1095px. ─────────────────── */}
        <aside className="rk-scroll hidden h-full w-[350px] flex-none overflow-y-auto pl-6 lg:block">
          <RightRail />
        </aside>
      </div>

      {/* ── Mobile compose FAB + tab bar ───────────────────────────────────── */}
      {uuid && (
        <button
          type="button"
          onClick={() => openCompose("text")}
          aria-label={t("shell.composeFabAriaLabel")}
          className="fixed bottom-[4.6rem] right-4 z-[45] grid h-14 w-14 place-items-center rounded-full bg-rk-accent text-rk-accent-fg shadow-lg transition-[filter] hover:brightness-[.92] md:hidden"
        >
          <Icon name="feather" size={24} />
        </button>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-rk-line bg-rk-nav backdrop-blur-md md:hidden">
        {NAV.map((item) => {
          const on = isActive(pathname, item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-label={item.label}
              aria-current={on ? "page" : undefined}
              className="relative grid flex-1 place-items-center py-2.5 pb-3"
            >
              <span className="relative grid place-items-center">
                <Icon
                  name={item.icon}
                  size={24}
                  fill={on}
                  stroke={on ? 0 : 1.9}
                  className={on ? "text-rk-accent" : "text-rk-fg-subtle"}
                />
                {item.key === "notificaciones" && <NavBadge count={unread} />}
              </span>
            </Link>
          )
        })}
      </nav>

      <ComposeModal />
    </div>
  )
}

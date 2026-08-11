"use client"

import * as React from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, Button } from "@boffmedia/ui"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import { useDismiss } from "@boffmedia/ui/hooks/use-dismiss"
import { useBoffSession } from "@/services/useBoffSession"
import { UsersService } from "@/services/api/boffmedia/usersService"

interface AccountUser {
  id?: string | number
  name?: string | null
  email?: string | null
  image?: string | null
  smartRotomUser?: { username: string } | undefined
}

// Session-wide cache of the resolved avatar URL so the nav doesn't re-hit the
// API on every mount.
const avatarCache = new Map<string, string | null>()

/**
 * Best avatar URL for the signed-in user. Credentials login leaves
 * `session.user.image` empty (the picture lives in the DB `profilePicture`), so
 * fall back to a one-off `getUser` fetch — same source the profile page uses.
 */
function useAvatarUrl(user?: AccountUser): string | null {
  const id = user?.id != null ? String(user.id) : null
  const sessionImg = user?.image ?? null
  const [url, setUrl] = React.useState<string | null>(sessionImg ?? (id ? avatarCache.get(id) ?? null : null))

  React.useEffect(() => {
    if (sessionImg) {
      setUrl(sessionImg)
      return
    }
    if (!id) return
    if (avatarCache.has(id)) {
      setUrl(avatarCache.get(id) ?? null)
      return
    }
    let alive = true
    UsersService.getUser(Number(id))
      .then((r) => {
        const pic = r.data?.profilePicture ?? null
        avatarCache.set(id, pic)
        if (alive) setUrl(pic)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [id, sessionImg])

  return url
}

const ITEM =
  "flex items-center gap-2.5 px-[15px] py-2.5 font-body text-[14px] font-medium leading-none text-txt-muted no-underline transition-colors duration-[140ms] hover:bg-panel-2 hover:text-txt"

const MOBILE_ITEM =
  "flex items-center gap-2.5 px-1 py-2.5 font-body text-[14px] font-medium leading-none text-txt-muted no-underline transition-colors duration-[140ms] hover:text-txt"

function AccountAvatar({ image, initial, size }: { image?: string | null; initial: string; size: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center border border-solid border-accent bg-panel-2 font-display font-extrabold italic text-accent cut-seal cut-seal-edge [--cut-line:var(--accent)] [--cut:5px]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      <ArtImage src={image} alt="" sizes={`${size}px`} fallback={<span>{initial}</span>} />
    </span>
  )
}

function AuthButtons() {
  const tNav = useTranslations("nav.v3")
  return (
    <>
      <Button size="sm" variant="ghost" icon="user" href="/entrar">
        {tNav("login")}
      </Button>
      <Button size="sm" variant="pri" icon="plus" href="/entrar?mode=register">
        {tNav("register")}
      </Button>
    </>
  )
}

export function AccountMenu({ user, isAdmin }: { user: AccountUser; isAdmin?: boolean }) {
  const tNav = useTranslations("nav.v3")
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLSpanElement>(null)
  useDismiss(rootRef, () => setOpen(false), open)

  const image = useAvatarUrl(user)
  const name = user.name || user.smartRotomUser?.username || "User"
  const initial = name.charAt(0).toUpperCase()

  return (
    <span className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={tNav("account")}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-[9px] border border-solid py-1 pl-1 pr-2 cut-tag cut-tag-edge transition-[color,border-color,background] duration-[140ms]",
          open
            ? "border-line-2 [--cut-line:var(--line-2)] bg-panel-2 text-txt"
            : "border-transparent [--cut-line:transparent] bg-transparent text-txt-muted hover:border-line-2 hover:[--cut-line:var(--line-2)] hover:bg-panel-2 hover:text-txt",
        )}
      >
        <AccountAvatar image={image} initial={initial} size={28} />
        <span className="max-w-[130px] truncate font-display text-[13px] font-bold leading-none tracking-[0.05em] text-txt">
          {name}
        </span>
        <Icon
          name="chevronDown"
          size={13}
          className={cn("shrink-0 text-txt-dim transition-transform duration-[140ms]", open && "rotate-180 text-accent")}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={tNav("account")}
          className="cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:10px] absolute right-0 top-[calc(100%_+_8px)] z-[70] w-[248px] border border-solid border-line-2 border-t-accent bg-panel shadow-[0_24px_54px_-22px_rgba(0,0,0,0.75)] animate-[bm-nd-pop_0.14s_ease-out] motion-reduce:animate-none"
        >
          <div className="flex items-center gap-3 border-b border-line px-[15px] py-3">
            <AccountAvatar image={image} initial={initial} size={38} />
            <div className="min-w-0">
              <b className="block truncate font-display text-[14px] font-bold uppercase leading-tight tracking-[0.03em] text-txt">
                {name}
              </b>
              {user.email && (
                <span className="block truncate font-mono text-[11px] leading-none text-txt-muted">{user.email}</span>
              )}
            </div>
          </div>
          <Link href="/perfil" role="menuitem" onClick={() => setOpen(false)} className={ITEM}>
            <Icon name="user" size={16} className="text-txt-dim" />
            {tNav("profile")}
          </Link>
          <Link href="/perfil?tab=torneos" role="menuitem" onClick={() => setOpen(false)} className={ITEM}>
            <Icon name="trophy" size={16} className="text-txt-dim" />
            {tNav("tournaments")}
          </Link>
          <Link href="/perfil" role="menuitem" onClick={() => setOpen(false)} className={ITEM}>
            <Icon name="chart" size={16} className="text-txt-dim" />
            {tNav("activity")}
          </Link>
          <Link href="/perfil" role="menuitem" onClick={() => setOpen(false)} className={ITEM}>
            <Icon name="settings" size={16} className="text-txt-dim" />
            {tNav("settings")}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(ITEM, "border-t border-line")}
            >
              <Icon name="shield" size={16} className="text-txt-dim" />
              {tNav("admin")}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 border-t border-line px-[15px] py-2.5 text-left font-body text-[14px] font-medium leading-none text-bad no-underline transition-colors duration-[140ms] hover:bg-panel-2"
          >
            <Icon name="logout" size={16} className="text-bad" />
            {tNav("logout")}
          </button>
        </div>
      )}
    </span>
  )
}

/** Desktop navbar auth slot: account menu when signed in, login/register buttons otherwise. */
export function AccountNav() {
  const { session, isBoffAdmin } = useBoffSession()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  // Until mounted (and on SSR) the client session is unknown — render the
  // logged-out buttons so hydration matches, then swap in the menu.
  if (!mounted || !session?.user) return <AuthButtons />
  return <AccountMenu user={session.user} isAdmin={isBoffAdmin()} />
}

/** Mobile drawer auth slot: identity + logout when signed in, buttons otherwise. */
export function MobileAccount({ onNavigate }: { onNavigate: () => void }) {
  const tNav = useTranslations("nav.v3")
  const { session, isBoffAdmin } = useBoffSession()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const image = useAvatarUrl(session?.user)

  if (!mounted || !session?.user) {
    return (
      <div className="mt-4 grid gap-2.5">
        <Button variant="ghost" size="sm" icon="user" href="/entrar" onClick={onNavigate} className="w-full">
          {tNav("login")}
        </Button>
        <Button variant="pri" size="sm" icon="plus" href="/entrar?mode=register" onClick={onNavigate} className="w-full">
          {tNav("register")}
        </Button>
      </div>
    )
  }

  const user = session.user
  const name = user.name || user.smartRotomUser?.username || "User"
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="mt-4 grid gap-2.5">
      <Link
        href="/perfil"
        onClick={onNavigate}
        className="flex items-center gap-3 border border-solid border-line bg-panel px-3 py-2.5 cut-tag cut-tag-edge no-underline"
      >
        <AccountAvatar image={image} initial={initial} size={36} />
        <div className="min-w-0">
          <b className="block truncate font-display text-[15px] font-bold uppercase leading-tight tracking-[0.03em] text-txt">
            {name}
          </b>
          {user.email && (
            <span className="block truncate font-mono text-[11px] leading-none text-txt-muted">{user.email}</span>
          )}
        </div>
      </Link>
      <div className="grid">
        <Link href="/perfil?tab=torneos" onClick={onNavigate} className={MOBILE_ITEM}>
          <Icon name="trophy" size={16} className="shrink-0 text-txt-dim" />
          {tNav("tournaments")}
        </Link>
        <Link href="/perfil" onClick={onNavigate} className={MOBILE_ITEM}>
          <Icon name="chart" size={16} className="shrink-0 text-txt-dim" />
          {tNav("activity")}
        </Link>
        <Link href="/perfil" onClick={onNavigate} className={MOBILE_ITEM}>
          <Icon name="settings" size={16} className="shrink-0 text-txt-dim" />
          {tNav("settings")}
        </Link>
        {isBoffAdmin() && (
          <Link href="/admin" onClick={onNavigate} className={MOBILE_ITEM}>
            <Icon name="shield" size={16} className="shrink-0 text-txt-dim" />
            {tNav("admin")}
          </Link>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        icon="logout"
        onClick={() => {
          onNavigate()
          signOut({ callbackUrl: "/" })
        }}
        className="w-full"
      >
        {tNav("logout")}
      </Button>
    </div>
  )
}

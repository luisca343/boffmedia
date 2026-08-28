import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { Icon, Spinner } from "@boffmedia/ui"

import { useT } from "../i18n"
import { useApp } from "../state/app"
import { PlayerHead } from "./PlayerHead"

// The MINECRAFT account chip in the rail, and the switcher it opens.
//
// It sits ABOVE the Boffmedia chip, so the two identities the launcher holds
// read bottom-to-top as what they are: the principal you are signed in as, and
// the game credential linked under it. They are deliberately two chips rather
// than one merged account menu — merging them is what made players read
// "Inicia sesión" on the Boffmedia chip as "your Minecraft link did not take",
// when the two had simply never been the same credential.
//
// Why this exists at all: auth_accounts / auth_switch / auth_remove have
// supported several linked Minecraft accounts since the roster landed, and NO
// screen exposed them. The only way to reach a second account was to unlink the
// first from Settings, and the only way to link one at all was to launch a pack
// and wait for it to ask. Both are now here, one click from anywhere.
//
// Portaled to document.body like the Boffmedia chip: the rail scrolls, and an
// absolutely positioned panel inside it gets clipped by the overflow.

export function McAccountSwitcher() {
  const t = useT("mcAccount")
  const {
    account,
    accounts,
    switchAccount,
    removeAccount,
    switchingAccount,
    signIn,
    signingIn,
    sessionBusy,
    boffSigningIn,
    switchingBoffAccount,
  } = useApp()

  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Switching runs the full refresh chain and swaps the session the game is
  // launched with, so an install or a live game must not be able to overlap it.
  // A BOFFMEDIA device flow blocks it too, and that one is not just tidiness:
  // BoffSignIn renders inside the shell, so this chip is still clickable during
  // it — and starting an MSA flow would put the SignIn screen over a Boffmedia
  // poll that is still running underneath, with no way back to it.
  const locked =
    switchingAccount || sessionBusy || signingIn || boffSigningIn || switchingBoffAccount

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Nothing linked yet. A cube rather than a key: the key is the Boffmedia
  // chip's glyph, and two identical keys stacked in the rail would be
  // unreadable. It STARTS the link rather than navigating anywhere — the
  // device-code screen takes the content area on its own (see App's Router).
  if (!account) {
    return (
      <button
        type="button"
        disabled={locked}
        onClick={() => void signIn()}
        title={t("linkTitle")}
        aria-label={t("linkTitle")}
        className="relative mb-2 flex h-10 w-10 shrink-0 items-center justify-center rounded text-txt-muted transition-colors hover:bg-surface-bright hover:text-txt disabled:opacity-50"
      >
        <Icon name="cube" size={20} />
        {/* A bare cube in a rail of glyphs reads as one more nav destination.
            The corner plus is what says "this adds an account" without a label
            the 64px rail has no room for. */}
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-accent text-accent-ink">
          <Icon name="plus" size={9} />
        </span>
      </button>
    )
  }

  const others = accounts.filter((a) => a.uuid !== account.uuid)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`${t("title")} · ${account.username}`}
        className="relative mb-2 flex h-10 w-10 shrink-0 items-center justify-center rounded transition-colors hover:bg-surface-bright"
      >
        {switchingAccount ? (
          <span className="cut-seal grid h-8 w-8 place-items-center bg-panel-2 text-txt">
            <Spinner size={14} />
          </span>
        ) : (
          <>
            <PlayerHead skinUrl={account.skinUrl} username={account.username} size={32} />
            {/* Two 32px faces stacked in the rail look like decoration, not
                controls, and nothing said either one opened a menu. The caret
                is the only affordance that fits at this size. */}
            <span
              className="pointer-events-none absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-panel-2 text-txt-dim"
              aria-hidden
            >
              <Icon name="chevronRight" size={9} />
            </span>
          </>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 rounded border border-line bg-base-deep shadow-lg"
            style={{ left: "64px", bottom: "8px", width: "260px" }}
          >
            <ul className="flex flex-col">
              <li className="flex items-center gap-2 border-b border-line px-3 py-2">
                <PlayerHead skinUrl={account.skinUrl} username={account.username} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="block truncate text-[12px] font-semibold text-txt">
                    {account.username}
                  </p>
                  <p className="block truncate font-mono text-[10px] text-txt-dim">{t("title")}</p>
                </div>
              </li>

              {/* The other linked accounts. Each row is two controls: the row
                  itself switches, the trailing button unlinks — so unlinking an
                  account you are NOT using never costs you a switch first. */}
              {others.map((entry) => (
                <li key={entry.uuid} className="flex items-center gap-2 px-3 py-2 hover:bg-panel-2">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setOpen(false)
                      void switchAccount(entry.uuid)
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-50"
                  >
                    <PlayerHead skinUrl={entry.skinUrl} username={entry.username} size={24} />
                    <span className="min-w-0 truncate text-[12px] text-txt">{entry.username}</span>
                  </button>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => void removeAccount(entry.uuid)}
                    title={t("unlinkLabel", { username: entry.username })}
                    aria-label={t("unlinkLabel", { username: entry.username })}
                    className="shrink-0 text-txt-dim transition-colors hover:text-bad disabled:opacity-50"
                  >
                    <Icon name="x" size={13} />
                  </button>
                </li>
              ))}

              {/* Link another: the same device flow, keyed by UUID in the roster,
                  so it ADDS an account rather than replacing the current one. */}
              <li className="border-t border-solid border-line">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setOpen(false)
                    void signIn()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-txt-dim hover:bg-panel-2 hover:text-txt disabled:opacity-50"
                >
                  <Icon name="plus" size={13} /> {t("addAccount")}
                </button>
              </li>

              <li className="border-t border-solid border-line">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setOpen(false)
                    void removeAccount(account.uuid)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-txt-dim hover:bg-panel-2 hover:text-bad disabled:opacity-50"
                >
                  <Icon name="logout" size={13} /> {t("unlink")}
                </button>
              </li>
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}

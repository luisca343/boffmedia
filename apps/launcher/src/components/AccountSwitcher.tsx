import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { Icon, Spinner } from "@boffmedia/ui"

import { useT } from "../i18n"
import { useLauncher } from "../state/launcher"

// The account avatar button at the foot of the rail, and the switcher flyout it
// opens. This is the PRIMARY account surface and shows the BOFFMEDIA account —
// the launcher principal — never a Minecraft one. A Minecraft identity is a
// linked sub-credential asked for at launch time, a separate concern from which
// Boffmedia account you are signed in as.
//
// The panel is portaled to document.body because the rail scrolls, and an
// in-tree absolute-positioned panel would be clipped by the overflow.

/** A monogram avatar. `/packs/launcher/me` returns no avatar URL, so the
 *  Boffmedia identity is drawn as the first letter of the username rather than
 *  a Minecraft head — which would be the wrong identity entirely. */
function BoffAvatar({ username, size = 32 }: { username: string; size?: number }) {
  const letter = (username.trim()[0] ?? "?").toUpperCase()
  return (
    <span
      className="cut-seal grid shrink-0 place-items-center bg-accent font-display font-bold text-accent-ink"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
      aria-hidden
    >
      {letter}
    </span>
  )
}

export function AccountSwitcher() {
  const t = useT("accountSwitcher")
  const {
    boffAccount,
    boffAccountList,
    switchBoffAccount,
    switchingBoffAccount,
    boffSignIn,
    boffSignOut,
    boffSigningIn,
    sessionBusy,
  } = useLauncher()
  // Switching, signing out and adding all swap or drop the process-global
  // session token; an install or a live game authenticates with it, so the
  // whole surface is disabled while `sessionBusy`. A device flow already in
  // flight (`boffSigningIn`) likewise blocks starting another (M2/C1).
  const locked = switchingBoffAccount || sessionBusy || boffSigningIn
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Click-away and Escape. Without these the panel survives navigating to
  // another screen, which reads as the UI being stuck.
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

  // The shell (and so this rail) renders signed OUT too. The chip is where a
  // session comes from in that state: one obvious affordance, from anywhere in
  // the app. Rendering nothing here (the old behaviour, when the rail could not
  // exist without a session) would leave the rail with a hole where the account
  // belongs.
  //
  // It STARTS the device flow rather than navigating to Play. That worked only
  // while Play was a sign-in wall; now Play is a working library, so navigating
  // there would answer a click on "sign in" with a pack list and no sign-in in
  // sight. The flow itself takes the content area (see App's Router).
  if (!boffAccount) {
    return (
      <button
        type="button"
        onClick={() => void boffSignIn()}
        title={t("signIn")}
        aria-label={t("signIn")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-txt-muted transition-colors hover:bg-surface-bright hover:text-txt"
      >
        <Icon name="key" size={20} />
      </button>
    )
  }

  const others = boffAccountList.filter((a) => a.id !== boffAccount.id)

  return (
    <>
      {/* Trigger: 40px avatar button in the rail */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={boffAccount.username}
        className="flex h-10 w-10 items-center justify-center shrink-0 rounded transition-colors hover:bg-surface-bright"
      >
        {switchingBoffAccount ? (
          <span className="cut-seal grid h-8 w-8 place-items-center bg-accent text-accent-ink">
            <Spinner size={14} />
          </span>
        ) : (
          <BoffAvatar username={boffAccount.username} size={32} />
        )}
      </button>

      {/* Flyout panel: portaled to document.body, fixed positioning */}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 border border-line bg-base-deep rounded shadow-lg"
            style={{
              left: "64px",
              bottom: "8px",
              width: "260px",
            }}
          >
            <ul className="flex flex-col">
              {/* Current account header */}
              <li className="flex items-center gap-2 px-3 py-2 border-b border-line">
                <BoffAvatar username={boffAccount.username} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="block truncate text-[12px] font-semibold text-txt">
                    {boffAccount.username}
                  </p>
                  <p className="block truncate font-mono text-[10px] text-txt-dim">
                    Boffmedia · #{boffAccount.id}
                  </p>
                </div>
              </li>

              {/* Other signed-in Boffmedia accounts */}
              {others.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2 px-3 py-2 hover:bg-panel-2">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setOpen(false)
                      void switchBoffAccount(entry.id)
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-50"
                  >
                    <BoffAvatar username={entry.username} size={24} />
                    <span className="min-w-0 truncate text-[12px] text-txt">{entry.username}</span>
                  </button>
                </li>
              ))}

              {/* Add account: a fresh device flow, keyed by id so it ADDS. */}
              <li className="border-t border-solid border-line">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setOpen(false)
                    void boffSignIn()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-txt-dim hover:bg-panel-2 hover:text-txt disabled:opacity-50"
                >
                  <Icon name="plus" size={13} /> {t("addAccount")}
                </button>
              </li>

              {/* Sign out of the active account */}
              <li className="border-t border-solid border-line">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    setOpen(false)
                    void boffSignOut()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-txt-dim hover:bg-panel-2 hover:text-bad disabled:opacity-50"
                >
                  <Icon name="logout" size={13} /> {t("signOut")}
                </button>
              </li>
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}

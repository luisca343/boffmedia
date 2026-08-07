import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { Icon, Spinner } from "@boffmedia/ui"

import { useT } from "../i18n"
import { PlayerHead } from "./PlayerHead"
import { useLauncher } from "../state/launcher"

// The account avatar button at the foot of the rail, and the switcher flyout it opens.
//
// Not the shared `Menu` primitive: the rows here are not commands but a
// selection with a current value, each carrying its own destructive secondary
// action (remove). Bending Menu into that shape would have cost more than the
// lines below.
//
// The panel is portaled to document.body because the rail scrolls, and an
// in-tree absolute positioned panel would be clipped by the overflow.

export function AccountSwitcher() {
  const t = useT("accountSwitcher")
  const { account, accounts, switchAccount, removeAccount, switchingAccount, signIn, signOut } =
    useLauncher()
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

  if (!account) return null

  // With one account the switcher is pointless, but "Añadir cuenta" is not —
  // that is precisely how a player gets to two.
  const others = accounts.filter((a) => a.uuid !== account.uuid)

  return (
    <>
      {/* Trigger: 32px avatar button in the rail */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={account.username}
        className="flex h-10 w-10 items-center justify-center shrink-0 rounded transition-colors hover:bg-surface-bright"
      >
        {switchingAccount ? (
          <span className="cut-seal grid h-8 w-8 place-items-center bg-accent text-accent-ink">
            <Spinner size={14} />
          </span>
        ) : (
          <PlayerHead skinUrl={account.skinUrl} size={32} />
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
                <PlayerHead skinUrl={account.skinUrl} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="block truncate text-[12px] font-semibold text-txt">{account.username}</p>
                  <p className="block truncate font-mono text-[10px] text-txt-dim">
                    {account.uuid.slice(0, 13)}…
                  </p>
                </div>
              </li>

              {/* Other accounts */}
              {others.map((entry) => (
                <li key={entry.uuid} className="flex items-center gap-2 px-3 py-2 hover:bg-panel-2">
                  <button
                    type="button"
                    disabled={switchingAccount}
                    onClick={() => {
                      setOpen(false)
                      void switchAccount(entry.uuid)
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-50"
                  >
                    <PlayerHead skinUrl={entry.skinUrl} size={24} />
                    <span className="min-w-0 truncate text-[12px] text-txt">{entry.username}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("removeLabel", { username: entry.username })}
                    title={t("removeTitle")}
                    disabled={switchingAccount}
                    onClick={() => void removeAccount(entry.uuid)}
                    className="p-1 text-txt-dim hover:text-bad disabled:opacity-50"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </li>
              ))}

              {/* Add account */}
              <li className="border-t border-solid border-line">
                <button
                  type="button"
                  disabled={switchingAccount}
                  onClick={() => {
                    setOpen(false)
                    // Sign-in ADDS: the Rust side keys tokens by UUID, so this
                    // never evicts the account already signed in.
                    void signIn()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-txt-dim hover:bg-panel-2 hover:text-txt disabled:opacity-50"
                >
                  <Icon name="plus" size={13} /> {t("addAccount")}
                </button>
              </li>

              {/* Sign out all */}
              <li className="border-t border-solid border-line">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    signOut()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-txt-dim hover:bg-panel-2 hover:text-bad"
                >
                  <Icon name="logout" size={13} /> {t("signOutAll")}
                </button>
              </li>
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}

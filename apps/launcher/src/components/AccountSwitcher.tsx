import { useEffect, useRef, useState } from "react"

import { Icon, IconButton, Spinner } from "@boffmedia/ui"

import { useT } from "../i18n"
import { PlayerHead } from "./PlayerHead"
import { useLauncher } from "../state/launcher"

// The account row at the foot of the nav, and the switcher it opens.
//
// Not the shared `Menu` primitive: the rows here are not commands but a
// selection with a current value, each carrying its own destructive secondary
// action (remove). Bending Menu into that shape would have cost more than the
// forty lines below.

export function AccountSwitcher() {
  const t = useT("accountSwitcher")
  const { account, accounts, switchAccount, removeAccount, switchingAccount, signIn, signOut } =
    useLauncher()
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Click-away and Escape. Without these the panel survives navigating to
  // another screen, which reads as the UI being stuck.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
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
    <div ref={boxRef} className="relative border-t border-line">
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-20 border-t border-solid border-line bg-base-deep shadow-lg">
          <ul className="flex flex-col">
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
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3">
        {/* The spinner replaces the face during a switch rather than sitting
            beside it: the face is about to become someone else's, and showing
            the old one mid-switch is the confusing half-second. */}
        {switchingAccount ? (
          <span className="cut-seal grid h-8 w-8 shrink-0 place-items-center bg-accent text-accent-ink">
            <Spinner size={14} />
          </span>
        ) : (
          <PlayerHead skinUrl={account.skinUrl} size={32} />
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="min-w-0 flex-1 text-left"
        >
          <span className="block truncate text-[13px] font-semibold text-txt">
            {account.username}
          </span>
          <span className="block truncate font-mono text-[10px] text-txt-dim">
            {switchingAccount ? t("switching") : `${account.uuid.slice(0, 13)}…`}
          </span>
        </button>
        {/* One glyph, flipped: the icon set has no chevron-up, and rotating
            the down one also animates the state change for free. */}
        <span className={open ? "rotate-180" : undefined}>
          <IconButton
            name="chevronDown"
            label={t("switchLabel")}
            size={16}
            onClick={() => setOpen((v) => !v)}
          />
        </span>
      </div>
    </div>
  )
}

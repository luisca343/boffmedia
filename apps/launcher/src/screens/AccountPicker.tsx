import { Button, Icon, Kicker, Panel, Spinner } from "@boffmedia/ui"

import { useT } from "../i18n"
import { PlayerHead } from "../components/PlayerHead"
import { useLauncher } from "../state/launcher"

// Shown instead of SignIn when this machine already knows accounts but none of
// them currently has a live session.
//
// The case that actually matters is not the exotic one (a roster with nothing
// marked active). It is the ordinary one: the active account's refresh token
// died, so the silent restore failed with `needsSignin` — and the player has a
// second account whose token is perfectly fine. Dropping them at "Entrar con
// Microsoft" makes them re-authenticate an account they did not need to touch,
// when one click on the other face would have signed them straight in.
//
// Picking a face runs the full refresh chain (`switchAccount`), so nothing here
// weakens sign-in; it only saves the player from redoing work.

export function AccountPicker() {
  const { accounts, switchAccount, removeAccount, switchingAccount, signIn, restoreError } =
    useLauncher()
  const t = useT("accountPicker")

  return (
    <div className="grid h-full place-items-center px-8 py-10">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 text-center">
          <Kicker>Boff Launcher</Kicker>
          <h1 className="font-display text-[34px]/none font-bold uppercase tracking-[0.06em] text-txt">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm text-txt-muted">
            {/* When we know WHY the session ended, say so here rather than in a
                separate banner — on this screen it is the only message. */}
            {restoreError?.needsSignin
              ? t("lastSessionExpired")
              : t("savedAccounts")}
          </p>
        </div>

        <Panel>
          <ul className="flex flex-col">
            {accounts.map((entry) => (
              <li
                key={entry.uuid}
                className="flex items-center gap-3 border-b border-solid border-line py-2 last:border-b-0"
              >
                <button
                  type="button"
                  disabled={switchingAccount}
                  onClick={() => void switchAccount(entry.uuid)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-50"
                >
                  <PlayerHead skinUrl={entry.skinUrl} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-txt">
                      {entry.username}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-txt-dim">
                      {entry.uuid.slice(0, 13)}…
                    </span>
                  </span>
                  {switchingAccount ? (
                    <Spinner size={14} />
                  ) : (
                    <Icon name="chevronRight" size={16} />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={t("removeAccountLabel", { username: entry.username })}
                  title={t("removeAccountTitle")}
                  disabled={switchingAccount}
                  onClick={() => void removeAccount(entry.uuid)}
                  className="p-1 text-txt-dim hover:text-bad disabled:opacity-50"
                >
                  <Icon name="trash" size={14} />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-center border-t border-line pt-4">
            <Button
              variant="ghost"
              size="sm"
              icon="plus"
              disabled={switchingAccount}
              onClick={() => void signIn()}
            >
              {t("addAccount")}
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

import { useState } from "react"

import { Badge, Banner, Button, Icon, Panel, Spinner, DISPLAY_VOICE } from "@boffmedia/ui"

import { useT } from "../i18n"
import { authOpenVerification, copyText } from "../runtime"
import { useApp } from "../state/app"

/** A button that reports what happened, because a copy that silently does
 *  nothing is worse than no button at all. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useT("signin")
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle")

  return (
    <Button
      size="sm"
      variant="ghost"
      icon={state === "ok" ? "check" : "copy"}
      onClick={() => {
        void copyText(value).then((ok) => {
          setState(ok ? "ok" : "fail")
          setTimeout(() => setState("idle"), 2000)
        })
      }}
    >
      {state === "ok" ? t("copied") : state === "fail" ? t("copyFailed") : label}
    </Button>
  )
}

// The Microsoft device-code flow. The user reads a short code
// here and types it into microsoft.com/link in a real browser; we poll until
// they finish. Deliberately NOT an embedded webview: putting Microsoft's login
// inside our own window is both a phishing-training exercise for users and a
// thing Microsoft's terms discourage.

export function SignIn() {
  const { signIn, cancelSignIn, signingIn, deviceCode, restoreError, goOffline } = useApp()
  const t = useT("signin")
  // Latched so the button cannot be hammered while the roster is being read;
  // released again if there turned out to be no account to fall back to.
  const [offlineTried, setOfflineTried] = useState(false)

  return (
    <div className="grid h-full place-items-center px-8 py-10">
      <div className="w-full max-w-[32.5rem]">
        <div className="mb-6 text-center">
          <h1 className={`${DISPLAY_VOICE} text-[2.125rem] text-txt`}>
            {t("title")}
          </h1>
          <p className="mt-3 text-sm text-txt-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Why we are asking again. A player who was signed in yesterday and
            is staring at this screen today deserves the reason, and the two
            reasons need different words: `needsSignin` means the token is
            genuinely dead (act now), anything else is transient (the button
            below will likely fail too — say so instead of implying otherwise). */}
        {restoreError && !signingIn && (
          <Banner
            tone={restoreError.needsSignin ? "warn" : "error"}
            title={
              restoreError.needsSignin
                ? t("sessionExpired")
                : t("restoreFailed")
            }
            className="mb-4"
          >
            {restoreError.needsSignin
              ? t("sessionExpiredAction")
              : `${restoreError.message} ${t("restoreFailedAction")}`}
            {/* Only for the transient case, and only when there is actually an
                account to fall back to. Offered rather than forced: the player
                may simply want to wait for the network and sign in properly. */}
            {!restoreError.needsSignin && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  icon="play"
                  disabled={offlineTried}
                  onClick={() => {
                    setOfflineTried(true)
                    void goOffline().then((ok) => {
                      if (!ok) setOfflineTried(false)
                    })
                  }}
                >
                  {t("offlineMode")}
                </Button>
              </div>
            )}
          </Banner>
        )}

        {!signingIn && (
          <Panel>
            <div className="flex flex-col items-center gap-4 py-4">
              <span className="cut-seal grid h-14 w-14 place-items-center bg-accent text-accent-ink">
                <Icon name="key" size={26} />
              </span>
              <Button variant="pri" size="lg" icon="external" onClick={() => void signIn()}>
                {t("button")}
              </Button>
              <p className="max-w-[23.75rem] text-center text-xs text-txt-dim">
                {t("securityNote")}
              </p>
            </div>
          </Panel>
        )}

        {signingIn && !deviceCode && (
          <Panel>
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-txt-muted">
              <Spinner /> {t("consulting")}
            </div>
          </Panel>
        )}

        {signingIn && deviceCode && (
          <Panel title={t("complete")} aside={<Badge tone="warn">{t("waiting")}</Badge>}>
            <ol className="flex flex-col gap-4">
              <li className="flex gap-3">
                <span className="cut-seal grid h-6 w-6 shrink-0 place-items-center bg-accent text-[0.75rem] font-bold text-accent-ink [--cut:5px]">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-sm text-txt">
                    {t("copyCodeLabel")}
                  </p>
                  {/* Selectable, so it works even if the clipboard is denied. */}
                  <div className="cut cut-edge-slant [--cut-w:2px] [--cut-line:var(--accent-line)] select-text border-2 border-solid border-accent-line bg-base-deep px-5 py-3 text-center font-display text-[1.875rem]/none font-bold tracking-[0.24em] text-accent-bright">
                    {deviceCode.userCode}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <CopyButton value={deviceCode.userCode} label={t("copyCodeButton")} />
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="cut-seal grid h-6 w-6 shrink-0 place-items-center bg-accent text-[0.75rem] font-bold text-accent-ink [--cut:5px]">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-txt">
                    {t("browserStep")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="pri"
                      icon="external"
                      onClick={() => {
                        // The code goes to the clipboard in the SAME click.
                        // Microsoft rejects a pre-filled `?otc=` link (see
                        // auth_open_verification), so the browser lands on the
                        // plain entry form and the only thing left to do there
                        // is paste — which is why this button copies rather than
                        // leaving the player to come back for the copy button.
                        void copyText(deviceCode.userCode)
                        void authOpenVerification(deviceCode.verificationUri).catch(
                          () => undefined,
                        )
                      }}
                    >
                      {t("browserButton")}
                    </Button>
                    <CopyButton value={deviceCode.verificationUri} label={t("linkButton")} />
                  </div>
                  <p className="mt-2 select-text font-mono text-[0.6875rem] text-txt-dim">
                    {deviceCode.verificationUri}
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="flex items-center gap-2 text-xs text-txt-dim">
                <Spinner size={12} /> {t("confirmWaiting")}
              </span>
              <Button size="sm" variant="ghost" onClick={cancelSignIn}>
                {t("cancelButton")}
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}

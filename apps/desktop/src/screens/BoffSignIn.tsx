import { useState } from "react"

import { Badge, Banner, Button, Icon, Kicker, Panel, Spinner } from "@boffmedia/ui"

import { useT } from "../i18n"
import { copyText, openUrl } from "../runtime"
import { useApp } from "../state/app"

// The launcher's own sign-in. The player is already signed in on the website,
// so authorising a short code there is all the proof either side needs — the
// launcher never handles a password and never opens a login form of its own.
//
// This replaced a Microsoft sign-in that gated the entire shell. Packs, events,
// entitlement and downloads are Boffmedia-level facts; requiring a paid
// Minecraft account before a GBA pack would even list was never justified.

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useT("boffSignin")
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

export function BoffSignIn() {
  const {
    boffSignIn,
    cancelBoffSignIn,
    boffSigningIn,
    boffDeviceCode,
    boffError,
    boffRestoreError,
    goBoffOffline,
  } = useApp()
  const t = useT("boffSignin")

  // A network-failed restore is the only case offline mode can rescue: a dead
  // session must be re-authorised, and a credential-store failure means the
  // stored token cannot be read either, so there is nothing to fall back to.
  const canPlayOffline =
    !!boffRestoreError && !boffRestoreError.needsSignin && boffRestoreError.code !== "store_error"
  const restoreTitle = boffRestoreError
    ? boffRestoreError.needsSignin
      ? t("restoreExpiredTitle")
      : boffRestoreError.code === "store_error"
        ? t("restoreStoreTitle")
        : t("restoreOfflineTitle")
    : ""

  return (
    <div className="grid h-full place-items-center px-8 py-10">
      <div className="w-full max-w-[520px]">
        <div className="mb-6 text-center">
          <Kicker>{t("kicker")}</Kicker>
          <h1 className="font-display text-[34px]/none font-bold uppercase tracking-[0.06em] text-txt">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm text-txt-muted">{t("subtitle")}</p>
          {/* The "browse tools without signing in" escape link lived here while
              this screen owned the whole window. It is gone with L3: this is now
              a PANEL inside the Play section, the rail is always beside it, and
              Tools is one click away from anywhere — including from here. */}
        </div>

        {boffRestoreError && !boffSigningIn && (
          <Banner tone="warn" title={restoreTitle} className="mb-4">
            {boffRestoreError.message}
          </Banner>
        )}

        {boffError && !boffSigningIn && (
          <Banner tone="warn" title={t("failedTitle")} className="mb-4">
            {boffError}
          </Banner>
        )}

        {!boffSigningIn && (
          <Panel>
            <div className="flex flex-col items-center gap-4 py-4">
              <span className="cut-seal grid h-14 w-14 place-items-center bg-accent text-accent-ink">
                <Icon name="key" size={26} />
              </span>
              <Button variant="pri" size="lg" icon="external" onClick={() => void boffSignIn()}>
                {t("button")}
              </Button>
              {canPlayOffline && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="play"
                    onClick={() => void goBoffOffline()}
                  >
                    {t("playOffline")}
                  </Button>
                  <p className="max-w-[380px] text-center text-xs text-txt-dim">
                    {t("playOfflineHint")}
                  </p>
                </>
              )}
              <p className="max-w-[380px] text-center text-xs text-txt-dim">{t("securityNote")}</p>
            </div>
          </Panel>
        )}

        {boffSigningIn && !boffDeviceCode && (
          <Panel>
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-txt-muted">
              <Spinner /> {t("consulting")}
            </div>
          </Panel>
        )}

        {boffSigningIn && boffDeviceCode && (
          <Panel title={t("complete")} aside={<Badge tone="warn">{t("waiting")}</Badge>}>
            <ol className="flex flex-col gap-4">
              <li className="flex gap-3">
                <span className="cut-seal grid h-6 w-6 shrink-0 place-items-center bg-accent text-[12px] font-bold text-accent-ink [--cut:5px]">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-sm text-txt">{t("copyCodeLabel")}</p>
                  {/* Selectable, so it works even if the clipboard is denied. */}
                  <div className="cut cut-edge-slant [--cut-line:var(--accent-line)] select-text border-2 border-solid border-accent-line bg-base-deep px-5 py-3 text-center font-display text-[30px]/none font-bold tracking-[0.24em] text-accent-bright">
                    {boffDeviceCode.userCode}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <CopyButton value={boffDeviceCode.userCode} label={t("copyCodeButton")} />
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="cut-seal grid h-6 w-6 shrink-0 place-items-center bg-accent text-[12px] font-bold text-accent-ink [--cut:5px]">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-txt">{t("browserStep")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="pri"
                      icon="external"
                      onClick={() => {
                        void openUrl(boffDeviceCode.verificationUri).catch(() => undefined)
                      }}
                    >
                      {t("browserButton")}
                    </Button>
                    <CopyButton value={boffDeviceCode.verificationUri} label={t("linkButton")} />
                  </div>
                  <p className="mt-2 select-text font-mono text-[11px] text-txt-dim">
                    {boffDeviceCode.verificationUri}
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="flex items-center gap-2 text-xs text-txt-dim">
                <Spinner size={12} /> {t("confirmWaiting")}
              </span>
              <Button size="sm" variant="ghost" onClick={cancelBoffSignIn}>
                {t("cancelButton")}
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}

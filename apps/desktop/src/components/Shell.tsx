import { Banner, Button } from "@boffmedia/ui"

import { useT } from "../i18n"
import { useApp } from "../state/app"
import { mapErrorCodeToI18nKey, getDiagnosticTitle } from "../utils/errorCodeToMessage"
import { AppRail } from "./nav/AppRail"

// The backend is not answering. Announced ONCE, where the loss is actually
// felt, and then it gets out of the way:
//
//   * Play only. Tools is fully offline-capable — every tool runs local — so a
//     banner there is pure tax on a screen that is working perfectly.
//   * Closable, and the dismissal sticks for the whole outage (see
//     `backendNoticeDismissed`). Without a close button, or reappearing on the
//     next navigation, it reads as the app shouting rather than informing.
//   * Shows diagnostic detail from error codes (DNS vs refused vs timeout vs 5xx).
//
// Nothing is hidden by closing it: `BackendIndicator` in the rail stays for as
// long as the outage does, as one icon instead of a paragraph.
//
//   down        — the API answered 5xx. Unambiguously theirs.
//   unreachable — nothing answered at all. It could be the server, it could be
//                 this machine's connection, and claiming either would be a
//                 guess — so the copy names both.
function ServerNotice() {
  const t = useT("shell")
  const { backendStatus, backendErrorCode, backendNoticeDismissed, retryBackend, dismissBackendNotice, packsLoading, section, go } =
    useApp()

  if (section !== "play") return null
  if (backendNoticeDismissed) return null
  if (backendStatus !== "down" && backendStatus !== "unreachable") return null

  // Get diagnostic title from error code (DNS, refused, timeout, 5xx, auth, store)
  const diagnosticTitle = getDiagnosticTitle(backendErrorCode, t)
  // Get diagnostic message from error code
  const messageKey = mapErrorCodeToI18nKey(backendErrorCode)
  const diagnosticMessage = t(messageKey)

  return (
    <Banner
      tone="warn"
      icon="alert"
      title={diagnosticTitle}
      className="m-4 mb-0"
      onClose={dismissBackendNotice}
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" icon="refresh" disabled={packsLoading} onClick={retryBackend}>
            {t("retryButton")}
          </Button>
          {/* Both of these carried no onClick when first written, which is the
              exact defect D4 describes — an action the user can press that does
              nothing. Logs navigates to the screen that already exists; the
              "open data folder" action was REMOVED rather than left inert,
              because the app exposes no command for its own data directory
              (instance_reveal is pack-scoped). Add it back with the Rust
              command, not before. */}
          <Button
            size="sm"
            variant="ghost"
            icon="list"
            onClick={() => go("logs")}
          >
            {t("diagnosticLogs")}
          </Button>
        </div>
      }
    >
      {diagnosticMessage}
    </Banner>
  )
}

// Two different degradations, and conflating them would mislead:
//
//   offline      — no network at all. The identity came from the roster, so
//                  only packs already on disk can be played.
//   packsPartial — we ARE online and signed in, but the pack registry did not
//                  answer. Local packs are all that loaded.
//
// Neither is an error: in both cases what is on screen works. The banner exists
// so a player does not think their packs have vanished.
function OfflineNotice() {
  const t = useT("shell")
  const {
    offline,
    packsPartial,
    reloadPacks,
    packsLoading,
    section,
    backendStatus,
    backendNoticeDismissed,
    dismissBackendNotice,
  } = useApp()

  // Both degradations are about the PACK LIBRARY. Now that the shell wraps every
  // section, showing "you can still play what you have installed" over the Tools
  // hub — which is fully offline-capable and has no packs — would be noise.
  if (section !== "play") return null
  // ServerNotice is already up and says the same thing more precisely. Two
  // stacked banners about one outage reads as two separate faults.
  if (backendStatus === "down" || backendStatus === "unreachable") return null
  // Shares ServerNotice's latch on purpose: these are one message to a player
  // ("you are working without the network"), so closing either closes the
  // subject, and coming back online re-arms both.
  if (backendNoticeDismissed) return null
  if (!offline && !packsPartial) return null

  return (
    <Banner
      tone="warn"
      icon="alert"
      title={offline ? t("offlineTitle") : t("partialTitle")}
      className="m-4 mb-0"
      onClose={dismissBackendNotice}
      actions={
        <Button size="sm" variant="ghost" icon="refresh" disabled={packsLoading} onClick={reloadPacks}>
          {t("retryButton")}
        </Button>
      }
    >
      {offline
        ? t("offlineMessage")
        : t("partialMessage")}
    </Banner>
  )
}

// The Titlebar is NOT rendered here — it lives at the App root so the splash
// and sign-in screens (which render outside Shell) keep a drag region and a
// close button on the frameless window.
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 bg-base-deep">
      <AppRail />

      {/* The single line between frame and content lives HERE, not on the
          titlebar or the rail — that is what makes the L-frame corner
          seamless: titlebar and rail share one unbroken surface, and the
          content reads as an inset panel with a rounded corner. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-tl-lg border-l border-t border-line bg-base">
        <ServerNotice />
        <OfflineNotice />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

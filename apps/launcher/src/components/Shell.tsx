import { Banner, Button } from "@boffmedia/ui"

import { useT } from "../i18n"
import { useLauncher } from "../state/launcher"
import { AppRail } from "./nav/AppRail"

// The backend is not answering. Announced ONCE, where the loss is actually
// felt, and then it gets out of the way:
//
//   * Play only. Tools is fully offline-capable — every tool runs local — so a
//     banner there is pure tax on a screen that is working perfectly, and it
//     was eating a chunk of it permanently.
//   * Closable, and the dismissal sticks for the whole outage (see
//     `backendNoticeDismissed`). It used to have no close button at all and to
//     reappear on the next navigation, which is the behaviour that made it feel
//     like the app shouting rather than informing.
//   * One line. The long explanation moved to the rail indicator's tooltip.
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
  const { backendStatus, backendNoticeDismissed, retryBackend, dismissBackendNotice, packsLoading, section } =
    useLauncher()

  if (section !== "play") return null
  if (backendNoticeDismissed) return null
  if (backendStatus !== "down" && backendStatus !== "unreachable") return null
  const isDown = backendStatus === "down"

  return (
    <Banner
      tone="warn"
      icon="alert"
      title={isDown ? t("serverDownTitle") : t("serverUnreachableTitle")}
      className="m-4 mb-0"
      onClose={dismissBackendNotice}
      actions={
        <Button size="sm" variant="ghost" icon="refresh" disabled={packsLoading} onClick={retryBackend}>
          {t("retryButton")}
        </Button>
      }
    >
      {isDown ? t("serverDownShort") : t("serverUnreachableShort")}
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
  } = useLauncher()

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

import { Banner, Button } from "@boffmedia/ui"

import { useT } from "../i18n"
import { useLauncher } from "../state/launcher"
import { GameRail } from "./nav/GameSidebar"

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
  const { offline, packsPartial, reloadPacks, packsLoading } = useLauncher()

  if (!offline && !packsPartial) return null

  return (
    <Banner
      tone="warn"
      icon="alert"
      title={offline ? t("offlineTitle") : t("partialTitle")}
      className="m-4 mb-0"
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
      <GameRail />

      {/* The single line between frame and content lives HERE, not on the
          titlebar or the rail — that is what makes the L-frame corner
          seamless: titlebar and rail share one unbroken surface, and the
          content reads as an inset panel with a rounded corner. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-tl-lg border-l border-t border-line bg-base">
        <OfflineNotice />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

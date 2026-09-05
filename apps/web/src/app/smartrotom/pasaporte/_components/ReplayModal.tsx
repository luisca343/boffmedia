"use client"

// DESK. The sheet is chrome — it is the officer's screen, not a page of the book.

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import type { UserAchievement } from "@boffmedia/shared"
import { Modal } from "./ui"

/**
 * Loaded on demand, and that is the whole point (audit S11).
 *
 * MEASURED: a static `import { Game } from "@boffmedia/tools-battlesim"` put
 * the battle engine and the full `@pkmn` dex — a 7.4 MB chunk plus a 1.8 MB
 * one — into this route's INITIAL client bundle. /smartrotom/pasaporte came to
 * ~11.9 MB of client JS against a ~1.15 MB median across the 125 SmartRotom
 * routes, roughly ten times its neighbours, and it was one of only two routes
 * anywhere near that size.
 *
 * Rendering the modal conditionally (`{replay && <ReplayModal/>}`) did nothing
 * about it: a conditional RENDER still requires a static IMPORT, so every
 * visitor to the passport downloaded a battle simulator whether or not they
 * ever opened a replay — and most never do, since it is behind a click on a
 * single badge.
 *
 * `ssr: false` because the player is a client-only surface (it owns a worker
 * and canvas state); there is nothing meaningful to render on the server.
 */
const Game = dynamic(
  () => import("@boffmedia/tools-battlesim").then((m) => m.Game),
  {
    ssr: false,
    loading: () => (
      <div
        className="grid h-[min(80dvh,44rem)] place-items-center"
        role="status"
        aria-live="polite"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
      </div>
    ),
  },
)

/**
 * The battle the badge was won with.
 *
 * `Game` is the real Showdown replay player the Battlesim already ships, and it loads the
 * replay itself from the achievement id — so the passport does not fetch it, does not
 * re-implement a player, and cannot drift from the one the rest of the site uses. It is a
 * feature, not a Boffmedia primitive, which is why importing it does not cross the
 * design-system boundary.
 */
export function ReplayModal({
  achievement,
  onClose,
}: {
  achievement: UserAchievement
  onClose: () => void
}) {
  const t = useTranslations("pasaporte")
  return (
    <Modal title={t("replayModal.title", { name: achievement.name })} onClose={onClose}>
      {/* `--tool-vh` is the box a tool is given, and the player is that box
          exactly (bar · field · transport · log rail). Inside a tool page the
          host sets it; here there is no host, so the sheet states it — without
          this the shell would fall back to a full `100dvh` inside the modal. */}
      <div className="bg-ps-desk-lo p-3" style={{ ["--tool-vh" as string]: "min(80dvh, 44rem)" }}>
        <Game battleName={achievement.id} />
      </div>
    </Modal>
  )
}

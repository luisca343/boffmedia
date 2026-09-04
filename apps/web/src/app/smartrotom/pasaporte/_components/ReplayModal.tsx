"use client"

// DESK. The sheet is chrome — it is the officer's screen, not a page of the book.

import { useTranslations } from "next-intl"
import type { UserAchievement } from "@boffmedia/shared"
import { Game } from "@boffmedia/tools-battlesim"
import { Modal } from "./ui"

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

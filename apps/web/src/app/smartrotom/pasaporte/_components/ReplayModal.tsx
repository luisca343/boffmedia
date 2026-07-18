"use client"

// DESK. The sheet is chrome — it is the officer's screen, not a page of the book.

import { useTranslations } from "next-intl"
import type { UserAchievement } from "@boffmedia/shared"
import { Game } from "@/app/battlesim/replay/_components/Game"
import { Modal } from "./ui"

/**
 * The battle the badge was won with.
 *
 * `Game` is the real Showdown replay player the Battlesim already ships, and it loads the
 * replay itself from the achievement id — so the passport does not fetch it, does not
 * re-implement a player, and cannot drift from the one the rest of the site uses. It is a
 * feature, not a Boffmedia primitive, which is why importing it does not cross the
 * design-system boundary (§3).
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
      <div className="bg-ps-desk-lo p-3">
        <Game battleName={achievement.id} />
      </div>
    </Modal>
  )
}

"use client"

import { useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { BoardProvider, useBoard } from "./_hooks/useBoard"
import type { NPC } from "./_types"
import { NpcDossier } from "./_components/NpcDossier"
import { QuestLetter } from "./_components/QuestLetter"
import { MobileRail, SideRail } from "./_components/SideRail"

/**
 * The tavern: a wooden rail, the board itself, and — over both — the letter that
 * slides in when an encargo is opened. The letter and the expediente live here
 * rather than on a page, because every one of the five screens can raise them.
 */
function Tavern({ children }: { children: ReactNode }) {
  const t = useTranslations("misiones.questLetter")
  const { openQuest, open } = useBoard()
  const [dossier, setDossier] = useState<NPC | null>(null)

  return (
    // The shell height is computed, not inherited: AppWrapper's `main` is a
    // `flex-1` child of a `min-h-screen` column, so a percentage `h-full` never
    // resolves and the tavern would collapse to its content. Same clamp as
    // Starbank / Notas / Taxi — the viewport minus the 3rem RotomNav.
    <div className="ms-tavern ms-app flex h-[calc(100dvh_-_3rem)] w-full min-w-0 flex-col overflow-hidden font-ms">
      <div className="relative flex min-h-0 flex-1">
        <SideRail />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <MobileRail />

          {/* The board takes the whole tavern: full width, full height. Screens
              stretch to fill it (each page root is `flex min-h-full flex-col`),
              so the cork never floats in a column with dead wood either side. */}
          <main className="ms-scroll relative z-[1] flex-1 overflow-auto px-5 py-7 sm:px-9">
            <div className="flex min-h-full w-full flex-col">{children}</div>
          </main>

          {openQuest && (
            <>
              <button
                type="button"
                aria-label={t("closeQuest")}
                onClick={() => open(null)}
                className="absolute inset-0 z-40 animate-ms-fade-up bg-[rgba(20,12,6,.5)] backdrop-blur-[2px] motion-reduce:animate-none"
              />
              <div className="absolute inset-y-0 right-0 z-50 w-full animate-ms-slide-in motion-reduce:animate-none sm:w-[min(760px,72%)]">
                <QuestLetter quest={openQuest} onOpenNpc={setDossier} />
              </div>
            </>
          )}
        </div>
      </div>

      {dossier && <NpcDossier npc={dossier} onClose={() => setDossier(null)} />}
    </div>
  )
}

export default function MisionesLayout({ children }: { children: ReactNode }) {
  return (
    <BoardProvider>
      <Tavern>{children}</Tavern>
    </BoardProvider>
  )
}

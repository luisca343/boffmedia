"use client"

import { useTranslations } from "next-intl"
import type { IDialogue, NPC, QuestData } from "../_types"
import { Button, FlourishCorners, Icon, Label, NpcPortrait, Paper, WaxSeal } from "./ui"

/** The paper's rest angle — deterministic per dialog, ±0.8°. */
function tiltFor(id: number) {
  return (((id * 13) % 100) / 100) * 1.6 - 0.8
}

/**
 * One entry of the Bitácora: a dialog line, who said it, where. A relative
 * timestamp ("Hace 12 min") has no source in the API, so it is not rendered —
 * same for the NPC's "role", which the game never sends.
 */
export function JournalEntry({
  dialog,
  npc,
  quest,
  onOpenQuest,
}: {
  dialog: IDialogue
  npc?: NPC
  quest?: QuestData
  onOpenQuest: (quest: QuestData) => void
}) {
  const t = useTranslations("misiones.journalEntry")
  return (
    <Paper tilt={tiltFor(dialog.id)} className="relative py-5 pl-[5.375rem] pr-6">
      <FlourishCorners size={20} offset={6} className="text-ms-gold-3/40" />

      <div className="absolute left-4 top-4">
        <NpcPortrait skin={npc?.skin} size={56} ring />
      </div>
      <div className="absolute -top-2.5 left-[3.75rem]">
        <WaxSeal glyph={(npc?.name || "?")[0]} color="rgb(var(--ms-seal-available))" size={32} tilt={-12} />
      </div>

      <div className="mb-2 flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <div className="font-ms-display text-lg text-ms-ink-1">{npc?.name ?? "?"}</div>
          <div className="font-ms text-xs italic text-ms-ink-3">{dialog.name}</div>
        </div>
      </div>

      <p className="my-2 border-l-2 border-ms-ink-3 pl-3.5 font-ms text-[0.9375rem] italic leading-[1.65] text-ms-ink-1">
        &ldquo;{dialog.text}&rdquo;
      </p>

      {quest && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-dashed border-ms-ink-3/30 pt-2.5">
          <Label>{t("relatedQuest")}</Label>
          <Button sm onClick={() => onOpenQuest(quest)}>
            <Icon.Scroll size={11} />
            {quest.name}
            <Icon.Arrow size={11} />
          </Button>
        </div>
      )}
    </Paper>
  )
}

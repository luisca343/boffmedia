"use client"

import { useEffect } from "react"
import { useBoard } from "../_hooks/useBoard"
import type { NPC, QuestData } from "../_types"
import { normalizeStatus, SEAL_TEXT, STATUS_LABEL } from "../_utils/status"
import { Button, Divider, FlourishCorners, Icon, Label, NpcPortrait, Paper, Thumbtack, WaxSeal } from "./ui"

/**
 * The expediente: everything the board knows about one NPC. All of it is real —
 * their quests are the ones whose `dialogId` is theirs, and the reinos they work
 * are the categories those quests belong to.
 */
export function NpcDossier({ npc, onClose }: { npc: NPC; onClose: () => void }) {
  const { quests, dialogs, open } = useBoard()

  const given = quests.filter((quest) => quest.dialogId === npc.dialogId)
  const dialog = dialogs.find((entry) => entry.id === npc.dialogId)
  const regions = [...new Set(given.map((quest) => quest.category).filter(Boolean))]

  const tally = [
    { label: "Encargos", value: given.length, className: "text-ms-ink-1" },
    { label: "Vigentes", value: given.filter((q) => normalizeStatus(q) === "ACTIVE").length, className: "text-ms-seal-active" },
    { label: "Cumplidos", value: given.filter((q) => normalizeStatus(q) === "COMPLETED").length, className: "text-ms-seal-completed" },
  ]

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const openQuest = (quest: QuestData) => {
    open(quest)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Expediente de ${npc.name}`}
      onClick={onClose}
      className="fixed inset-0 z-[120] grid place-items-center bg-[rgba(20,12,6,.82)] p-6 backdrop-blur-[4px]"
    >
      <Paper
        tilt={-0.5}
        onClick={(event) => event.stopPropagation()}
        className="ms-scroll relative max-h-[88vh] w-full max-w-[560px] overflow-auto px-[34px] py-[30px]"
      >
        <span className="absolute left-3 top-2.5">
          <Thumbtack size={18} />
        </span>
        <span className="absolute right-3 top-2.5">
          <Thumbtack size={18} />
        </span>
        <FlourishCorners size={30} offset={8} className="text-ms-gold-3/55" />

        <Button variant="ghost" sm onClick={onClose} className="absolute right-10 top-3.5">
          <Icon.X size={12} /> Cerrar
        </Button>

        <div className="mb-3.5 text-center">
          <Label className="justify-center tracking-[.34em] text-ms-seal-available">✦ Expediente ✦</Label>
          <div className="my-3 flex justify-center">
            <div className="relative">
              <NpcPortrait skin={npc.skin} size={104} ring full />
              <span className="absolute -bottom-2.5 -right-2.5">
                <WaxSeal glyph={(npc.name || "?").charAt(0)} size={38} tilt={-12} />
              </span>
            </div>
          </div>
          <h1 className="mb-0.5 mt-1.5 font-ms-display text-[32px] text-ms-ink-1">{npc.name}</h1>
          {regions.length > 0 && (
            <div className="inline-flex items-center gap-1 text-[13px] italic text-ms-ink-3">
              <Icon.Pin size={11} /> {regions.join(" · ")}
            </div>
          )}
        </div>

        <Divider glyph="❦" />

        <div className="my-4 grid grid-cols-3 gap-2.5">
          {tally.map((entry) => (
            <div key={entry.label} className="border border-ms-ink-1/20 bg-ms-ink-1/[.07] px-1 py-2 text-center">
              <div className={`font-ms-display text-[22px] leading-none ${entry.className}`}>{entry.value}</div>
              <Label className="mt-1">{entry.label}</Label>
            </div>
          ))}
        </div>

        {dialog?.text && (
          <p className="mb-[18px] border-l-2 border-ms-ink-3 pl-3 text-sm italic leading-relaxed text-ms-ink-1">
            “{dialog.text}”
          </p>
        )}

        <Label className="mb-2">Encargos de {npc.name.split(" ")[0]}</Label>
        <div className="flex flex-col gap-2">
          {given.map((quest) => {
            const status = normalizeStatus(quest)
            const level = quest.requirements?.requiredLevel
            return (
              <button
                key={quest.id}
                type="button"
                onClick={() => openQuest(quest)}
                className="flex items-center gap-2.5 rounded-sm border border-ms-ink-1/20 bg-[rgba(255,240,200,.4)] px-2.5 py-2 text-left hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ms-gold-2"
              >
                <WaxSeal status={status} size={26} tilt={-10} />
                <span className="min-w-0 flex-1">
                  <span className="block font-ms-display text-sm leading-[1.15] text-ms-ink-1">{quest.name}</span>
                  <span className={`block text-[11px] ${SEAL_TEXT[status]}`}>
                    {STATUS_LABEL[status]}
                    {level > 0 && ` · Nv. ${level}`}
                  </span>
                </span>
                <Icon.Arrow size={13} />
              </button>
            )
          })}
          {given.length === 0 && (
            <p className="text-center text-sm italic text-ms-ink-3">Aún no tiene encargos en el tablón.</p>
          )}
        </div>
      </Paper>
    </div>
  )
}

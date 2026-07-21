"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Modal, toast } from "@/components/boffmedia/primitives"
import { TM_CARD, TM_CARD_HEAD, TM_CARD_H3 } from "@/components/boffmedia/ui/tournaments"
import { TournamentsService, type TnMonApi } from "@/services/api/boffmedia/tournamentsService"
import { parseShowdownPaste } from "@/features/vgc-tracker/showdown-parse"

export function MyTeamsheetCard({ tournamentId }: { tournamentId: number }) {
  const t = useTranslations("torneos.teamsheet")
  const [open, setOpen] = React.useState(false)
  const [paste, setPaste] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const parsed = React.useMemo(() => (paste.trim() ? parseShowdownPaste(paste) : []), [paste])

  const save = async () => {
    if (!parsed.length) return toast.error(t("validationPaste"))
    setBusy(true)
    const mons: TnMonApi[] = parsed.map((s, i) => ({
      slot: i + 1,
      name: s.speciesName,
      item: s.item,
      ability: s.ability,
      tera: s.teraType,
      moves: s.moves.slice(0, 4),
    }))
    const r = await TournamentsService.setTeamsheet(tournamentId, mons)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else {
      toast.success(t("toastOk"))
      setOpen(false)
      setPaste("")
    }
  }

  return (
    <section className={TM_CARD}>
      <div className={TM_CARD_HEAD}>
        <h3 className={TM_CARD_H3}>{t("title")}</h3>
        <Button size="sm" icon="edit" onClick={() => setOpen(true)}>{t("update")}</Button>
      </div>
      <p className="m-0 flex items-center gap-2 p-4 font-body text-[12px]/[1.5] text-txt-muted">
        <Icon name="info" size={12} className="flex-none" />
        {t("info")}
      </p>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("title")}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-txt-dim">{parsed.length ? t("parsedCount", { count: parsed.length }) : t("formatHint")}</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button variant="pri" size="sm" disabled={busy || !parsed.length} onClick={save}>{t("save")}</Button>
            </div>
          </div>
        }
      >
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={12}
          placeholder={"Incineroar @ Safety Goggles\nAbility: Intimidate\nTera Type: Ghost\n- Fake Out\n- Flare Blitz\n…"}
          className="w-full resize-y border border-solid border-line bg-base px-3 py-2 font-mono text-[12px] leading-[1.5]"
        />
      </Modal>
    </section>
  )
}

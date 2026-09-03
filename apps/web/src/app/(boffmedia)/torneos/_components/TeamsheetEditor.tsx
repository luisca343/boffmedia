"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, IconButton, Modal, toast } from "@boffmedia/ui"
import { TmMonCard } from "@/components/boffmedia/ui/tournaments"
import {
  TournamentsService,
  type TnMonApi,
} from "@/services/api/boffmedia/tournamentsService"
import { parseShowdownPaste } from "@boffmedia/tools-pokemon"

/**
 * Mons → the Showdown export they came from.
 *
 * Only the fields the teamsheet stores round-trip (EVs, natures and nicknames
 * were never kept), which is enough: the sheet is what the opponent is shown,
 * not a battle-ready import.
 */
export function monsToPaste(mons: TnMonApi[]): string {
  return mons
    .map((m) =>
      [
        m.item ? `${m.name} @ ${m.item}` : m.name,
        m.ability ? `Ability: ${m.ability}` : null,
        m.tera ? `Tera Type: ${m.tera}` : null,
        ...m.moves.map((mv) => `- ${mv}`),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
}

/**
 * The one place a player writes their teamsheet.
 *
 * The server takes it from any registered participant until the tournament
 * goes live — an entry deadline resolving the field does not close the door —
 * so this belongs on the tournament page. By the time a match page exists the
 * sheet is frozen and every save would be refused.
 */
export function TeamsheetButton({
  tournamentId,
  sheet,
  onSaved,
  variant,
}: {
  tournamentId: number
  sheet: TnMonApi[] | null
  onSaved?: () => void
  variant?: "pri" | "default"
}) {
  const t = useTranslations("torneos.teamsheet")
  const [open, setOpen] = React.useState(false)
  const [paste, setPaste] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const has = (sheet?.length ?? 0) > 0

  const parsed = React.useMemo(
    () => (paste.trim() ? parseShowdownPaste(paste) : []),
    [paste],
  )

  // Prefill from what is stored, on every open: saving replaces the whole
  // sheet, so an empty box would quietly wipe a team the player already sent.
  const start = () => {
    setPaste(sheet?.length ? monsToPaste(sheet) : "")
    setOpen(true)
  }

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
    if (r.error) return toast.error(r.error)
    toast.success(t("toastOk"))
    setOpen(false)
    onSaved?.()
  }

  return (
    <>
      <Button
        size="sm"
        variant={variant ?? (has ? "default" : "pri")}
        icon={has ? "edit" : "upload"}
        onClick={start}
      >
        {has ? t("update") : t("submit")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("title")}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[0.6875rem] text-txt-dim">
              {parsed.length ? t("parsedCount", { count: parsed.length }) : t("formatHint")}
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button variant="pri" size="sm" disabled={busy || !parsed.length} onClick={save}>
                {t("save")}
              </Button>
            </div>
          </div>
        }
      >
        <p className="mb-3 font-body text-[0.78125rem] leading-[1.5] text-txt-muted">
          {t("info")}
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={12}
          placeholder={"Incineroar @ Safety Goggles\nAbility: Intimidate\nTera Type: Ghost\n- Fake Out\n- Flare Blitz\n…"}
          className="w-full resize-y border border-solid border-line bg-base px-3 py-2 font-mono text-[0.75rem] leading-[1.5]"
        />
      </Modal>
    </>
  )
}

/**
 * The sheet as the mon cards used everywhere else a teamsheet is shown, so a
 * player checks their own list in the same format their opponent will read it.
 */
export function TeamsheetGrid({ mons }: { mons: TnMonApi[] }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1">
      {mons.map((m, i) => (
        <TmMonCard
          key={m.slot ?? i}
          mon={{
            slot: m.slot,
            dex: m.dex,
            name: m.name,
            // TmMon wants both filled; an em dash is what the match page shows
            // for a mon submitted without an item or a tera type.
            item: m.item ?? "—",
            ability: m.ability,
            tera: m.tera ?? "—",
            moves: m.moves,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Read a submitted team in full, without opening the paste editor. Pass `name`
 * when the sheet is someone else's — the modal is titled "my team" otherwise,
 * and this button is reused for opponents' sheets on an open-teamsheet
 * tournament and for every entrant in the admin panel.
 */
export function TeamsheetViewButton({
  sheet,
  name,
  compact,
}: {
  sheet: TnMonApi[] | null
  name?: string
  /** Icon-only, for table rows where a labelled button would not fit. */
  compact?: boolean
}) {
  const t = useTranslations("torneos.teamsheet")
  const [open, setOpen] = React.useState(false)
  if (!sheet?.length) return null

  return (
    <>
      {compact ? (
        <IconButton size="sm" variant="ghost" name="eye" label={t("view")} onClick={() => setOpen(true)} />
      ) : (
        <Button size="sm" icon="eye" onClick={() => setOpen(true)}>
          {t("view")}
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={name ? t("ofPlayer", { name }) : t("title")}
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setOpen(false)}>{t("close")}</Button>
          </div>
        }
      >
        <TeamsheetGrid mons={sheet} />
      </Modal>
    </>
  )
}

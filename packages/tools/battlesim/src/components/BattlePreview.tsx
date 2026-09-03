"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, cn } from "@boffmedia/ui"
import { useToolT, BATTLESIM_NS } from "../i18n"
import { BxSlot, BxUnknownSlot, BxRing } from "./bx-kit"
import { BsimSection } from "./bsim-kit"
import type { BSXMon } from "../engine/toBSXMon"

interface BattlePreviewProps {
  /** Your team, in the request's order (index + 1 is the `team` slot number). */
  team: BSXMon[]
  /** The opponent's revealed species (types only). */
  foeTeam: BSXMon[]
  /** Slots the opponent has not revealed yet — rendered as unknown chips. */
  foeUnknown?: number
  /** How many to bring; defaults to the whole team. */
  picks?: number
  /** How many lead: 1 singles, 2 doubles. */
  leads: number
  timer?: number | null
  timerMax?: number
  youName?: string
  foeName?: string
  onConfirm: (order: number[]) => void
}

/**
 * Team preview as a real lead picker. Click (or press 1–6) to number your
 * Pokémon in the order they will be sent; the first `leads` are the field.
 * Confirm fills whatever you left unordered with the default order, so one
 * click on your lead is enough in singles.
 */
export function BattlePreview({ team, foeTeam, foeUnknown = 0, picks, leads, timer, timerMax = 60, youName, foeName, onConfirm }: BattlePreviewProps) {
  const t = useToolT(BATTLESIM_NS)
  const total = team.length
  const wanted = Math.min(picks ?? total, total)
  const [order, setOrder] = useState<number[]>([])

  const toggle = (slot: number) => {
    setOrder((prev) => {
      if (prev.includes(slot)) return prev.filter((s) => s !== slot)
      if (prev.length >= wanted) return prev
      return [...prev, slot]
    })
  }

  const finalOrder = useMemo(() => {
    const rest = team.map((_, i) => i + 1).filter((s) => !order.includes(s))
    return [...order, ...rest].slice(0, wanted)
  }, [order, team, wanted])

  const confirm = () => onConfirm(finalOrder)
  const useDefault = () => onConfirm(team.map((_, i) => i + 1).slice(0, wanted))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
      if (e.key >= "1" && e.key <= "6") {
        const slot = parseInt(e.key, 10)
        if (slot <= total) { e.preventDefault(); toggle(slot) }
      } else if (e.key === "Enter") {
        e.preventDefault(); confirm()
      } else if (e.key === "Escape") {
        setOrder([])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, total, leads, finalOrder])

  return (
    <div role="dialog" aria-modal="false" aria-label={t("battle.preview.title")} className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-base/90 p-3 backdrop-blur-[3px] sm:p-5">
      <div className="mx-auto flex w-full max-w-[57.5rem] min-[2240px]:max-w-[75rem] flex-col gap-3 animate-[bm-modal-in_260ms_ease_both] motion-reduce:animate-none">
        <BsimSection
          kicker={t("battle.preview.picked", { n: order.length, picks: wanted })}
          icon="layers"
          title={t("battle.preview.title")}
          aside={timer != null ? (
            <span className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-txt-dim">
              <span className="hidden sm:inline">{t("battle.preview.timeLeft")}</span>
              <BxRing sec={timer} max={timerMax} size={36} label={t("battle.preview.timeLeft")} />
            </span>
          ) : undefined}
        >
          <p className="m-0 mb-3 font-body text-[0.8125rem] leading-[1.45] text-txt-muted">
            {leads > 1 ? t("battle.preview.leadDoubles", { picks: wanted, leads }) : t("battle.preview.leadSingles")}
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid content-start gap-2">
              <h4 className="m-0 flex items-center gap-2 font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">
                <i aria-hidden className="h-2 w-2 bg-accent" />{t("battle.preview.yourTeam")}{youName ? ` · ${youName}` : ""}
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 min-[1600px]:grid-cols-4">
                {team.map((mon, i) => {
                  const slot = i + 1
                  const pos = order.indexOf(slot)
                  const picked = pos !== -1
                  const isLead = picked && pos < leads
                  return (
                    <BxSlot
                      key={mon.id + i}
                      mon={mon}
                      order={picked ? pos + 1 : undefined}
                      selected={picked}
                      dim={!picked && order.length >= wanted}
                      onClick={() => toggle(slot)}
                      label={`${mon.name}${picked ? `, ${pos + 1}` : ""}${isLead ? `, ${t("battle.preview.lead")}` : ""}`}
                      aside={isLead ? <b className="flex-none bg-accent-soft px-[0.3125rem] py-[3px] font-mono text-[0.5rem] font-bold uppercase leading-none tracking-[0.1em] text-accent-bright">{t("battle.preview.lead")}</b> : <kbd className="flex-none font-mono text-[0.59375rem] text-txt-dim">{slot}</kbd>}
                    />
                  )
                })}
              </div>
            </div>
            <div className="grid content-start gap-2">
              <h4 className="m-0 flex items-center gap-2 font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">
                <i aria-hidden className="h-2 w-2 bg-bad" />{t("battle.preview.foeTeam")}{foeName ? ` · ${foeName}` : ""}
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 min-[1600px]:grid-cols-4">
                {foeTeam.map((mon, i) => <BxSlot key={mon.id + i} mon={{ name: mon.species || mon.name, types: mon.types, species: mon.species }} />)}
                {Array.from({ length: Math.max(0, foeUnknown) }, (_, i) => <BxUnknownSlot key={"unk" + i} />)}
                {foeTeam.length === 0 && foeUnknown === 0 && (
                  <span className="col-span-full font-mono text-[0.6875rem] text-txt-dim">{t("battle.preview.foeHidden")}</span>
                )}
              </div>
            </div>
          </div>

          <div className={cn("mt-4 flex flex-wrap items-center gap-2 border-t border-solid border-line pt-4")}>
            <Button variant="pri" size="lg" icon="sword" onClick={confirm}>{t("battle.preview.confirm")}</Button>
            {/* With nothing picked the primary already SENDS the default order, so
                the explicit alternative only earns its place once picking has
                started — as "discard what I chose", which the primary is not. */}
            {order.length > 0 && <Button variant="ghost" onClick={useDefault}>{t("battle.preview.defaultOrder")}</Button>}
            {order.length > 0 && <Button variant="ghost" size="sm" onClick={() => setOrder([])}>{t("battle.preview.clear")}</Button>}
            <span className="flex-1" />
            <span className="font-mono text-[0.625rem] uppercase leading-none tracking-[0.1em] text-txt-dim">
              {order.length === 0 ? t("battle.preview.hintDefault") : t("battle.preview.hintPicked", { n: order.length })}
            </span>
          </div>
        </BsimSection>
      </div>
    </div>
  )
}

export default BattlePreview

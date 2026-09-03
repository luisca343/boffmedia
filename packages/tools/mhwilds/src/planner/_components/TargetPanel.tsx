"use client"

import * as React from "react"
import { useToolT } from "../../i18n"
import { Button, Icon } from "@boffmedia/ui"
import { MhMonster, Weapon } from "../../types"
import { MhPanel, MhLabel } from "../../ui/mh-kit"
import { elementColor, weaponAttack } from "../../ui/mh-helpers"
import { getAllWeaponElements } from "./equipment-utils"

export function TargetPanel({
  target,
  weapons,
  currentWeaponId,
  onPick,
  onClear,
  onEquipWeapon,
}: {
  target: MhMonster | null
  weapons: Weapon[]
  currentWeaponId: string | null
  onPick: () => void
  onClear: () => void
  onEquipWeapon: (id: string) => void
}) {
  const t = useToolT("tools.mhwilds")

  // element → weakness level (higher = weaker), from the target's real weaknesses
  const weakByElement = React.useMemo(() => {
    const m: Record<string, number> = {}
    if (target) {
      target.weaknesses
        .filter((w) => w.kind === "element" && w.element)
        .forEach((w) => {
          const el = w.element!.toLowerCase()
          m[el] = Math.max(m[el] ?? 0, w.level ?? 1)
        })
    }
    return m
  }, [target])

  // real weapons whose (non-hidden) element the monster is weak to, best first
  const suggestions = React.useMemo(() => {
    if (!target || Object.keys(weakByElement).length === 0) return []
    return weapons
      .map((w) => {
        const { elements } = getAllWeaponElements(w)
        const el = elements.find((e) => !e.hidden && weakByElement[e.type.toLowerCase()] != null)
        return el ? { w, el, level: weakByElement[el.type.toLowerCase()] } : null
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.level - a.level || b.el.damage - a.el.damage || weaponAttack(b.w) - weaponAttack(a.w))
      .slice(0, 5)
  }, [target, weapons, weakByElement])

  if (!target) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="flex w-full items-center gap-3 border border-line bg-panel px-3.5 py-3 text-left transition-colors cut-corner cut-corner-edge hover:border-[var(--mh)] hover:[--cut-line:var(--mh)]"
      >
        <Icon name="skull" size={16} className="shrink-0 text-[var(--mh-bright)]" />
        <span className="grid min-w-0 gap-0.5">
          <b className="font-display text-[0.875rem] leading-tight font-bold uppercase">{t("build_planner.target.ctaTitle")}</b>
          <span className="font-mono text-[0.6875rem] leading-none text-txt-muted">{t("build_planner.target.ctaLead")}</span>
        </span>
        <Icon name="chevronRight" size={15} className="ml-auto shrink-0 text-txt-dim" />
      </button>
    )
  }

  const weaks = target.weaknesses.filter((w) => w.kind === "element" && w.element)

  return (
    <MhPanel
      title={t("build_planner.target.title")}
      icon="skull"
      aside={
        <button
          type="button"
          onClick={onClear}
          aria-label={t("build_planner.target.clear")}
          className="grid h-6 w-6 place-items-center text-txt-dim hover:text-bad"
        >
          <Icon name="x" size={13} />
        </button>
      }
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[0.9375rem] leading-tight font-bold uppercase not-italic">{target.name}</div>
          <div className="truncate font-mono text-[0.6875rem] leading-none text-txt-muted">{target.species}</div>
        </div>
        <Button size="sm" variant="ghost" icon="edit" onClick={onPick}>
          {t("build_planner.target.change")}
        </Button>
      </div>

      <MhLabel className="mt-3">{t("build_planner.target.weakTo")}</MhLabel>
      {weaks.length ? (
        <div className="flex flex-wrap gap-1.5">
          {weaks.map((w) => (
            <span
              key={w.id}
              className="inline-flex items-center gap-1.5 border border-line bg-base-2 px-2 py-1 font-mono text-[0.6875rem] leading-none"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: elementColor(w.element!) }} />
              {t(w.element!)}
              {w.level ? ` ${"★".repeat(w.level)}` : ""}
            </span>
          ))}
        </div>
      ) : (
        <div className="font-mono text-[0.6875rem] text-txt-dim">{t("build_planner.target.no_elem_weak")}</div>
      )}

      <MhLabel className="mt-3.5">{t("build_planner.target.recommended")}</MhLabel>
      {suggestions.length === 0 ? (
        <div className="font-mono text-[0.75rem] leading-snug text-txt-dim">{t("build_planner.target.no_suggestions")}</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {suggestions.map(({ w, el, level }) => (
            <div key={w.id} className="flex items-center gap-2.5 border border-line bg-base-2 px-2.5 py-2">
              <span className="grid h-7 w-7 flex-none place-items-center border border-line bg-panel">
                <Icon name="sword" size={14} className="text-txt-muted" />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-display text-[0.8125rem] leading-tight font-bold uppercase not-italic">{w.name}</span>
                <span className="font-mono text-[0.65625rem] leading-none" style={{ color: elementColor(el.type) }}>
                  {t(el.type)} {el.damage} · {"★".repeat(level)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onEquipWeapon(String(w.id))}
                title={t("build_planner.target.equip")}
                className="grid h-8 w-8 flex-none place-items-center border border-line-2 text-txt-muted transition-colors hover:border-[var(--mh)] hover:text-[var(--mh-bright)]"
              >
                <Icon name={String(w.id) === currentWeaponId ? "check" : "plus"} size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3.5">
        <Button size="sm" variant="ghost" icon="skull" href="/mhwilds/monsters">
          {t("build_planner.target.bestiary")}
        </Button>
      </div>
    </MhPanel>
  )
}

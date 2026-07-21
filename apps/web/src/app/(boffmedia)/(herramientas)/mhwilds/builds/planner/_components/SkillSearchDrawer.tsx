"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Empty, Icon } from "@/components/boffmedia/primitives"
import { ArmorPiece, Charm, Decoration, EquipmentType } from "@/types/tools/mhwilds"
import { MhDrawer, MhSearch, MhTag } from "../../../_components/ui/mh-kit"

export type SkillSource =
  | { kind: "armor"; slot: EquipmentType; item: ArmorPiece; level: number }
  | { kind: "charm"; item: Charm; level: number }
  | { kind: "decoration"; item: Decoration; level: number; decoSlot: number }

interface SkillEntry {
  id: string
  name: string
  sources: SkillSource[]
}

function skillIdName(sr: any): { id: string; name: string } | null {
  const id = sr?.skill?.id ?? sr?.id
  const name = sr?.skill?.name ?? sr?.name
  return name ? { id: String(id), name } : null
}

export function SkillSearchDrawer({
  armor,
  charms,
  decorations,
  onEquip,
  onClose,
}: {
  armor: ArmorPiece[]
  charms: Charm[]
  decorations: Decoration[]
  onEquip: (src: SkillSource) => void
  onClose: () => void
}) {
  const t = useTranslations("mhwilds")
  const [q, setQ] = React.useState("")
  const [selected, setSelected] = React.useState<string | null>(null)

  // reverse index: skill name → every piece / charm / decoration that grants it
  const index = React.useMemo(() => {
    const map = new Map<string, SkillEntry>()
    const add = (sr: any, src: SkillSource) => {
      const info = skillIdName(sr)
      if (!info) return
      const entry = map.get(info.name) ?? { id: info.id, name: info.name, sources: [] }
      entry.sources.push(src)
      map.set(info.name, entry)
    }
    armor.forEach((a) => (a.skills || []).forEach((sr: any) => add(sr, { kind: "armor", slot: a.kind as EquipmentType, item: a, level: sr.level })))
    charms.forEach((c) => (c.skills || []).forEach((sr: any) => add(sr, { kind: "charm", item: c, level: sr.level })))
    decorations.forEach((d) => (d.skills || []).forEach((sr: any) => add(sr, { kind: "decoration", item: d, level: sr.level, decoSlot: (d as any).slot ?? 1 })))
    return map
  }, [armor, charms, decorations])

  const skills = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    return Array.from(index.values())
      .filter((s) => !term || s.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [index, q])

  const sel = selected ? index.get(selected) : null

  return (
    <MhDrawer
      iconName="search"
      title={t("build_planner.skillsearch.title")}
      sub={t("build_planner.skillsearch.sub")}
      onClose={onClose}
      tools={!sel ? <MhSearch value={q} onChange={setQ} placeholder={t("build_planner.skillsearch.placeholder")} /> : undefined}
    >
      {sel ? (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1.5 self-start font-mono text-[11px] uppercase tracking-[0.08em] text-txt-muted hover:text-txt"
          >
            <Icon name="back" size={13} />
            {t("build_planner.skillsearch.all")}
          </button>
          <div className="font-display text-[16px] leading-tight font-bold uppercase not-italic">{sel.name}</div>
          <div className="flex flex-col gap-1.5">
            {sel.sources
              .slice()
              .sort((a, b) => b.level - a.level)
              .map((src, i) => (
                <div key={i} className="flex items-center gap-2.5 border border-line bg-base-2 px-2.5 py-2">
                  <span className="grid h-7 w-7 flex-none place-items-center border border-line bg-panel">
                    <Icon name={src.kind === "armor" ? "shield" : "sparkles"} size={13} className="text-txt-muted" />
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-display text-[13px] leading-tight font-bold uppercase not-italic">{src.item.name}</span>
                    <span className="font-mono text-[10.5px] leading-none text-txt-muted">
                      {t(`build_planner.skillsearch.kind_${src.kind}`)} · +{src.level}
                      {src.kind === "decoration" ? ` · ${t("build_planner.slots")} ${src.decoSlot}` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onEquip(src)}
                    title={t("build_planner.target.equip")}
                    className="grid h-8 w-8 flex-none place-items-center border border-line-2 text-txt-muted transition-colors hover:border-[var(--mh)] hover:text-[var(--mh-bright)]"
                  >
                    <Icon name="plus" size={13} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : skills.length === 0 ? (
        <Empty icon="search" title={t("build_planner.no_results")} lead={t("build_planner.skillsearch.empty")} />
      ) : (
        <div className="flex flex-col gap-1">
          {skills.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setSelected(s.name)}
              className="flex items-center gap-3 border border-line bg-base-2 px-3 py-2.5 text-left transition-colors hover:border-[var(--mh)]"
            >
              <span className="min-w-0 flex-1 truncate font-display text-[14px] leading-tight font-bold uppercase not-italic">{s.name}</span>
              <MhTag>{t("build_planner.skillsearch.sourceCount", { count: s.sources.length })}</MhTag>
              <Icon name="arrow" size={14} className="shrink-0 text-txt-dim" />
            </button>
          ))}
        </div>
      )}
    </MhDrawer>
  )
}

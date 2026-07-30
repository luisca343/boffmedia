"use client"

import { useTranslations } from "next-intl"
import { Button } from "@boffmedia/ui"
import { BuildData, EquipmentType } from "@/types/tools/mhwilds"
import { MhSlot, MhDecoSocket, MhRing } from "../../../_components/ui/mh-kit"
import type { SlotDef } from "./PlannerView"

export function Loadout({
  slots, build, filled, total, skills, attack, defense, onSwap, onOpenEquip, onOpenDeco, onClearDeco,
}: {
  slots: SlotDef[]; build: BuildData; filled: number; total: number; skills: number; attack: number; defense: number
  onSwap: () => void
  onOpenEquip: (slot: EquipmentType) => void
  onOpenDeco: (slot: EquipmentType, idx: number, size: number) => void
  onClearDeco: (slot: EquipmentType, idx: number) => void
}) {
  const t = useTranslations("mhwilds")
  const pct = Math.round((filled / total) * 100)

  const decoFor = (slot: EquipmentType, idx: number) =>
    build.decorations.find((d) => d.equipmentType === slot && d.slotIndex === idx)?.decoration || null

  return (
    <div className="flex flex-col gap-3">
      {/* header strip */}
      <div className="flex items-center gap-3.5 flex-wrap py-[13px] px-4 bg-panel border border-line border-l-[3px] border-l-[var(--mh)]">
        <div className="flex items-center gap-[9px]">
          <MhRing pct={pct} label={`${filled}/${total}`} />
          <div className="flex flex-col gap-0.5">
            <b className="font-display text-[15px] leading-none font-bold uppercase tracking-[0.02em] not-italic">{t("equipment")}</b>
            <span className="font-mono text-[11px] leading-tight text-txt-muted">{t("build_planner.skill_count", { count: skills })}</span>
          </div>
        </div>
        <div className="flex gap-4 ml-auto">
          <div className="text-right">
            <b className="block font-display text-[20px] leading-none italic font-extrabold text-[#ff7a5c]">{attack}</b>
            <span className="font-mono text-[10px] leading-none uppercase tracking-[0.06em] text-txt-dim">{t("attack")}</span>
          </div>
          <div className="text-right">
            <b className="block font-display text-[20px] leading-none italic font-extrabold text-[var(--info)]">{defense}</b>
            <span className="font-mono text-[10px] leading-none uppercase tracking-[0.06em] text-txt-dim">{t("defense")}</span>
          </div>
        </div>
      </div>

      {slots.map((s) => {
        const item: any = build[s.key]
        const slotSizes: number[] = item?.slots || []
        const isWeaponSlot = s.key === "weapon" || s.key === "secondaryWeapon"
        return (
          <div key={s.key}>
            <div className="relative">
              <MhSlot
                icon={s.icon}
                kind={t(s.labelKey)}
                name={item ? item.name : t("build_planner.no_equipment", { name: t(s.labelKey) })}
                rarity={item?.rarity}
                filled={!!item}
                active={false}
                onOpen={() => onOpenEquip(s.key)}
              />
              {s.key === "secondaryWeapon" && (build.weapon || build.secondaryWeapon) && (
                <Button size="sm" variant="ghost" icon="swap" onClick={onSwap} className="absolute right-1 top-1/2 -translate-y-1/2 z-[1]">
                  {t("build_planner.swap")}
                </Button>
              )}
            </div>
            {item && slotSizes.some((x) => x > 0) && (
              <div className="flex flex-col gap-1 mt-1 ml-14 pb-1">
                {slotSizes.map((size, idx) => size > 0 && (
                  <MhDecoSocket
                    key={idx}
                    size={size}
                    decoName={decoFor(s.key, idx)?.name}
                    decoSlot={decoFor(s.key, idx)?.slot}
                    onOpen={() => onOpenDeco(s.key, idx, size)}
                    onClear={() => onClearDeco(s.key, idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

"use client"

import { useToolT } from "../../i18n"
import { Button } from "@boffmedia/ui"
import { BuildData, EquipmentType, Weapon } from "../../types"
import { MhSlot, MhDecoSocket, MhRing } from "../../ui/mh-kit"
import { getArmorImagePath, getCharmImagePath, getDecorationColorFilterStyle, getDecorationImagePath, getDecorationSlotImagePath, getRarityFilterStyle, getWeaponTypeIcon } from "./equipment-utils"
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
  const t = useToolT("tools.mhwilds")
  const pct = Math.round((filled / total) * 100)

  const decoFor = (slot: EquipmentType, idx: number) =>
    build.decorations.find((d) => d.equipmentType === slot && d.slotIndex === idx)?.decoration || null

  return (
    <div className="flex flex-col gap-3">
      {/* header strip */}
      <div className="flex items-center gap-3.5 flex-wrap py-[0.8125rem] px-4 bg-panel border border-line border-l-[3px] border-l-[var(--mh)]">
        <div className="flex items-center gap-[0.5625rem]">
          <MhRing pct={pct} label={`${filled}/${total}`} />
          <div className="flex flex-col gap-0.5">
            <b className="font-display text-[0.9375rem] leading-none font-bold uppercase tracking-[0.02em] not-italic">{t("equipment")}</b>
            <span className="font-mono text-[0.6875rem] leading-tight text-txt-muted">{t("build_planner.skill_count", { count: skills })}</span>
          </div>
        </div>
        <div className="flex gap-4 ml-auto">
          <div className="text-right">
            <b className="block font-display text-[1.25rem] leading-none italic font-extrabold text-[#ff7a5c]">{attack}</b>
            <span className="font-mono text-[0.625rem] leading-none uppercase tracking-[0.06em] text-txt-dim">{t("attack")}</span>
          </div>
          <div className="text-right">
            <b className="block font-display text-[1.25rem] leading-none italic font-extrabold text-[var(--info)]">{defense}</b>
            <span className="font-mono text-[0.625rem] leading-none uppercase tracking-[0.06em] text-txt-dim">{t("defense")}</span>
          </div>
        </div>
      </div>

      {slots.map((s) => {
        const item: any = build[s.key]
        const slotSizes: number[] = item?.slots || []
        const isWeaponSlot = s.key === "weapon" || s.key === "secondaryWeapon"
        const imageSrc = s.key === "charm"
          ? getCharmImagePath(item?.rarity)
          : isWeaponSlot
            ? getWeaponTypeIcon((item as Weapon | null)?.kind || (item as Weapon | null)?.type || "great-sword")
            : getArmorImagePath(s.key)
        const imageFilter = s.key === "charm" ? undefined : getRarityFilterStyle(item?.rarity ?? 0)
        return (
          <div key={s.key}>
            <div className={s.key === "secondaryWeapon" && (build.weapon || build.secondaryWeapon) ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1" : undefined}>
              <MhSlot
                icon={s.icon}
                imageSrc={imageSrc}
                imageAlt={item ? t(s.labelKey) : undefined}
                imageFilter={imageFilter}
                kind={t(s.labelKey)}
                name={item ? item.name : t("build_planner.no_equipment", { name: t(s.labelKey) })}
                rarity={item?.rarity}
                filled={!!item}
                active={false}
                onOpen={() => onOpenEquip(s.key)}
              />
              {s.key === "secondaryWeapon" && (build.weapon || build.secondaryWeapon) && (
                <Button size="sm" variant="ghost" icon="swap" onClick={onSwap} className="shrink-0">
                  {t("build_planner.swap")}
                </Button>
              )}
            </div>
            {item && slotSizes.some((x) => x > 0) && (
              <div className="flex flex-col gap-1 mt-1 ml-14 pb-1">
                {slotSizes.map((size, idx) => {
                  if (size <= 0) return null
                  const deco = decoFor(s.key, idx)
                  return (
                    <MhDecoSocket
                      key={idx}
                      size={size}
                      decoName={deco?.name}
                      decoSlot={deco?.slot}
                      slotImageSrc={getDecorationSlotImagePath(size, isWeaponSlot ? "weapon" : "armor")}
                      decoImageSrc={deco ? getDecorationImagePath(deco.slot) : undefined}
                      decoImageFilter={deco ? getDecorationColorFilterStyle(deco.icon?.color, deco.icon?.colorId) : undefined}
                      onOpen={() => onOpenDeco(s.key, idx, size)}
                      onClear={() => onClearDeco(s.key, idx)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

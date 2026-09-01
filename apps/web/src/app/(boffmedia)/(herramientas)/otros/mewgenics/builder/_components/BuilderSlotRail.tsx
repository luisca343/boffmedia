"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { mewCatSvgUrl } from "@/components/boffmedia/ui/mewgenics/cat"
import { mewArtSrc } from "@/components/boffmedia/ui/mewgenics/mew-art"
import type { MewRec } from "@/components/boffmedia/ui/mewgenics"
import {
  EQUIP_SLOTS,
  PART_CLIPS,
  PART_SLOTS,
  slotFrame,
  type BuilderState,
  type DrawerTarget,
  type EquipSlot,
  type PartSlot,
} from "./builder-state"
import { equippedItem } from "./useBuilderItems"

/**
 * The paper-doll rail: every slot the builder can edit, each showing the art it
 * is currently wearing. It replaces the old four tabs — those hid nine of the
 * ten parts behind a switcher, so the answer to "what is this cat made of" took
 * ten clicks. Here it is the navigation AND the summary, and it fills the right
 * side of a screen that was empty.
 */
export function BuilderSlotRail({
  state,
  equipItems,
  presetName,
  open,
  onOpen,
}: {
  state: BuilderState
  equipItems: Record<EquipSlot, MewRec[]>
  presetName: string | null
  open: DrawerTarget | null
  onOpen: (target: DrawerTarget) => void
}) {
  const t = useTranslations("mewgenics")

  const isOpen = (target: DrawerTarget) =>
    open?.kind === target.kind &&
    (target.kind === "part" || target.kind === "equip"
      ? (open as { slot?: string }).slot === target.slot
      : true)

  return (
    <div className="flex min-h-0 flex-col gap-3 pr-0.5 xl:flex-1 xl:overflow-y-auto">
      <RailSection title={t("builder.partsTitle")} count={PART_SLOTS.length}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-1.5">
          {PART_SLOTS.map((slot) => (
            <SlotCard
              key={slot}
              label={t(`builder.parts.${slot}`)}
              caption={`#${slotFrame(state.parts, slot)}`}
              art={mewCatSvgUrl(PART_CLIPS[slot].clipName, slotFrame(state.parts, slot))}
              active={isOpen({ kind: "part", slot })}
              onClick={() => onOpen({ kind: "part", slot })}
            />
          ))}
        </div>
      </RailSection>

      <RailSection title={t("builder.equipment")} count={EQUIP_SLOTS.length}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-1.5">
          {EQUIP_SLOTS.map((slot) => {
            const item = equippedItem(equipItems, slot, state.equipment[slot])
            return (
              <SlotCard
                key={slot}
                label={t(`builder.equip${slot.charAt(0).toUpperCase()}${slot.slice(1)}`)}
                caption={item ? String(item.name || item.id) : t("builder.none")}
                art={item ? mewArtSrc("items", item) : null}
                dim={!item}
                active={isOpen({ kind: "equip", slot })}
                onClick={() => onOpen({ kind: "equip", slot })}
              />
            )
          })}
        </div>
      </RailSection>

      <RailSection title={t("builder.presets")}>
        <button
          type="button"
          onClick={() => onOpen({ kind: "presets" })}
          className={`flex w-full items-center gap-2 border-2 border-solid px-2.5 py-2 text-left [border-radius:var(--wob-sm)] transition-all ${
            isOpen({ kind: "presets" })
              ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-night-2)]"
              : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-night-2)]"
          }`}
        >
          <Icon name="paw" size={15} className="flex-none text-[color:var(--mwp-pink)]" />
          <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-[color:var(--mwp-cream)]">
            {presetName ?? t("builder.presetCustom")}
          </span>
          <Icon name="chevronRight" size={13} className="flex-none text-[color:var(--mwp-cream-dim)]" />
        </button>
      </RailSection>
    </div>
  )
}

function RailSection({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2 border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-2)] p-2.5 [border-radius:var(--wob-sm)]">
      <h2 className="m-0 flex items-baseline gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--mwp-cream-dim)]">
        {title}
        {count != null && <span className="font-mono text-[10px] opacity-70">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

function SlotCard({
  label,
  caption,
  art,
  active,
  dim,
  onClick,
}: {
  label: string
  caption: string
  art: string | null
  active: boolean
  dim?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label} · ${caption}`}
      className={`flex flex-col items-center gap-1 border-2 border-solid p-1.5 transition-all [border-radius:var(--wob-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] ${
        active
          ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-night-3)] [box-shadow:0_0_0_2px_var(--mwp-red-deep)]"
          : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-night-3)]"
      }`}
    >
      <span
        className={`block h-[46px] w-full rounded-[6px] bg-[color:var(--mwp-night-3)] ${dim ? "opacity-45" : ""}`}
        style={
          art
            ? {
                backgroundImage: `url("${art}")`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
      <span className="w-full truncate text-center text-[10px] font-bold uppercase tracking-[0.04em] text-[color:var(--mwp-cream)]">
        {label}
      </span>
      <span className="w-full truncate text-center font-mono text-[9px] text-[color:var(--mwp-cream-dim)]">
        {caption}
      </span>
    </button>
  )
}

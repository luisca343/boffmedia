"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { TogglePill, PillRow } from "./ui"
import { ATK_COLOR, DEF_COLOR } from "./ui/theme"
import type { CalcField, SideConditions } from "../_types/calculator"

const WEATHERS = ["Sun", "Rain", "Sand", "Snow"] as const
const WEATHER_TONE: Record<string, string | undefined> = {
  Rain: "var(--info)", Snow: "var(--info)", Sun: "var(--warn)", Sand: undefined,
}
const TERRAINS = ["Electric", "Grassy", "Psychic", "Misty"] as const
const TERRAIN_TONE: Record<string, string> = {
  Grassy: "var(--ok)", Electric: "var(--warn)", Psychic: "var(--info)", Misty: "var(--info)",
}

function FieldSection({ title, divider, children }: { title: string; divider?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid gap-[7px]",
        divider && "border-t border-dashed border-line pt-3 max-[1280px]:border-t-0 max-[1280px]:pt-0",
      )}
    >
      <span className="font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">{title}</span>
      <PillRow>{children}</PillRow>
    </div>
  )
}

interface Props {
  field: CalcField
  setField: (patch: Partial<CalcField>) => void
  setAtkSide: (patch: Partial<SideConditions>) => void
  setDefSide: (patch: Partial<SideConditions>) => void
}

// field / weather / terrain / conditions + per-side screens.
export function FieldPanel({ field, setField, setAtkSide, setDefSide }: Props) {
  const t = useTranslations("vgc.calc.field")

  const sideBlock = (label: string, side: SideConditions, upd: (p: Partial<SideConditions>) => void, tone: string, divider: boolean) => (
    <FieldSection title={label} divider={divider}>
      <TogglePill on={side.helpingHand} label={t("pill.Helping Hand")} tone={tone} onClick={() => upd({ helpingHand: !side.helpingHand })} />
      <TogglePill on={side.tailwind} label={t("pill.Tailwind")} tone={tone} onClick={() => upd({ tailwind: !side.tailwind })} />
      <TogglePill on={side.reflect} label={t("pill.Reflect")} tone="var(--info)" onClick={() => upd({ reflect: !side.reflect })} />
      <TogglePill on={side.lightScreen} label={t("pill.Light Screen")} tone="var(--info)" onClick={() => upd({ lightScreen: !side.lightScreen })} />
      <TogglePill on={side.auroraVeil} label={t("pill.Aurora Veil")} tone="var(--info)" onClick={() => upd({ auroraVeil: !side.auroraVeil })} />
      <TogglePill on={side.stealthRock} label={t("pill.Stealth Rock")} tone="var(--warn)" onClick={() => upd({ stealthRock: !side.stealthRock })} />
    </FieldSection>
  )

  return (
    <div className="grid content-start gap-[14px] border border-solid border-line bg-panel p-4 max-[1280px]:grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
      <div className="flex items-center gap-2 font-display text-[15px]/none font-bold uppercase tracking-[0.05em] max-[1280px]:col-span-full">
        <Icon name="zap" size={16} className="text-accent" />
        {t("title")}
      </div>

      <FieldSection title={t("format")}>
        <TogglePill on={field.format === "Doubles"} label={t("doubles")} onClick={() => setField({ format: "Doubles" })} />
        <TogglePill on={field.format === "Singles"} label={t("singles")} onClick={() => setField({ format: "Singles" })} />
      </FieldSection>

      <FieldSection title={t("weather")} divider>
        {WEATHERS.map((w) => (
          <TogglePill
            key={w}
            on={field.weather === w}
            label={t(`weathers.${w}`)}
            tone={WEATHER_TONE[w]}
            onClick={() => setField({ weather: field.weather === w ? "None" : w })}
          />
        ))}
      </FieldSection>

      <FieldSection title={t("terrain")} divider>
        {TERRAINS.map((tr) => (
          <TogglePill
            key={tr}
            on={field.terrain === tr}
            label={t(`terrains.${tr}`)}
            tone={TERRAIN_TONE[tr]}
            onClick={() => setField({ terrain: field.terrain === tr ? "None" : tr })}
          />
        ))}
      </FieldSection>

      <FieldSection title={t("conditions")} divider>
        <TogglePill on={field.trickRoom} label={t("pill.Trick Room")} tone="var(--info)" onClick={() => setField({ trickRoom: !field.trickRoom })} />
        <TogglePill on={field.gravity} label={t("pill.Gravity")} tone="var(--info)" onClick={() => setField({ gravity: !field.gravity })} />
        <TogglePill on={field.wonderRoom} label={t("pill.Wonder Room")} tone="var(--info)" onClick={() => setField({ wonderRoom: !field.wonderRoom })} />
      </FieldSection>

      {sideBlock(t("attackerSide"), field.attackerSide, setAtkSide, ATK_COLOR, true)}
      {sideBlock(t("defenderSide"), field.defenderSide, setDefSide, DEF_COLOR, true)}
    </div>
  )
}

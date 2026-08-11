"use client"

import { useTranslations } from "next-intl"
import { Icon, type IconName } from "@boffmedia/ui"
import { cn } from "@/lib/utils"

const TYPES: { value: string; icon: IconName; key: "event" | "server" }[] = [
  { value: "EVENT", icon: "trophy", key: "event" },
  { value: "SERVER", icon: "globe", key: "server" },
]

interface TypeCardsProps {
  value: string
  onChange: (value: string) => void
}

export function TypeCards({ value, onChange }: TypeCardsProps) {
  const t = useTranslations("sugerir.type")
  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">
        {t("label")}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TYPES.map((ty) => {
          const active = value === ty.value
          return (
            <button
              key={ty.value}
              type="button"
              onClick={() => onChange(ty.value)}
              aria-pressed={active}
              className={cn(
                "cut-corner cut-corner-edge [--cut-lg:14px] flex items-center gap-4 border border-solid p-4 text-left",
                "transition-[border-color,background] duration-[140ms]",
                active
                  ? "border-accent [--cut-line:var(--accent)] bg-accent-soft"
                  : "border-line [--cut-line:var(--line)] bg-panel hover:border-accent-line hover:[--cut-line:var(--accent-line)]",
              )}
            >
              <span
                className={cn(
                  "cut cut-edge-slant [--cut:7px] grid h-11 w-11 shrink-0 place-items-center border border-solid",
                  active ? "border-accent [--cut-line:var(--accent)] text-accent-bright" : "border-line-2 [--cut-line:var(--line-2)] text-txt-muted",
                )}
              >
                <Icon name={ty.icon} size={20} />
              </span>
              <span className="grid gap-1">
                <span className="font-display text-[15px] font-bold not-italic uppercase tracking-[0.02em] text-txt">
                  {t(`${ty.key}.label`)}
                </span>
                <span className="font-body text-[13px]/[1.35] text-txt-muted">{t(`${ty.key}.desc`)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

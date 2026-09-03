"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { WpRarity } from "../_types/market.types"
import { fmt } from "../_utils/format"
import { RARITY_LABEL_KEY, RARITY_TEXT } from "../_utils/rarity"
import { ALL_TYPES, typeColor } from "../_utils/typeColors"
import { useFeedFilters } from "../_stores/filterStore"
import { Button, Checkbox, Icon, Range, Toggle } from "./ui"

const RARITIES: WpRarity[] = ["comun", "raro", "epico", "legendario"]

/** The discovery rail. Only ever mounted on the feed — the other views have no grid. */
export function FilterRail() {
  const t = useTranslations("wigglypop")
  const f = useFeedFilters()
  const dirty =
    f.types.length > 0 ||
    f.rarities.length > 0 ||
    f.shinyOnly ||
    f.legendaryOnly ||
    f.perfectOnly

  return (
    <aside className="wp-noscroll w-[16.875rem] flex-none overflow-y-auto border-r border-wp-line/24 bg-white/50 px-4 py-[1.125rem]">
      <Section title={t("filters.sectionRarity")}>
        {RARITIES.map((r) => (
          <Checkbox
            key={r}
            on={f.rarities.includes(r)}
            onChange={() => f.toggleRarity(r)}
          >
            <span className={cn("text-[0.78125rem] font-black uppercase tracking-[.04em]", RARITY_TEXT[r])}>
              {t(RARITY_LABEL_KEY[r])}
            </span>
          </Checkbox>
        ))}
      </Section>

      <Section title={t("filters.sectionSpecial")}>
        <SwitchRow
          label={t("filters.shinyOnly")}
          on={f.shinyOnly}
          onChange={f.setShinyOnly}
          icon={<Icon name="sparkles" size={15} className="text-wp-teal" />}
        />
        <SwitchRow
          label={t("filters.legendaryOnly")}
          on={f.legendaryOnly}
          onChange={f.setLegendaryOnly}
          icon={<Icon name="crown" size={15} filled className="text-wp-gold" />}
        />
        <SwitchRow
          label={t("filters.perfectIv")}
          on={f.perfectOnly}
          onChange={f.setPerfectOnly}
          icon={<Icon name="badgeCheck" size={15} className="text-wp-green" />}
        />
      </Section>

      <Section title={t("filters.sectionMaxPrice")}>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-wp text-[0.8125rem] font-semibold text-wp-fg-muted">{t("filters.upTo")}</span>
          <span className="wp-num font-wp text-[0.84375rem] text-wp-accent">₽{fmt(f.priceMax)}</span>
        </div>
        <Range
          min={500}
          max={60000}
          step={500}
          value={f.priceMax}
          aria-label={t("filters.sectionMaxPrice")}
          onChange={(e) => f.setPriceMax(Number(e.target.value))}
        />
      </Section>

      <Section title={t("filters.sectionType")}>
        <div className="grid grid-cols-3 gap-[0.3125rem]">
          {ALL_TYPES.map((t) => {
            const on = f.types.includes(t)
            const { c } = typeColor(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => f.toggleType(t)}
                aria-pressed={on}
                className={cn(
                  "rounded-wp-pill border-wp border-transparent py-1.5 text-center",
                  "font-wp text-[0.65625rem] font-extrabold capitalize transition-all duration-100",
                  on ? "opacity-100 shadow-[inset_0_0_0_1.5px_currentColor]" : "opacity-60 hover:opacity-90",
                )}
                // Data-driven, so inline style — `bg-${type}` never compiles.
                style={{ color: c, background: on ? `${c}22` : "transparent" }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </Section>

      {dirty && (
        <Button
          variant="ghost"
          className="mt-[1.125rem] w-full text-wp-rose hover:bg-wp-rose/10 hover:text-wp-rose"
          onClick={f.clear}
        >
          <Icon name="filterX" size={14} />
          {t("filters.clearButton")}
        </Button>
      )}
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-[1.375rem] border-t border-wp-line/24 pt-5 first:mt-0 first:border-t-0 first:pt-0">
      <h4 className="mb-2.5 font-wp text-[0.6875rem] font-black uppercase tracking-[.1em] text-wp-fg-subtle">
        {title}
      </h4>
      {children}
    </div>
  )
}

function SwitchRow({
  label,
  on,
  onChange,
  icon,
}: {
  label: string
  on: boolean
  onChange: (next: boolean) => void
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors hover:bg-wp-panel-2">
      <span className="flex items-center gap-[0.4375rem] font-wp text-[0.84375rem] font-bold text-wp-fg-muted">
        {icon}
        {label}
      </span>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
  )
}

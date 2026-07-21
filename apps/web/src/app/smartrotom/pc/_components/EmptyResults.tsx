"use client"

import { useTranslations } from "next-intl"
import { Button, Icon } from "./ui"

/** No Pokémon matched. The only way out is to relax the filters, so that is the button. */
export function EmptyResults({ onClear }: { onClear: () => void }) {
  const t = useTranslations("pc")
  return (
    <div className="animate-pc-pop px-6 py-10 text-center motion-reduce:animate-none">
      <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[20px] border border-pc-line bg-white/[.04]">
        <Icon name="search" size={32} className="text-pc-fg-subtle" />
      </div>
      <h3 className="mb-1.5 font-pc-display text-lg font-bold text-pc-fg">{t("empty.noResults")}</h3>
      <p className="mx-auto mb-4 max-w-[280px] font-pc text-[13.5px] text-pc-fg-muted">
        {t("empty.noResultsBody")}
      </p>
      <div className="flex justify-center">
        <Button variant="primary" onClick={onClear}>
          <Icon name="x" size={14} />
          {t("common.clear")}
        </Button>
      </div>
    </div>
  )
}

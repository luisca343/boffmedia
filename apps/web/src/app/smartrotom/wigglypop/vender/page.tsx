"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { SellItem } from "../_components/sell/SellItem"
import { SellMon } from "../_components/sell/SellMon"
import { Seg } from "../_components/ui"

type Kind = "mon" | "item"

/**
 * Vender. A thin orchestrator over the two listing flows.
 *
 * There is no "Lote" tab. The backend supports bundles, but a composer that stakes
 * several Pokémon at once is a much bigger commitment surface than a single sale, and
 * half of it is not worth shipping. Registered in `docs/smartrotom/deferred/`.
 */
export default function SellPage() {
  const t = useTranslations("wigglypop")
  const [kind, setKind] = useState<Kind>("mon")

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-none flex-wrap items-center gap-4 border-b border-wp-line/24 px-[30px] py-[18px]">
        <div>
          <h1 className="font-wp-display text-[21px] font-semibold text-wp-fg">{t("sell.page.title")}</h1>
          <p className="mt-0.5 font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
            {kind === "mon"
              ? t("sell.page.subtitleMon")
              : t("sell.page.subtitleItem")}
          </p>
        </div>
        <Seg
          options={[
            { key: "mon", label: t("sell.page.tabMon"), icon: "grid" },
            { key: "item", label: t("sell.page.tabItem"), icon: "package" },
          ]}
          value={kind}
          onChange={(k) => setKind(k as Kind)}
        />
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto px-[30px] py-6">
        {kind === "mon" ? <SellMon /> : <SellItem />}
      </div>
    </div>
  )
}

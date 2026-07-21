"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import FullTypeChart from "./_components/FullTypeChart"
import TypeAnalysis from "./_components/TypeAnalysis"
import { ScreenShell } from "../_components/ScreenShell"
import { PageHead } from "../_components/PageHead"
import { LayersIcon, TableIcon, ScaleIcon } from "lucide-react"

export default function TiposPage() {
  const t = useTranslations("pokedex")
  const [view, setView] = useState<"chart" | "analysis">("chart")

  const toggle = (active: boolean) =>
    `px-3.5 py-2 rounded-[7px] text-[12.5px] font-medium inline-flex items-center gap-2 transition-colors ${
      active
        ? "bg-pk-primary-400/[0.14] text-pk-primary-200 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.3)]"
        : "text-pk-surface-400 hover:text-pk-surface-100 hover:bg-white/[0.04]"
    }`

  return (
    <ScreenShell>
      <PageHead
        icon={LayersIcon}
        eyebrow={t("tipos_eyebrow")}
        title={t("tipos_title")}
        desc={t("tipos_desc")}
        meta={
          <div className="flex gap-1 bg-white/[0.02] border border-white/[0.05] rounded-[10px] p-1">
            <button onClick={() => setView("chart")} aria-current={view === "chart" ? "page" : undefined} className={toggle(view === "chart")}>
              <TableIcon className="w-3.5 h-3.5" />
              {t("tipos_full_chart")}
            </button>
            <button onClick={() => setView("analysis")} aria-current={view === "analysis" ? "page" : undefined} className={toggle(view === "analysis")}>
              <ScaleIcon className="w-3.5 h-3.5" />
              {t("tipos_dual_analysis")}
            </button>
          </div>
        }
      />

      {view === "chart" ? <FullTypeChart /> : <TypeAnalysis />}
    </ScreenShell>
  )
}

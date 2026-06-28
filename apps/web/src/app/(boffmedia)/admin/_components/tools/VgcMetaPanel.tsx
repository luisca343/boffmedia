"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { VgcSmogonFetcher } from "./VgcSmogonFetcher"
import { VgcChampionsFetcher } from "./VgcChampionsFetcher"
import { VgcLimitlessFetcher } from "./VgcLimitlessFetcher"

type Tab = "smogon" | "champions" | "limitless"

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: "smogon",    label: "Smogon",    description: "Importa snapshots de stats.txt + moveset.txt" },
  { id: "champions", label: "Champions", description: "Importa CSV de VGCPastes (Google Sheets)" },
  { id: "limitless", label: "Limitless", description: "Importa torneos de Limitless TCG" },
]

export function VgcMetaPanel() {
  const [tab, setTab] = useState<Tab>("smogon")

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-xl border border-edge-strong bg-layer-2 p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === id
                  ? "bg-[color-mix(in_srgb,var(--orange-500)_20%,transparent)] text-[var(--orange-500)] border border-[color-mix(in_srgb,var(--orange-500)_20%,transparent)]"
                  : "text-ink-muted hover:text-ink hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-ink-dim hidden sm:block">
          {TABS.find((t) => t.id === tab)?.description}
        </span>
      </div>

      {tab === "smogon"    && <VgcSmogonFetcher />}
      {tab === "champions" && <VgcChampionsFetcher />}
      {tab === "limitless" && <VgcLimitlessFetcher />}
    </div>
  )
}

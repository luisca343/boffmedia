"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { VgcSmogonFetcher } from "./VgcSmogonFetcher";
import { VgcChampionsFetcher } from "./VgcChampionsFetcher";
import { VgcLimitlessFetcher } from "./VgcLimitlessFetcher";

type Tab = "smogon" | "champions" | "limitless";

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: "smogon",    label: "Smogon",    description: "Importa snapshots de stats.txt + moveset.txt" },
  { id: "champions", label: "Champions", description: "Importa CSV de VGCPastes (Google Sheets)" },
  { id: "limitless", label: "Limitless", description: "Importa torneos de Limitless TCG" },
];

export function VgcMetaPanel() {
  const [tab, setTab] = useState<Tab>("smogon");

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-xl border border-surface-700/80 bg-surface-800/70 p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === id
                  ? "bg-primary-500/20 text-primary-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
                  : "text-surface-400 hover:text-surface-100 hover:bg-surface-700/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-surface-500 hidden sm:block">
          {TABS.find((t) => t.id === tab)?.description}
        </span>
      </div>

      {/* Panel content */}
      {tab === "smogon"    && <VgcSmogonFetcher />}
      {tab === "champions" && <VgcChampionsFetcher />}
      {tab === "limitless" && <VgcLimitlessFetcher />}
    </div>
  );
}

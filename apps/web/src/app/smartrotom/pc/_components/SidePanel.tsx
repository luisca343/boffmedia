"use client"

import { useState } from "react"
import { BattleTeamsPanel } from "./BattleTeamsPanel"
import { CollectionProgress } from "./CollectionProgress"
import { TeamPanel } from "./TeamPanel"
import { Button, Icon, Panel, type IconName } from "./ui"

type Tab = "team" | "battle"

const TABS: Array<{ id: Tab; label: string; icon: IconName }> = [
  { id: "team", label: "Equipo", icon: "users" },
  { id: "battle", label: "Batalla", icon: "sword" },
]

export interface SidePanelProps {
  onOpenLivingDex: () => void
}

/** The 300px right rail: what you own, and what is currently fighting for you. */
export function SidePanel({ onOpenLivingDex }: SidePanelProps) {
  const [tab, setTab] = useState<Tab>("team")

  return (
    <Panel className="flex w-[300px] flex-none flex-col overflow-hidden">
      <CollectionProgress onOpenLivingDex={onOpenLivingDex} />

      <div role="tablist" aria-label="Equipos" className="flex flex-none gap-1.5 p-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            variant="ghost"
            active={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 justify-center ${tab === t.id ? "" : "text-pc-fg-muted"}`}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1">{tab === "team" ? <TeamPanel /> : <BattleTeamsPanel />}</div>
    </Panel>
  )
}

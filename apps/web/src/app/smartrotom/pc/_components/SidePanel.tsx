"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { BattleTeamsPanel } from "./BattleTeamsPanel"
import { CollectionProgress } from "./CollectionProgress"
import { TeamPanel } from "./TeamPanel"
import { Button, Icon, Panel, type IconName } from "./ui"

type Tab = "team" | "battle"

const TABS: Array<{ id: Tab; label: string; icon: IconName }> = [
  { id: "team", label: "team.title", icon: "users" },
  { id: "battle", label: "team.battle", icon: "sword" },
]

export interface SidePanelProps {
  onOpenLivingDex: () => void
}

/** The 300px right rail: what you own, and what is currently fighting for you. */
export function SidePanel({ onOpenLivingDex }: SidePanelProps) {
  const t = useTranslations("pc")
  const [tab, setTab] = useState<Tab>("team")

  return (
    <Panel className="flex w-[18.75rem] flex-none flex-col overflow-hidden">
      <CollectionProgress onOpenLivingDex={onOpenLivingDex} />

      <div role="tablist" aria-label={t("team.title")} className="flex flex-none gap-1.5 p-2">
        {TABS.map((tabItem) => (
          <Button
            key={tabItem.id}
            role="tab"
            aria-selected={tab === tabItem.id}
            variant="ghost"
            active={tab === tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex-1 justify-center ${tab === tabItem.id ? "" : "text-pc-fg-muted"}`}
          >
            <Icon name={tabItem.icon} size={14} />
            {t(tabItem.label)}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1">{tab === "team" ? <TeamPanel /> : <BattleTeamsPanel />}</div>
    </Panel>
  )
}

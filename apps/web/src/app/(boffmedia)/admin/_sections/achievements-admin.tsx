"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { AdminCrud } from "../_components/ui/av-crud"
import { AvSectionHead, AvPill } from "../_components/ui/av-kit"
import { useGetAchievements } from "@/hooks/events/useGetAchievements"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { AchievementForm } from "./forms/AchievementForm"
import type { EventAchievement as Achievement } from "@boffmedia/shared"

function useAchievementsList() {
  const { achievements, error, isLoading, refetch } = useGetAchievements()
  return { data: achievements as Achievement[] | undefined, error, isLoading, refetch }
}

const RARITY: Record<string, string> = {
  bronze: "text-amber-300 border-amber-700/50 bg-amber-700/20",
  silver: "text-slate-300 border-slate-400/40 bg-slate-400/15",
  gold: "text-yellow-300 border-yellow-500/40 bg-yellow-500/15",
  platinum: "text-cyan-300 border-cyan-500/40 bg-cyan-500/15",
  diamond: "text-sky-300 border-sky-500/40 bg-sky-500/15",
}

export function AchievementsAdmin() {
  const t = useTranslations("admin.achievements")
  return (
    <div>
      <AvSectionHead title={t("title")} desc={t("desc")} />
      <AdminCrud<Achievement>
        useList={useAchievementsList}
        FormComponent={AchievementForm}
        onCreate={async (data: any) => {
          const { id, eventId, ...createData } = data
          await EventsService.createAchievement(eventId, createData)
        }}
        onUpdate={async (id, data: any) => {
          const { id: _id, eventId, ...updateData } = data
          await EventsService.updateAchievement(eventId, Number(id), updateData)
        }}
        onDelete={async () => {
          /* achievement deletion endpoint not wired — see admin roadmap */
        }}
        searchFields={["name", "description"]}
        entityName={{ singular: t("singular"), plural: t("plural") }}
        columns={[
          { key: "name", label: t("colAchievement"), render: (a) => (
            <div className="flex items-center gap-3">
              <div className="cut-seal [--cut:7px] w-9 h-9 bg-accent-soft border border-solid border-accent-line flex items-center justify-center shrink-0">
                <Icon name="trophy" size={16} className="text-accent" />
              </div>
              <div className="min-w-0">
                <span className="font-medium">{a.name}</span>
                <p className="text-xs text-txt-dim font-mono">{a.eventName ?? t("eventFallback", { id: a.eventId })}</p>
              </div>
            </div>
          )},
          { key: "points", label: t("colPoints"), render: (a) => (
            <span className="text-sm font-mono text-txt-muted">{a.points}</span>
          )},
          { key: "rarity", label: t("colRarity"), render: (a) => (
            <AvPill tone="default" className={RARITY[a.rarity ?? ""]}>
              {a.rarity ?? "—"}
            </AvPill>
          )},
          { key: "category", label: t("colCategory"), render: (a) => (
            <span className="text-sm text-txt-muted capitalize">{a.category ?? "—"}</span>
          )},
        ]}
      />
    </div>
  )
}

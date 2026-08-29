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

const RARITY_TONE: Record<string, "amber" | "default" | "accent"> = {
  bronze: "amber",
  silver: "default",
  gold: "amber",
  platinum: "accent",
  diamond: "accent",
}

export function AchievementsAdmin() {
  const t = useTranslations("admin.achievements")
  return (
    <div>
      <AvSectionHead title={t("title")} desc={t("desc")} />
      <AdminCrud<Achievement>
        useList={useAchievementsList}
        FormComponent={AchievementForm}
        viewHref={() => "/logros"}
        onCreate={async (data: any) => {
          const { id, eventId, ...createData } = data
          await EventsService.createAchievement(eventId, createData)
        }}
        onUpdate={async (id, data: any) => {
          const { id: _id, eventId, ...updateData } = data
          await EventsService.updateAchievement(eventId, Number(id), updateData)
        }}
        searchFields={["name", "description"]}
        entityName={{ singular: t("singular"), plural: t("plural") }}
        columns={[
          { key: "name", label: t("colAchievement"), render: (a) => (
            <div className="flex items-center gap-3">
              <div className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:7px] w-9 h-9 bg-accent-soft border border-solid border-accent-line flex items-center justify-center shrink-0">
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
            <AvPill tone={RARITY_TONE[a.rarity ?? ""] ?? "default"}>
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

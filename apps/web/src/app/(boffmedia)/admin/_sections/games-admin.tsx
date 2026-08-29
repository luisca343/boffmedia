"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { AdminCrud } from "../_components/ui/av-crud"
import { AvSectionHead, formatAdminDate } from "../_components/ui/av-kit"
import { useGetGames } from "@/hooks/events/useGetGames"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { GameForm } from "./forms/GameForm"
import type { Game, CreateGameDto, UpdateGameDto } from "@boffmedia/shared"

function useGamesList() {
  const { games, error, isLoading, refetch } = useGetGames()
  return { data: games as Game[] | undefined, error, isLoading, refetch }
}

export function GamesAdmin() {
  const t = useTranslations("admin.games")
  return (
    <div>
      <AvSectionHead title={t("title")} desc={t("desc")} />
      <AdminCrud<Game>
        useList={useGamesList}
        FormComponent={GameForm}
        onCreate={async (data) => { await EventsService.createGame(data as CreateGameDto) }}
        onUpdate={async (id, data) => { await EventsService.updateGame(Number(id), data as UpdateGameDto) }}
        onDelete={async (id) => { await EventsService.deleteGame(Number(id)) }}
        searchFields={["title", "description"]}
        entityName={{ singular: t("singular"), plural: t("plural") }}
        viewHref={(g) => `/juegos/${g.id}`}
        columns={[
          { key: "title", label: t("colGame"), render: (g) => (
            <div className="flex items-center gap-3">
              <div className="cut-seal cut-seal-edge [--cut:7px] w-9 h-9 bg-panel-2 border border-solid border-line flex items-center justify-center shrink-0">
                {g.icon ? (
                  <img src={g.icon} alt={g.title} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="gamepad" size={16} className="text-txt-dim" />
                )}
              </div>
              <span className="font-medium">{g.title}</span>
            </div>
          )},
          { key: "description", label: t("colDescription"), render: (g) => (
            <p className="text-sm text-txt-muted truncate max-w-md">{g.description}</p>
          )},
          { key: "createdAt", label: t("colDate"), render: (g) => (
            <span className="text-sm text-txt-muted font-mono">{formatAdminDate(g.createdAt)}</span>
          )},
        ]}
      />
    </div>
  )
}

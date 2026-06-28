"use client"

import { Gamepad2 } from "lucide-react"
import { AdminCrud } from "@/components/boffmedia/ui/admin/admin-crud"
import { useGetGames } from "@/hooks/events/useGetGames"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { GameForm } from "./forms/GameForm"
import type { Game } from "@boffmedia/shared"

function useGamesList() {
  const { games, error, isLoading, refetch } = useGetGames()
  return { data: games as Game[] | undefined, error, isLoading, refetch }
}

export function GamesAdmin() {
  return (
    <AdminCrud<Game>
      title="Gestión de Juegos"
      icon={Gamepad2}
      description="Administra los juegos disponibles para eventos"
      useList={useGamesList}
      FormComponent={GameForm}
      onCreate={(data) => EventsService.createGame(data)}
      onUpdate={(id, data) => EventsService.updateGame(Number(id), data)}
      onDelete={(id) => EventsService.deleteGame(Number(id))}
      searchFields={["title", "description"]}
      entityName={{ singular: "juego", plural: "juegos" }}
      columns={[
        { key: "title", label: "Juego", render: (g) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-layer-2 border border-edge flex items-center justify-center overflow-hidden shrink-0">
              {g.icon ? (
                <img src={g.icon} alt={g.title} className="w-full h-full object-cover" />
              ) : (
                <Gamepad2 className="w-4 h-4 text-ink-dim" />
              )}
            </div>
            <span className="font-medium text-ink">{g.title}</span>
          </div>
        )},
        { key: "description", label: "Descripción", render: (g) => (
          <p className="text-sm text-ink-muted truncate max-w-md">{g.description}</p>
        )},
        { key: "createdAt", label: "Fecha", render: (g) => (
          <span className="text-sm text-ink-muted">{new Date(g.createdAt).toLocaleDateString()}</span>
        )},
      ]}
    />
  )
}

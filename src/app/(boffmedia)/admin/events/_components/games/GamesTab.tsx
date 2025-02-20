"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useGetGames } from "@/hooks/events/useGetGames"
import type { Game } from "@/types/events"
import { GameHeader } from "./GameHeader"
import { GamesList } from "./GamesList"
import { GameLoadingState } from "./GameLoadingState"
import { GameErrorState } from "./GameErrorState"
import { GameCreateDialog } from "./GameCreateDialog"
import { GameEditDialog } from "./GameEditDialog"
import { GameDeleteDialog } from "./GameDeleteDialog"

export function GamesTab() {
  const { games, isLoading, error, refetch } = useGetGames()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState(false)
  const [isOpenEditDialog, setIsOpenEditDialog] = useState(false)
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)

  useEffect(() => {
    if (games) {
      if (searchTerm) {
        setFilteredGames(
          games.filter(
            (game) =>
              game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              game.description.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
        )
      } else {
        setFilteredGames(games)
      }
    }
  }, [games, searchTerm])

  const handleCreateSuccess = () => {
    setIsOpenCreateDialog(false)
    refetch()
  }

  const handleEditSuccess = () => {
    setIsOpenEditDialog(false)
    refetch()
  }

  const handleDeleteSuccess = () => {
    setIsOpenDeleteDialog(false)
    refetch()
  }

  if (isLoading) return <GameLoadingState />
  if (error) return <GameErrorState error={error} onRetry={refetch} />

  return (
    <div>
      <Card className="bg-surface-800 border-surface-700 mb-6">
        <GameHeader
          totalGames={filteredGames.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateNew={() => setIsOpenCreateDialog(true)}
        />

        <GamesList
          games={filteredGames}
          onEdit={(game) => {
            setSelectedGame(game)
            setIsOpenEditDialog(true)
          }}
          onDelete={(game) => {
            setSelectedGame(game)
            setIsOpenDeleteDialog(true)
          }}
        />
      </Card>

      <GameCreateDialog
        open={isOpenCreateDialog}
        onOpenChange={setIsOpenCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {selectedGame && (
        <>
          <GameEditDialog
            open={isOpenEditDialog}
            onOpenChange={setIsOpenEditDialog}
            game={selectedGame}
            onSuccess={handleEditSuccess}
          />

          <GameDeleteDialog
            open={isOpenDeleteDialog}
            onOpenChange={setIsOpenDeleteDialog}
            game={selectedGame}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  )
}


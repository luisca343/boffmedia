"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Gamepad, Plus, Loader2, Edit, Calendar } from "lucide-react"
import { useGetGames } from "@/hooks/events/useGetGames"
import { eventsService } from "@/services/api/smartrotom/eventsService"
import type { CreateGameDto } from "@/types/dto/create-game.dto"
import type { Game } from "@/types/events"
import { useBoffSession } from "@/services/useBoffSession"
import Link from "next/link"

export default function ExploreGames() {
  const { games, isLoading, error, refetch } = useGetGames()
  const [newGame, setNewGame] = useState<CreateGameDto>({ title: "", description: "", icon: "" })
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { isBoffAdmin } = useBoffSession()

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      await eventsService.createGame(newGame)
      setNewGame({ title: "", description: "", icon: "" })
      setIsDialogOpen(false)
      refetch()
    } catch (error) {
      console.error("Error creating game:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGame) return

    setIsUpdating(true)
    try {
      await eventsService.updateGame(editingGame.id!, editingGame)
      setIsEditDialogOpen(false)
      refetch()
    } catch (error) {
      console.error("Error updating game:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const openEditDialog = (game: any) => {
    setEditingGame(game)
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-error-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-surface-50">Explorar Juegos</h1>
        {isBoffAdmin() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                <Plus className="mr-2 h-4 w-4" /> Añadir Juego
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-surface-800 text-surface-50">
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Juego</DialogTitle>
                <DialogDescription>
                  Introduce los detalles del nuevo juego aquí. Haz clic en guardar cuando hayas terminado.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <Input
                  placeholder="Título del juego"
                  value={newGame.title}
                  onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Textarea
                  placeholder="Descripción del juego"
                  value={newGame.description}
                  onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Input
                  placeholder="URL del icono"
                  value={newGame.icon}
                  onChange={(e) => setNewGame({ ...newGame, icon: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar Juego
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="bg-surface-800 border-surface-700">
            <CardHeader>
              <CardTitle className="text-surface-50">{game.title}</CardTitle>
              <CardDescription className="text-surface-400">{game.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                {game.icon ? (
                  <img
                    src={`/img/${game.icon}` || "/placeholder.svg"}
                    alt={game.title}
                    className="w-24 object-cover rounded"
                  />
                ) : (
                  <Gamepad className="w-24 h-24 text-surface-600" />
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Link href={`/games/${game.id}/events`}>
                <Button variant="secondary" size="sm">
                  <Calendar className="mr-2 h-4 w-4" /> Ver Eventos
                </Button>
              </Link>
              {isBoffAdmin() && (
                <Button variant="outline" size="sm" onClick={() => openEditDialog(game)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {isBoffAdmin() && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-surface-800 text-surface-50">
            <DialogHeader>
              <DialogTitle>Editar Juego</DialogTitle>
              <DialogDescription>
                Modifica los detalles del juego aquí. Haz clic en guardar cuando hayas terminado.
              </DialogDescription>
            </DialogHeader>
            {editingGame && (
              <form onSubmit={handleUpdateGame} className="space-y-4">
                <Input
                  placeholder="Título del juego"
                  value={editingGame.title}
                  onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Textarea
                  placeholder="Descripción del juego"
                  value={editingGame.description}
                  onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Input
                  placeholder="URL del icono"
                  value={editingGame.icon}
                  onChange={(e) => setEditingGame({ ...editingGame, icon: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar Cambios
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}


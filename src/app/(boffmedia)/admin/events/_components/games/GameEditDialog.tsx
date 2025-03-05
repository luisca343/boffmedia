"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { GameForm, type GameFormValues } from "./GameForm"
import type { Game } from "@/types/events"
import { eventsService } from "@/services/api/smartrotom/eventsService"

interface GameEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: Game
  onSuccess: () => void
}

export function GameEditDialog({ open, onOpenChange, game, onSuccess }: GameEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: GameFormValues) => {
    setIsSubmitting(true)
    try {
      await eventsService.updateGame(game.id!, {
        ...game,
        ...data,
      })
      toast.success(`El juego "${data.title}" ha sido actualizado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar actualizar el juego.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Juego</DialogTitle>
          <DialogDescription className="text-surface-300">
            Actualiza la información del juego seleccionado.
          </DialogDescription>
        </DialogHeader>

        <GameForm
          defaultValues={game}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Actualizando..." : "Guardar Cambios"}
        />
      </DialogContent>
    </Dialog>
  )
}


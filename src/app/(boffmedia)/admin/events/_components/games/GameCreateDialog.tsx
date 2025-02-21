"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { GameForm, type GameFormValues } from "./GameForm"
import { eventsService } from "@/services/api/smartrotom/eventsService"

interface GameCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function GameCreateDialog({ open, onOpenChange, onSuccess }: GameCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: GameFormValues) => {
    setIsSubmitting(true)
    try {
      await (await eventsService.createGame(data)).data
      toast.success(`El juego "${data.title}" ha sido creado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar crear el juego.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Crear Nuevo Juego</DialogTitle>
          <DialogDescription className="text-surface-300">
            Completa el formulario para añadir un nuevo juego al sistema.
          </DialogDescription>
        </DialogHeader>

        <GameForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Creando..." : "Crear Juego"}
        />
      </DialogContent>
    </Dialog>
  )
}


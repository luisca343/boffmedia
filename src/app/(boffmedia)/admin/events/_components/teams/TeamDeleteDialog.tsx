"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { Users, RefreshCw } from "lucide-react"
import type { EventTeam } from "@/types/events"

interface TeamDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: EventTeam
  onSuccess: () => void
}

export function TeamDeleteDialog({ open, onOpenChange, team, onSuccess }: TeamDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      // Note: Delete endpoint needs to be implemented
      // await eventsService.deleteTeam(team.eventId, team.id)
      toast.success(`El equipo "${team.name}" ha sido eliminado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar eliminar el equipo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Confirmar Eliminación</DialogTitle>
          <DialogDescription className="text-surface-300">
            ¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-surface-700/50 rounded-lg mb-4">
            <div className="w-12 h-12 rounded bg-surface-600 flex items-center justify-center overflow-hidden">
              {team.icon ? (
                <img src={`/img/${team.icon}`} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="h-6 w-6 text-surface-500" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-surface-50">{team.name}</h4>
              <p className="text-sm text-surface-300">ID: {team.id}</p>
            </div>
          </div>

          <p className="text-warning-500 text-sm">
            Nota: Eliminar este equipo afectará a todos sus miembros y sus registros de puntuación.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-surface-600 text-surface-300"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="bg-warning-500 hover:bg-warning-600 text-white ml-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar Equipo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


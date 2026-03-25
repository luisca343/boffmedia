"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/primitives/dialog"
import { Button } from "@/components/ui/primitives/button"
import { toast } from "react-toastify"
import { Award, RefreshCw } from "lucide-react"
import type { Achievement } from "@/types/events"

interface AchievementDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  achievement: Achievement
  onSuccess: () => void
}

export function AchievementDeleteDialog({ open, onOpenChange, achievement, onSuccess }: AchievementDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      // Note: Delete endpoint needs to be implemented
      // await eventsService.deleteAchievement(achievement.eventId, achievement.id)
      toast.success(`El logro "${achievement.name}" ha sido eliminado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar eliminar el logro.")
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
            ¿Estás seguro de que deseas eliminar este logro? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-surface-700/50 rounded-lg mb-4">
            <div className="w-12 h-12 rounded bg-surface-600 flex items-center justify-center overflow-hidden">
              {achievement.icon ? (
                <img src={achievement.icon} alt={achievement.name} className="w-full h-full object-cover" />
              ) : (
                <Award className="h-6 w-6 text-surface-500" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-surface-50">{achievement.name}</h4>
              <p className="text-sm text-surface-300">ID: {achievement.id}</p>
            </div>
          </div>

          <p className="text-warning-500 text-sm">
            Nota: Eliminar este logro afectará a todos los usuarios que lo hayan desbloqueado.
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
            variant="error"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="ml-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar Logro"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


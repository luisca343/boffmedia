"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { AchievementForm, type AchievementFormValues } from "./AchievementForm"
import type { Achievement } from "@/types/events"
import { eventsService } from "@/services/api/boffmedia/eventsService"

interface AchievementEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  achievement: Achievement
  onSuccess: () => void
}

export function AchievementEditDialog({ open, onOpenChange, achievement, onSuccess }: AchievementEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formDefaultValues = {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description || undefined,
    icon: achievement.icon || undefined,
    eventId: achievement.eventId,
    points: achievement.points,
  }

  const handleSubmit = async (data: AchievementFormValues) => {
    setIsSubmitting(true)
    try {
      await eventsService.updateAchievement(achievement.eventId, achievement.id!, data)
      toast.success(`El logro "${data.name}" ha sido actualizado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar actualizar el logro.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Logro</DialogTitle>
          <DialogDescription className="text-surface-300">
            Actualiza la información del logro seleccionado.
          </DialogDescription>
        </DialogHeader>

        <AchievementForm
          defaultValues={formDefaultValues}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Actualizando..." : "Guardar Cambios"}
        />
      </DialogContent>
    </Dialog>
  )
}


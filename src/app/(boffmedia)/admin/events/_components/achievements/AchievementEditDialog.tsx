"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { AchievementForm, type AchievementFormValues } from "./AchievementForm"
import type { Achievement } from "@/types/events"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { CreateAchievementDto } from "@/generated/api"

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
    description: achievement.description || "",
    icon: achievement.icon || "",
    eventId: achievement.eventId,
    points: achievement.points,
    maxProgress: achievement.maxProgress,
    itemType: achievement.itemType as CreateAchievementDto.itemType,
    category: achievement.category as CreateAchievementDto.category,
    rarity: achievement.rarity as CreateAchievementDto.rarity || undefined,
    order: achievement.order,
    active: 1, // Default to active for existing achievements
  }

  const handleSubmit = async (data: AchievementFormValues) => {
    setIsSubmitting(true)
    try {
      // Remove id and eventId from data for update
      const { id, eventId, ...updateData } = data
      
      await EventsService.updateAchievement(achievement.eventId, achievement.id!, updateData as any)
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


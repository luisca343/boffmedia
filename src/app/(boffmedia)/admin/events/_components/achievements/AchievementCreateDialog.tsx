"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { eventsService } from "@/services/api/smartrotom/eventsService"
import { AchievementForm, type AchievementFormValues } from "./AchievementForm"

interface AchievementCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultEventId?: number | null
}

export function AchievementCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultEventId,
}: AchievementCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: AchievementFormValues) => {
    setIsSubmitting(true)
    try {
      await (await eventsService.createAchievement(data.eventId, data)).data
      toast.success(`El logro "${data.name}" ha sido creado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar crear el logro.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Crear Nuevo Logro</DialogTitle>
          <DialogDescription className="text-surface-300">
            Completa el formulario para añadir un nuevo logro al sistema.
          </DialogDescription>
        </DialogHeader>

        <AchievementForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Creando..." : "Crear Logro"}
          defaultValues={defaultEventId ? { eventId: defaultEventId } : undefined}
        />
      </DialogContent>
    </Dialog>
  )
}


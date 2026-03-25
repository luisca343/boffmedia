"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog"
import { toast } from "react-toastify"
import { TeamForm, type TeamFormValues } from "./TeamForm"
import type { EventTeam } from "@/types/events"
import { EventsService } from "@/services/api/boffmedia/eventsService"

interface TeamEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: EventTeam
  onSuccess: () => void
}

export function TeamEditDialog({ open, onOpenChange, team, onSuccess }: TeamEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: TeamFormValues) => {
    setIsSubmitting(true)
    try {
      await EventsService.updateTeam(team.eventId, team.id!, data)
      toast.success(`El equipo "${data.name}" ha sido actualizado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar actualizar el equipo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Equipo</DialogTitle>
          <DialogDescription className="text-surface-300">
            Actualiza la información del equipo seleccionado.
          </DialogDescription>
        </DialogHeader>

        <TeamForm
          defaultValues={team}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Actualizando..." : "Guardar Cambios"}
        />
      </DialogContent>
    </Dialog>
  )
}


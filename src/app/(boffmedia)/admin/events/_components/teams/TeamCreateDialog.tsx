"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { eventsService } from "@/services/api/boffmedia/eventsService"
import { TeamForm, type TeamFormValues } from "./TeamForm"

interface TeamCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TeamCreateDialog({ open, onOpenChange, onSuccess }: TeamCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      await (await eventsService.createTeam(data.eventId, data!)).data
      toast.success(`El equipo "${data.name}" ha sido creado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar crear el equipo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Crear Nuevo Equipo</DialogTitle>
          <DialogDescription className="text-surface-300">
            Completa el formulario para añadir un nuevo equipo al sistema.
          </DialogDescription>
        </DialogHeader>

        <TeamForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Creando..." : "Crear Equipo"}
        />
      </DialogContent>
    </Dialog>
  )
}


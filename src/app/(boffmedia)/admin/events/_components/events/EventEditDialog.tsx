"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { EventForm, type EventFormValues } from "./EventForm"
import type { Event } from "@/types/events"
import { eventsService } from "@/services/api/smartrotom/eventsService"

interface EventEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event
  onSuccess: () => void
}

export function EventEditDialog({ open, onOpenChange, event, onSuccess }: EventEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDateForInput = (dateString: string) => {
    return dateString?.split('.')[0] || dateString?.split('T')[0] || ""
  }

  const formDefaultValues = {
    title: event.title,
    parentId: event.parentId,
    description: event.description || undefined,
    icon: event.icon || undefined,
    game: event.game,
    startDate: formatDateForInput(event.startDate),
    endDate: formatDateForInput(event.endDate),
    type: event.type,
    visibility: event.visibility,
  }
  
  const handleSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true)
    try {
      await eventsService.updateEvent(event.id!, data)
      toast.success(`El evento "${data.title}" ha sido actualizado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar actualizar el evento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Evento</DialogTitle>
          <DialogDescription className="text-surface-300">
            Actualiza la información del evento seleccionado.
          </DialogDescription>
        </DialogHeader>

        <EventForm
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


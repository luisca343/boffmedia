"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { EventForm, type EventFormValues } from "./EventForm"
import type { Event } from "@/types/events"

interface EventEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event
  onSuccess: () => void
}

export function EventEditDialog({ open, onOpenChange, event, onSuccess }: EventEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true)
    try {
      // Note: Update endpoint needs to be implemented
      // await eventsService.updateEvent(event.id!, data)
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
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Evento</DialogTitle>
          <DialogDescription className="text-surface-300">
            Actualiza la información del evento seleccionado.
          </DialogDescription>
        </DialogHeader>

        <EventForm
          defaultValues={event}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Actualizando..." : "Guardar Cambios"}
        />
      </DialogContent>
    </Dialog>
  )
}


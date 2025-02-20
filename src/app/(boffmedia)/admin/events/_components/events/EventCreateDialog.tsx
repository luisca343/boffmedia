"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { EventForm, type EventFormValues } from "./EventForm"
import { eventsService } from "@/services/api/smartrotom/eventsService"

interface EventCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EventCreateDialog({ open, onOpenChange, onSuccess }: EventCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true)
    try {
      await (await eventsService.createEvent(data)).data
      toast.success(`El evento "${data.title}" ha sido creado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar crear el evento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50">
        <DialogHeader>
          <DialogTitle className="text-xl">Crear Nuevo Evento</DialogTitle>
          <DialogDescription className="text-surface-300">
            Completa el formulario para añadir un nuevo evento al sistema.
          </DialogDescription>
        </DialogHeader>

        <EventForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Creando..." : "Crear Evento"}
        />
      </DialogContent>
    </Dialog>
  )
}

